import { describe, expect, it } from "vitest";
import { evaluateAssignment } from "@/domain/consent/limits";
import { validateCatalog } from "@/domain/content/validate";
import { defineCards } from "@/data/define";
import {
  applyCustomChange,
  buildCustomCard,
  customCardsToActivities,
  formFromCustomCard,
  newCardForm,
  parseCustomFile,
  EMPTY_CUSTOM_FILE,
} from "@/data/custom";
import { ALL_ACTIVITIES, BASE_ACTIVITIES, CUSTOM_FILE } from "@/data/catalog";
import type { Gender } from "@/domain/models/constants";
import type { Participant } from "@/domain/models/session";
import { allLights, participant } from "../helpers";

function person(id: string, gender?: Gender): Participant {
  return { ...participant(id, allLights("green")), ...(gender ? { gender } : {}) };
}
const ctx = (...people: Participant[]) => ({ participants: people, sharedLimits: allLights("green") });

describe("cartas de un solo género", () => {
  const [soloMujeres] = defineCards("leve", "sg", "test", [
    { id: "001", t: "Solo mujeres", x: "{p1} y {p2}, actividad de prueba solo para mujeres.", c: "pareja", f: "reto", s: 10, req: ["conversacion_ligera"], genero: "mujer" },
  ]);
  const [soloHombre] = defineCards("leve", "sg", "test", [
    { id: "002", t: "Solo hombre", x: "{p1}, actividad individual de prueba solo para hombres.", c: "retos", f: "reto", s: 10, req: ["conversacion_ligera"], genero: "hombre" },
  ]);

  it("exige que todas las personas implicadas tengan ese género", () => {
    const m1 = person("m1", "mujer");
    const m2 = person("m2", "mujer");
    const h = person("h", "hombre");
    expect(evaluateAssignment(soloMujeres, { p1: m1.id, p2: m2.id }, ctx(m1, m2, h)).ok).toBe(true);
    expect(evaluateAssignment(soloMujeres, { p1: m1.id, p2: h.id }, ctx(m1, m2, h)).ok).toBe(false);
    expect(evaluateAssignment(soloHombre, { p1: h.id }, ctx(m1, h)).ok).toBe(true);
    expect(evaluateAssignment(soloHombre, { p1: m1.id }, ctx(m1, h)).ok).toBe(false);
  });

  it("sin género declarado no sale (falla cerrada)", () => {
    const x = person("x");
    const y = person("y");
    expect(evaluateAssignment(soloHombre, { p1: x.id }, ctx(x, y)).ok).toBe(false);
  });

  it("el validador rechaza una carta mixta y de un solo género a la vez", () => {
    const bad = defineCards("leve", "sg", "test", [
      { id: "003", t: "Contradicción", x: "{p1} y {p2}, actividad de prueba contradictoria.", c: "pareja", f: "reto", s: 10, req: ["conversacion_ligera"], mixta: true, genero: "hombre" },
    ]);
    expect(validateCatalog(bad).errors.some((e) => e.message.includes("un solo género"))).toBe(true);
  });
});

describe("archivo de cartas propias", () => {
  it("el archivo del repositorio es válido y entra al catálogo", () => {
    expect(() => parseCustomFile(CUSTOM_FILE)).not.toThrow();
    const hidden = new Set(CUSTOM_FILE.ocultas);
    expect(ALL_ACTIVITIES.length).toBe(BASE_ACTIVITIES.filter((a) => !hidden.has(a.id)).length + CUSTOM_FILE.cartas.length);
  });

  it("el formulario coloca cada permiso donde el motor lo evalúa", () => {
    const card = buildCustomCard(
      {
        ...newCardForm(),
        nivel: "perverso",
        titulo: "Prueba",
        texto: "{p1}, quítate una prenda exterior y baila pegado con {p2}.",
        permisos: ["quitarse_prenda", "baile_cercano", "musica"],
        para: "mixta",
        intensidad: 80,
        duracion: 60,
      },
      "abcd1234",
      new Date("2026-10-08T00:00:00Z"),
    );
    expect(card.pair).toEqual(["baile_cercano"]);
    expect(card.req).toEqual(["quitarse_prenda", "musica"]);
    expect(card.aud).toEqual(["quitarse_prenda"]);
    expect(card.audScope).toBe("sesion");
    expect(card.i).toBe("directed_pair");
    expect(card.mixta).toBe(true);
    expect(card.d).toEqual([60, 30, 120]);
    const [activity] = customCardsToActivities([card]);
    expect(activity.id).toBe("c-abcd1234");
    expect(activity.parejaMixta).toBe(true);
    expect(validateCatalog([activity]).errors).toEqual([]);
    // Ida y vuelta formulario ↔ carta.
    expect(buildCustomCard(formFromCustomCard(card), card.id, new Date("2026-10-08T00:00:00Z"))).toEqual(card);
  });

  it("con Persona 3 la carta es de trío; «solo mujeres» queda marcado", () => {
    const card = buildCustomCard(
      { ...newCardForm(), nivel: "leve", intensidad: 10, titulo: "Trío", texto: "{p1}, {p2} y {p3}, cuenten una anécdota juntas.", para: "mujeres" },
      "trio0001",
    );
    expect(card.i).toBe("group");
    expect(card.sizes).toEqual([3]);
    expect(card.genero).toBe("mujer");
    const [activity] = customCardsToActivities([card]);
    expect(validateCatalog([activity]).errors).toEqual([]);
  });

  it("añadir, editar, borrar, ocultar y restaurar", () => {
    const card = buildCustomCard({ ...newCardForm(), nivel: "leve", intensidad: 10, titulo: "Uno", texto: "{p1}, cuenta tu canción favorita." }, "uno00001");
    let f = applyCustomChange(EMPTY_CUSTOM_FILE, { kind: "add", card });
    expect(f.cartas).toHaveLength(1);
    expect(() => applyCustomChange(f, { kind: "add", card })).toThrow();
    f = applyCustomChange(f, { kind: "update", card: { ...card, t: "Dos" } });
    expect(f.cartas[0].t).toBe("Dos");
    f = applyCustomChange(f, { kind: "hide", activityId: "l2-001" });
    f = applyCustomChange(f, { kind: "hide", activityId: "l2-001" });
    expect(f.ocultas).toEqual(["l2-001"]);
    f = applyCustomChange(f, { kind: "unhide", activityId: "l2-001" });
    f = applyCustomChange(f, { kind: "delete", id: card.id });
    expect(f).toEqual(EMPTY_CUSTOM_FILE);
  });
});
