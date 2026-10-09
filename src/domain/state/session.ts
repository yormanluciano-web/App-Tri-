import { INTENSITY_LABEL, MINI_GAMES, SCHEMA_VERSION, type GameId, type Intensity, type Light, type Permission } from "../models/constants";
import type {
  LimitProfile,
  ParticipantId,
  SessionConfig,
  SessionState,
  SessionStatus,
  SessionStats,
  Turn,
  TurnOutcome,
} from "../models/session";
import { fearlessLevelAt, fearlessProgress, newProgress, nextLevel, LEVEL_ORDER } from "../engine/progression";
import { comboKeys, VARIETY, type Candidate } from "../engine/select";
import { randomId, type Rng } from "../engine/rng";

export const NOTICE = {
  rejected: "Elegiremos otra actividad.",
  levelKept: "Se mantiene el nivel actual.",
  levelUp: "Nueva intensidad activada.",
  limitsChanged: "Los límites cambiaron. La actividad anterior se descartó.",
  noCandidates: "No hay actividades compatibles ahora mismo.",
  exhausted: "Ya se mostraron las actividades disponibles de este juego por ahora.",
  autoStopped: "Bajaron de nivel: la subida automática de «Sin miedo» se detuvo. Para volver a subir, todos deben aceptar en privado.",
} as const;

/** Aviso de subida automática en «Sin miedo». */
export function autoLevelNotice(level: Intensity): string {
  return `¡Sin miedo! Ahora juegan en ${INTENSITY_LABEL[level]}, como lo aceptaron al empezar. Cualquiera puede bajar, pausar o detener cuando quiera.`;
}

/** Progresión al entrar a un nivel: en «Sin miedo» los tramos siguen su calendario. */
function levelProgress(state: Pick<SessionState, "config" | "autoAscent">, level: Intensity, activeMs: number) {
  return state.autoAscent ? fearlessProgress(level, activeMs) : newProgress(state.config.durationMin, activeMs);
}

/** Estados en los que corre el tiempo activo de la sesión. */
const ACTIVE_STATUSES: readonly SessionStatus[] = ["ready", "selecting", "playing", "roundReveal"];

function emptyStats(ids: readonly ParticipantId[]): SessionStats {
  const zero = () => Object.fromEntries(ids.map((id) => [id, 0]));
  return { offered: zero(), completed: zero(), sinceProtagonist: zero(), shared: zero(), combos: {}, maxWaitObserved: 0 };
}

export function surpriseInterval(rng: Rng): number {
  return 4 + Math.floor(rng() * 4); // 4..7
}

export function createSession(
  config: SessionConfig,
  opts: { now: number; contentVersion: number; seed: number; rng: Rng; id?: string },
): SessionState {
  const ids = config.participants.map((p) => p.id);
  const firstGame = config.games[0];
  const autoAscent = config.games.includes("sin_miedo");
  return {
    id: opts.id ?? randomId("s_"),
    schemaVersion: SCHEMA_VERSION,
    contentVersion: opts.contentVersion,
    version: 1,
    status: "awaitingInitialConsent",
    pausedFrom: null,
    config,
    level: config.initialLevel,
    limitsVersion: 1,
    activeMs: 0,
    lastTickAt: null,
    progress: autoAscent ? fearlessProgress(config.initialLevel, 0) : newProgress(config.durationMin, 0),
    turnCounter: 0,
    currentGame: firstGame,
    gameUsage: {},
    currentTurn: null,
    history: [],
    stats: emptyStats(ids),
    nextSurpriseAt: config.games.includes("sorpresa") ? surpriseInterval(opts.rng) : null,
    pending: {},
    chain: null,
    timer: null,
    notice: null,
    stopped: false,
    changesInOpportunity: 0,
    ...(autoAscent ? { autoAscent: true } : {}),
    seed: opts.seed,
    startedAt: opts.now,
    updatedAt: opts.now,
  };
}

