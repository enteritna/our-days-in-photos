import type { NewPhotoInput, Photo, PhotoRepository } from "./types";

/** Same database layout as the original HTML so existing on-device photos keep working. */
const DB_NAME = "my-love-db";
const DB_VERSION = 1;
const STORE = "photos";
const LEGACY_KEY = "my_love_photos_v16";

type LocalRecord = { id: string; name: string; size: number; createdAt: number; blob: Blob; type?: string };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Trình duyệt không hỗ trợ lưu ảnh trên thiết bị."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error("Không mở được kho ảnh trên thiết bị."));
    };
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    let result: T | undefined;
    if (req) req.onsuccess = () => (result = req.result);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error ?? new Error("Lỗi kho ảnh trên thiết bị."));
    t.onabort = () => reject(t.error ?? new Error("Thao tác với kho ảnh đã bị hủy."));
  });
}

function validRecord(r: unknown): r is LocalRecord {
  const p = r as LocalRecord;
  return !!p && typeof p.id === "string" && p.id.length > 0 && p.blob instanceof Blob && Number.isFinite(Number(p.createdAt));
}

/** One-time copy of the original HTML's localStorage data (kept as a safety copy). */
async function migrateLegacy(existingCount: number) {
  if (existingCount > 0) return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  let legacy: unknown;
  try {
    legacy = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(legacy)) return;
  for (let i = 0; i < legacy.length; i++) {
    const item = legacy[i] as { id?: unknown; name?: unknown; size?: unknown; createdAt?: unknown; dataUrl?: unknown };
    if (!item || typeof item.dataUrl !== "string" || !/^data:image\//i.test(item.dataUrl)) continue;
    try {
      const blob = await (await fetch(item.dataUrl)).blob();
      await tx("readwrite", (s) => s.put({
        id: String(item.id || `legacy_${Date.now()}_${i}`),
        name: String(item.name || "Ảnh kỷ niệm"),
        size: Number(item.size) || blob.size,
        createdAt: Number(item.createdAt) || Date.now(),
        blob,
      } satisfies LocalRecord));
    } catch {
      /* skip broken legacy entry; original data stays in localStorage */
    }
  }
}

export class LocalPhotoRepository implements PhotoRepository {
  readonly kind = "local" as const;
  private urls = new Map<string, string>();

  private toPhoto(r: LocalRecord): Photo {
    let url = this.urls.get(r.id);
    if (!url) {
      url = URL.createObjectURL(r.blob);
      this.urls.set(r.id, url);
    }
    return {
      id: r.id,
      clientId: r.id,
      name: r.name || "Ảnh kỷ niệm",
      size: Number(r.size) || r.blob.size,
      mimeType: r.blob.type || r.type || "image/jpeg",
      createdAt: Number(r.createdAt),
      url,
      source: "local",
    };
  }

  private async records(): Promise<LocalRecord[]> {
    const all = ((await tx<LocalRecord[]>("readonly", (s) => s.getAll() as IDBRequest<LocalRecord[]>)) ?? []).filter(validRecord);
    return all;
  }

  async list(): Promise<Photo[]> {
    let records = await this.records();
    if (records.length === 0) {
      await migrateLegacy(0);
      records = await this.records();
    }
    return records.map((r) => this.toPhoto(r));
  }

  async count(): Promise<number> {
    return (await this.records()).length;
  }

  async add(input: NewPhotoInput): Promise<Photo> {
    const record: LocalRecord = {
      id: input.clientId,
      name: input.name,
      size: input.blob.size,
      createdAt: input.createdAt,
      blob: input.blob,
      type: input.blob.type,
    };
    await tx("readwrite", (s) => s.put(record));
    return this.toPhoto(record);
  }

  async remove(photo: Photo): Promise<void> {
    await tx("readwrite", (s) => s.delete(photo.id));
    const url = this.urls.get(photo.id);
    if (url) URL.revokeObjectURL(url);
    this.urls.delete(photo.id);
  }

  async getBlob(photo: Photo): Promise<Blob> {
    const r = await tx<LocalRecord>("readonly", (s) => s.get(photo.id) as IDBRequest<LocalRecord>);
    if (!r?.blob) throw new Error("Không tìm thấy ảnh trên thiết bị.");
    return r.blob;
  }

  dispose() {
    this.urls.forEach((u) => URL.revokeObjectURL(u));
    this.urls.clear();
  }
}
