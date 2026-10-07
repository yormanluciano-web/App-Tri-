import { z } from "zod";
import type { Activity } from "@/domain/models/activity";
import {
  CATEGORIES,
  GAMES,
  INTENSITIES,
  LIGHTS,
  PERMISSIONS,
  RELATIONSHIPS,
  ROLE_IDS,
  SCHEMA_VERSION,
} from "@/domain/models/constants";
import type { SessionState, SessionStatus, Turn } from "@/domain/models/session";
import { evaluateAssignment } from "@/domain/consent/limits";

/**
 * Serialización con lista explícita de campos. Nunca se guarda el objeto
 * completo: respuestas, votos, autorías y autorizaciones en curso no salen
 * de la memoria.
 */

const light = z.enum(LIGHTS);
const permMap = z.partialRecord(z.enum(PERMISSIONS), light);

const participantSchema = z.object({
  id: z.string().min(1).max(40),
  alias: z.string().trim().min(1).max(24),
  slot: z.number().int().min(0).max(2),
  adultDeclared: z.literal(true),
  limits: z.object({
    version: z.number().int().min(1),
    permissions: permMap,
    pairOverrides: z.record(z.string(), permMap),
  }),
  preferences: z.object({ preferred: z.array(z.enum(CATEGORIES)), avoided: z.array(z.enum(CATEGORIES)) }),
});

const turnSchema = z.object({
  id: z.string(),
  opportunity: z.number().int().min(0),
  activityId: z.string(),
  contentVersion: z.number().int(),
  game: z.enum(GAMES),
  assignment: z.partialRecord(z.enum(ROLE_IDS), z.string()),
  implicated: z.array(z.string()),
  protagonist: z.string().nullable(),
  focusable: z.array(z.string()),
  combos: z.array(z.string()),
  needsConsent: z.boolean(),
  consentAskees: z.array(z.string()),
  limitsVersion: z.number().int(),
  status: z.enum(["awaiting_consent", "ready", "running", "closed"]),
  outcome: z.enum(["cumplido", "pasado", "cambiado", "rechazado", "detenido", "invalidado"]).optional(),
  chainStage: z.number().int().min(0).max(2).optional(),
  fromSurprise: z.boolean().optional(),
});

const counts = z.record(z.string(), z.number().int().min(0));

export const persistedSessionSchema = z.object({
  kind: z.literal("trio-session"),
  schemaVersion: z.literal(SCHEMA_VERSION),
  contentVersion: z.number().int().positive(),
  id: z.string(),
  version: z.number().int(),
  status: z.enum([
    "setup",
    "awaitingInitialConsent",
    "ready",
    "selecting",
    "awaitingActivityConsent",
    "playing",
    "paused",
    "awaitingLevelConsent",
    "roundReveal",
    "finished",
    "blocked",
  ]),
  config: z.object({
    mode: z.literal("normal"),
    participants: z.array(participantSchema).min(2).max(3),
    relationship: z.enum(RELATIONSHIPS).nullable(),
    initialLevel: z.enum(INTENSITIES),
    durationMin: z.number().int().positive().nullable(),
    games: z.array(z.enum(GAMES)).min(1),
    sharedLimits: permMap,
  }),
  level: z.enum(INTENSITIES),
  limitsVersion: z.number().int().min(1),
  activeMs: z.number().min(0),
  progress: z.object({
    enteredAtActiveMs: z.number().min(0),
    horizonMs: z.number().min(0).nullable(),
    turnsOfferedInLevel: z.number().int().min(0),
  }),
  turnCounter: z.number().int().min(0),
  currentGame: z.enum(GAMES),
  gameUsage: z.partialRecord(z.enum(GAMES), z.number().int().min(0)),
  currentTurn: turnSchema.nullable(),
  history: z.array(
    z.object({
      activityId: z.string(),
      familyId: z.string(),
      category: z.enum(CATEGORIES),
      game: z.enum(GAMES),
      opportunity: z.number().int().min(0),
      rejected: z.boolean(),
    }),
  ),
  stats: z.object({
    offered: counts,
    completed: counts,
    sinceProtagonist: counts,
    shared: counts,
    combos: counts,
    maxWaitObserved: z.number().int().min(0),
  }),
  nextSurpriseAt: z.number().int().nullable(),
  chain: z.object({ stage: z.number().int().min(0).max(2), lastScore: z.number() }).nullable(),
  timerRemainingMs: z.number().min(0).nullable(),
  seed: z.number().int(),
  startedAt: z.number(),
  savedAt: z.number(),
});

