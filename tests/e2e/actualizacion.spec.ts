import { expect, test } from "@playwright/test";

test("sin versión nueva, «Nueva sesión» comprueba y entra directo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Nueva sesión" }).click();
  await expect(page).toHaveURL(/\/crear\/$/);
});

test("con una versión nueva publicada, no deja empezar hasta actualizar", async ({ page }) => {
  await page.goto("/");
  // Esperar a que el service worker controle la página (instalación inicial).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener("controllerchange", r, { once: true }));
  });
  // «Publicar» una versión nueva solo para este navegador: el servidor de pruebas
  // le entrega un sw.js distinto (sin tocar el archivo que usan las demás pruebas).
  await page.context().addCookies([{ name: "e2e_sw_version", value: `v${Date.now()}`, url: "http://localhost:4173" }]);

  await page.getByRole("button", { name: "Nueva sesión" }).click();
  const dialog = page.getByRole("dialog", { name: "Hay una versión nueva" });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(page).not.toHaveURL(/\/crear\//);
  // No se puede cerrar ni saltar: solo actualizar.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Actualizar ahora" }).click();
  await page.waitForEvent("load");

  // Ya actualizada: ahora sí deja empezar.
  await expect(page.getByRole("button", { name: "Nueva sesión" })).toBeVisible();
  await page.getByRole("button", { name: "Nueva sesión" }).click();
  await expect(page).toHaveURL(/\/crear\/$/, { timeout: 15_000 });
});
