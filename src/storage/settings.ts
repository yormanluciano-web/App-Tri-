/** Ajustes no sensibles del dispositivo (sin alias, límites ni respuestas). */
export interface AppSettings {
  reducedMotion: "system" | "on" | "off";
  textScale: 1 | 1.15 | 1.3;
  sound: boolean;
  vibration: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = { reducedMotion: "system", textScale: 1, sound: false, vibration: false };

const KEY = "trio:settings";

export function loadSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const v = JSON.parse(raw) as Partial<AppSettings>;
    return {
      reducedMotion: v.reducedMotion === "on" || v.reducedMotion === "off" ? v.reducedMotion : "system",
      textScale: v.textScale === 1.15 || v.textScale === 1.3 ? v.textScale : 1,
      sound: v.sound === true,
      vibration: v.vibration === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* almacenamiento no disponible: se mantiene en memoria */
  }
}
