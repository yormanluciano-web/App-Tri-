import { expect, type Page } from "@playwright/test";

export interface SetupOptions {
  mode?: "normal" | "private";
  count?: 2 | 3;
  aliases?: string[];
  level?: "Leve" | "Picante" | "Perverso";
  /** Juegos a seleccionar (etiquetas visibles). Se desmarcan los predeterminados. */
  games?: string[];
  /** Si se indica, todas las personas eligen «Acepto todo». */
  allow?: string[];
  accept?: "todo" | "nada";
  duration?: string;
}

const DEFAULT_GAMES = ["Verdad o reto", "Tarjetas"];

export async function setupSession(page: Page, o: SetupOptions = {}) {
  const count = o.count ?? 2;
  const aliases = o.aliases ?? ["Ana", "Leo", "Sol"].slice(0, count);
  await page.goto("/crear/");
  await page.getByRole("radio", { name: o.mode === "private" ? /Sesión privada/ : /Sesión normal/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: new RegExp(`^${count}`) }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  for (let i = 0; i < count; i++) {
    await page.getByLabel(`Alias de la persona ${i + 1}`).fill(aliases[i]);
    await page.getByText("Declaro que soy mayor de 18 años").nth(i).click();
  }
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Omitir" }).click();
  await page.getByRole("button", { name: /Responder \(pasando/ }).click();
  for (let i = 0; i < count; i++) {
    await page.getByRole("button", { name: `Soy ${aliases[i]}, continuar` }).click();
    await page.getByRole("radio", { name: o.accept === "todo" || o.allow ? /Acepto todo/ : /^No acepto/ }).click();
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByRole("button", { name: /Ocultar y/ }).click();
  }
  await page.getByRole("button", { name: "Continuar" }).click();
  // Límites del grupo: opcionales.
  await page.getByRole("button", { name: "Continuar" }).click();
  if (o.level) await page.getByRole("radio", { name: new RegExp(o.level) }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  if (o.duration) await page.getByRole("button", { name: o.duration, exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  if (o.games) {
    for (const g of DEFAULT_GAMES) if (!o.games.includes(g)) await page.getByRole("button", { name: new RegExp(`^${escape(g)}`), pressed: true }).click();
    for (const g of o.games) if (!DEFAULT_GAMES.includes(g)) await page.getByRole("button", { name: new RegExp(`^${escape(g)}`), pressed: false }).click();
  }
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Pedir consentimiento y comenzar" }).click();
  await answerAll(page, aliases, true);
  await expect(page).toHaveURL(/\/jugar\/$/);
  return aliases;
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\¿?]/g, "\\$&");
}

/** Responde una ronda privada de sí/no para cada persona. */
export async function answerAll(page: Page, aliases: string[], value: boolean | boolean[]) {
  for (let i = 0; i < aliases.length; i++) {
    const v = Array.isArray(value) ? value[i] : value;
    await page.getByRole("button", { name: `Soy ${aliases[i]}, continuar` }).click();
    await page.getByRole("button", { name: v ? "Sí" : "No", exact: true }).click();
    await page.getByRole("button", { name: /Ocultar y/ }).click();
  }
}

/** Instrumenta escrituras en IndexedDB y Web Storage para comprobar la sesión privada. */
export async function instrumentStorage(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __writes: string[] };
    w.__writes = [];
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      w.__writes.push(`idb:${String(key)}`);
      return put.call(this, value, key);
    };
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (value: unknown, key?: IDBValidKey) {
      w.__writes.push(`idb-add:${String(key)}`);
      return add.call(this, value, key);
    };
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      w.__writes.push(`storage:${k}:${v}`);
      return setItem.call(this, k, v);
    };
  });
}

export async function writes(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __writes: string[] }).__writes ?? []);
}
