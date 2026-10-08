import { expect, test, type Page } from "@playwright/test";

/** GitHub simulado: guarda el archivo de cartas en memoria del test. */
async function mockGithub(page: Page, opts: { validToken?: string } = {}) {
  const state = { failPut: false, text: JSON.stringify({ version: 1, cartas: [], ocultas: [] }), sha: 1, puts: [] as { message: string; branch: string }[] };
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
        if (state.failPut) return route.fulfill({ status: 422, body: "{}" });
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
  // Mismas tres opciones del inicio: aquí, por categoría.
  await page.getByRole("radio", { name: /Por categoría/ }).click();
  await page.getByRole("button", { name: "Publicar carta" }).click();
  await expect(page.getByText(/Elige al menos una categoría/)).toBeVisible();
  await page.getByRole("button", { name: /^Coqueteo y juegos/ }).click();
  await page.getByRole("button", { name: "Publicar carta" }).click();
  // Aviso grande de éxito y formulario vacío para crear otra.
  const ok = page.getByRole("dialog", { name: "¡Carta publicada!" });
  await expect(ok).toBeVisible();
  await expect(ok.getByText("«Baile de prueba» ya está en el repositorio.")).toBeVisible();
  await ok.getByRole("button", { name: "Crear otra" }).click();
  await expect(ok).toHaveCount(0);
  await expect(page.getByLabel("Título")).toHaveValue("");

  let file = JSON.parse(gh.text);
  expect(file.cartas).toHaveLength(1);
  expect(file.cartas[0]).toMatchObject({ t: "Baile de prueba", mixta: true, nivel: "picante", f: "reto", i: "directed_pair" });
  expect(file.cartas[0].req).toEqual(expect.arrayContaining(["coqueteo", "miradas", "musica", "baile_individual", "roles_juego", "ojos_cerrados"]));
  expect(file.cartas[0].x).toContain("{p1}");
  expect(gh.puts[0].branch).toBe("main");

  // Aparece en «Mías» y se puede borrar.
  await page.getByRole("tab", { name: "Cartas" }).click();
  await expect(page.getByRole("button", { name: "Mías (1)" })).toBeVisible();
  await expect(page.getByText("Publicándose")).toBeVisible();
  await page.getByRole("button", { name: "Borrar" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByRole("dialog", { name: "¡Carta borrada!" })).toBeVisible();
  await page.getByRole("button", { name: "Ver mis cartas" }).click();
  file = JSON.parse(gh.text);
  expect(file.cartas).toHaveLength(0);

  // Ocultar una carta base y restaurarla.
  await page.getByRole("button", { name: "Base", exact: true }).click();
  await page.getByRole("button", { name: "Ocultar" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Ocultar" }).click();
  await expect(page.getByRole("dialog", { name: "¡Carta ocultada!" })).toBeVisible();
  await page.getByRole("button", { name: "Ver mis cartas" }).click();
  file = JSON.parse(gh.text);
  expect(file.ocultas).toHaveLength(1);
  await page.getByRole("button", { name: "Ocultas (1)" }).click();
  await page.getByRole("button", { name: "Restaurar" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Restaurar" }).click();
  await expect(page.getByRole("dialog", { name: "¡Carta restaurada!" })).toBeVisible();
  await page.getByRole("button", { name: "Ver mis cartas" }).click();
  expect(JSON.parse(gh.text).ocultas).toHaveLength(0);

  // La llave nunca queda guardada en el dispositivo.
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
  expect(stored).not.toContain("github_pat_prueba");
});

test("administración: una llave inválida no entra, el editor no publica cartas inválidas y un fallo se avisa", async ({ page }) => {
  const gh = await mockGithub(page);
  await login(page, "llave_equivocada");
  await expect(page.getByText(/no es válida o caducó/)).toBeVisible();

  await page.getByLabel("Llave de acceso de GitHub").fill("github_pat_prueba");
  await page.getByRole("button", { name: "Entrar como administrador" }).click();
  // «Hombre y mujer» siempre visible; sin Persona 1 y 2 explica qué falta y ofrece añadirlas.
  await page.getByLabel("Texto de la carta").fill("bailen una canción lenta muy juntos.");
  await page.getByRole("radio", { name: /Hombre y mujer/ }).click();
  await expect(page.getByText(/es de pareja: el texto debe nombrar a Persona 1 y Persona 2/)).toBeVisible();
  await page.getByRole("button", { name: "Añadirlas al inicio" }).click();
  await expect(page.getByLabel("Texto de la carta")).toHaveValue("{p1} y {p2}, bailen una canción lenta muy juntos.");
  await expect(page.getByText(/Nunca entre las dos mujeres/)).toBeVisible();
  await page.getByRole("radio", { name: /Cualquiera/ }).click();
  await page.getByLabel("Título").fill("Corta");
  await page.getByLabel("Texto de la carta").fill("{p1}, abraza a alguien del grupo.");
  await page.getByRole("radio", { name: /Por categoría/ }).click();
  await page.getByRole("button", { name: /^Contacto y caricias/ }).click();
  await expect(page.getByText(/solo pueden ir en cartas de pareja/)).toBeVisible();
  await page.getByRole("button", { name: "Publicar carta" }).click();
  await expect(page.getByText("Hay que corregir:")).toBeVisible();

  // Si GitHub rechaza el cambio, se avisa con un diálogo de error y el formulario se conserva.
  await page.getByLabel("Texto de la carta").fill("{p1}, cuenta tu canción favorita en voz alta.");
  await page.getByRole("radio", { name: /A todos/ }).click();
  gh.failPut = true;
  await page.getByRole("button", { name: "Publicar carta" }).click();
  const err = page.getByRole("dialog", { name: "No se pudo publicar" });
  await expect(err).toBeVisible();
  await expect(err.getByText(/GitHub rechazó el cambio/)).toBeVisible();
  await err.getByRole("button", { name: "Entendido" }).click();
  await expect(page.getByLabel("Título")).toHaveValue("Corta");
});

test("administración: configurar la música de Spotify se guarda en el repositorio", async ({ page }) => {
  const gh = await mockGithub(page);
  await login(page, "github_pat_prueba");
  await page.getByRole("tab", { name: "Música" }).click();
  await expect(page.getByText("/spotify/", { exact: false }).first()).toBeVisible();
  await page.getByLabel("Client ID de Spotify").fill("0123456789abcdef0123456789abcdef");
  await page.getByLabel("Lista para Leve").fill("https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO?si=x1");
  await page.getByLabel("Lista para Baile").fill("https://open.spotify.com/track/no-es-lista");
  await page.getByRole("button", { name: "Guardar música" }).click();
  await expect(page.getByText(/El enlace de «Baile» no es una lista/)).toBeVisible();
  await page.getByLabel("Lista para Baile").fill("");
  await page.getByRole("button", { name: "Guardar música" }).click();
  await expect(page.getByRole("dialog", { name: "¡Música guardada!" })).toBeVisible();
  const file = JSON.parse(gh.text);
  expect(file.musica).toEqual({ clientId: "0123456789abcdef0123456789abcdef", listas: { leve: "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO" } });
  expect(gh.puts.at(-1)!.message).toContain("música");
});

test("ajustes: sin configuración de Spotify no se ofrece conectar", async ({ page }) => {
  await page.goto("/ajustes/");
  await expect(page.getByRole("heading", { name: /Música con Spotify/ })).toBeVisible();
  await expect(page.getByText(/Aún no está configurada/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Conectar con Spotify" })).toHaveCount(0);
});

test("administración: «Probar» abre cualquier juego directo y se vuelve al panel", async ({ page }) => {
  await mockGithub(page);
  await login(page, "github_pat_prueba");
  await page.getByRole("tab", { name: "Probar" }).click();
  await page.getByRole("button", { name: "Perverso" }).click();
  await page.getByRole("button", { name: /Torre del deseo/ }).click();
  await expect(page).toHaveURL(/\/jugar\/$/);
  await expect(page.getByText("Prueba", { exact: true })).toBeVisible();
  await expect(page.locator("header").first()).toContainText("Perverso");
  await expect(page.getByRole("group", { name: /Torre del deseo/ })).toBeVisible();
  await page.locator(".tower-block").nth(15).click();
  await expect(page.getByRole("group", { name: /quedan 17 bloques/ })).toBeVisible();
  await expect(page.getByTestId("activity-text")).toHaveCount(0);
  // Volver al panel sin volver a entrar, en la misma pestaña.
  await page.getByRole("link", { name: "Volver al panel" }).click();
  await expect(page.getByRole("tab", { name: "Probar" })).toHaveAttribute("aria-selected", "true");
  // Todos los juegos están en la lista (los nuevos aparecen solos).
  for (const name of ["Verdad o reto", "Ruleta", "Dados", "Tarjetas", "La botella", "Rasca y descubre", "Noche completa", "Caos"]) {
    await expect(page.getByRole("button", { name: new RegExp(name) }).first()).toBeVisible();
  }
});
