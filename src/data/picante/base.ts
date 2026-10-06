import { defineCards } from "../define";

// Lote inicial Picante (60+). Cercanía solo con permisos por pareja; besos con confirmación.
export const picanteBase = defineCards("picante", "p", "base", [
  // ---------------------------------------------------------------- preguntas
  { id: "001", t: "Señal de interés", x: "{p1}, ¿cuál es la señal más clara de que alguien te gusta, aunque intentes disimularlo?", c: "preguntas", f: "pregunta", s: 32, req: ["preguntas_personales"] },
  { id: "002", t: "Ambiente coqueto", x: "{p1}, ¿qué canción pondrías para crear un ambiente coqueto?", c: "musica", f: "pregunta", s: 33, req: ["musica", "conversacion_ligera"] },
  { id: "003", t: "Para impresionar", x: "{p1}, ¿qué es lo más atrevido que has hecho para impresionar a alguien?", c: "preguntas", f: "pregunta", s: 35, req: ["preguntas_personales"] },
  { id: "004", t: "Gesto irresistible", x: "{p1}, ¿qué gesto pequeño te resulta irresistible en otra persona?", c: "preguntas", f: "pregunta", s: 36, req: ["preguntas_personales"] },
  { id: "005", t: "Cita memorable", x: "{p1}, cuenta la primera cita más memorable que has tenido, para bien o para mal.", c: "preguntas", f: "pregunta", s: 38, req: ["preguntas_personales"], tags: ["risas"] },
  { id: "006", t: "Mensaje sin enviar", x: "{p1}, ¿alguna vez escribiste un mensaje coqueto y no lo enviaste? ¿Qué decía, más o menos?", c: "confianza", f: "pregunta", s: 40, req: ["preguntas_personales", "confesiones"] },
  { id: "007", t: "Elogio preferido", x: "{p1}, ¿qué parte de tu personalidad te encanta que te elogien?", c: "preguntas", f: "pregunta", s: 41, req: ["preguntas_personales"], tags: ["cumplido"] },
  { id: "008", t: "Lo que atrae primero", x: "{p1}, ¿qué te atrae primero: la conversación, la sonrisa o la seguridad? Explica.", c: "eleccion", f: "pregunta", s: 43, req: ["preguntas_personales"] },
  { id: "009", t: "Tres adjetivos", x: "{p1}, describe la mirada de {p2} con tres adjetivos.", c: "pareja", f: "pregunta", s: 45, i: "directed_pair", pair: ["miradas", "coqueteo"] },
  { id: "010", t: "En confianza", x: "{p1}, ¿qué te hizo sentir en confianza con {p2}?", c: "confianza", f: "pregunta", s: 46, i: "directed_pair", req: ["preguntas_personales"] },
  { id: "011", t: "Escapada", x: "{p1}, imagina una escapada romántica de fin de semana: ¿a dónde irías y qué harías?", c: "pareja", f: "pregunta", s: 48, req: ["preguntas_personales"] },
  { id: "012", t: "Lo que sonroja", x: "{p1}, ¿qué tipo de comentario te sonroja con facilidad?", c: "preguntas", f: "pregunta", s: 50, req: ["preguntas_personales", "coqueteo"] },
  { id: "013", t: "Termómetro de celos", x: "{p1}, del 1 al 10, ¿qué tan celoso o celosa te consideras? Da un ejemplo sin nombres.", c: "confianza", f: "pregunta", s: 52, req: ["preguntas_personales"] },
  { id: "014", t: "Recibir afecto", x: "{p1}, ¿cómo prefieres recibir afecto: palabras, tiempo, detalles, ayuda o contacto?", c: "conexion", f: "pregunta", s: 55, req: ["preguntas_personales"] },
  { id: "015", t: "Coqueteo torpe", x: "{p1}, cuenta tu intento de coqueteo más torpe.", c: "preguntas", f: "pregunta", s: 57, req: ["preguntas_personales"], tags: ["risas"] },
  { id: "016", t: "Deseo para el juego", x: "{p1}, sin dar detalles explícitos: ¿qué te gustaría que pasara esta noche en el juego?", c: "preguntas", f: "pregunta", s: 60, req: ["preguntas_personales", "coqueteo"] },
  { id: "017", t: "Frase bonita", x: "{p1}, ¿cuál es la frase más bonita que te han dicho en voz baja?", c: "confianza", f: "pregunta", s: 62, req: ["preguntas_personales", "confesiones"] },
  { id: "018", t: "Velas o sala", x: "{p1}, ¿preferirías una cena a la luz de las velas o un baile improvisado en la sala?", c: "eleccion", f: "pregunta", s: 39, req: ["conversacion_ligera"] },

  // ---------------------------------------------------------------- retos
  { id: "019", t: "Lo que te gusta oír", x: "{p1}, mira a {p2} a los ojos y dile algo que te guste de su forma de hablar.", c: "pareja", f: "reto", s: 31, i: "directed_pair", pair: ["miradas", "coqueteo"], tags: ["cumplido"] },
  { id: "020", t: "Canción lenta", x: "{p1}, baila una canción lenta con toda la actitud que tengas.", c: "baile", f: "reto", s: 32, req: ["baile_individual", "musica"], d: [45, 30, 90], tags: ["movimiento"] },
  { id: "021", t: "Locutor nocturno", x: "{p1}, lee con voz de locutor nocturno una dedicatoria inventada para {p2}.", c: "retos", f: "reto", s: 34, i: "directed_pair", pair: ["coqueteo"], tags: ["voz", "risas"] },
  { id: "022", t: "Piropo elegante", x: "{p1}, dedícale a {p2} un piropo elegante y original; nada de frases gastadas.", c: "pareja", f: "reto", s: 35, i: "directed_pair", pair: ["coqueteo"], tags: ["cumplido"], fam: "piropo" },
  { id: "023", t: "Manos en silencio", x: "{p1} y {p2}, tómense de las manos y mírense en silencio hasta que termine el reloj.", c: "conexion", f: "reto", s: 37, pair: ["contacto_manos", "miradas"], d: [30, 20, 60], tags: ["calma"] },
  { id: "024", t: "Masaje de manos", x: "{p1}, dale a {p2} un masaje de manos suave durante un minuto.", c: "masajes", f: "reto", s: 39, i: "directed_pair", pair: ["masaje_manos"], d: [60, 30, 90], tags: ["calma"] },
  { id: "025", t: "Adivina a ciegas", x: "{p1}, con los ojos cerrados, adivina qué canción tararea {p2}.", c: "musica", f: "reto", s: 40, i: "directed_pair", req: ["musica"], rol: { p1: ["ojos_cerrados"] }, d: [45, 20, 60] },
  { id: "026", t: "Canción en voz baja", x: "{p1}, dile en voz baja a {p2} el título de una canción que te recuerde a esa persona.", c: "musica", f: "reto", s: 42, i: "directed_pair", pair: ["coqueteo"] },
  { id: "027", t: "Baile a su distancia", x: "{p1} y {p2}, bailen juntos una canción lenta, a la distancia que ambos quieran.", c: "baile", f: "reto", s: 44, req: ["musica"], pair: ["baile_cercano"], d: [90, 45, 180], tags: ["movimiento"] },
  { id: "028", t: "Portada de revista", x: "{p1}, haz tu mejor pose de portada mientras {p2} te describe como si fuera fotógrafo. Sin cámaras.", c: "retos", f: "reto", s: 46, i: "directed_pair", req: ["roles_juego"], tags: ["risas"] },
  { id: "029", t: "Abrazo que cuenta", x: "{p1} y {p2}, dense un abrazo largo, de esos que sí cuentan.", c: "conexion", f: "reto", s: 47, pair: ["abrazo"], d: [20, 10, 30] },
  { id: "030", t: "Hombros relajados", x: "{p1}, dale a {p2} un masaje de hombros de un minuto. {p2} indica si lo prefiere más suave o parar.", c: "masajes", f: "reto", s: 49, i: "directed_pair", pair: ["masaje_hombros"], d: [60, 30, 90], tags: ["calma"] },
  { id: "031", t: "Un minuto de mirada", x: "{p1} y {p2}, mírense sin hablar durante un minuto. Pueden reír, pero no apartar la mirada.", c: "conexion", f: "reto", s: 51, pair: ["miradas"], d: [60, 30, 90] },
  { id: "032", t: "Galán de telenovela", x: "{p1}, interpreta a un personaje de telenovela que intenta conquistar a {p2} con una sola frase.", c: "retos", f: "reto", s: 53, i: "directed_pair", pair: ["coqueteo"], rol: { p1: ["roles_juego"] }, tags: ["risas"] },
  { id: "033", t: "Clase de baile", x: "{p1} elige una canción y le enseña a {p2} un paso de baile, sin tocarse.", c: "baile", f: "reto", s: 54, i: "directed_pair", req: ["baile_individual", "musica"], d: [60, 30, 120], tags: ["movimiento"] },
  { id: "034", t: "Beso de caballería", x: "{p1}, si {p2} lo autoriza, dale un beso en la mano con estilo de película clásica.", c: "pareja", f: "reto", s: 56, i: "directed_pair", pair: ["beso", "contacto_manos"], conf: true },
  { id: "035", t: "Dedicatoria", x: "{p1}, elige una canción para {p2} y explica qué parte de la letra le dedicarías.", c: "musica", f: "reto", s: 58, i: "directed_pair", req: ["musica"], pair: ["coqueteo"] },
  { id: "036", t: "Retrato a ciegas", x: "{p1}, con los ojos cerrados, describe a {p2} solo con lo que recuerdas de su cara.", c: "desafios", f: "reto", s: 59, i: "directed_pair", pair: ["miradas"], rol: { p1: ["ojos_cerrados"] } },
  { id: "037", t: "Manos al centro", x: "Los tres juntan sus manos en el centro y cada persona dice algo que quiere vivir esta noche.", c: "trio", f: "reto", s: 61, sizes: [3], req: ["preguntas_personales"], pair: ["contacto_manos"], tags: ["apertura"] },
  { id: "038", t: "Beso en la mejilla", x: "{p1}, si {p2} lo autoriza, dale un beso en la mejilla y dile por qué.", c: "pareja", f: "reto", s: 63, i: "directed_pair", pair: ["beso"], conf: true },
  { id: "039", t: "Abrazo de tres", x: "Abrazo de tres durante diez segundos, en silencio, respirando al mismo ritmo.", c: "trio", f: "reto", s: 64, sizes: [3], pair: ["abrazo"], d: [15, 10, 30], tags: ["calma", "cierre"] },
  { id: "040", t: "Círculo de baile", x: "Los tres bailan una canción en círculo, tomados de las manos.", c: "trio", f: "reto", s: 65, sizes: [3], req: ["musica", "baile_individual"], pair: ["contacto_manos"], d: [90, 45, 180], tags: ["movimiento"] },

  // ---------------------------------------------------------------- más probable
  { id: "041", t: "Primera cita", x: "¿Quién es más probable que se enamore en la primera cita?", c: "preguntas", f: "votacion", s: 33, req: ["preguntas_personales"] },
  { id: "042", t: "Sin darse cuenta", x: "¿Quién es más probable que coquetee sin darse cuenta?", c: "pareja", f: "votacion", s: 37, req: ["coqueteo"] },
  { id: "043", t: "Cena sorpresa", x: "¿Quién es más probable que prepare una cena sorpresa romántica?", c: "conexion", f: "votacion", s: 42, req: ["conversacion_ligera"] },
  { id: "044", t: "Pista de baile", x: "¿Quién es más probable que saque a bailar a alguien en una fiesta?", c: "baile", f: "votacion", s: 47, req: ["coqueteo"] },
  { id: "045", t: "Carta a mano", x: "¿Quién es más probable que escriba una carta de amor a mano?", c: "conexion", f: "votacion", s: 53, req: ["conversacion_ligera"] },
  { id: "046", t: "Primer paso", x: "¿Quién es más probable que dé el primer paso?", c: "eleccion", f: "votacion", s: 58, req: ["coqueteo"] },

  // ---------------------------------------------------------------- quién me conoce
  { id: "047", t: "Cita preferida", x: "¿Qué tipo de cita prefiere {p1}?", c: "pareja", f: "conocimiento", s: 34, req: ["adivinanzas", "preguntas_personales"], opts: ["Cena tranquila", "Plan de aventura", "Fiesta y baile", "Noche en casa"] },
  { id: "048", t: "Lo primero que nota", x: "¿Qué es lo primero que {p1} nota en alguien que le atrae?", c: "preguntas", f: "conocimiento", s: 41, req: ["adivinanzas", "preguntas_personales"] },
  { id: "049", t: "Baile lento", x: "¿Qué canción elegiría {p1} para un baile lento?", c: "musica", f: "conocimiento", s: 47, req: ["adivinanzas", "musica"] },
  { id: "050", t: "Ante un cumplido", x: "¿Cómo reacciona {p1} cuando le hacen un cumplido?", c: "confianza", f: "conocimiento", s: 52, req: ["adivinanzas", "preguntas_personales"], opts: ["Se sonroja", "Lo devuelve", "Hace un chiste", "Cambia de tema"] },
  { id: "051", t: "Plan soñado", x: "¿Cuál sería el plan romántico soñado de {p1}?", c: "pareja", f: "conocimiento", s: 60, req: ["adivinanzas", "preguntas_personales"] },

  // ---------------------------------------------------------------- secretos
  { id: "052", t: "Cumplido anónimo", x: "Escribe un cumplido para alguien de esta sesión, sin decir para quién es.", c: "secretos", f: "secreto", s: 36, req: ["escritura_privada", "revelacion_grupo", "coqueteo"], tags: ["cumplido"] },
  { id: "053", t: "Noche especial", x: "Escribe la canción que pondrías para una noche especial.", c: "secretos", f: "secreto", s: 40, req: ["escritura_privada", "revelacion_grupo", "musica"] },
  { id: "054", t: "Cita sorpresa", x: "Escribe un lugar donde te gustaría que te sorprendieran con una cita.", c: "secretos", f: "secreto", s: 45, req: ["escritura_privada", "revelacion_grupo"] },
  { id: "055", t: "Nervios", x: "Escribe qué te genera nervios en una primera cita.", c: "secretos", f: "secreto", s: 50, req: ["escritura_privada", "revelacion_grupo", "preguntas_personales"] },
  { id: "056", t: "Romper el hielo", x: "Escribe la mejor frase para romper el hielo que conoces.", c: "secretos", f: "secreto", s: 55, req: ["escritura_privada", "revelacion_grupo"], tags: ["risas"] },

  // ---------------------------------------------------------------- sorpresas
  { id: "057", t: "DJ de la noche", x: "{p1} será quien elija la música de fondo durante las próximas tres rondas.", c: "sorpresa", f: "sorpresa", s: 35, req: ["musica"], eff: "roles_juego" },
  { id: "058", t: "Elige pareja", x: "Ahora {p1} decide con quién hará la siguiente actividad en pareja, solo entre opciones compatibles.", c: "sorpresa", f: "sorpresa", s: 44, req: ["conversacion_ligera"], eff: "elegir_companero", sizes: [3] },
  { id: "059", t: "Propuesta", x: "Propuesta: ¿quieren subir la intensidad? Respuestas privadas; nadie verá quién respondió qué.", c: "sorpresa", f: "sorpresa", s: 50, req: ["conversacion_ligera"], eff: "proponer_subir" },
  { id: "060", t: "Doble mini", x: "Dos mini actividades seguidas, cortas y distintas. Pueden pasar cualquiera.", c: "sorpresa", f: "sorpresa", s: 40, req: ["conversacion_ligera"], eff: "doble_mini" },
  { id: "061", t: "Todos a la vez", x: "Todos a la vez: cada persona dice qué momento de la noche le ha sacado la mejor sonrisa.", c: "sorpresa", f: "sorpresa", s: 38, req: ["conversacion_ligera"], eff: "todos_participan" },
  { id: "062", t: "Turno elegido", x: "El grupo elige quién protagoniza la próxima ronda. Solo vale para un turno.", c: "sorpresa", f: "sorpresa", s: 48, req: ["conversacion_ligera"], eff: "elegir_protagonista" },
]);
