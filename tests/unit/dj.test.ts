import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SONGS, parseSong, songQueries } from "@/music/selection";
import { MUSIC_MOMENTS, sourceFor } from "@/music/moments";
import { customFileSchema } from "@/data/custom";

describe("DJ Cómplice: selección de canciones", () => {
  it("cada momento tiene canciones en formato «Artista - Canción», sin repetir", () => {
    const all: string[] = [];
    for (const m of MUSIC_MOMENTS) {
      expect(DEFAULT_SONGS[m].length, m).toBeGreaterThanOrEqual(10);
      for (const line of DEFAULT_SONGS[m]) {
        expect(parseSong(line), line).not.toBeNull();
        all.push(line.toLowerCase());
      }
    }
    expect(new Set(all).size).toBe(all.length);
  });

  it("solo en español: ningún título con palabras típicas del inglés", () => {
    const english = /\b(the|love|baby|you|my|girl|night|feat|remix)\b/i;
    for (const m of MUSIC_MOMENTS) for (const line of DEFAULT_SONGS[m]) expect(parseSong(line)!.title, line).not.toMatch(english);
  });

  it("arma búsquedas exactas por artista y título, y una de respaldo", () => {
    expect(songQueries("Karol G - Provenza")).toEqual(['track:"Provenza" artist:"Karol G"', "Karol G Provenza"]);
    expect(parseSong("Feid – Luna")).toEqual({ artist: "Feid", title: "Luna" });
    expect(parseSong("sin guion")).toBeNull();
  });

  it("cada momento usa su lista propia si la hay; si no, sus canciones (las del panel o las de la app)", () => {
    expect(sourceFor("leve", { listas: { leve: "spotify:playlist:abc" } }, DEFAULT_SONGS)).toEqual({ key: "spotify:playlist:abc", uri: "spotify:playlist:abc" });
    expect(sourceFor("baile", { listas: { leve: "spotify:playlist:abc" } }, DEFAULT_SONGS)).toEqual({ key: "dj:baile", songs: DEFAULT_SONGS.baile });
    expect(sourceFor("calma", { canciones: { calma: ["Pedro Capó - Calma"] } }, DEFAULT_SONGS).songs).toEqual(["Pedro Capó - Calma"]);
    expect(sourceFor("calma", { canciones: { calma: [] } }, DEFAULT_SONGS).songs).toBe(DEFAULT_SONGS.calma);
  });

  it("el archivo del repositorio acepta canciones por momento", () => {
    const f = customFileSchema.parse({ version: 1, cartas: [], ocultas: [], musica: { clientId: "a".repeat(32), canciones: { leve: ["Feid - Normal"] } } });
    expect(f.musica?.canciones?.leve).toEqual(["Feid - Normal"]);
    expect(f.musica?.listas).toEqual({});
  });
});

describe("DJ Cómplice: reproducción", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("busca las canciones, salta las que no aparecen y las pone mezcladas; solo envía nombres de canciones", async () => {
    vi.resetModules();
    const calls: { url: string; body?: string }[] = [];
    const store: Record<string, string> = {
      "trio:spotify": JSON.stringify({ access: "tok", refresh: "r", expiresAt: Date.now() + 3_600_000 }),
    };
    vi.stubGlobal("window", {
      localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] },
      location: { origin: "https://app.test" },
    });
    vi.stubGlobal("localStorage", (globalThis as unknown as { window: { localStorage: Storage } }).window.localStorage);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, body: typeof init?.body === "string" ? init.body : undefined });
        if (url.includes("/search")) {
          const q = decodeURIComponent(url.split("q=")[1]);
          const hit = q.includes("No Existe") ? [] : [{ uri: `spotify:track:${q.length}${q.charCodeAt(8)}` }];
          return new Response(JSON.stringify({ tracks: { items: hit } }), { status: 200 });
        }
        return new Response(null, { status: 204 });
      }),
    );
    const { useMusic, MUSIC_CONFIG } = await import("@/music/store");
    MUSIC_CONFIG.clientId = "a".repeat(32);
    useMusic.setState({ connected: true, ready: true });
    const ok = await useMusic.getState().play({ key: "dj:calma", songs: ["Pedro Capó - Calma", "Nadie - No Existe", "Morat - Cómo Te Atreves"] }, "calma");
    expect(ok).toBe(true);
    const play = calls.find((c) => c.url.endsWith("/me/player/play"));
    const uris = JSON.parse(play!.body!).uris as string[];
    expect(uris).toHaveLength(2);
    // Nada del juego viaja: solo búsquedas de canciones y órdenes de reproducción.
    for (const c of calls) expect(c.url).toMatch(/\/v1\/(search\?type=track|me\/player)/);
    expect(useMusic.getState().current).toBe("dj:calma");
  });
});
