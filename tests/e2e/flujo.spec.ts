import { expect, test } from "@playwright/test";
import { answerAll, instrumentStorage, setupSession, writes } from "./helpers";

test("sesión privada de 2: jugar, pasar, cambiar, pausar, detener y terminar sin escribir datos", async ({ page }) => {
  await instrumentStorage(page);
  const requests: string[] = [];
  page.on("request", (r) => requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ""}`));
  const aliases = await setupSession(page, { mode: "private", aliases: ["Zafiro", "Ámbar"], games: ["Verdad o reto"] });

  await page.getByRole("button", { name: "Verdad", exact: true }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await page.getByRole("button", { name: "Cumplido" }).click();
  await page.getByRole("button", { name: "Reto", exact: true }).click();
  const first = await page.getByTestId("activity-text").textContent();
  await page.getByRole("button", { name: "Cambiar" }).click();
  await expect(page.getByTestId("activity-text")).not.toHaveText(first ?? "", { timeout: 5000 });
  await page.getByRole("button", { name: "Pasar" }).click();

  // Pausa oculta el contenido.
  await page.getByRole("button", { name: "Pausa" }).click();
  await expect(page.getByRole("heading", { name: "Pausa" })).toBeVisible();
  await expect(page.getByTestId("activity-text")).toHaveCount(0);
  await page.getByRole("button", { name: "Continuar" }).click();

  // Detener muestra el panel neutral.
  await page.getByRole("button", { name: "Verdad", exact: true }).click();
  await page.getByRole("button", { name: "Detener" }).click();
  await expect(page.getByRole("heading", { name: "Actividad detenida" })).toBeVisible();
  await page.getByRole("button", { name: "Terminar sesión" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("heading", { name: "Gracias por jugar" })).toBeVisible();

  const w = await writes(page);
  expect(w.filter((x) => !x.startsWith("idb:favorites")), w.join("\n")).toEqual([]);
  // Ningún alias en URLs, cuerpos ni hacia otros orígenes.
  for (const r of requests) {
    for (const a of aliases) expect(r).not.toContain(a);
    expect(r).toContain("localhost:4173");
  }
});

test("sesión normal de 3: se recupera tras recargar en un punto seguro", async ({ page }) => {
  await setupSession(page, { mode: "normal", count: 3, games: ["Verdad o reto"] });
  await page.getByRole("button", { name: "Reto", exact: true }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
  await page.reload();
  // La recarga de /jugar/ no restaura sola: se vuelve al inicio.
  await page.goto("/");
  const cont = page.getByRole("button", { name: "Continuar sesión" });
  await expect(cont).toBeEnabled();
  await expect(page.getByText(/Sesión guardada: 3 personas/)).toBeVisible();
  await cont.click();
  await expect(page.getByRole("heading", { name: "Pausa" })).toBeVisible();
  await expect(page.getByTestId("activity-text")).toHaveCount(0);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByTestId("activity-text")).toBeVisible();
});

test("subir intensidad exige unanimidad privada y bajar es inmediato", async ({ page }) => {
  const aliases = await setupSession(page, { mode: "private" });
  await page.getByRole("button", { name: "Pausa" }).click();
  await page.getByRole("button", { name: "Proponer subir intensidad" }).click();
  await page.getByRole("button", { name: "Empezar ronda privada" }).click();
  await answerAll(page, aliases, [true, false]);
  await expect(page.getByText("Se mantiene el nivel actual.")).toBeVisible();
  await expect(page.locator("header").getByText("Leve")).toBeVisible();
  // Sin recuentos ni autorías.
  await expect(page.getByText(/1 de 2|rechaz/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Pausa" }).click();
  await page.getByRole("button", { name: "Proponer subir intensidad" }).click();
  await page.getByRole("button", { name: "Empezar ronda privada" }).click();
  await answerAll(page, aliases, true);
  await expect(page.locator("header").getByText("Picante")).toBeVisible();

  await page.getByRole("button", { name: "Pausa" }).click();
  await page.getByRole("button", { name: "Bajar a Leve" }).click();
  await expect(page.locator("header").getByText("Leve")).toBeVisible();
});

test("consentimiento inicial: si alguien no acepta no se empieza y no se señala a nadie", async ({ page }) => {
  await page.goto("/crear/");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Alias de la persona 1").fill("Ana");
  await page.getByLabel("Alias de la persona 2").fill("Ana");
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
  await page.getByText("Declaro que soy mayor de 18 años").nth(0).click();
  await page.getByText("Declaro que soy mayor de 18 años").nth(1).click();
  await expect(page.getByText(/alias repetidos/)).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Omitir" }).click();
  await page.getByRole("button", { name: /Responder \(pasando/ }).click();
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Soy Ana, continuar" }).click();
    await expect(page.getByRole("button", { name: "Guardar", exact: true })).toBeDisabled();
    await page.getByRole("radio", { name: /Acepto parcialmente/ }).click();
    await page.getByRole("group", { name: "Besos" }).getByRole("radio", { name: "Acepto", exact: true }).check({ force: true });
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByRole("button", { name: /Ocultar y/ }).click();
  }
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Pedir consentimiento y comenzar" }).click();
  await answerAll(page, ["Ana", "Ana"], [true, false]);
  await expect(page.getByText(/No todas las personas aceptaron/)).toBeVisible();
  await expect(page).toHaveURL(/\/crear\/$/);
});
