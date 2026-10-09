import type { SessionState } from "@/domain/models/session";
import { kvGet, kvTransaction, idbAvailable } from "./idb";
import { toPersisted, type PersistedSession } from "./serialize";

export type SaveResult = "saved" | "not_owner" | "wiped" | "error";

export interface SessionRepository {
  readonly kind: "indexeddb" | "memory";
  load(): Promise<unknown | null>;
  /** `create` solo en la primera escritura de una sesión nueva. */
  save(state: SessionState, opts: { create?: boolean; tabId: string; now: number }): Promise<SaveResult>;
  clear(): Promise<void>;
}

export interface FavoritesRepository {
  list(): Promise<string[]>;
  toggle(activityId: string): Promise<string[]>;
  clear(): Promise<void>;
}

export const KEYS = { session: "session", favorites: "favorites", lock: "lock", seen: "seen" } as const;

/** Bandera de borrado: tras «Eliminar todos mis datos» ninguna escritura antigua puede recrear datos. */
let wipedEpoch = false;
export function markWiped(): void {
  wipedEpoch = true;
}
export function clearWipedFlag(): void {
  wipedEpoch = false;
}
export function isWiped(): boolean {
  return wipedEpoch;
}

export interface LockRecord {
  tabId: string;
  sessionId: string;
  expiresAt: number;
}

export class IndexedDbSessionRepository implements SessionRepository {
  readonly kind = "indexeddb" as const;

  async load(): Promise<unknown | null> {
    return (await kvGet<PersistedSession>(KEYS.session)) ?? null;
  }

  async save(state: SessionState, opts: { create?: boolean; tabId: string; now: number }): Promise<SaveResult> {
    if (state.config.mode !== "normal") return "error";
    if (wipedEpoch && !opts.create) return "wiped";
    const data = toPersisted(state, opts.now);
    try {
      return await kvTransaction(async (store, get) => {
        const existing = (await get(KEYS.session)) as PersistedSession | undefined;
        const lock = (await get(KEYS.lock)) as LockRecord | undefined;
        if (!opts.create) {
          // Una sesión borrada o reemplazada no se reescribe desde una pestaña antigua.
          if (!existing || existing.id !== state.id) return "wiped";
          if (lock && lock.tabId !== opts.tabId && lock.expiresAt > opts.now) return "not_owner";
          if (existing.version > data.version) return "not_owner";
        }
        store.put(data, KEYS.session);
        return "saved";
      });
    } catch {
      return "error";
    }
  }

  async clear(): Promise<void> {
    await kvTransaction(async (store) => {
      store.delete(KEYS.session);
    });
  }
}

/** Sesión privada: nada sale de la memoria del proceso. */
export class MemorySessionRepository implements SessionRepository {
  readonly kind = "memory" as const;
  async load(): Promise<unknown | null> {
    return null;
  }
  async save(): Promise<SaveResult> {
    return "saved";
  }
  async clear(): Promise<void> {}
}

export class IndexedDbFavorites implements FavoritesRepository {
  async list(): Promise<string[]> {
    if (!idbAvailable()) return [];
    try {
      const v = await kvGet<unknown>(KEYS.favorites);
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 2000) : [];
    } catch {
      return [];
    }
  }
  async toggle(activityId: string): Promise<string[]> {
    if (wipedEpoch) clearWipedFlag();
    return kvTransaction(async (store, get) => {
      const raw = (await get(KEYS.favorites)) as unknown;
      const list = Array.isArray(raw) ? (raw as string[]).filter((x) => typeof x === "string") : [];
      const next = list.includes(activityId) ? list.filter((x) => x !== activityId) : [...list, activityId];
      store.put(next, KEYS.favorites);
      return next;
    });
  }
  async clear(): Promise<void> {
    await kvTransaction(async (store) => {
      store.delete(KEYS.favorites);
    });
  }
}

/** Favoritas temporales de una sesión privada: se descartan al terminar. */
export class MemoryFavorites implements FavoritesRepository {
  private ids: string[] = [];
  async list(): Promise<string[]> {
    return [...this.ids];
  }
  async toggle(activityId: string): Promise<string[]> {
    this.ids = this.ids.includes(activityId) ? this.ids.filter((x) => x !== activityId) : [...this.ids, activityId];
    return [...this.ids];
  }
  async clear(): Promise<void> {
    this.ids = [];
  }
}

/**
 * Cartas ya mostradas en este teléfono (solo IDs, sin personas, respuestas ni
 * fechas), para que el mazo rote entre sesiones. Cola con tope: cuando se llena,
 * las más antiguas vuelven a contar como no vistas. Solo sesiones normales.
 */
export class IndexedDbSeen {
  async list(): Promise<string[]> {
    if (!idbAvailable()) return [];
    try {
      const v = await kvGet<unknown>(KEYS.seen);
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(-5000) : [];
    } catch {
      return [];
    }
  }
  async add(activityId: string, max: number): Promise<void> {
    if (wipedEpoch || !idbAvailable()) return;
    try {
      await kvTransaction(async (store, get) => {
        const raw = (await get(KEYS.seen)) as unknown;
        const list = Array.isArray(raw) ? (raw as string[]).filter((x) => typeof x === "string" && x !== activityId) : [];
        list.push(activityId);
        store.put(list.slice(-Math.max(1, max)), KEYS.seen);
      });
    } catch {
      /* opcional: sin memoria, el sorteo sigue funcionando */
    }
  }
}

/** Tope de la memoria: tres cuartas partes del mazo; así siempre quedan cartas «nuevas» por rotar. */
export function seenCapacity(catalogSize: number): number {
  return Math.max(20, Math.floor(catalogSize * 0.75));
}
