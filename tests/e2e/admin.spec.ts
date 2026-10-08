import { expect, test, type Page } from "@playwright/test";

/** GitHub simulado: guarda el archivo de cartas en memoria del test. */
async function mockGithub(page: Page, opts: { validToken?: string } = {}) {
  const state = { text: JSON.stringify({ version: 1, cartas: [], ocultas: [] }), sha: 1, puts: [] as { message: string; branch: string }[] };
  const valid = opts.validToken ?? "github_pat_prueba";
  await page.route("https://api.github.com/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.headers()["authorization"] !== `Bearer ${valid}`) return route.fulfill({ status: 401, body: "{}" });
    if (url.pathname === "/repos/duena/cartas-app") {
      return route.fulfill({ json: { default_branch: "main", permissions: { push: true } } });
    }
    if (url.pathname === "/repos/duena/cartas-app/contents/src/data/custom/cartas.json") {
      if (req.method() === "GET") {
        const content = Buffer.from(state.text, "utf8").toString("base64");
        return route.fulfill({ json: { sha: `sha${state.sha}`, content } });
      }
      if (req.method() === "PUT") {
        const body = req.postDataJSON() as { content: string; sha?: string; message: string; branch: string };
        if (body.sha !== `sha${state.sha}`) return route.fulfill({ status: 409, body: "{}" });
        state.text = Buffer.from(body.content, "base64").toString("utf8");
        state.sha++;
        state.puts.push({ message: body.message, branch: body.branch });
        return route.fulfill({ json: { commit: { html_url: "https://github.com/duena/cartas-app/commit/abc" } } });
      }
    }
    return route.fulfill({ status: 404, body: "{}" });
  });
  return state;
}

async function login(page: Page, token: string) {
  await page.goto("/ajustes/");
  await page.getByRole("link", { name: "Panel de administración" }).click();
  await page.getByLabel("Usuario u organización de GitHub").fill("duena");
  await page.getByLabel("Repositorio", { exact: true }).fill("cartas-app");
  await page.getByLabel("Llave de acceso de GitHub").fill(token);
  await page.getByRole("button", { name: "Entrar como administrador" }).click();
}

test("administración: entrar, publicar, borrar y ocultar cartas en el repositorio", async ({ page }) => {
  const gh = await mockGithub(page);
  await login(page, "github_pat_prueba");
  await expect(page.getByText("Administración", { exact: true })).toBeVisible();

  // Nueva carta de pareja «hombre y mujer».
  await page.getByLabel("Título").fill("Baile de prueba");
  await page.getByRole("button", { name: "+ Persona 1" }).click();
  await page.getByLabel("Texto de la carta").pressSequentially(", baila una canción lenta con ");
  await page.getByRole("button", { name: "+ Persona 2" }).click();
  await expect(page.getByText("pareja (2 personas)")).toBeVisible();
  await page.getByRole("radio", { name: /Hombre y mujer/ }).click();
  await page.getByRole("checkbox", { name: /Música/ }).check();
  await page.getByRole("button", { name: "Publicar carta" }).click();
  await expect(page.getByText(/guardada en el repositorio/)).toBeVisible();

  let file = JSON.parse(gh.text);
  expect(file.cartas).toHaveLength(1);
  expect(file.cartas[0]).toMatchObject({ t: "Baile de prueba", mixta: true, nivel: "picante", f: "reto", i: "directed_pair" });
  expect(file.cartas[0].x).toContain("{p1}");
  expect(gh.puts[0].branch).toBe("main");

  // Aparece en «Mías» y se puede borrar.
  await page.getByRole("tab", { name: "Cartas" }).click();
  await expect(page.getByRole("button", { name: "Mías (1)" })).toBeVisible();
  await page.getByRole("button", { name: "Borrar" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByText(/Carta borrada/)).toBeVisible();
  file = JSON.parse(gh.text);
  expect(file.cartas).toHaveLength(0);

  // Ocultar una carta base y restaurarla.
  await page.getByRole("button", { name: "Base", exact: true }).click();
  await page.getByRole("button", { name: "Ocultar" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Ocultar" }).click();
  await expect(page.getByText(/Carta ocultada/)).toBeVisible();
  file = JSON.parse(gh.text);
  expect(file.ocultas).toHaveLength(1);
  await page.getByRole("button", { name: "Ocultas (1)" }).click();
  await page.getByRole("button", { name: "Restaurar" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Restaurar" }).click();
  await expect(page.getByText(/Carta restaurada/)).toBeVisible();
  expect(JSON.parse(gh.text).ocultas).toHaveLength(0);

  // La llave nunca queda guardada en el dispositivo.
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
  expect(stored).not.toContain("github_pat_prueba");
});

test("administración: una llave inválida no entra y el editor no publica cartas inválidas", async ({ page }) => {
  await mockGithub(page);
  await login(page, "llave_equivocada");
  await expect(page.getByText(/no es válida o caducó/)).toBeVisible();

  await page.getByLabel("Llave de acceso de GitHub").fill("github_pat_prueba");
  await page.getByRole("button", { name: "Entrar como administrador" }).click();
  await page.getByLabel("Título").fill("Corta");
  await page.getByLabel("Texto de la carta").fill("{p1}, abraza a alguien del grupo.");
  await page.getByRole("checkbox", { name: /^Abrazo/ }).check();
  await expect(page.getByText(/solo pueden ir en cartas de pareja/)).toBeVisible();
  await page.getByRole("button", { name: "Publicar carta" }).click();
  await expect(page.getByText("Hay que corregir:")).toBeVisible();
});