export type PersistedSession = z.infer<typeof persistedSessionSchema>;

function pickTurn(t: Turn | null): PersistedSession["currentTurn"] {
  if (!t) return null;
  return {
    id: t.id,
    opportunity: t.opportunity,
    activityId: t.activityId,
    contentVersion: t.contentVersion,
    game: t.game,
    assignment: { ...t.assignment },
    implicated: [...t.implicated],
    protagonist: t.protagonist,
    focusable: [...t.focusable],
    combos: [...t.combos],
    needsConsent: t.needsConsent,
    consentAskees: [...t.consentAskees],
    limitsVersion: t.limitsVersion,
    status: t.status,
    ...(t.outcome ? { outcome: t.outcome } : {}),
    ...(t.chainStage !== undefined ? { chainStage: t.chainStage } : {}),
    ...(t.fromSurprise ? { fromSurprise: true } : {}),
  };
}

/** Solo sesiones normales se serializan. Una sesión privada lanza error. */
export function toPersisted(state: SessionState, now: number): PersistedSession {
  if (state.config.mode !== "normal") throw new Error("Una sesión privada no se persiste");
  const c = state.config;
  return {
    kind: "trio-session",
    schemaVersion: SCHEMA_VERSION,
    contentVersion: state.contentVersion,
    id: state.id,
    version: state.version,
    status: state.status,
    config: {
      mode: "normal",
      participants: c.participants.map((p) => ({
        id: p.id,
        alias: p.alias,
        slot: p.slot,
        adultDeclared: true as const,
        limits: {
          version: p.limits.version,
          permissions: { ...p.limits.permissions },
          pairOverrides: Object.fromEntries(Object.entries(p.limits.pairOverrides).map(([k, v]) => [k, { ...v }])),
        },
        preferences: { preferred: [...p.preferences.preferred], avoided: [...p.preferences.avoided] },
      })),
      relationship: c.relationship,
      initialLevel: c.initialLevel,
      durationMin: c.durationMin,
      games: [...c.games],
      sharedLimits: { ...c.sharedLimits },
    },
    level: state.level,
    limitsVersion: state.limitsVersion,
    activeMs: state.activeMs,
    progress: { ...state.progress },
    turnCounter: state.turnCounter,
    currentGame: state.currentGame,
    gameUsage: { ...state.gameUsage },
    currentTurn: pickTurn(state.currentTurn),
    history: state.history.map((h) => ({ ...h })),
    stats: {
      offered: { ...state.stats.offered },
      completed: { ...state.stats.completed },
      sinceProtagonist: { ...state.stats.sinceProtagonist },
      shared: { ...state.stats.shared },
      combos: { ...state.stats.combos },
      maxWaitObserved: state.stats.maxWaitObserved,
    },
    nextSurpriseAt: state.nextSurpriseAt,
    chain: state.chain ? { ...state.chain } : null,
    timerRemainingMs: state.timer ? state.timer.remainingMs : null,
    seed: state.seed,
    startedAt: state.startedAt,
    savedAt: now,
  };
}

/** Juegos retirados (p. ej. «¿Quién es más probable?») se eliminan de sesiones antiguas. */
const RETIRED_GAMES = new Set(["mas_probable"]);
function dropRetiredGames(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown> & { config?: { games?: unknown[] }; history?: { game?: string }[]; gameUsage?: Record<string, number> };
  const swap = (g: unknown) => (typeof g === "string" && RETIRED_GAMES.has(g) ? "tarjetas" : g);
  const games = Array.isArray(r.config?.games) ? r.config!.games!.filter((g) => !(typeof g === "string" && RETIRED_GAMES.has(g))) : r.config?.games;
  const usage = r.gameUsage && typeof r.gameUsage === "object" ? Object.fromEntries(Object.entries(r.gameUsage).filter(([k]) => !RETIRED_GAMES.has(k))) : r.gameUsage;
  const turn = r.currentTurn as { game?: unknown } | null | undefined;
  return {
    ...r,
    config: r.config ? { ...r.config, games: games && (games as unknown[]).length ? games : ["tarjetas"] } : r.config,
    currentGame: swap(r.currentGame),
    gameUsage: usage,
    history: Array.isArray(r.history) ? r.history.map((h) => ({ ...h, game: swap(h.game) })) : r.history,
    currentTurn: turn ? { ...turn, game: swap(turn.game) } : turn,
  };
}

