import { describe, expect, it } from "vitest";
import type { Activity } from "@/domain/models/activity";
import type { SessionState } from "@/domain/models/session";
import { seededRng, type Rng } from "@/domain/engine/rng";
import { draw } from "@/domain/engine/orchestrator";
import { selectCandidate, buildCandidates } from "@/domain/engine/select";
import { bandRange, currentBand } from "@/domain/engine/progression";
import { closeTurn, resolveActivityConsent } from "@/domain/state/session";
import { evaluateAssignment } from "@/domain/consent/limits";
import { CATALOG } from "@/data/catalog";
import { allLights, config, participant, readySession, syntheticCatalog } from "../helpers";

/** Juega `n` oportunidades aceptando autorizaciones y alternando Cumplido/Pasar. */
function play(state: SessionState, catalog: readonly Activity[], rng: Rng, n: number, onTurn?: (s: SessionState) => void) {
  let now = 1_000;
  for (let i = 0; i < n; i++) {
    now += 30_000;
    const out = draw(catalog, state, rng, now, { skipSurprise: true });
    state = out.state;
    if (!out.candidate) break;
    if (state.status === "awaitingActivityConsent") {
      state = resolveActivityConsent(state, { turnId: state.currentTurn!.id, limitsVersion: state.limitsVersion, accepted: true }, now);
    }
    onTurn?.(state);
    state = closeTurn(state, state.currentTurn!.id, i % 3 === 0 ? "pasado" : "cumplido", now + 1);
  }
  return state;
}

describe("equilibrio y variedad (simulación de referencia)", () => {
  for (const size of [2, 3] as const) {
    it(`100 semillas × 200 oportunidades con ${size} personas: espera máxima ≤ 3 y reparto coherente`, () => {
      const catalog = syntheticCatalog("leve", 60);
      let worstSpread = 0;
      for (let seed = 1; seed <= 100; seed++) {
        const ids = ["a", "b", "c"].slice(0, size);
        const cfg = config(ids.map((id) => participant(id)));
        const rng = seededRng(seed);
        let longest = 0;
        const out = play(readySession(cfg, seed), catalog, rng, 200, (s) => {
          for (const id of ids) longest = Math.max(longest, s.stats.sinceProtagonist[id] ?? 0);
        });
        expect(out.turnCounter).toBe(200);
        expect(out.stats.maxWaitObserved).toBeLessThanOrEqual(3);
        expect(longest).toBeLessThanOrEqual(3);
        const offered = ids.map((id) => out.stats.offered[id]);
        const spread = Math.max(...offered) - Math.min(...offered);
        worstSpread = Math.max(worstSpread, spread);
        // Tolerancia explícita: diferencia de oportunidades ≤ 3 entre personas.
        expect(spread).toBeLessThanOrEqual(3);
      }
      expect(worstSpread).toBeLessThanOrEqual(3);
    });
  }

  it("pares dirigidos con igual elegibilidad se reparten dentro de la tolerancia", () => {
    const catalog = syntheticCatalog("leve", 60);
    const totals: Record<string, number> = {};
    for (let seed = 1; seed <= 100; seed++) {
      const cfg = config(["a", "b", "c"].map((id) => participant(id)));
      const out = play(readySession(cfg, seed), catalog, seededRng(seed), 200);
      for (const [k, v] of Object.entries(out.stats.combos)) if (k.includes(">")) totals[k] = (totals[k] ?? 0) + v;
    }
    const values = Object.values(totals);
    expect(values.length).toBe(6);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    for (const v of values) expect(Math.abs(v - mean) / mean).toBeLessThan(0.15);
  });

  it("límites asimétricos: prioriza seguridad y no se atasca", () => {
    const catalog = syntheticCatalog("leve", 60);
    // c no acepta conversación: no puede protagonizar nada de este catálogo.
    const cfg = config([participant("a"), participant("b"), participant("c", { conversacion_ligera: "red" })]);
    const out = play(readySession(cfg, 7), catalog, seededRng(7), 120, (s) => {
      const t = s.currentTurn!;
      expect(t.implicated).not.toContain("c");
    });
    expect(out.turnCounter).toBe(120);
    expect(out.stats.offered.c).toBe(0);
    expect(Math.abs(out.stats.offered.a - out.stats.offered.b)).toBeLessThanOrEqual(2);
  });

  it("cooldown y separación de familia se respetan", () => {
    const catalog = syntheticCatalog("leve", 60);
    const cfg = config([participant("a"), participant("b")]);
    const seen: { id: string; at: number }[] = [];
    play(readySession(cfg, 3), catalog, seededRng(3), 150, (s) => {
      const t = s.currentTurn!;
      const last = [...seen].reverse().find((x) => x.id === t.activityId);
      if (last) expect(t.opportunity - last.at).toBeGreaterThanOrEqual(12);
      seen.push({ id: t.activityId, at: t.opportunity });
    });
  });

  it("agotamiento no produce bucle infinito ni relaja filtros", () => {
    const catalog = syntheticCatalog("leve", 4);
    const cfg = config([participant("a"), participant("b")]);
    let state = readySession(cfg, 1);
    const rng = seededRng(1);
    let blocked = false;
    for (let i = 0; i < 30; i++) {
      const out = draw(catalog, state, rng, 1000 + i, { skipSurprise: true });
      state = out.state;
      if (!out.candidate) {
        blocked = true;
        expect(out.reason).toBe("agotado");
        expect(state.status).toBe("blocked");
        break;
      }
      state = closeTurn(state, state.currentTurn!.id, "pasado", 1000 + i);
    }
    expect(blocked).toBe(true);
  });
});

