import { useCallback, useEffect, useRef, useState } from "react";
import type { MusicConfig } from "@/config/media";
import { createMusicTrack, type MusicTrack } from "@/lib/music-track";

export type MusicControl = {
  playing: boolean;
  error: string | null;
  play: () => Promise<boolean>;
  pause: () => void;
  stop: () => void;
  toggle: () => Promise<boolean>;
};

/** Track is created lazily on the first user-initiated play (autoplay policy). */
export function useMusicTrack(config: MusicConfig): MusicControl {
  const trackRef = useRef<MusicTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => trackRef.current?.dispose(), []);

  const play = useCallback(async () => {
    try {
      if (!trackRef.current) trackRef.current = createMusicTrack(config);
      await trackRef.current.play();
      setError(null);
      setPlaying(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không phát được nhạc.");
      setPlaying(false);
      return false;
    }
  }, [config]);

  const pause = useCallback(() => {
    trackRef.current?.pause();
    setPlaying(false);
  }, []);

  const stop = useCallback(() => {
    trackRef.current?.stop();
    setPlaying(false);
  }, []);

  const toggle = useCallback(async () => {
    if (trackRef.current?.playing) {
      pause();
      return false;
    }
    return play();
  }, [pause, play]);

  return { playing, error, play, pause, stop, toggle };
}
