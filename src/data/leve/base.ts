import { defineCards } from "../define";

// Lote inicial Leve (60). Revisado: sin contacto salvo permiso explícito por pareja.
export const leveBase = defineCards("leve", "l", "base", [
  // ---------------------------------------------------------------- preguntas
  { id: "001", t: "Banda sonora", x: "{p1}, ¿qué canción pondrías como banda sonora de tu vida y por qué?", c: "musica", f: "pregunta", s: 3, req: ["musica", "conversacion_ligera"] },
  { id: "002", t: "Domingo perfecto", x: "{p1}, describe tu plan perfecto para un domingo sin obligaciones.", c: "rompehielo", f: "pregunta", s: 2, req: ["conversacion_ligera"], tags: ["apertura"] },
  { id: "003", t: "Superpoder cotidiano", x: "{p1}, si pudieras tener un superpoder solo para tareas cotidianas, ¿cuál elegirías?", c: "rompehielo", f: "pregunta", s: 5, req: ["conversacion_ligera"], tags: ["risas"] },
  { id: "004", t: "Comida de consuelo", x: "{p1}, ¿cuál es tu comida favorita para un mal día?", c: "preguntas", f: "pregunta", s: 4, req: ["conversacion_ligera"] },
  { id: "005", t: "Viaje mañana", x: "{p1}, ¿a qué lugar del mundo irías mañana mismo si alguien pagara el viaje?", c: "preguntas", f: "pregunta", s: 7, req: ["conversacion_ligera"] },
  { id: "006", t: "Primera impresión", x: "{p1}, ¿cuál fue tu primera impresión de {p2}? Sé amable y honesto.", c: "conexion", f: "pregunta", s: 8, i: "directed_pair", req: ["conversacion_ligera"] },
  { id: "007", t: "Talento escondido", x: "{p1}, ¿qué talento tienes que casi nadie conoce? Si se puede, haz una demostración breve.", c: "rompehielo", f: "pregunta", s: 12, req: ["conversacion_ligera"] },
  { id: "008", t: "Ridículo con orgullo", x: "{p1}, cuenta una anécdota en la que hiciste el ridículo y que hoy te hace reír.", c: "preguntas", f: "pregunta", s: 10, req: ["conversacion_ligera"], tags: ["risas"] },
  { id: "009", t: "Tu humor", x: "{p1}, ¿qué tipo de humor te hace reír sin remedio? Da un ejemplo.", c: "preguntas", f: "pregunta", s: 14, req: ["conversacion_ligera"], tags: ["risas"] },
  { id: "010", t: "El mejor cumplido", x: "{p1}, ¿cuál es el mejor cumplido que te han hecho y por qué lo recuerdas?", c: "confianza", f: "pregunta", s: 15, req: ["conversacion_ligera"], tags: ["cumplido"] },
  { id: "011", t: "Pequeños placeres", x: "{p1}, nombra tres pequeños placeres que te mejoran el día.", c: "conexion", f: "pregunta", s: 18, req: ["conversacion_ligera"], tags: ["calma"] },
  { id: "012", t: "Lo que admiras", x: "{p1}, dile a {p2} una cualidad que admiras de su forma de ser.", c: "conexion", f: "pregunta", s: 20, i: "directed_pair", req: ["conversacion_ligera"], tags: ["cumplido"] },
  { id: "013", t: "Cita sin dinero", x: "{p1}, describe una cita ideal que no cueste dinero.", c: "preguntas", f: "pregunta", s: 22, req: ["preguntas_personales"] },
  { id: "014", t: "Gobierno de un día", x: "{p1}, ¿qué regla absurda impondrías si gobernaras el mundo por un día?", c: "rompehielo", f: "pregunta", s: 6, req: ["conversacion_ligera"], tags: ["risas"] },
  { id: "015", t: "Tu mejor hora", x: "{p1}, ¿en qué momento del día sientes que eres tu mejor versión?", c: "confianza", f: "pregunta", s: 25, req: ["preguntas_personales"] },
  { id: "016", t: "Conversación interesante", x: "{p1}, ¿qué detalle hace que alguien te parezca interesante desde la primera conversación?", c: "preguntas", f: "pregunta", s: 27, req: ["preguntas_personales"] },
  { id: "017", t: "Mensaje al pasado", x: "{p1}, ¿qué le dirías a tu yo de hace cinco años en una sola frase?", c: "confianza", f: "pregunta", s: 28, req: ["preguntas_personales"], tags: ["cierre"] },
  { id: "018", t: "Elección rápida", x: "{p1}, elige rápido: ¿playa o montaña, café o chocolate, madrugar o trasnochar? Explica una.", c: "eleccion", f: "pregunta", s: 9, req: ["conversacion_ligera"] },
  { id: "019", t: "Recuerdo inventado", x: "{p1} y {p2}, cuenten juntos un recuerdo que compartan, o inventen uno que les gustaría tener.", c: "conexion", f: "pregunta", s: 21, req: ["conversacion_ligera"], tags: ["creatividad"] },
  { id: "020", t: "Cocina o baile", x: "{p1}, ¿qué preferirías: saber cocinar cualquier plato o bailar cualquier ritmo?", c: "eleccion", f: "pregunta", s: 16, req: ["conversacion_ligera"] },

  // ---------------------------------------------------------------- retos
  { id: "021", t: "Imitación famosa", x: "{p1}, imita durante 20 segundos a un personaje famoso sin decir su nombre. El grupo adivina.", c: "retos", f: "reto", s: 2, req: ["adivinanzas"], d: [30, 20, 60], tags: ["risas"] },
  { id: "022", t: "Tararea y adivinen", x: "{p1}, tararea una canción conocida y deja que el grupo adivine cuál es.", c: "musica", f: "reto", s: 4, req: ["musica", "adivinanzas"], d: [30, 20, 60] },
  { id: "023", t: "Baile relámpago", x: "{p1}, baila durante 30 segundos la primera canción que se te venga a la mente.", c: "baile", f: "reto", s: 6, req: ["baile_individual", "musica"], d: [30, 30, 60], tags: ["movimiento"] },
  { id: "024", t: "Estatua dramática", x: "{p1}, quédate como estatua en la pose más dramática posible hasta que termine el reloj.", c: "retos", f: "reto", s: 9, req: ["conversacion_ligera"], d: [30, 20, 60], tags: ["risas"] },
  { id: "025", t: "Presentación épica", x: "{p1}, preséntate como si fueras protagonista de una película de acción.", c: "desafios", f: "reto", s: 11, req: ["roles_juego"], tags: ["creatividad"] },
  { id: "026", t: "Dos verdades", x: "{p1}, di tres datos sobre ti: dos verdaderos y uno falso. El grupo adivina cuál es falso.", c: "rompehielo", f: "reto", s: 13, req: ["adivinanzas", "conversacion_ligera"] },
  { id: "027", t: "Duelo de miradas", x: "{p1} y {p2}, sostengan la mirada sin reír. Quien se ría primero cuenta un chiste.", c: "desafios", f: "reto", s: 15, pair: ["miradas"], d: [30, 15, 60], tags: ["risas"] },
  { id: "028", t: "Cumplido gastronómico", x: "{p1}, hazle a {p2} un cumplido usando una metáfora de comida.", c: "retos", f: "reto", s: 17, i: "directed_pair", req: ["conversacion_ligera"], tags: ["cumplido", "risas"] },
  { id: "029", t: "Coreografía de manos", x: "{p1}, inventa una coreografía solo con las manos y enséñasela al grupo.", c: "baile", f: "reto", s: 19, req: ["baile_individual"], d: [60, 30, 90], tags: ["creatividad"] },
  { id: "030", t: "Saludo secreto", x: "{p1} y {p2}, inventen un saludo secreto con choques de manos y muéstrenlo.", c: "pareja", f: "reto", s: 20, pair: ["contacto_manos"], tags: ["risas"] },
  { id: "031", t: "Coro con emoción", x: "{p1}, canta el coro de una canción que te sepas completa, con toda la emoción.", c: "musica", f: "reto", s: 23, req: ["musica"], d: [45, 20, 90], tags: ["voz"] },
  { id: "032", t: "Narración deportiva", x: "{p1}, narra como comentarista deportivo todo lo que hace {p2} durante 30 segundos.", c: "retos", f: "reto", s: 25, i: "directed_pair", req: ["conversacion_ligera"], d: [30, 20, 60], tags: ["risas", "voz"] },
  { id: "033", t: "Mímica de película", x: "{p1}, representa con mímica tu película favorita. El grupo tiene un minuto para adivinar.", c: "desafios", f: "reto", s: 26, req: ["adivinanzas"], d: [60, 30, 90] },
  { id: "034", t: "Abrazo de equipo", x: "Abrazo de equipo: todos juntos, un abrazo breve para celebrar que están aquí.", c: "conexion", f: "reto", s: 28, pair: ["abrazo"], tags: ["cierre"] },
  { id: "035", t: "Espejo", x: "{p1} baila y {p2} imita cada movimiento como un espejo, sin tocarse.", c: "baile", f: "reto", s: 30, req: ["baile_individual"], d: [60, 30, 90], tags: ["movimiento", "risas"] },
  { id: "036", t: "Palabra prohibida", x: "{p1}, habla durante 30 segundos sobre tu fin de semana sin decir la palabra «yo».", c: "desafios", f: "reto", s: 12, req: ["conversacion_ligera"], d: [30, 20, 60], tags: ["risas"] },
  { id: "037", t: "Ritmo contagioso", x: "{p1} marca un ritmo con palmas y pies; el resto intenta seguirlo sin perderse.", c: "musica", f: "reto", s: 18, i: "group", req: ["musica"], d: [30, 20, 60], tags: ["movimiento"] },
  { id: "038", t: "Brindis sin copa", x: "{p1}, propón un brindis con agua o con la mano en alto por algo bueno que pasó hoy.", c: "conexion", f: "reto", s: 7, req: ["conversacion_ligera"], tags: ["apertura"] },

  // ---------------------------------------------------------------- más probable
  { id: "039", t: "Película y sueño", x: "¿Quién es más probable que se duerma viendo una película?", c: "rompehielo", f: "votacion", s: 3, req: ["conversacion_ligera"] },
  { id: "040", t: "Concierto en la ducha", x: "¿Quién es más probable que cante a todo pulmón en la ducha?", c: "musica", f: "votacion", s: 6, req: ["conversacion_ligera"] },
  { id: "041", t: "Viaje improvisado", x: "¿Quién es más probable que organice un viaje con un día de anticipación?", c: "eleccion", f: "votacion", s: 10, req: ["conversacion_ligera"] },
  { id: "042", t: "Amistad en la fila", x: "¿Quién es más probable que haga amistad con un desconocido en una fila?", c: "rompehielo", f: "votacion", s: 14, req: ["conversacion_ligera"] },
  { id: "043", t: "Lágrima animada", x: "¿Quién es más probable que llore con una película animada?", c: "conexion", f: "votacion", s: 19, req: ["conversacion_ligera"] },
  { id: "044", t: "Risa inoportuna", x: "¿Quién es más probable que se ría en el momento menos indicado?", c: "rompehielo", f: "votacion", s: 24, req: ["conversacion_ligera"], tags: ["risas"] },
  { id: "045", t: "Listas de música", x: "¿Quién es más probable que tenga una lista de reproducción para cada estado de ánimo?", c: "musica", f: "votacion", s: 27, req: ["conversacion_ligera"] },

  // ---------------------------------------------------------------- quién me conoce
  { id: "046", t: "Postre favorito", x: "¿Cuál es el postre favorito de {p1}?", c: "preguntas", f: "conocimiento", s: 2, req: ["adivinanzas"] },
  { id: "047", t: "Día libre", x: "¿Qué haría {p1} con un día libre inesperado?", c: "preguntas", f: "conocimiento", s: 5, req: ["adivinanzas"] },
  { id: "048", t: "Amanecer o atardecer", x: "¿Qué prefiere {p1}: amanecer o atardecer?", c: "eleccion", f: "conocimiento", s: 9, req: ["adivinanzas"], opts: ["Amanecer", "Atardecer"] },
  { id: "049", t: "Canción de fiesta", x: "¿Qué canción pondría {p1} para animar una reunión?", c: "musica", f: "conocimiento", s: 13, req: ["adivinanzas", "musica"] },
  { id: "050", t: "Clima ideal", x: "¿Qué clima prefiere {p1}?", c: "eleccion", f: "conocimiento", s: 18, req: ["adivinanzas"], opts: ["Calor de playa", "Frío de montaña", "Lluvia en casa", "Templado"] },
  { id: "051", t: "Valor en la amistad", x: "¿Qué cualidad valora más {p1} en una amistad?", c: "confianza", f: "conocimiento", s: 25, req: ["adivinanzas", "preguntas_personales"] },

  // ---------------------------------------------------------------- secretos
  { id: "052", t: "Gusto culposo", x: "Escribe un gusto culposo que casi nunca admites.", c: "secretos", f: "secreto", s: 4, req: ["escritura_privada", "revelacion_grupo"], tags: ["risas"] },
  { id: "053", t: "Miedo antiguo", x: "Escribe algo que te asustaba en tu infancia y hoy te da risa.", c: "secretos", f: "secreto", s: 11, req: ["escritura_privada", "revelacion_grupo"] },
  { id: "054", t: "Por aprender", x: "Escribe una cosa que siempre has querido aprender.", c: "secretos", f: "secreto", s: 17, req: ["escritura_privada", "revelacion_grupo"] },
  { id: "055", t: "Decisión espontánea", x: "Escribe la mejor decisión espontánea que has tomado.", c: "secretos", f: "secreto", s: 26, req: ["escritura_privada", "revelacion_grupo"] },

  // ---------------------------------------------------------------- sorpresas
  { id: "056", t: "Ronda relámpago", x: "Ronda relámpago: cada persona dice en una palabra cómo se siente ahora mismo.", c: "sorpresa", f: "sorpresa", s: 5, req: ["conversacion_ligera"], eff: "todos_participan" },
  { id: "057", t: "Ustedes eligen", x: "El grupo decide quién protagoniza la próxima ronda. La elección vale solo para un turno.", c: "sorpresa", f: "sorpresa", s: 8, req: ["conversacion_ligera"], eff: "elegir_protagonista" },
  { id: "058", t: "Cambio de aires", x: "Cambio de aires: elijan otro de los juegos activos para seguir.", c: "sorpresa", f: "sorpresa", s: 15, req: ["conversacion_ligera"], eff: "cambiar_juego" },
  { id: "059", t: "¿Subimos?", x: "Propuesta: ¿quieren subir la intensidad? Cada persona responde en privado y nadie verá las respuestas.", c: "sorpresa", f: "sorpresa", s: 22, req: ["conversacion_ligera"], eff: "proponer_subir" },
  { id: "060", t: "Doble rápida", x: "Doble ronda rápida: vienen dos mini actividades seguidas. Cada una se puede pasar.", c: "sorpresa", f: "sorpresa", s: 10, req: ["conversacion_ligera"], eff: "doble_mini" },
  { id: "061", t: "Tú eliges pareja", x: "{p1} elige con quién hará la próxima actividad en pareja, entre las opciones compatibles.", c: "sorpresa", f: "sorpresa", s: 20, req: ["conversacion_ligera"], eff: "elegir_companero", sizes: [3] },
  { id: "062", t: "¿Repetimos?", x: "¿Repetimos? Pueden volver a jugar una actividad anterior si todos aceptan de nuevo.", c: "sorpresa", f: "sorpresa", s: 25, req: ["conversacion_ligera"], eff: "repetir_voluntaria" },
]);
