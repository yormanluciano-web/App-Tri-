import { describe, expect, it } from "vitest";
import { validateImportedPack, LocalCatalogRepository } from "@/domain/content/repository";
import { ALL_ACTIVITIES, CATALOG, PACKS } from "@/data/catalog";

describe("contratos de catálogo", () => {
  it("lee el catálogo local", async () => {
    const repo = new LocalCatalogRepository(CATALOG, PACKS);
    expect((await repo.list()).length).toBe(CATALOG.length);
    expect((await repo.get(CATALOG[0].id))?.id).toBe(CATALOG[0].id);
  });
  it("un paquete importado se valida, no reutiliza IDs y entra como borrador", () => {
    const ids = new Set(ALL_ACTIVITIES.map((a) => a.id));
    const clone = { ...ALL_ACTIVITIES[0] };
    const r = validateImportedPack([clone], ids);
    expect(r.ok).toBe(false);
    const fresh = { ...ALL_ACTIVITIES[0], id: "x-001", texto: "{p1}, cuenta algo nuevo que aprendiste esta semana." };
    const r2 = validateImportedPack([fresh, { id: "malo", effect: "eval()" }], ids);
    expect(r2.ok).toBe(false);
    expect(r2.activities.every((a) => a.editorialStatus === "draft")).toBe(true);
  });
});
