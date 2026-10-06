import { defineCards } from "../define";

// Lote inicial Perverso (60+). Intensidad por exposición voluntaria, suspense y roles;
// nunca descripciones sexuales explícitas ni contacto obligatorio.
export const perversoBase = defineCards("perverso", "v", "base", [
  // ---------------------------------------------------------------- preguntas
  { id: "001", t: "Desde el principio", x: "{p1}, confiesa algo que te atrajo de alguien de esta sesión desde el principio.", c: "confianza", f: "pregunta", s: 66, req: ["confesiones", "coqueteo"] },
  { id: "002", t: "Escenario irresistible", x: "{p1}, describe sin detalles gráficos un escenario de cita que te parezca irresistible.", c: "preguntas", f: "pregunta", s: 67, req: ["fantasias"] },
  { id: "003", t: "Regla rota", x: "{p1}, ¿qué regla de las citas has roto y volverías a romper?", c: "preguntas", f: "pregunta", s: 69, req: ["confesiones"] },
  { id: "004", t: "Lo que nunca pediste", x: "{p1}, ¿qué te gustaría que te propusieran más a menudo en una relación? Sin decir nombres.", c: "confianza", f: "pregunta", s: 70, req: ["preguntas_personales", "confesiones"] },
  { id: "005", t: "Deseo en voz alta", x: "{p1}, comparte un deseo romántico que nunca has dicho en voz alta. Puedes mantenerlo general.", c: "secretos", f: "pregunta", s: 72, req: ["confesiones", "fantasias"] },
  { id: "006", t: "Final perfecto", x: "{p1}, imagina el final perfecto de esta noche y descríbelo en una frase elegante.", c: "preguntas", f: "pregunta", s: 74, req: ["fantasias", "coqueteo"], tags: ["cierre"] },
  { id: "007", t: "Lo atractivo de {p2}", x: "{p1}, ¿qué cosa hace {p2} que te parece especialmente atractiva?", c: "pareja", f: "pregunta", s: 76, i: "directed_pair", req: ["preguntas_personales"], pair: ["coqueteo"] },
  { id: "008", t: "Sin palabras", x: "{p1}, ¿cuándo fue la última vez que alguien te dejó sin palabras con una mirada?", c: "preguntas", f: "pregunta", s: 78, req: ["preguntas_personales"] },
  { id: "009", t: "Celos manejados", x: "{p1}, confiesa un momento en que sentiste celos y cómo lo manejaste, sin nombres.", c: "confianza", f: "pregunta", s: 79, req: ["confesiones"] },
  { id: "010", t: "Alter ego", x: "{p1}, si tuvieras un alter ego seductor, ¿cómo se llamaría y cuál sería su frase?", c: "preguntas", f: "pregunta", s: 81, req: ["roles_juego", "fantasias"], tags: ["creatividad", "risas"] },
  { id: "011", t: "Límite que da confianza", x: "{p1}, comparte un límite que te hace sentir en confianza cuando lo respetan.", c: "confianza", f: "pregunta", s: 83, req: ["preguntas_personales"], tags: ["calma"] },
  { id: "012", t: "Al entrar a la fiesta", x: "{p1}, ¿qué crees que provocas en los demás cuando entras a una fiesta?", c: "preguntas", f: "pregunta", s: 85, req: ["preguntas_personales"] },
  { id: "013", t: "Próxima cita", x: "{p1}, si pudieras proponer algo atrevido y consensuado para una próxima cita, ¿qué sería? Sin detalles explícitos.", c: "pareja", f: "pregunta", s: 87, req: ["fantasias", "coqueteo"] },
  { id: "014", t: "Al conocerles", x: "{p1}, confiesa qué te gustó de cada persona de esta sesión en el momento en que la conociste.", c: "conexion", f: "pregunta", s: 89, i: "group", req: ["confesiones"] },
  { id: "015", t: "Modo seductor", x: "{p1}, ¿qué canción te pone en modo seductor y por qué?", c: "musica", f: "pregunta", s: 91, req: ["musica", "coqueteo"] },
  { id: "016", t: "De madrugada", x: "{p1}, ¿cuál ha sido la conversación más intensa y bonita que has tenido de madrugada?", c: "conexion", f: "pregunta", s: 93, req: ["preguntas_personales", "confesiones"] },
  { id: "017", t: "Iniciativa", x: "{p1}, ¿prefieres tomar la iniciativa o que te sorprendan? Da un ejemplo.", c: "eleccion", f: "pregunta", s: 95, req: ["preguntas_personales"] },
  { id: "018", t: "En otra ocasión", x: "{p1}, confiesa algo que te gustaría que pasara entre ustedes en otra ocasión. Puedes decirlo de forma general.", c: "confianza", f: "pregunta", s: 98, req: ["confesiones", "fantasias"], tags: ["cierre"] },

  // ---------------------------------------------------------------- retos
  { id: "019", t: "Declaración de película", x: "{p1}, interpreta durante 30 segundos a un personaje de película romántica que se declara al grupo.", c: "retos", f: "reto", s: 66, req: ["roles_juego", "coqueteo"], d: [30, 20, 60], tags: ["voz"] },
  { id: "020", t: "¿Quién susurra?", x: "{p1}, con los ojos cerrados, adivina quién te dice una palabra en voz baja.", c: "desafios", f: "reto", s: 68, i: "group", req: ["adivinanzas", "coqueteo"], rol: { p1: ["ojos_cerrados"] }, sizes: [3] },
  { id: "021", t: "Cita narrada", x: "{p1}, narra con voz lenta y teatral cómo sería una cita perfecta con {p2}, sin detalles explícitos.", c: "pareja", f: "reto", s: 70, i: "directed_pair", req: ["fantasias"], pair: ["coqueteo"], tags: ["voz"] },
  { id: "022", t: "Espías en la gala", x: "{p1} y {p2} son espías que se encuentran en una gala. Improvisen una conversación coqueta de un minuto.", c: "retos", f: "reto", s: 71, req: ["roles_juego"], pair: ["coqueteo"], d: [60, 30, 120], tags: ["creatividad"] },
  { id: "023", t: "Masaje a ciegas", x: "{p1}, con los ojos cerrados, recibe un masaje de hombros de {p2}. Di si lo quieres más suave o parar.", c: "masajes", f: "reto", s: 73, i: "directed_pair", pair: ["masaje_hombros"], rol: { p1: ["ojos_cerrados"] }, d: [90, 45, 120], tags: ["calma"] },
  { id: "024", t: "Baile por el ritmo", x: "{p1} y {p2}, bailen una canción lenta con los ojos cerrados, guiándose solo por el ritmo.", c: "baile", f: "reto", s: 75, req: ["ojos_cerrados", "musica"], pair: ["baile_cercano"], d: [90, 60, 180] },
  { id: "025", t: "Poema de cuatro versos", x: "{p1}, recita a {p2} un poema improvisado de cuatro versos sobre su sonrisa.", c: "retos", f: "reto", s: 77, i: "directed_pair", pair: ["coqueteo"], tags: ["creatividad", "voz"] },
  { id: "026", t: "Beso de película", x: "{p1} y {p2}, si ambos lo autorizan, dense un beso breve al estilo de película clásica.", c: "pareja", f: "reto", s: 80, pair: ["beso"], conf: true },
  { id: "027", t: "Cumplidos en cadena", x: "Por turnos, cada persona dice un cumplido atrevido pero respetuoso a quien tiene a su derecha, hasta dar dos vueltas.", c: "conexion", f: "reto", s: 82, pair: ["coqueteo"], tags: ["cumplido"] },
  { id: "028", t: "Silencio magnético", x: "{p1} y {p2}, acérquense a una distancia cómoda y sostengan la mirada un minuto sin hablar.", c: "conexion", f: "reto", s: 84, pair: ["miradas", "coqueteo"], d: [60, 30, 90] },
  { id: "029", t: "Interrogatorio", x: "{p1} es detective y tiene un minuto para descubrir, solo con preguntas de sí o no, qué secreto inventó {p2}.", c: "desafios", f: "reto", s: 86, i: "directed_pair", req: ["roles_juego", "adivinanzas"], d: [60, 45, 120], tags: ["risas"] },
  { id: "030", t: "Masaje y palabras", x: "{p1}, dale a {p2} un masaje de manos lento mientras le cuentas qué te gusta de su compañía.", c: "masajes", f: "reto", s: 88, i: "directed_pair", pair: ["masaje_manos", "coqueteo"], d: [90, 45, 120] },
  { id: "031", t: "El guion", x: "{p1} inventa en voz alta una escena romántica corta y {p2} y {p3} la actúan sin contacto.", c: "trio", f: "reto", s: 90, i: "group", sizes: [3], req: ["roles_juego", "fantasias"], tags: ["creatividad"] },
  { id: "032", t: "Abrazo por la espalda", x: "{p1}, si {p2} lo autoriza, dale un abrazo por la espalda durante diez segundos.", c: "pareja", f: "reto", s: 92, i: "directed_pair", pair: ["abrazo"], conf: true, d: [15, 10, 30] },
  { id: "033", t: "Dedicatoria elegida", x: "{p1}, elige a quién le dedicarías una canción lenta esta noche y cántale el coro.", c: "eleccion", f: "reto", s: 94, i: "group", sizes: [3], req: ["musica", "coqueteo"], tags: ["voz"] },
  { id: "034", t: "Beso a ciegas", x: "{p1}, con los ojos cerrados, recibe un beso en la mejilla de quien el grupo decida en silencio.", c: "trio", f: "reto", s: 96, i: "group", sizes: [3], pair: ["beso"], rol: { p1: ["ojos_cerrados"] }, conf: true },
  { id: "035", t: "Votación de química", x: "A la cuenta de tres, cada persona señala a quien elegiría para bailar una canción lenta.", c: "trio", f: "reto", s: 97, sizes: [3], req: ["coqueteo"] },
  { id: "036", t: "Dirección de escena", x: "{p1} dirige durante un minuto: decide la música, cómo se sientan y de qué se habla, sin pedir contacto.", c: "desafios", f: "reto", s: 99, req: ["roles_juego", "musica"], d: [60, 30, 120] },
  { id: "037", t: "Pacto de la noche", x: "Entre todos, acuerden en voz alta una regla coqueta para el resto de la sesión, que siempre permita pasar.", c: "conexion", f: "reto", s: 100, req: ["coqueteo"], tags: ["cierre"] },
  { id: "038", t: "Una palabra al oído", x: "{p1}, dile a {p2} en voz baja una palabra que describa cómo te hace sentir el juego.", c: "pareja", f: "reto", s: 69, i: "directed_pair", pair: ["coqueteo"] },
  { id: "039", t: "Ritmo hipnótico", x: "{p1}, baila una canción completa como si nadie te mirara, con los ojos cerrados.", c: "baile", f: "reto", s: 72, req: ["baile_individual", "musica"], rol: { p1: ["ojos_cerrados"] }, d: [120, 60, 180], tags: ["movimiento"] },
  { id: "040", t: "Elección pública", x: "{p1}, elige qué carta de esta noche repetirías y con quién. Nadie está obligado a repetirla.", c: "eleccion", f: "reto", s: 79, i: "group", req: ["preguntas_personales"], tags: ["cierre"] },

  // ---------------------------------------------------------------- más probable
  { id: "041", t: "Alter ego", x: "¿Quién es más probable que tenga un alter ego seductor?", c: "preguntas", f: "votacion", s: 67, req: ["coqueteo"] },
  { id: "042", t: "Primero en proponer", x: "¿Quién es más probable que proponga algo atrevido primero?", c: "eleccion", f: "votacion", s: 72, req: ["coqueteo"] },
  { id: "043", t: "Secreto romántico", x: "¿Quién es más probable que guarde un secreto romántico durante años?", c: "secretos", f: "votacion", s: 78, req: ["preguntas_personales"] },
  { id: "044", t: "Mirada sostenida", x: "¿Quién es más probable que rompa primero el silencio en una mirada sostenida?", c: "conexion", f: "votacion", s: 84, req: ["coqueteo"] },
  { id: "045", t: "Serenata", x: "¿Quién es más probable que improvise una serenata a medianoche?", c: "musica", f: "votacion", s: 90, req: ["conversacion_ligera"] },
  { id: "046", t: "Sonrojo", x: "¿Quién es más probable que se sonroje primero con un cumplido atrevido?", c: "preguntas", f: "votacion", s: 96, req: ["coqueteo"] },

  // ---------------------------------------------------------------- quién me conoce
  { id: "047", t: "Viaje soñado", x: "¿Cuál sería el viaje romántico soñado de {p1}?", c: "pareja", f: "conocimiento", s: 68, req: ["adivinanzas", "fantasias"] },
  { id: "048", t: "Iniciativa", x: "¿Qué prefiere {p1}: tomar la iniciativa o que le sorprendan?", c: "eleccion", f: "conocimiento", s: 74, req: ["adivinanzas", "preguntas_personales"], opts: ["Tomar la iniciativa", "Que le sorprendan", "Depende del momento"] },
  { id: "049", t: "La mejor parte", x: "¿Qué parte de una cita disfruta más {p1}?", c: "pareja", f: "conocimiento", s: 80, req: ["adivinanzas", "preguntas_personales"], opts: ["La anticipación", "La conversación", "El final de la noche", "El recuerdo al día siguiente"] },
  { id: "050", t: "Cumplido que derrite", x: "¿Qué cumplido derrite a {p1}?", c: "confianza", f: "conocimiento", s: 87, req: ["adivinanzas", "preguntas_personales"] },
  { id: "051", t: "Personaje de la noche", x: "¿Qué personaje de película elegiría {p1} para una noche de juego de roles?", c: "preguntas", f: "conocimiento", s: 93, req: ["adivinanzas", "roles_juego"] },

  // ---------------------------------------------------------------- secretos
  { id: "052", t: "Fantasía en una frase", x: "Escribe una fantasía romántica en una frase, sin detalles explícitos.", c: "secretos", f: "secreto", s: 67, req: ["escritura_privada", "revelacion_grupo", "fantasias"] },
  { id: "053", t: "Nunca propuesto", x: "Escribe algo que te gustaría probar en una cita y nunca has propuesto.", c: "secretos", f: "secreto", s: 73, req: ["escritura_privada", "revelacion_grupo", "confesiones"] },
  { id: "054", t: "Lo que te gustó", x: "Escribe qué te gustó de alguien de esta sesión, sin decir de quién se trata.", c: "secretos", f: "secreto", s: 79, req: ["escritura_privada", "revelacion_grupo", "coqueteo"] },
  { id: "055", t: "Confesión atrevida", x: "Escribe la confesión más atrevida que quieras compartir hoy.", c: "secretos", f: "secreto", s: 86, req: ["escritura_privada", "revelacion_grupo", "confesiones"] },
  { id: "056", t: "Lugar inesperado", x: "Escribe un lugar del mundo inesperado donde te gustaría recibir un beso.", c: "secretos", f: "secreto", s: 92, req: ["escritura_privada", "revelacion_grupo", "fantasias"] },
  { id: "057", t: "Tensión", x: "Escribe una palabra que defina la tensión de esta noche.", c: "secretos", f: "secreto", s: 98, req: ["escritura_privada", "revelacion_grupo"], tags: ["cierre"] },

  // ---------------------------------------------------------------- sorpresas
  { id: "058", t: "Narrador oficial", x: "{p1} será quien narre con voz dramática las próximas tres actividades.", c: "sorpresa", f: "sorpresa", s: 70, req: ["roles_juego"], eff: "roles_juego" },
  { id: "059", t: "Todos confiesan", x: "Todos participan: cada persona dice en una frase qué actividad de esta noche fue su favorita.", c: "sorpresa", f: "sorpresa", s: 76, req: ["conversacion_ligera"], eff: "todos_participan" },
  { id: "060", t: "La repetición", x: "¿Repetimos? Pueden volver a una actividad anterior, solo si todos la aceptan de nuevo.", c: "sorpresa", f: "sorpresa", s: 82, req: ["conversacion_ligera"], eff: "repetir_voluntaria" },
  { id: "061", t: "El grupo decide", x: "El grupo elige quién protagoniza la próxima ronda. La elección vale para un solo turno.", c: "sorpresa", f: "sorpresa", s: 88, req: ["conversacion_ligera"], eff: "elegir_protagonista" },
  { id: "062", t: "Otro juego", x: "Giro de guion: elijan otro de los juegos activos para continuar.", c: "sorpresa", f: "sorpresa", s: 94, req: ["conversacion_ligera"], eff: "cambiar_juego" },
  { id: "063", t: "Compañía elegida", x: "{p1} tiene el privilegio de escoger compañía para la próxima actividad en pareja, siempre entre opciones compatibles.", c: "sorpresa", f: "sorpresa", s: 74, req: ["conversacion_ligera"], eff: "elegir_companero", sizes: [3] },
  { id: "064", t: "Dos seguidas", x: "Doble ronda: dos mini actividades seguidas, distintas entre sí. Cada una se puede pasar.", c: "sorpresa", f: "sorpresa", s: 84, req: ["conversacion_ligera"], eff: "doble_mini" },
]);
