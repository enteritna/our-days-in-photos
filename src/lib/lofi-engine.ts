/**
 * Tiny Web Audio Lofi generator. Two presets give two clearly different tracks:
 *  - "night": Giao diện 1 — 74 BPM, F major 7th loop, boom-bap kick/snare, vinyl crackle.
 *  - "rose":  Viewer      — 62 BPM, Db major 9th dream pads, music-box arpeggio, rim clicks.
 * Must be started from a user gesture (browser autoplay policy).
 */
export type LofiPresetName = "night" | "rose";

type Preset = {
  bpm: number;
  swing: number;
  chords: number[][];
  bass: number[];
  kick: number[];
  snare: number[];
  hat: number[];
  arp: (number | null)[];
  padWave: OscillatorType;
  cutoff: number;
  crackle: number;
  snareTone: number;
  snareGain: number;
  padGain: number;
  bellGain: number;
};

const PRESETS: Record<LofiPresetName, Preset> = {
  night: {
    bpm: 74,
    swing: 0.18,
    chords: [
      [53, 57, 60, 64],
      [52, 55, 59, 62],
      [50, 53, 57, 60],
      [48, 52, 55, 59],
    ],
    bass: [41, 40, 38, 36],
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0.7, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [0.6, 0, 0.4, 0, 0.6, 0, 0.4, 0.2, 0.6, 0, 0.4, 0, 0.6, 0, 0.4, 0.3],
    arp: [null, null, null, null, null, null, 3, null, null, null, null, null, 2, null, null, null],
    padWave: "triangle",
    cutoff: 1500,
    crackle: 0.05,
    snareTone: 1800,
    snareGain: 0.32,
    padGain: 0.055,
    bellGain: 0.05,
  },
  rose: {
    bpm: 62,
    swing: 0.1,
    chords: [
      [49, 53, 56, 60, 63],
      [46, 49, 53, 56, 60],
      [42, 46, 49, 53, 56],
      [44, 48, 51, 53, 58],
    ],
    bass: [37, 34, 30, 32],
    kick: [1, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    hat: [0, 0, 0.3, 0, 0, 0, 0.3, 0, 0, 0, 0.3, 0, 0, 0, 0.3, 0.2],
    arp: [0, null, 2, null, 4, null, 3, null, 1, null, 3, null, 4, null, 2, null],
    padWave: "sine",
    cutoff: 1100,
    crackle: 0.03,
    snareTone: 3200,
    snareGain: 0.14,
    padGain: 0.06,
    bellGain: 0.07,
  },
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class LofiEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: BiquadFilterNode | null = null;
  private noise: AudioBuffer | null = null;
  private crackleSrc: AudioBufferSourceNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  private step = 0;
  private nextTime = 0;
  private preset: Preset;
  playing = false;

  constructor(name: LofiPresetName, private volume = 0.22) {
    this.preset = PRESETS[name];
  }

  private setup() {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) throw new Error("Trình duyệt không hỗ trợ phát nhạc.");
    const ctx = new Ctx();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.music = ctx.createBiquadFilter();
    this.music.type = "lowpass";
    this.music.frequency.value = this.preset.cutoff;
    this.music.Q.value = 0.6;
    this.music.connect(this.master);
    this.master.connect(comp);
    comp.connect(ctx.destination);

    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // Vinyl crackle: soft hiss with sparse pops, looped.
    const crackle = ctx.createBuffer(1, len, ctx.sampleRate);
    const c = crackle.getChannelData(0);
    for (let i = 0; i < len; i++) {
      c[i] = (Math.random() * 2 - 1) * 0.04 + (Math.random() < 0.0008 ? (Math.random() * 2 - 1) * 0.9 : 0);
    }
    const src = ctx.createBufferSource();
    src.buffer = crackle;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = this.preset.crackle;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    src.connect(hp).connect(g).connect(this.master);
    src.start();
    this.crackleSrc = src;
  }

  private pad(notes: number[], t: number, dur: number) {
    const ctx = this.ctx!;
    notes.forEach((n, idx) => {
      [-7, 7].forEach((detune) => {
        const o = ctx.createOscillator();
        o.type = this.preset.padWave;
        o.frequency.value = mtof(n);
        o.detune.value = detune + (idx % 2 ? 3 : -3);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(this.preset.padGain, t + 0.5);
        g.gain.setValueAtTime(this.preset.padGain, t + dur - 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
        o.connect(g).connect(this.music!);
        o.start(t);
        o.stop(t + dur + 0.7);
      });
    });
  }

  private bass(n: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = mtof(n - 12 >= 28 ? n - 12 : n);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private bell(n: number, t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = mtof(n + 12);
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = mtof(n + 24) * 1.003;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(this.preset.bellGain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(this.music!);
    o.start(t);
    o2.start(t);
    o.stop(t + 1.5);
    o2.stop(t + 1.5);
  }

  private kick(t: number, v: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.75 * v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.4);
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, gain: number, dur: number) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master!);
    s.start(t, Math.random());
    s.stop(t + dur + 0.02);
  }

  private schedule = () => {
    const ctx = this.ctx;
    if (!ctx || !this.playing) return;
    const p = this.preset;
    const stepDur = 60 / p.bpm / 4;
    while (this.nextTime < ctx.currentTime + 1.2) {
      const s = this.step % 16;
      const bar = Math.floor(this.step / 16) % p.chords.length;
      const t = this.nextTime + (s % 2 === 1 ? p.swing * stepDur : 0);
      if (s === 0) {
        this.pad(p.chords[bar], t, stepDur * 16);
        this.bass(p.bass[bar], t, stepDur * 6);
      }
      if (s === 8) this.bass(p.bass[bar] + 7, t, stepDur * 4);
      if (p.kick[s]) this.kick(t, p.kick[s]);
      if (p.snare[s]) this.noiseHit(t, "bandpass", p.snareTone, p.snareGain * p.snare[s], 0.18);
      if (p.hat[s]) this.noiseHit(t, "highpass", 7000, 0.06 * p.hat[s], 0.05);
      const a = p.arp[s];
      if (a !== null && a !== undefined) {
        const chord = p.chords[bar];
        this.bell(chord[a % chord.length], t);
      }
      this.nextTime += stepDur;
      this.step++;
    }
  };

  async play() {
    this.setup();
    const ctx = this.ctx!;
    if (this.suspendTimer) {
      clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    await ctx.resume();
    if (this.playing) return;
    this.playing = true;
    this.nextTime = ctx.currentTime + 0.08;
    const g = this.master!.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(this.volume, ctx.currentTime + 1.2);
    this.schedule();
    this.timer = setInterval(this.schedule, 100);
  }

  pause() {
    if (!this.ctx || !this.playing) return;
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const ctx = this.ctx;
    const g = this.master!.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    this.suspendTimer = setTimeout(() => {
      this.suspendTimer = null;
      if (!this.playing) void ctx.suspend();
    }, 450);
  }

  dispose() {
    this.pause();
    this.crackleSrc?.stop();
    void this.ctx?.close();
    this.ctx = null;
  }
}
