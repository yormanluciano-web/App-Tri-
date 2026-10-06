import { INTENSITY_RANGE, type Intensity } from "../models/constants";
import type { Progress } from "../models/session";

export type Band = 0 | 1 | 2; // bajo, medio, alto

/** Umbrales parametrizables de la progresión dentro de un nivel. */
export const PROGRESSION = {
  /** Turnos ofrecidos que mantienen el tramo bajo (1..3). */
  lowTurns: 3,
  /** Turnos ofrecidos hasta completar el tramo medio (4..7). */
  midTurns: 7,
};

/** Sub-intervalos [min, max] de cada tramo dentro del nivel. */
export function bandRange(level: Intensity, band: Band): [number, number] {
  const [lo, hi] = INTENSITY_RANGE[level];
  const span = hi - lo + 1;
  const third = Math.floor(span / 3);
  const starts = [lo, lo + third, lo + 2 * third];
  const ends = [lo + third - 1, lo + 2 * third - 1, hi];
  return [starts[band], ends[band]];
}

function bandByTurns(turnsOffered: number): Band {
  if (turnsOffered < PROGRESSION.lowTurns) return 0;
  if (turnsOffered < PROGRESSION.midTurns) return 1;
  return 2;
}

function bandByTime(fraction: number): Band {
  if (fraction < 1 / 3) return 0;
  if (fraction < 2 / 3) return 1;
  return 2;
}

/**
 * Tramo actual. Con duración finita se limita por tiempo activo en el nivel
 * (horizonte = tiempo restante al entrar) y por turnos ofrecidos; sin límite
 * se usan solo los turnos.
 */
export function currentBand(progress: Progress, activeMs: number): Band {
  const byTurns = bandByTurns(progress.turnsOfferedInLevel);
  if (progress.horizonMs === null || progress.horizonMs <= 0) return byTurns;
  const fraction = Math.max(0, activeMs - progress.enteredAtActiveMs) / progress.horizonMs;
  return Math.min(byTurns, bandByTime(fraction)) as Band;
}

/** Score máximo elegible: nunca sale del nivel. */
export function scoreCeiling(level: Intensity, band: Band): number {
  return bandRange(level, band)[1];
}

export function scoreFloor(level: Intensity): number {
  return INTENSITY_RANGE[level][0];
}

export function isScoreInLevel(level: Intensity, score: number): boolean {
  const [lo, hi] = INTENSITY_RANGE[level];
  return Number.isInteger(score) && score >= lo && score <= hi;
}

export function remainingMs(durationMin: number | null, activeMs: number): number | null {
  if (durationMin === null) return null;
  return Math.max(0, durationMin * 60_000 - activeMs);
}

export function newProgress(durationMin: number | null, activeMs: number): Progress {
  return {
    enteredAtActiveMs: activeMs,
    horizonMs: remainingMs(durationMin, activeMs),
    turnsOfferedInLevel: 0,
  };
}

export const LEVEL_ORDER: readonly Intensity[] = ["leve", "picante", "perverso"];

export function nextLevel(level: Intensity): Intensity | null {
  const i = LEVEL_ORDER.indexOf(level);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}

export function lowerLevels(level: Intensity): Intensity[] {
  const i = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER.slice(0, Math.max(0, i));
}
