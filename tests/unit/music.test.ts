import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  beginLogin,
  completeLogin,
  disconnect,
  isConnected,
  parseSpotifyUri,
  pickDevice,
  pkceChallenge,
  playContext,
} from "@/music/spotify";
import { momentFor, playlistFor } from "@/music/moments";
import { applyCustomChange, customFileSchema, EMPTY_CUSTOM_FILE } from "@/data/custom";
import { defineCards } from "@/data/define";
import { allLights, config, participant, readySession } from "../helpers";

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

describe("enlaces de Spotify", () => {
  it("acepta enlaces y URIs de listas, álbumes y artistas", () => {
    expect(parseSpotifyUri("https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO?si=abc123")).toBe("spotify:playlist:37i9dQZF1DX4sWSpwq3LiO");
    expect(parseSpotifyUri("https://open.spotify.com/intl-es/album/4aawyAB9vmqN3uQ7FjRGTy")).toBe("spotify:album:4aawyAB9vmqN3uQ7FjRGTy");
    expect(parseSpotifyUri("spotify:artist:0OdUWJ0sBjDrqHygGUXeCF")).toBe("spotify:artist:0OdUWJ0sBjDrqHygGUXeCF");
  });
  it("rechaza canciones sueltas y otros sitios", () => {
    expect(parseSpotifyUri("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toBeNull();
    expect(parseSpotifyUri("https://example.com/playlist/37i9dQZF1DX4sWSpwq3LiO")).toBeNull();
    expect(parseSpotifyUri("hola")).toBeNull();
  });
});

describe("PKCE", () => {
  it("es base64url(SHA-256(verificador)), igual que la implementación de Node", async () => {
    for (const v of ["dBjftJeZ4CVP-mJ92K1aMYwhQGs8DVvf4WN5h0ElnMI", "a".repeat(64), "Z9~._-xyz".repeat(6)]) {
      expect(await pkceChallenge(v)).toBe(createHash("sha256").update(v).digest("base64url"));
    }
  });
});

describe("momentos musicales", () => {
  const [baile, calma, charla] = defineCards("picante", "mu", "test", [
    { id: "001", t: "Baile", x: "{p1} y {p2}, bailen una canción lenta.", c: "baile", f: "reto", s: 40, req: ["musica"], pair: ["baile_cercano"] },
    { id: "002", t: "Calma", x: "{p1} y {p2}, respiren juntos medio minuto.", c: "conexion", f: "reto", s: 40, pair: ["miradas"], tags: ["calma"] },
    { id: "003", t: "Charla", x: "{p1}, cuenta tu mejor cita.", c: "preguntas", f: "pregunta", s: 40, req: ["conversacion_ligera"] },
  ]);
  const s = readySession(config([participant("a", allLights("green")), participant("b", allLights("green"))], { initialLevel: "picante" }));

  it("elige baile, calma, el nivel o el cierre", () => {
    expect(momentFor(s, baile)).toBe("baile");
    expect(momentFor(s, calma)).toBe("calma");
    expect(momentFor(s, charla)).toBe("picante");
    expect(momentFor(s, null)).toBe("picante");
    expect(momentFor({ ...s, status: "finished" }, null)).toBe("cierre");
  });

  it("sin lista para el momento, suena la del nivel; sin nada, no cambia", () => {
    expect(playlistFor("baile", "picante", { picante: "spotify:playlist:aaaaaaaaaa" })).toBe("spotify:playlist:aaaaaaaaaa");
    expect(playlistFor("baile", "picante", { baile: "spotify:playlist:bbbbbbbbbb", picante: "spotify:playlist:aaaaaaaaaa" })).toBe("spotify:playlist:bbbbbbbbbb");
    expect(playlistFor("leve", "leve", {})).toBeNull();
  });
});

describe("configuración de música en cartas.json", () => {
  it("se guarda con el panel y se valida", () => {
    const f = applyCustomChange(EMPTY_CUSTOM_FILE, {
      kind: "music",
      musica: { clientId: "a".repeat(32), listas: { leve: "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO" } },
    });
    expect(customFileSchema.parse(f).musica?.listas.leve).toBe("spotify:playlist:37i9dQZF1DX4sWSpwq3LiO");
    expect(() => applyCustomChange(EMPTY_CUSTOM_FILE, { kind: "music", musica: { clientId: "corto", listas: {} } })).toThrow();
  });
});

describe("dispositivo", () => {
  it("prefiere el activo, luego el teléfono, nunca uno restringido", () => {
    expect(pickDevice([{ id: "pc", is_active: false, is_restricted: false, type: "Computer" }, { id: "tel", is_active: false, is_restricted: false, type: "Smartphone" }])).toBe("tel");
    expect(pickDevice([{ id: "tel", is_active: false, is_restricted: false, type: "Smartphone" }, { id: "tv", is_active: true, is_restricted: false, type: "TV" }])).toBe("tv");
    expect(pickDevice([{ id: "x", is_active: true, is_restricted: true, type: "Speaker" }])).toBeNull();
  });
});

describe("conexión y reproducción con Spotify simulado", () => {
  const CLIENT = "c".repeat(32);
  let assigned = "";
  let calls: { url: string; method: string; body?: string; auth?: string }[] = [];
  let responder: (url: string, method: string) => Response;

  beforeEach(() => {
    assigned = "";
    calls = [];
    vi.stubGlobal("window", {
      location: { origin: "https://complice.example", assign: (u: string) => (assigned = u) },
      localStorage: new MemStorage(),
      sessionStorage: new MemStorage(),
    });
    vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      calls.push({ url, method, body: init.body?.toString(), auth: (init.headers as Record<string, string> | undefined)?.Authorization });
      return responder(url, method);
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

  async function connect() {
    await beginLogin(CLIENT, "/jugar/");
    const auth = new URL(assigned);
    expect(auth.origin + auth.pathname).toBe("https://accounts.spotify.com/authorize");
    expect(auth.searchParams.get("code_challenge_method")).toBe("S256");
    expect(auth.searchParams.get("redirect_uri")).toBe("https://complice.example/spotify/");
    expect(auth.searchParams.get("scope")).toContain("user-modify-playback-state");
    responder = () => json({ access_token: "A1", refresh_token: "R1", expires_in: 3600 });
    const back = await completeLogin(`?code=xyz&state=${auth.searchParams.get("state")}`, CLIENT);
    expect(back).toBe("/jugar/");
    const token = calls.at(-1)!;
    expect(token.url).toBe("https://accounts.spotify.com/api/token");
    expect(token.body).toContain("code_verifier=");
    expect(token.body).not.toContain("client_secret");
  }

  it("conecta con PKCE y rechaza un regreso con otro «state»", async () => {
    await connect();
    expect(isConnected()).toBe(true);
    disconnect();
    await beginLogin(CLIENT);
    await expect(completeLogin("?code=xyz&state=otro", CLIENT)).rejects.toMatchObject({ code: "bad_state" });
    expect(isConnected()).toBe(false);
  });

  it("pone la lista; sin dispositivo activo usa el teléfono disponible", async () => {
    await connect();
    let firstPlay = true;
    responder = (url, method) => {
      if (url.endsWith("/me/player/play") && method === "PUT" && firstPlay) {
        firstPlay = false;
        return json({ error: { status: 404, reason: "NO_ACTIVE_DEVICE" } }, 404);
      }
      if (url.endsWith("/me/player/devices")) return json({ devices: [{ id: "tel1", is_active: false, is_restricted: false, type: "Smartphone" }] });
      return new Response(null, { status: 204 });
    };
    await playContext(CLIENT, "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO");
    const plays = calls.filter((c) => c.url.includes("/me/player/play"));
    expect(plays.at(-1)!.url).toContain("device_id=tel1");
    expect(plays.at(-1)!.body).toBe(JSON.stringify({ context_uri: "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO" }));
    // Solo viaja la URI de la lista.
    for (const c of calls) expect(c.body ?? "").not.toMatch(/alias|texto|limit/i);
  });

  it("avisa si la cuenta no es Premium y renueva el token caducado", async () => {
    await connect();
    responder = () => json({ error: { status: 403, reason: "PREMIUM_REQUIRED" } }, 403);
    await expect(playContext(CLIENT, "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO")).rejects.toMatchObject({ code: "premium" });
    responder = () => json({ error: { status: 429, message: "API rate limit exceeded" } }, 429);
    await expect(playContext(CLIENT, "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO")).rejects.toMatchObject({ code: "rate_limited" });

    let refreshed = false;
    responder = (url) => {
      if (url.endsWith("/api/token")) {
        refreshed = true;
        return json({ access_token: "A2", expires_in: 3600 });
      }
      return refreshed ? new Response(null, { status: 204 }) : json({ error: { status: 401 } }, 401);
    };
    await playContext(CLIENT, "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO");
    expect(refreshed).toBe(true);
    expect(calls.filter((c) => c.url.includes("/me/player/play")).at(-1)!.auth).toBe("Bearer A2");
  });
});
