import type { Activity } from "@/domain/models/activity";
import { PERMISSIONS, type GameId, type Intensity, type Light, type Permission } from "@/domain/models/constants";
import type { Participant, SessionConfig, SessionState } from "@/domain/models/session";
import { neutralSharedLimits, newLimitProfile } from "@/domain/consent/limits";
import { createSession, resolveInitialConsent } from "@/domain/state/session";
import { seededRng } from "@/domain/engine/rng";
import { defineCards, type CardInput } from "@/data/define";

export function allLights(light: Light): Record<Permission, Light> {
  return Object.fromEntries(PERMISSIONS.map((p) => [p, light])) as Record<Permission, Light>;
}

export function participant(id: string, perms?: Partial<Record<Permission, Light>>): Participant {
  const limits = newLimitProfile();
  if (perms) limits.permissions = { ...limits.permissions, ...perms };
  return { id, alias: id.toUpperCase(), slot: 0, adultDeclared: true, limits, preferences: { preferred: [], avoided: [] } };
}

export function config(
  participants: Participant[],
  opts: Partial<Pick<SessionConfig, "initialLevel" | "durationMin" | "games" | "sharedLimits" | "mode">> = {},
): SessionConfig {
  return {
    mode: opts.mode ?? "private",
    participants,
    relationship: null,
    initialLevel: opts.initialLevel ?? "leve",
    durationMin: opts.durationMin === undefined ? null : opts.durationMin,
    games: opts.games ?? (["tarjetas"] as GameId[]),
    sharedLimits: opts.sharedLimits ?? neutralSharedLimits(),
  };
}

export function readySession(cfg: SessionConfig, seed = 1, now = 0): SessionState {
  const s = createSession(cfg, { now, contentVersion: 1, seed, rng: seededRng(seed), id: "s_test" });
  return resolveInitialConsent(s, true, now);
}

let counter = 0;
/** Catálogo sintético donde todas las combinaciones son igualmente elegibles. */
export function syntheticCatalog(level: Intensity, perLevel = 40, extra: Partial<CardInput> = {}): Activity[] {
  const cards: CardInput[] = [];
  const base = level === "leve" ? 0 : level === "picante" ? 31 : 66;
  for (let i = 0; i < perLevel; i++) {
    const kind = i % 4;
    const n = String(++counter).padStart(4, "0");
    const s = base + (i % 10);
    if (kind === 0) cards.push({ id: n, t: `Solo ${n}`, x: `{p1}, actividad individual de prueba número ${n}.`, c: "retos", f: "reto", s, req: ["conversacion_ligera"], cd: 12, ...extra });
    if (kind === 1) cards.push({ id: n, t: `Par ${n}`, x: `{p1} y {p2}, actividad de pareja de prueba número ${n}.`, c: "pareja", f: "reto", s, req: ["conversacion_ligera"], cd: 12, ...extra });
    if (kind === 2) cards.push({ id: n, t: `Dirigida ${n}`, x: `{p1} le propone a {p2} la actividad dirigida número ${n}.`, c: "conexion", f: "pregunta", s, i: "directed_pair", req: ["conversacion_ligera"], cd: 12, ...extra });
    if (kind === 3) cards.push({ id: n, t: `Pregunta ${n}`, x: `{p1}, responde la pregunta de prueba número ${n}.`, c: "preguntas", f: "pregunta", s, req: ["conversacion_ligera"], cd: 12, ...extra });
  }
  return defineCards(level, `syn${level[0]}`, "test", cards);
}
