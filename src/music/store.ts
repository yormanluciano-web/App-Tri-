"use client";

import { create } from "zustand";
import { CUSTOM_FILE } from "@/data/catalog";
import type { MusicConfig } from "@/data/custom";
import { MUSIC_ERROR_TEXT, MusicError, disconnect, isConnected, playContext, playTracks, searchTrack } from "./spotify";
import type { MusicMoment, MusicSource } from "./moments";
import { songQueries } from "./selection";
import { setMixWithOthers } from "@/sound/sfx";

/** Configuración publicada en el repositorio (cartas.json → musica). */
export const MUSIC_CONFIG: MusicConfig = CUSTOM_FILE.musica ?? { listas: {} };

const PREFS_KEY = "trio:music";

function readAuto(): boolean {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as { auto?: boolean }).auto !== false : true;
  } catch {
    return true;
  }
}

function writeAuto(auto: boolean): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ auto }));
  } catch {
    /* opcional */
  }
}

interface MusicState {
  ready: boolean;
  connected: boolean;
  /** Cambiar la música sola según las cartas. */
  auto: boolean;
  moment: MusicMoment | null;
  /** Última música que se pidió poner (lista o selección del DJ; evita repetir). */
  current: string | null;
  error: string | null;
  /** Respuesta técnica de Spotify del último error (para diagnosticar). */
  errorDetail: string | null;
  /** Tipo del último error (p. ej. «no_device» para ofrecer «Abrir Spotify»). */
  errorCode: string | null;
  /** Última música pedida, para reintentar sola al volver de Spotify. */
  pending: { source: MusicSource; moment: MusicMoment } | null;
  busy: boolean;
  init(): void;
  setAuto(v: boolean): void;
  disconnect(): void;
  /** Pone la música del momento si es distinta de la actual. `force` la vuelve a poner. */
  play(source: MusicSource, moment: MusicMoment, force?: boolean): Promise<boolean>;
  clearError(): void;
}

/** Canción → URI ya encontrada (solo en memoria; nunca se guarda en el dispositivo). */
const found = new Map<string, string | null>();

/**
 * DJ Cómplice: busca las canciones del momento (pocas a la vez, con caché) y
 * las devuelve mezcladas. Las que no aparecen se saltan.
 */
async function resolveSongs(clientId: string, songs: readonly string[]): Promise<string[]> {
  const pending = songs.filter((s) => !found.has(s));
  let next = 0;
  const worker = async () => {
    while (next < pending.length) {
      const song = pending[next++];
      try {
        found.set(song, await searchTrack(clientId, songQueries(song)));
      } catch (e) {
        // Sin conexión o sesión caducada: no tiene sentido seguir buscando.
        if (e instanceof MusicError && e.code !== "unknown") throw e;
        found.set(song, null);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, pending.length) }, worker));
  const uris = [...new Set(songs.map((s) => found.get(s)).filter((u): u is string => !!u))];
  if (uris.length === 0) throw new MusicError("no_songs", MUSIC_ERROR_TEXT.no_songs);
  for (let i = uris.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uris[i], uris[j]] = [uris[j], uris[i]];
  }
  return uris;
}

export const useMusic = create<MusicState>((set, get) => ({
  ready: false,
  connected: false,
  auto: true,
  moment: null,
  current: null,
  error: null,
  errorDetail: null,
  errorCode: null,
  pending: null,
  busy: false,

  init() {
    set({ ready: true, connected: isConnected(), auto: readAuto() });
  },

  setAuto(v) {
    writeAuto(v);
    set({ auto: v });
  },

  disconnect() {
    disconnect();
    set({ connected: false, current: null, moment: null, error: null });
  },

  async play(source, moment, force = false) {
    const clientId = MUSIC_CONFIG.clientId;
    if (!clientId || !get().connected) return false;
    if (!force && get().current === source.key) {
      set({ moment });
      return true;
    }
    set({ busy: true, error: null, errorDetail: null, errorCode: null, current: source.key, moment, pending: { source, moment } });
    try {
      if (source.uri) await playContext(clientId, source.uri);
      else await playTracks(clientId, await resolveSongs(clientId, source.songs ?? []));
      set({ busy: false, pending: null });
      return true;
    } catch (e) {
      const err = e instanceof MusicError ? e : new MusicError("unknown", MUSIC_ERROR_TEXT.unknown);
      // Si falló, se vuelve a intentar en el próximo cambio de momento o con «Reintentar».
      set({ busy: false, error: err.message, errorDetail: err.detail ?? null, errorCode: err.code, current: null, connected: err.code === "auth" || err.code === "not_connected" ? false : get().connected });
      return false;
    }
  },

  clearError() {
    set({ error: null, errorDetail: null, errorCode: null });
  },
}));

// Con Spotify conectado y el DJ activo, los efectos de la app se mezclan con la
// música en lugar de quitarle el audio (en iPhone la pausaban en cada carta).
useMusic.subscribe((s) => setMixWithOthers(s.connected && s.auto));

// Al volver a Cómplice (por ejemplo, después de abrir Spotify y poner una canción),
// si la música no pudo empezar porque Spotify estaba dormido, se reintenta sola.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const s = useMusic.getState();
    if (!s.pending || !s.connected || !s.auto || s.busy) return;
    if (s.errorCode !== "no_device" && s.errorCode !== "restricted") return;
    const { source, moment } = s.pending;
    // Un instante para que Spotify vuelva a aparecer como dispositivo activo.
    setTimeout(() => void useMusic.getState().play(source, moment, true), 1200);
  });
}
