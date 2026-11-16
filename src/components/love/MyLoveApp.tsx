import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AlertTriangle, Cloud, Lock, Music2, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MusicControl } from "@/hooks/use-music-track";
import { usePhotoLibrary } from "@/hooks/use-photo-library";
import { groupByDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import loveBg from "@/assets/love-bg.jpg";
import { BackupDialog } from "./BackupDialog";
import { FilmShelf } from "./FilmShelf";
import { PhotoViewer } from "./PhotoViewer";
import { SyncBadge } from "./SyncBadge";
import { toast } from "sonner";

type Props = { music1: MusicControl; music2: MusicControl; onLock: () => void };

export function MyLoveApp({ music1, music2, onLock }: Props) {
  const library = usePhotoLibrary();
  const { photos, phase } = library;
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const resumeMusic1 = useRef(false);
  const lastReload = useRef(0);
  const [now, setNow] = useState(() => Date.now());

  // Refresh "Hôm nay" labels when the day changes.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const groups = useMemo(() => groupByDay(photos, now), [photos, now]);

  // Keep the viewer index valid after deletions.
  useEffect(() => {
    if (viewerIndex === null) return;
    if (photos.length === 0) setViewerIndex(null);
    else if (viewerIndex > photos.length - 1) setViewerIndex(photos.length - 1);
  }, [photos.length, viewerIndex]);

  const pick = () => fileRef.current?.click();

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void library.addFiles(e.dataTransfer?.files);
  };

  const onBrokenImage = useCallback(() => {
    // Signed links expire after a while; refresh them at most once a minute.
    if (library.mode !== "cloud" || Date.now() - lastReload.current < 60_000) return;
    lastReload.current = Date.now();
    void library.reload();
  }, [library]);

  const closeViewer = () => {
    setViewerIndex(null);
    music2.stop();
    if (resumeMusic1.current) {
      resumeMusic1.current = false;
      void music1.play();
    }
  };

  const onVideoStart = () => {
    if (music1.playing) {
      music1.pause();
      resumeMusic1.current = true;
    }
  };

  const toggleMusic = async () => {
    const wasPlaying = music1.playing;
    const ok = await music1.toggle();
    if (!wasPlaying && !ok) toast.error("Không phát được nhạc nền. Hãy thử lại.");
  };

  const bg = photos[0]?.url ?? loveBg;

  return (
    <div className="relative isolate min-h-dvh">
      <div aria-hidden="true" className="bg-photo-layer fixed inset-0 -z-10" style={{ backgroundImage: `url("${bg}")` }} />

      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2.5 border-b border-glass-border bg-overlay px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="size-2.5 flex-none rounded-full bg-primary shadow-glow-primary" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight">
              My love <span className="text-[11px] font-medium text-muted-foreground">{photos.length} ảnh</span>
            </h1>
            <SyncBadge sync={library.sync} onClick={() => setBackupOpen(true)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="glass" size="pill" onClick={toggleMusic} aria-pressed={music1.playing} aria-label={music1.playing ? "Tắt nhạc nền" : "Bật nhạc nền"}>
            {music1.playing ? (
              <span aria-hidden="true" className="flex h-3.5 items-end gap-0.5">
                {[0, 0.2, 0.4].map((d) => (
                  <span key={d} className="h-3.5 w-0.5 origin-bottom animate-eq rounded bg-primary" style={{ animationDelay: `${d}s` }} />
                ))}
              </span>
            ) : (
              <Music2 />
            )}
            {music1.playing ? "Tắt nhạc" : "Bật nhạc"}
          </Button>
          <Button variant="glass" size="pill" onClick={() => setBackupOpen(true)}>
            <Cloud /> Sao lưu
          </Button>
          <Button variant="sun" size="pill" onClick={pick} disabled={library.busy !== null || phase === "loading"}>
            <Plus /> Tải ảnh lên
          </Button>
          <Button variant="ghost" size="round" onClick={onLock} aria-label="Khóa lại My Love" title="Khóa lại">
            <Lock />
          </Button>
        </div>
      </header>

      <main
        className={cn("mx-auto max-w-[1300px] px-4 pb-20 pt-5", dragging && "drag-target rounded-3xl")}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={onDrop}
      >
        {library.busy && (
          <p role="status" className="glass mx-auto mt-2 flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs text-sky">
            <RotateCw className="size-3.5 animate-spin" aria-hidden="true" /> {library.busy}
          </p>
        )}

        {phase === "loading" && (
          <div aria-busy="true" aria-label="Đang tải kho ảnh">
            {[0, 1].map((s) => (
              <div key={s} className="glass mt-6 rounded-[20px] p-4">
                <div className="mb-3 h-6 w-28 animate-pulse rounded-lg bg-glass-strong" />
                <div className="film-frames flex gap-3.5 overflow-hidden rounded-[14px] px-4 py-[30px]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square w-32 flex-none animate-pulse rounded-xl bg-glass-strong sm:w-40" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {phase === "error" && (
          <div role="alert" className="mx-auto my-16 max-w-[480px] rounded-[20px] border-2 border-dashed border-destructive/40 bg-glass px-5 py-10 text-center">
            <AlertTriangle className="mx-auto mb-2 size-8 text-destructive" aria-hidden="true" />
            <h2 className="mb-1.5 text-lg font-semibold">Không truy cập được kho ảnh</h2>
            <p className="mb-4 text-muted-foreground">{library.loadError}</p>
            <Button variant="sun" size="pill" onClick={() => library.reload()}>
              <RotateCw /> Thử lại
            </Button>
          </div>
        )}

        {phase === "ready" && photos.length === 0 && (
          <div className={cn("mx-auto my-16 max-w-[480px] rounded-[20px] border-2 border-dashed border-glass-border bg-glass px-5 py-10 text-center", dragging && "drag-target")}>
            <h2 className="mb-1.5 text-lg font-semibold">Chưa có ảnh nào trong My love</h2>
            <p className="mb-4 text-muted-foreground">Bấm nút bên dưới để tải ảnh lên hoặc kéo thả trực tiếp vào đây.</p>
            <Button variant="sun" size="pill" onClick={pick}>
              <Plus /> Thêm ảnh ngay
            </Button>
            {library.mode === "local" && (
              <p className="mt-4 text-[11px] text-muted-foreground">
                Mẹo: bấm <b>Sao lưu</b> để đăng nhập — ảnh sẽ được giữ an toàn trên đám mây và mở được trên mọi thiết bị.
              </p>
            )}
          </div>
        )}

        {phase === "ready" &&
          groups.map((g) => <FilmShelf key={g.key} group={g} onOpen={setViewerIndex} onBrokenImage={onBrokenImage} />)}
      </main>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void library.addFiles(files);
        }}
      />

      {viewerIndex !== null && photos[viewerIndex] && (
        <PhotoViewer
          photos={photos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={closeViewer}
          onDelete={library.removePhoto}
          getBlob={library.getBlob}
          music={music2}
          onVideoStart={onVideoStart}
        />
      )}

      <BackupDialog open={backupOpen} onOpenChange={setBackupOpen} library={library} />
    </div>
  );
}
