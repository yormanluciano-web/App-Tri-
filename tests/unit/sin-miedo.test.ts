import { describe, expect, it } from "vitest";
import { draw } from "@/domain/engine/orchestrator";
import { fearlessLevelAt } from "@/domain/engine/progression";
import { seededRng } from "@/domain/engine/rng";
import { closeTurn, lowerLevel, requestLevelUp, resolveLevelUp } from "@/domain/state/session";
import { fromPersisted, toPersisted } from "@/storage/serialize";
import { CATALOG, CONTENT_VERSION } from "@/data/catalog";
import { activityPermissions } from "@/domain/consent/limits";
import type { SessionState } from "@/domain/models/session";
import { allLights, config, participant, readySession } from "../helpers";

const MIN = 60_000;
const people = () => [participant("a", allLights("green")), participant("b", allLights("green"))];
const fearless = (mode: "private" | "normal" = "private") => readySession(config(people(), { initialLevel: "leve", games: ["sin_miedo", "tarjetas", "verdad_reto"], mode }));
const at = (s: SessionState, minutes: number): SessionState => ({ ...s, activeMs: minutes * MIN, lastTickAt: null });

/** Saca una carta y la cierra; devuelve el estado y el nivel de la carta (o null si solo se anunció la subida). */
function play(s: SessionState, now: number): { state: SessionState; cardLevel: string | null } {
  const out = draw(CATALOG, s, seededRng(now), now);
  const t = out.state.currentTurn;
  if (!t || t.status === "closed") return { state: out.state, cardLevel: null };
  const level = CATALOG.find((a) => a.id === t.activityId)!.intensidad;
  return { state: closeTurn(out.state, t.id, "cumplido", now + 1), cardLevel: level };
}

describe("modo Sin miedo", () => {
  it("calendario: 15 min Leve, 20 min Picante y luego Perverso", () => {
    expect(fearlessLevelAt(0)).toBe("leve");
    expect(fearlessLevelAt(14.9 * MIN)).toBe("leve");
    expect(fearlessLevelAt(15 * MIN)).toBe("picante");
    expect(fearlessLevelAt(34.9 * MIN)).toBe("picante");
    expect(fearlessLevelAt(35 * MIN)).toBe("perverso");
    expect(fearlessLevelAt(300 * MIN)).toBe("perverso");
  });

  it("empieza en Leve y sube solo entre cartas: primero lo anuncia y la siguiente carta ya es del nivel nuevo", () => {
    let s = fearless();
    expect(s.autoAscent).toBe(true);
    expect(s.config.durationMin).toBeNull();
    let r = play(at(s, 5), 1000);
    expect(r.cardLevel).toBe("leve");

    r = play(at(r.state, 16), 2000);
    expect(r.cardLevel).toBeNull();
    expect(r.state.level).toBe("picante");
    expect(r.state.notice).toMatch(/Picante/);
    expect(r.state.status).toBe("ready");
    r = play(r.state, 3000);
    expect(r.cardLevel).toBe("picante");

    r = play(at(r.state, 40), 4000);
    expect(r.state.level).toBe("perverso");
    r = play(r.state, 5000);
    expect(r.cardLevel).toBe("perverso");
    s = r.state;
    expect(s.level).toBe("perverso");
  });

  it("si una carta larga dura mucho, al terminarla salta directo al nivel que corresponde", () => {
    const r = play(at(fearless(), 50), 1000);
    expect(r.state.level).toBe("perverso");
  });

  it("bajar de nivel detiene la subida automática; volver a subir pide unanimidad", () => {
    let r = play(at(fearless(), 20), 1000);
    expect(r.state.level).toBe("picante");
    let s = lowerLevel(r.state, "leve", 2000);
    expect(s.autoAscent).toBe(false);
    expect(s.notice).toMatch(/se detuvo/);
    r = play(at(s, 60), 3000);
    expect(r.state.level).toBe("leve");
    expect(r.cardLevel).toBe("leve");
    s = resolveLevelUp(requestLevelUp(r.state, 4000), false, 4001);
    expect(s.level).toBe("leve");
  });

  it("los límites personales se respetan en cada nivel: lo marcado en rojo nunca sale", () => {
    const strict = participant("b", { ...allLights("green"), beso: "red", quitarse_prenda: "red", desnudez: "red" });
    let s = readySession(config([participant("a", allLights("green")), strict], { initialLevel: "leve", games: ["sin_miedo", "tarjetas", "verdad_reto"] }));
    s = at(s, 40);
    for (let i = 0; i < 40; i++) {
      const out = draw(CATALOG, s, seededRng(i + 1), 10_000 + i);
      const t = out.state.currentTurn;
      s = out.state;
      if (!t || t.status === "closed") continue;
      const a = CATALOG.find((x) => x.id === t.activityId)!;
      if (t.implicated.includes("b") || a.audienceScope === "sesion") {
        for (const p of ["beso", "quitarse_prenda", "desnudez"] as const) expect(activityPermissions(a), a.id).not.toContain(p);
      }
      s = closeTurn(s, t.id, "cumplido", 10_000 + i);
    }
    expect(s.level).toBe("perverso");
  });

  it("otros modos nunca suben solos", () => {
    let s = readySession(config(people(), { initialLevel: "leve", games: ["tarjetas"] }));
    expect(s.autoAscent).toBeUndefined();
    const r = play(at(s, 120), 1000);
    s = r.state;
    expect(s.level).toBe("leve");
  });

  it("una sesión normal guardada conserva la subida automática", () => {
    const s = fearless("normal");
    const raw = JSON.parse(JSON.stringify(toPersisted(s, 1000)));
    const back = fromPersisted(raw, CATALOG, CONTENT_VERSION, 2000);
    expect(back.ok && back.state.autoAscent).toBe(true);
  });
});
