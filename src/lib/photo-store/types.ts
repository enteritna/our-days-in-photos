export type PhotoSource = "local" | "cloud";

export type Photo = {
  /** Repository-specific id (IndexedDB key or cloud row id). */
  id: string;
  /** Stable id kept across backup/restore and local→cloud sync, used for de-duplication. */
  clientId: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: number;
  /** Display URL (object URL or signed URL). */
  url: string;
  source: PhotoSource;
  storagePath?: string;
};

export type NewPhotoInput = {
  blob: Blob;
  name: string;
  createdAt: number;
  clientId: string;
};

export interface PhotoRepository {
  readonly kind: PhotoSource;
  list(): Promise<Photo[]>;
  add(input: NewPhotoInput): Promise<Photo>;
  remove(photo: Photo): Promise<void>;
  getBlob(photo: Photo): Promise<Blob>;
  dispose(): void;
}

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function newClientId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
