import { create } from "zustand";

/**
 * Efectos de sonido sintetizados en el propio dispositivo con Web Audio: sin
 * archivos, sin red y sin datos de juego. Funcionan sin conexión.
 *
 * - El volumen y el encendido vienen de Ajustes (`configureSfx`).
 * - «Silenciar» desde la mesa solo vive en memoria (no escribe nada, ni en
 *   sesión privada).
 * - El navegador solo deja sonar después de un gesto: `unlockAudio` se llama
 *   al levantar el dedo (en iPhone, tocar sin soltar no cuenta) y cada efecto
 *   reintenta reanudar el audio si quedó suspendido o «interrumpido».
 * - En iPhone, «sonar aunque esté en silencio» declara la sesión de audio como
 *   «playback» (ignora el interruptor, pero puede pausar música de otras apps);
 *   si no, «ambient» (se mezcla con Spotify y respeta el interruptor).
 */

export type SfxName =
  | "tap"
  | "deal"
  | "flip"
  | "done"
  | "pass"
  | "swap"
  | "diceRoll"
  | "diceLand"
  | "step"
  | "suspense"
  | "heartbeat"
  | "reveal"
  | "win"
  | "tick"
  | "stop"
  | "woodPull"
  | "wobble"
  | "crash"
  | "scratch"
  | "levelUp"
  | "levelDown"
  | "timerEnd"
  | "count"
  | "go"
  | "special"
  | "whoosh"
  | "whooshBack"
  | "vote";

export const SFX_VOLUMES = { bajo: 0.35, medio: 0.7, alto: 1 } as const;
export type SfxVolume = keyof typeof SFX_VOLUMES;

interface Audio {
  ctx: AudioContext;
  out: GainNode;
  noise: AudioBuffer;
}

let audio: Audio | null = null;
let enabled = true;
let volume: number = SFX_VOLUMES.medio;
let vibrationOn = false;
let overSilent = true;

/** Silencio temporal desde la mesa (solo memoria). */
export const useSfxMute = create<{ muted: boolean; toggle(): void }>((set) => ({
  muted: false,
  toggle: () => set((s) => ({ muted: !s.muted })),
}));

export function configureSfx(cfg: { sfx: boolean; sfxVolume: SfxVolume; vibration: boolean; sfxOverSilent?: boolean }): void {
  enabled = cfg.sfx;
  volume = SFX_VOLUMES[cfg.sfxVolume] ?? SFX_VOLUMES.medio;
  vibrationOn = cfg.vibration;
  overSilent = cfg.sfxOverSilent !== false;
  if (audio) audio.out.gain.value = volume;
  setSessionType();
}

/** Tipo de sesión de audio en Safari 16.4+ (en otros navegadores no existe y no hace nada). */
function setSessionType(type: string = overSilent ? "playback" : "ambient"): void {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession && nav.audioSession.type !== type) nav.audioSession.type = type;
  } catch {
    /* opcional */
  }
}

/**
 * El audio solo se mantiene activo mientras suena algo: tras unos segundos en
 * silencio se suspende y se suelta la sesión de audio. Si no, el iPhone muestra
 * el indicador de sonido en la isla dinámica todo el tiempo que la app está abierta.
 */
const IDLE_MS = 2500;
/** Momento (reloj del navegador, ms) en que termina el último efecto programado. */
let quietAt = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

function noteUntil(a: Audio, endTime: number): void {
  quietAt = Math.max(quietAt, performance.now() + Math.max(0, endTime - a.ctx.currentTime) * 1000);
}

function scheduleRelease(a: Audio): void {
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = setTimeout(() => release(a), Math.max(0, quietAt - performance.now()) + IDLE_MS);
}

function release(a: Audio): void {
  releaseTimer = null;
  if (performance.now() < quietAt) return scheduleRelease(a);
  if (a.ctx.state === "running") void a.ctx.suspend().catch(() => undefined);
  // Sin sesión de audio activa, iOS quita el indicador de reproducción.
  setSessionType("auto");
}

/** Al salir de la app (pantalla bloqueada, otra app): soltar el audio enseguida. */
export function releaseAudioNow(): void {
  if (!audio) return;
  quietAt = 0;
  if (releaseTimer) clearTimeout(releaseTimer);
  release(audio);
}

function ensure(): Audio | null {
  if (audio) return audio;
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    const ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    const out = ctx.createGain();
    out.gain.value = volume;
    out.connect(comp);
    comp.connect(ctx.destination);
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    audio = { ctx, out, noise };
    return audio;
  } catch {
    return null;
  }
}

