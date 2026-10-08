import type { CSSProperties } from "react";
import type { GameId, Intensity } from "@/domain/models/constants";
import type { IconName } from "./icons";

export const GAME_ICON: Record<GameId, IconName> = {
  verdad_reto: "flame",
  ruleta: "wheel",
  dados: "dice",
  tarjetas: "cards",
  temporizador: "timer",
  cadena: "chain",
  noche: "moon",
  caos: "shuffle",
  sorpresa: "gift",
};

export const LEVEL_ICON: Record<Intensity, IconName> = { leve: "heart", picante: "flame", perverso: "kiss" };

/** Índice de esquina de carta por nivel (como el valor de un naipe). */
export const LEVEL_MARK: Record<Intensity, string> = { leve: "L", picante: "P", perverso: "X" };

/**
 * Identidad de mesa de juego: cada juego (y Verdad / Reto por separado) tiene
 * su mezcla de colores, emblema y palo. Se aplica con `themeStyle`, que
 * escribe las variables --g1, --g2 y --g3 que usan las clases de carta y mazo.
 */
export type ThemeKey = GameId | "verdad" | "reto";

export interface GameTheme {
  g1: string;
  g2: string;
  g3: string;
  icon: IconName;
  /** Palo decorativo para esquinas y ornamentos. */
  suit: string;
}

export const GAME_THEME: Record<ThemeKey, GameTheme> = {
  verdad_reto: { g1: "#ff3d7f", g2: "#8b3dff", g3: "#f5c76b", icon: "flame", suit: "♥" },
  verdad: { g1: "#9b5cff", g2: "#ff4fa3", g3: "#ffd6f0", icon: "eye", suit: "♠" },
  reto: { g1: "#ff2e63", g2: "#ff8a3d", g3: "#ffd27a", icon: "flame", suit: "♥" },
  ruleta: { g1: "#f5c76b", g2: "#e8457a", g3: "#fff1c9", icon: "wheel", suit: "♦" },
  dados: { g1: "#22d3ee", g2: "#8b5cf6", g3: "#c4f1ff", icon: "dice", suit: "♣" },
  tarjetas: { g1: "#ff4d8d", g2: "#b026ff", g3: "#ffc2dc", icon: "cards", suit: "♥" },
  temporizador: { g1: "#ff8a3d", g2: "#ff2e63", g3: "#ffe0b3", icon: "timer", suit: "♦" },
  cadena: { g1: "#6366f1", g2: "#ec4899", g3: "#d7d8ff", icon: "chain", suit: "♣" },
  noche: { g1: "#3b2db8", g2: "#c026d3", g3: "#e3d4ff", icon: "moon", suit: "♠" },
  caos: { g1: "#14e1c8", g2: "#ff2e97", g3: "#c9fff6", icon: "shuffle", suit: "♣" },
  sorpresa: { g1: "#f5c76b", g2: "#ff4d8d", g3: "#9b5cff", icon: "gift", suit: "★" },
};

export function themeStyle(key: ThemeKey): CSSProperties {
  const t = GAME_THEME[key];
  return { ["--g1" as string]: t.g1, ["--g2" as string]: t.g2, ["--g3" as string]: t.g3 } as CSSProperties;
}
