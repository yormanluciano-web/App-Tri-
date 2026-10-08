import type { Activity } from "../models/activity";
import { cardPoolGame, type Category, type Format, type GameId, type Intensity, type Interaction, type RoleId } from "../models/constants";
import type { Assignment, OfferRecord, Participant, ParticipantId, SessionState } from "../models/session";
import { evaluateAssignment, type LimitContext } from "../consent/limits";
import { pickOne, pickWeighted, type Rng } from "./rng";
import { currentBand, remainingMs, scoreCeiling, scoreFloor } from "./progression";

export const VARIETY = {
  familySeparation: 4,
  rejectedFamilyWindow: 8,
  recentCategoryWindow: 2,
  /** Espera máxima (oportunidades) de una persona con opciones compatibles. */
  maxWait: 3,
  /** Reintentos internos máximos por oportunidad antes de declarar agotamiento. */
  maxChangesPerOpportunity: 8,
};

export interface Candidate {
  activity: Activity;
  assignment: Assignment;
  implicated: ParticipantId[];
  protagonist: ParticipantId | null;
  needsConsent: boolean;
  askees: ParticipantId[];
}

export interface SelectOptions {
  game: GameId;
  formats?: readonly Format[];
  categories?: readonly Category[];
  /** Score mínimo exclusivo (cadena progresiva). */
  minScoreExclusive?: number;
  /** Duración máxima en segundos (mini actividades). */
  maxDurationSec?: number;
  /** Exige reloj (juego Temporizador). */
  requireDuration?: boolean;
  forcedProtagonist?: ParticipantId;
  forcedAssignment?: Assignment;
  /** Excepción explícita al cooldown, nunca a los límites. */
  allowRepeat?: boolean;
  /** Restringe a una actividad concreta (favorita o repetición voluntaria). */
  onlyActivityId?: string;
  /** Intensidad a usar si difiere de la del estado (no se usa para subir). */
  level?: Intensity;
  /** Prefiere actividades de grupo (por ejemplo, apertura de Noche completa). */
  preferGroup?: boolean;
  /** Solo estos tipos de interacción (p. ej. la botella busca parejas). */
  interactions?: readonly Interaction[];
  /** Tags preferidos en esta ronda. */
  preferTags?: readonly string[];
}

export type SelectResult =
  | { ok: true; candidate: Candidate; focusable: ParticipantId[] }
  | { ok: false; reason: "sin_candidatos" | "agotado" };

export function permutations<T>(items: readonly T[], k: number): T[][] {
  if (k === 0) return [[]];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = items.filter((_, j) => j !== i);
    for (const tail of permutations(rest, k - 1)) out.push([item, ...tail]);
  });
  return out;
}

/** Enumera todas las asignaciones de roles posibles para la sesión. */
export function enumerateAssignments(activity: Activity, participants: readonly Participant[]): Assignment[] {
  const ids = participants.map((p) => p.id);
  const roles = activity.roles as RoleId[];
  if (roles.length === 0) return [{}];
  if (roles.length > ids.length) return [];
  return permutations(ids, roles.length).map((perm) => {
    const a: Assignment = {};
    roles.forEach((r, i) => (a[r] = perm[i]));
    return a;
  });
}

export function protagonistOf(activity: Activity, assignment: Assignment): ParticipantId | null {
  if (activity.roles.length === 0) return null;
  return assignment.p1 ?? null;
}

export function comboKeys(activity: Activity, implicated: readonly ParticipantId[], assignment: Assignment): string[] {
  if (activity.tipoInteraccion === "group") return ["grupo"];
  if (implicated.length === 2) {
    const [a, b] = [assignment.p1!, assignment.p2!];
    const und = [a, b].sort().join("+");
    return activity.tipoInteraccion === "directed_pair" ? [`${a}>${b}`, und] : [und];
  }
  return [];
}

function lastOfferIndex(history: readonly OfferRecord[], pred: (r: OfferRecord) => boolean): number | null {
  for (let i = history.length - 1; i >= 0; i--) if (pred(history[i])) return history[i].opportunity;
  return null;
}

