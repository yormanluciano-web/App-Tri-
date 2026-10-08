import { describe, expect, it } from "vitest";
import { evaluateAssignment } from "@/domain/consent/limits";
import { validateCatalog } from "@/domain/content/validate";
import { buildCustomCard, customCardsToActivities, newCardForm } from "@/data/custom";
import { PERMISSIONS, PERMISSION_GROUPS, type Light, type Permission } from "@/domain/models/constants";
import { participant } from "../helpers";

/** «Acepto todo» del editor de límites: todos los permisos en verde. */
const todo = () => Object.fromEntries(PERMISSIONS.map((p) => [p, "green"])) as Record<Permission, Light>;
/** «Acepto parcialmente» marcando todas las categorías del menú. */
const parcialCompleto = () => {
  const green = new Set(PERMISSION_GROUPS.flatMap((g) => g.items));
  return Object.fromEntries(PERMISSIONS.map((p) => [p, green.has(p) ? "green" : "red"])) as Record<Permission, Light>;
};

const [card] = customCardsToActivities([
  buildCustomCard(
    { ...newCardForm(), nivel: "perverso", intensidad: 95, titulo: "Sin nada", texto: "{p1}, quítale a {p2} la ropa interior, muy despacio.", implica: "acepta_todo" },
    "desnu001",
  ),
]);

describe("ropa interior y desnudez dentro de «Acepto todo»", () => {
  it("la carta «solo a quien acepta todo» pide desnudez, también ante el grupo, y es válida", () => {
    expect(card.restricciones.implicados).toContain("desnudez");
    expect(card.restricciones.audiencia).toContain("desnudez");
    expect(card.audienceScope).toBe("sesion");
    expect(validateCatalog([card]).errors).toEqual([]);
  });

  it("sale entre quienes eligieron «Acepto todo»", () => {
    const a = participant("a", todo());
    const b = participant("b", todo());
    expect(evaluateAssignment(card, { p1: a.id, p2: b.id }, { participants: [a, b], sharedLimits: todo() }).ok).toBe(true);
  });

  it("no sale a quien aceptó parcialmente, aunque marcara todas las categorías", () => {
    const a = participant("a", todo());
    const b = participant("b", parcialCompleto());
    expect(evaluateAssignment(card, { p1: a.id, p2: b.id }, { participants: [a, b], sharedLimits: todo() }).ok).toBe(false);
  });

  it("en un trío, si la tercera persona no aceptó todo, no sale (ocurre ante el grupo)", () => {
    const a = participant("a", todo());
    const b = participant("b", todo());
    const c = participant("c", parcialCompleto());
    expect(evaluateAssignment(card, { p1: a.id, p2: b.id }, { participants: [a, b, c], sharedLimits: todo() }).ok).toBe(false);
  });

  it("una sesión guardada antes de existir el permiso no lo tiene: cuenta como no aceptado", () => {
    const viejo = { ...todo() } as Partial<Record<Permission, Light>>;
    delete viejo.desnudez;
    const a = participant("a", viejo);
    const b = participant("b", todo());
    expect(evaluateAssignment(card, { p1: a.id, p2: b.id }, { participants: [a, b], sharedLimits: todo() }).ok).toBe(false);
  });

  it("el validador exige que la desnudez se declare ante toda la sesión", () => {
    const bad = { ...card, audienceScope: "implicados" as const, restricciones: { ...card.restricciones, audiencia: [] } };
    expect(validateCatalog([bad]).errors.some((e) => e.message.includes("desnudez"))).toBe(true);
  });
});