describe("filtros obligatorios", () => {
  it("ningún peso rehabilita una opción descartada por límites", () => {
    const catalog = syntheticCatalog("leve", 20);
    const a = participant("a", { conversacion_ligera: "red" });
    a.preferences.preferred = ["retos", "pareja", "conexion", "preguntas"];
    const cfg = config([a, participant("b")]);
    const state = readySession(cfg, 2);
    for (const c of buildCandidates(catalog, state, { game: "tarjetas" }, 0)) expect(c.implicated).not.toContain("a");
  });

  it("toda carta seleccionada del catálogo real cumple los límites de su asignación", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = seededRng(seed);
      const perms = seed % 2 === 0 ? allLights("green") : undefined;
      const cfg = config([participant("a", perms), participant("b"), participant("c", { abrazo: "yellow", coqueteo: "green" })], {
        initialLevel: (["leve", "picante", "perverso"] as const)[seed % 3],
        games: ["tarjetas", "verdad_reto", "mas_probable", "quien_conoce", "secretos", "temporizador", "cadena", "sorpresa"],
      });
      let state = readySession(cfg, seed);
      for (let i = 0; i < 40; i++) {
        const out = draw(CATALOG, state, rng, 10_000 * (i + 1));
        state = out.state;
        if (!out.candidate) break;
        const ev = evaluateAssignment(out.candidate.activity, state.currentTurn!.assignment, {
          participants: state.config.participants,
          sharedLimits: state.config.sharedLimits,
        });
        expect(ev.ok).toBe(true);
        expect(out.candidate.activity.intensidad).toBe(state.level);
        if (state.status === "awaitingActivityConsent") {
          state = resolveActivityConsent(state, { turnId: state.currentTurn!.id, limitsVersion: state.limitsVersion, accepted: i % 2 === 0 }, 1);
          if (state.status === "selecting") continue;
        }
        state = closeTurn(state, state.currentTurn!.id, "cumplido", 10_000 * (i + 1) + 5);
      }
    }
  });
});

describe("progresión", () => {
  it("el score nunca supera el techo del tramo ni sale del nivel", () => {
    const catalog = [...syntheticCatalog("picante", 30), ...CATALOG];
    const cfg = config([participant("a", allLights("green")), participant("b", allLights("green"))], { initialLevel: "picante", durationMin: 30 });
    let state = readySession(cfg, 5);
    const rng = seededRng(5);
    let now = 0;
    for (let i = 0; i < 30; i++) {
      now += 60_000;
      const band = currentBand(state.progress, state.activeMs);
      const out = draw(catalog, state, rng, now, { skipSurprise: true });
      state = out.state;
      if (!out.candidate) break;
      const score = out.candidate.activity.intensityScore;
      expect(score).toBeLessThanOrEqual(bandRange("picante", band)[1]);
      expect(score).toBeGreaterThanOrEqual(31);
      expect(state.level).toBe("picante");
      if (state.status === "awaitingActivityConsent")
        state = resolveActivityConsent(state, { turnId: state.currentTurn!.id, limitsVersion: state.limitsVersion, accepted: true }, now);
      state = closeTurn(state, state.currentTurn!.id, "cumplido", now + 30_000);
    }
  });

  it("tramo bajo los 3 primeros turnos, medio hasta el 7 y alto desde el 8 (sin límite)", () => {
    const p = { enteredAtActiveMs: 0, horizonMs: null, turnsOfferedInLevel: 0 };
    expect(currentBand({ ...p, turnsOfferedInLevel: 0 }, 0)).toBe(0);
    expect(currentBand({ ...p, turnsOfferedInLevel: 2 }, 0)).toBe(0);
    expect(currentBand({ ...p, turnsOfferedInLevel: 3 }, 0)).toBe(1);
    expect(currentBand({ ...p, turnsOfferedInLevel: 6 }, 0)).toBe(1);
    expect(currentBand({ ...p, turnsOfferedInLevel: 7 }, 0)).toBe(2);
  });

  it("con duración finita el tiempo también limita el tramo", () => {
    const p = { enteredAtActiveMs: 0, horizonMs: 30 * 60_000, turnsOfferedInLevel: 20 };
    expect(currentBand(p, 5 * 60_000)).toBe(0);
    expect(currentBand(p, 15 * 60_000)).toBe(1);
    expect(currentBand(p, 25 * 60_000)).toBe(2);
  });

  it("selección determinista con semilla", () => {
    const catalog = syntheticCatalog("leve", 30);
    const cfg = config([participant("a"), participant("b")]);
    const s = readySession(cfg, 9);
    const r1 = selectCandidate(catalog, s, { game: "tarjetas" }, seededRng(42), 0);
    const r2 = selectCandidate(catalog, s, { game: "tarjetas" }, seededRng(42), 0);
    expect(r1.ok && r2.ok && r1.candidate.activity.id === r2.candidate.activity.id).toBe(true);
  });
});
