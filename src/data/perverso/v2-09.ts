import { defineCards } from "../define";

// Perverso v2 · lote 09: cierre, preguntas finales, despedida sensual.
// Intensidad máxima, recapitulación, despedida.
export const perversoV2_09 = defineCards("perverso", "v2", "cierre", [
  { id: "09001", t: "La frase de la noche", x: "{p1}, de todo lo que se dijo esta noche, ¿qué frase te impactó más?", c: "preguntas", f: "pregunta", s: 88, req: ["confesiones", "coqueteo"], tags: ["cierre", "cumplido"] },
  { id: "09002", t: "La próxima vez", x: "{p1}, ¿qué nivel de intensidad te gustaría para la próxima vez? ¿Por qué?", c: "rompehielo", f: "pregunta", s: 72, req: ["preguntas_personales"], tags: ["apertura"] },
  { id: "09003", t: "Fiesta de disfraces", x: "{p1}, si esto fuera una fiesta de disfraces, ¿de qué te vestirías y para quién?", c: "preguntas", f: "pregunta", s: 84, req: ["fantasias", "roles_juego"], tags: ["creatividad"] },
  { id: "09004", t: "Confiesa o prenda", x: "{p1}, confiesa el último pensamiento atrevido que tuviste o quítate una prenda.", c: "preguntas", f: "pregunta", s: 95, req: ["confesiones", "quitarse_prenda"], aud: ["quitarse_prenda"], audScope: "sesion", d: [60, 30, 90], tags: ["cierre"] },
  { id: "09005", t: "Lo que dijo tu mirada", x: "{p1}, ¿qué le dijiste a alguien esta noche solo con la mirada? Repítelo en palabras, sin nombres.", c: "preguntas", f: "pregunta", s: 77, req: ["confesiones"], tags: ["voz"] },
  { id: "09006", t: "La noche más intensa", x: "{p1}, describe en una sola frase cómo sería la noche más intensa que te imaginas.", c: "preguntas", f: "pregunta", s: 92, req: ["fantasias"], d: [30, 15, 60], tags: ["cumplido"] },
  { id: "09007", t: "Sonrojo", x: "{p1}, ¿qué momento de hoy te hizo sonrojar más?", c: "rompehielo", f: "pregunta", s: 70, req: ["confesiones"], d: [30, 15, 60] },
  { id: "09008", t: "Una palabra de deseo", x: "{p1} y {p2}, digan a la vez una palabra que describa cómo desean a la otra persona.", c: "rompehielo", f: "reto", s: 83, req: ["adivinanzas"], pair: ["coqueteo"], tags: ["risas"] },
  { id: "09009", t: "Verdad o prenda", x: "{p1}, verdad o prenda: resume en una frase lo más intenso que has vivido o quítate una prenda.", c: "preguntas", f: "pregunta", s: 94, req: ["confesiones", "quitarse_prenda"], aud: ["quitarse_prenda"], audScope: "sesion", tags: ["cierre"] },
  { id: "09010", t: "Sin miedo", x: "{p1}, si tuvieras el doble de valor, ¿qué harías ahora mismo?", c: "preguntas", f: "pregunta", s: 88, req: ["fantasias", "confesiones"], tags: ["cumplido"] },
  { id: "09011", t: "Lo que me atrae", x: "{p1}, describe qué es lo que más te atrae de una persona, sin dar nombres.", c: "preguntas", f: "pregunta", s: 76, req: ["preguntas_personales"], d: [30, 15, 60] },
  { id: "09012", t: "Lectura del grupo", x: "{p1}, mira a cada persona durante cinco segundos y dile cómo la ves en este momento.", c: "rompehielo", f: "reto", s: 85, i: "group", req: ["coqueteo", "miradas", "adivinanzas"], d: [30, 15, 60] },
  { id: "09013", t: "Ronda de preguntas", x: "Por turnos, cada persona hace una pregunta intensa a quien quiera. Se puede responder o pasar.", c: "preguntas", f: "reto", s: 93, req: ["preguntas_personales", "confesiones"], d: [60, 45, 120] },
  { id: "09014", t: "Lo que te prohíbes", x: "{p1}, cuando alguien te atrae fuera de casa, ¿qué te prohíbes pensar o hacer?", c: "preguntas", f: "pregunta", s: 80, req: ["confesiones"], tags: ["cumplido"] },
  { id: "09015", t: "Lo que te llevas", x: "{p1}, ¿qué pensamiento atrevido te llevas de esta noche?", c: "preguntas", f: "pregunta", s: 96, req: ["confesiones"], tags: ["cierre"] },
  { id: "09016", t: "Pregunta directa", x: "{p1}, hazle una pregunta intensa a quien elijas. Esa persona puede responder o pasar.", c: "rompehielo", f: "reto", s: 71, i: "group", req: ["preguntas_personales", "confesiones"], tags: ["apertura", "voz"] },
  { id: "09017", t: "El tono que provoca", x: "{p1}, ¿qué tono de voz te provoca más? Imagina qué te diría alguien con ese tono y dilo tú.", c: "preguntas", f: "pregunta", s: 78, req: ["coqueteo", "roles_juego"], tags: ["voz", "risas"] },
  { id: "09018", t: "Tensión eléctrica", x: "Cada quien dice, sin pensarlo mucho, entre qué dos personas hay más tensión esta noche.", c: "rompehielo", f: "reto", s: 86, i: "group", sizes: [3], req: ["coqueteo", "confesiones"] },
  { id: "09019", t: "Canción intensa", x: "{p1}, ¿qué canción pondrías para una noche intensa? Cuenta por qué.", c: "rompehielo", f: "reto", s: 74, req: ["musica", "conversacion_ligera"], tags: ["voz"] },
  { id: "09020", t: "Palabra escondida", x: "{p1}, piensa en una palabra atrevida y da pistas sin decirla. Los demás tienen treinta segundos para adivinarla.", c: "rompehielo", f: "reto", s: 81, i: "group", req: ["adivinanzas", "coqueteo"], d: [30, 20, 60], tags: ["risas"] },
  { id: "09021", t: "Recuerdo con cariño", x: "{p1}, ¿qué recuerdo de esta noche guardarás con más cariño?", c: "rompehielo", f: "pregunta", s: 85, req: ["preguntas_personales"], tags: ["cierre", "cumplido"] },
  { id: "09022", t: "Agradecimiento", x: "¿Qué es lo que más agradecen de esta noche? Cada quien lo dice y luego votan lo mejor.", c: "rompehielo", f: "pregunta", s: 82, req: ["conversacion_ligera"], tags: ["cierre"] },
  { id: "09023", t: "Cierre suave", x: "¿Todo bien para terminar la sesión o les apetece seguir jugando?", c: "rompehielo", f: "pregunta", s: 74, req: ["conversacion_ligera"], tags: ["cierre", "calma"] },
]);
