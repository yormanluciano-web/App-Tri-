import type { Activity } from "@/domain/models/activity";
import {
  CONTACT_PERMISSIONS,
  SCHEMA_VERSION,
  type Category,
  type Format,
  type GameId,
  type Intensity,
  type Interaction,
  type Permission,
  type RoleId,
  type SurpriseEffect,
  type Tag,
} from "@/domain/models/constants";

/**
 * Formato compacto de redacción. `defineCards` lo expande al contrato completo
 * de Activity con valores por defecto explícitos; el validador revisa el
 * resultado final, no este atajo.
 */
export interface CardInput {
  /** Sufijo único dentro del lote; el ID final es `${prefijo}-${id}`. */
  id: string;
  t: string;
  x: string;
  c: Category;
  f: Format;
  /** intensityScore dentro del rango del nivel. */
  s: number;
  i?: Interaction;
  sizes?: (2 | 3)[];
  /** Permisos de cada persona implicada. */
  req?: Permission[];
  /** Permisos por par implicado (contacto, coqueteo dirigido…). */
  pair?: Permission[];
  /** Permisos de la audiencia. */
  aud?: Permission[];
  rol?: Partial<Record<RoleId, Permission[]>>;
  audScope?: "implicados" | "sesion";
  /** Duración [sugerida, mínima, máxima] en segundos. */
  d?: [number, number, number];
  g?: GameId[];
  tags?: Tag[];
  fam?: string;
  conf?: boolean;
  w?: number;
  cd?: number;
  eff?: SurpriseEffect;
  opts?: string[];
  status?: Activity["editorialStatus"];
}

const PLACEHOLDER = /\{(p[123])\}/g;

export function placeholdersIn(text: string): RoleId[] {
  const out = new Set<RoleId>();
  for (const m of text.matchAll(PLACEHOLDER)) out.add(m[1] as RoleId);
  return (["p1", "p2", "p3"] as RoleId[]).filter((r) => out.has(r));
}

function defaultGames(f: Format, hasDuration: boolean): GameId[] {
  switch (f) {
    case "pregunta":
      return ["verdad_reto", "ruleta", "dados", "tarjetas", "cadena", ...(hasDuration ? (["temporizador"] as GameId[]) : [])];
    case "reto":
      return ["verdad_reto", "ruleta", "dados", "tarjetas", "cadena", ...(hasDuration ? (["temporizador"] as GameId[]) : [])];
    case "sorpresa":
      return ["sorpresa"];
  }
}

export function defineCards(
  level: Intensity,
  prefix: string,
  packId: string,
  cards: CardInput[],
  contentVersion = 1,
): Activity[] {
  return cards.map((c) => {
    const roles = placeholdersIn(c.x + " " + c.t);
    const interaction: Interaction =
      c.i ?? (roles.includes("p2") ? "pair" : roles.includes("p1") ? "solo" : "group");
    const [min, max] =
      interaction === "solo" ? [1, 1] : interaction === "group" ? [2, 3] : [2, 2];
    const perms = [...(c.req ?? []), ...(c.pair ?? []), ...(c.aud ?? []), ...Object.values(c.rol ?? {}).flat()];
    const contact = perms.some((p) => CONTACT_PERMISSIONS.includes(p));
    const tags = new Set<Tag>(c.tags ?? []);
    tags.add(contact ? "contacto" : "sin_contacto");
    if (!c.d || c.d[0] <= 60) tags.add("corto");
    if (c.d && c.d[0] >= 150) tags.add("largo");
    const id = `${prefix}-${c.id}`;
    return {
      id,
      schemaVersion: SCHEMA_VERSION,
      contentVersion,
      titulo: c.t,
      texto: c.x,
      categoria: c.c,
      formato: c.f,
      intensidad: level,
      intensityScore: c.s,
      participantesMinimos: min,
      participantesMaximos: max,
      sessionSizes: c.sizes ?? [2, 3],
      tipoInteraccion: interaction,
      roles,
      audienceScope: c.audScope ?? (interaction === "group" ? "sesion" : "implicados"),
      duracion: c.d ? { sugerida: c.d[0], minima: c.d[1], maxima: c.d[2] } : null,
      tags: [...tags],
      restricciones: {
        implicados: c.req ?? [],
        porRol: c.rol ?? {},
        pareja: c.pair ?? [],
        audiencia: c.aud ?? [],
      },
      gameModes: c.g ?? defaultGames(c.f, !!c.d),
      pesoAleatorio: c.w ?? 1,
      cooldown: c.cd ?? 12,
      familyId: c.fam ? `${prefix.split("-")[0]}-${c.fam}` : id,
      requiereConfirmacion: c.conf ?? false,
      active: true,
      premium: false,
      packId,
      locale: "es",
      editorialStatus: c.status ?? "reviewed",
      ...(c.eff ? { effect: c.eff } : {}),
      ...(c.opts ? { opciones: c.opts } : {}),
    } satisfies Activity;
  });
}
