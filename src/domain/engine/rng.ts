/** Generador inyectable. Devuelve un número en [0, 1). */
export type Rng = () => number;

/** mulberry32: determinista con semilla (pruebas) y suficiente para sorteos de juego. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semilla nueva por sesión real. */
export function freshSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0];
  }
  return Math.floor(Math.random() * 2 ** 32);
}

export function pickWeighted<T>(items: readonly T[], weight: (item: T) => number, rng: Rng): T | undefined {
  let total = 0;
  for (const it of items) {
    const w = weight(it);
    if (Number.isFinite(w) && w > 0) total += w;
  }
  if (total <= 0) return undefined;
  let r = rng() * total;
  for (const it of items) {
    const w = weight(it);
    if (!(Number.isFinite(w) && w > 0)) continue;
    r -= w;
    if (r < 0) return it;
  }
  return items[items.length - 1];
}

export function pickOne<T>(items: readonly T[], rng: Rng): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** ID local aleatorio no derivado de datos personales. */
export function randomId(prefix = ""): string {
  const bytes = new Uint8Array(9);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return prefix + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
