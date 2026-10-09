/**
 * Conexión con Spotify (Authorization Code + PKCE, sin secreto ni servidor).
 * Solo usa la reproducción: poner una lista (context_uri) en el Spotify del
 * teléfono. Nunca envía textos de cartas, alias ni límites: solo la URI de la
 * lista que debe sonar.
 *
 * Almacenamiento: la sesión de Spotify (tokens) en localStorage bajo «trio:»,
 * así «Borrar todos mis datos» también la elimina; el verificador PKCE solo en
 * sessionStorage durante el ida y vuelta a Spotify.
 */

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";
const SCOPES = "user-modify-playback-state user-read-playback-state";
const TOKENS_KEY = "trio:spotify";
const PKCE_KEY = "trio:spotify-pkce";
const TIMEOUT_MS = 15_000;

export type MusicErrorCode = "not_connected" | "no_device" | "premium" | "auth" | "network" | "bad_state" | "rate_limited" | "no_songs" | "not_registered" | "restricted" | "scope" | "unknown";

export class MusicError extends Error {
  constructor(
    public code: MusicErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const MUSIC_ERROR_TEXT: Record<MusicErrorCode, string> = {
  not_connected: "Spotify no está conectado.",
  no_device: "Abre la app de Spotify y pon algo a sonar un momento; luego vuelve aquí.",
  premium: "Spotify solo permite controlar la música con una cuenta Premium.",
  auth: "La conexión con Spotify caducó. Vuelve a conectarla en Ajustes.",
  network: "Sin conexión con Spotify. Revisa tu internet.",
  bad_state: "La conexión con Spotify no se pudo verificar. Inténtalo de nuevo.",
  rate_limited: "Spotify pidió esperar un momento. La música cambiará en la próxima carta.",
  no_songs: "No se encontraron en Spotify las canciones de este momento.",
  not_registered:
    "Spotify no reconoce tu cuenta en la app. En developer.spotify.com → tu app → User Management, añade el correo de tu cuenta de Spotify (el mismo con el que conectaste) y vuelve a conectar.",
  restricted: "Spotify no deja controlar ese dispositivo ahora. Abre Spotify en el teléfono, pon cualquier canción y vuelve a intentarlo.",
  scope: "Falta un permiso de Spotify. Desconecta y vuelve a conectar en Ajustes → Música con Spotify.",
  unknown: "Spotify no respondió como se esperaba.",
};

interface Tokens {
  access: string;
  refresh: string | null;
  expiresAt: number;
}

// ------------------------------------------------------------------ utilidades

function store(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readTokens(): Tokens | null {
  try {
    const raw = store("local")?.getItem(TOKENS_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as Tokens;
    return typeof t.access === "string" && typeof t.expiresAt === "number" ? t : null;
  } catch {
    return null;
  }
}

function writeTokens(t: Tokens): void {
  store("local")?.setItem(TOKENS_KEY, JSON.stringify(t));
}

export function isConnected(): boolean {
  return readTokens() !== null;
}

export function disconnect(): void {
  store("local")?.removeItem(TOKENS_KEY);
  store("session")?.removeItem(PKCE_KEY);
}

export function base64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomVerifier(length = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

/** code_challenge = base64url(SHA-256(verifier)), método S256. */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

/** Dirección de regreso registrada en el panel de Spotify: <origen>/spotify/ */
export function redirectUri(): string {
  return `${window.location.origin}/spotify/`;
}

async function timed(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, cache: "no-store", referrerPolicy: "no-referrer", signal: ctrl.signal });
  } catch {
    throw new MusicError("network", MUSIC_ERROR_TEXT.network);
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------ enlaces de listas

/**
 * Acepta un enlace de Spotify (open.spotify.com/…/playlist/ID?si=…) o una URI
 * (spotify:playlist:ID) de lista, álbum o artista y devuelve la URI; null si no lo es.
 */
export function parseSpotifyUri(input: string): string | null {
  const s = input.trim();
  const uri = s.match(/^spotify:(playlist|album|artist):([A-Za-z0-9]{10,40})$/);
  if (uri) return `spotify:${uri[1]}:${uri[2]}`;
  const url = s.match(/^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(playlist|album|artist)\/([A-Za-z0-9]{10,40})(?:[/?#].*)?$/i);
  if (url) return `spotify:${url[1].toLowerCase()}:${url[2]}`;
  return null;
}

// ------------------------------------------------------------------ conexión

export async function beginLogin(clientId: string, returnTo = "/ajustes/"): Promise<void> {
  const verifier = randomVerifier();
  const state = randomVerifier(24);
  store("session")?.setItem(PKCE_KEY, JSON.stringify({ verifier, state, returnTo }));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri(),
    code_challenge_method: "S256",
    code_challenge: await pkceChallenge(verifier),
    state,
  });
  // Navegación externa a Spotify (no es una página interna de Next).
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${AUTH_URL}?${params}`);
}

/** Completa el regreso desde Spotify. Devuelve a dónde volver dentro de la app. */
export async function completeLogin(search: string, clientId: string): Promise<string> {
  const params = new URLSearchParams(search);
  let saved: { verifier: string; state: string; returnTo?: string } | null = null;
  try {
    saved = JSON.parse(store("session")?.getItem(PKCE_KEY) ?? "null");
  } catch {
    saved = null;
  }
  store("session")?.removeItem(PKCE_KEY);
  if (params.get("error")) throw new MusicError("auth", "Cancelaste la conexión con Spotify o no se autorizó.");
  const code = params.get("code");
  if (!saved || !code || params.get("state") !== saved.state) throw new MusicError("bad_state", MUSIC_ERROR_TEXT.bad_state);
  const res = await timed(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      client_id: clientId,
      code_verifier: saved.verifier,
    }),
  });
  if (!res.ok) throw new MusicError("auth", "Spotify rechazó la conexión. Revisa el Client ID y la dirección de regreso registrada.");
  saveTokenResponse(await res.json(), null);
  return saved.returnTo && saved.returnTo.startsWith("/") ? saved.returnTo : "/ajustes/";
}

function saveTokenResponse(data: { access_token?: string; refresh_token?: string; expires_in?: number }, previousRefresh: string | null): void {
  if (!data.access_token) throw new MusicError("auth", MUSIC_ERROR_TEXT.auth);
  writeTokens({
    access: data.access_token,
    refresh: data.refresh_token ?? previousRefresh,
    expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 3600) - 60) * 1000,
  });
}

async function accessToken(clientId: string, forceRefresh = false): Promise<string> {
  const t = readTokens();
  if (!t) throw new MusicError("not_connected", MUSIC_ERROR_TEXT.not_connected);
  if (!forceRefresh && t.expiresAt > Date.now()) return t.access;
  if (!t.refresh) {
    disconnect();
    throw new MusicError("auth", MUSIC_ERROR_TEXT.auth);
  }
  const res = await timed(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: t.refresh, client_id: clientId }),
  });
  if (!res.ok) {
    disconnect();
    throw new MusicError("auth", MUSIC_ERROR_TEXT.auth);
  }
  saveTokenResponse(await res.json(), t.refresh);
  return readTokens()!.access;
}

async function api(clientId: string, path: string, init: RequestInit = {}): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await accessToken(clientId, attempt > 0);
    const res = await timed(`${API}${path}`, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });
    if (res.status === 401 && attempt === 0) continue;
    if (res.ok) return res;
    if (res.status === 401) {
      disconnect();
      throw new MusicError("auth", MUSIC_ERROR_TEXT.auth);
    }
    let body: { error?: { reason?: string; message?: string } | string; error_description?: string } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      /* sin cuerpo */
    }
    throw classifyError(res.status, body);
  }
  throw new MusicError("unknown", MUSIC_ERROR_TEXT.unknown);
}

/**
 * Traduce un error de Spotify a un mensaje con la solución. Un 403 no siempre
 * es «falta Premium»: en modo de desarrollo lo más común es que la cuenta no
 * esté en «User Management», o que el dispositivo no se pueda controlar.
 */
export function classifyError(status: number, body: { error?: { reason?: string; message?: string } | string; error_description?: string }): MusicError {
  const err = typeof body.error === "object" ? body.error : undefined;
  const reason = err?.reason ?? "";
  const message = `${err?.message ?? ""} ${typeof body.error === "string" ? body.error : ""} ${body.error_description ?? ""}`.toLowerCase();
  const make = (code: MusicErrorCode) => new MusicError(code, MUSIC_ERROR_TEXT[code]);
  if (reason === "PREMIUM_REQUIRED" || /premium/.test(message)) return make("premium");
  if (status === 404 || reason === "NO_ACTIVE_DEVICE") return make("no_device");
  if (status === 429) return make("rate_limited");
  if (status === 403) {
    if (/regist|developer\.spotify\.com|dashboard|user management|not been added/.test(message)) return make("not_registered");
    if (/scope/.test(message)) return make("scope");
    if (/restriction|restricted|disallow/.test(message) || reason === "UNKNOWN" || reason.startsWith("NOT_PAUSED") || reason === "DEVICE_NOT_CONTROLLABLE") return make("restricted");
    // Sin pista: en modo de desarrollo casi siempre es la cuenta sin autorizar en la app.
    return make("not_registered");
  }
  return make("unknown");
}

// ------------------------------------------------------------------ reproducción

interface Device {
  id: string | null;
  is_active: boolean;
  is_restricted: boolean;
  type: string;
}

/** Elige el dispositivo: el activo; si no, un teléfono; si no, el primero disponible. */
export function pickDevice(devices: readonly Device[]): string | null {
  const usable = devices.filter((d) => d.id && !d.is_restricted);
  const chosen = usable.find((d) => d.is_active) ?? usable.find((d) => d.type.toLowerCase() === "smartphone") ?? usable[0];
  return chosen?.id ?? null;
}

/** Reproduce en el dispositivo activo o, si no hay, en uno disponible (p. ej. Spotify abierto pero en pausa). */
async function startPlayback(clientId: string, body: string): Promise<void> {
  try {
    await api(clientId, "/me/player/play", { method: "PUT", headers: { "Content-Type": "application/json" }, body });
  } catch (e) {
    if (!(e instanceof MusicError) || e.code !== "no_device") throw e;
    const res = await api(clientId, "/me/player/devices");
    const device = pickDevice(((await res.json()) as { devices?: Device[] }).devices ?? []);
    if (!device) throw e;
    await api(clientId, `/me/player/play?device_id=${encodeURIComponent(device)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body });
  }
}

/** Pone a sonar una lista (en aleatorio) en el Spotify del usuario. */
export async function playContext(clientId: string, contextUri: string): Promise<void> {
  await startPlayback(clientId, JSON.stringify({ context_uri: contextUri }));
  // Aleatorio para que no empiece siempre por la misma canción; si falla, no importa.
  void api(clientId, "/me/player/shuffle?state=true", { method: "PUT" }).catch(() => undefined);
}

/** Pone a sonar canciones sueltas en el orden dado (la app ya las mezcló). */
export async function playTracks(clientId: string, uris: readonly string[]): Promise<void> {
  await startPlayback(clientId, JSON.stringify({ uris }));
  void api(clientId, "/me/player/shuffle?state=false", { method: "PUT" }).catch(() => undefined);
}

/**
 * Busca una canción («Artista - Canción») y devuelve su URI, o null si no
 * aparece. Solo viaja el nombre de la canción de la selección, nunca datos del juego.
 */
export async function searchTrack(clientId: string, queries: readonly string[]): Promise<string | null> {
  for (const q of queries) {
    const res = await api(clientId, `/search?type=track&limit=1&market=from_token&q=${encodeURIComponent(q)}`);
    const data = (await res.json()) as { tracks?: { items?: { uri?: string }[] } };
    const uri = data.tracks?.items?.[0]?.uri;
    if (uri && /^spotify:track:[A-Za-z0-9]+$/.test(uri)) return uri;
  }
  return null;
}
