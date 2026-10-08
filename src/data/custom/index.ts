import { z } from "zod";
import type { Activity } from "@/domain/models/activity";
import {
  CATEGORIES,
  CONTACT_PERMISSIONS,
  GAMES,
  GENDERS,
  INTENSITIES,
  INTENSITY_RANGE,
  PERMISSIONS,
  PERMISSION_GROUPS,
  SAFE_BASE_GREEN,
  type Category,
  type GameId,
  type Gender,
  type Intensity,
  type Permission,
} from "@/domain/models/constants";
import { defineCards, placeholdersIn, type CardInput } from "../define";

/**
 * Cartas creadas desde el panel de administración. Viven en
 * `src/data/custom/cartas.json` (en el repositorio) junto con la lista de
 * cartas base ocultas. El panel edita ese archivo en GitHub y Vercel vuelve a
 * publicar la app; aquí solo se lee y se convierte al contrato de Activity.
 */
export const CUSTOM_FILE_PATH = "src/data/custom/cartas.json";
export const CUSTOM_PREFIX = "c";
export const CUSTOM_PACK = "admin";

const permissionList = z.array(z.enum(PERMISSIONS));

export const customCardSchema = z.object({
  /** Sufijo; el ID final es `c-<id>`. */
  id: z.string().regex(/^[a-z0-9]{4,20}$/),
  nivel: z.enum(INTENSITIES),
  t: z.string().trim().min(2).max(60),
  x: z.string().trim().min(10).max(320),
  c: z.enum(CATEGORIES),
  f: z.enum(["pregunta", "reto"]),
  s: z.number().int().min(0).max(100),
  i: z.enum(["pair", "directed_pair", "group", "solo"]).optional(),
  sizes: z.array(z.union([z.literal(2), z.literal(3)])).min(1).optional(),
  req: permissionList.optional(),
  pair: permissionList.optional(),
  aud: permissionList.optional(),
  audScope: z.enum(["implicados", "sesion"]).optional(),
  d: z.tuple([z.number().int().positive(), z.number().int().positive(), z.number().int().positive()]).optional(),
  g: z.array(z.enum(GAMES)).min(1).optional(),
  mixta: z.boolean().optional(),
  genero: z.enum(GENDERS).optional(),
  /** Fecha ISO de creación (solo informativa). */
  creada: z.string().max(40).optional(),
});
export type CustomCard = z.infer<typeof customCardSchema>;

export const customFileSchema = z.object({
  version: z.literal(1),
  cartas: z.array(customCardSchema),
  /** IDs de cartas base que no deben salir en la app. */
  ocultas: z.array(z.string().max(64)),
});
export type CustomFile = z.infer<typeof customFileSchema>;

export const EMPTY_CUSTOM_FILE: CustomFile = { version: 1, cartas: [], ocultas: [] };

export function parseCustomFile(raw: unknown): CustomFile {
  return customFileSchema.parse(raw);
}

export function customCardsToActivities(cards: readonly CustomCard[]): Activity[] {
  const out: Activity[] = [];
  for (const lvl of INTENSITIES) {
    const inputs: CardInput[] = cards
      .filter((c) => c.nivel === lvl)
      .map((c) => {
        const rest: Partial<CustomCard> = { ...c };
        delete rest.nivel;
        delete rest.creada;
        return rest as CardInput;
      });
    out.push(...defineCards(lvl, CUSTOM_PREFIX, CUSTOM_PACK, inputs));
  }
  return out;
}

export function customActivityId(card: Pick<CustomCard, "id">): string {
  return `${CUSTOM_PREFIX}-${card.id}`;
}

// ------------------------------------------------------------------ formulario

export type Audience = "todos" | "mixta" | "hombres" | "mujeres";

/**
 * Qué pide la carta, con las mismas tres opciones del inicio del juego:
 * - `todos`: apta incluso para quien eligió «No acepto» (base segura).
 * - `categorias`: solo para quien aceptó esas categorías («Acepto parcialmente»).
 * - `acepta_todo`: solo para quien aceptó todo.
 * - `detalle`: permisos elegidos uno por uno (opción avanzada).
 */
export type Implica = "todos" | "categorias" | "acepta_todo" | "detalle";