/** Acumula tiempo activo. Pausas y pantallas de consentimiento no consumen tiempo. */
export function tick(state: SessionState, now: number): SessionState {
  const counting = ACTIVE_STATUSES.includes(state.status);
  let activeMs = state.activeMs;
  if (counting && state.lastTickAt !== null && now > state.lastTickAt) activeMs += now - state.lastTickAt;
  return { ...state, activeMs, lastTickAt: counting ? now : null, updatedAt: now };
}

function withStatus(state: SessionState, status: SessionStatus, now: number): SessionState {
  const s = tick(state, now);
  const counting = ACTIVE_STATUSES.includes(status);
  return { ...s, status, lastTickAt: counting ? now : null, version: s.version + 1 };
}

function freezeTimer(state: SessionState, now: number): SessionState {
  const t = state.timer;
  if (!t || !t.running || t.startedAt === null) return state;
  const remaining = Math.max(0, t.remainingMs - (now - t.startedAt));
  return { ...state, timer: { ...t, running: false, startedAt: null, remainingMs: remaining } };
}

// ---------------------------------------------------------------- inicio

export function resolveInitialConsent(state: SessionState, accepted: boolean, now: number): SessionState {
  if (state.status !== "awaitingInitialConsent") return state;
  if (!accepted) return { ...withStatus(state, "setup", now) };
  return withStatus({ ...state, progress: levelProgress(state, state.level, 0) }, "ready", now);
}

/**
 * «Sin miedo»: si el tiempo activo ya corresponde a un nivel más alto, sube
 * (solo entre cartas, nunca a mitad de una). Todas las personas lo aceptaron en
 * privado al empezar; los límites personales siguen filtrando cada carta.
 * Nunca baja ni sube si alguien bajó el nivel durante la sesión.
 */
export function applyAutoAscent(state: SessionState, now: number): SessionState {
  if (!state.autoAscent) return state;
  if (!["ready", "selecting", "blocked"].includes(state.status)) return state;
  if (state.currentTurn && state.currentTurn.status !== "closed") return state;
  const s = tick(state, now);
  const target = fearlessLevelAt(s.activeMs);
  if (LEVEL_ORDER.indexOf(target) <= LEVEL_ORDER.indexOf(s.level)) return s;
  return withStatus({ ...s, level: target, progress: fearlessProgress(target, s.activeMs), notice: autoLevelNotice(target), chain: null }, "ready", now);
}

// ---------------------------------------------------------------- turnos

export interface OfferMeta {
  game: GameId;
  focusable: ParticipantId[];
  chainStage?: number;
  fromSurprise?: boolean;
  repeatException?: boolean;
}

/** Registra la carta seleccionada como oferta de la oportunidad abierta. */
export function offerTurn(state: SessionState, candidate: Candidate, meta: OfferMeta, now: number): SessionState {
  if (!["ready", "selecting", "playing", "blocked"].includes(state.status)) return state;
  if (state.currentTurn && state.currentTurn.status !== "closed") return state;
  const a = candidate.activity;
  const firstOfferInOpportunity = state.changesInOpportunity === 0;
  const turn: Turn = {
    id: randomId("t_"),
    opportunity: state.turnCounter,
    activityId: a.id,
    contentVersion: a.contentVersion,
    game: meta.game,
    assignment: candidate.assignment,
    implicated: candidate.implicated,
    protagonist: candidate.protagonist,
    focusable: meta.focusable,
    combos: comboKeys(a, candidate.implicated, candidate.assignment),
    needsConsent: candidate.needsConsent,
    consentAskees: candidate.askees,
    authorized: !candidate.needsConsent,
    limitsVersion: state.limitsVersion,
    status: candidate.needsConsent ? "awaiting_consent" : "ready",
    chainStage: meta.chainStage,
    fromSurprise: meta.fromSurprise,
    repeatException: meta.repeatException,
  };
  const history = [
    ...state.history,
    { activityId: a.id, familyId: a.familyId, category: a.categoria, game: meta.game, opportunity: state.turnCounter, rejected: false },
  ].slice(-120);
  const next: SessionState = {
    ...state,
    currentTurn: turn,
    history,
    notice: null,
    stopped: false,
    timer: null,
    progress: firstOfferInOpportunity
      ? { ...state.progress, turnsOfferedInLevel: state.progress.turnsOfferedInLevel + 1 }
      : state.progress,
  };
  return withStatus(next, candidate.needsConsent ? "awaitingActivityConsent" : "playing", now);
}

