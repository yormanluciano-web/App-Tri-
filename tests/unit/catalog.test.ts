import { describe, expect, it } from "vitest";
import { ALL_ACTIVITIES, CATALOG } from "@/data/catalog";
import { validateCatalog, catalogReport, EDITORIAL_FAMILIES, EDITORIAL_TARGETS } from "@/domain/content/validate";
import { buildCandidates } from "@/domain/engine/select";
import { GAME_FORMATS } from "@/domain/engine/orchestrator";
import { BASE_GAMES, INTENSITIES, type GameId } from "@/domain/models/constants";
import { allLights, config, participant, readySession } from "../helpers";

describe("catálogo de producción", () => {
  it("valida sin errores", () => {
    const r = validateCatalog(ALL_ACTIVITIES);
    expect(r.errors).toEqual([]);
  });

  it("cumple la meta editorial 300/450/450 por familia", () => {
    const r = catalogReport(ALL_ACTIVITIES);
    expect(r.byLevel).toEqual({ leve: 300, picante: 450, perverso: 450 });
    for (const lvl of INTENSITIES) EDITORIAL_FAMILIES.forEach((f, i) => expect(r.byFamily[lvl][f], `${lvl} ${f}`).toBe(EDITORIAL_TARGETS[lvl][i]));
  });

  it("cada nivel tiene actividades sin contacto para 2 y 3 personas", () => {
    for (const lvl of INTENSITIES) {
      for (const n of [2, 3] as const) {
        const ok = CATALOG.filter((a) => a.intensidad === lvl && a.sessionSizes.includes(n) && a.tags.includes("sin_contacto"));
        expect(ok.length, `${lvl} ${n}`).toBeGreaterThan(100);
      }
    }
  });

  const games: GameId[] = [...BASE_GAMES, "sorpresa"];
  for (const lvl of INTENSITIES) {
    for (const n of [2, 3] as const) {
      it(`cobertura de juegos en ${lvl} con ${n} personas (permisos amplios, desde el primer tramo)`, () => {
        const ids = ["a", "b", "c"].slice(0, n);
        const cfg = config(ids.map((id) => participant(id, allLights("green"))), { initialLevel: lvl });
        const s = readySession(cfg);
        const wide = { ...s, progress: { ...s.progress, turnsOfferedInLevel: 99 } };
        for (const g of games) {
          const opts = { game: g, formats: GAME_FORMATS[g], requireDuration: g === "temporizador" };
          const low = new Set(buildCandidates(CATALOG, s, opts, 0).map((c) => c.activity.id));
          const all = new Set(buildCandidates(CATALOG, wide, opts, 0).map((c) => c.activity.id));
          expect(low.size, `${g} tramo bajo`).toBeGreaterThan(0);
          const min = g === "sorpresa" ? 5 : ["mas_probable", "quien_conoce"].includes(g) ? 8 : g === "secretos" ? 12 : 40;
          expect(all.size, `${g} total`).toBeGreaterThanOrEqual(min);
        }
      });
    }
  }

  it("con la base segura, Leve ofrece variedad en los juegos principales", () => {
    for (const n of [2, 3] as const) {
      const cfg = config(["a", "b", "c"].slice(0, n).map((id) => participant(id)), { initialLevel: "leve" });
      const s = readySession(cfg);
      const wide = { ...s, progress: { ...s.progress, turnsOfferedInLevel: 99 } };
      for (const g of ["verdad_reto", "tarjetas", "ruleta", "dados", "temporizador", "cadena", "mas_probable", "quien_conoce"] as GameId[]) {
        const all = new Set(buildCandidates(CATALOG, wide, { game: g, formats: GAME_FORMATS[g], requireDuration: g === "temporizador" }, 0).map((c) => c.activity.id));
        expect(all.size, `${g} con ${n}`).toBeGreaterThanOrEqual(g === "mas_probable" || g === "quien_conoce" ? 5 : 40);
      }
    }
  });
});
