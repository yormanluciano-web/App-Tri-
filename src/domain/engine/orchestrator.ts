import type { Activity } from "../models/activity";
import { BASE_GAMES, type Format, type GameId, type Category, type Interaction } from "../models/constants";
import type { SessionState } from "../models/session";
import { nextLevel } from "./progression";
import { pickOne, shuffle, type Rng } from "./rng";
import { selectCandidate, type Candidate, type SelectOptions, type SelectResult } from "./select";
import {
  applyAutoAscent,
  isSurpriseDue,
  markBlocked,
  offerTurn,
  scheduleNextSurprise,
  setChainScore,
  startChain,
} from "../state/session";

/** Formatos que usa cada juego base. */
export const GAME_FORMATS: Record<GameId, readonly Format[]> = {
  verdad_reto: ["pregunta", "reto"],
  ruleta: ["pregunta", "reto"],
  dados: ["pregunta", "reto"],
  tarjetas: ["pregunta", "reto"],
  temporizador: ["pregunta", "reto"],
  cadena: ["pregunta", "reto"],
  torre: ["pregunta", "reto"],
  botella: ["pregunta", "reto"],
  rasca: ["pregunta", "reto"],
  parques: ["pregunta", "reto"],
  sorpresa: ["sorpresa"],
  noche: [],
  caos: [],
  sin_miedo: [],
};

export const NIGHT = { openingMs: 10 * 60_000, closingStartMs: 50 * 60_000, totalMin: 60 };

export type NightPhase = "apertura" | "desarrollo" | "cierre";

export function nightPhase(activeMs: number): NightPhase {
  if (activeMs < NIGHT.openingMs) return "apertura";
  if (activeMs < NIGHT.closingStartMs) return "desarrollo";
  return "cierre";
}

const OPENING_GAMES: readonly GameId[] = ["verdad_reto", "tarjetas", "ruleta"];
const CLOSING_GAMES: readonly GameId[] = ["tarjetas", "temporizador", "verdad_reto"];

/** Juegos base habilitados en la sesión (para rotación, Caos y Noche completa). */
export function enabledBaseGames(state: SessionState): GameId[] {
  return state.config.games.filter((g) => BASE_GAMES.includes(g));
}

export function isMetaGame(game: GameId): boolean {
  return game === "noche" || game === "caos" || game === "sin_miedo";
}

/** Orden de juegos a intentar para la ronda, sin patrón fijo y controlando variedad. */
export function roundGameCandidates(state: SessionState, rng: Rng): GameId[] {
  const enabled = enabledBaseGames(state);
  const games = state.config.games;
  const current = state.currentGame;
  if (current === "cadena" && state.chain) return ["cadena"];
  if (games.includes("noche")) {
    const phase = nightPhase(state.activeMs);
    const pool = phase === "apertura" ? OPENING_GAMES : phase === "cierre" ? CLOSING_GAMES : enabled;
    const filtered = pool.filter((g) => enabled.includes(g));
    return byLeastUsed(filtered.length ? filtered : enabled, state, rng);
  }
  if (games.includes("caos")) return byLeastUsed(enabled, state, rng, true);
  if (games.includes("sin_miedo")) return byLeastUsed(enabled, state, rng);
  if (!BASE_GAMES.includes(current)) return byLeastUsed(enabled, state, rng);
  // Juego actual primero; si no tiene opciones, los demás seleccionados.
  return [current, ...shuffle(enabled.filter((g) => g !== current), rng)];
}

function byLeastUsed(games: readonly GameId[], state: SessionState, rng: Rng, chaotic = false): GameId[] {
  const lastGame = state.history[state.history.length - 1]?.game;
  const scored = shuffle(games, rng).map((g) => {
    let score = state.gameUsage[g] ?? 0;
    if (g === lastGame) score += chaotic ? 2 : 1;
    if (chaotic) score += rng() * 1.5;
    return { g, score };
  });
  return scored.sort((a, b) => a.score - b.score).map((x) => x.g);
}