/** Filtros estáticos y de variedad (sin límites personales). */
export function staticallyEligible(activity: Activity, state: SessionState, opts: SelectOptions, now: number): boolean {
  void now;
  const level = opts.level ?? state.level;
  const n = state.config.participants.length;
  if (!activity.active || activity.editorialStatus !== "reviewed") return false;
  if (!activity.gameModes.includes(cardPoolGame(opts.game))) return false;
  if (opts.interactions && !opts.interactions.includes(activity.tipoInteraccion)) return false;
  if (activity.intensidad !== level) return false;
  if (!activity.sessionSizes.includes(n as 2 | 3)) return false;
  if (activity.participantesMinimos > n) return false;
  if (opts.onlyActivityId && activity.id !== opts.onlyActivityId) return false;
  if (opts.formats && !opts.formats.includes(activity.formato)) return false;
  if (opts.categories && opts.categories.length > 0 && !opts.categories.includes(activity.categoria)) return false;
  // Progresión: techo del tramo, nunca fuera del nivel.
  const ceiling = scoreCeiling(level, currentBand(state.progress, state.activeMs));
  if (activity.intensityScore > ceiling || activity.intensityScore < scoreFloor(level)) return false;
  if (opts.minScoreExclusive !== undefined && activity.intensityScore <= opts.minScoreExclusive) return false;
  if (opts.requireDuration && !activity.duracion) return false;
  if (opts.maxDurationSec !== undefined && activity.duracion && activity.duracion.minima > opts.maxDurationSec) return false;
  const remaining = remainingMs(state.config.durationMin, state.activeMs);
  if (remaining !== null && remaining > 0 && activity.duracion && activity.duracion.minima * 1000 > remaining) return false;

  // Variedad y cooldown: cuentan ofertas aunque se pasen o cambien.
  const open = state.turnCounter;
  const h = state.history;
  const lastSame = lastOfferIndex(h, (r) => r.activityId === activity.id);
  const lastFamily = lastOfferIndex(h, (r) => r.familyId === activity.familyId);
  const lastRejected = lastOfferIndex(h, (r) => r.rejected && r.familyId === activity.familyId);
  // Una familia rechazada no se vuelve a pedir pronto, ni siquiera con excepción.
  if (lastRejected !== null && open - lastRejected < VARIETY.rejectedFamilyWindow) return false;
  if (!opts.allowRepeat) {
    if (lastSame !== null && open - lastSame < Math.max(1, activity.cooldown)) return false;
    if (lastFamily !== null && open - lastFamily < VARIETY.familySeparation) return false;
  } else {
    // Incluso con excepción, nunca dos propuestas idénticas consecutivas.
    const prev = h[h.length - 1];
    if (prev && prev.activityId === activity.id && !opts.onlyActivityId) return false;
  }
  return true;
}

export function limitContext(state: SessionState): LimitContext {
  return { participants: state.config.participants, sharedLimits: state.config.sharedLimits };
}

/** Todas las combinaciones (actividad, asignación) válidas para la oportunidad. */
export function buildCandidates(
  catalog: readonly Activity[],
  state: SessionState,
  opts: SelectOptions,
  now: number,
): Candidate[] {
  const ctx = limitContext(state);
  const out: Candidate[] = [];
  for (const activity of catalog) {
    if (!staticallyEligible(activity, state, opts, now)) continue;
    // Una asignación forzada de pareja solo aplica a actividades con dos roles o más.
    if (opts.forcedAssignment?.p2 && !activity.roles.includes("p2")) continue;
    const assignments = opts.forcedAssignment
      ? [opts.forcedAssignment]
      : enumerateAssignments(activity, state.config.participants);
    for (const assignment of assignments) {
      // Si se fuerza una asignación con más roles que la actividad, se recorta.
      const asg: Assignment = {};
      for (const r of activity.roles) asg[r] = assignment[r];
      const ev = evaluateAssignment(activity, asg, ctx);
      if (!ev.ok) continue;
      out.push({
        activity,
        assignment: asg,
        implicated: ev.implicated,
        protagonist: protagonistOf(activity, asg),
        needsConsent: ev.needsConsent,
        askees: ev.askees,
      });
    }
  }
  return out;
}

