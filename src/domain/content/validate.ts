import { activitySchema, type Activity } from "../models/activity";
import {
  CATEGORIES,
  CONTACT_PERMISSIONS,
  GAMES,
  INTENSITIES,
  INTENSITY_RANGE,
  type Format,
  type GameId,
} from "../models/constants";
import { activityPermissions, isContactActivity } from "../consent/limits";

export interface ValidationIssue {
  id: string;
  level: "error" | "warning";
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

const GAME_FORMATS: Record<GameId, readonly Format[]> = {
  verdad_reto: ["pregunta", "reto"],
  ruleta: ["pregunta", "reto"],
  dados: ["pregunta", "reto"],
  tarjetas: ["pregunta", "reto"],
  temporizador: ["pregunta", "reto"],
  cadena: ["pregunta", "reto"],
  sorpresa: ["sorpresa"],
  // Noche completa y Caos delegan en los juegos base; no se asignan directamente.
  noche: [],
  caos: [],
};

/** Palabras que sugieren contacto. Solo generan alertas: no demuestran seguridad. */
const CONTACT_HINTS = /\b(abraz\w*|bes[ao]\w*|masaj\w*|acarici\w*|toc(?:ar|a|ad|ate)\s+(?:la|el|su|tu|sus|tus)|tómal[ae]s?|tomarse de|mano[s]? de|hombros?|cintura|regazo)\b/i;

/** Contenido vetado por las reglas editoriales (alerta para revisión humana). */
const BANNED_HINTS =
  /\b(alcohol|trago|shot|borrach\w*|menor(es)? de edad|desnud\w*|sexo|sexual\w*|genital\w*|senos?|pechos?|pez[oó]n\w*|oral|pene|vagina|vulva|nalgas?|orgasm\w*|mastur\w*|porn\w*|er[oó]tic\w*|excitad\w*|celular de|teléfono de (otra|otro)|contraseña|foto\w* íntima\w*|castigo|cobarde|humill\w*)\b/i;

/** Quitarse prendas nunca llega a la ropa interior ni a la desnudez. */
const UNDERWEAR_REMOVAL = /quit\w*[^.]{0,40}ropa interior|(sin|en) ropa interior|quedar\w* sin ropa/i;

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\{p[123]\}/g, "")
    .replace(/[^a-z0-9ñ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(text: string): Set<string> {
  return new Set(normalizeText(text).split(" ").filter((w) => w.length > 3));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

export function validateCatalog(raw: readonly unknown[], opts: { similarity?: boolean } = {}): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const err = (id: string, message: string) => errors.push({ id, level: "error", message });
  const warn = (id: string, message: string) => warnings.push({ id, level: "warning", message });

  const seen = new Set<string>();
  const texts = new Map<string, string>();
  const parsed: Activity[] = [];

  raw.forEach((item, idx) => {
    const res = activitySchema.safeParse(item);
    const id = (item as { id?: string })?.id ?? `#${idx}`;
    if (!res.success) {
      err(id, `esquema inválido: ${res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      return;
    }
    const a = res.data;
    parsed.push(a);
    if (seen.has(a.id)) err(a.id, "ID duplicado");
    seen.add(a.id);

    const [lo, hi] = INTENSITY_RANGE[a.intensidad];
    if (a.intensityScore < lo || a.intensityScore > hi) err(a.id, `score ${a.intensityScore} fuera de ${a.intensidad} [${lo}-${hi}]`);
    if (a.participantesMinimos > a.participantesMaximos) err(a.id, "participantesMinimos > participantesMaximos");

    // Placeholders y roles.
    const placeholders = [...a.texto.matchAll(/\{([a-z0-9_]+)\}/g)].map((m) => m[1]);
    for (const ph of placeholders) if (!["p1", "p2", "p3"].includes(ph)) err(a.id, `placeholder desconocido {${ph}}`);
    for (const ph of new Set(placeholders)) if (!a.roles.includes(ph as never)) err(a.id, `placeholder {${ph}} sin rol declarado`);
    for (const r of a.roles) if (!placeholders.includes(r) && !a.titulo.includes(`{${r}}`)) warn(a.id, `rol ${r} sin placeholder en el texto`);
    if (new Set(a.roles).size !== a.roles.length) err(a.id, "roles repetidos");
    switch (a.tipoInteraccion) {
      case "solo":
        if (a.roles.join() !== "p1" || a.participantesMinimos !== 1 || a.participantesMaximos !== 1) err(a.id, "solo requiere rol p1 y 1 participante");
        break;
      case "pair":
      case "directed_pair":
        if (a.roles.join() !== "p1,p2" || a.participantesMinimos !== 2 || a.participantesMaximos !== 2) err(a.id, "pareja requiere roles p1,p2 y 2 participantes");
        break;
      case "group":
        if (a.participantesMinimos < 2) err(a.id, "grupo requiere al menos 2 participantes");
        if (a.roles.length > Math.min(...a.sessionSizes)) err(a.id, "grupo con más roles que personas en la sesión mínima");
        break;
    }
    if (a.roles.includes("p3") && !a.roles.includes("p2")) err(a.id, "rol p3 sin p2");
    if (a.roles.includes("p3") && a.sessionSizes.includes(2)) err(a.id, "rol p3 en sesión de 2");
    if (a.tipoInteraccion !== "group" && a.participantesMaximos > Math.max(...a.sessionSizes)) err(a.id, "más implicados que tamaño de sesión");

    // Duraciones razonables.
    if (a.duracion) {
      if (a.duracion.minima < 10 || a.duracion.maxima > 600) err(a.id, "duración fuera de 10–600 s");
    }

    // Juegos compatibles con formato.
    for (const g of a.gameModes) {
      if (!GAMES.includes(g)) err(a.id, `juego desconocido ${g}`);
      else if (!GAME_FORMATS[g].includes(a.formato)) err(a.id, `formato ${a.formato} incompatible con ${g}`);
    }
    if (a.gameModes.includes("temporizador") && !a.duracion) err(a.id, "temporizador requiere duración");

    // Reglas por formato.
    if (a.formato === "sorpresa" && !a.effect) err(a.id, "sorpresa requiere effect");
    if (a.formato !== "sorpresa" && a.effect) err(a.id, "effect solo para sorpresas");
    if (a.opciones) err(a.id, "opciones ya no se usan");
    if (!CATEGORIES.includes(a.categoria)) err(a.id, "categoría desconocida");

    // Contacto: exige permiso por par; nunca solo en implicados o audiencia.
    const r = a.restricciones;
    const contactOutsidePair = [...r.implicados, ...r.audiencia, ...Object.values(r.porRol).flat()].filter((p) =>
      CONTACT_PERMISSIONS.includes(p as never),
    );
    if (contactOutsidePair.length > 0) err(a.id, `permiso de contacto fuera de «pareja»: ${contactOutsidePair.join(", ")}`);
    if (r.pareja.length > 0 && a.participantesMaximos < 2) err(a.id, "permiso por pareja en actividad de 1 persona");
    if (isContactActivity(a) && !a.tags.includes("contacto")) err(a.id, "actividad de contacto sin tag contacto");
    if (!isContactActivity(a) && a.tags.includes("contacto")) err(a.id, "tag contacto sin permiso de contacto");
    if (CONTACT_HINTS.test(a.texto) && !isContactActivity(a)) warn(a.id, "el texto sugiere contacto pero no declara permiso de contacto");
    if (BANNED_HINTS.test(a.texto + " " + a.titulo)) err(a.id, "texto con término vetado por reglas editoriales");
    if (UNDERWEAR_REMOVAL.test(a.texto)) err(a.id, "una prenda nunca puede ser la ropa interior");
    // Prendas: se hace ante el grupo, así que toda la audiencia debe aceptarlo.
    const allPerms = activityPermissions(a);
    if (allPerms.includes("quitarse_prenda") && (a.audienceScope !== "sesion" || !r.audiencia.includes("quitarse_prenda")))
      err(a.id, "quitarse_prenda requiere audienceScope «sesion» y el permiso en audiencia");
    // Tiempo a solas: siempre como permiso por pareja.
    if (allPerms.includes("tiempo_a_solas") && !r.pareja.includes("tiempo_a_solas")) err(a.id, "tiempo_a_solas requiere permiso en «pareja»");
    if (activityPermissions(a).length === 0) err(a.id, "actividad sin permisos declarados");

    const norm = normalizeText(a.texto);
    if (texts.has(norm)) err(a.id, `texto duplicado de ${texts.get(norm)}`);
    else texts.set(norm, a.id);
  });

  if (opts.similarity) {
    // Similares: solo sugerencias para revisión editorial.
    const sets = parsed.map((a) => [a, wordSet(a.texto)] as const);
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const [a, sa] = sets[i];
        const [b, sb] = sets[j];
        if (a.familyId === b.familyId || a.intensidad !== b.intensidad) continue;
        if (jaccard(sa, sb) >= 0.7) warn(a.id, `muy similar a ${b.id}; considerar mismo familyId`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export const EDITORIAL_FAMILIES = [
  "Preguntas y rompehielos",
  "Retos y desafíos",
  "Conexión y confianza",
  "Música y baile",
  "Dinámicas de dos y tres",
  "Elecciones",
  "Confesiones y secretos",
  "Sorpresas",
] as const;

/** Meta editorial de lanzamiento por familia y nivel (plan maestro §11.1). */
export const EDITORIAL_TARGETS: Record<string, number[]> = {
  leve: [80, 60, 35, 30, 30, 20, 25, 10],
  picante: [80, 90, 40, 40, 80, 35, 8, 20],
  perverso: [60, 100, 30, 30, 90, 40, 30, 20],
};

/** Familia editorial de una actividad: cada carta cuenta una sola vez. */
export function editorialFamily(a: Activity): (typeof EDITORIAL_FAMILIES)[number] {
  if (a.formato === "sorpresa") return "Sorpresas";
  switch (a.categoria) {
    case "preguntas":
    case "rompehielo":
      return "Preguntas y rompehielos";
    case "retos":
    case "desafios":
    case "masajes":
      return "Retos y desafíos";
    case "conexion":
    case "confianza":
      return "Conexión y confianza";
    case "musica":
    case "baile":
      return "Música y baile";
    case "pareja":
    case "trio":
      return "Dinámicas de dos y tres";
    case "eleccion":
      return "Elecciones";
    case "secretos":
      return "Confesiones y secretos";
    case "sorpresa":
      return "Sorpresas";
  }
}

export interface CatalogReport {
  total: number;
  production: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, Record<string, number>>;
  byGame: Record<string, Record<string, number>>;
  byFormat: Record<string, Record<string, number>>;
  bySessionSize: Record<string, Record<string, number>>;
  contact: Record<string, { contacto: number; sin_contacto: number }>;
  byStatus: Record<string, number>;
  byFamily: Record<string, Record<string, number>>;
}

export function catalogReport(catalog: readonly Activity[]): CatalogReport {
  const prod = catalog.filter((a) => a.active && a.editorialStatus === "reviewed");
  const inc = (o: Record<string, number>, k: string) => (o[k] = (o[k] ?? 0) + 1);
  const report: CatalogReport = {
    total: catalog.length,
    production: prod.length,
    byLevel: {},
    byCategory: {},
    byGame: {},
    byFormat: {},
    bySessionSize: {},
    contact: {},
    byStatus: {},
    byFamily: {},
  };
  for (const a of catalog) inc(report.byStatus, a.editorialStatus);
  for (const lvl of INTENSITIES) {
    report.byCategory[lvl] = {};
    report.byGame[lvl] = {};
    report.byFormat[lvl] = {};
    report.bySessionSize[lvl] = {};
    report.contact[lvl] = { contacto: 0, sin_contacto: 0 };
    report.byFamily[lvl] = Object.fromEntries(EDITORIAL_FAMILIES.map((f) => [f, 0]));
  }
  for (const a of prod) {
    const l = a.intensidad;
    inc(report.byLevel, l);
    inc(report.byCategory[l], a.categoria);
    inc(report.byFormat[l], a.formato);
    inc(report.byFamily[l], editorialFamily(a));
    for (const g of a.gameModes) inc(report.byGame[l], g);
    for (const n of a.sessionSizes) inc(report.bySessionSize[l], String(n));
    report.contact[l][isContactActivity(a) ? "contacto" : "sin_contacto"]++;
  }
  return report;
}