let primed = false;

/**
 * Llamar dentro de un gesto (al soltar el dedo, clic o tecla): el primer toque
 * desbloquea el audio. Los siguientes no lo encienden (eso lo hace cada efecto
 * al sonar), salvo para recuperarlo si iOS lo interrumpió (una llamada, por ejemplo).
 */
export function unlockAudio(): void {
  if (!enabled) return;
  const state = audio?.ctx.state as string | undefined;
  if (primed && state !== "interrupted") return;
  setSessionType();
  const a = ensure();
  if (!a) return;
  if (a.ctx.state !== "running") void a.ctx.resume().catch(() => undefined);
  scheduleRelease(a);
  if (!primed) {
    // iPhone antiguos: un sonido mudo dentro del gesto termina de desbloquear el audio.
    try {
      const src = a.ctx.createBufferSource();
      src.buffer = a.ctx.createBuffer(1, 1, 22050);
      src.connect(a.ctx.destination);
      src.start(0);
      primed = true;
    } catch {
      /* opcional */
    }
  }
}

/** Ejecuta `fn` con el audio listo; si quedó suspendido o interrumpido, lo reanuda primero. */
function withAudio(fn: (a: Audio) => void): void {
  if (!enabled || useSfxMute.getState().muted) return;
  const a = ensure();
  if (!a) return;
  const run = () => {
    try {
      fn(a);
    } catch {
      /* un efecto nunca debe romper el juego */
    }
    scheduleRelease(a);
  };
  if (a.ctx.state === "running") return run();
  setSessionType();
  const asked = performance.now();
  void a.ctx
    .resume()
    .then(() => {
      // Si tardó demasiado, el momento ya pasó: mejor no sonar tarde.
      if (a.ctx.state === "running" && performance.now() - asked < 400) run();
    })
    .catch(() => undefined);
}

// ------------------------------------------------------------------ piezas

interface ToneOpts {
  f: number;
  f2?: number;
  t?: number;
  d: number;
  type?: OscillatorType;
  g?: number;
  attack?: number;
}

function tone(a: Audio, { f, f2, t = 0, d, type = "sine", g = 0.2, attack = 0.005 }: ToneOpts): void {
  const t0 = a.ctx.currentTime + t;
  const o = a.ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  const v = a.ctx.createGain();
  v.gain.setValueAtTime(0.0001, t0);
  v.gain.exponentialRampToValueAtTime(g, t0 + attack);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(v);
  v.connect(a.out);
  o.start(t0);
  o.stop(t0 + d + 0.05);
  noteUntil(a, t0 + d + 0.1);
}

interface NoiseOpts {
  t?: number;
  d: number;
  filter?: BiquadFilterType;
  f?: number;
  f2?: number;
  q?: number;
  g?: number;
  attack?: number;
}

function noise(a: Audio, { t = 0, d, filter = "bandpass", f = 1000, f2, q = 1, g = 0.2, attack = 0.005 }: NoiseOpts): void {
  const t0 = a.ctx.currentTime + t;
  const src = a.ctx.createBufferSource();
  src.buffer = a.noise;
  src.loop = true;
  const bf = a.ctx.createBiquadFilter();
  bf.type = filter;
  bf.frequency.setValueAtTime(f, t0);
  if (f2) bf.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  bf.Q.value = q;
  const v = a.ctx.createGain();
  v.gain.setValueAtTime(0.0001, t0);
  v.gain.exponentialRampToValueAtTime(g, t0 + attack);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  src.connect(bf);
  bf.connect(v);
  v.connect(a.out);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + d + 0.05);
  noteUntil(a, t0 + d + 0.1);
}

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

function chord(a: Audio, freqs: number[], t: number, d: number, g: number, type: OscillatorType = "sine"): void {
  for (const f of freqs) tone(a, { f, t, d, g, type, attack: 0.012 });
}

function cymbal(a: Audio, t = 0, d = 0.8, g = 0.12): void {
  noise(a, { t, d, filter: "highpass", f: 6000, g, attack: 0.003 });
}

function click(a: Audio, t: number, g = 0.25): void {
  noise(a, { t, d: 0.022, f: rand(2600, 4200), q: 5, g });
  tone(a, { f: rand(600, 950), t, d: 0.03, g: g * 0.25, type: "triangle" });
}

// ------------------------------------------------------------------ efectos

