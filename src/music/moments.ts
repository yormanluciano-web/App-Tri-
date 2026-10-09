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

/** Qué suena en un momento: una lista propia o la selección del DJ Cómplice. */
export type MusicSource = { key: string; uri: string; songs?: undefined } | { key: string; songs: readonly string[]; uri?: undefined };

/**
 * Fuente del momento: la lista que se configuró para ese momento exacto o, si
 * no hay, las canciones del DJ Cómplice para ese momento (las del panel o las
 * de la app). Así cada momento tiene su propia música aunque no haya listas.
 */
export function sourceFor(
  moment: MusicMoment,
  config: { listas?: MusicPlaylists; canciones?: Partial<Record<MusicMoment, readonly string[]>> },
  defaults: Record<MusicMoment, readonly string[]>,
): MusicSource {
  const uri = config.listas?.[moment];
  if (uri) return { key: uri, uri };
  const own = config.canciones?.[moment];
  return { key: `dj:${moment}`, songs: own && own.length > 0 ? own : defaults[moment] };
}
