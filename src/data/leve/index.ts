import type { Activity } from "@/domain/models/activity";
import { leveV2_01 } from "./v2-01";
import { leveV2_02 } from "./v2-02";
import { leveV2_03 } from "./v2-03";
import { leveV2_04 } from "./v2-04";
import { leveV2_05 } from "./v2-05";
import { leveV2_06 } from "./v2-06";

// Catálogo v2 del nivel leve. Añade aquí cada lote (archivos v2-NN.ts).
export const leveAll: Activity[] = [...leveV2_01, ...leveV2_02, ...leveV2_03, ...leveV2_04, ...leveV2_05, ...leveV2_06];
