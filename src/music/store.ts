"use client";

import { create } from "zustand";
import { CUSTOM_FILE } from "@/data/catalog";
import type { MusicConfig } from "@/data/custom";
import { MUSIC_ERROR_TEXT, MusicError, disconnect, isConnected, playContext } from "./spotify";
import type { MusicMoment } from "./moments";

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
  /** Última lista que se pidió poner (evita repetir). */
  current: string | null;
  error: string | null;
  busy: boolean;
  init(): void;
  setAuto(v: boolean): void;
  disconnect(): void;
  /** Pone la lista si es distinta de la actual. `force` la vuelve a poner. */
  play(uri: string, moment: MusicMoment, force?: boolean): Promise<boolean>;
  clearError(): void;
}

export const useMusic = create<MusicState>((set, get) => ({
  ready: false,
  connected: false,
  auto: true,
  moment: null,
  current: null,
  error: null,
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

  async play(uri, moment, force = false) {
    const clientId = MUSIC_CONFIG.clientId;
    if (!clientId || !get().connected) return false;
    if (!force && get().current === uri) {
      set({ moment });
      return true;
    }
    set({ busy: true, error: null, current: uri, moment });
    try {
      await playContext(clientId, uri);
      set({ busy: false });
      return true;
    } catch (e) {
      const err = e instanceof MusicError ? e : new MusicError("unknown", MUSIC_ERROR_TEXT.unknown);
      // Si falló, se vuelve a intentar en el próximo cambio de momento o con «Reintentar».
      set({ busy: false, error: err.message, current: null, connected: err.code === "auth" || err.code === "not_connected" ? false : get().connected });
      return false;
    }
  },

  clearError() {
    set({ error: null });
  },
}));
