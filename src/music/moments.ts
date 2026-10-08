import type { Activity } from "@/domain/models/activity";
import type { Intensity } from "@/domain/models/constants";
import type { SessionState } from "@/domain/models/session";
import { activityPermissions } from "@/domain/consent/limits";

/**
 * Momentos musicales. La música cambia por momento, no con cada carta:
 * - un momento por nivel (Leve, Picante, Perverso);
 * - «baile» en cartas de baile, «calma» en cartas tranquilas;
 * - «cierre» al terminar la sesión.
 */
export const MUSIC_MOMENTS = ["leve", "picante", "perverso", "baile", "calma", "cierre"] as const;
export type MusicMoment = (typeof MUSIC_MOMENTS)[number];

export const MOMENT_LABEL: Record<MusicMoment, string> = {
  leve: "Leve",
  picante: "Picante",
  perverso: "Perverso",
  baile: "Baile",
  calma: "Calma",
  cierre: "Cierre",
};

export const MOMENT_HINT: Record<MusicMoment, string> = {
  leve: "Suena durante el nivel Leve.",
  picante: "Suena durante el nivel Picante.",
  perverso: "Suena durante el nivel Perverso.",
  baile: "En retos de baile (lento o pegado).",
  calma: "En cartas tranquilas: abrazos largos, respiración, confesiones suaves.",
  cierre: "Al terminar la sesión.",
};

export type MusicPlaylists = Partial<Record<MusicMoment, string>>;

/** Momento que corresponde a la carta abierta, o al nivel si no hay carta. */
export function momentFor(session: SessionState, activity: Activity | null): MusicMoment {
  if (session.status === "finished") return "cierre";
  if (activity) {
    const perms = activityPermissions(activity);
    if (activity.categoria === "baile" || perms.includes("baile_cercano") || perms.includes("baile_individual")) return "baile";
    if (activity.tags.includes("calma")) return "calma";
  }
  return session.level;
}

/**
 * Lista para el momento; si no hay una propia, cae a la del nivel. Devuelve
 * null si no hay nada configurado (la música no cambia).
 */
export function playlistFor(moment: MusicMoment, level: Intensity, lists: MusicPlaylists): string | null {
  return lists[moment] ?? lists[level] ?? null;
}
