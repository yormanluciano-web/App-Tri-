import type { Activity } from "@/domain/models/activity";
import { perversoV2_01 } from "./v2-01";
import { perversoV2_02 } from "./v2-02";
import { perversoV2_03 } from "./v2-03";
import { perversoV2_04 } from "./v2-04";
import { perversoV2_05 } from "./v2-05";
import { perversoV2_06 } from "./v2-06";
import { perversoV2_07 } from "./v2-07";
import { perversoV2_08 } from "./v2-08";

// Catálogo v2 del nivel perverso. Añade aquí cada lote (archivos v2-NN.ts).
export const perversoAll: Activity[] = [
  ...perversoV2_01,
  ...perversoV2_02,
  ...perversoV2_03,
  ...perversoV2_04,
  ...perversoV2_05,
  ...perversoV2_06,
  ...perversoV2_07,
  ...perversoV2_08,
];
