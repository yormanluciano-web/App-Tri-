import type { Intensity } from "@/domain/models/constants";
import type { CustomCard } from "./custom";

/**
 * Edición de cartas originales directamente en el código: cada carta vive en
 * una línea de `src/data/<nivel>/v2-NN.ts` («  { id: "125", t: …, x: … },»).
 * El panel reemplaza esa línea por la versión editada; no queda copia aparte.
 */

export const LEVEL_OF_PREFIX: Record<string, Intensity> = { l2: "leve", p2: "picante", v2: "perverso" };

export function splitBaseId(activityId: string): { prefix: string; suffix: string; level: Intensity } | null {
  const m = /^([a-z0-9]+)-([a-z0-9]+)$/.exec(activityId);
  if (!m || !LEVEL_OF_PREFIX[m[1]]) return null;
  return { prefix: m[1], suffix: m[2], level: LEVEL_OF_PREFIX[m[1]] };
}

export function levelDir(level: Intensity): string {
  return `src/data/${level}`;
}

const q = (s: string) => JSON.stringify(s);
const list = (xs: readonly (string | number)[]) => `[${xs.map((x) => (typeof x === "string" ? q(x) : String(x))).join(", ")}]`;

/** Campos que el formulario no edita y que se conservan de la línea original. */
export interface Preserved {
  tags?: string[];
  fam?: string;
  w?: number;
  cd?: number;
  status?: string;
}

/** Lee de la línea original los campos que el editor no maneja. */
export function preservedFrom(line: string): Preserved {
  const out: Preserved = {};
  const tags = /\btags: \[([^\]]*)\]/.exec(line);
  if (tags) out.tags = [...tags[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const fam = /\bfam: "([^"]+)"/.exec(line);
  if (fam) out.fam = fam[1];
  const w = /\bw: ([0-9.]+)/.exec(line);
  if (w) out.w = Number(w[1]);
  const cd = /\bcd: ([0-9]+)/.exec(line);
  if (cd) out.cd = Number(cd[1]);
  const status = /\bstatus: "([^"]+)"/.exec(line);
  if (status) out.status = status[1];
  return out;
}

/** Escribe la carta como una línea del catálogo, con el mismo estilo que el resto. */
export function cardLine(suffix: string, card: CustomCard, keep: Preserved): string {
  const parts: string[] = [`id: ${q(suffix)}`, `t: ${q(card.t)}`, `x: ${q(card.x)}`, `c: ${q(card.c)}`, `f: ${q(card.f)}`, `s: ${card.s}`];
  if (card.i) parts.push(`i: ${q(card.i)}`);
  if (card.sizes) parts.push(`sizes: ${list(card.sizes)}`);
  if (card.req?.length) parts.push(`req: ${list(card.req)}`);
  if (card.pair?.length) parts.push(`pair: ${list(card.pair)}`);
  if (card.aud?.length) parts.push(`aud: ${list(card.aud)}`);
  if (card.audScope) parts.push(`audScope: ${q(card.audScope)}`);
  if (card.d) parts.push(`d: ${list(card.d)}`);
  if (card.g?.length) parts.push(`g: ${list(card.g)}`);
  if (card.mixta) parts.push(`mixta: true`);
  if (card.genero) parts.push(`genero: ${q(card.genero)}`);
  if (keep.tags?.length) parts.push(`tags: ${list(keep.tags)}`);
  if (keep.fam) parts.push(`fam: ${q(keep.fam)}`);
  if (keep.w !== undefined) parts.push(`w: ${keep.w}`);
  if (keep.cd !== undefined) parts.push(`cd: ${keep.cd}`);
  if (keep.status) parts.push(`status: ${q(keep.status)}`);
  // Fecha de la edición: la carta sale con prioridad de novedad un tiempo.
  const nv = card.creada?.slice(0, 10);
  if (nv && /^\d{4}-\d{2}-\d{2}$/.test(nv)) parts.push(`nv: ${q(nv)}`);
  return `  { ${parts.join(", ")} },`;
}

/** Índice de la línea de la carta en el archivo, o -1 si no está (o está repetida). */
export function findCardLine(lines: readonly string[], suffix: string): number {
  const re = new RegExp(`^\\s*\\{ id: "${suffix.replace(/[^a-z0-9]/gi, "")}",`);
  const hits = lines.map((l, i) => (re.test(l) ? i : -1)).filter((i) => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}

/** Reemplaza la carta en el texto del archivo; null si no la encuentra. */
export function replaceCard(fileText: string, suffix: string, card: CustomCard): string | null {
  const lines = fileText.split("\n");
  const i = findCardLine(lines, suffix);
  if (i < 0) return null;
  lines[i] = cardLine(suffix, card, preservedFrom(lines[i]));
  return lines.join("\n");
}
