// Genera out/sw.js con la lista completa de recursos del build y una versión por contenido.
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const OUT = "out";
const SKIP = new Set(["sw.js"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = (await walk(OUT)).filter((f) => !SKIP.has(path.relative(OUT, f))).sort();
const hash = createHash("sha256");
const urls = [];
for (const f of files) {
  const rel = "/" + path.relative(OUT, f).split(path.sep).join("/");
  hash.update(rel);
  hash.update(await readFile(f));
  if (rel.endsWith("/index.html")) urls.push(rel.slice(0, -"index.html".length));
  else urls.push(rel);
}
const version = `${Date.now().toString(36)}-${hash.digest("hex").slice(0, 12)}`;
const template = await readFile("scripts/sw-template.js", "utf8");
const sw = template.replace("__VERSION__", version).replace("__PRECACHE__", JSON.stringify(urls, null, 0));
await writeFile(path.join(OUT, "sw.js"), sw);
const size = (await Promise.all(files.map((f) => stat(f)))).reduce((a, s) => a + s.size, 0);
console.log(`sw.js: versión ${version}, ${urls.length} recursos precacheados (${(size / 1024).toFixed(0)} KiB)`);
