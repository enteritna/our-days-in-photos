import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { LockScreen } from "@/components/love/LockScreen";
import { MyLoveApp } from "@/components/love/MyLoveApp";
import { MEDIA } from "@/config/media";
import { useMusicTrack } from "@/hooks/use-music-track";
import { UNLOCK_SESSION_KEY } from "@/lib/lock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Love — Kho ảnh kỷ niệm & Kỷ niệm tình yêu" },
      { name: "description", content: "Kho ảnh kỷ niệm dạng cuộn phim theo ngày, đồng hồ thời gian bên nhau từ 27/07/2026 và lịch kỷ niệm ngày 27." },
      { property: "og:title", content: "My Love — Kho ảnh kỷ niệm" },
      { property: "og:description", content: "Kho ảnh kỷ niệm của hai đứa mình, đếm từng giây bên nhau từ 27/07/2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const music1 = useMusicTrack(MEDIA.music.gallery);
  const music2 = useMusicTrack(MEDIA.music.viewer);

  useEffect(() => {
    let value = false;
    try {
      value = sessionStorage.getItem(UNLOCK_SESSION_KEY) === "1";
    } catch {
      /* storage unavailable → stay locked */
    }
    setUnlocked(value);
  }, []);

  if (unlocked === null) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <Heart className="size-8 animate-pulse fill-love text-love" aria-label="Đang mở My Love" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <LockScreen
        onOpen={() => {
          try {
            sessionStorage.setItem(UNLOCK_SESSION_KEY, "1");
          } catch {
            /* ignore */
          }
          setUnlocked(true);
          // OPEN is a user gesture, so the browser usually allows Lofi 1 to start here.
          void music1.play();
        }}
      />
    );
  }

  return (
    <MyLoveApp
      music1={music1}
      music2={music2}
      onLock={() => {
        try {
          sessionStorage.removeItem(UNLOCK_SESSION_KEY);
        } catch {
          /* ignore */
        }
        music1.stop();
        music2.stop();
        setUnlocked(false);
      }}
    />
  );
}
