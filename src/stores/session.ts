"use client";

import { create } from "zustand";
import type { GameId, Intensity, Light, Permission } from "@/domain/models/constants";
import type { LimitProfile, ParticipantId, SessionConfig, SessionState } from "@/domain/models/session";
import { freshSeed, seededRng, type Rng } from "@/domain/engine/rng";
import { draw as drawTurn, rotateGame, type DrawRequest } from "@/domain/engine/orchestrator";
import * as S from "@/domain/state/session";
import { CATALOG, CONTENT_VERSION } from "@/data/catalog";
import {
  IndexedDbFavorites,
  IndexedDbSeen,
  IndexedDbSessionRepository,
  MemoryFavorites,
  MemorySessionRepository,
  clearWipedFlag,
  isWiped,
  markWiped,
  seenCapacity,
  type FavoritesRepository,
  type SessionRepository,
} from "@/storage/repository";
import { fromPersisted } from "@/storage/serialize";
import { idbAvailable } from "@/storage/idb";
import {
  lockOwnerId,
  LOCK_HEARTBEAT_MS,
  acquireLock,
  onCoordination,
  releaseLock,
  renewLock,
  wipeAllData,
} from "@/storage/coordination";

export type StorageIssue = null | "unavailable" | "quota" | "conflict" | "lock_lost";

export interface RecoverableInfo {
  kind: "found" | "invalid" | "unsupported";
  participants?: number;
  level?: Intensity;
}

interface SessionStore {
  session: SessionState | null;
  storageIssue: StorageIssue;
  /** La sesión está abierta en otra ventana con bloqueo vigente. */
  lockedElsewhere: boolean;
  /** Pantalla neutral de privacidad al volver de segundo plano. */
  curtain: boolean;
  recoverable: RecoverableInfo | null;
  favorites: string[];
  favoritesMode: "persistent" | "temporary";
  /** Aviso de actualización disponible (se ofrece al pausar o terminar). */
  updateReady: boolean;
  hydrated: boolean;

