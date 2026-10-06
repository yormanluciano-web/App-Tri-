import { describe, expect, it } from "vitest";
import { seededRng } from "@/domain/engine/rng";
import { draw } from "@/domain/engine/orchestrator";
import { defineCards } from "@/data/define";
import {
  changeTurn,
  closeTurn,
  createSession,
  lowerLevel,
  pause,
  requestLevelUp,
  resolveActivityConsent,
  resolveInitialConsent,
  resolveLevelUp,
  resume,
  startTimer,
  stop,
  timerFinished,
  timerRemaining,
  tick,
  updateParticipantLimits,
  updateSharedLimits,
  NOTICE,
} from "@/domain/state/session";
import { allLights, config, participant, readySession, syntheticCatalog } from "../helpers";

const yellowCatalog = defineCards("leve", "ty", "test", [
  { id: "y1", t: "Manos", x: "{p1} y {p2}, junten las palmas durante diez segundos.", c: "pareja", f: "reto", s: 3, pair: ["contacto_manos"], d: [30, 10, 60], g: ["tarjetas", "temporizador"] },
  { id: "y2", t: "Charla", x: "{p1}, cuenta qué te hizo sonreír esta semana.", c: "preguntas", f: "pregunta", s: 3, req: ["conversacion_ligera"], d: [30, 10, 60], g: ["tarjetas", "temporizador"] },
]);

function yellowSession() {
  const cfg = config([participant("a", { contacto_manos: "yellow", conversacion_ligera: "red" }), participant("b", { contacto_manos: "green", conversacion_ligera: "red" })]);
  return readySession(cfg, 1);
}

describe("consentimiento inicial", () => {
  it("no inicia sin aceptación de todas las personas", () => {
    const cfg = config([participant("a"), participant("b")]);
    const s = createSession(cfg, { now: 0, contentVersion: 1, seed: 1, rng: seededRng(1) });
    expect(s.status).toBe("awaitingInitialConsent");
    expect(resolveInitialConsent(s, false, 0).status).toBe("setup");
    expect(resolveInitialConsent(s, true, 0).status).toBe("ready");
  });
});

describe("autorización puntual (amarillo)", () => {
  it("una actividad amarilla queda a la espera y no inicia reloj", () => {
    const out = draw(yellowCatalog, yellowSession(), seededRng(1), 10);
    const s = out.state;
    expect(s.status).toBe("awaitingActivityConsent");
    expect(s.currentTurn!.authorized).toBe(false);
    expect(s.currentTurn!.consentAskees.sort()).toEqual(["a", "b"]);
    const t = startTimer(s, s.currentTurn!.id, 30_000, 20);
    expect(t.timer).toBeNull();
  });

  it("rechazo: elige otra actividad, sin autoría y sin insistir en la familia", () => {
    let s = draw(yellowCatalog, yellowSession(), seededRng(1), 10).state;
    s = resolveActivityConsent(s, { turnId: s.currentTurn!.id, limitsVersion: s.limitsVersion, accepted: false }, 20);
    expect(s.status).toBe("selecting");
    expect(s.notice).toBe(NOTICE.rejected);
    expect(s.notice).not.toMatch(/\d/);
    const again = draw(yellowCatalog, s, seededRng(2), 30, { allowRepeat: true });
    expect(again.candidate).toBeUndefined();
    expect(again.state.status).toBe("blocked");
  });

  it("autorización con versión de límites antigua se ignora", () => {
    let s = draw(yellowCatalog, yellowSession(), seededRng(1), 10).state;
    const stale = resolveActivityConsent(s, { turnId: s.currentTurn!.id, limitsVersion: s.limitsVersion - 1, accepted: true }, 20);
    expect(stale.status).toBe("awaitingActivityConsent");
    expect(stale.currentTurn!.authorized).toBe(false);
    s = resolveActivityConsent(s, { turnId: "otro", limitsVersion: s.limitsVersion, accepted: true }, 20);
    expect(s.currentTurn!.authorized).toBe(false);
  });

  it("aceptación unánime autoriza; luego el reloj puede empezar", () => {
    let s = draw(yellowCatalog, yellowSession(), seededRng(1), 10).state;
    s = resolveActivityConsent(s, { turnId: s.currentTurn!.id, limitsVersion: s.limitsVersion, accepted: true }, 20);
    expect(s.status).toBe("playing");
    s = startTimer(s, s.currentTurn!.id, 30_000, 30);
    expect(s.timer?.running).toBe(true);
  });
});

describe("edición de límites", () => {
  it("invalida carta, autorización y reloj, incluso si la actividad ya empezó", () => {
    let s = draw(yellowCatalog, yellowSession(), seededRng(1), 10).state;
    const turnId = s.currentTurn!.id;
    s = resolveActivityConsent(s, { turnId, limitsVersion: s.limitsVersion, accepted: true }, 20);
    s = startTimer(s, turnId, 30_000, 30);
    const a = s.config.participants[0];
    const v = s.limitsVersion;
    s = updateParticipantLimits(s, "a", { ...a.limits, permissions: { ...a.limits.permissions, contacto_manos: "red" } }, 40);
    expect(s.limitsVersion).toBe(v + 1);
    expect(s.currentTurn!.status).toBe("closed");
    expect(s.currentTurn!.outcome).toBe("invalidado");
    expect(s.timer).toBeNull();
    // Un evento atrasado del turno anterior ya no hace nada.
    const after = closeTurn(s, turnId, "cumplido", 50);
    expect(after).toBe(s);
    // Y la nueva selección respeta el nuevo rojo.
    expect(draw(yellowCatalog, s, seededRng(3), 60).candidate).toBeUndefined();
  });

  it("límites compartidos también invalidan", () => {
    const catalog = syntheticCatalog("leve", 12);
    let s = draw(catalog, readySession(config([participant("a"), participant("b")]), 2), seededRng(1), 10).state;
    s = updateSharedLimits(s, { ...s.config.sharedLimits, conversacion_ligera: "red" }, 20);
    expect(s.currentTurn!.outcome).toBe("invalidado");
    expect(draw(catalog, s, seededRng(1), 30).candidate).toBeUndefined();
  });
});