export interface CardForm {
  nivel: Intensity;
  formato: "pregunta" | "reto";
  titulo: string;
  texto: string;
  categoria: Category;
  /** Solo aplica con {p1} y {p2}: la acción va de p1 hacia p2. */
  dirigida: boolean;
  para: Audience;
  /** Tamaños de sesión donde puede salir. */
  sizes: (2 | 3)[];
  implica: Implica;
  /** IDs de PERMISSION_GROUPS (con `implica: "categorias"`). */
  grupos: string[];
  /** Solo con `implica: "detalle"`. */
  permisos: Permission[];
  /** Segundos; null = sin reloj. */
  duracion: number | null;
  juegos: GameId[];
  intensidad: number;
}

/** Permisos que el validador exige declarar «por pareja». */
const PAIR_ONLY: readonly Permission[] = [...CONTACT_PERMISSIONS, "tiempo_a_solas"];

const ALL_GROUP_PERMS: Permission[] = [...new Set(PERMISSION_GROUPS.flatMap((g) => g.items))];

function isPairText(form: Pick<CardForm, "texto" | "titulo">): boolean {
  const roles = placeholdersIn(form.texto + " " + form.titulo);
  return roles.includes("p2") && !roles.includes("p3");
}

/**
 * Permisos que exige la carta según la opción elegida. «Acepto todo» exige
 * todas las categorías; en cartas que no son de pareja, el contacto y el
 * tiempo a solas no aplican (no hay con quién), así que se omiten.
 */
export function formPermissions(form: CardForm): Permission[] {
  switch (form.implica) {
    case "todos":
      return ["conversacion_ligera"];
    case "categorias":
      return [...new Set(PERMISSION_GROUPS.filter((g) => form.grupos.includes(g.id)).flatMap((g) => g.items))];
    case "acepta_todo":
      return isPairText(form) ? [...ALL_GROUP_PERMS] : ALL_GROUP_PERMS.filter((p) => !PAIR_ONLY.includes(p));
    case "detalle":
      return [...new Set(form.permisos)];
  }
}

function sameSet<T>(a: readonly T[], b: readonly T[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
}

/** Reconstruye la opción del formulario a partir de los permisos de una carta. */
export function implicaFromPermissions(perms: readonly Permission[], pair: boolean): Pick<CardForm, "implica" | "grupos" | "permisos"> {
  const permisos = [...new Set(perms)];
  if (permisos.every((p) => SAFE_BASE_GREEN.includes(p))) return { implica: "todos", grupos: [], permisos };
  const all = pair ? ALL_GROUP_PERMS : ALL_GROUP_PERMS.filter((p) => !PAIR_ONLY.includes(p));
  if (sameSet(permisos, all)) return { implica: "acepta_todo", grupos: [], permisos };
  const grupos = PERMISSION_GROUPS.filter((g) => g.items.every((p) => permisos.includes(p))).map((g) => g.id);
  const union = PERMISSION_GROUPS.filter((g) => grupos.includes(g.id)).flatMap((g) => g.items);
  if (grupos.length && sameSet(permisos, union)) return { implica: "categorias", grupos, permisos };
  return { implica: "detalle", grupos: [], permisos };
}

export function defaultIntensity(nivel: Intensity): number {
  const [lo, hi] = INTENSITY_RANGE[nivel];
  return Math.round((lo + hi) / 2);
}

export function newCardForm(): CardForm {
  return {
    nivel: "picante",
    formato: "reto",
    titulo: "",
    texto: "",
    categoria: "retos",
    dirigida: true,
    para: "todos",
    sizes: [2, 3],
    implica: "todos",
    grupos: [],
    permisos: ["conversacion_ligera"],
    duracion: null,
    juegos: [],
    intensidad: defaultIntensity("picante"),
  };
}

export function randomCardId(rand: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(rand() * 32)];
  return s;
}

/**
 * Convierte el formulario en una carta compacta, colocando cada permiso donde
 * el motor lo evalúa: contacto y tiempo a solas por pareja, prendas también
 * ante la audiencia, el resto para cada persona implicada.
 */
