// Sirve el build de producción (out/) como lo haría el hosting estático, con las cabeceras de vercel.json.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("out");
const PORT = Number(process.env.PORT || 4173);
const vercel = JSON.parse(await readFile("vercel.json", "utf8"));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

function headersFor(urlPath) {
  const out = {};
  for (const rule of vercel.headers) {
    const re = new RegExp("^" + rule.source.replace(/\(\.\*\)/g, ".*") + "$");
    if (re.test(urlPath)) for (const h of rule.headers) out[h.key] = h.value;
  }
  return out;
}

async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const candidates = clean.endsWith("/") ? [clean + "index.html"] : [clean, clean + "/index.html", clean + ".html"];
  for (const c of candidates) {
    const full = path.join(ROOT, c);
    if (!full.startsWith(ROOT)) return null;
    try {
      const s = await stat(full);
      if (s.isFile()) return { full, redirect: !clean.endsWith("/") && c.endsWith("/index.html") ? clean + "/" : null };
    } catch {
      /* siguiente */
    }
  }
  return null;
}

http
  .createServer(async (req, res) => {
    const urlPath = (req.url || "/").split("?")[0];
    const found = await resolveFile(urlPath);
    const headers = headersFor(urlPath);
    if (found?.redirect) {
      res.writeHead(308, { ...headers, Location: found.redirect });
      return res.end();
    }
    if (!found) {
      const body = await readFile(path.join(ROOT, "404.html")).catch(() => "No encontrado");
      res.writeHead(404, { ...headers, "Content-Type": TYPES[".html"] });
      return res.end(body);
    }
    const body = await readFile(found.full);
    res.writeHead(200, { ...headers, "Content-Type": TYPES[path.extname(found.full)] || "application/octet-stream" });
    res.end(body);
  })
  .listen(PORT, () => console.log(`TRIO (build de producción) en http://localhost:${PORT}`));
