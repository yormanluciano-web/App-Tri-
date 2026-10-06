import { describe, expect, it } from "vitest";
import { evaluateAssignment, neutralSharedLimits, normalizeLight, strictest, pairLight } from "@/domain/consent/limits";
import { defineCards } from "@/data/define";
import { allLights, participant } from "../helpers";

const [hug] = defineCards("picante", "tl", "test", [
  { id: "hug", t: "Abrazo", x: "{p1} y {p2}, dense un abrazo breve.", c: "conexion", f: "reto", s: 40, pair: ["abrazo"] },
]);
const [talk] = defineCards("leve", "tl", "test", [
  { id: "talk", t: "Charla", x: "{p1}, cuenta algo de tu día.", c: "preguntas", f: "pregunta", s: 5, req: ["conversacion_ligera"] },
]);
const [confirm] = defineCards("leve", "tl", "test", [
  { id: "conf", t: "Confirmada", x: "{p1}, cuenta algo de tu semana.", c: "preguntas", f: "pregunta", s: 5, req: ["conversacion_ligera"], conf: true },
]);
const [groupSecret] = defineCards("leve", "tl", "test", [
  { id: "sec", t: "Secreto", x: "Escribe algo que te guste de los lunes.", c: "secretos", f: "secreto", s: 5, req: ["escritura_privada", "revelacion_grupo"] },
]);

describe("semáforo", () => {
  it("ordena severidad red > yellow > green", () => {
    expect(strictest("green", "yellow")).toBe("yellow");
    expect(strictest("yellow", "red", "green")).toBe("red");
    expect(strictest()).toBe("green");
  });
  it("trata valores ausentes o desconocidos como rojo", () => {
    expect(normalizeLight(undefined)).toBe("red");
    expect(normalizeLight("verde")).toBe("red");
    expect(normalizeLight(null)).toBe("red");
  });
});

describe("evaluación de asignaciones", () => {
  const shared = neutralSharedLimits();

  it("rojo individual descarta la asignación para esa persona", () => {
    const a = participant("a", { conversacion_ligera: "red" });
    const b = participant("b");
    const ctx = { participants: [a, b], sharedLimits: shared };
    expect(evaluateAssignment(talk, { p1: "a" }, ctx).ok).toBe(false);
    expect(evaluateAssignment(talk, { p1: "b" }, ctx).ok).toBe(true);
  });

  it("rojo compartido descarta para toda la sesión", () => {
    const a = participant("a");
    const b = participant("b");
    const ctx = { participants: [a, b], sharedLimits: { ...shared, conversacion_ligera: "red" as const } };
    expect(evaluateAssignment(talk, { p1: "a" }, ctx).ok).toBe(false);
    expect(evaluateAssignment(talk, { p1: "b" }, ctx).ok).toBe(false);
  });

  it("permiso ausente en el perfil falla de forma cerrada", () => {
    const a = participant("a");
    delete a.limits.permissions.conversacion_ligera;
    const ctx = { participants: [a, participant("b")], sharedLimits: shared };
    expect(evaluateAssignment(talk, { p1: "a" }, ctx).ok).toBe(false);
  });

  it("límite compartido ausente falla de forma cerrada", () => {
    const sharedMissing = { ...shared };
    delete (sharedMissing as Record<string, unknown>).conversacion_ligera;
    const ctx = { participants: [participant("a"), participant("b")], sharedLimits: sharedMissing };
    expect(evaluateAssignment(talk, { p1: "a" }, ctx).ok).toBe(false);
  });

  it("contacto bloqueado en la base segura", () => {
    const ctx = { participants: [participant("a"), participant("b")], sharedLimits: shared };
    expect(evaluateAssignment(hug, { p1: "a", p2: "b" }, ctx).ok).toBe(false);
  });

  it("contacto exige permiso de ambas personas", () => {
    const ctx = { participants: [participant("a", { abrazo: "green" }), participant("b")], sharedLimits: shared };
    expect(evaluateAssignment(hug, { p1: "a", p2: "b" }, ctx).ok).toBe(false);
  });

  it("restricción por persona prevalece sobre la categoría general en verde", () => {
    const a = participant("a", { abrazo: "green" });
    const b = participant("b", { abrazo: "green" });
    const c = participant("c", { abrazo: "green" });
    a.limits.pairOverrides = { c: { abrazo: "red" } };
    const ctx = { participants: [a, b, c], sharedLimits: shared };
    expect(evaluateAssignment(hug, { p1: "a", p2: "b" }, ctx).ok).toBe(true);
    expect(evaluateAssignment(hug, { p1: "a", p2: "c" }, ctx).ok).toBe(false);
    expect(evaluateAssignment(hug, { p1: "c", p2: "a" }, ctx).ok).toBe(false);
    expect(pairLight(ctx, "c", "a", "abrazo")).toBe("red");
  });

  it("amarillo exige autorización de las personas afectadas", () => {
    const ctx = { participants: [participant("a", { abrazo: "yellow" }), participant("b", { abrazo: "green" })], sharedLimits: shared };
    const ev = evaluateAssignment(hug, { p1: "a", p2: "b" }, ctx);
    expect(ev.ok).toBe(true);
    if (ev.ok) {
      expect(ev.needsConsent).toBe(true);
      expect(ev.askees.sort()).toEqual(["a", "b"]);
    }
  });

  it("requiereConfirmacion pide autorización aunque todo sea verde", () => {
    const ctx = { participants: [participant("a"), participant("b")], sharedLimits: shared };
    const ev = evaluateAssignment(confirm, { p1: "a" }, ctx);
    expect(ev.ok && ev.needsConsent && ev.askees).toEqual(["a"]);
  });

  it("actividad grupal valida a toda la sesión", () => {
    const yes = { escritura_privada: "green" as const, revelacion_grupo: "green" as const };
    const ctx2 = { participants: [participant("a", yes), participant("b", yes), participant("c")], sharedLimits: shared };
    expect(evaluateAssignment(groupSecret, {}, ctx2).ok).toBe(false);
    const ctx3 = { participants: [participant("a", yes), participant("b", yes), participant("c", yes)], sharedLimits: shared };
    expect(evaluateAssignment(groupSecret, {}, ctx3).ok).toBe(true);
  });

  it("asignaciones inválidas fallan de forma cerrada", () => {
    const ctx = { participants: [participant("a", allLights("green")), participant("b", allLights("green"))], sharedLimits: shared };
    expect(evaluateAssignment(hug, { p1: "a", p2: "a" }, ctx).ok).toBe(false);
    expect(evaluateAssignment(hug, { p1: "a" }, ctx).ok).toBe(false);
    expect(evaluateAssignment(hug, { p1: "a", p2: "zzz" }, ctx).ok).toBe(false);
  });
});