/** Reproduce un efecto. `duration` en segundos para los que duran (dado, suspenso); `step` sube el tono. */
export function sfx(name: SfxName, opts: { duration?: number; step?: number } = {}): void {
  withAudio((a) => play(a, name, opts));
}

function play(a: Audio, name: SfxName, { duration, step = 0 }: { duration?: number; step?: number }): void {
  switch (name) {
    case "tap":
      tone(a, { f: 1300, f2: 850, d: 0.05, g: 0.045, type: "triangle" });
      return;
    case "deal":
      noise(a, { d: 0.22, f: 3200, f2: 700, q: 1.2, g: 0.3 });
      tone(a, { f: 170, f2: 90, t: 0.15, d: 0.12, g: 0.18 });
      return;
    case "flip":
      noise(a, { d: 0.11, f: 1600, f2: 3800, q: 1.4, g: 0.22 });
      noise(a, { t: 0.11, d: 0.1, f: 3800, f2: 1500, q: 1.4, g: 0.18 });
      tone(a, { f: 1318.5, t: 0.2, d: 0.55, g: 0.06 });
      tone(a, { f: 1975.5, t: 0.25, d: 0.7, g: 0.04 });
      return;
    case "done":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(a, { f, t: i * 0.075, d: 0.4, g: 0.13, type: "triangle" }));
      tone(a, { f: 2093, t: 0.32, d: 0.6, g: 0.04 });
      cymbal(a, 0.3, 0.5, 0.05);
      return;
    case "pass":
      noise(a, { d: 0.28, filter: "lowpass", f: 1400, f2: 300, g: 0.14 });
      tone(a, { f: 392, f2: 330, d: 0.18, g: 0.09, type: "triangle" });
      tone(a, { f: 330, f2: 247, t: 0.14, d: 0.26, g: 0.09, type: "triangle" });
      return;
    case "swap":
      noise(a, { d: 0.15, f: 800, f2: 3200, q: 1.2, g: 0.2 });
      noise(a, { t: 0.15, d: 0.15, f: 3200, f2: 800, q: 1.2, g: 0.2 });
      tone(a, { f: 660, t: 0.28, d: 0.15, g: 0.06, type: "triangle" });
      return;
    case "diceRoll": {
      const dur = duration ?? 1.5;
      noise(a, { d: dur, filter: "lowpass", f: 320, g: 0.07, attack: 0.05 });
      let t = 0;
      while (t < dur) {
        click(a, t, rand(0.14, 0.3));
        t += 0.03 + Math.pow(t / dur, 2) * 0.13 + rand(0, 0.03);
      }
      return;
    }
    case "diceLand":
      tone(a, { f: 160, f2: 55, d: 0.2, g: 0.35 });
      noise(a, { d: 0.04, f: 2200, q: 2, g: 0.28 });
      tone(a, { f: 140, f2: 60, t: 0.13, d: 0.12, g: 0.14 });
      noise(a, { t: 0.13, d: 0.03, f: 2600, q: 2, g: 0.12 });
      return;
    case "step": {
      const f = 480 * Math.pow(2, Math.min(step, 12) / 12);
      tone(a, { f, f2: f * 0.7, d: 0.1, g: 0.17, type: "triangle" });
      noise(a, { d: 0.03, f: 1900, q: 3, g: 0.14 });
      return;
    }
    case "suspense": {
      const dur = duration ?? 1.2;
      for (let t = 0; t < dur; t += 0.045) noise(a, { t, d: 0.04, f: 950, q: 0.9, g: 0.04 + 0.22 * (t / dur) });
      tone(a, { f: 65, f2: 130, d: dur, g: 0.14, attack: dur * 0.8 });
      return;
    }
    case "heartbeat":
      tone(a, { f: 72, f2: 45, d: 0.15, g: 0.5 });
      tone(a, { f: 66, f2: 40, t: 0.2, d: 0.17, g: 0.38 });
      return;
    case "reveal":
      cymbal(a, 0, 0.9, 0.14);
      chord(a, [523.25, 659.25, 783.99, 987.77], 0, 1.1, 0.065);
      tone(a, { f: 2093, t: 0.05, d: 0.5, g: 0.04 });
      return;
    case "win":
      [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(a, { f, t: i * 0.12, d: 0.26, g: 0.12, type: "triangle" }));
      chord(a, [523.25, 659.25, 783.99, 1046.5], 0.5, 1.5, 0.07, "triangle");
      cymbal(a, 0.5, 1.2, 0.12);
      return;
    case "tick":
      click(a, 0, 0.22);
      return;
    case "stop":
      tone(a, { f: 880, d: 0.45, g: 0.1 });
      tone(a, { f: 1320, t: 0.02, d: 0.6, g: 0.05 });
      return;
    case "woodPull":
      noise(a, { d: 0.4, f: 650, f2: 1150, q: 2.2, g: 0.18, attack: 0.04 });
      tone(a, { f: 300, f2: 170, t: 0.38, d: 0.09, g: 0.2, type: "triangle" });
      return;
    case "wobble":
      tone(a, { f: 125, f2: 92, d: 0.45, g: 0.16 });
      noise(a, { d: 0.35, filter: "lowpass", f: 420, g: 0.1 });
      return;
    case "crash":
      noise(a, { d: 1.5, filter: "lowpass", f: 900, f2: 140, g: 0.45, attack: 0.01 });
      for (let i = 0; i < 12; i++) {
        const t = rand(0, 1);
        tone(a, { f: rand(240, 720), t, d: 0.07, g: rand(0.08, 0.2), type: "triangle" });
        noise(a, { t, d: 0.03, f: rand(1200, 2400), q: 2, g: 0.12 });
      }
      return;
    case "scratch":
      noise(a, { d: 0.06, filter: "highpass", f: 2600, f2: 4200, g: 0.08 });
      return;
    case "levelUp":
      tone(a, { f: 220, f2: 880, d: 0.5, g: 0.09, type: "triangle", attack: 0.05 });
      chord(a, [587.33, 739.99, 880, 1174.66], 0.45, 1.2, 0.07);
      cymbal(a, 0.45, 1, 0.12);
      return;
    case "levelDown":
      tone(a, { f: 660, f2: 330, d: 0.5, g: 0.08, type: "triangle" });
      chord(a, [392, 493.88], 0.4, 0.8, 0.06);
      return;
    case "timerEnd":
      for (let i = 0; i < 3; i++) {
        tone(a, { f: 1046.5, t: i * 0.45, d: 1.1, g: 0.14 });
        tone(a, { f: 2637, t: i * 0.45, d: 0.5, g: 0.035 });
      }
      return;
    case "count":
      tone(a, { f: 880, d: 0.12, g: 0.11 });
      return;
    case "go":
      tone(a, { f: 1318.5, d: 0.35, g: 0.12 });
      tone(a, { f: 1760, t: 0.02, d: 0.4, g: 0.05 });
      return;
    case "special":
      noise(a, { d: 0.45, f: 400, f2: 4200, q: 1, g: 0.18 });
      [523.25, 783.99, 1046.5].forEach((f, i) => tone(a, { f, t: 0.35 + i * 0.1, d: 0.3, g: 0.11, type: "triangle" }));
      chord(a, [659.25, 783.99, 1046.5], 0.65, 1.1, 0.06);
      cymbal(a, 0.65, 0.9, 0.1);
      return;
    case "whoosh":
      noise(a, { d: 0.38, f: 380, f2: 2800, q: 1.1, g: 0.22, attack: 0.08 });
      return;
    case "whooshBack":
      noise(a, { d: 0.38, f: 2800, f2: 380, q: 1.1, g: 0.22, attack: 0.08 });
      return;
    case "vote":
      tone(a, { f: 740, d: 0.12, g: 0.09, type: "triangle" });
      tone(a, { f: 988, t: 0.08, d: 0.18, g: 0.07, type: "triangle" });
      return;
  }
}

/**
 * Tic-tic de algo que gira y frena (botella, ruleta): un tic por cada tramo
 * de giro, cada vez más espaciados. `ticks` = cuántos tramos recorre.
 */
export function spinTicks(durationSec: number, ticks: number): void {
  withAudio((a) => {
    for (let k = 1; k <= ticks; k++) {
      // Giro con frenado tipo «ease-out» cúbico: ángulo = 1 − (1 − t)³.
      const t = durationSec * (1 - Math.cbrt(1 - k / ticks));
      click(a, t, 0.12 + 0.12 * (k / ticks));
    }
    tone(a, { f: 880, t: durationSec, d: 0.45, g: 0.1 });
  });
}

/** Vibración corta, solo si está activada en Ajustes y el dispositivo la admite. */
export function haptic(pattern: number | number[]): void {
  if (!vibrationOn || useSfxMute.getState().muted) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* opcional */
  }
}
