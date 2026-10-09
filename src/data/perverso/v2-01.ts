import { defineCards } from "../define";

// Perverso v2 · lente 01: base suave, caricias, besos exploratorios.
// Intensidad 2-3 caricias exploratorias, suavidad, coqueteo.
export const perversoV2_01 = defineCards("perverso", "v2", "suave", [
  { id: "01001", t: "Primer contacto", x: "{p1} toma mano de {p2} 5s. ¿Cómo se siente ese contacto.", c: "retos", f: "reto", s: 75, i: "directed_pair", pair: ["contacto_manos"], d: [10, 10, 10] },
  { id: "01002", t: "Beso lento", x: "{p1} y {p2}, beso lento 15s. Luego describen en voz.", c: "retos", f: "reto", s: 88, i: "directed_pair", pair: ["beso"], d: [15, 10, 20], tags: ["cumplido"] },
  { id: "01003", t: "Preguntas suaves", x: "{p1}, ¿qué te gusta más de las caricias? ¿Mano, cintura o espalda.", c: "preguntas", f: "pregunta", s: 82, req: ["preguntas_personales"], d: [30, 15, 45] },
  { id: "01004", t: "Toques sin presion", x: "{p1} y {p2}, 30s de toques suaves donde sienten; dicen qué partes.", c: "retos", f: "reto", s: 80, i: "directed_pair", pair: ["caricias"], d: [30, 20, 50], tags: ["cumplido"] },
  { id: "01005", t: "Besos exploratorios", x: "{p1} y {p2}, intercambian besos en labios, cuello, oídos 2min.", c: "retos", f: "reto", s: 93, i: "directed_pair", pair: ["beso_intenso"], d: [120, 60, 180], tags: ["cumplido"] },
  { id: "01006", t: "Preguntas sin juicios", x: "{p2}, ¿qué te gustaría que {p1} hiciera contigo esta noche.", c: "preguntas", f: "pregunta", s: 78, req: ["preguntas_personales"], pair: ["coqueteo"], d: [30, 20, 40] },
  { id: "01007", t: "Confesiones progresivas", x: "{p1}, confía: ¿algún deseo que siempre has guardado. Dilo en voz.", c: "rompehielo", f: "pregunta", s: 86, req: ["confesiones"], d: [45, 30, 60], tags: ["cumplido"] },
  { id: "01008", t: "Coqueteo ligero", x: "{p1} y {p2}, un comentario coqueto; ¿qué te parece esa broma suave.", c: "rompehielo", f: "pregunta", s: 76, req: ["coqueteo"], d: [30, 20, 40], tags: ["risas"] },
  { id: "01009", t: "Lenguaje no verbal", x: "{p1}, sin hablar: comunica en mirada y gesto qué deseas ahora.", c: "retos", f: "reto", s: 84, req: ["miradas", "coqueteo"], d: [45, 30, 60], tags: ["calma"] },
  { id: "01010", t: "Riesgo mínimo", x: "{p1}, di lo más atrevido que te atreves a decir sin cruzar límites.", c: "retos", f: "reto", s: 88, req: ["confesiones"], d: [30, 15, 30] },
  { id: "01011", t: "Canción suave", x: "Eligen 1 canción para esta ronda; si ambos disfrutan.", c: "eleccion", f: "reto", s: 74, req: ["musica"] },
  { id: "01012", t: "Beso con ritmo", x: "{p1} y {p2}, beso suave al compás de la música; 20s o hasta cansar.", c: "retos", f: "reto", s: 85, req: ["musica"], pair: ["beso"], d: [20, 15, 30] },
  { id: "01013", t: "Susurro secreto", x: "{p1} si {p2} autoriza, le susurra al oído lo primero que piensa.", c: "retos", f: "reto", s: 82, i: "directed_pair", pair: ["coqueteo"], d: [30, 20, 40], tags: ["cumplido"] },
  { id: "01014", t: "Aciertos", x: "{p1}, {p2} o {p3}: ¿quién adivina mejor el secreto atrevido de la pareja. Voto.", c: "rompehielo", f: "pregunta", s: 80, i: "group", sizes: [3], req: ["adivinanzas"], d: [30, 15, 60] },
  { id: "01015", t: "Preguntas íntimas", x: "{p1}, ¿qué te gusta más de los juegos de esta noche. Dilo con voz.", c: "preguntas", f: "pregunta", s: 87, req: ["preguntas_personales"], d: [30, 20, 40], tags: ["cumplido"] },
  { id: "01016", t: "Confesión rápida", x: "{p1}, di una palabra sobre lo que sientes hacia {p2}.", c: "preguntas", f: "pregunta", s: 79, req: ["preguntas_personales"], tags: ["cumplido"] },
  { id: "01017", t: "Beso de cierre", x: "Antes de terminar: {p1} y {p2}, 10s de beso dulce o intenso. Voto.", c: "rompehielo", f: "reto", s: 83, i: "directed_pair", pair: ["beso"], d: [10, 10, 15] },
  { id: "01018", t: "Lo que guardo", x: "{p1}, ¿qué recuerdo de esta noche te lleva ahora mismo.", c: "preguntas", f: "pregunta", s: 86, req: ["preguntas_personales"], tags: ["cumplido"] },
  { id: "01019", t: "Verdad final", x: "{p1}, última verdad: ¿te gustó más lo suave o lo intenso hoy.", c: "rompehielo", f: "pregunta", s: 81, req: ["preguntas_personales"], d: [30, 15, 30], tags: ["cumplido"] },
]);
