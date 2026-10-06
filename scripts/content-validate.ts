// Valida el catálogo completo. Sale con código 1 si hay errores.
import { ALL_ACTIVITIES } from "../src/data/catalog";
import { validateCatalog } from "../src/domain/content/validate";

const strict = process.argv.includes("--similar");
const result = validateCatalog(ALL_ACTIVITIES, { similarity: strict });
for (const e of result.errors) console.error(`ERROR   ${e.id}: ${e.message}`);
for (const w of result.warnings) console.warn(`AVISO   ${w.id}: ${w.message}`);
console.log(`\n${ALL_ACTIVITIES.length} actividades · ${result.errors.length} errores · ${result.warnings.length} avisos`);
process.exit(result.ok ? 0 : 1);
