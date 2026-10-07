import { expect, test, type Page } from "@playwright/test";
import { setupSession } from "./helpers";

const ALLOW = ["Escritura privada", "Revelación al grupo", "Preguntas personales", "Roles de juego"];

async function card(page: Page) {
  await expect(page.getByTestId("activity-text")).toBeVisible();
}

for (const size of [2, 3] as const) {
  test.describe(`${size} personas`, () => {
    test("Verdad o reto, Tarjetas con favorita y filtro", async ({ page }) => {
      await setupSession(page, { mode: "private", count: size, games: ["Verdad o reto", "Tarjetas"] });
      await page.getByRole("button", { name: "Verdad", exact: true }).click();
      await card(page);
      await page.getByRole("button", { name: "Cumplido" }).click();
      await expect(page.getByRole("heading", { name: "Tarjetas" })).toBeVisible();
      await page.getByRole("button", { name: /Rompehielo/ }).click();
      await page.getByRole("button", { name: "Sacar carta" }).click();
      await card(page);
      await page.getByRole("button", { name: /Guardar en favoritas/ }).click();
      await expect(page.getByRole("button", { name: /En favoritas/ })).toBeVisible();
      await page.getByRole("button", { name: "Cumplido" }).click();
    });

    test("Ruleta y Dados muestran un resultado válido", async ({ page }) => {
      await setupSession(page, { mode: "private", count: size, games: ["Ruleta", "Dados"] });
      for (let i = 0; i < 2; i++) {
        const spin = page.getByRole("button", { name: "Girar la ruleta" });
        const roll = page.getByRole("button", { name: "Lanzar los dados" });
        await expect(spin.or(roll)).toBeVisible();
        if (await spin.isVisible()) await spin.click();
        else await roll.click();
        await card(page);
        await page.getByRole("button", { name: "Cumplido" }).click();
      }
    });

    test("¿Quién me conoce mejor?: referencia, adivinanzas y revelación", async ({ page }) => {
      const aliases = await setupSession(page, { mode: "private", count: size, games: ["¿Quién me conoce mejor?"] });
      await page.getByRole("button", { name: "Nueva ronda" }).click();
      await page.getByRole("button", { name: "Empezar" }).click();
      for (let i = 0; i < aliases.length; i++) {
        const btn = page.getByRole("button", { name: /^Soy .*, continuar$/ });
        await btn.click();
        const box = page.getByRole("textbox");
        if (await box.isVisible()) {
          await box.fill("Chocolate");
          await page.getByRole("button", { name: "Guardar" }).click();
        } else {
          await page.locator("section button").first().click();
        }
        await page.getByRole("button", { name: /Ocultar y/ }).click();
      }
      await expect(page.getByText(/Respuesta de/)).toBeVisible();
      await page.getByRole("button", { name: "Cerrar ronda" }).click();
    });

    test("Secretos: escribir, retirar, mezclar, revelar y borrar", async ({ page }) => {
      const aliases = await setupSession(page, { mode: "private", count: size, games: ["Secretos"], allow: ALLOW });
      await page.getByRole("button", { name: "Nueva ronda de secretos" }).click();
      await page.getByRole("button", { name: "Empezar a escribir" }).click();
      for (let i = 0; i < aliases.length; i++) {
        await page.getByRole("button", { name: `Soy ${aliases[i]}, continuar` }).click();
        await page.getByRole("textbox").fill(`Texto secreto número ${i + 1}`);
        await page.getByRole("button", { name: "Revisar" }).click();
        if (i === 0) await page.getByRole("button", { name: "Retirar" }).click();
        else await page.getByRole("button", { name: "Confirmar" }).click();
        await page.getByRole("button", { name: /Ocultar y/ }).click();
      }
      await expect(page.getByText(/Secreto 1 de/)).toBeVisible();
      await expect(page.getByText("Texto secreto número 1")).toHaveCount(0);
      while (await page.getByRole("button", { name: "Siguiente", exact: true }).isVisible()) await page.getByRole("button", { name: "Siguiente", exact: true }).click();
      await page.getByRole("button", { name: "Autorías (opcional)" }).click();
      for (let i = 1; i < aliases.length; i++) {
        await page.getByRole("button", { name: `Soy ${aliases[i]}, continuar` }).click();
        await page.getByRole("button", { name: i === 1 ? "Sí" : "No", exact: true }).click();
        await page.getByRole("button", { name: /Ocultar y/ }).click();
      }
      await expect(page.getByText(/Autoría revelada/)).toHaveCount(1);
      await page.getByRole("button", { name: "Borrar y cerrar" }).click();
      await expect(page.getByText("Texto secreto número 2")).toHaveCount(0);
    });

    test("Temporizador: el reloj empieza solo tras autorizar y se pausa", async ({ page }) => {
      await setupSession(page, { mode: "private", count: size, games: ["Temporizador"] });
      await page.getByRole("button", { name: "Siguiente reto con reloj" }).click();
      await card(page);
      await page.getByRole("button", { name: /Comenzar reloj/ }).click();
      await expect(page.getByRole("button", { name: "Pausar reloj" })).toBeVisible({ timeout: 8000 });
      await page.getByRole("button", { name: "Pausar reloj" }).click();
      await expect(page.getByRole("button", { name: "Reanudar reloj" })).toBeVisible();
      await page.getByRole("button", { name: "Pausa" }).click();
      await page.getByRole("button", { name: "Continuar", exact: true }).click();
      await expect(page.getByRole("button", { name: "Reanudar reloj" })).toBeVisible();
      await page.getByRole("button", { name: "Pasar" }).click();
    });

    test("Cadena de retos: etapas y salida", async ({ page }) => {
      await setupSession(page, { mode: "private", count: size, games: ["Cadena de retos"] });
      await page.getByRole("button", { name: "Empezar cadena" }).click();
      await expect(page.getByText("Etapa 1 de 3")).toBeVisible();
      await page.getByRole("button", { name: "Cumplido" }).click();
      await page.getByRole("button", { name: "Siguiente etapa" }).click();
      await expect(page.getByText("Etapa 2 de 3")).toBeVisible();
      await page.getByRole("button", { name: "Pasar" }).click();
      await page.getByRole("button", { name: "Salir de la cadena" }).click();
      await expect(page.getByRole("button", { name: "Empezar cadena" })).toBeVisible();
    });

    test("Noche completa, Caos y Carta sorpresa juegan rondas", async ({ page }) => {
      await setupSession(page, { mode: "private", count: size, games: ["Caos", "Carta sorpresa"], allow: ALLOW });
      let surprise = false;
      for (let i = 0; i < 12; i++) {
        await page.getByRole("button", { name: "Siguiente ronda" }).click();
        const passSurprise = page.getByRole("button", { name: "Pasar la sorpresa" });
        const pass = page.getByRole("button", { name: "Pasar", exact: true });
        await expect(passSurprise.or(pass)).toBeVisible();
        if (await passSurprise.isVisible()) {
          surprise = true;
          await passSurprise.click();
        } else {
          if (await page.getByText("Carta sorpresa", { exact: true }).first().isVisible()) surprise = true;
          await pass.click();
        }
      }
      expect(surprise).toBe(true);
    });
  });
}

test("Noche completa fija 60 minutos y mezcla juegos", async ({ page }) => {
  await setupSession(page, { mode: "private", games: ["Noche completa"] });
  await expect(page.locator("header").getByText(/Noche completa · apertura · 60 min/)).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Siguiente ronda" }).click();
    const passSurprise = page.getByRole("button", { name: "Pasar la sorpresa" });
    const pass = page.getByRole("button", { name: "Pasar", exact: true });
    await expect(passSurprise.or(pass)).toBeVisible();
    if (await passSurprise.isVisible()) await passSurprise.click();
    else await pass.click();
  }
});
