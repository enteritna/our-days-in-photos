import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { NewPhotoInput, Photo, PhotoRepository } from "./types";

export const PHOTO_BUCKET = "love-photos";
const SIGNED_URL_TTL = 60 * 60 * 12; // 12 hours
const PAGE = 1000;

type Row = Tables<"photos">;

function extFor(blob: Blob, name: string): string {
  const fromName = /\.([a-z0-9]{2,5})$/i.exec(name)?.[1];
  if (fromName) return fromName.toLowerCase();
  const fromType = blob.type.split("/")[1];
  return (fromType || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
}

function readable(error: { message?: string } | null | undefined, fallback: string): Error {
  const msg = error?.message ?? "";
  if (/failed to fetch|network/i.test(msg)) return new Error("Mất kết nối mạng — chưa thể đồng bộ.");
  if (/exceeded|too large|payload/i.test(msg)) return new Error("Ảnh vượt quá giới hạn 20 MB.");
  if (/jwt|auth|permission|row-level/i.test(msg)) return new Error("Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.");
  return new Error(msg ? `${fallback} (${msg})` : fallback);
}

export class CloudPhotoRepository implements PhotoRepository {
  readonly kind = "cloud" as const;
  constructor(private userId: string) {}

  private toPhoto(row: Row, url: string): Photo {
    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      size: Number(row.size),
      mimeType: row.mime_type,
      createdAt: new Date(row.created_at).getTime(),
      url,
      source: "cloud",
      storagePath: row.storage_path,
    };
  }

  async list(): Promise<Photo[]> {
    const rows: Row[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw readable(error, "Không tải được danh sách ảnh trên đám mây");
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    if (!rows.length) return [];
    const urls = new Map<string, string>();
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200).map((r) => r.storage_path);
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(chunk, SIGNED_URL_TTL);
      if (error) throw readable(error, "Không mở được ảnh trên đám mây");
      data?.forEach((d) => d.path && d.signedUrl && urls.set(d.path, d.signedUrl));
    }
    return rows.filter((r) => urls.has(r.storage_path)).map((r) => this.toPhoto(r, urls.get(r.storage_path)!));
  }

  async add(input: NewPhotoInput): Promise<Photo> {
    const path = `${this.userId}/${crypto.randomUUID()}.${extFor(input.blob, input.name)}`;
    const up = await supabase.storage.from(PHOTO_BUCKET).upload(path, input.blob, {
      contentType: input.blob.type || "image/jpeg",
      upsert: false,
    });
    if (up.error) throw readable(up.error, "Tải ảnh lên đám mây thất bại");

    const { data, error } = await supabase
      .from("photos")
      .insert({
        user_id: this.userId,
        client_id: input.clientId,
        name: input.name,
        size: input.blob.size,
        mime_type: input.blob.type || "image/jpeg",
        storage_path: path,
        created_at: new Date(input.createdAt).toISOString(),
      })
      .select("*")
      .single();
    if (error || !data) {
      await supabase.storage.from(PHOTO_BUCKET).remove([path]);
      throw readable(error, "Không lưu được thông tin ảnh");
    }
    const signed = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
    if (signed.error || !signed.data) throw readable(signed.error, "Không mở được ảnh vừa tải lên");
    return this.toPhoto(data, signed.data.signedUrl);
  }

  async remove(photo: Photo): Promise<void> {
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) throw readable(error, "Không xóa được ảnh");
    if (photo.storagePath) {
      // Row is gone; a leftover file is invisible and harmless, so do not fail the delete on it.
      await supabase.storage.from(PHOTO_BUCKET).remove([photo.storagePath]);
    }
  }

  async getBlob(photo: Photo): Promise<Blob> {
    if (!photo.storagePath) throw new Error("Ảnh không có đường dẫn lưu trữ.");
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(photo.storagePath);
    if (error || !data) throw readable(error, "Không tải được ảnh từ đám mây");
    return data;
  }

  dispose() {}
}
