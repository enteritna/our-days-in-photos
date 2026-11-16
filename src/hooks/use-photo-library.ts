import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { sortNewestFirst } from "@/lib/format";
import { CloudPhotoRepository } from "@/lib/photo-store/cloud";
import { LocalPhotoRepository } from "@/lib/photo-store/local";
import { blobToDataUrl, buildBackup, dataUrlToBlob, parseBackup, type BackupItem } from "@/lib/photo-store/backup";
import { MAX_FILE_BYTES, newClientId, type Photo, type PhotoRepository } from "@/lib/photo-store/types";

export type SyncState =
  | { kind: "loading" }
  | { kind: "local" }
  | { kind: "syncing"; detail?: string }
  | { kind: "synced" }
  | { kind: "offline" }
  | { kind: "error"; message: string };

async function decodable(file: Blob): Promise<boolean> {
  if (typeof createImageBitmap !== "function") return true;
  try {
    const bmp = await createImageBitmap(file);
    bmp.close();
    return true;
  } catch {
    return false;
  }
}

export function usePhotoLibrary() {
  const { ready: authReady, user } = useAuth();
  const userId = user?.id ?? null;
  const repoRef = useRef<PhotoRepository | null>(null);
  const localRef = useRef<LocalPhotoRepository | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncState>({ kind: "loading" });
  const [pendingLocal, setPendingLocal] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const mode: "local" | "cloud" = userId ? "cloud" : "local";

  const settle = useCallback((kind: "local" | "cloud") => {
    if (kind === "local") setSync({ kind: "local" });
    else if (typeof navigator !== "undefined" && !navigator.onLine) setSync({ kind: "offline" });
    else setSync({ kind: "synced" });
  }, []);

  const load = useCallback(async () => {
    const repo = repoRef.current;
    if (!repo) return;
    setPhase("loading");
    setSync(repo.kind === "cloud" ? { kind: "syncing", detail: "Đang tải kho ảnh đám mây…" } : { kind: "loading" });
    try {
      const list = await repo.list();
      if (repoRef.current !== repo) return;
      setPhotos(sortNewestFirst(list));
      setPhase("ready");
      setLoadError(null);
      if (repo.kind === "cloud" && localRef.current) {
        setPendingLocal(await localRef.current.count().catch(() => 0));
      } else setPendingLocal(0);
      settle(repo.kind);
    } catch (e) {
      if (repoRef.current !== repo) return;
      const message = e instanceof Error ? e.message : "Không thể mở kho ảnh.";
      setPhase("error");
      setLoadError(message);
      setSync({ kind: "error", message });
    }
  }, [settle]);

  // Switch repository when the signed-in user changes.
  useEffect(() => {
    if (!authReady) return;
    localRef.current ??= new LocalPhotoRepository();
    const repo: PhotoRepository = userId ? new CloudPhotoRepository(userId) : localRef.current;
    repoRef.current = repo;
    setPhotos([]);
    void load();
    return () => {
      if (repo.kind === "cloud") repo.dispose();
    };
  }, [authReady, userId, load]);

  useEffect(() => () => localRef.current?.dispose(), []);

  useEffect(() => {
    const onOnline = () => repoRef.current?.kind === "cloud" && setSync({ kind: "synced" });
    const onOffline = () => repoRef.current?.kind === "cloud" && setSync({ kind: "offline" });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  /** Adds blobs to the active repository, skipping clientIds already present. */
  const addMany = useCallback(
    async (inputs: { blob: Blob; name: string; createdAt: number; clientId: string }[], verb: string) => {
      const repo = repoRef.current;
      if (!repo) return { added: 0, failed: inputs.length };
      let added = 0;
      let failed = 0;
      let lastError = "";
      for (let i = 0; i < inputs.length; i++) {
        const detail = `${verb} ${i + 1}/${inputs.length}…`;
        setBusy(detail);
        if (repo.kind === "cloud") setSync({ kind: "syncing", detail });
        try {
          const photo = await repo.add(inputs[i]);
          if (repoRef.current !== repo) break;
          added++;
          setPhotos((prev) => sortNewestFirst([...prev.filter((p) => p.id !== photo.id), photo]));
        } catch (e) {
          failed++;
          lastError = e instanceof Error ? e.message : "Lỗi không xác định";
        }
      }
      setBusy(null);
      if (failed && repo.kind === "cloud") setSync({ kind: "error", message: lastError });
      else settle(repo.kind);
      return { added, failed, lastError };
    },
    [settle],
  );

  const addFiles = useCallback(
    async (fileList: FileList | File[] | null | undefined) => {
      const files = Array.from(fileList ?? []);
      if (!files.length) return;
      const accepted = files.filter((f) => /^image\//i.test(f.type) && f.size <= MAX_FILE_BYTES);
      let rejected = files.length - accepted.length;
      const valid: File[] = [];
      for (const f of accepted) (await decodable(f)) ? valid.push(f) : rejected++;
      if (rejected) toast.warning(`${rejected} tệp bị bỏ qua (không phải ảnh hợp lệ hoặc vượt quá 20 MB).`);
      if (!valid.length) return;
      const now = Date.now();
      const { added, failed, lastError } = await addMany(
        valid.map((f, i) => ({ blob: f, name: f.name || "Ảnh kỷ niệm", createdAt: now + i, clientId: newClientId() })),
        "Đang lưu ảnh",
      );
      if (added) {
        toast.success(
          repoRef.current?.kind === "cloud"
            ? `Đã sao lưu ${added} ảnh lên đám mây.`
            : `Đã lưu ${added} ảnh trên thiết bị này (chưa sao lưu đám mây).`,
        );
      }
      if (failed) toast.error(`${failed} ảnh chưa lưu được: ${lastError}`);
    },
    [addMany],
  );

  const removePhoto = useCallback(
    async (photo: Photo) => {
      const repo = repoRef.current;
      if (!repo) return false;
      try {
        if (repo.kind === "cloud") setSync({ kind: "syncing", detail: "Đang xóa ảnh…" });
        await repo.remove(photo);
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
        settle(repo.kind);
        toast.success("Đã xóa ảnh.");
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Không thể xóa ảnh.";
        if (repo.kind === "cloud") setSync({ kind: "error", message });
        toast.error(`${message} Dữ liệu vẫn được giữ nguyên.`);
        return false;
      }
    },
    [settle],
  );

  const getBlob = useCallback(async (photo: Photo) => {
    const repo = repoRef.current;
    if (!repo) throw new Error("Kho ảnh chưa sẵn sàng.");
    return repo.getBlob(photo);
  }, []);

  const exportBackup = useCallback(async () => {
    const repo = repoRef.current;
    if (!repo) return;
    const list = photos.slice();
    const local = repo.kind === "cloud" && localRef.current ? await localRef.current.list().catch(() => []) : [];
    const all = [...list.map((p) => ({ p, r: repo as PhotoRepository })), ...local.map((p) => ({ p, r: localRef.current! as PhotoRepository }))];
    if (!all.length) {
      toast.info("Chưa có ảnh nào để sao lưu.");
      return;
    }
    const items: BackupItem[] = [];
    const seen = new Set<string>();
    try {
      for (let i = 0; i < all.length; i++) {
        const { p, r } = all[i];
        if (seen.has(p.clientId)) continue;
        seen.add(p.clientId);
        setBusy(`Đang chuẩn bị file sao lưu ${i + 1}/${all.length}…`);
        const blob = await r.getBlob(p);
        items.push({ clientId: p.clientId, name: p.name, size: blob.size, mimeType: blob.type || p.mimeType, createdAt: p.createdAt, dataUrl: await blobToDataUrl(blob) });
      }
      const now = new Date();
      const file = new Blob([JSON.stringify(buildBackup(items, now))], { type: "application/json" });
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-love-sao-luu-${now.toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast.success(`Đã xuất file sao lưu gồm ${items.length} ảnh.`);
    } catch (e) {
      toast.error(`Xuất file sao lưu thất bại: ${e instanceof Error ? e.message : "lỗi không xác định"}`);
    } finally {
      setBusy(null);
    }
  }, [photos]);

  const restoreBackup = useCallback(
    async (file: File) => {
      let parsed: ReturnType<typeof parseBackup>;
      try {
        parsed = parseBackup(JSON.parse(await file.text()));
      } catch (e) {
        toast.error(e instanceof SyntaxError ? "File không đúng định dạng JSON." : e instanceof Error ? e.message : "File sao lưu không hợp lệ.");
        return;
      }
      const existing = new Set(photos.map((p) => p.clientId));
      const fresh = parsed.items.filter((it) => !existing.has(it.clientId));
      const dup = parsed.items.length - fresh.length;
      if (!fresh.length) {
        toast.info(dup ? "Tất cả ảnh trong file đã có sẵn trong kho." : "File sao lưu không có ảnh hợp lệ.");
        return;
      }
      const inputs = [];
      for (const it of fresh) {
        try {
          inputs.push({ blob: await dataUrlToBlob(it.dataUrl), name: it.name, createdAt: it.createdAt, clientId: it.clientId });
        } catch {
          parsed.skipped++;
        }
      }
      const { added, failed, lastError } = await addMany(inputs, "Đang khôi phục ảnh");
      const parts = [`Đã khôi phục ${added} ảnh`];
      if (dup) parts.push(`${dup} ảnh đã có sẵn`);
      if (parsed.skipped) parts.push(`${parsed.skipped} mục lỗi bị bỏ qua`);
      (failed ? toast.error : toast.success)(parts.join(", ") + (failed ? `. ${failed} ảnh lỗi: ${lastError}` : "."));
    },
    [photos, addMany],
  );

  /** Uploads photos that only exist on this device, deleting each local copy only after its upload succeeded. */
  const syncLocalToCloud = useCallback(async () => {
    const repo = repoRef.current;
    const local = localRef.current;
    if (!repo || repo.kind !== "cloud" || !local) return;
    const localPhotos = await local.list();
    const existing = new Set(photos.map((p) => p.clientId));
    let uploaded = 0;
    let failed = 0;
    let lastError = "";
    for (let i = 0; i < localPhotos.length; i++) {
      const p = localPhotos[i];
      const detail = `Đang sao lưu ảnh trên thiết bị ${i + 1}/${localPhotos.length}…`;
      setBusy(detail);
      setSync({ kind: "syncing", detail });
      try {
        if (!existing.has(p.clientId)) {
          const blob = await local.getBlob(p);
          const added = await repo.add({ blob, name: p.name, createdAt: p.createdAt, clientId: p.clientId });
          setPhotos((prev) => sortNewestFirst([...prev, added]));
        }
        await local.remove(p);
        uploaded++;
      } catch (e) {
        failed++;
        lastError = e instanceof Error ? e.message : "lỗi không xác định";
      }
    }
    setBusy(null);
    setPendingLocal(await local.count().catch(() => 0));
    if (failed) {
      setSync({ kind: "error", message: lastError });
      toast.error(`${failed} ảnh chưa sao lưu được (vẫn giữ trên thiết bị): ${lastError}`);
    } else settle("cloud");
    if (uploaded) toast.success(`Đã sao lưu ${uploaded} ảnh từ thiết bị lên đám mây.`);
  }, [photos, settle]);

  return {
    mode,
    authReady,
    photos,
    phase,
    loadError,
    sync,
    pendingLocal,
    busy,
    reload: load,
    addFiles,
    removePhoto,
    getBlob,
    exportBackup,
    restoreBackup,
    syncLocalToCloud,
  };
}

export type PhotoLibrary = ReturnType<typeof usePhotoLibrary>;
