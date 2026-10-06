/** Adaptador mínimo de IndexedDB: una base y un almacén clave-valor. */

export const DB_NAME = "trio";
export const DB_VERSION = 1;
export const STORE = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;
let openDb: IDBDatabase | null = null;

export function idbAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!idbAvailable()) return reject(new Error("IndexedDB no disponible"));
    let r: IDBOpenDBRequest;
    try {
      r = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      return reject(e);
    }
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    r.onsuccess = () => {
      const db = r.result;
      // Si otra pestaña borra o actualiza la base, se cierra esta conexión.
      db.onversionchange = () => closeDatabase();
      openDb = db;
      resolve(db);
    };
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error("Apertura bloqueada por otra pestaña"));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

export function closeDatabase(): void {
  try {
    openDb?.close();
  } catch {
    /* ya cerrada */
  }
  openDb = null;
  dbPromise = null;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await openDatabase();
  return req(db.transaction(STORE, "readonly").objectStore(STORE).get(key)) as Promise<T | undefined>;
}

/**
 * Transacción de lectura-escritura atómica: `fn` recibe el almacén y decide
 * qué escribir. Si `fn` lanza, la transacción se aborta.
 */
export async function kvTransaction<T>(fn: (store: IDBObjectStore, get: (key: string) => Promise<unknown>) => Promise<T>): Promise<T> {
  const db = await openDatabase();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transacción abortada"));
  });
  let result: T;
  try {
    result = await fn(store, (key) => req(store.get(key)));
  } catch (e) {
    try {
      tx.abort();
    } catch {
      /* ya terminada */
    }
    await done.catch(() => undefined);
    throw e;
  }
  await done;
  return result;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await kvTransaction(async (store) => {
    store.put(value, key);
  });
}

export async function kvDelete(key: string): Promise<void> {
  await kvTransaction(async (store) => {
    store.delete(key);
  });
}

export function deleteDatabase(): Promise<"deleted" | "blocked"> {
  closeDatabase();
  return new Promise((resolve, reject) => {
    if (!idbAvailable()) return resolve("deleted");
    const r = indexedDB.deleteDatabase(DB_NAME);
    let blocked = false;
    r.onsuccess = () => resolve(blocked ? "blocked" : "deleted");
    r.onerror = () => reject(r.error);
    r.onblocked = () => {
      blocked = true;
    };
  });
}
