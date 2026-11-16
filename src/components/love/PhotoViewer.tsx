import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Download, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { MusicControl } from "@/hooks/use-music-track";
import { dayKey, fmtBytes } from "@/lib/format";
import type { Photo } from "@/lib/photo-store/types";
import { LoveCounter } from "./LoveCounter";
import { MonthCalendar } from "./MonthCalendar";
import { VideoPanel } from "./VideoPanel";

type Props = {
  photos: Photo[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onDelete: (p: Photo) => Promise<boolean>;
  getBlob: (p: Photo) => Promise<Blob>;
  music: MusicControl;
  onVideoStart: () => void;
};

export function PhotoViewer({ photos, index, onIndexChange, onClose, onDelete, getBlob, music, onVideoStart }: Props) {
  const photo = photos[index];
  const [asking, setAsking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setAsking(false), [index]);

  if (!photo) return null;
  const many = photos.length > 1;
  const step = (d: number) => many && onIndexChange((index + d + photos.length) % photos.length);

  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, video")) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await getBlob(photo);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = photo.name || "anh-ky-niem";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải xuống được ảnh.");
    } finally {
      setDownloading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const ok = await onDelete(photo);
    setDeleting(false);
    if (ok) setAsking(false);
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            closeRef.current?.focus();
          }}
          onEscapeKeyDown={(e) => {
            if (asking) {
              e.preventDefault();
              setAsking(false);
            }
          }}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-40 grid grid-cols-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-viewer text-foreground animate-in fade-in-0 min-[900px]:grid-cols-[minmax(0,1fr)_420px] min-[900px]:grid-rows-1"
        >
          <div
            aria-hidden="true"
            className="bg-viewer-glow pointer-events-none absolute -inset-[60px] z-0"
            style={{ backgroundImage: `url("${photo.url}")` }}
          />
          <div className="relative z-[1] grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto]">
            <div className="flex items-center justify-between gap-2 bg-overlay/40 px-4 py-3 sm:px-5">
              <div className="min-w-0 text-[13px]">
                <DialogPrimitive.Title className="truncate font-bold">{photo.name}</DialogPrimitive.Title>
                <span className="text-muted-foreground">
                  {index + 1}/{photos.length} · {dayKey(photo.createdAt)} · {fmtBytes(photo.size)}
                </span>
              </div>
              <DialogPrimitive.Close asChild>
                <Button ref={closeRef} variant="glass" size="pill">
                  <X /> Đóng
                </Button>
              </DialogPrimitive.Close>
            </div>

            <div className="relative flex min-h-0 items-center justify-center p-3 sm:p-5">
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.name}
                className="max-h-full max-w-full animate-rise-in rounded-[10px] border border-glass-border object-contain shadow-photo"
              />
              {many && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Ảnh trước"
                    className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-overlay text-foreground backdrop-blur-md transition hover:scale-105 sm:left-4"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Ảnh sau"
                    className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-overlay text-foreground backdrop-blur-md transition hover:scale-105 sm:right-4"
                  >
                    <ChevronRight className="size-6" />
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 bg-overlay/50 p-3" aria-live="polite">
              {asking ? (
                <>
                  <span className="font-medium">Xóa ảnh này?</span>
                  <Button variant="glass" size="pill" onClick={() => setAsking(false)} disabled={deleting} autoFocus>
                    Không
                  </Button>
                  <Button variant="danger" size="pill" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Xóa ảnh
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="sun" size="pill" onClick={download} disabled={downloading}>
                    {downloading ? <Loader2 className="animate-spin" /> : <Download />} Tải xuống
                  </Button>
                  <Button variant="glass" size="pill" onClick={() => setAsking(true)}>
                    <Trash2 /> Xóa ảnh
                  </Button>
                </>
              )}
            </div>
          </div>

          <aside
            aria-label="Tiện ích tình yêu"
            className="relative z-[1] flex max-h-[40dvh] min-h-0 flex-col gap-3.5 overflow-y-auto border-t border-glass-border bg-viewer-side px-4 py-4 backdrop-blur-xl min-[900px]:max-h-none min-[900px]:border-l min-[900px]:border-t-0 min-[900px]:px-5"
          >
            <VideoPanel music={music} onStart={onVideoStart} />
            <LoveCounter />
            <MonthCalendar />
          </aside>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
