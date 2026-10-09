import { expect, test } from "@playwright/test";
import { settle, setupSession } from "./helpers";

test("Sin miedo: se acepta en privado la subida automática, empieza en Leve y sin límite de tiempo", async ({ page }) => {
  await setupSession(page, {
    mode: "private",
    level: "Picante",
    games: ["Sin miedo"],
    accept: "todo",
    beforeConsent: async (p) => {
      await p.getByRole("button", { name: /^Soy Ana, continuar/ }).click();
      await expect(p.getByText(/el nivel sube solo, sin volver a preguntar/)).toBeVisible();
      await expect(p.getByText(/15 minutos en Leve, 20 en Picante y luego Perverso/)).toBeVisible();
      await expect(p.getByText(/si lo hacen, la subida automática se detiene/)).toBeVisible();
      await p.getByRole("button", { name: "Sí", exact: true }).click();
      await p.getByRole("button", { name: /Ocultar y/ }).click();
      return 1;
    },
  });
  const header = page.locator("header").first();
  await expect(header).toContainText("Leve");
  await expect(header).toContainText(/Sin miedo · Picante en 1[45] min/);
  await page.getByRole("button", { name: /Siguiente ronda/ }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
});
