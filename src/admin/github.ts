/**
 * Cliente mínimo de la API de contenidos de GitHub (sin SDKs). Solo lo usa el
 * panel de administración, y solo envía el archivo de cartas: nunca datos de
 * una partida. La llave vive únicamente en memoria mientras dura la sesión.
 */
export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
}

export class GithubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const API = "https://api.github.com";

function headers(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function repoUrl(owner: string, repo: string, p = ""): string {
  return `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${p}`;
}

/** Tiempo máximo por petición: con mala señal, mejor avisar que quedarse cargando. */
export const REQUEST_TIMEOUT_MS = 25_000;

async function call(url: string, init: RequestInit): Promise<Response> {
  let res: Response;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    res = await fetch(url, { ...init, cache: "no-store", referrerPolicy: "no-referrer", signal: ctrl.signal });
  } catch {
    throw new GithubError(
      0,
      ctrl.signal.aborted
        ? "GitHub tardó demasiado en responder. Revisa tu conexión. Antes de repetir, mira en «Cartas» si el cambio ya se guardó."
        : "Sin conexión con GitHub. Revisa tu internet.",
    );
  } finally {
    clearTimeout(timer);
  }
  if (res.ok) return res;
  const messages: Record<number, string> = {
    401: "La llave de GitHub no es válida o caducó.",
    403: "La llave no tiene permiso para escribir en el repositorio.",
    404: "No se encontró el repositorio, la rama o el archivo.",
    409: "El archivo cambió mientras guardabas. Vuelve a intentarlo.",
    422: "GitHub rechazó el cambio.",
  };
  throw new GithubError(res.status, messages[res.status] ?? `GitHub respondió ${res.status}.`);
}

/** Texto UTF-8 ↔ base64 (la API de contenidos usa base64). */
export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function base64ToUtf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Comprueba la llave contra el repositorio y devuelve su rama principal. */
export async function checkAccess(token: string, owner: string, repo: string): Promise<{ defaultBranch: string; canPush: boolean }> {
  const res = await call(repoUrl(owner, repo), { headers: headers(token) });
  const data = (await res.json()) as { default_branch?: string; permissions?: { push?: boolean } };
  return { defaultBranch: data.default_branch ?? "main", canPush: !!data.permissions?.push };
}

export async function getFile(token: string, repo: RepoConfig, filePath: string): Promise<{ sha: string; text: string } | null> {
  try {
    const res = await call(repoUrl(repo.owner, repo.repo, `/contents/${filePath}?ref=${encodeURIComponent(repo.branch)}`), {
      headers: headers(token),
    });
    const data = (await res.json()) as { sha: string; content: string };
    return { sha: data.sha, text: base64ToUtf8(data.content) };
  } catch (e) {
    if (e instanceof GithubError && e.status === 404) return null;
    throw e;
  }
}

export async function putFile(
  token: string,
  repo: RepoConfig,
  filePath: string,
  text: string,
  sha: string | null,
  message: string,
): Promise<{ commitUrl: string | null }> {
  const res = await call(repoUrl(repo.owner, repo.repo, `/contents/${filePath}`), {
    method: "PUT",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: utf8ToBase64(text), branch: repo.branch, ...(sha ? { sha } : {}) }),
  });
  const data = (await res.json()) as { commit?: { html_url?: string } };
  return { commitUrl: data.commit?.html_url ?? null };
}

/** Archivos de una carpeta del repositorio (solo nombres y rutas). */
export async function listDir(token: string, repo: RepoConfig, dirPath: string): Promise<{ name: string; path: string }[]> {
  const res = await call(repoUrl(repo.owner, repo.repo, `/contents/${dirPath}?ref=${encodeURIComponent(repo.branch)}`), { headers: headers(token) });
  const data = (await res.json()) as { name: string; path: string; type: string }[];
  return Array.isArray(data) ? data.filter((f) => f.type === "file").map((f) => ({ name: f.name, path: f.path })) : [];
}