/** Juego de la siguiente ronda tras cerrar una oportunidad. */
export function rotateGame(state: SessionState, rng: Rng): GameId {
  if (state.chain && state.currentGame === "cadena") return "cadena";
  const games = state.config.games;
  const enabled = enabledBaseGames(state);
  if (games.includes("noche") || games.includes("caos") || games.includes("sin_miedo")) return roundGameCandidates(state, rng)[0] ?? state.currentGame;
  if (enabled.length <= 1) return enabled[0] ?? state.currentGame;
  return byLeastUsed(enabled, state, rng)[0];
}

export interface DrawRequest {
  game?: GameId;
  formats?: readonly Format[];
  categories?: readonly Category[];
  allowRepeat?: boolean;
  onlyActivityId?: string;
  /** No disparar sorpresa en este sorteo. */
  skipSurprise?: boolean;
  /** Forzar intento sobre exactamente este juego, sin alternativas. */
  strictGame?: boolean;
  /** Preferir estos tipos de interacción (p. ej. una casilla «Pareja»); si no hay ninguna compatible, cualquiera. */
  interactions?: readonly Interaction[];
  /** Cartas ya mostradas en este teléfono (solo IDs), para preferir las demás. */
  seen?: ReadonlySet<string>;
}

export interface DrawOutcome {
  state: SessionState;
  candidate?: Candidate;
  reason?: "sin_candidatos" | "agotado";
}

function optionsFor(state: SessionState, game: GameId, req: DrawRequest): SelectOptions {
  const opts: SelectOptions = {
    game,
    formats: req.formats ?? GAME_FORMATS[game],
    categories: req.categories,
    allowRepeat: req.allowRepeat,
    onlyActivityId: req.onlyActivityId,
    seen: req.seen,
  };
  if (game === "temporizador") opts.requireDuration = true;
  if (state.pending.forcedProtagonist) opts.forcedProtagonist = state.pending.forcedProtagonist;
  if (state.pending.forcedAssignment) opts.forcedAssignment = state.pending.forcedAssignment;
  if (state.pending.miniRemaining) opts.maxDurationSec = 60;
  if (state.config.games.includes("noche")) {
    const phase = nightPhase(state.activeMs);
    if (phase === "apertura") {
      opts.preferTags = ["apertura", "risas"];
      opts.preferGroup = true;
    } else if (phase === "cierre") {
      opts.preferTags = ["cierre", "calma", "corto"];
    }
  }
  return opts;
}

function surpriseAllowed(a: Activity, state: SessionState): boolean {
  if (a.effect === "proponer_subir" && !nextLevel(state.level)) return false;
  if (a.effect === "cambiar_juego" && enabledBaseGames(state).length < 2) return false;
  return true;
}

/**
 * Selecciona y ofrece la siguiente carta. Nunca relaja límites: si no hay
 * candidatos, deja la sesión en estado `blocked` con un aviso neutral.
 */