export function buildCustomCard(form: CardForm, id: string, now = new Date()): CustomCard {
  const roles = placeholdersIn(form.texto + " " + form.titulo);
  const isPair = roles.includes("p2") && !roles.includes("p3");
  const perms = formPermissions(form);
  const pair = isPair ? perms.filter((p) => PAIR_ONLY.includes(p)) : [];
  const req = perms.filter((p) => !pair.includes(p));
  const prenda = perms.includes("quitarse_prenda");
  const gender: Gender | undefined = form.para === "hombres" ? "hombre" : form.para === "mujeres" ? "mujer" : undefined;
  const d = form.duracion && form.duracion > 0 ? Math.round(form.duracion) : null;
  const card: CustomCard = {
    id,
    nivel: form.nivel,
    t: form.titulo.trim(),
    x: form.texto.trim(),
    c: form.categoria,
    f: form.formato,
    s: form.intensidad,
    ...(isPair && form.dirigida ? { i: "directed_pair" as const } : {}),
    // Con {p3} es una actividad de grupo de tres roles: solo en tríos.
    ...(roles.includes("p3") ? { i: "group" as const, sizes: [3 as const] } : form.sizes.length === 1 ? { sizes: [...form.sizes] } : {}),
    ...(req.length ? { req } : {}),
    ...(pair.length ? { pair } : {}),
    ...(prenda ? { aud: ["quitarse_prenda" as Permission], audScope: "sesion" as const } : {}),
    ...(d ? { d: [d, Math.max(5, Math.round(d / 2)), d * 2] as [number, number, number] } : {}),
    ...(form.juegos.length ? { g: [...form.juegos] } : {}),
    ...(form.para === "mixta" ? { mixta: true } : {}),
    ...(gender ? { genero: gender } : {}),
    creada: now.toISOString().slice(0, 10),
  };
  return customCardSchema.parse(card);
}

/** Formulario a partir de una carta propia (para editarla). */
export function formFromCustomCard(c: CustomCard): CardForm {
  return {
    nivel: c.nivel,
    formato: c.f,
    titulo: c.t,
    texto: c.x,
    categoria: c.c,
    dirigida: c.i === "directed_pair",
    para: c.mixta ? "mixta" : c.genero === "hombre" ? "hombres" : c.genero === "mujer" ? "mujeres" : "todos",
    sizes: c.sizes ?? [2, 3],
    ...implicaFromPermissions([...(c.req ?? []), ...(c.pair ?? []), ...(c.aud ?? [])], isPairText({ texto: c.x, titulo: c.t })),
    duracion: c.d ? c.d[0] : null,
    juegos: c.g ?? [],
    intensidad: c.s,
  };
}

// ------------------------------------------------------------------ cambios

export type CustomChange =
  | { kind: "add"; card: CustomCard }
  | { kind: "update"; card: CustomCard }
  | { kind: "delete"; id: string }
  | { kind: "hide"; activityId: string }
  | { kind: "unhide"; activityId: string };

export function applyCustomChange(file: CustomFile, change: CustomChange): CustomFile {
  switch (change.kind) {
    case "add":
      if (file.cartas.some((c) => c.id === change.card.id)) throw new Error("ID repetido");
      return { ...file, cartas: [...file.cartas, change.card] };
    case "update":
      if (!file.cartas.some((c) => c.id === change.card.id)) throw new Error("La carta ya no existe");
      return { ...file, cartas: file.cartas.map((c) => (c.id === change.card.id ? change.card : c)) };
    case "delete":
      return { ...file, cartas: file.cartas.filter((c) => c.id !== change.id) };
    case "hide":
      return file.ocultas.includes(change.activityId) ? file : { ...file, ocultas: [...file.ocultas, change.activityId] };
    case "unhide":
      return { ...file, ocultas: file.ocultas.filter((x) => x !== change.activityId) };
  }
}

export function describeChange(change: CustomChange, title: string): string {
  const verb = { add: "Añade", update: "Edita", delete: "Borra", hide: "Oculta", unhide: "Restaura" }[change.kind];
  return `${verb} carta desde el panel: ${title}`.slice(0, 120);
}

export function serializeCustomFile(file: CustomFile): string {
  return JSON.stringify(file, null, 2) + "\n";
}