export type RestoreResult =
  | { ok: true; state: SessionState; note: string | null }
  | { ok: false; reason: "invalid" | "unsupported" | "finished" };

/**
 * Restaura desde un punto seguro: nunca reanuda reloj ni autorizaciones,
 * revalida cartas y versiones, y entra siempre en pausa con «Continuar».
 */
export function fromPersisted(raw: unknown, catalog: readonly Activity[], contentVersion: number, now: number): RestoreResult {
  if (raw && typeof raw === "object" && (raw as { schemaVersion?: unknown }).schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, reason: "unsupported" };
  }
  const parsed = persistedSessionSchema.safeParse(dropRetiredGames(raw));
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const p = parsed.data;
  if (p.status === "finished") return { ok: false, reason: "finished" };
  const ids = p.config.participants.map((x) => x.id);
  if (new Set(ids).size !== ids.length) return { ok: false, reason: "invalid" };

  let note: string | null = null;
  let turn: Turn | null = p.currentTurn ? { ...p.currentTurn, authorized: false } : null;
  let safeStatus: SessionStatus = "ready";
  let timer: SessionState["timer"] = null;
  let chain = p.chain;

  if (turn && turn.status !== "closed") {
    const activity = catalog.find((a) => a.id === turn!.activityId);
    const contentChanged = p.contentVersion !== contentVersion || !activity || activity.contentVersion !== turn.contentVersion;
    const ev = activity
      ? evaluateAssignment(activity, turn.assignment, { participants: p.config.participants, sharedLimits: p.config.sharedLimits })
      : null;
    if (contentChanged || !ev || !ev.ok || turn.limitsVersion !== p.limitsVersion) {
      // La carta cambió o ya no es válida: se reemplazará por otra compatible.
      turn = { ...turn, status: "closed", outcome: "invalidado" };
      chain = null;
      note = "La actividad anterior ya no estaba disponible y se elegirá otra.";
    } else if (ev.needsConsent) {
      // Toda autorización interrumpida se vuelve a pedir.
      turn = { ...turn, needsConsent: true, consentAskees: ev.askees, status: "awaiting_consent", authorized: false };
      safeStatus = "awaitingActivityConsent";
    } else {
      turn = { ...turn, authorized: true, status: "ready" };
      safeStatus = "playing";
      if (p.timerRemainingMs !== null && p.timerRemainingMs > 0) {
        timer = { turnId: turn.id, durationMs: p.timerRemainingMs, remainingMs: p.timerRemainingMs, running: false, startedAt: null };
      }
    }
  }

  const state: SessionState = {
    id: p.id,
    schemaVersion: SCHEMA_VERSION,
    contentVersion,
    version: p.version + 1,
    status: "paused",
    pausedFrom: safeStatus,
    config: { ...p.config, participants: p.config.participants.map((x) => ({ ...x })) },
    level: p.level,
    limitsVersion: p.limitsVersion,
    activeMs: p.activeMs,
    lastTickAt: null,
    progress: p.progress,
    turnCounter: p.turnCounter,
    currentGame: p.currentGame,
    gameUsage: p.gameUsage,
    currentTurn: turn,
    history: p.history,
    stats: p.stats,
    nextSurpriseAt: p.nextSurpriseAt,
    pending: {},
    chain,
    timer,
    notice: note,
    stopped: false,
    changesInOpportunity: 0,
    seed: p.seed,
    startedAt: p.startedAt,
    updatedAt: now,
  };
  return { ok: true, state, note };
}