export function markBlocked(state: SessionState, reason: "sin_candidatos" | "agotado", now: number): SessionState {
  const s = withStatus({ ...state, notice: reason === "agotado" ? NOTICE.exhausted : NOTICE.noCandidates }, "blocked", now);
  return s;
}

function isLive(state: SessionState, turnId: string): boolean {
  const t = state.currentTurn;
  return !!t && t.id === turnId && t.status !== "closed";
}

/** Resultado agregado de una autorización puntual. Sin autoría ni recuentos. */
export function resolveActivityConsent(
  state: SessionState,
  ev: { turnId: string; limitsVersion: number; accepted: boolean },
  now: number,
): SessionState {
  if (state.status !== "awaitingActivityConsent" || !isLive(state, ev.turnId)) return state;
  const turn = state.currentTurn!;
  // Una autorización vale solo para la versión de límites con que se pidió.
  if (ev.limitsVersion !== state.limitsVersion || turn.limitsVersion !== state.limitsVersion) return state;
  if (ev.accepted) {
    return withStatus({ ...state, currentTurn: { ...turn, authorized: true, status: "ready" } }, "playing", now);
  }
  const history = state.history.slice();
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].activityId === turn.activityId && history[i].opportunity === turn.opportunity) {
      history[i] = { ...history[i], rejected: true };
      break;
    }
  }
  return withStatus(
    {
      ...state,
      history,
      currentTurn: { ...turn, status: "closed", outcome: "rechazado", authorized: false },
      notice: NOTICE.rejected,
      changesInOpportunity: state.changesInOpportunity + 1,
    },
    "selecting",
    now,
  );
}

/** Cambiar: reemplaza la carta dentro de la misma oportunidad. */
export function changeTurn(state: SessionState, turnId: string, now: number): SessionState {
  if (!isLive(state, turnId)) return state;
  const turn = state.currentTurn!;
  const s = freezeTimer(state, now);
  const changes = state.changesInOpportunity + 1;
  if (changes > VARIETY.maxChangesPerOpportunity) return closeTurn(s, turnId, "pasado", now);
  return withStatus(
    { ...s, timer: null, currentTurn: { ...turn, status: "closed", outcome: "cambiado" }, changesInOpportunity: changes },
    "selecting",
    now,
  );
}

