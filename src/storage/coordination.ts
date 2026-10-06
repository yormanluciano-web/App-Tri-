import { randomId } from "@/domain/engine/rng";
import { deleteDatabase, idbAvailable, kvTransaction, closeDatabase } from "./idb";
import { KEYS, markWiped, type LockRecord } from "./repository";

/** Identificador de esta pestaña (solo en memoria). */
export const TAB_ID = randomId("tab_");

let ownerId: string | null = null;
/**
 * Identificador del dueño del bloqueo. Se conserva en sessionStorage (propio
 * de la pestaña, sin datos personales) para que una recarga de la misma
 * pestaña no se bloquee a sí misma. Solo se crea al jugar una sesión normal.
 */
export function lockOwnerId(): string {
  if (ownerId) return ownerId;
  try {
    const existing = window.sessionStorage.getItem("trio:tab");
    if (existing) return (ownerId = existing);
    window.sessionStorage.setItem("trio:tab", TAB_ID);
  } catch {
    /* sin almacenamiento: id en memoria */
  }
  return (ownerId = TAB_ID);
}

export const LOCK_TTL_MS = 15_000;
export const LOCK_HEARTBEAT_MS = 5_000;

export type CoordinationMessage =
  | { type: "wipe"; from: string }
  | { type: "lock-taken"; from: string; sessionId: string }
  | { type: "session-ended"; from: string; sessionId: string };

let channel: BroadcastChannel | null = null;
const listeners = new Set<(m: CoordinationMessage) => void>();

function getChannel(): BroadcastChannel | null {
  if (channel) return channel;
  if (typeof BroadcastChannel === "undefined") return null;
  channel = new BroadcastChannel("trio");
  channel.onmessage = (ev: MessageEvent<CoordinationMessage>) => {
    const m = ev.data;
    if (!m || typeof m !== "object" || m.from === TAB_ID) return;
    listeners.forEach((l) => l(m));
  };
  return channel;
}

export function onCoordination(listener: (m: CoordinationMessage) => void): () => void {
  getChannel();
  listeners.add(listener);
  // Respaldo para navegadores sin BroadcastChannel: evento storage con una clave sin datos personales.
  const onStorage = (e: StorageEvent) => {
    if (e.key === "trio:signal" && e.newValue) {
      try {
        const m = JSON.parse(e.newValue) as CoordinationMessage;
        if (m.from !== TAB_ID) listener(m);
      } catch {
        /* ignorar */
      }
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export function broadcast(m: CoordinationMessage): void {
  getChannel()?.postMessage(m);
  if (typeof BroadcastChannel === "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("trio:signal", JSON.stringify({ ...m, at: Date.now() }));
      localStorage.removeItem("trio:signal");
    } catch {
      /* almacenamiento no disponible */
    }
  }
}

export type LockStatus = "acquired" | "held_elsewhere" | "unavailable";

/**
 * Bloqueo de escritor con expiración: evita dos pestañas editando la misma
 * sesión. Un cierre inesperado no deja la sesión bloqueada para siempre.
 */
export async function acquireLock(sessionId: string, opts: { force?: boolean; now?: number } = {}): Promise<LockStatus> {
  if (!idbAvailable()) return "unavailable";
  const now = opts.now ?? Date.now();
  try {
    const status = await kvTransaction(async (store, get) => {
      const lock = (await get(KEYS.lock)) as LockRecord | undefined;
      const me = lockOwnerId();
      if (!opts.force && lock && lock.tabId !== me && lock.expiresAt > now) return "held_elsewhere" as const;
      const rec: LockRecord = { tabId: me, sessionId, expiresAt: now + LOCK_TTL_MS };
      store.put(rec, KEYS.lock);
      return "acquired" as const;
    });
    if (status === "acquired" && opts.force) broadcast({ type: "lock-taken", from: TAB_ID, sessionId });
    return status;
  } catch {
    return "unavailable";
  }
}

export async function renewLock(sessionId: string): Promise<boolean> {
  try {
    return await kvTransaction(async (store, get) => {
      const lock = (await get(KEYS.lock)) as LockRecord | undefined;
      const me = lockOwnerId();
      if (lock && lock.tabId !== me && lock.expiresAt > Date.now()) return false;
      store.put({ tabId: me, sessionId, expiresAt: Date.now() + LOCK_TTL_MS } satisfies LockRecord, KEYS.lock);
      return true;
    });
  } catch {
    return false;
  }
}

export async function releaseLock(): Promise<void> {
  try {
    await kvTransaction(async (store, get) => {
      const lock = (await get(KEYS.lock)) as LockRecord | undefined;
      if (lock && lock.tabId === lockOwnerId()) store.delete(KEYS.lock);
    });
  } catch {
    /* sin acceso */
  }
}

/** Claves de Web Storage propias de TRIO (ajustes no sensibles). */
export function clearOwnWebStorage(): void {
  for (const storage of [safeStorage("local"), safeStorage("session")]) {
    if (!storage) continue;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith("trio:")) keys.push(k);
    }
    keys.forEach((k) => storage.removeItem(k));
  }
}

function safeStorage(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export type WipeResult = { status: "deleted" | "blocked" | "error" };

/**
 * «Eliminar todos mis datos»: avisa a otras pestañas, impide reescrituras,
 * cierra conexiones y borra la base y las claves de TRIO.
 */
export async function wipeAllData(): Promise<WipeResult> {
  markWiped();
  broadcast({ type: "wipe", from: TAB_ID });
  closeDatabase();
  clearOwnWebStorage();
  try {
    // Pequeña espera para que otras pestañas cierren su conexión.
    await new Promise((r) => setTimeout(r, 150));
    const status = await deleteDatabase();
    return { status };
  } catch {
    return { status: "error" };
  }
}
