import {
  CONTACT_PERMISSIONS,
  PERMISSIONS,
  SAFE_BASE_GREEN,
  type Light,
  type Permission,
} from "../models/constants";
import type { Activity } from "../models/activity";
import type { Assignment, LimitProfile, Participant, ParticipantId } from "../models/session";

const SEVERITY: Record<Light, number> = { green: 0, yellow: 1, red: 2 };

function isLight(v: unknown): v is Light {
  return v === "green" || v === "yellow" || v === "red";
}

/** Normaliza: un valor ausente o desconocido es rojo (falla cerrado). */
export function normalizeLight(v: unknown): Light {
  return isLight(v) ? v : "red";
}

/** Orden de severidad red > yellow > green. */
export function strictest(...values: (Light | undefined | null)[]): Light {
  let worst: Light = "green";
  for (const raw of values) {
    if (raw === undefined || raw === null) continue;
    const v = normalizeLight(raw);
    if (SEVERITY[v] > SEVERITY[worst]) worst = v;
  }
  return worst;
}

export function safeBasePermissions(): Record<Permission, Light> {
  const out = {} as Record<Permission, Light>;
  for (const p of PERMISSIONS) out[p] = SAFE_BASE_GREEN.includes(p) ? "green" : "red";
  return out;
}

export function newLimitProfile(): LimitProfile {
  return { version: 1, permissions: safeBasePermissions(), pairOverrides: {} };
}

/** Límites compartidos iniciales: no añaden restricción, pero cada clave es explícita. */
export function neutralSharedLimits(): Record<Permission, Light> {
  const out = {} as Record<Permission, Light>;
  for (const p of PERMISSIONS) out[p] = "green";
  return out;
}

export function isContactPermission(p: Permission): boolean {
  return CONTACT_PERMISSIONS.includes(p);
}

export interface LimitContext {
  participants: readonly Participant[];
  sharedLimits: Partial<Record<Permission, Light>>;
}

/** Semáforo efectivo de una persona para un permiso (individual + compartido). */
export function personLight(ctx: LimitContext, pid: ParticipantId, perm: Permission): Light {
  const p = ctx.participants.find((x) => x.id === pid);
  if (!p) return "red";
  const individual = normalizeLight(p.limits.permissions[perm]);
  const shared = normalizeLight(ctx.sharedLimits[perm]);
  return strictest(individual, shared);
}

/**
 * Semáforo para un par concreto: combina a ambas personas, el ámbito compartido
 * y las restricciones por persona que cualquiera de las dos haya definido.
 */
export function pairLight(ctx: LimitContext, a: ParticipantId, b: ParticipantId, perm: Permission): Light {
  const pa = ctx.participants.find((x) => x.id === a);
  const pb = ctx.participants.find((x) => x.id === b);
  if (!pa || !pb || a === b) return "red";
  const overA = pa.limits.pairOverrides[b]?.[perm];
  const overB = pb.limits.pairOverrides[a]?.[perm];
  return strictest(
    personLight(ctx, a, perm),
    personLight(ctx, b, perm),
    overA === undefined ? undefined : normalizeLight(overA),
    overB === undefined ? undefined : normalizeLight(overB),
  );
}

export type Evaluation =
  | { ok: false; reason: "red" | "invalid" }
  | { ok: true; needsConsent: boolean; askees: ParticipantId[]; implicated: ParticipantId[] };

/** Personas implicadas en una asignación. Grupo implica a toda la sesión. */
export function implicatedFor(activity: Activity, assignment: Assignment, all: readonly ParticipantId[]): ParticipantId[] {
  if (activity.tipoInteraccion === "group") return [...all];
  const out: ParticipantId[] = [];
  for (const role of activity.roles) {
    const pid = assignment[role];
    if (pid && !out.includes(pid)) out.push(pid);
  }
  return out;
}

/**
 * Comprueba una actividad con una asignación concreta contra todos los límites.
 * Rojo en cualquier punto descarta; amarillo exige autorización privada de las
 * personas afectadas. Metadatos inválidos fallan de forma cerrada.
 */
