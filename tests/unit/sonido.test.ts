import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** AudioContext de mentira: cuenta los osciladores y ruidos que se programan. */
class FakeParam {
  value = 0;
  setValueAtTime() {}
  exponentialRampToValueAtTime(v: number) {
    if (!(v > 0)) throw new Error("rampa exponencial a un valor no positivo");
  }
}
class FakeNode {
  frequency = new FakeParam();
  gain = new FakeParam();
  Q = new FakeParam();
  threshold = new FakeParam();
  ratio = new FakeParam();
  type = "";
  buffer: unknown = null;
  loop = false;
  connect() {}
  start(t: number) {
    starts.push(t);
  }
  stop() {}
}
let starts: number[] = [];
let created = 0;
class FakeAudioContext {
  currentTime = 0;
  sampleRate = 8000;
  state = "suspended";
  destination = new FakeNode();
  constructor() {
    created++;
  }
  resume() {
    this.state = "running";
    return Promise.resolve();
  }
  createGain() {
    return new FakeNode();
  }
  createOscillator() {
    return new FakeNode();
  }
  createBiquadFilter() {
    return new FakeNode();
  }
  createBufferSource() {
    return new FakeNode();
  }
  createDynamicsCompressor() {
    return new FakeNode();
  }
  createBuffer(_c: number, len: number) {
    return { getChannelData: () => new Float32Array(len) };
  }
}

const NAMES = [
  "tap", "deal", "flip", "done", "pass", "swap", "diceRoll", "diceLand", "step", "suspense", "heartbeat", "reveal", "win", "tick", "stop",
  "woodPull", "wobble", "crash", "scratch", "levelUp", "levelDown", "timerEnd", "count", "go", "special", "whoosh", "whooshBack", "vote",
] as const;

describe("efectos de sonido", () => {
  beforeEach(() => {
    vi.resetModules();
    starts = [];
    created = 0;
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    vi.stubGlobal("navigator", { vibrate: vi.fn() });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("no suena nada antes del primer toque y luego todos los efectos se programan sin errores", async () => {
    const m = await import("@/sound/sfx");
    m.sfx("tap");
    expect(starts).toHaveLength(0);
    m.unlockAudio();
    await Promise.resolve();
    for (const n of NAMES) {
      const before = starts.length;
      m.sfx(n, { duration: 1, step: 3 });
      expect(starts.length, n).toBeGreaterThan(before);
    }
    expect(created).toBe(1);
  });

  it("apagados en Ajustes o silenciados en la mesa, no suenan", async () => {
    const m = await import("@/sound/sfx");
    m.unlockAudio();
    await Promise.resolve();
    m.configureSfx({ sfx: false, sfxVolume: "medio", vibration: false });
    m.sfx("win");
    expect(starts).toHaveLength(0);
    m.configureSfx({ sfx: true, sfxVolume: "alto", vibration: false });
    m.useSfxMute.getState().toggle();
    m.sfx("win");
    m.spinTicks(2, 10);
    expect(starts).toHaveLength(0);
    m.useSfxMute.getState().toggle();
    m.sfx("win");
    expect(starts.length).toBeGreaterThan(0);
  });

  it("el tic de la botella frena: cada vez más espaciado", async () => {
    const m = await import("@/sound/sfx");
    m.unlockAudio();
    await Promise.resolve();
    m.spinTicks(5.5, 20);
    // Cada tic programa ruido + tono a la vez: tomar un instante por tic.
    const times = [...new Set(starts.map((t) => t.toFixed(4)))].map(Number).sort((a, b) => a - b);
    const gaps = times.slice(1).map((t, i) => t - times[i]);
    expect(times.at(-1)).toBeCloseTo(5.5, 5);
    expect(gaps.at(-1)!).toBeGreaterThan(gaps[0] * 5);
  });

  it("la vibración solo si está activada", async () => {
    const m = await import("@/sound/sfx");
    m.haptic(20);
    expect(navigator.vibrate).not.toHaveBeenCalled();
    m.configureSfx({ sfx: true, sfxVolume: "medio", vibration: true });
    m.haptic(20);
    expect(navigator.vibrate).toHaveBeenCalledWith(20);
  });
});

describe("ajustes de sonido", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("window", {
      localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v) },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("los efectos vienen encendidos y a volumen medio; ajustes viejos también", async () => {
    const { loadSettings } = await import("@/storage/settings");
    expect(loadSettings()).toMatchObject({ sfx: true, sfxVolume: "medio" });
    window.localStorage.setItem("trio:settings", JSON.stringify({ textScale: 1.15, sound: false }));
    expect(loadSettings()).toMatchObject({ sfx: true, sfxVolume: "medio", textScale: 1.15 });
    window.localStorage.setItem("trio:settings", JSON.stringify({ sfx: false, sfxVolume: "alto" }));
    expect(loadSettings()).toMatchObject({ sfx: false, sfxVolume: "alto" });
  });
});
