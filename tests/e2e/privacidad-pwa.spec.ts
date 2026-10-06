import { expect, test } from "@playwright/test";
import { setupSession } from "./helpers";

test("borrar datos elimina la sesión y otra pestaña no la vuelve a escribir", async ({ page, context }) => {
  await setupSession(page, { mode: "normal", games: ["Verdad o reto"] });
  await page.getByRole("button", { name: "Verdad", exact: true }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();

  const other = await context.newPage();
  await other.goto("/ajustes/");
  await other.getByRole("button", { name: "Eliminar todos mis datos" }).click();
  await other.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(other.getByText(/se eliminaron|Cierra las demás pestañas/)).toBeVisible();

  // La pestaña original descarta la sesión al recibir el aviso.
  await expect(page.getByRole("heading", { name: "No hay una sesión activa" })).toBeVisible();
  await other.goto("/");
  await expect(other.getByRole("button", { name: "Continuar sesión" })).toBeDisabled();
  const stored = await other.evaluate(
    () =>
      new Promise<unknown>((resolve) => {
        const r = indexedDB.open("trio");
        r.onsuccess = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains("kv")) return resolve(null);
          const g = db.transaction("kv").objectStore("kv").get("session");
          g.onsuccess = () => resolve(g.result ?? null);
        };
        r.onerror = () => resolve(null);
      }),
  );
  expect(stored).toBeNull();
});

test("una segunda ventana no edita la misma sesión sin tomar el control", async ({ page, context }) => {
  await setupSession(page, { mode: "normal", games: ["Verdad o reto"] });
  const other = await context.newPage();
  await other.goto("/");
  await other.getByRole("button", { name: "Continuar sesión" }).click();
  await expect(other.getByRole("heading", { name: "Esta sesión está abierta en otra ventana" })).toBeVisible();
  await other.getByRole("button", { name: "Tomar el control aquí" }).click();
  await expect(other.getByRole("heading", { name: "Pausa" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Esta sesión está abierta en otra ventana" })).toBeVisible();
});

test("funciona sin conexión tras la primera carga, incluido acceso directo a rutas", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByTestId("offline-status")).toHaveAttribute("data-status", "ready", { timeout: 30_000 });
  await context.setOffline(true);
  await page.goto("/jugar/");
  await expect(page.getByRole("heading", { name: "No hay una sesión activa" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "No hay una sesión activa" })).toBeVisible();
  await setupSession(page, { mode: "private", games: ["Tarjetas"] });
  await page.getByRole("button", { name: "Sacar carta" }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await context.setOffline(false);
});

test("manifest e iconos accesibles con el alcance correcto", async ({ request }) => {
  const res = await request.get("/manifest.json");
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.display).toBe("standalone");
  expect(m.scope).toBe("/");
  expect(m.start_url).toBe("/");
  for (const icon of m.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  expect((await request.get("/icons/apple-touch-icon.png")).ok()).toBe(true);
  const sw = await request.get("/sw.js");
  expect(sw.headers()["cache-control"]).toContain("no-cache");
  const home = await request.get("/");
  expect(home.headers()["content-security-policy"]).toContain("default-src 'self'");
});

for (const width of [320, 375, 390, 430]) {
  test(`sin desplazamiento horizontal a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    for (const path of ["/", "/crear/", "/ajustes/", "/ayuda/", "/favoritas/"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await setupSession(page, { mode: "private", games: ["Verdad o reto"] });
    await page.getByRole("button", { name: "Reto", exact: true }).click();
    await expect(page.getByTestId("activity-text")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("button", { name: "Detener" })).toBeInViewport();
  });
}

test("navegación por teclado en el inicio y diálogos", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.textContent ?? "");
  expect(focused.length).toBeGreaterThan(0);
  await page.goto("/ajustes/");
  await page.getByRole("button", { name: "Eliminar todos mis datos" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("al pasar a segundo plano se pausa y se oculta el contenido", async ({ page }) => {
  await setupSession(page, { mode: "private", games: ["Verdad o reto"] });
  await page.getByRole("button", { name: "Verdad", exact: true }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("dialog", { name: "Sesión en pausa" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).first().click();
  await expect(page.getByRole("heading", { name: "Pausa" })).toBeVisible();
});

test("sin errores de consola en producción (CSP, hidratación)", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of ["/", "/ayuda/", "/ajustes/", "/favoritas/"]) await page.goto(path);
  await setupSession(page, { mode: "private", games: ["Ruleta"] });
  await page.getByRole("button", { name: "Girar la ruleta" }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  expect(errors).toEqual([]);
});
