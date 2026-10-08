import { describe, expect, it } from "vitest";
import { validateCatalog } from "@/domain/content/validate";
import { defineCards } from "@/data/define";

const card = (x: string) =>
  defineCards("perverso", "vt", "test", [{ id: "001", t: "Prueba", x, c: "retos", f: "reto", s: 80, i: "directed_pair", pair: ["beso_intenso"] }]);

describe("vocabulario de las cartas", () => {
  it("el vocabulario sexual ya no se veta: lo decide la propietaria", () => {
    const r = validateCatalog(card("{p1}, dale a {p2} un beso en los senos y quítale la ropa interior despacio."));
    expect(r.errors).toEqual([]);
  });

  it("cualquier mención de menores de edad bloquea siempre", () => {
    for (const x of ["{p1}, besa a {p2} como si fueran adolescentes.", "{p1}, cuéntale a {p2} algo de cuando eras niña.", "{p1} y {p2}, nada de menores de edad aquí."]) {
      expect(validateCatalog(card(x)).errors.some((e) => e.message.includes("menores de edad")), x).toBe(true);
    }
  });

  it("alcohol, fotos íntimas o humillación solo avisan, no bloquean", () => {
    const r = validateCatalog(card("{p1}, toma un trago y besa a {p2}; quien pierda recibe un castigo."));
    expect(r.errors).toEqual([]);
    expect(r.warnings.map((w) => w.message).join(" ")).toMatch(/alcohol.*|castigo/);
  });
});
