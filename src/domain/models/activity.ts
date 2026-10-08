import { z } from "zod";
import {
  CATEGORIES,
  FORMATS,
  GENDERS,
  GAMES,
  INTENSITIES,
  INTERACTIONS,
  PERMISSIONS,
  ROLE_IDS,
  SCHEMA_VERSION,
  SURPRISE_EFFECTS,
  TAGS,
} from "./constants";

const permissionList = z.array(z.enum(PERMISSIONS));

export const durationSchema = z
  .object({
    sugerida: z.number().int().positive(),
    minima: z.number().int().positive(),
    maxima: z.number().int().positive(),
  })
  .refine((d) => d.minima <= d.sugerida && d.sugerida <= d.maxima, {
    message: "duracion: se requiere minima <= sugerida <= maxima",
  });

export const restrictionsSchema = z.object({
  /** Permisos que necesita cada persona implicada. */
  implicados: permissionList,
  /** Permisos adicionales para quien ocupa un rol concreto. */
  porRol: z.partialRecord(z.enum(ROLE_IDS), permissionList).default({}),
  /** Permisos que deben estar permitidos para cada par de personas implicadas (incluye límites por persona). */
  pareja: permissionList,
  /** Permisos que debe aceptar toda la audiencia (según audienceScope). */
  audiencia: permissionList,
});

export const activitySchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/),
  schemaVersion: z.literal(SCHEMA_VERSION),
  contentVersion: z.number().int().positive(),
  titulo: z.string().trim().min(2).max(60),
  texto: z.string().trim().min(10).max(320),
  categoria: z.enum(CATEGORIES),
  formato: z.enum(FORMATS),
  intensidad: z.enum(INTENSITIES),
  intensityScore: z.number().int().min(0).max(100),
  participantesMinimos: z.number().int().min(1).max(3),
  participantesMaximos: z.number().int().min(1).max(3),
  sessionSizes: z.array(z.union([z.literal(2), z.literal(3)])).min(1),
  tipoInteraccion: z.enum(INTERACTIONS),
  roles: z.array(z.enum(ROLE_IDS)),
  audienceScope: z.enum(["implicados", "sesion"]),
  duracion: durationSchema.nullable(),
  tags: z.array(z.enum(TAGS)),
  restricciones: restrictionsSchema,
  gameModes: z.array(z.enum(GAMES)).min(1),
  pesoAleatorio: z.number().positive().finite(),
  cooldown: z.number().int().min(0),
  familyId: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
  requiereConfirmacion: z.boolean(),
  active: z.boolean(),
  premium: z.boolean(),
  packId: z.string().min(1),
  locale: z.literal("es"),
  editorialStatus: z.enum(["draft", "reviewed", "disabled"]),
  effect: z.enum(SURPRISE_EFFECTS).optional(),
  /** Solo para una pareja hombre y mujer (en cualquier orden). Exige tipo pareja. */
  parejaMixta: z.boolean().optional(),
  /** Solo para personas de un género: todas las implicadas deben tenerlo. */
  soloGenero: z.enum(GENDERS).optional(),
  /** Opciones cerradas para «Quién me conoce mejor» (coincidencia exacta normalizada). */
  opciones: z.array(z.string().trim().min(1).max(40)).min(2).max(6).optional(),
});

export type Activity = z.infer<typeof activitySchema>;
export type ActivityRestrictions = z.infer<typeof restrictionsSchema>;
export type ActivityDuration = z.infer<typeof durationSchema>;

export const contentPackSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  version: z.number().int().positive(),
  activityIds: z.array(z.string()),
  locale: z.literal("es"),
  premium: z.boolean(),
});
export type ContentPack = z.infer<typeof contentPackSchema>;
