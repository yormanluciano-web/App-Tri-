import { describe, expect, it } from "vitest";
import { evaluateAssignment } from "@/domain/consent/limits";
import { validateCatalog } from "@/domain/content/validate";
import { buildCandidates } from "@/domain/engine/select";
import { GAME_FORMATS } from "@/domain/engine/orchestrator";
import { CATALOG } from "@/data/catalog";
import { defineCards } from "@/data/define";
import type { Gender } from "@/domain/models/constants";
import type { Participant } from "@/domain/models/session";
import { toPersisted, fromPersisted } from "@/storage/serialize";
import { allLights, config, participant, readySession } from "../helpers";

const [mixed] = defineCards("leve", "gt", "test", [
  { id: "001", t: "Mixta", x: "{p1} y {p2}, actividad de prueba solo para hombre y mujer.", c: "pareja", f: "reto", s: 10, req: ["conversacion_ligera"], mixta: true },
]);

function person(id: string, gender?: Gender): Participant {
  return { ...participant(id, allLights("green")), ...(gender ? { gender } : {}) };
}

function ctx(...people: Participant[]) {
  return { participants: people, sharedLimits: allLights("green") };
}

describe("cartas solo hombre y mujer", () => {
  it("se permiten con hombre y mujer, en cualquier orden", () => {
    const h = person("h", "hombre");
    const m = person("m", "mujer");
    expect(evaluateAssignment(mixed, { p1: h.id, p2: m.id }, ctx(h, m)).ok).toBe(true);
    expect(evaluateAssignment(mixed, { p1: m.id, p2: h.id }, ctx(h, m)).ok).toBe(true);
  });

  it("nunca con dos personas del mismo género ni con género desconocido", () => {
    const h1 = person("h1", "hombre");
    const h2 = person("h2", "hombre");
    const m1 = person("m1", "mujer");
    const m2 = person("m2", "mujer");
    const x = person("x");
    expect(evaluateAssignment(mixed, { p1: h1.id, p2: h2.id }, ctx(h1, h2)).ok).toBe(false);
    expect(evaluateAssignment(mixed, { p1: m1.id, p2: m2.id }, ctx(m1, m2)).ok).toBe(false);
    expect(evaluateAssignment(mixed, { p1: m1.id, p2: x.id }, ctx(m1, x)).ok).toBe(false);
  });

  it("en un trío de dos mujeres y un hombre, la carta solo cae en parejas mixtas", () => {
    const people = [person("a", "mujer"), person("b", "mujer"), person("c", "hombre")];
    const s = readySession(config(people, { initialLevel: "perverso" }));
    const wide = { ...s, progress: { ...s.progress, turnsOfferedInLevel: 99 } };
    const cands = buildCandidates(CATALOG, wide, { game: "verdad_reto", formats: GAME_FORMATS.verdad_reto }, 0).filter((c) => c.activity.parejaMixta);
    expect(cands.length).toBeGreaterThan(0);
    for (const c of cands) {
      const g = [c.assignment.p1, c.assignment.p2].map((id) => people.find((p) => p.id === id)!.gender);
      expect(new Set(g).size).toBe(2);
    }
  });

  it("dos personas del mismo género nunca reciben cartas mixtas", () => {
    const s = readySession(config([person("a", "mujer"), person("b", "mujer")], { initialLevel: "perverso" }));
    const wide = { ...s, progress: { ...s.progress, turnsOfferedInLevel: 99 } };
    const cands = buildCandidates(CATALOG, wide, { game: "verdad_reto", formats: GAME_FORMATS.verdad_reto }, 0);
    expect(cands.length).toBeGreaterThan(0);
    expect(cands.some((c) => c.activity.parejaMixta)).toBe(false);
  });

  it("el validador rechaza «mixta» en cartas que no son de pareja", () => {
    const bad = defineCards("leve", "gt", "test", [
      { id: "002", t: "Solo", x: "{p1}, actividad individual de prueba con marca mixta.", c: "retos", f: "reto", s: 10, req: ["conversacion_ligera"], mixta: true },
    ]);
    expect(validateCatalog(bad).errors.some((e) => e.message.includes("parejaMixta"))).toBe(true);
  });

  it("el género se guarda y se restaura en sesiones normales", () => {
    const s = readySession(config([person("a", "mujer"), person("b", "hombre")], { mode: "normal" }));
    const back = fromPersisted(JSON.parse(JSON.stringify(toPersisted(s, 0))), CATALOG, 1, 0);
    expect(back.ok && back.state.config.participants.map((p) => p.gender)).toEqual(["mujer", "hombre"]);
  });
});
