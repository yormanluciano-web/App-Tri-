import { defineCards } from "../define";

// Picante · lote extra 05: elecciones finales, confesiones y secretos, más probable y sorpresas.
export const picanteExtra05 = defineCards("picante", "p", "base", [
  // ---------------------------------------------------------------- elecciones
  { id: "293", t: "Dar o recibir hombros", x: "{p1}, elige: darle a {p2} un masaje breve de hombros o recibirlo. {p2} puede cambiar la elección.", c: "eleccion", f: "reto", s: 55, i: "directed_pair", pair: ["masaje_hombros"], d: [30, 20, 60], tags: ["calma"] },
  { id: "294", t: "Lo más sugerente", x: "{p1}, ¿qué te parece más sugerente: una voz baja, una mirada lenta o una sonrisa de medio lado?", c: "eleccion", f: "pregunta", s: 57, req: ["preguntas_personales", "coqueteo"] },
  { id: "295", t: "Mejilla o susurro", x: "{p1}, elige entre un beso en la mejilla para {p2}, si {p2} lo autoriza, o un cumplido susurrado.", c: "eleccion", f: "reto", s: 59, i: "directed_pair", pair: ["beso", "coqueteo"], conf: true },
  { id: "296", t: "Ciudad o baile", x: "{p1}, ¿qué prefieres imaginar: una cita secreta en una ciudad desconocida o una noche entera de baile? Cuéntala sin detalles explícitos.", c: "eleccion", f: "pregunta", s: 61, req: ["fantasias", "preguntas_personales"] },
  { id: "297", t: "Repetir con alguien", x: "{p1}, elige qué parte del juego repetirías con {p2} antes de terminar y propónsela.", c: "eleccion", f: "reto", s: 63, i: "directed_pair", req: ["preguntas_personales"], pair: ["coqueteo"], tags: ["cierre"] },
  { id: "298", t: "Carta favorita", x: "Cierre: cada persona elige la carta que más disfrutó hoy y la describe sin decir con quién la jugó.", c: "eleccion", f: "pregunta", s: 65, req: ["conversacion_ligera"], tags: ["cierre", "memoria"] },

  // ---------------------------------------------------------------- secretos (anónimos)
  { id: "299", t: "Plan romántico", x: "Escribe el plan más romántico que has hecho o que te gustaría hacer algún día.", c: "secretos", f: "secreto", s: 31, req: ["escritura_privada", "revelacion_grupo", "preguntas_personales"] },
  { id: "300", t: "Antes de dormir", x: "Escribe una frase que te gustaría escuchar justo antes de dormir.", c: "secretos", f: "secreto", s: 32, req: ["escritura_privada", "revelacion_grupo", "coqueteo"] },
  { id: "301", t: "Apodo curioso", x: "Escribe el apodo cariñoso más curioso que te han puesto.", c: "secretos", f: "secreto", s: 33, req: ["escritura_privada", "revelacion_grupo", "preguntas_personales"], tags: ["risas"] },
  { id: "302", t: "Sonrisa inevitable", x: "Escribe un detalle que te hace sonreír aunque intentes evitarlo.", c: "secretos", f: "secreto", s: 34, req: ["escritura_privada", "revelacion_grupo", "preguntas_personales"] },
  { id: "303", t: "Película coqueta", x: "Escribe una película que te parezca más coqueta de lo que la gente cree.", c: "secretos", f: "secreto", s: 35, req: ["escritura_privada", "revelacion_grupo", "conversacion_ligera"], tags: ["risas"] },
  { id: "304", t: "Ataque de risa", x: "Escribe el lugar más curioso donde te ha dado un ataque de risa en una cita.", c: "secretos", f: "secreto", s: 37, req: ["escritura_privada", "revelacion_grupo", "preguntas_personales"], tags: ["risas"] },
  { id: "305", t: "Lo que falta", x: "Escribe algo que te gustaría que pasara esta noche y que todavía no ha salido en el juego, sin detalles explícitos.", c: "secretos", f: "secreto", s: 38, req: ["escritura_privada", "revelacion_grupo", "coqueteo"] },
  { id: "306", t: "Mi debilidad", x: "Escribe tu mayor debilidad cuando alguien coquetea contigo.", c: "secretos", f: "secreto", s: 40, req: ["escritura_privada", "revelacion_grupo", "coqueteo", "preguntas_personales"] },
  { id: "307", t: "Me gustas sin palabras", x: "Escribe una señal que usarías para decir «me gustas» sin decir nada.", c: "secretos", f: "secreto", s: 42, req: ["escritura_privada", "revelacion_grupo", "coqueteo"] },
  { id: "308", t: "Mensaje de mañana", x: "Escribe un mensaje coqueto que te encantaría recibir mañana por la mañana.", c: "secretos", f: "secreto", s: 44, req: ["escritura_privada", "revelacion_grupo", "coqueteo"] },
  { id: "309", t: "Atractivo poco común", x: "Escribe algo que te parezca atractivo y que casi nadie menciona.", c: "secretos", f: "secreto", s: 46, req: ["escritura_privada", "revelacion_grupo", "preguntas_personales"] },
  { id: "310", t: "Recuerdo de cita", x: "Escribe, sin nombres, el recuerdo de una cita que todavía te saca una sonrisa.", c: "secretos", f: "secreto", s: 47, req: ["escritura_privada", "revelacion_grupo", "preguntas_personales"], tags: ["memoria"] },
  { id: "311", t: "Antes de terminar", x: "Escribe qué te gustaría que alguien de esta sesión te dijera antes de terminar la noche, sin decir quién.", c: "secretos", f: "secreto", s: 49, req: ["escritura_privada", "revelacion_grupo", "coqueteo"] },
  { id: "312", t: "Lugar, hora y canción", x: "Escribe una fantasía romántica sencilla, sin detalles explícitos: un lugar, una hora y una canción.", c: "secretos", f: "secreto", s: 51, req: ["escritura_privada", "revelacion_grupo", "fantasias", "musica"] },
  { id: "313", t: "Nunca propuesto", x: "Escribe algo que te dé curiosidad hacer en una cita y que nunca te has atrevido a proponer.", c: "secretos", f: "secreto", s: 53, req: ["escritura_privada", "revelacion_grupo", "confesiones"] },
  { id: "314", t: "Lo que no dije", x: "Escribe, en versión elegante, la frase más atrevida que has pensado esta noche y no dijiste.", c: "secretos", f: "secreto", s: 55, req: ["escritura_privada", "revelacion_grupo", "confesiones", "coqueteo"] },
  { id: "315", t: "Irresistible", x: "Escribe qué te hace sentir irresistible.", c: "secretos", f: "secreto", s: 57, req: ["escritura_privada", "revelacion_grupo", "preguntas_personales"] },
  { id: "316", t: "Deseo para el grupo", x: "Escribe un deseo coqueto y amable para el grupo, de esos que se dicen con una sonrisa.", c: "secretos", f: "secreto", s: 59, req: ["escritura_privada", "revelacion_grupo", "coqueteo"] },
  { id: "317", t: "La primera vez que alguien te gustó", x: "Escribe un secreto inofensivo sobre la primera vez que alguien te gustó mucho.", c: "secretos", f: "secreto", s: 62, req: ["escritura_privada", "revelacion_grupo", "confesiones"] },
  { id: "318", t: "Volver a vivirlo", x: "Escribe lo que más te gustó de esta noche y cómo te gustaría repetirlo.", c: "secretos", f: "secreto", s: 64, req: ["escritura_privada", "revelacion_grupo", "preguntas_personales"], tags: ["cierre"] },

  // ---------------------------------------------------------------- confesiones en voz alta
  { id: "319", t: "Me la sé completa", x: "{p1}, confiesa una canción romántica que te sabes completa aunque te dé pena admitirlo.", c: "secretos", f: "pregunta", s: 33, req: ["confesiones", "musica"], tags: ["risas"] },
  { id: "320", t: "Excusa creativa", x: "{p1}, confiesa la excusa más creativa que has usado para hablar con alguien que te gustaba.", c: "secretos", f: "pregunta", s: 36, req: ["confesiones"], tags: ["risas"] },
  { id: "321", t: "Cita de ficción", x: "{p1}, confiesa a qué personaje de ficción le habrías pedido una cita sin pensarlo.", c: "secretos", f: "pregunta", s: 39, req: ["confesiones"], tags: ["risas"] },
  { id: "322", t: "Mensaje enviado", x: "{p1}, confiesa, sin nombres, el mensaje más coqueto que sí te atreviste a enviar.", c: "secretos", f: "pregunta", s: 43, req: ["confesiones", "coqueteo"] },
  { id: "323", t: "Lo que pensé de ti", x: "{p1}, confiesa a {p2} algo que pensaste de esa persona esta noche y no le dijiste.", c: "secretos", f: "pregunta", s: 46, i: "directed_pair", req: ["confesiones"], pair: ["coqueteo"] },
  { id: "324", t: "Primera cita atrevida", x: "{p1}, confiesa lo más atrevido que has dicho en una primera cita.", c: "secretos", f: "pregunta", s: 50, req: ["confesiones"] },
  { id: "325", t: "Un sueño romántico", x: "{p1}, confiesa un sueño romántico que te dejó pensando todo el día, sin detalles explícitos.", c: "secretos", f: "pregunta", s: 54, req: ["confesiones", "fantasias"] },
  { id: "326", t: "Cómo conquistarme", x: "{p1}, confiesa algo que te encanta que hagan para conquistarte y que casi nadie sabe.", c: "secretos", f: "pregunta", s: 58, req: ["confesiones", "coqueteo"] },
  { id: "327", t: "Sonrojo", x: "Ronda de confesión: cada persona dice en qué momento del juego se sonrojó, aunque no se notara.", c: "secretos", f: "pregunta", s: 61, req: ["confesiones"], tags: ["risas"] },
  { id: "328", t: "La próxima vez", x: "{p1}, confiesa a {p2} qué te gustaría que pasara la próxima vez que se vean.", c: "secretos", f: "pregunta", s: 65, i: "directed_pair", req: ["confesiones"], pair: ["coqueteo"], tags: ["cierre"] },

  // ---------------------------------------------------------------- más probable
  { id: "329", t: "Coreografía", x: "¿Quién es más probable que se aprenda una coreografía completa solo para impresionar a alguien?", c: "baile", f: "votacion", s: 32, req: ["conversacion_ligera"], tags: ["risas"] },
  { id: "330", t: "Dedicatoria en la radio", x: "¿Quién es más probable que llame a la radio para dedicar una canción?", c: "musica", f: "votacion", s: 35, req: ["conversacion_ligera"] },
  { id: "331", t: "Sonrojo inesperado", x: "¿Quién es más probable que se sonroje con un cumplido inesperado?", c: "preguntas", f: "votacion", s: 39, req: ["coqueteo"] },
  { id: "332", t: "Medianoche", x: "¿Quién es más probable que mande un mensaje coqueto a medianoche?", c: "pareja", f: "votacion", s: 43, req: ["coqueteo"] },
  { id: "333", t: "Solo con la mirada", x: "¿Quién es más probable que conquiste a alguien solo con la mirada?", c: "pareja", f: "votacion", s: 47, req: ["coqueteo"] },
  { id: "334", t: "Serenata", x: "¿Quién es más probable que cante una serenata bajo una ventana?", c: "musica", f: "votacion", s: 52, req: ["conversacion_ligera"], tags: ["risas"] },
  { id: "335", t: "Escapada improvisada", x: "¿Quién es más probable que proponga una escapada improvisada de fin de semana?", c: "eleccion", f: "votacion", s: 57, req: ["conversacion_ligera"] },
  { id: "336", t: "Cada detalle", x: "¿Quién es más probable que recuerde cada detalle de esta noche dentro de un año?", c: "conexion", f: "votacion", s: 63, req: ["conversacion_ligera"], tags: ["cierre", "memoria"] },

  // ---------------------------------------------------------------- sorpresas
  { id: "337", t: "Cumplido de la noche", x: "Todos a la vez: cada persona repite el cumplido más bonito que ha escuchado esta noche.", c: "sorpresa", f: "sorpresa", s: 31, req: ["conversacion_ligera"], eff: "todos_participan", tags: ["cumplido"] },
  { id: "338", t: "Otra vez, si quieren", x: "Repetición voluntaria: si a alguien le gustó la última actividad, puede proponer repetirla. Solo va si todas las personas implicadas aceptan.", c: "sorpresa", f: "sorpresa", s: 34, req: ["conversacion_ligera"], eff: "repetir_voluntaria" },
  { id: "339", t: "Cambio de juego", x: "Cambio de juego: la próxima ronda se juega con otro juego compatible. Pueden volver al anterior cuando quieran.", c: "sorpresa", f: "sorpresa", s: 37, req: ["conversacion_ligera"], eff: "cambiar_juego" },
  { id: "340", t: "Locución oficial", x: "{p1} presentará cada carta con voz de locutor durante las próximas tres rondas.", c: "sorpresa", f: "sorpresa", s: 40, req: ["roles_juego"], eff: "roles_juego", tags: ["voz", "risas"] },
  { id: "341", t: "Compañía con cumplido", x: "{p1} elige con quién hará la próxima actividad en pareja, entre las opciones compatibles, y le dedica un cumplido.", c: "sorpresa", f: "sorpresa", s: 42, sizes: [3], req: ["coqueteo"], eff: "elegir_companero", tags: ["cumplido"] },
  { id: "342", t: "Pregunta y reto", x: "Doble mini: una pregunta rápida y un reto corto, uno tras otro. Cualquiera de los dos se puede pasar.", c: "sorpresa", f: "sorpresa", s: 45, req: ["conversacion_ligera"], eff: "doble_mini" },
  { id: "343", t: "Presentación de protagonista", x: "{p1} decide quién protagoniza la próxima ronda y le dedica una frase de presentación.", c: "sorpresa", f: "sorpresa", s: 47, req: ["conversacion_ligera"], eff: "elegir_protagonista" },
  { id: "344", t: "Pausa de ritmo", x: "Pausa de comprobación: cada persona indica en privado si quiere mantener el ritmo o subir la intensidad. Sin unanimidad, todo sigue igual.", c: "sorpresa", f: "sorpresa", s: 50, req: ["conversacion_ligera"], eff: "proponer_subir" },
  { id: "345", t: "Mirada colectiva", x: "Todos participan: cada persona hace su mirada más coqueta a la vez durante cinco segundos y luego se ríen juntos.", c: "sorpresa", f: "sorpresa", s: 53, req: ["coqueteo", "miradas"], eff: "todos_participan", tags: ["risas"] },
  { id: "346", t: "Narración dramática", x: "{p1} narrará con voz dramática todo lo que pase en las próximas dos rondas.", c: "sorpresa", f: "sorpresa", s: 55, req: ["roles_juego"], eff: "roles_juego", tags: ["voz", "risas"] },
  { id: "347", t: "Giro de juego", x: "Giro: pasen a un juego distinto en la siguiente ronda; quien haya tenido menos turnos propone cuál.", c: "sorpresa", f: "sorpresa", s: 58, req: ["conversacion_ligera"], eff: "cambiar_juego" },
  { id: "348", t: "Bis", x: "Bis: la carta que más risas sacó puede repetirse con otra combinación, solo si todas las personas implicadas aceptan.", c: "sorpresa", f: "sorpresa", s: 60, req: ["conversacion_ligera"], eff: "repetir_voluntaria", tags: ["risas"] },
  { id: "349", t: "Doble mini atrevida", x: "Doble mini atrevida: una mirada sostenida de diez segundos y una pregunta personal rápida. Cada parte se puede pasar.", c: "sorpresa", f: "sorpresa", s: 62, req: ["miradas", "preguntas_personales"], eff: "doble_mini" },
  { id: "350", t: "Cómo llegamos", x: "Todos participan: cada persona dice en una frase cómo se siente ahora comparado con el inicio de la noche.", c: "sorpresa", f: "sorpresa", s: 64, req: ["conversacion_ligera"], eff: "todos_participan", tags: ["cierre"] },
]);
