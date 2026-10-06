// Enumeraciones centrales del dominio. Cambiar estos valores es un cambio de
// contrato: requiere migración de datos guardados y revisión del catálogo.

export const APP_NAME = "TRIO";
export const APP_SUBTITLE = "Conexión a tu ritmo";
export const APP_PROMISE = "Cada sesión es diferente. Tus límites siempre cuentan.";

export const SCHEMA_VERSION = 1;

export const INTENSITIES = ["leve", "picante", "perverso"] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const INTENSITY_LABEL: Record<Intensity, string> = {
  leve: "Leve",
  picante: "Picante",
  perverso: "Perverso",
};

export const INTENSITY_DESCRIPTION: Record<Intensity, string> = {
  leve: "Rompehielos, gustos, miradas, música y retos sociales sencillos.",
  picante: "Más complicidad, elecciones, preguntas atrevidas y cercanía solo si la autorizan.",
  perverso: "Confesiones, imaginación, roles de juego y sorpresas elaboradas. Nunca ignora límites.",
};

/** Intervalos internos de intensityScore por nivel (inclusivos). */
export const INTENSITY_RANGE: Record<Intensity, readonly [number, number]> = {
  leve: [0, 30],
  picante: [31, 65],
  perverso: [66, 100],
};

export const LIGHTS = ["green", "yellow", "red"] as const;
export type Light = (typeof LIGHTS)[number];

export const LIGHT_LABEL: Record<Light, string> = {
  green: "Permitido",
  yellow: "Preguntar antes",
  red: "Nunca mostrar",
};

export const LIGHT_DESCRIPTION: Record<Light, string> = {
  green: "Se puede proponer. Siempre puedes rechazar.",
  yellow: "Se pedirá tu autorización en privado cada vez.",
  red: "Nunca aparecerá nada que lo requiera.",
};

