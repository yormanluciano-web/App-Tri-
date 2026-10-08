"use client";

/** Estado de disponibilidad sin conexión informado por el service worker. */
export type OfflineStatus = "unsupported" | "dev" | "installing" | "ready" | "error";

type Listener = (s: { offline: OfflineStatus; updateWaiting: boolean }) => void;

let status: OfflineStatus = "installing";
let updateWaiting = false;
let waitingWorker: ServiceWorker | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l({ offline: status, updateWaiting }));
}

export function subscribePwa(l: Listener): () => void {
  listeners.add(l);
  l({ offline: status, updateWaiting });
  return () => listeners.delete(l);
}

async function verifyOffline(reg: ServiceWorkerRegistration) {
  const active = reg.active;
  if (!active) return;
  const channel = new MessageChannel();
  const result = await new Promise<{ ok: boolean }>((resolve) => {
    const t = setTimeout(() => resolve({ ok: false }), 8000);
    channel.port1.onmessage = (ev) => {
      clearTimeout(t);
      resolve(ev.data as { ok: boolean });
    };
    active.postMessage({ type: "VERIFY_OFFLINE" }, [channel.port2]);
  });
  status = result.ok ? "ready" : "installing";
  emit();
}

function trackWaiting(reg: ServiceWorkerRegistration) {
  const mark = (w: ServiceWorker | null) => {
    if (w && navigator.serviceWorker.controller) {
      waitingWorker = w;
      updateWaiting = true;
      emit();
    }
  };
  mark(reg.waiting);
  reg.addEventListener("updatefound", () => {
    const w = reg.installing;
    w?.addEventListener("statechange", () => {
      if (w.state === "installed") mark(w);
      if (w.state === "activated") void verifyOffline(reg);
    });
  });
}

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") {
    // No registrar en desarrollo: interferiría con la recarga en caliente.
    status = "dev";
    emit();
    return;
  }
  if (!("serviceWorker" in navigator)) {
    status = "unsupported";
    emit();
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    trackWaiting(reg);
    await navigator.serviceWorker.ready;
    await verifyOffline(reg);
    // Busca actualizaciones de vez en cuando, sin recargar automáticamente.
    setInterval(() => void reg.update().catch(() => undefined), 30 * 60_000);
  } catch {
    status = "error";
    emit();
  }
}

/** Aplica la actualización solo cuando la persona lo decide (en pausa o al terminar). */
export function applyUpdate(): void {
  if (!waitingWorker) return;
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
}

export type UpdateCheck = "update" | "none" | "offline" | "unsupported";

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);
}

/**
 * Busca ahora mismo una versión nueva de la app. Devuelve «update» si hay una
 * descargada esperando a aplicarse. Sin conexión o sin service worker (desarrollo)
 * no se puede comprobar: la app debe seguir funcionando sin red.
 */
export async function checkForUpdate(timeoutMs = 10_000): Promise<UpdateCheck> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || status === "dev" || status === "unsupported") return "unsupported";
  if (updateWaiting) return "update";
  if (!navigator.onLine) return "offline";
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return "unsupported";
  const checked = await withTimeout(
    reg.update().then(
      () => true,
      () => false,
    ),
    timeoutMs,
    false,
  );
  if (!checked) return "offline";
  // Si encontró una versión nueva, esperar a que termine de descargarse.
  const installing = reg.installing;
  if (installing) {
    await withTimeout(
      new Promise<void>((resolve) => {
        const done = () => {
          if (installing.state === "installed" || installing.state === "redundant" || installing.state === "activated") resolve();
        };
        installing.addEventListener("statechange", done);
        done();
      }),
      timeoutMs,
      undefined,
    );
  }
  if (reg.waiting && navigator.serviceWorker.controller) {
    waitingWorker = reg.waiting;
    updateWaiting = true;
    emit();
    return "update";
  }
  return "none";
}
