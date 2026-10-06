/* TRIO service worker. Generado por scripts/build-sw.mjs; no editar out/sw.js a mano. */
const VERSION = "__VERSION__";
const CACHE = "trio-" + VERSION;
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Descarga sin caché HTTP para no mezclar versiones.
      await cache.addAll(PRECACHE.map((u) => new Request(u, { cache: "reload" })));
      // Primera instalación: activar de inmediato. Actualizaciones: esperar a que la persona acepte.
      if (!self.registration.active) await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = (await caches.keys()).filter((n) => n.startsWith("trio-"));
      // Conserva la versión anterior más reciente para pestañas que aún la usan.
      const older = names.filter((n) => n !== CACHE).sort().reverse();
      await Promise.all(older.slice(1).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

function normalizeNavigation(url) {
  let path = url.pathname;
  if (!path.endsWith("/") && !/\.[a-z0-9]+$/i.test(path)) path += "/";
  return path;
}

async function matchAny(request, options) {
  const own = await caches.open(CACHE);
  const hit = await own.match(request, options);
  if (hit) return hit;
  return caches.match(request, options);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const path = normalizeNavigation(url);
        const cached = await matchAny(path);
        if (cached) return cached;
        try {
          return await fetch(req);
        } catch {
          return (await matchAny("/404.html")) || (await matchAny("/")) || Response.error();
        }
      })(),
    );
    return;
  }

  // Recursos: solo los precacheados (ignorando la consulta, p. ej. ?_rsc). Nunca se cachean otras respuestas.
  event.respondWith(
    (async () => {
      const cached = await matchAny(req, { ignoreSearch: true });
      if (cached) return cached;
      return fetch(req);
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") self.skipWaiting();
  if (data.type === "VERIFY_OFFLINE") {
    const port = event.ports && event.ports[0];
    (async () => {
      try {
        const cache = await caches.open(CACHE);
        const keys = await cache.keys();
        const have = new Set(keys.map((k) => new URL(k.url).pathname));
        const missing = PRECACHE.filter((u) => !have.has(u));
        port && port.postMessage({ ok: missing.length === 0, version: VERSION, missing: missing.length });
      } catch {
        port && port.postMessage({ ok: false });
      }
    })();
  }
});
