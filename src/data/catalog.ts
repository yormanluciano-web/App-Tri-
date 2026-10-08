import type { Activity, ContentPack } from "@/domain/models/activity";
import { leveAll } from "./leve";
import { picanteAll } from "./picante";
import { perversoAll } from "./perverso";
import customRaw from "./custom/cartas.json";
import { applyBaseEdits, customCardsToActivities, parseCustomFile } from "./custom";

/** Versión del catálogo. Súbela al cambiar cartas; invalida autorizaciones restauradas. */
export const CONTENT_VERSION = 2;

/** Cartas escritas en el código (antes de ocultar ninguna). */
export const BASE_ACTIVITIES: readonly Activity[] = [...leveAll, ...picanteAll, ...perversoAll];

/** Cartas creadas y ocultadas desde el panel de administración (src/data/custom/cartas.json). */
export const CUSTOM_FILE = parseCustomFile(customRaw);
export const CUSTOM_ACTIVITIES: readonly Activity[] = customCardsToActivities(CUSTOM_FILE.cartas);
const HIDDEN = new Set(CUSTOM_FILE.ocultas);

/** Todas las actividades, incluidas las no publicables (para el validador). */
export const ALL_ACTIVITIES: readonly Activity[] = [
  ...applyBaseEdits(BASE_ACTIVITIES, CUSTOM_FILE.ediciones).filter((a) => !HIDDEN.has(a.id)),
  ...CUSTOM_ACTIVITIES,
];

/** Solo actividades activas y revisadas entran al selector de producción. */
export const CATALOG: readonly Activity[] = ALL_ACTIVITIES.filter((a) => a.active && a.editorialStatus === "reviewed");

const BY_ID = new Map(CATALOG.map((a) => [a.id, a]));

export function getActivity(id: string): Activity | undefined {
  return BY_ID.get(id);
}

export const PACKS: readonly ContentPack[] = [
  { id: "base", nombre: "Base", version: CONTENT_VERSION, activityIds: CATALOG.map((a) => a.id), locale: "es", premium: false },
];
