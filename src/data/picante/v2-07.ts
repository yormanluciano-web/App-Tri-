import { defineCards } from "../define";

// Picante v2, lote 07: cartas p2-361 a p2-420.
export const picanteV2_07 = defineCards("picante", "p2", "base", [
  { id: "361", t: "Elige la cercanía", x: "{p1}, elige la cercanía que quieres con {p2} durante un minuto: tomados de la mano, abrazados o tu cabeza en su hombro.", c: "eleccion", f: "reto", s: 59, pair: ["contacto_manos", "abrazo"], d: [60, 30, 90], tags: ["calma", "cierre"] },
  { id: "362", t: "Mejilla o deseo", x: "{p1} elige: {p2} le da un beso en la mejilla o {p3} le susurra un deseo al oído.", c: "eleccion", f: "reto", s: 60, i: "group", sizes: [3], req: ["coqueteo"], pair: ["beso"] },
  { id: "363", t: "Mensaje o mirada", x: "{p1}, ¿qué te parece más atrevido: un mensaje picante o una mirada sostenida en público?", c: "eleccion", f: "pregunta", s: 61, req: ["preguntas_personales"] },
  { id: "364", t: "Lo que se lleva", x: "{p1}, elige qué se lleva {p2} de esta noche: un beso en los labios, un abrazo largo o un cumplido al oído.", c: "eleccion", f: "reto", s: 62, i: "directed_pair", pair: ["beso_intenso", "abrazo", "coqueteo"], tags: ["cierre"] },
  { id: "365", t: "Cerrar con estilo", x: "{p1}, elige cómo terminar la ronda con {p2}: un baile lento, un abrazo o un piquito.", c: "eleccion", f: "reto", s: 65, req: ["musica"], pair: ["baile_cercano", "abrazo", "beso"], tags: ["cierre"] },
  { id: "398", t: "Pensamiento subido", x: "{p1}, confiesa la última vez que pensaste en alguien de forma muy subida de tono, sin decir quién ni dar detalles.", c: "secretos", f: "pregunta", s: 36, req: ["confesiones"] },
  { id: "399", t: "Seducción fallida", x: "{p1}, confiesa algo que hiciste para seducir a alguien y que salió fatal.", c: "secretos", f: "pregunta", s: 40, req: ["confesiones"], tags: ["risas"] },
  { id: "400", t: "Al verte llegar", x: "{p1}, confiésale a {p2} algo atrevido que imaginaste hoy al verle llegar.", c: "secretos", f: "reto", s: 45, i: "directed_pair", req: ["confesiones"], pair: ["coqueteo"] },
  { id: "401", t: "Secreto halagador", x: "{p1}, susúrrale a {p2} algo halagador y atrevido que piensas de {p3}; {p2} decide si lo repite en voz alta.", c: "secretos", f: "reto", s: 48, i: "group", sizes: [3], req: ["confesiones", "coqueteo"] },
  { id: "402", t: "Solo aquí", x: "{p1}, ¿cuál es el secreto más picante de tu vida amorosa que contarías solo en este grupo?", c: "secretos", f: "pregunta", s: 52, req: ["confesiones"] },
  { id: "403", t: "Nervios de la noche", x: "{p1}, confiesa qué momento de esta noche te ha puesto más nervios y por qué.", c: "secretos", f: "pregunta", s: 56, req: ["confesiones"] },
  { id: "404", t: "Toda la noche", x: "{p1}, confiesa a quién de esta sesión mirarías toda la noche sin cansarte.", c: "secretos", f: "pregunta", s: 59, sizes: [3], req: ["confesiones", "coqueteo"] },
  { id: "405", t: "Lo que has deseado", x: "{p1}, confiésale en voz baja a {p2} qué has deseado hacer con esa persona esta noche, sin detalles explícitos.", c: "secretos", f: "reto", s: 63, i: "directed_pair", req: ["confesiones", "fantasias"], pair: ["coqueteo"] },
]);
