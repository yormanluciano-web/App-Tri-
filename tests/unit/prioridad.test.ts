import { describe, expect, it } from "vitest";
import { draw } from "@/domain/engine/orchestrator";
import { isNovelty } from "@/domain/engine/select";
import type { Activity } from "@/domain/models/activity";
import { buildCustomCard, customCardsToActivities, formFromActivity } from "@/data/custom";
import { cardLine } from "@/data/source-edit";
import { seededRng } from "@/domain/engine/rng";
import { config, participant, readySession, syntheticCatalog } from "../helpers";

const NOW = Date.parse("2026-10-09T20:00:00Z");
const two = () => [participant("a", { conversacion_ligera: "green" }), participant("b", { conversacion_ligera: "green" })];

/** Cuántas veces sale cada carta como primera carta, en muchas sesiones distintas. */
function firstPicks(catalog: Activity[], seen?: ReadonlySet<string>, runs = 400): Map<string, number> {
  const counts = new Map<string, number>();
  for (let seed = 1; seed <= runs; seed++) {
    const s = readySession(config(two(), { initialLevel: "leve" }), seed, NOW);
    const out = draw(catalog, s, seededRng(seed * 7919), NOW, { game: "tarjetas", seen });
    const id = out.state.currentTurn?.activityId;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

describe("prioridad de novedades", () => {
  it("una carta creada o editada hace menos de 30 días sale mucho más que las demás", () => {
    const catalog = syntheticCatalog("leve", 40);
    const target = catalog[4];
    const fresh = catalog.map((a) => (a.id === target.id ? { ...a, novedad: "2026-10-05" } : a));
    const counts = firstPicks(fresh);
    const avg = 400 / catalog.length;
    expect(counts.get(target.id) ?? 0).toBeGreaterThan(avg * 4);
  });

  it("pasados 30 días deja de tener prioridad", () => {
    const old = { ...syntheticCatalog("leve", 1)[0], novedad: "2026-08-01" };
    expect(isNovelty(old, NOW)).toBe(false);
    expect(isNovelty({ ...old, novedad: "2026-10-01" }, NOW)).toBe(true);
    expect(isNovelty({ ...old, novedad: undefined }, NOW)).toBe(false);
  });

  it("la novedad nunca salta el tramo de intensidad ni los límites", () => {
    const catalog = syntheticCatalog("leve", 40);
    // Intensidad 30 (tramo alto de Leve): al empezar la sesión no puede salir aunque sea novedad.
    const hot = { ...catalog[0], intensityScore: 30, novedad: "2026-10-08" };
    // Sin permiso de nadie: tampoco sale.
    const forbidden = { ...catalog[1], novedad: "2026-10-08", restricciones: { ...catalog[1].restricciones, implicados: ["beso" as const] } };
    const counts = firstPicks([hot, forbidden, ...catalog.slice(2)]);
    expect(counts.get(hot.id) ?? 0).toBe(0);
    expect(counts.get(forbidden.id) ?? 0).toBe(0);
  });

  it("las cartas del panel llevan su fecha y al editar una original se anota en su línea", () => {
    const catalog = syntheticCatalog("leve", 1);
    const card = buildCustomCard(formFromActivity(catalog[0]), "abcd1234", new Date("2026-10-09T12:00:00Z"));
    const [act] = customCardsToActivities([card]);
    expect(act.novedad).toBe("2026-10-09");
    expect(cardLine("125", card, {})).toContain('nv: "2026-10-09"');
  });
});

describe("memoria de cartas ya vistas", () => {
  it("prefiere las cartas que este teléfono aún no ha mostrado", () => {
    const catalog = syntheticCatalog("leve", 40);
    const unseen = catalog[8];
    const seen = new Set(catalog.filter((a) => a.id !== unseen.id).map((a) => a.id));
    const counts = firstPicks(catalog, seen);
    expect(counts.get(unseen.id) ?? 0).toBeGreaterThan((400 / catalog.length) * 1.8);
  });
});
