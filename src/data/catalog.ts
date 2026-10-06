import type { Activity, ContentPack } from "@/domain/models/activity";
import { leveBase } from "./leve/base";
import { picanteBase } from "./picante/base";
import { perversoBase } from "./perverso/base";

/** Versión del catálogo. Súbela al cambiar cartas; invalida autorizaciones restauradas. */
export const CONTENT_VERSION = 1;

/** Todas las actividades, incluidas las no publicables (para el validador). */
export const ALL_ACTIVITIES: readonly Activity[] = [...leveBase, ...picanteBase, ...perversoBase];

/** Solo actividades activas y revisadas entran al selector de producción. */
export const CATALOG: readonly Activity[] = ALL_ACTIVITIES.filter((a) => a.active && a.editorialStatus === "reviewed");

const BY_ID = new Map(CATALOG.map((a) => [a.id, a]));

export function getActivity(id: string): Activity | undefined {
  return BY_ID.get(id);
}

export const PACKS: readonly ContentPack[] = [
  { id: "base", nombre: "Base", version: CONTENT_VERSION, activityIds: CATALOG.map((a) => a.id), locale: "es", premium: false },
];
