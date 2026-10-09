import { test, type Page } from "@playwright/test";
import { answerAll, settle, setupSession } from "./helpers";
const SP = "/tmp/claude-0/-home-user-App-Tri-/10d001b2-0b4b-5f9f-9364-dfa95fd3b84d/scratchpad/fit";
test.use({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2 });
async function measure(page: Page, name: string) {
  await page.waitForTimeout(250);
  const o = await page.evaluate(() => document.scrollingElement!.scrollHeight - innerHeight);
  console.log("FIT", name, o);
  await page.screenshot({ path: SP + "/w-" + name + ".png", fullPage: true });
}
test("wizard", async ({ page }) => {
  await page.goto("/"); await settle(page); await measure(page, "home");
  await page.goto("/crear/"); await measure(page, "1-mode");
  await page.getByRole("radio", { name: /Sesión privada/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click(); await measure(page, "2-count");
  await page.getByRole("button", { name: /^3/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click(); await measure(page, "3-aliases");
  const aliases = ["Ana", "Leo", "Sol"];
  for (let i = 0; i < 3; i++) {
    await page.getByLabel(`Alias de la persona ${i + 1}`).fill(aliases[i]);
    await page.getByText("Soy mayor de 18 años", { exact: true }).nth(i).click();
    await page.getByRole("radiogroup", { name: `Género de la persona ${i + 1}` }).getByRole("radio", { name: i % 2 ? "Hombre" : "Mujer" }).click();
  }
  await page.getByRole("button", { name: "Continuar" }).click(); await measure(page, "4-relationship");
  await page.getByRole("button", { name: "Omitir" }).click(); await measure(page, "5-limits");
  await page.getByRole("button", { name: /Responder \(pasando/ }).click(); await measure(page, "5b-handoff");
  await page.getByRole("button", { name: "Soy Ana, continuar" }).click(); await measure(page, "5c-limits-editor");
  await page.getByRole("radio", { name: /Acepto parcialmente/ }).click().catch(() => {}); await measure(page, "5d-parcial");
  await page.getByRole("radio", { name: /Acepto todo/ }).click();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByRole("button", { name: /Ocultar y/ }).click();
  for (const a of ["Leo", "Sol"]) {
    await page.getByRole("button", { name: `Soy ${a}, continuar` }).click();
    await page.getByRole("radio", { name: /Acepto todo/ }).click();
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await page.getByRole("button", { name: /Ocultar y/ }).click();
  }
  await measure(page, "5e-limits-done");
  await page.getByRole("button", { name: "Continuar" }).click(); await measure(page, "6-shared");
  await page.getByRole("button", { name: "Continuar" }).click(); await measure(page, "7-level");
  await page.getByRole("button", { name: "Continuar" }).click(); await measure(page, "8-duration");
  await page.getByRole("button", { name: "Continuar" }).click(); await measure(page, "9-games");
  await page.getByRole("button", { name: "Continuar" }).click(); await measure(page, "10-summary");
  await page.getByRole("button", { name: "Pedir consentimiento y comenzar" }).click(); await measure(page, "11-consent");
  await page.getByRole("button", { name: "Soy Ana, continuar" }).click(); await measure(page, "11b-consent-q");
  await page.getByRole("button", { name: "Sí", exact: true }).click(); await page.getByRole("button", { name: /Ocultar y/ }).click();
  await answerAll(page, ["Leo", "Sol"], true);
  await settle(page); await measure(page, "12-table");
});
test("other pages", async ({ page }) => {
  for (const p of ["ajustes", "ayuda", "favoritas", "admin"]) { await page.goto("/" + p + "/"); await measure(page, p); }
  await setupSession(page, { mode: "private", games: ["Tarjetas"], accept: "todo" });
  await page.getByRole("button", { name: "Detener" }).click(); await measure(page, "detener");
  await page.getByRole("button", { name: /Terminar/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: /Terminar/ }).click().catch(() => {});
  await settle(page); await measure(page, "closing");
});
