import { describe, expect, it } from "vitest";
import { BASE_ACTIVITIES } from "@/data/catalog";
import {
  applyBaseEdits,
  applyCustomChange,
  buildCustomCard,
  editedActivity,
  formFromActivity,
  toBaseEdit,
  EMPTY_CUSTOM_FILE,
} from "@/data/custom";
import { validateCatalog } from "@/domain/content/validate";
import { activityPermissions } from "@/domain/consent/limits";

const editable = BASE_ACTIVITIES.filter((a) => a.formato !== "sorpresa");

describe("editar cartas base", () => {
  it("cualquier carta base pasa por el editor sin cambios y sigue siendo válida", () => {
    const edited = editable.map((a) => editedActivity(a, toBaseEdit(buildCustomCard(formFromActivity(a), "base0000"))));
    const res = validateCatalog(edited);
    expect(res.errors.slice(0, 8), `${res.errors.length} errores`).toEqual([]);
    for (let i = 0; i < editable.length; i++) {
      const a = editable[i];
      const e = edited[i];
      expect(e.id).toBe(a.id);
      expect(e.familyId).toBe(a.familyId);
      expect(e.texto).toBe(a.texto);
      expect(e.intensidad).toBe(a.intensidad);
      expect(e.tipoInteraccion).toBe(a.tipoInteraccion);
      expect(e.contentVersion).toBe(a.contentVersion + 1);
      // Nunca pide menos permisos que el original (lo aceptado se sigue respetando).
      for (const p of activityPermissions(a)) expect(activityPermissions(e), `${a.id} ${p}`).toContain(p);
    }
  });

  it("guardar, aplicar y restaurar una edición", () => {
    const base = editable.find((a) => a.id === "l2-001")!;
    const form = { ...formFromActivity(base), titulo: "Título nuevo", texto: base.texto.replace(/\.$/, "") + ", con una sonrisa." };
    const edit = toBaseEdit(buildCustomCard(form, "base0000"));
    let f = applyCustomChange(EMPTY_CUSTOM_FILE, { kind: "edit_base", activityId: base.id, edit });
    const [after] = applyBaseEdits([base], f.ediciones);
    expect(after.titulo).toBe("Título nuevo");
    expect(after.id).toBe("l2-001");
    f = applyCustomChange(f, { kind: "revert_base", activityId: base.id });
    expect(applyBaseEdits([base], f.ediciones)[0]).toBe(base);
  });
});