/** Cierra la oportunidad (Cumplido, Pasar o Detener). Idempotente por turno. */
export function closeTurn(state: SessionState, turnId: string, outcome: TurnOutcome, now: number): SessionState {
  if (!isLive(state, turnId)) return state;
  const turn = state.currentTurn!;
  const ids = state.config.participants.map((p) => p.id);
  const stats: SessionStats = {
    offered: { ...state.stats.offered },
    completed: { ...state.stats.completed },
    sinceProtagonist: { ...state.stats.sinceProtagonist },
    shared: { ...state.stats.shared },
    combos: { ...state.stats.combos },
    maxWaitObserved: state.stats.maxWaitObserved,
  };
  const isGroup = turn.protagonist === null;
  const participatedAsFocus = isGroup ? ids : [turn.protagonist!];
  for (const pid of ids) {
    if (participatedAsFocus.includes(pid)) {
      stats.offered[pid] = (stats.offered[pid] ?? 0) + 1;
      stats.sinceProtagonist[pid] = 0;
    } else if (turn.focusable.includes(pid)) {
      stats.sinceProtagonist[pid] = (stats.sinceProtagonist[pid] ?? 0) + 1;
      stats.maxWaitObserved = Math.max(stats.maxWaitObserved, stats.sinceProtagonist[pid]);
    }
    if (turn.implicated.includes(pid) && !participatedAsFocus.includes(pid)) stats.shared[pid] = (stats.shared[pid] ?? 0) + 1;
    if (outcome === "cumplido" && turn.implicated.includes(pid)) stats.completed[pid] = (stats.completed[pid] ?? 0) + 1;
  }
  for (const key of turn.combos) stats.combos[key] = (stats.combos[key] ?? 0) + 1;

  const usage = { ...state.gameUsage, [turn.game]: (state.gameUsage[turn.game] ?? 0) + 1 };
  let chain = state.chain;
  if (turn.chainStage !== undefined && chain) {
    chain = turn.chainStage >= 2 ? null : { ...chain, stage: turn.chainStage + 1 };
  }
  const pending = { ...state.pending };
  if (pending.forcedProtagonist && turn.protagonist === pending.forcedProtagonist) delete pending.forcedProtagonist;
  if (pending.forcedAssignment) delete pending.forcedAssignment;
  if (pending.repeatActivityId && turn.repeatException) delete pending.repeatActivityId;
  if (pending.miniRemaining !== undefined) {
    pending.miniRemaining -= 1;
    if (pending.miniRemaining <= 0) delete pending.miniRemaining;
  }
  const s = freezeTimer(state, now);
  return withStatus(
    {
      ...s,
      stats,
      chain,
      pending,
      gameUsage: usage,
      timer: null,
      turnCounter: state.turnCounter + 1,
      changesInOpportunity: 0,
      currentTurn: { ...turn, status: "closed", outcome },
    },
    "ready",
    now,
  );
}

// ---------------------------------------------------------------- temporizador

export function startTimer(state: SessionState, turnId: string, durationMs: number, now: number): SessionState {
  if (state.status !== "playing" || !isLive(state, turnId)) return state;
  const turn = state.currentTurn!;
  // El reloj solo empieza con una actividad autorizada.
  if (!turn.authorized || turn.limitsVersion !== state.limitsVersion) return state;
  if (!(durationMs > 0 && durationMs <= 10 * 60_000)) return state;
  return {
    ...tick(state, now),
    version: state.version + 1,
    currentTurn: { ...turn, status: "running" },
    timer: { turnId, durationMs, remainingMs: durationMs, running: true, startedAt: now },
  };
}

export function pauseTimer(state: SessionState, turnId: string, now: number): SessionState {
  if (!state.timer || state.timer.turnId !== turnId) return state;
  return { ...freezeTimer(state, now), version: state.version + 1 };
}

export function resumeTimer(state: SessionState, turnId: string, now: number): SessionState {
  const t = state.timer;
  if (!t || t.turnId !== turnId || t.running || state.status !== "playing" || !isLive(state, turnId)) return state;
  if (t.remainingMs <= 0) return state;
  return { ...state, version: state.version + 1, timer: { ...t, running: true, startedAt: now } };
}

export function timerRemaining(state: SessionState, now: number): number {
  const t = state.timer;
  if (!t) return 0;
  if (!t.running || t.startedAt === null) return t.remainingMs;
  return Math.max(0, t.remainingMs - (now - t.startedAt));
}

/** Fin del reloj: un evento antiguo (otro turno) se ignora. No obliga a nada. */
export function timerFinished(state: SessionState, turnId: string, now: number): SessionState {
  const t = state.timer;
  if (!t || t.turnId !== turnId || !isLive(state, turnId)) return state;
  if (timerRemaining(state, now) > 0) return state;
  return { ...state, version: state.version + 1, timer: { ...t, running: false, startedAt: null, remainingMs: 0 } };
}

// ---------------------------------------------------------------- pausa y detener

export function pause(state: SessionState, now: number): SessionState {
  if (state.status === "paused" || state.status === "finished" || state.status === "setup") return state;
  const s = freezeTimer(state, now);
  return withStatus({ ...s, pausedFrom: state.status }, "paused", now);
}

