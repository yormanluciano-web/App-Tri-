import "fake-indexeddb/auto";
import { describe, expect, it, beforeEach } from "vitest";
import { seededRng } from "@/domain/engine/rng";
import { draw } from "@/domain/engine/orchestrator";
import { closeTurn, resolveActivityConsent, startTimer } from "@/domain/state/session";
import { fromPersisted, toPersisted } from "@/storage/serialize";
import { IndexedDbSessionRepository, IndexedDbFavorites, clearWipedFlag } from "@/storage/repository";
import { acquireLock, wipeAllData, lockOwnerId } from "@/storage/coordination";
const TAB_ID = lockOwnerId();
import { kvGet, kvSet, closeDatabase, deleteDatabase } from "@/storage/idb";
import { defineCards } from "@/data/define";
import { allLights, config, participant, readySession, syntheticCatalog } from "../helpers";

const timed = defineCards("leve", "st", "test", [
  { id: "t1", t: "Reloj", x: "{p1}, cuenta hasta veinte en otro idioma.", c: "retos", f: "reto", s: 2, req: ["conversacion_ligera"], d: [60, 30, 90], g: ["tarjetas", "temporizador"] },
  { id: "t2", t: "Manos", x: "{p1} y {p2}, junten las palmas un momento.", c: "pareja", f: "reto", s: 2, pair: ["contacto_manos"], g: ["tarjetas"] },
]);

function normalSession(perms = allLights("green")) {
  return readySession(config([participant("a", perms), participant("b", perms)], { mode: "normal" }), 4);
}

beforeEach(async () => {
  await deleteDatabase();
  clearWipedFlag();
});

describe("serialización con lista explícita", () => {
  it("una sesión privada nunca se serializa", () => {
    const s = readySession(config([participant("a"), participant("b")], { mode: "private" }), 1);
    expect(() => toPersisted(s, 0)).toThrow();
  });

  it("no incluye campos fuera de la lista ni autorizaciones", () => {
    let s = draw(timed, normalSession(), seededRng(1), 10, { onlyActivityId: "st-t1" }).state;
    const withExtra = { ...s, ephemeralVotes: { a: "b" } } as unknown as typeof s;
    const p = toPersisted(withExtra, 1) as unknown as Record<string, unknown>;
    expect(p.ephemeralVotes).toBeUndefined();
    expect(JSON.stringify(p)).not.toContain("authorized");
    expect(p.pending).toBeUndefined();
    s = closeTurn(s, s.currentTurn!.id, "cumplido", 20);
  });

  it("restaura pausado, sin reanudar reloj y pidiendo de nuevo la autorización", () => {
    const yellow = { ...allLights("green"), contacto_manos: "yellow" as const };
    let s = draw(timed, normalSession(yellow), seededRng(1), 10, { onlyActivityId: "st-t2", game: "tarjetas" }).state;
    expect(s.status).toBe("awaitingActivityConsent");
    s = resolveActivityConsent(s, { turnId: s.currentTurn!.id, limitsVersion: s.limitsVersion, accepted: true }, 20);
    expect(s.currentTurn!.authorized).toBe(true);
    const r = fromPersisted(JSON.parse(JSON.stringify(toPersisted(s, 30))), timed, 1, 40);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.status).toBe("paused");
    expect(r.state.pausedFrom).toBe("awaitingActivityConsent");
    expect(r.state.currentTurn!.authorized).toBe(false);

    let t = draw(timed, normalSession(), seededRng(1), 10, { onlyActivityId: "st-t1" }).state;
    t = startTimer(t, t.currentTurn!.id, 60_000, 100);
    const r2 = fromPersisted(toPersisted(t, 30_100), timed, 1, 40_000);
    expect(r2.ok && r2.state.timer?.running).toBe(false);
  });

  it("si la carta cambió de versión, se invalida y no se conserva la autorización", () => {
    const s = draw(timed, normalSession(), seededRng(1), 10, { onlyActivityId: "st-t1" }).state;
    const r = fromPersisted(toPersisted(s, 1), timed, 2, 2);
    expect(r.ok && r.state.currentTurn!.outcome).toBe("invalidado");
  });

  it("datos dañados o versión desconocida no se reinterpretan", () => {
    expect(fromPersisted({ schemaVersion: 99 }, timed, 1, 0)).toEqual({ ok: false, reason: "unsupported" });
    expect(fromPersisted({ schemaVersion: 1, kind: "trio-session" }, timed, 1, 0)).toEqual({ ok: false, reason: "invalid" });
    const s = normalSession();
    const p = toPersisted(s, 1) as unknown as { config: { participants: { limits: { permissions: Record<string, string> } }[] } };
    p.config.participants[0].limits.permissions.abrazo = "verde";
    expect(fromPersisted(p, timed, 1, 0).ok).toBe(false);
  });
});

describe("repositorio IndexedDB", () => {
  it("guarda y carga una sesión normal", async () => {
    const repo = new IndexedDbSessionRepository();
    const s = normalSession();
    expect(await repo.save(s, { create: true, tabId: TAB_ID, now: 1 })).toBe("saved");
    const raw = await repo.load();
    expect(fromPersisted(raw, syntheticCatalog("leve", 4), 1, 2).ok).toBe(true);
  });

  it("una pestaña antigua no reescribe una sesión borrada", async () => {
    const repo = new IndexedDbSessionRepository();
    const s = normalSession();
    await repo.save(s, { create: true, tabId: TAB_ID, now: 1 });
    await wipeAllData();
    expect(await repo.save({ ...s, version: s.version + 1 }, { tabId: TAB_ID, now: 2 })).toBe("wiped");
    clearWipedFlag();
    expect(await repo.save({ ...s, version: s.version + 2 }, { tabId: TAB_ID, now: 3 })).toBe("wiped");
    expect(await repo.load()).toBeNull();
  });

  it("respeta el bloqueo de escritor de otra pestaña y caduca", async () => {
    const repo = new IndexedDbSessionRepository();
    const s = normalSession();
    await repo.save(s, { create: true, tabId: TAB_ID, now: 1 });
    await kvSet("lock", { tabId: "otra", sessionId: s.id, expiresAt: Date.now() + 10_000 });
    expect(await acquireLock(s.id)).toBe("held_elsewhere");
    expect(await repo.save({ ...s, version: s.version + 1 }, { tabId: TAB_ID, now: Date.now() })).toBe("not_owner");
    expect(await acquireLock(s.id, { force: true })).toBe("acquired");
    expect(await repo.save({ ...s, version: s.version + 1 }, { tabId: TAB_ID, now: Date.now() })).toBe("saved");
    await kvSet("lock", { tabId: "otra", sessionId: s.id, expiresAt: Date.now() - 1 });
    expect(await acquireLock(s.id)).toBe("acquired");
  });

  it("favoritas guardan solo IDs de actividad", async () => {
    const fav = new IndexedDbFavorites();
    expect(await fav.toggle("l-001")).toEqual(["l-001"]);
    expect(await fav.toggle("l-002")).toEqual(["l-001", "l-002"]);
    expect(await fav.toggle("l-001")).toEqual(["l-002"]);
    expect(await kvGet("favorites")).toEqual(["l-002"]);
    closeDatabase();
  });
});
