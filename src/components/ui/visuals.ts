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