export function resume(state: SessionState, now: number): SessionState {
  if (state.status !== "paused") return state;
  let target: SessionStatus = state.pausedFrom ?? "ready";
  const turn = state.currentTurn;
  if (!turn || turn.status === "closed") target = target === "awaitingInitialConsent" ? target : "ready";
  if (target === "paused") target = "ready";
  // Al volver no se reanuda el reloj automáticamente.
  return withStatus({ ...state, pausedFrom: null, stopped: false }, target, now);
}

/** Detener gana prioridad: interrumpe actividad y reloj de inmediato. */
export function stop(state: SessionState, now: number): SessionState {
  if (state.status === "finished" || state.status === "setup") return state;
  let s = freezeTimer(state, now);
  if (s.currentTurn && s.currentTurn.status !== "closed") {
    const t = s.currentTurn;
    if (t.authorized) s = closeTurn(s, t.id, "detenido", now);
    else s = { ...s, currentTurn: { ...t, status: "closed", outcome: "detenido" } };
  }
  return withStatus({ ...s, timer: null, stopped: true, pausedFrom: "ready", chain: null, pending: {} }, "paused", now);
}

export function finish(state: SessionState, now: number): SessionState {
  const s = freezeTimer(state, now);
  return withStatus({ ...s, timer: null, currentTurn: s.currentTurn ? { ...s.currentTurn, status: "closed" } : null }, "finished", now);
}

// ---------------------------------------------------------------- niveles

function cancelCurrent(state: SessionState): SessionState {
  const t = state.currentTurn;
  return {
    ...state,
    timer: null,
    chain: null,
    pending: {},
    changesInOpportunity: 0,
    currentTurn: t && t.status !== "closed" ? { ...t, status: "closed", outcome: "invalidado" } : t,
  };
}

/** Bajar: inmediato, sin votación; cancela autorizaciones y actividades del nivel superior. */
export function lowerLevel(state: SessionState, target: Intensity, now: number): SessionState {
  if (LEVEL_ORDER.indexOf(target) >= LEVEL_ORDER.indexOf(state.level)) return state;
  const s = cancelCurrent(tick(state, now));
  // Bajar apaga la subida automática de «Sin miedo»: volver a subir pide unanimidad otra vez.
  const next: SessionState = {
    ...s,
    level: target,
    ...(state.autoAscent ? { autoAscent: false } : {}),
    progress: newProgress(state.config.durationMin, s.activeMs),
    notice: state.autoAscent ? NOTICE.autoStopped : null,
  };
  if (state.status === "paused") return { ...next, version: s.version + 1, pausedFrom: "ready" };
  return withStatus(next, "ready", now);
}

export function requestLevelUp(state: SessionState, now: number): SessionState {
  if (!nextLevel(state.level)) return state;
  if (!["ready", "paused", "playing", "blocked"].includes(state.status)) return state;
  const s = freezeTimer(state, now);
  return withStatus({ ...s, pausedFrom: state.status === "paused" ? state.pausedFrom : state.status }, "awaitingLevelConsent", now);
}

/** Subir solo con unanimidad. El rechazo no revela quién ni cuántos. */
export function resolveLevelUp(state: SessionState, accepted: boolean, now: number): SessionState {
  if (state.status !== "awaitingLevelConsent") return state;
  const target = nextLevel(state.level);
  if (!accepted || !target) {
    const back: SessionStatus = state.currentTurn && state.currentTurn.status !== "closed" ? "playing" : "ready";
    return withStatus({ ...state, notice: NOTICE.levelKept, pausedFrom: null }, back, now);
  }
  const s = cancelCurrent(tick(state, now));
  return withStatus(
    { ...s, level: target, progress: levelProgress(s, target, s.activeMs), notice: NOTICE.levelUp, pausedFrom: null },
    "ready",
    now,
  );
}

// ---------------------------------------------------------------- límites