export function evaluateAssignment(activity: Activity, assignment: Assignment, ctx: LimitContext): Evaluation {
  const all = ctx.participants.map((p) => p.id);
  // Validación estructural de la asignación.
  const assigned: ParticipantId[] = [];
  for (const role of activity.roles) {
    const pid = assignment[role];
    if (!pid || !all.includes(pid) || assigned.includes(pid)) return { ok: false, reason: "invalid" };
    assigned.push(pid);
  }
  const implicated = implicatedFor(activity, assignment, all);
  if (implicated.length < activity.participantesMinimos || implicated.length > activity.participantesMaximos) {
    return { ok: false, reason: "invalid" };
  }
  if (!activity.sessionSizes.includes(all.length as 2 | 3)) return { ok: false, reason: "invalid" };
  // «Solo hombre y mujer»: los dos roles con géneros distintos y conocidos (falla cerrada).
  if (activity.parejaMixta) {
    const g1 = ctx.participants.find((p) => p.id === assignment.p1)?.gender;
    const g2 = ctx.participants.find((p) => p.id === assignment.p2)?.gender;
    if (activity.roles.join() !== "p1,p2" || !g1 || !g2 || g1 === g2) return { ok: false, reason: "invalid" };
  }
  // «Solo hombres» / «Solo mujeres»: todas las personas implicadas con ese género declarado.
  if (activity.soloGenero) {
    for (const pid of implicated) {
      if (ctx.participants.find((p) => p.id === pid)?.gender !== activity.soloGenero) return { ok: false, reason: "invalid" };
    }
  }

  const askees = new Set<ParticipantId>();
  const check = (light: Light, who: ParticipantId[]): boolean => {
    if (light === "red") return false;
    if (light === "yellow") who.forEach((w) => askees.add(w));
    return true;
  };

  const r = activity.restricciones;
  for (const pid of implicated) {
    for (const perm of r.implicados) if (!check(personLight(ctx, pid, perm), [pid])) return { ok: false, reason: "red" };
  }
  for (const [role, perms] of Object.entries(r.porRol)) {
    const pid = assignment[role as keyof Assignment];
    if (!perms || perms.length === 0) continue;
    if (!pid) return { ok: false, reason: "invalid" };
    for (const perm of perms) if (!check(personLight(ctx, pid, perm), [pid])) return { ok: false, reason: "red" };
  }
  if (r.pareja.length > 0) {
    if (implicated.length < 2) return { ok: false, reason: "invalid" };
    for (let i = 0; i < implicated.length; i++) {
      for (let j = i + 1; j < implicated.length; j++) {
        const a = implicated[i];
        const b = implicated[j];
        for (const perm of r.pareja) if (!check(pairLight(ctx, a, b, perm), [a, b])) return { ok: false, reason: "red" };
      }
    }
  }
  const audience = activity.audienceScope === "sesion" ? all : implicated;
  for (const pid of audience) {
    for (const perm of r.audiencia) if (!check(personLight(ctx, pid, perm), [pid])) return { ok: false, reason: "red" };
  }
  // Lo que ocurre ante el grupo queda cubierto por los límites compartidos,
  // que ya se combinan en personLight para cada persona implicada.

  if (activity.requiereConfirmacion) implicated.forEach((p) => askees.add(p));
  const ordered = all.filter((p) => askees.has(p));
  return { ok: true, needsConsent: ordered.length > 0, askees: ordered, implicated };
}

/** Todos los permisos que una actividad menciona (para recuentos y validación). */
export function activityPermissions(activity: Activity): Permission[] {
  const r = activity.restricciones;
  const set = new Set<Permission>([...r.implicados, ...r.pareja, ...r.audiencia]);
  for (const perms of Object.values(r.porRol)) perms?.forEach((p) => set.add(p));
  return [...set];
}

export function isContactActivity(activity: Activity): boolean {
  return activityPermissions(activity).some(isContactPermission);
}
