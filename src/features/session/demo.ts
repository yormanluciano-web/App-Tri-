import { PERMISSIONS, PERMISSION_GROUPS, type Light, type Permission } from "@/domain/models/constants";
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
  const participants: Participant[] = ["Ana", "Leo"].map((alias, slot) => ({
    id: randomId("demo_"),
    alias,
    slot,
    adultDeclared: true,
    limits: { version: 1, permissions: demoPermissions(), pairOverrides: {} },
    preferences: { preferred: ["preguntas", "musica", "conexion"], avoided: [] },
  }));
  return {
    mode: "private",
    participants,
    relationship: null,
    initialLevel: "leve",
    durationMin: null,
    games: ["verdad_reto", "ruleta", "dados", "tarjetas", "temporizador"],
    sharedLimits: demoPermissions(),
    demo: true,
  };
}
