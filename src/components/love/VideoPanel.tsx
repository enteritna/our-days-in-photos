import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { MEDIA } from "@/config/media";
import type { MusicControl } from "@/hooks/use-music-track";

/**
 * Viewer video box. Never autoplays and is always muted: the MP4's own audio is never used.
 * PLAY starts the video together with Lofi 2; pause/unmount/hidden tab stops both.
 */
export function VideoPanel({ music, onStart }: { music: MusicControl; onStart: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef(music);
  musicRef.current = music;
  const [video, setVideo] = useState<"checking" | "ready" | "missing">("checking");
  const [playing, setPlaying] = useState(false);

  const pauseAll = useCallback(() => {
    videoRef.current?.pause();
    musicRef.current.pause();
    setPlaying(false);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.volume = 0;
    const keepMuted = () => {
      if (!v.muted || v.volume > 0) {
        v.muted = true;
        v.volume = 0;
      }
    };
    const onHidden = () => document.hidden && pauseAll();
    v.addEventListener("volumechange", keepMuted);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      v.removeEventListener("volumechange", keepMuted);
      document.removeEventListener("visibilitychange", onHidden);
      v.pause();
      v.currentTime = 0;
      musicRef.current.stop();
    };
  }, [pauseAll]);

  const start = async () => {
    onStart();
    const v = videoRef.current;
    const [musicOk, videoOk] = await Promise.all([
      music.play(),
      v && video !== "missing"
        ? v.play().then(
            () => true,
            () => {
              setVideo("missing");
              return false;
            },
          )
        : Promise.resolve(false),
    ]);
    setPlaying(musicOk || videoOk);
    if (!musicOk) toast.error("Không phát được nhạc Lofi. Hãy thử bấm PLAY lại.");
  };

  return (
    <section aria-label="Video kỷ niệm" className="grid gap-2 rounded-[14px] border border-glass-border bg-glass p-3 text-center">
      <div className="relative flex h-[210px] w-full items-center justify-center overflow-hidden rounded-[10px] border border-glass-border bg-viewer">
        <video
          ref={videoRef}
          src={MEDIA.viewerVideo.src}
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-label="Video kỷ niệm (không có tiếng gốc)"
          onLoadedMetadata={() => setVideo("ready")}
          onError={() => setVideo("missing")}
          className={video === "missing" ? "hidden" : "size-full object-cover"}
        />
        {video === "missing" && (
          <div className="absolute inset-3 grid place-items-center rounded-lg border-2 border-dashed border-love/50 bg-love/5 p-3">
            <div>
              <Film className="mx-auto mb-1.5 size-7 text-love" aria-hidden="true" />
              <p className="text-xs font-semibold">Video kỷ niệm sẽ xuất hiện ở đây</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Đang chờ file video_1.mp4 · PLAY vẫn phát nhạc</p>
            </div>
          </div>
        )}
        {!playing ? (
          <button
            type="button"
            onClick={start}
            aria-label="Phát video và nhạc Lofi"
            className="absolute z-10 grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-float transition-transform hover:scale-105"
          >
            <Play className="ml-1 size-7 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={pauseAll}
            aria-label="Tạm dừng video và nhạc"
            className="absolute bottom-2 right-2 z-10 grid size-10 place-items-center rounded-full bg-overlay text-foreground backdrop-blur-md hover:bg-viewer"
          >
            <Pause className="size-4 fill-current" />
          </button>
        )}
      </div>
      <div className="text-xs font-semibold text-love">{MEDIA.viewerVideo.title}</div>
      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground" aria-live="polite">
        {playing && (
          <span aria-hidden="true" className="flex h-3 items-end gap-0.5">
            {[0, 0.2, 0.4].map((d) => (
              <span key={d} className="h-3 w-0.5 origin-bottom animate-eq rounded bg-primary" style={{ animationDelay: `${d}s` }} />
            ))}
          </span>
        )}
        ♫ {MEDIA.music.viewer.title} {playing ? "· đang phát" : "· bấm ▶ để phát"}
      </div>
    </section>
  );
}