describe("idempotencia y eventos antiguos", () => {
  it("doble toque en Cumplido no duplica el turno", () => {
    const catalog = syntheticCatalog("leve", 12);
    let s = draw(catalog, readySession(config([participant("a"), participant("b")]), 2), seededRng(1), 10).state;
    const id = s.currentTurn!.id;
    s = closeTurn(s, id, "cumplido", 20);
    const twice = closeTurn(s, id, "cumplido", 21);
    expect(twice).toBe(s);
    expect(s.turnCounter).toBe(1);
  });

  it("un reloj antiguo no completa otra carta", () => {
    let s = draw(yellowCatalog, readySession(config([participant("a", allLights("green")), participant("b", allLights("green"))]), 1), seededRng(1), 10).state;
    if (s.status === "awaitingActivityConsent") s = resolveActivityConsent(s, { turnId: s.currentTurn!.id, limitsVersion: s.limitsVersion, accepted: true }, 10);
    const first = s.currentTurn!.id;
    s = startTimer(s, first, 30_000, 20);
    s = changeTurn(s, first, 25);
    expect(s.timer).toBeNull();
    s = draw(yellowCatalog, s, seededRng(5), 30).state;
    const second = s.currentTurn!.id;
    expect(second).not.toBe(first);
    const ignored = timerFinished(s, first, 999_999);
    expect(ignored).toBe(s);
  });
});

describe("pausa, detener y reloj", () => {
  it("pausar congela el reloj y no corre tiempo activo", () => {
    const catalog = syntheticCatalog("leve", 12, { d: [60, 30, 90] });
    let s = draw(catalog, readySession(config([participant("a"), participant("b")]), 2), seededRng(1), 1_000).state;
    s = startTimer(s, s.currentTurn!.id, 60_000, 1_000);
    s = pause(s, 11_000);
    expect(timerRemaining(s, 50_000)).toBe(50_000);
    const active = s.activeMs;
    s = tick(s, 100_000);
    expect(s.activeMs).toBe(active);
    s = resume(s, 100_000);
    expect(s.timer!.running).toBe(false); // no se reanuda automáticamente
  });

  it("detener interrumpe actividad y reloj de inmediato y muestra el panel", () => {
    const catalog = syntheticCatalog("leve", 12, { d: [60, 30, 90] });
    let s = draw(catalog, readySession(config([participant("a"), participant("b")]), 2), seededRng(1), 1_000).state;
    s = startTimer(s, s.currentTurn!.id, 60_000, 1_000);
    s = stop(s, 2_000);
    expect(s.status).toBe("paused");
    expect(s.stopped).toBe(true);
    expect(s.timer).toBeNull();
    expect(s.currentTurn!.status).toBe("closed");
  });
});

describe("niveles", () => {
  it("rechazo al ascenso mantiene el nivel sin autoría ni recuento", () => {
    let s = readySession(config([participant("a"), participant("b")]), 1);
    s = requestLevelUp(s, 10);
    expect(s.status).toBe("awaitingLevelConsent");
    s = resolveLevelUp(s, false, 20);
    expect(s.level).toBe("leve");
    expect(s.notice).toBe(NOTICE.levelKept);
  });

  it("ascenso unánime activa el nuevo nivel en su tramo bajo", () => {
    let s = readySession(config([participant("a"), participant("b")]), 1);
    s = { ...s, progress: { ...s.progress, turnsOfferedInLevel: 9 } };
    s = resolveLevelUp(requestLevelUp(s, 10), true, 20);
    expect(s.level).toBe("picante");
    expect(s.progress.turnsOfferedInLevel).toBe(0);
  });

  it("nunca sube de nivel automáticamente", () => {
    const catalog = syntheticCatalog("leve", 40);
    let s = readySession(config([participant("a"), participant("b")], { durationMin: 15 }), 3);
    const rng = seededRng(3);
    for (let i = 0; i < 60; i++) {
      const out = draw(catalog, s, rng, i * 60_000);
      s = out.state;
      if (!out.candidate) break;
      s = closeTurn(s, s.currentTurn!.id, "cumplido", i * 60_000 + 30_000);
    }
    expect(s.level).toBe("leve");
  });

  it("bajar es inmediato desde cualquier estado y cancela la carta", () => {
    const catalog = syntheticCatalog("picante", 12);
    for (const prep of ["playing", "paused", "consent"] as const) {
      let s = readySession(config([participant("a"), participant("b")], { initialLevel: "picante" }), 1);
      s = draw(catalog, s, seededRng(1), 10).state;
      if (prep === "paused") s = pause(s, 20);
      if (prep === "consent") s = requestLevelUp(s, 20);
      if (prep === "consent") s = resolveLevelUp(s, false, 21);
      s = lowerLevel(s, "leve", 30);
      expect(s.level).toBe("leve");
      expect(s.currentTurn!.status).toBe("closed");
      expect(s.progress.turnsOfferedInLevel).toBe(0);
    }
  });
});
