import type { MusicConfig } from "@/config/media";
import { LofiEngine } from "./lofi-engine";

export interface MusicTrack {
  play(): Promise<void>;
  pause(): void;
  /** Pause and rewind (file tracks) — used when leaving the viewer. */
  stop(): void;
  readonly playing: boolean;
  dispose(): void;
}

class FileTrack implements MusicTrack {
  private audio: HTMLAudioElement;
  constructor(src: string, volume: number) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.preload = "none";
    this.audio.volume = volume;
  }
  get playing() {
    return !this.audio.paused;
  }
  async play() {
    try {
      await this.audio.play();
    } catch {
      throw new Error("Không phát được nhạc. Kiểm tra kết nối mạng rồi thử lại.");
    }
  }
  pause() {
    this.audio.pause();
  }
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
  dispose() {
    this.stop();
    this.audio.removeAttribute("src");
  }
}

class SynthTrack implements MusicTrack {
  private engine: LofiEngine;
  constructor(preset: MusicConfig["preset"], volume: number) {
    this.engine = new LofiEngine(preset, volume);
  }
  get playing() {
    return this.engine.playing;
  }
  play() {
    return this.engine.play();
  }
  pause() {
    this.engine.pause();
  }
  stop() {
    this.engine.pause();
  }
  dispose() {
    this.engine.dispose();
  }
}

/** Call only in the browser (event handler/effect). */
export function createMusicTrack(config: MusicConfig): MusicTrack {
  return config.src ? new FileTrack(config.src, config.volume) : new SynthTrack(config.preset, config.volume);
}
