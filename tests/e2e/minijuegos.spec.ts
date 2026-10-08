import { expect, test } from "@playwright/test";
import { settle, setupSession } from "./helpers";

/** Saca dos bloques laterales de la capa de abajo: la capa queda sobre uno solo y la torre cae seguro. */
async function toppleTower(page: import("@playwright/test").Page) {
  const blocks = page.locator(".tower-block");
  await blocks.nth(15).click();
  await expect(page.getByRole("group", { name: /quedan 17 bloques/ })).toBeVisible();
  await blocks.nth(16).click();
}

test("Torre del deseo: se sacan bloques por turnos sin carta; quien tumba la torre recibe la carta", async ({ page }) => {
  await setupSession(page, { mode: "private", games: ["Torre del deseo"], accept: "todo" });
  await expect(page.getByRole("group", { name: /quedan 18 bloques/ })).toBeVisible();
  await expect(page.getByText(/Turno de/)).toContainText("Ana");
  await toppleTower(page);
  // El primer bloque no dio carta y pasó el turno; el segundo tumbó la torre (turno de Leo).
  await expect(page.getByText("¡Leo tumbó la torre!").first()).toBeVisible();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
  // La torre se vuelve a armar completa.
  await expect(page.getByRole("group", { name: /quedan 18 bloques/ })).toBeVisible();
});

test("La botella: gira y muestra una carta compatible", async ({ page }) => {
  await setupSession(page, { mode: "private", count: 3, games: ["La botella"], accept: "todo" });
  await expect(page.getByText(/Toca la botella o deslízala/)).toBeVisible();
  await page.getByRole("button", { name: "¡Girar la botella!" }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
  await expect(page.getByRole("button", { name: "¡Girar la botella!" })).toBeVisible();
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
  await toppleTower(page);
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
  // De vuelta a Tarjetas, sin el aviso.
  await expect(page.getByRole("heading", { name: "Tarjetas" })).toBeVisible();
  await expect(banner).toHaveCount(0);
});

test("Parqués de la pasión: el dado mueve la ficha, anuncia la casilla y luego trae su carta", async ({ page }) => {
  await setupSession(page, { mode: "private", games: ["Parqués de la pasión"], accept: "todo" });
  await expect(page.getByText(/Turno de/)).toContainText("Ana");
  // Desde la salida, cualquier número cae en una casilla con carta.
  await page.getByRole("button", { name: "¡Tirar el dado!" }).click();
  // Primero se anuncia qué tocó; la carta sale solo al tocar el botón.
  await expect(page.getByRole("status").filter({ hasText: /¡(Verdad|Reto|Pareja|Comodín)!/ })).toBeVisible();
  await expect(page.getByTestId("activity-text")).toHaveCount(0);
  await page.getByRole("button", { name: /^Ver (la pregunta|el reto|la carta)$/ }).click();
  await expect(page.getByText(/Ana sacó \d/)).toBeVisible();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: "Cumplido" }).click();
  // Vuelve al tablero con el turno de la siguiente persona.
  await expect(page.getByText(/Turno de/)).toContainText("Leo");
  await expect(page.getByRole("button", { name: "Tirar el dado", exact: true })).toBeEnabled();
});
