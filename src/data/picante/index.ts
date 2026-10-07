import type { Activity } from "@/domain/models/activity";
import { picanteV2_01 } from "./v2-01";
import { picanteV2_02 } from "./v2-02";
import { picanteV2_03 } from "./v2-03";
import { picanteV2_04 } from "./v2-04";
import { picanteV2_05 } from "./v2-05";
import { picanteV2_06 } from "./v2-06";
import { picanteV2_07 } from "./v2-07";
import { picanteV2_08 } from "./v2-08";

// Catálogo v2 del nivel picante. Añade aquí cada lote (archivos v2-NN.ts).
export const picanteAll: Activity[] = [
  ...picanteV2_01,
  ...picanteV2_02,
  ...picanteV2_03,
  ...picanteV2_04,
  ...picanteV2_05,
  ...picanteV2_06,
  ...picanteV2_07,
  ...picanteV2_08,
];