/** Peso de preferencia: nunca rehabilita una opción descartada. */
function preferenceWeight(c: Candidate, state: SessionState): number {
  let w = c.activity.pesoAleatorio;
  const people = c.implicated.length > 0 ? c.implicated : state.config.participants.map((p) => p.id);
  for (const pid of people) {
    const p = state.config.participants.find((x) => x.id === pid);
    if (!p) continue;
    if (p.preferences.preferred.includes(c.activity.categoria)) w *= 1.4;
    if (p.preferences.avoided.includes(c.activity.categoria)) w *= 0.45;
  }
  const recent = state.history.slice(-VARIETY.recentCategoryWindow);
  if (recent.some((r) => r.category === c.activity.categoria)) w *= 0.5;
  // Final de sesión: prioriza actividades breves y de cierre.
  const remaining = remainingMs(state.config.durationMin, state.activeMs);
  if (remaining !== null && state.config.durationMin) {
    const total = state.config.durationMin * 60_000;
    if (remaining < Math.max(5 * 60_000, total * 0.15)) {
      if (c.activity.tags.includes("cierre") || c.activity.tags.includes("corto")) w *= 2;
      if (c.activity.tags.includes("largo")) w *= 0.4;
    }
  }
  return w;
}

/**
 * Selección de un turno: filtros obligatorios → equilibrio → ponderación → sorteo.
 * El equilibrio elige primero a quién le toca entre quienes tienen opciones
 * compatibles (menos oportunidades, mayor espera).
 */
export function selectCandidate(
  catalog: readonly Activity[],
  state: SessionState,
  opts: SelectOptions,
  rng: Rng,
  now: number,
): SelectResult {
  const all = buildCandidates(catalog, state, opts, now);
  if (all.length === 0) {
    // Distingue agotamiento por variedad de ausencia real de opciones.
    if (!opts.allowRepeat) {
      const relaxed = buildCandidates(catalog, state, { ...opts, allowRepeat: true }, now);
      if (relaxed.length > 0) return { ok: false, reason: "agotado" };
    }
    return { ok: false, reason: "sin_candidatos" };
  }

  const individual = all.filter((c) => c.protagonist !== null);
  const group = all.filter((c) => c.protagonist === null);
  let pool: Candidate[];

  if (individual.length > 0) {
    const focusable = [...new Set(individual.map((c) => c.protagonist as ParticipantId))];
    let focus: ParticipantId;
    if (opts.forcedProtagonist && focusable.includes(opts.forcedProtagonist)) {
      focus = opts.forcedProtagonist;
    } else {
      const s = state.stats;
      const wait = (p: ParticipantId) => s.sinceProtagonist[p] ?? 0;
      const urgent = focusable.filter((p) => wait(p) >= VARIETY.maxWait);
      const minOffered = Math.min(...focusable.map((p) => s.offered[p] ?? 0));
      let tied = urgent.length > 0 ? urgent : focusable.filter((p) => (s.offered[p] ?? 0) === minOffered);
      const maxWait = Math.max(...tied.map(wait));
      tied = tied.filter((p) => wait(p) === maxWait);
      focus = pickOne(tied, rng)!;
    }
    const focused = individual.filter((c) => c.protagonist === focus);
    // Las actividades grupales también dan oportunidad a todos, incluida la persona foco.
    pool = [...focused, ...group];
    const focusableList = focusable;
    // Menor uso de combinaciones entre las opciones de la persona foco.
    const usage = (c: Candidate) => {
      const keys = comboKeys(c.activity, c.implicated, c.assignment);
      return keys.length === 0 ? 0 : Math.max(...keys.map((k) => state.stats.combos[k] ?? 0));
    };
    const minUsage = Math.min(...focused.map(usage));
    const groupFactor = opts.preferGroup ? 1.5 : 0.35;
    const picked = pickWeighted(
      pool,
      (c) => {
        let w = preferenceWeight(c, state);
        if (c.protagonist === null) w *= groupFactor;
        else w *= 1 / (1 + usage(c) - minUsage);
        if (opts.preferTags?.some((t) => c.activity.tags.includes(t as never))) w *= 1.8;
        return w;
      },
      rng,
    );
    return picked ? { ok: true, candidate: picked, focusable: focusableList } : { ok: false, reason: "sin_candidatos" };
  }

  pool = group;
  const picked = pickWeighted(
    pool,
    (c) => {
      let w = preferenceWeight(c, state);
      if (opts.preferTags?.some((t) => c.activity.tags.includes(t as never))) w *= 1.8;
      return w;
    },
    rng,
  );
  return picked ? { ok: true, candidate: picked, focusable: [] } : { ok: false, reason: "sin_candidatos" };
}
