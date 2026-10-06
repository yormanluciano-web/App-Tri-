// Recuento real del catálogo por nivel, categoría, juego, formato, tamaño y contacto.
import { ALL_ACTIVITIES } from "../src/data/catalog";
import { catalogReport } from "../src/domain/content/validate";

const r = catalogReport(ALL_ACTIVITIES);
const asJson = process.argv.includes("--json");
if (asJson) {
  console.log(JSON.stringify(r, null, 2));
} else {
  console.log(`Total: ${r.total} · En producción (activas y revisadas): ${r.production}`);
  console.log(`Estados editoriales: ${JSON.stringify(r.byStatus)}`);
  for (const lvl of Object.keys(r.byCategory)) {
    console.log(`\n## ${lvl} — ${r.byLevel[lvl] ?? 0}`);
    console.log(`  categorías: ${JSON.stringify(r.byCategory[lvl])}`);
    console.log(`  formatos:   ${JSON.stringify(r.byFormat[lvl])}`);
    console.log(`  juegos:     ${JSON.stringify(r.byGame[lvl])}`);
    console.log(`  tamaño:     ${JSON.stringify(r.bySessionSize[lvl])}`);
    console.log(`  contacto:   ${JSON.stringify(r.contact[lvl])}`);
  }
}
