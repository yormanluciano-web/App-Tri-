import { defineCards } from "../define";

// Leve v2 · lote 05: elecciones, secretos anónimos, conocimiento, más probable y sorpresas.
export const leveV2_05 = defineCards("leve", "l2", "base", [
  { id: "241", t: "Voz o risa", x: "{p1}, ¿qué te resulta más irresistible: una voz tranquila y profunda o una risa contagiosa?", c: "eleccion", f: "pregunta", s: 18, req: ["preguntas_personales"] },
  { id: "242", t: "Detalles o palabras", x: "{p1}, ¿te enamoran más los detalles o las palabras? Da un ejemplo.", c: "eleccion", f: "pregunta", s: 12, req: ["conversacion_ligera"] },
  { id: "243", t: "Bailar o cantar", x: "{p1}, si solo pudieras conquistar con un talento, ¿bailarías o cantarías? Haz una pequeña muestra.", c: "eleccion", f: "reto", s: 16, req: ["musica", "baile_individual"], tags: ["movimiento"] },
  { id: "244", t: "Plan de primera cita", x: "{p1}, primera cita: ¿cine, museo, comida callejera o caminata nocturna? Defiende tu elección.", c: "eleccion", f: "pregunta", s: 5, req: ["conversacion_ligera"] },
  { id: "245", t: "Primer paso", x: "{p1}, ¿prefieres dar el primer paso o que te lo den? Explica tu estrategia.", c: "eleccion", f: "pregunta", s: 21, req: ["preguntas_personales"] },
  { id: "246", t: "Carta o canción", x: "{p1}, ¿qué te emociona más: que te escriban una carta o que te dediquen una canción?", c: "eleccion", f: "pregunta", s: 9, req: ["conversacion_ligera", "musica"] },
  { id: "247", t: "Mañana o medianoche", x: "{p1}, ¿cuándo tienes más encanto: a primera hora de la mañana o a medianoche?", c: "eleccion", f: "pregunta", s: 4, req: ["conversacion_ligera"], tags: ["risas"] },
  { id: "248", t: "Misterio o claridad", x: "{p1}, ¿te atrae más una persona con misterio o una que dice todo lo que piensa?", c: "eleccion", f: "pregunta", s: 22, req: ["preguntas_personales"] },
  { id: "249", t: "Lluvia", x: "{p1}, día de lluvia con alguien especial: ¿película en casa o salir a mojarse entre risas?", c: "eleccion", f: "pregunta", s: 7, req: ["conversacion_ligera"] },
  { id: "250", t: "Sorpresa o planeado", x: "{p1}, ¿prefieres que te sorprendan con una salida o planearla en equipo? ¿Por qué?", c: "eleccion", f: "pregunta", s: 24, req: ["conversacion_ligera"] },
  { id: "251", t: "Cumplido preferido", x: "{p1}, ¿qué cumplido prefieres recibir: sobre tu inteligencia, tu humor o tu atractivo?", c: "eleccion", f: "pregunta", s: 20, req: ["preguntas_personales"], tags: ["cumplido"] },
  { id: "252", t: "Postre para compartir", x: "{p1}, para compartir con alguien que te gusta: ¿un helado, un chocolate o fresas con crema?", c: "eleccion", f: "pregunta", s: 1, req: ["conversacion_ligera"] },
  { id: "253", t: "En persona o por chat", x: "{p1}, ¿se te da mejor coquetear en persona o por mensajes? Da una prueba en vivo.", c: "eleccion", f: "reto", s: 26, req: ["coqueteo"] },
  { id: "254", t: "Mirada o frase", x: "{p1}, para decir «me gustas», ¿una mirada larga o una frase directa? Muéstraselo a {p2} en plan de juego.", c: "eleccion", f: "reto", s: 29, i: "directed_pair", pair: ["coqueteo", "miradas"] },
  { id: "255", t: "Improvisado o tranquilo", x: "{p1}, ¿qué eliges: un viaje improvisado lleno de aventuras o un fin de semana tranquilo sin planes?", c: "eleccion", f: "pregunta", s: 15, req: ["conversacion_ligera"] },

  // ---------------------------------------------------------------- secretos anónimos

  // ---------------------------------------------------------------- quién me conoce


  // ---------------------------------------------------------------- sorpresas
  { id: "291", t: "Ronda de lo mejor", x: "Ronda para todos: cada persona dice en una frase qué le ha gustado más de esta noche.", c: "sorpresa", f: "sorpresa", s: 2, req: ["conversacion_ligera"], eff: "todos_participan" },
  { id: "292", t: "Comedia romántica", x: "Personajes: durante la próxima carta, cada persona juega como protagonista de una comedia romántica.", c: "sorpresa", f: "sorpresa", s: 15, req: ["roles_juego"], eff: "roles_juego" },
  { id: "293", t: "Elige pareja de juego", x: "{p1} elige con quién hará la próxima actividad en pareja, entre las opciones compatibles.", c: "sorpresa", f: "sorpresa", s: 12, sizes: [3], req: ["conversacion_ligera"], eff: "elegir_companero" },
  { id: "294", t: "Bis voluntario", x: "Bis: si alguien quiere, puede repetir la actividad que más le gustó. Nadie está obligado.", c: "sorpresa", f: "sorpresa", s: 8, req: ["conversacion_ligera"], eff: "repetir_voluntaria" },
  { id: "295", t: "Doble rápida", x: "Doble rápida: vienen dos mini actividades seguidas para subir el ritmo. Cualquiera se puede pasar.", c: "sorpresa", f: "sorpresa", s: 5, req: ["conversacion_ligera"], eff: "doble_mini" },
  { id: "296", t: "Cambio de escena", x: "Cambio de escena: elijan otro de los juegos activos para seguir la noche.", c: "sorpresa", f: "sorpresa", s: 18, req: ["conversacion_ligera"], eff: "cambiar_juego" },
  { id: "297", t: "¿Un poco más picante?", x: "¿Les apetece algo más picante? Cada persona responde en privado. Solo se sube de nivel si todas dicen que sí, y nadie verá las respuestas.", c: "sorpresa", f: "sorpresa", s: 27, req: ["conversacion_ligera"], eff: "proponer_subir" },
  { id: "298", t: "El grupo decide", x: "El grupo elige quién protagoniza la siguiente ronda; la elección vale solo para un turno.", c: "sorpresa", f: "sorpresa", s: 22, req: ["conversacion_ligera"], eff: "elegir_protagonista" },
  { id: "299", t: "Coro sorpresa", x: "Todos participan: canten juntos unos segundos de la canción que proponga {p1}.", c: "sorpresa", f: "sorpresa", s: 10, i: "group", req: ["musica"], eff: "todos_participan" },
  { id: "300", t: "Modo telenovela", x: "Modo telenovela: la próxima carta se juega con voz y gestos de telenovela dramática.", c: "sorpresa", f: "sorpresa", s: 29, req: ["roles_juego"], eff: "roles_juego" },
]);
