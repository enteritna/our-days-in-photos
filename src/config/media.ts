/**
 * Replaceable media for My Love.
 *
 * - Viewer video: drop the real file at `public/video_1.mp4` (or change `src`).
 *   Its own audio track is never used: the element is always muted.
 * - Music: `src: null` uses the built-in Web Audio Lofi synth preset.
 *   To use a real recording, put e.g. `public/audio/lofi-1.mp3` in the project and set
 *   `src: "/audio/lofi-1.mp3"`. Track 1 (Giao diện 1) and track 2 (viewer) must stay different.
 */
export type MusicConfig = {
  id: "gallery" | "viewer";
  title: string;
  src: string | null;
  preset: "night" | "rose";
  volume: number;
};

export const MEDIA = {
  viewerVideo: {
    src: "/video_1.mp4",
    title: "🌹 Khoảnh khắc ngọt ngào bên nhau",
  },
  music: {
    gallery: {
      id: "gallery",
      title: "Lofi đêm chill",
      src: null,
      preset: "night",
      volume: 0.22,
    } satisfies MusicConfig,
    viewer: {
      id: "viewer",
      title: "Lofi hoa hồng mơ màng",
      src: null,
      preset: "rose",
      volume: 0.24,
    } satisfies MusicConfig,
  },
} as const;