/** Editar límites invalida carta, cola, cadena, reloj y autorizaciones. */
export function updateParticipantLimits(state: SessionState, participantId: ParticipantId, limits: LimitProfile, now: number): SessionState {
  const idx = state.config.participants.findIndex((p) => p.id === participantId);
  if (idx < 0) return state;
  const participants = state.config.participants.slice();
  const prev = participants[idx];
  participants[idx] = { ...prev, limits: { ...limits, version: prev.limits.version + 1 } };
  const s = cancelCurrent(tick(state, now));
  const next = { ...s, config: { ...s.config, participants }, limitsVersion: state.limitsVersion + 1, notice: NOTICE.limitsChanged };
  return afterLimitChange(state, next, now);
}

export function updateSharedLimits(state: SessionState, shared: Partial<Record<Permission, Light>>, now: number): SessionState {
  const s = cancelCurrent(tick(state, now));
  const next = { ...s, config: { ...s.config, sharedLimits: { ...shared } }, limitsVersion: state.limitsVersion + 1, notice: NOTICE.limitsChanged };
  return afterLimitChange(state, next, now);
}

function afterLimitChange(prev: SessionState, next: SessionState, now: number): SessionState {
  if (prev.status === "paused") return { ...next, version: prev.version + 1, pausedFrom: "ready" };
  if (prev.status === "awaitingInitialConsent" || prev.status === "setup") return { ...next, version: prev.version + 1 };
  return withStatus(next, "ready", now);
}

// ---------------------------------------------------------------- juego y efectos

export function setGame(state: SessionState, game: GameId, now: number): SessionState {
  // Los minijuegos también pueden jugarse como ronda especial aunque no se eligieran al empezar.
  if (!state.config.games.includes(game) && !MINI_GAMES.includes(game) && !(state.config.games.includes("caos") || state.config.games.includes("noche") || state.config.games.includes("sin_miedo"))) return state;
  const s = cancelCurrent(tick(state, now));
  const status: SessionStatus = state.status === "paused" ? "paused" : "ready";
  const next = { ...s, currentGame: game, chain: game === "cadena" ? { stage: 0, lastScore: -1 } : null };
  if (status === "paused") return { ...next, version: s.version + 1, pausedFrom: "ready" };
  return withStatus(next, "ready", now);
}

export function startChain(state: SessionState): SessionState {
  return { ...state, chain: { stage: 0, lastScore: -1 }, version: state.version + 1 };
}

export function setChainScore(state: SessionState, score: number): SessionState {
  if (!state.chain) return state;
  return { ...state, chain: { ...state.chain, lastScore: score } };
}

export function setPending(state: SessionState, pending: SessionState["pending"]): SessionState {
  return { ...state, pending: { ...state.pending, ...pending }, version: state.version + 1 };
}

export function scheduleNextSurprise(state: SessionState, rng: Rng): SessionState {
  if (!state.config.games.includes("sorpresa")) return state;
  return { ...state, nextSurpriseAt: state.turnCounter + surpriseInterval(rng) };
}

export function isSurpriseDue(state: SessionState): boolean {
  return state.nextSurpriseAt !== null && state.turnCounter >= state.nextSurpriseAt;
}

export function enterReveal(state: SessionState, now: number): SessionState {
  if (state.status !== "playing") return state;
  return withStatus(state, "roundReveal", now);
}

export function leaveReveal(state: SessionState, now: number): SessionState {
  if (state.status !== "roundReveal") return state;
  return withStatus(state, "playing", now);
}

export function clearNotice(state: SessionState): SessionState {
  return state.notice ? { ...state, notice: null } : state;
}

/** Tras «permitir repetir» o cambiar de juego, sale del bloqueo. */
export function unblock(state: SessionState, now: number): SessionState {
  if (state.status !== "blocked") return state;
  return withStatus({ ...state, notice: null }, "ready", now);
}

/** Desde el panel de Detener: vuelve a la pausa normal sin reanudar nada. */
export function dismissStopPanel(state: SessionState): SessionState {
  return state.stopped ? { ...state, stopped: false, version: state.version + 1 } : state;
}

/** Salir de la cadena: descarta las etapas restantes sin penalización. */
export function exitChain(state: SessionState, now: number): SessionState {
  if (!state.chain) return state;
  const s = { ...tick(state, now), chain: null, version: state.version + 1 };
  return s;
}
