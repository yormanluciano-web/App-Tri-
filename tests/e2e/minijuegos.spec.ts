import { expect, test } from "@playwright/test";
import { settle, setupSession } from "./helpers";

test("Torre del deseo: sacar un bloque reparte una carta y el bloque queda fuera", async ({ page }) => {
  await setupSession(page, { mode: "private", games: ["Torre del deseo"], accept: "todo" });
  await expect(page.getByRole("group", { name: /quedan 18 bloques/ })).toBeVisible();
  await page.getByRole("button", { name: /Bloque verdad de la capa 1/ }).first().click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
  await expect(page.getByRole("group", { name: /quedan 17 bloques|quedan 18 bloques/ })).toBeVisible();
});

test("La botella: gira y muestra una carta compatible", async ({ page }) => {
  await setupSession(page, { mode: "private", count: 3, games: ["La botella"], accept: "todo" });
  await page.getByRole("button", { name: /Girar la botella/ }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
  await expect(page.getByRole("button", { name: /Girar la botella/ })).toBeVisible();
});

test("Rasca y descubre: la carta está cubierta hasta rasparla o descubrirla", async ({ page }) => {
  await setupSession(page, { mode: "private", games: ["Rasca y descubre"], accept: "todo" });
  await page.getByRole("button", { name: /Sacar carta/ }).click();
  await expect(page.getByText(/Raspa la carta para descubrir qué te toca/)).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  // Siempre se puede pasar sin descubrirla.
  await expect(page.getByRole("button", { name: "Pasar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Descubrir todo" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await settle(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
});

test("Ronda especial: aparece cada 6 rondas y luego se vuelve al juego anterior", async ({ page }) => {
  await setupSession(page, { mode: "private", games: ["Tarjetas"], accept: "todo" });
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: /Sacar carta/ }).click();
    await settle(page);
    await page.getByRole("button", { name: "Cumplido" }).click();
  }
  const banner = page.getByRole("region", { name: "Ronda especial" });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("Torre del deseo");
  await banner.getByRole("button", { name: "¡A jugar!" }).click();
  await page.getByRole("button", { name: /Bloque reto de la capa 1/ }).first().click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
  // De vuelta a Tarjetas, sin el aviso.
  await expect(page.getByRole("heading", { name: "Tarjetas" })).toBeVisible();
  await expect(banner).toHaveCount(0);
});
