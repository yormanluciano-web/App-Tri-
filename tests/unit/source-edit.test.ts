import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defineCards, type CardInput } from "@/data/define";
import { buildCustomCard, formFromActivity } from "@/data/custom";
import { cardLine, findCardLine, preservedFrom, replaceCard, splitBaseId } from "@/data/source-edit";
import { validateCatalog } from "@/domain/content/validate";
import { activityPermissions } from "@/domain/consent/limits";
import type { Intensity } from "@/domain/models/constants";

/** Evalúa una línea del catálogo como objeto (solo en pruebas). */
function parseLine(line: string): CardInput {
  return new Function(`return (${line.trim().replace(/,$/, "")});`)() as CardInput;
}

const LEVELS: { dir: Intensity; prefix: string }[] = [
  { dir: "leve", prefix: "l2" },
  { dir: "picante", prefix: "p2" },
  { dir: "perverso", prefix: "v2" },
];

const lines = LEVELS.flatMap(({ dir, prefix }) =>
  readdirSync(`src/data/${dir}`)
    .filter((f) => /^v2-\d+\.ts$/.test(f))
    .flatMap((f) =>
      readFileSync(`src/data/${dir}/${f}`, "utf8")
        .split("\n")
        .filter((l) => /^\s*\{ id: "/.test(l))
        .map((line) => ({ dir, prefix, line })),
    ),
);

describe("editar cartas originales en el código", () => {
  it("encuentra todas las cartas originales, cada una en una sola línea", () => {
    expect(lines.length).toBeGreaterThan(1000);
    expect(splitBaseId("p2-125")).toEqual({ prefix: "p2", suffix: "125", level: "picante" });
  });

  it("cada carta pasa por el editor y la línea reescrita sigue siendo válida, con los mismos permisos o más", () => {
    const rewritten = [];
    for (const { dir, prefix, line } of lines) {
      const input = parseLine(line);
      if (input.f === "sorpresa") continue;
      const [orig] = defineCards(dir, prefix, "base", [input]);
      const card = buildCustomCard(formFromActivity(orig), "base0000");
      const out = cardLine(input.id, card, preservedFrom(line));
      const [again] = defineCards(dir, prefix, "base", [parseLine(out)]);
      expect(again.id).toBe(orig.id);
      expect(again.familyId).toBe(orig.familyId);
      expect(again.texto).toBe(orig.texto);
      expect(again.tipoInteraccion).toBe(orig.tipoInteraccion);
      expect(again.tags.sort()).toEqual(orig.tags.sort());
      for (const p of activityPermissions(orig)) expect(activityPermissions(again), `${orig.id} ${p}`).toContain(p);
      rewritten.push(again);
    }
    const res = validateCatalog(rewritten);
    expect(res.errors.slice(0, 5), `${res.errors.length} errores`).toEqual([]);
  });

  it("reemplaza solo la línea de esa carta, con comillas y caracteres especiales a salvo", () => {
    const file = ['export const x = defineCards("picante", "p2", "base", [', '  { id: "124", t: "Otra", x: "{p1}, otra carta de prueba.", c: "retos", f: "reto", s: 40 },', '  { id: "125", t: "Tres besos", x: "{p1}, dale a {p2} tres besos.", c: "retos", f: "reto", s: 51, i: "directed_pair", pair: ["beso"], fam: "besos" },', "]);"].join("\n");
    const card = { ...buildCustomCard({ ...formFromActivity(defineCards("picante", "p2", "base", [parseLine(file.split("\n")[2])])[0]), titulo: 'Besos «lentos» y "suaves"' }, "base0000") };
    const out = replaceCard(file, "125", card)!;
    const outLines = out.split("\n");
    expect(outLines[1]).toBe(file.split("\n")[1]);
    expect(outLines[0]).toBe(file.split("\n")[0]);
    const parsed = parseLine(outLines[2]);
    expect(parsed.t).toBe('Besos «lentos» y "suaves"');
    expect(parsed.fam).toBe("besos");
    expect(parsed.id).toBe("125");
    expect(findCardLine(outLines, "999")).toBe(-1);
    expect(replaceCard(file, "999", card)).toBeNull();
  });
});
