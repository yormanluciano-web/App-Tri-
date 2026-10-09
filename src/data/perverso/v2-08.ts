import { defineCards } from "../define";

// Perverso v2 · lote 08: intensificación máxima, cierre progresivo.
// Intensidad 8-9: roles explícitos, desnudez total, juego de finalización.
export const perversoV2_08 = defineCards("perverso", "v2", "muy_perverso", [
  // Duplicado exacto de v2-06010 (mismo texto); se deja comentado para revisarlo.
  // { id: "08001", t: "Beso dulce o picante", x: "{p1}, si {p2} autoriza: ¿beso dulce o picante ahora?", c: "eleccion", f: "reto", s: 78, i: "directed_pair", pair: ["beso_intenso"], d: [30, 20, 50] },
  { id: "08002", t: "Juego ligero", x: "{p1}, {p2} o {p3}: ¿juego ligero o intensa?", c: "eleccion", f: "pregunta", s: 76, i: "group", sizes: [3], pair: ["coqueteo"], d: [30, 20, 50] },
  { id: "08003", t: "Imagen visual", x: "{p1} y {p2}, miradas 1min sin hablar. ¿Qué imagen quedó.", c: "retos", f: "reto", s: 84, pair: ["miradas"], d: [60, 30, 90], tags: ["calma"] },
  { id: "08004", t: "Escena ideal", x: "{p1}, describe 3 palabras escena ideal sin explícitos.", c: "preguntas", f: "pregunta", s: 93, req: ["fantasias"], d: [30, 15, 60] },
  { id: "08005", t: "Círculo caricias", x: "{p1}, {p2}, {p3}: cada uno acaricia hombros 20s.", c: "retos", f: "reto", s: 88, i: "group", sizes: [3], pair: ["caricias"], d: [20, 15, 60] },
  { id: "08006", t: "Mirada larga", x: "{p1} mira 1min a {p2}. Qué siente esa mirada.", c: "retos", f: "reto", s: 79, pair: ["miradas"], d: [60, 30, 90], tags: ["calma"] },
  { id: "08007", t: "Beso descripto", x: "{p2} cierra ojos, {p1} describe beso ideal solo palabras.", c: "retos", f: "reto", s: 86, i: "directed_pair", pair: ["coqueteo"], rol: { p2: ["ojos_cerrados"] }, d: [45, 30, 75], tags: ["voz"] },
  // Duplicado exacto de v2-06016 (mismo texto); se deja comentado para revisarlo.
  // { id: "08008", t: "Pulso mano", x: "{p1} si {p2} autoriza, toma su mano, busca pulso.", c: "desafios", f: "reto", s: 91, i: "directed_pair", pair: ["contacto_manos"], d: [30, 20, 50] },
  { id: "08009", t: "Lengua espalda", x: "{p1} si {p2} autoriza, respira lengua en espalda 10s.", c: "retos", f: "reto", s: 98, i: "directed_pair", req: ["conversacion_ligera", "adivinanzas", "preguntas_personales", "confesiones", "fantasias", "coqueteo", "miradas", "musica", "baile_individual", "roles_juego", "ojos_cerrados", "quitarse_prenda", "desnudez"], pair: ["contacto_manos", "abrazo", "masaje_manos", "masaje_hombros", "baile_cercano", "caricias", "beso", "beso_intenso", "tiempo_a_solas"], aud: ["quitarse_prenda", "desnudez"], audScope: "sesion", d: [10, 10, 20], tags: ["cumplido"] },
  // Duplicado exacto de v2-06018 (mismo texto); se deja comentado para revisarlo.
  // { id: "08010", t: "Canción deseo", x: "{p1}, dice 1 canción que lo recuerde desnudo/a.", c: "preguntas", f: "pregunta", s: 87, req: ["musica", "fantasias"], tags: ["creatividad"] },
  { id: "08011", t: "Turno sorpresa", x: "Cualquiera elige terceros para quitar prenda 15s.", c: "eleccion", f: "reto", s: 73, req: ["quitarse_prenda"], aud: ["quitarse_prenda"], audScope: "sesion", d: [15, 10, 25], tags: ["risas"] },
  // Duplicado exacto de v2-06020 (mismo texto); se deja comentado para revisarlo.
  // { id: "08012", t: "Prenda juego", x: "{p1}, quítate prenda. {p2} decide si volverla a vestir.", c: "retos", f: "reto", s: 91, rol: { p1: ["quitarse_prenda"] }, aud: ["quitarse_prenda"], audScope: "sesion", tags: ["movimiento"] },
  { id: "08013", t: "Olfatear sin tocar", x: "{p2} cierra ojos; {p1} pasa rostro cerca cuello.", c: "retos", f: "reto", s: 73, i: "directed_pair", pair: ["coqueteo"], rol: { p2: ["ojos_cerrados"] }, d: [60, 30, 90] },
  { id: "08014", t: "Voto ternura", x: "{p1}, si {p2} autoriza, {p3} recibe prenda o caricia.", c: "eleccion", f: "reto", s: 95, i: "group", sizes: [3], req: ["quitarse_prenda"], pair: ["caricias"], aud: ["quitarse_prenda"], audScope: "sesion", d: [30, 20, 50] },
  { id: "08015", t: "Ciego caricias", x: "{p2} cierra ojos 2min, {p1} acaricia sin hablar.", c: "retos", f: "reto", s: 79, i: "directed_pair", pair: ["caricias"], rol: { p2: ["ojos_cerrados"] }, d: [120, 60, 180], tags: ["calma"] },
  // Duplicado exacto de v2-06024 (mismo texto); se deja comentado para revisarlo.
  // { id: "08016", t: "Tensión mirada", x: "{p1} y {p2}, miradas intensas; confesam tensión.", c: "retos", f: "reto", s: 82, i: "directed_pair", req: ["confesiones"], pair: ["miradas"], d: [120, 60, 180], tags: ["cumplido"] },
  { id: "08017", t: "Voz baja", x: "{p1} y {p2}, hablan susurros sin nombres.", c: "retos", f: "reto", s: 77, pair: ["coqueteo"], d: [60, 30, 90], tags: ["voz"] },
  { id: "08018", t: "Elección grupal", x: "Grupo elige quién recibe atención prioritaria ahora.", c: "eleccion", f: "reto", s: 75, i: "group", sizes: [3], pair: ["caricias"], d: [45, 25, 70] },
  { id: "08019", t: "Juego broma", x: "{p1}, {p2} o {p3}: broma ligera o intenso. Voto.", c: "eleccion", f: "pregunta", s: 74, i: "group", sizes: [3], pair: ["coqueteo"], d: [30, 20, 50] },
  { id: "08020", t: "Confesión intensa", x: "{p1} y {p2}: quien confiesa cambia asiento para oído.", c: "desafios", f: "reto", s: 100, i: "directed_pair", req: ["confesiones"], pair: ["coqueteo"], d: [60, 45, 105], tags: ["cumplido"] },
  { id: "08021", t: "Cierre grupal", x: "¿Todos necesitan cerrar sesión o seguir?", c: "rompehielo", f: "pregunta", s: 74, req: ["conversacion_ligera"], d: [30, 20, 40], tags: ["cierre"] },
  { id: "08022", t: "Gratitud final", x: "{p1}, di algo gracioso que agradeces a {p2} por hoy.", c: "preguntas", f: "pregunta", s: 88, pair: ["coqueteo"], tags: ["cierre", "cumplido"] },
  { id: "08023", t: "Lo que guardo", x: "{p1}, ¿qué impresión de esta noche te llevas más profundo.", c: "rompehielo", f: "pregunta", s: 82, req: ["preguntas_personales"], d: [40, 30, 70] },
]);
