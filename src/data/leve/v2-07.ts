import { defineCards } from "../define";

// Leve v2 · lote 07: cartas solo para una pareja hombre y mujer (`mixta: true`).
// El motor solo las asigna si {p1} y {p2} declararon géneros distintos, en cualquier orden.
export const leveV2_07 = defineCards("leve", "l2", "base", [
  { id: "326", t: "Lo que no entienden", x: "{p1}, dile a {p2} una cosa de los hombres o de las mujeres que nunca has terminado de entender. {p2} intenta explicártela.", c: "preguntas", f: "pregunta", s: 14, i: "directed_pair", req: ["conversacion_ligera"], mixta: true, tags: ["risas"] },
  { id: "327", t: "Primera cita ideal", x: "{p1} y {p2}, describan por turnos cómo sería la primera cita perfecta entre ustedes dos, sin ponerse de acuerdo antes.", c: "conexion", f: "pregunta", s: 18, req: ["conversacion_ligera", "coqueteo"], mixta: true },
  { id: "328", t: "El cumplido que funciona", x: "{p1}, dile a {p2} el cumplido que más te gusta recibir… y pídele que te lo diga ahora.", c: "rompehielo", f: "reto", s: 22, i: "directed_pair", pair: ["coqueteo"], mixta: true, tags: ["cumplido"] },
  { id: "329", t: "Mito derribado", x: "{p1}, cuéntale a {p2} un mito sobre hombres o mujeres que te parezca totalmente falso.", c: "preguntas", f: "pregunta", s: 10, i: "directed_pair", req: ["conversacion_ligera"], mixta: true },
  { id: "330", t: "Baile de salón", x: "{p1} y {p2}, bailen diez segundos como pareja de baile de salón, sin tocarse, con toda la elegancia posible.", c: "musica", f: "reto", s: 20, req: ["baile_individual", "musica"], mixta: true, d: [10, 10, 30], tags: ["risas", "movimiento"] },
  { id: "331", t: "Lo que se nota primero", x: "{p1}, confiesa qué es lo primero que notas en un hombre o una mujer que te gusta. {p2} responde lo mismo.", c: "preguntas", f: "pregunta", s: 24, i: "directed_pair", req: ["preguntas_personales"], mixta: true },
]);