/** Taxonomía de permisos. `adivinanzas` forma parte de la base segura. */
export const PERMISSIONS = [
  "conversacion_ligera",
  "adivinanzas",
  "preguntas_personales",
  "confesiones",
  "fantasias",
  "coqueteo",
  "miradas",
  "musica",
  "baile_individual",
  "baile_cercano",
  "contacto_manos",
  "abrazo",
  "beso",
  "masaje_manos",
  "masaje_hombros",
  "ojos_cerrados",
  "roles_juego",
  "escritura_privada",
  "revelacion_grupo",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABEL: Record<Permission, string> = {
  conversacion_ligera: "Conversación ligera",
  adivinanzas: "Adivinanzas",
  preguntas_personales: "Preguntas personales",
  confesiones: "Confesiones",
  fantasias: "Imaginación y fantasías (no gráficas)",
  coqueteo: "Coqueteo",
  miradas: "Miradas",
  musica: "Música",
  baile_individual: "Baile individual",
  baile_cercano: "Baile cercano",
  contacto_manos: "Contacto de manos",
  abrazo: "Abrazo",
  beso: "Beso consensuado",
  masaje_manos: "Masaje de manos",
  masaje_hombros: "Masaje de hombros",
  ojos_cerrados: "Ojos cerrados",
  roles_juego: "Roles de juego",
  escritura_privada: "Escritura privada",
  revelacion_grupo: "Revelación al grupo",
};

export const PERMISSION_HINT: Record<Permission, string> = {
  conversacion_ligera: "Gustos, anécdotas y temas cotidianos.",
  adivinanzas: "Adivinar respuestas o preferencias de otras personas.",
  preguntas_personales: "Preguntas sobre tu vida, deseos y opiniones.",
  confesiones: "Contar algo que normalmente no cuentas.",
  fantasias: "Imaginar escenarios en conversación, sin detalles gráficos.",
  coqueteo: "Cumplidos, frases y gestos coquetos.",
  miradas: "Sostener miradas o expresar con la mirada.",
  musica: "Elegir, cantar o tararear canciones.",
  baile_individual: "Bailar sin contacto.",
  baile_cercano: "Bailar en pareja, con cercanía física.",
  contacto_manos: "Tomarse de las manos o tocar las manos.",
  abrazo: "Abrazos.",
  beso: "Besos, siempre consensuados.",
  masaje_manos: "Masaje breve de manos.",
  masaje_hombros: "Masaje breve de hombros.",
  ojos_cerrados: "Mantener los ojos cerrados durante una actividad.",
  roles_juego: "Interpretar personajes o roles lúdicos.",
  escritura_privada: "Escribir respuestas en el teléfono a solas.",
  revelacion_grupo: "Que tus respuestas escritas se lean ante el grupo.",
};

/** Permisos que implican contacto físico. Nunca se activan en silencio. */
export const CONTACT_PERMISSIONS: readonly Permission[] = [
  "baile_cercano",
  "contacto_manos",
  "abrazo",
  "beso",
  "masaje_manos",
  "masaje_hombros",
];

/** Base segura: verde para estas; rojo para todo lo demás. */
export const SAFE_BASE_GREEN: readonly Permission[] = [
  "conversacion_ligera",
  "musica",
  "adivinanzas",
  "baile_individual",
];

export const PERMISSION_GROUPS: { title: string; items: Permission[] }[] = [
  {
    title: "Conversación",
    items: ["conversacion_ligera", "adivinanzas", "preguntas_personales", "confesiones", "fantasias"],
  },
  { title: "Juego y expresión", items: ["coqueteo", "miradas", "musica", "baile_individual", "roles_juego", "ojos_cerrados"] },
  { title: "Escritura", items: ["escritura_privada", "revelacion_grupo"] },
  {
    title: "Contacto físico",
    items: ["baile_cercano", "contacto_manos", "abrazo", "beso", "masaje_manos", "masaje_hombros"],
  },
];

export const CATEGORIES = [
  "rompehielo",
  "preguntas",
  "retos",
  "pareja",
  "trio",
  "confianza",
  "masajes",
  "musica",
  "baile",
  "desafios",
  "conexion",
  "eleccion",
  "secretos",
  "sorpresa",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  rompehielo: "Rompehielo",
  preguntas: "Preguntas",
  retos: "Retos",
  pareja: "Pareja",
  trio: "Trío",
  confianza: "Confianza",
  masajes: "Masajes",
  musica: "Música",
  baile: "Baile",
  desafios: "Desafíos",
  conexion: "Conexión",
  eleccion: "Elección",
  secretos: "Secretos",
  sorpresa: "Sorpresa",
};

export const GAMES = [
  "verdad_reto",
  "ruleta",
  "dados",
  "tarjetas",
  "mas_probable",
  "quien_conoce",
  "secretos",
  "temporizador",
  "cadena",
  "noche",
  "caos",
  "sorpresa",
] as const;
export type GameId = (typeof GAMES)[number];

export const GAME_LABEL: Record<GameId, string> = {
  verdad_reto: "Verdad o reto",
  ruleta: "Ruleta",
  dados: "Dados",
  tarjetas: "Tarjetas",
  mas_probable: "¿Quién es más probable?",
  quien_conoce: "¿Quién me conoce mejor?",
  secretos: "Secretos",
  temporizador: "Temporizador",
  cadena: "Cadena de retos",
  noche: "Noche completa",
  caos: "Caos",
  sorpresa: "Carta sorpresa",
};

export const GAME_DESCRIPTION: Record<GameId, string> = {
  verdad_reto: "Elijan pregunta o reto. La app asigna protagonistas compatibles.",
  ruleta: "La ruleta sortea una asignación válida y su actividad.",
  dados: "Dados de participante, actividad y duración, validados antes de rodar.",
  tarjetas: "Cartas con filtro por categoría. Guarda tus favoritas.",
  mas_probable: "Una pregunta, un voto privado por persona y resultado agregado.",
  quien_conoce: "Una persona responde en privado; las demás intentan adivinar.",
  secretos: "Escriban respuestas anónimas, se mezclan y se leen al grupo.",
  temporizador: "Actividades con reloj de 30 s a 3 min. Pausar congela el tiempo.",
  cadena: "Tres etapas progresivas. Cada una se valida y se puede pasar.",
  noche: "60 minutos: apertura, desarrollo y cierre con mezcla automática.",
  caos: "Cada ronda elige juego, asignación y carta sin patrón fijo.",
  sorpresa: "Cada 4 a 7 rondas aparece un evento sorpresa compatible.",
};

/** Juegos que eligen carta del catálogo para su ronda base. */
export const BASE_GAMES: readonly GameId[] = [
  "verdad_reto",
  "ruleta",
  "dados",
  "tarjetas",
  "mas_probable",
  "quien_conoce",
  "secretos",
  "temporizador",
  "cadena",
];

export const FORMATS = ["pregunta", "reto", "votacion", "conocimiento", "secreto", "sorpresa"] as const;
export type Format = (typeof FORMATS)[number];

export const INTERACTIONS = ["solo", "pair", "directed_pair", "group"] as const;
export type Interaction = (typeof INTERACTIONS)[number];

export const ROLE_IDS = ["p1", "p2", "p3"] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export const SURPRISE_EFFECTS = [
  "todos_participan",
  "roles_juego",
  "elegir_companero",
  "repetir_voluntaria",
  "doble_mini",
  "cambiar_juego",
  "proponer_subir",
  "elegir_protagonista",
] as const;
export type SurpriseEffect = (typeof SURPRISE_EFFECTS)[number];

export const TAGS = [
  "sin_contacto",
  "contacto",
  "corto",
  "largo",
  "risas",
  "cierre",
  "apertura",
  "calma",
  "movimiento",
  "creatividad",
  "voz",
  "memoria",
  "cumplido",
] as const;
export type Tag = (typeof TAGS)[number];

export const DURATIONS_MIN = [15, 30, 45, 60, null] as const;
export type SessionDuration = (typeof DURATIONS_MIN)[number];

export const TIMER_OPTIONS_SEC = [30, 60, 120, 180] as const;

export const RELATIONSHIPS = ["pareja", "amigos", "pareja_invitado", "otro"] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  pareja: "Pareja",
  amigos: "Amigos",
  pareja_invitado: "Pareja + invitado/a",
  otro: "Otro",
};

export const PARTICIPANT_COLORS = ["#B9A7FF", "#FF8FB1", "#F5C76B"] as const;
export const PARTICIPANT_MARKS = ["●", "◆", "▲"] as const;
