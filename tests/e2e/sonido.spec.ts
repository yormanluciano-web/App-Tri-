import { expect, test } from "@playwright/test";
import { settle, setupSession } from "./helpers";

/** Cuenta los sonidos que la app programa (osciladores y ruidos) sin tocar el código de la app. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __sfx: number };
    w.__sfx = 0;
    const osc = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (this: AudioContext) {
      w.__sfx++;
      return osc.call(this);
    };
  });
});

const played = (page: import("@playwright/test").Page) => page.evaluate(() => (window as unknown as { __sfx: number }).__sfx);

test("los efectos suenan al jugar y se pueden silenciar en la mesa sin guardar nada", async ({ page }) => {
  await setupSession(page, { mode: "private", games: ["Tarjetas"], accept: "todo" });
  const before = await played(page);
  await page.getByRole("button", { name: /Sacar carta/ }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await expect.poll(() => played(page)).toBeGreaterThan(before);

  // Silenciar: ya no se programa ningún sonido.
  await page.getByRole("button", { name: "Silenciar los efectos de sonido" }).click();
  await expect(page.getByRole("button", { name: "Activar los efectos de sonido" })).toHaveAttribute("aria-pressed", "true");
  await settle(page);
  const muted = await played(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
  await page.getByRole("button", { name: /Sacar carta/ }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  expect(await played(page)).toBe(muted);
  // Sesión privada: el silencio no se escribe en el dispositivo.
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("Ajustes: efectos encendidos por defecto, con volumen", async ({ page }) => {
  await page.goto("/ajustes/");
  const toggle = page.getByRole("checkbox", { name: /Efectos de sonido/ });
  await expect(toggle).toBeChecked();
  await page.getByRole("button", { name: "Alto", exact: true }).click();
  await expect(page.getByRole("button", { name: "Alto", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByText("Efectos de sonido", { exact: true }).click();
  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Alto", exact: true })).toHaveCount(0);
});
