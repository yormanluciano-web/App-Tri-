import { PERMISSIONS, PERMISSION_GROUPS, type GameId, type Intensity, type Light, type Permission } from "@/domain/models/constants";
import type { Participant, SessionConfig } from "@/domain/models/session";
import { randomId } from "@/domain/engine/rng";

/** En la demo solo hay preguntas y juegos sin contacto: charla y coqueteo. */
const DEMO_GROUPS = ["charla", "coqueteo"];

function demoPermissions(): Record<Permission, Light> {
  const green = new Set(PERMISSION_GROUPS.filter((g) => DEMO_GROUPS.includes(g.id)).flatMap((g) => g.items));
  const out = {} as Record<Permission, Light>;
  for (const p of PERMISSIONS) out[p] = green.has(p) ? "green" : "red";
  return out;
}

/**
 * Configuración de la demo: dos personas ficticias, nivel Leve, modo privado
 * (nada se guarda) y los juegos con más animación.
 */
export function demoConfig(): SessionConfig {
  const people = [
    { alias: "Ana", gender: "mujer" as const },
    { alias: "Leo", gender: "hombre" as const },
  ];
  const participants: Participant[] = people.map(({ alias, gender }, slot) => ({
    id: randomId("demo_"),
    alias,
    slot,
    adultDeclared: true,
    gender,
    limits: { version: 1, permissions: demoPermissions(), pairOverrides: {} },
    preferences: { preferred: ["preguntas", "musica", "conexion"], avoided: [] },
  }));
  return {
    mode: "private",
    participants,
    relationship: null,
    initialLevel: "leve",
    durationMin: null,
    games: ["verdad_reto", "torre", "botella", "rasca", "ruleta", "dados", "tarjetas", "temporizador"],
    sharedLimits: demoPermissions(),
    demo: true,
  };
}

/** Juegos que se reparten como en la creación de sesión (Noche y Caos arrastran los juegos base). */
function resolveGames(game: GameId): { games: GameId[]; durationMin: number | null } {
  if (game === "noche") return { games: ["noche", ...BASE_FOR_TEST, "sorpresa"], durationMin: 60 };
  if (game === "caos") return { games: ["caos", ...BASE_FOR_TEST, "sorpresa"], durationMin: null };
  return { games: [game], durationMin: null };
}

const BASE_FOR_TEST: GameId[] = ["verdad_reto", "ruleta", "dados", "tarjetas", "temporizador", "cadena", "torre", "botella", "rasca", "parques"];

/**
 * Prueba de un juego desde el panel de administración: personas ficticias
 * (hombre y mujeres, mayores de edad) que aceptan todo, para ver todas las
 * cartas del nivel. Siempre privada: nada se guarda.
 */
export function testConfig(game: GameId, level: Intensity, count: 2 | 3): SessionConfig {
  const people = [
    { alias: "Ana", gender: "mujer" as const },
    { alias: "Leo", gender: "hombre" as const },
    { alias: "Sol", gender: "mujer" as const },
  ].slice(0, count);
  const all = Object.fromEntries(PERMISSIONS.map((p) => [p, "green"])) as Record<Permission, Light>;
  const participants: Participant[] = people.map(({ alias, gender }, slot) => ({
    id: randomId("test_"),
    alias,
    slot,
    adultDeclared: true,
    gender,
    limits: { version: 1, permissions: { ...all }, pairOverrides: {} },
    preferences: { preferred: [], avoided: [] },
  }));
  const { games, durationMin } = resolveGames(game);
  return { mode: "private", participants, relationship: null, initialLevel: level, durationMin, games, sharedLimits: { ...all }, demo: true, prueba: true };
}