  hydrate(): Promise<void>;
  startSession(config: SessionConfig): void;
  initialConsent(accepted: boolean): void;
  draw(req?: DrawRequest): void;
  activityConsent(accepted: boolean): void;
  complete(): void;
  pass(): void;
  change(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  dismissStop(): void;
  exitChain(): void;
  finish(): Promise<void>;
  lowerLevel(level: Intensity): void;
  requestLevelUp(): void;
  levelUpResult(accepted: boolean): void;
  updateLimits(pid: ParticipantId, limits: LimitProfile): void;
  updateShared(shared: Partial<Record<Permission, Light>>): void;
  setGame(game: GameId): void;
  startTimer(ms: number): void;
  pauseTimer(): void;
  resumeTimer(): void;
  timerFinished(): void;
  enterReveal(): void;
  leaveReveal(): void;
  setPending(p: SessionState["pending"]): void;
  unblock(): void;
  clearNotice(): void;
  resumeRecovered(): Promise<void>;
  discardRecovered(): Promise<void>;
  takeControl(): Promise<void>;
  setCurtain(v: boolean): void;
  toggleFavorite(activityId: string): Promise<void>;
  loadFavorites(): Promise<void>;
  wipeAll(): Promise<"deleted" | "blocked" | "error">;
  setUpdateReady(v: boolean): void;
}

// Recursos solo en memoria: RNG, repositorios y temporizadores del bloqueo.
let rng: Rng = seededRng(freshSeed());
let repo: SessionRepository = new MemorySessionRepository();
let favRepo: FavoritesRepository = new IndexedDbFavorites();
let tempFavorites = new MemoryFavorites();
/** Cartas ya mostradas en este teléfono (solo IDs): se leen siempre, se escriben solo en sesiones normales. */
const seenRepo = new IndexedDbSeen();
let seenIds = new Set<string>();
let heartbeat: ReturnType<typeof setInterval> | null = null;
let pendingRaw: unknown = null;
let created = false;
let saveChain: Promise<void> = Promise.resolve();
let coordinationBound = false;

const now = () => Date.now();

function stopHeartbeat() {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
}

export const useSession = create<SessionStore>((set, get) => {
  /** Aplica una transición pura y persiste si la sesión es normal. */
  const commit = (next: SessionState | null) => {
    const prev = get().session;
    if (next === prev) return;
    set({ session: next });
    if (!next || next.config.mode !== "normal" || repo.kind !== "indexeddb") return;
    if (get().lockedElsewhere || isWiped()) return;
    const isCreate = !created;
    created = true;
    const snapshot = next;
    saveChain = saveChain.then(async () => {
      const res = await repo.save(snapshot, { create: isCreate, tabId: lockOwnerId(), now: now() });
      if (res === "not_owner") set({ storageIssue: "lock_lost", lockedElsewhere: true });
      else if (res === "error") set({ storageIssue: "quota" });
    });
  };

  const apply = (fn: (s: SessionState, t: number) => SessionState) => {
    const s = get().session;
    if (!s || get().lockedElsewhere) return;
    commit(fn(s, now()));
  };

  const bindCoordination = () => {
    if (coordinationBound || typeof window === "undefined") return;
    coordinationBound = true;
    onCoordination((m) => {
      if (m.type === "wipe") {
        // Otra pestaña borró todo: descartar y no volver a escribir.
        markWiped();
        stopHeartbeat();
        tempFavorites = new MemoryFavorites();
        set({ session: null, recoverable: null, favorites: [], lockedElsewhere: false });
      }
      if (m.type === "lock-taken") {
        const s = get().session;
        if (s && s.id === m.sessionId && s.config.mode === "normal") {
          stopHeartbeat();
          set({ lockedElsewhere: true, storageIssue: "lock_lost" });
        }
      }
    });
  };

  const startHeartbeat = (sessionId: string) => {
    stopHeartbeat();
    heartbeat = setInterval(async () => {
      const ok = await renewLock(sessionId);
      if (!ok) {
        stopHeartbeat();
        set({ lockedElsewhere: true, storageIssue: "lock_lost" });
      }
    }, LOCK_HEARTBEAT_MS);
  };

  return {
    session: null,
    storageIssue: null,
    lockedElsewhere: false,
    curtain: false,
    recoverable: null,
    favorites: [],
    favoritesMode: "persistent",
    updateReady: false,
    hydrated: false,

    async hydrate() {
      bindCoordination();
      if (get().hydrated) return;
      // Una sesión activa en memoria (navegación interna) no se reemplaza.
      if (get().session) {
        set({ hydrated: true });
        return;
      }
      if (!idbAvailable()) {
        set({ hydrated: true, storageIssue: "unavailable" });
        return;
      }
      try {
        const idb = new IndexedDbSessionRepository();
        const raw = await idb.load();
        if (raw) {
          pendingRaw = raw;
          const r = fromPersisted(raw, CATALOG, CONTENT_VERSION, now());
          if (r.ok) {
            set({ recoverable: { kind: "found", participants: r.state.config.participants.length, level: r.state.level } });
          } else if (r.reason === "finished") {
            await idb.clear();
          } else {
            set({ recoverable: { kind: r.reason === "unsupported" ? "unsupported" : "invalid" } });
          }
        }
      } catch {
        set({ storageIssue: "unavailable" });
      }
      set({ hydrated: true });
      seenIds = new Set(await seenRepo.list());
      await get().loadFavorites();
    },

    startSession(config) {
      bindCoordination();
      const seed = freshSeed();
      rng = seededRng(seed);
      created = false;
      clearWipedFlag();
      if (config.mode === "normal" && idbAvailable() && get().storageIssue !== "unavailable") {
        repo = new IndexedDbSessionRepository();
      } else {
        repo = new MemorySessionRepository();
      }
      tempFavorites = new MemoryFavorites();
      const state = S.createSession(config, { now: now(), contentVersion: CONTENT_VERSION, seed, rng });
      set({ recoverable: null, lockedElsewhere: false, favoritesMode: config.mode === "private" ? "temporary" : "persistent" });
      if (config.mode === "private") set({ favorites: [] });
      if (repo.kind === "indexeddb") {
        void acquireLock(state.id, { force: true }).then((st) => {
          if (st === "acquired") startHeartbeat(state.id);
        });
      }
      commit(state);
    },

    initialConsent(accepted) {
      apply((s, t) => S.resolveInitialConsent(s, accepted, t));
    },

    draw(req) {
      const s = get().session;
      if (!s || get().lockedElsewhere) return;
      const out = drawTurn(CATALOG, s, rng, now(), { ...req, seen: seenIds });
      commit(out.state);
      // Memoria de cartas vistas: solo en sesiones normales (la privada no escribe nada) y nunca en la demo.
      if (out.candidate && s.config.mode === "normal" && !s.config.demo) {
        const id = out.candidate.activity.id;
        seenIds.delete(id);
        seenIds.add(id);
        const max = seenCapacity(CATALOG.length);
        if (seenIds.size > max) seenIds = new Set([...seenIds].slice(-max));
        void seenRepo.add(id, max);
      }
    },

    activityConsent(accepted) {
      apply((s, t) => {
        const turn = s.currentTurn;
        if (!turn) return s;
        return S.resolveActivityConsent(s, { turnId: turn.id, limitsVersion: s.limitsVersion, accepted }, t);
      });
    },

    complete() {
      apply((s, t) => {
        if (!s.currentTurn) return s;
        const next = S.closeTurn(s, s.currentTurn.id, "cumplido", t);
        return next === s ? s : { ...next, currentGame: rotateGame(next, rng) };
      });
    },

    pass() {
      apply((s, t) => {
        if (!s.currentTurn) return s;
        const next = S.closeTurn(s, s.currentTurn.id, "pasado", t);
        return next === s ? s : { ...next, currentGame: rotateGame(next, rng) };
      });
    },

    change() {
      apply((s, t) => (s.currentTurn ? S.changeTurn(s, s.currentTurn.id, t) : s));
    },

    pause() {
      apply((s, t) => S.pause(s, t));
    },
    resume() {
      apply((s, t) => S.resume(s, t));
    },
    stop() {
      apply((s, t) => S.stop(s, t));
    },
    dismissStop() {
      apply((s) => S.dismissStopPanel(s));
    },
    exitChain() {
      apply((s, t) => {
        const next = S.exitChain(s, t);
        return next === s ? s : { ...next, currentGame: rotateGame(next, rng) };
      });
    },

    async finish() {
      const s = get().session;
      if (!s) return;
      const finished = S.finish(s, now());
      set({ session: finished });
      stopHeartbeat();
      if (s.config.mode === "normal" && repo.kind === "indexeddb") {
        await saveChain;
        await repo.clear().catch(() => undefined);
        await releaseLock();
      }
      if (s.config.mode === "private") {
        await tempFavorites.clear();
        tempFavorites = new MemoryFavorites();
        set({ favorites: [], favoritesMode: "persistent" });
        void get().loadFavorites();
      }
    },

    lowerLevel(level) {
      apply((s, t) => S.lowerLevel(s, level, t));
    },
    requestLevelUp() {
      apply((s, t) => S.requestLevelUp(s, t));
    },
    levelUpResult(accepted) {
      apply((s, t) => S.resolveLevelUp(s, accepted, t));
    },
    updateLimits(pid, limits) {
      apply((s, t) => S.updateParticipantLimits(s, pid, limits, t));
    },
    updateShared(shared) {
      apply((s, t) => S.updateSharedLimits(s, shared, t));
    },
    setGame(game) {
      apply((s, t) => S.setGame(s, game, t));
    },
    startTimer(ms) {
      apply((s, t) => (s.currentTurn ? S.startTimer(s, s.currentTurn.id, ms, t) : s));
    },
    pauseTimer() {
      apply((s, t) => (s.currentTurn ? S.pauseTimer(s, s.currentTurn.id, t) : s));
    },
    resumeTimer() {
      apply((s, t) => (s.currentTurn ? S.resumeTimer(s, s.currentTurn.id, t) : s));
    },
    timerFinished() {
      apply((s, t) => (s.timer ? S.timerFinished(s, s.timer.turnId, t) : s));
    },
    enterReveal() {
      apply((s, t) => S.enterReveal(s, t));
    },
    leaveReveal() {
      apply((s, t) => S.leaveReveal(s, t));
    },
    setPending(p) {
      apply((s) => S.setPending(s, p));
    },
    unblock() {
      apply((s, t) => S.unblock(s, t));
    },
    clearNotice() {
      apply((s) => S.clearNotice(s));
    },

    async resumeRecovered() {
      const r = fromPersisted(pendingRaw, CATALOG, CONTENT_VERSION, now());
      if (!r.ok) return;
      const lock = await acquireLock(r.state.id);
      repo = new IndexedDbSessionRepository();
      rng = seededRng(freshSeed());
      created = true;
      clearWipedFlag();
      if (lock === "held_elsewhere") {
        set({ session: r.state, lockedElsewhere: true, recoverable: null, favoritesMode: "persistent" });
        return;
      }
      set({ session: r.state, recoverable: null, lockedElsewhere: false, favoritesMode: "persistent" });
      if (lock === "acquired") startHeartbeat(r.state.id);
    },

    async discardRecovered() {
      pendingRaw = null;
      try {
        await new IndexedDbSessionRepository().clear();
      } catch {
        /* sin acceso */
      }
      set({ recoverable: null });
    },

    async takeControl() {
      const s = get().session;
      if (!s) return;
      const st = await acquireLock(s.id, { force: true });
      if (st === "acquired") {
        // Al tomar control se recarga el último estado guardado para no pisar cambios de la otra ventana.
        const raw = await new IndexedDbSessionRepository().load().catch(() => null);
        const r = raw ? fromPersisted(raw, CATALOG, CONTENT_VERSION, now()) : null;
        set({ lockedElsewhere: false, storageIssue: null, session: r && r.ok ? r.state : s });
        startHeartbeat(s.id);
      }
    },

    setCurtain(v) {
      set({ curtain: v });
    },

    async loadFavorites() {
      const s = get().session;
      if (s && s.config.mode === "private" && s.status !== "finished") {
        set({ favorites: await tempFavorites.list(), favoritesMode: "temporary" });
        return;
      }
      set({ favorites: await favRepo.list(), favoritesMode: "persistent" });
    },

    async toggleFavorite(activityId) {
      const s = get().session;
      if (s && s.config.mode === "private" && s.status !== "finished") {
        set({ favorites: await tempFavorites.toggle(activityId) });
        return;
      }
      try {
        set({ favorites: await favRepo.toggle(activityId) });
      } catch {
        set({ storageIssue: "unavailable" });
      }
    },

    async wipeAll() {
      stopHeartbeat();
      await saveChain.catch(() => undefined);
      const res = await wipeAllData();
      favRepo = new IndexedDbFavorites();
      tempFavorites = new MemoryFavorites();
      seenIds = new Set();
      repo = new MemorySessionRepository();
      pendingRaw = null;
      created = false;
      set({ session: null, recoverable: null, favorites: [], lockedElsewhere: false, storageIssue: null });
      return res.status;
    },

    setUpdateReady(v) {
      set({ updateReady: v });
    },
  };
});

export function participantLabel(s: SessionState, pid: ParticipantId | undefined | null): string {
  if (!pid) return "";
  return s.config.participants.find((p) => p.id === pid)?.alias ?? "";
}
