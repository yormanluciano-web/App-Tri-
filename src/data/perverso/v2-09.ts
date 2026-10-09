import { defineCards } from "../define";

// Perverso v2 · lote 09: cierre, preguntas finales, despedida sensual.
// Intensidad máxima, recapitulación, despedida.
export const perversoV2_09 = defineCards("perverso", "v2", "cierre", [
  { id: "09001", t: "Frase memorable", x: "{p1}, ¿de esta noche, qué frase te impactó más.", c: "preguntas", f: "pregunta", s: 88, req: ["confesiones", "coqueteo"], tags: ["cierre", "cumplido"] },
  { id: "09002", t: "Nivel futuro", x: "{p1}, ¿qué nivel de intensidad deseas próxima vez y por qué.", c: "rompehielo", f: "pregunta", s: 72, req: ["preguntas_personales"], tags: ["apertura"] },
  { id: "09003", t: "Disfraz ideal", x: "{p1}, en fiesta de disfraces, ¿qué papel te gusta y para quién.", c: "preguntas", f: "pregunta", s: 84, req: ["fantasias", "roles_juego"], tags: ["creatividad"] },
  { id: "09004", t: "Confesión o prenda", x: "{p1}, confiesa último pensamiento atrevido o quítate prenda.", c: "preguntas", f: "pregunta", s: 95, req: ["confesiones", "quitarse_prenda"], aud: ["quitarse_prenda"], audScope: "sesion", d: [60, 30, 90], tags: ["cierre"] },
  { id: "09005", t: "Mirada intensa", x: "{p1}, ¿qué dijiste mirando ojos sin hablar. Repite sin nombres.", c: "preguntas", f: "pregunta", s: 77, req: ["confesiones"], tags: ["voz"] },
  { id: "09006", t: "Medianoche ideal", x: "{p1}, describe en frase la noche más intensa posible esta vez.", c: "preguntas", f: "pregunta", s: 92, req: ["fantasias"], d: [30, 15, 60], tags: ["cumplido"] },
  { id: "09007", t: "Último sonrojo", x: "{p1}, ¿qué momento te hizo sonrojar más hoy.", c: "rompehielo", f: "pregunta", s: 70, req: ["confesiones"], d: [30, 15, 60] },
  { id: "09008", t: "Palabra seductora", x: "{p1} y {p2}, una palabra cada uno para describir cómo se desea.", c: "rompehielo", f: "reto", s: 83, req: ["adivinanzas"], pair: ["coqueteo"], tags: ["risas"] },
  { id: "09009", t: "Verdad o prenda", x: "{p1}, verdad: lo más intenso en frase, o quítate prenda.", c: "preguntas", f: "pregunta", s: 94, req: ["confesiones", "quitarse_prenda"], aud: ["quitarse_prenda"], audScope: "sesion", tags: ["cierre"] },
  { id: "09010", t: "Lo que atreves", x: "{p1}, con más valentía, ¿qué harías ahora sin miedo.", c: "preguntas", f: "pregunta", s: 88, req: ["fantasias", "confesiones"], tags: ["cumplido"] },
  { id: "09011", t: "Atracción física", x: "{p1}, describe qué te atrae de alguien sin nombres.", c: "preguntas", f: "pregunta", s: 76, req: ["preguntas_personales"], d: [30, 15, 60] },
  { id: "09012", t: "Lectura grupo", x: "{p1}, mira a todos 5s y di cómo les ves ahora.", c: "rompehielo", f: "reto", s: 85, i: "group", req: ["coqueteo", "miradas", "adivinanzas"], d: [30, 15, 60] },
  { id: "09013", t: "Minuto intensidad", x: "Cada uno pregunta intensa; responder o pasar.", c: "preguntas", f: "reto", s: 93, req: ["preguntas_personales", "confesiones"], d: [60, 45, 120] },
  { id: "09014", t: "Pensamiento oculto", x: "{p1}, ¿qué te prohibes cuando alguien te atrae afuera.", c: "preguntas", f: "pregunta", s: 80, req: ["confesiones"], tags: ["cumplido"] },
  { id: "09015", t: "Pensamiento final", x: "{p1}, ¿qué pensamiento atrevido te llevas de esta noche.", c: "preguntas", f: "pregunta", s: 96, req: ["confesiones"], tags: ["cierre"] },
  { id: "09016", t: "Pregunta intensa", x: "{p1}, haz pregunta intensa a quien elijas; responder o pasar.", c: "rompehielo", f: "reto", s: 71, i: "group", req: ["preguntas_personales", "confesiones"], tags: ["apertura", "voz"] },
  { id: "09017", t: "Tono que me altera", x: "{p1}, ¿qué tono te provoca reacción hoy. ¿Qué te imaginas diciendo.", c: "preguntas", f: "pregunta", s: 78, req: ["coqueteo", "roles_juego"], tags: ["voz", "risas"] },
  { id: "09018", t: "Tensión secreta", x: "Cada uno dice quiénes tienen más tensión eléctrica.", c: "rompehielo", f: "reto", s: 86, i: "group", sizes: [3], req: ["coqueteo", "confesiones"] },
  { id: "09019", t: "Canción intensa", x: "{p1}, ¿qué canción pondrías para noche intensa y por qué.", c: "rompehielo", f: "reto", s: 74, req: ["musica", "conversacion_ligera"], tags: ["voz"] },
  { id: "09020", t: "Palabra intensa", x: "{p1}, piensa palabra y da pistas; el resto adivina en 30s.", c: "rompehielo", f: "reto", s: 81, i: "group", req: ["adivinanzas", "coqueteo"], d: [30, 20, 60], tags: ["risas"] },
  { id: "09021", t: "Lo que guardaré", x: "{p1}, ¿qué recuerdo de esta noche guardarás con más cariño.", c: "rompehielo", f: "pregunta", s: 85, req: ["preguntas_personales"], tags: ["cierre", "cumplido"] },
  { id: "09022", t: "Gratitud", x: "¿Qué te agradeció más de esta noche. Voto mayoritario.", c: "rompehielo", f: "pregunta", s: 82, req: ["conversacion_ligera"], tags: ["cierre"] },
  { id: "09023", t: "Cierre suave", x: "¿Todo bien para terminar sesión o seguir jugando.", c: "rompehielo", f: "pregunta", s: 74, req: ["conversacion_ligera"], tags: ["cierre", "calma"] },
]);
