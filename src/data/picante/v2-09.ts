import { defineCards } from "../define";

// Picante v2 · lote 09: cartas solo para una pareja hombre y mujer (`mixta: true`).
export const picanteV2_09 = defineCards("picante", "p2", "base", [
  { id: "451", t: "Baile pegado", x: "{p1} y {p2}, bailen una canción lenta muy pegados, como pareja de baile de toda la vida.", c: "baile", f: "reto", s: 48, req: ["musica"], pair: ["baile_cercano"], mixta: true, d: [60, 30, 120], tags: ["movimiento"] },
  { id: "452", t: "Lo que más te atrae", x: "{p1}, dile a {p2}, mirándole a los ojos, qué es lo que más te atrae de un hombre o una mujer… y si lo ves en {p2}.", c: "preguntas", f: "pregunta", s: 44, i: "directed_pair", req: ["preguntas_personales"], pair: ["coqueteo", "miradas"], mixta: true },
  { id: "453", t: "Galán y musa", x: "{p1}, conquista a {p2} durante treinta segundos como en una película de época. {p2} decide si lo lograste.", c: "retos", f: "reto", s: 40, i: "directed_pair", rol: { p1: ["roles_juego"] }, pair: ["coqueteo"], mixta: true, d: [30, 20, 45], tags: ["risas", "voz"] },
  { id: "454", t: "Beso de despedida", x: "{p1}, despídete de {p2} como en el andén de una estación: un beso en la mejilla largo y lento.", c: "retos", f: "reto", s: 50, i: "directed_pair", pair: ["beso"], mixta: true },
  { id: "455", t: "Abrazo por la espalda", x: "{p1}, abraza a {p2} por la espalda durante veinte segundos y susúrrale algo que te guste de su perfume.", c: "retos", f: "reto", s: 55, i: "directed_pair", pair: ["abrazo", "coqueteo"], mixta: true, d: [20, 10, 30] },
  { id: "456", t: "Fantasía de cita", x: "{p1} y {p2}, cuenten por turnos cómo terminaría una cita entre ustedes si todo saliera perfecto.", c: "conexion", f: "pregunta", s: 58, req: ["fantasias"], pair: ["coqueteo"], mixta: true },
  { id: "457", t: "Mano en la cintura", x: "{p1}, toma a {p2} de la cintura por encima de la ropa y guíale en un baile lento de treinta segundos.", c: "baile", f: "reto", s: 60, i: "directed_pair", req: ["musica"], pair: ["baile_cercano", "caricias"], mixta: true, d: [30, 20, 60], tags: ["movimiento"] },
  { id: "458", t: "Corbata imaginaria", x: "{p1}, acomoda el cuello de la camisa o la blusa de {p2} muy despacio, mirándole a los ojos.", c: "retos", f: "reto", s: 52, i: "directed_pair", pair: ["contacto_manos", "miradas"], mixta: true },
  { id: "459", t: "Primera impresión", x: "{p1}, confiesa qué pensaste de {p2} la primera vez que le viste, con todo el detalle que te atrevas.", c: "preguntas", f: "pregunta", s: 46, i: "directed_pair", req: ["confesiones"], pair: ["coqueteo"], mixta: true },
  { id: "460", t: "Susurro al oído", x: "{p1}, acércate al oído de {p2} y susúrrale lo que harías en una segunda cita.", c: "retos", f: "reto", s: 62, i: "directed_pair", pair: ["coqueteo", "miradas"], mixta: true, tags: ["voz"] },
]);
