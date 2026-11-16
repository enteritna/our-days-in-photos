/** Backup file format: JSON with images embedded as data URLs. */
export const BACKUP_FORMAT = "my-love-backup";
export const BACKUP_VERSION = 1;

export type BackupItem = {
  clientId: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: number;
  dataUrl: string;
};

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  photos: BackupItem[];
};

const DATA_URL_RE = /^data:(image\/[a-z0-9.+-]+);base64,/i;

export function buildBackup(items: BackupItem[], exportedAt: Date): BackupFile {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: exportedAt.toISOString(), photos: items };
}

/**
 * Validates a parsed backup. Accepts the My Love backup object and the legacy
 * array format from the original HTML (localStorage `my_love_photos_v16`).
 * Returns valid items and how many entries were skipped.
 */
export function parseBackup(data: unknown): { items: BackupItem[]; skipped: number } {
  let raw: unknown[];
  if (Array.isArray(data)) raw = data;
  else if (data && typeof data === "object" && (data as { format?: unknown }).format === BACKUP_FORMAT) {
    const photos = (data as { photos?: unknown }).photos;
    if (!Array.isArray(photos)) throw new Error("File sao lưu không có danh sách ảnh.");
    raw = photos;
  } else {
    throw new Error("Đây không phải file sao lưu My Love.");
  }
  const items: BackupItem[] = [];
  let skipped = 0;
  raw.forEach((entry, i) => {
    const e = entry as Record<string, unknown> | null;
    const dataUrl = e && typeof e.dataUrl === "string" ? e.dataUrl : "";
    const match = DATA_URL_RE.exec(dataUrl);
    if (!e || !match) {
      skipped++;
      return;
    }
    const createdAt = Number(e.createdAt);
    items.push({
      clientId: String(e.clientId ?? e.id ?? `restored_${i}_${createdAt || 0}`),
      name: typeof e.name === "string" && e.name ? e.name : "Ảnh kỷ niệm",
      size: Number(e.size) || 0,
      mimeType: typeof e.mimeType === "string" ? e.mimeType : match[1],
      createdAt: Number.isFinite(createdAt) && createdAt > 0 ? createdAt : Date.now(),
      dataUrl,
    });
  });
  return { items, skipped };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Không đọc được ảnh."));
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
