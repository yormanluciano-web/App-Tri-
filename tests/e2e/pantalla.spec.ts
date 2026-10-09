import { expect, test, type Page } from "@playwright/test";
import { settle, setupSession } from "./helpers";

/** La página no se desplaza: todo cabe en el alto visible, como una app. */
async function expectFits(page: Page, what: string) {
  const extra = await page.evaluate(() => document.scrollingElement!.scrollHeight - window.innerHeight);
  expect(extra, `${what} se sale de la pantalla`).toBeLessThanOrEqual(1);
}

for (const viewport of [
  { width: 375, height: 667 },
  { width: 390, height: 760 },
]) {
  test.describe(`pantalla de ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test("inicio, ajustes y ayuda caben sin desplazar", async ({ page }) => {
      for (const path of ["/", "/favoritas/", "/ayuda/", "/ajustes/"]) {
        await page.goto(path);
        await expectFits(page, path);
      }
      // Ajustes es un menú: cada sección se abre en su propia pantalla, con «Atrás».
      await page.getByRole("button", { name: /Sonido y vibración/ }).click();
      await expect(page.getByRole("button", { name: "Probar sonido" })).toBeInViewport();
      await page.getByRole("button", { name: "Volver a Ajustes" }).click();
      await expect(page.getByRole("link", { name: "Volver a Inicio" })).toBeInViewport();
    });

    test("la carta y sus acciones caben en la pantalla", async ({ page }) => {
      await setupSession(page, { mode: "private", count: 3, level: "Perverso", games: ["Tarjetas"], accept: "todo" });
      await expectFits(page, "mesa");
      for (let i = 0; i < 3; i++) {
        await page.getByRole("button", { name: /Sacar carta/ }).click();
        await settle(page);
        await expectFits(page, `carta ${i + 1}`);
        await expect(page.getByTestId("activity-text")).toBeInViewport();
        await expect(page.getByRole("button", { name: "Cumplido" })).toBeInViewport();
        await expect(page.getByRole("button", { name: "Detener" })).toBeInViewport();
        await page.getByRole("button", { name: "Pasar", exact: true }).click();
        await settle(page);
      }
    });

    test("el parqués y su dado caben en la pantalla", async ({ page }) => {
      await setupSession(page, { mode: "private", count: 3, games: ["Parqués de la pasión"], accept: "todo" });
      await expectFits(page, "parqués");
      await expect(page.getByRole("button", { name: "¡Tirar el dado!" })).toBeInViewport();
      await page.getByRole("button", { name: "¡Tirar el dado!" }).click();
      await expect(page.getByRole("button", { name: /^Ver / })).toBeInViewport();
      await expectFits(page, "parqués al revelar");
    });
  });
}