export function draw(catalog: readonly Activity[], initial: SessionState, rng: Rng, now: number, req: DrawRequest = {}): DrawOutcome {
  let state = initial;
  if (!["ready", "selecting", "blocked"].includes(state.status)) return { state };
  if (state.currentTurn && state.currentTurn.status !== "closed") return { state };
  // «Sin miedo»: antes de cada carta, el nivel se pone al día con el tiempo jugado.
  // Si sube, primero se anuncia; la siguiente carta ya sale del nivel nuevo.
  const ascended = applyAutoAscent(state, now);
  if (ascended.level !== state.level) return { state: ascended };
  state = ascended;

  // Evento sorpresa cada 4–7 oportunidades cerradas.
  if (!req.skipSurprise && !req.onlyActivityId && isSurpriseDue(state) && state.changesInOpportunity === 0) {
    const pool = catalog.filter((a) => a.formato === "sorpresa" && surpriseAllowed(a, state));
    const res = selectCandidate(pool, state, optionsFor(state, "sorpresa", { formats: ["sorpresa"] }), rng, now);
    const scheduled = scheduleNextSurprise(state, rng);
    if (res.ok) {
      return {
        state: offerTurn(scheduled, res.candidate, { game: "sorpresa", focusable: res.focusable, fromSurprise: true }, now),
        candidate: res.candidate,
      };
    }
    state = scheduled;
  }

  const games = req.game ? (req.strictGame ? [req.game] : [req.game, ...roundGameCandidates(state, rng).filter((g) => g !== req.game)]) : roundGameCandidates(state, rng);
  let lastReason: "sin_candidatos" | "agotado" = "sin_candidatos";
  for (const game of games) {
    if (isMetaGame(game)) continue;
    let working = state;
    let res: SelectResult;
    const repeatId = working.pending.repeatActivityId;
    if (repeatId) {
      const original = catalog.find((a) => a.id === repeatId);
      if (original) {
        const repeatGame = original.gameModes[0];
        res = selectCandidate(catalog, working, { game: repeatGame, onlyActivityId: repeatId, allowRepeat: true }, rng, now);
        if (res.ok) {
          // Repetición voluntaria: revalidada y siempre con nuevo consentimiento de las personas implicadas.
          const askees = res.candidate.implicated.length ? res.candidate.implicated : working.config.participants.map((p) => p.id);
          const c: Candidate = { ...res.candidate, needsConsent: true, askees };
          const next = offerTurn({ ...working, currentGame: repeatGame }, c, { game: repeatGame, focusable: res.focusable, repeatException: true }, now);
          return { state: next, candidate: c };
        }
      }
      working = { ...working, pending: { ...working.pending, repeatActivityId: undefined } };
      state = working;
    }
    if (game === "cadena") {
      if (!working.chain) working = startChain(working);
      const chain = working.chain!;
      const base = optionsFor(working, game, req);
      res = selectCandidate(catalog, working, { ...base, minScoreExclusive: chain.lastScore }, rng, now);
      if (!res.ok && chain.lastScore >= 0) res = selectCandidate(catalog, working, base, rng, now);
      if (res.ok) {
        working = setChainScore(working, res.candidate.activity.intensityScore);
        const next = offerTurn({ ...working, currentGame: "cadena" }, res.candidate, { game, focusable: res.focusable, chainStage: chain.stage }, now);
        return { state: next, candidate: res.candidate };
      }
      lastReason = res.reason;
      continue;
    }
    const opts = optionsFor(working, game, req);
    // La botella prefiere cartas de pareja (apunta a alguien); si no hay, cualquier carta compatible.
    const prefer = req.interactions ?? (game === "botella" ? (["pair", "directed_pair"] as const) : undefined);
    res = prefer ? selectCandidate(catalog, working, { ...opts, interactions: prefer }, rng, now) : selectCandidate(catalog, working, opts, rng, now);
    if (!res.ok && prefer) res = selectCandidate(catalog, working, opts, rng, now);
    if (res.ok) {
      const next = offerTurn({ ...working, currentGame: game }, res.candidate, { game, focusable: res.focusable }, now);
      return { state: next, candidate: res.candidate };
    }
    if (res.reason === "agotado") lastReason = "agotado";
  }
  return { state: markBlocked(state, lastReason, now), reason: lastReason };
}

/** Personas con alguna opción compatible como protagonista (para «elegir protagonista»). */
export function eligibleProtagonists(catalog: readonly Activity[], state: SessionState, rng: Rng, now: number): string[] {
  const ids = state.config.participants.map((p) => p.id);
  const out: string[] = [];
  const game = enabledBaseGames(state)[0] ?? "tarjetas";
  for (const pid of ids) {
    const res = selectCandidate(catalog, { ...state, pending: {} }, { game, formats: GAME_FORMATS[game], forcedProtagonist: pid }, rng, now);
    if (res.ok && res.candidate.protagonist === pid) out.push(pid);
  }
  return out;
}

/** Compañías compatibles para una actividad en pareja con `pid` como protagonista. */
export function compatiblePartners(catalog: readonly Activity[], state: SessionState, pid: string, now: number, rng: Rng): string[] {
  const out: string[] = [];
  const games = enabledBaseGames(state).filter((g) => GAME_FORMATS[g].includes("reto") || GAME_FORMATS[g].includes("pregunta"));
  const game = pickOne(games.length ? games : ["tarjetas" as GameId], rng)!;
  for (const other of state.config.participants.map((p) => p.id)) {
    if (other === pid) continue;
    const res = selectCandidate(catalog, { ...state, pending: {} }, { game, formats: GAME_FORMATS[game], forcedAssignment: { p1: pid, p2: other } }, rng, now);
    if (res.ok && res.candidate.assignment.p2 === other) out.push(other);
  }
  return out;
}
