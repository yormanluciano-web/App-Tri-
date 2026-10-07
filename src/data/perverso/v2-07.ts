import { defineCards } from "../define";

// Perverso v2 · lote 07: secretos anónimos, confesiones y quién me conoce.
export const perversoV2_07 = defineCards("perverso", "v2", "base", [
  // ---------------------------------------------------------------- secretos escritos

  // ---------------------------------------------------------------- confesiones
  { id: "386", t: "Cita o dos prendas", x: "{p1}, confiesa en una frase sin detalles cuál ha sido tu cita más atrevida, o quítate dos prendas.", c: "secretos", f: "pregunta", s: 92, req: ["confesiones", "quitarse_prenda"], aud: ["quitarse_prenda"], audScope: "sesion" },
  { id: "387", t: "Secreto por secreto", x: "{p1} y {p2}, si ambos lo autorizan, vayan dos minutos a otra habitación a intercambiar un secreto atrevido; al volver, decidan si alguno se comparte.", c: "secretos", f: "reto", s: 75, req: ["confesiones"], pair: ["tiempo_a_solas"], d: [120, 60, 180] },
  { id: "388", t: "¿Real o inventada?", x: "{p1}, cuenta una anécdota atrevida que puede ser real o inventada; el resto vota si es verdad.", c: "secretos", f: "reto", s: 80, i: "group", req: ["confesiones", "adivinanzas"], tags: ["risas"] },
  { id: "389", t: "Cómo empezó", x: "{p1}, ¿cuál es la noche de tu vida que nunca le has contado completa a nadie? Cuenta solo cómo empezó.", c: "secretos", f: "pregunta", s: 87, req: ["confesiones"] },
  { id: "390", t: "Mensaje dictado", x: "{p1}, dicta en voz alta el mensaje atrevido que le escribirías a {p2} si nadie más pudiera leerlo.", c: "secretos", f: "reto", s: 94, i: "directed_pair", req: ["confesiones"], pair: ["coqueteo"], tags: ["voz"] },
  { id: "391", t: "Alguien de aquí", x: "{p1}, confiesa si alguna vez has fantaseado con alguien de esta sesión. No tienes que decir con quién.", c: "secretos", f: "pregunta", s: 98, sizes: [3], req: ["confesiones", "fantasias"] },
  { id: "392", t: "Irresistible", x: "{p1}, ¿cuál fue la primera vez que te sentiste irresistible? Cuéntalo con orgullo.", c: "secretos", f: "pregunta", s: 68, req: ["preguntas_personales"] },
  { id: "393", t: "Ritual secreto", x: "{p1}, confiesa un ritual secreto que tienes antes de una cita importante.", c: "secretos", f: "pregunta", s: 66, req: ["conversacion_ligera"], tags: ["risas"] },
  { id: "394", t: "Al verle hoy", x: "{p1}, mirando a {p2} a los ojos, confiesa lo primero atrevido que pensaste al verle hoy.", c: "secretos", f: "pregunta", s: 83, i: "directed_pair", req: ["confesiones"], pair: ["miradas"] },
  { id: "395", t: "Carta deseada", x: "{p1}, confiesa qué carta de esta noche te hubiera gustado que te tocara y por qué.", c: "secretos", f: "pregunta", s: 79, req: ["confesiones"] },
  { id: "396", t: "Secreto en tres palabras", x: "{p1} susurra un secreto atrevido a {p2}; {p2} lo resume en tres palabras para {p3}, que intenta adivinarlo completo.", c: "secretos", f: "reto", s: 85, i: "group", sizes: [3], req: ["confesiones", "adivinanzas"], tags: ["risas", "voz"] },
  { id: "397", t: "Confiesa o besa", x: "{p1}, confiesa tu mayor tentación de esta noche o, si {p2} lo autoriza, dale un beso intenso en su lugar.", c: "secretos", f: "reto", s: 96, i: "directed_pair", req: ["confesiones"], pair: ["beso_intenso"] },
  { id: "398", t: "El rumor", x: "{p1}, inventa un rumor atrevido sobre tu vida amorosa que te encantaría que fuera verdad.", c: "secretos", f: "pregunta", s: 71, req: ["fantasias"], tags: ["risas", "creatividad"] },
  { id: "399", t: "Pacto de silencio", x: "{p1}, confiesa algo atrevido al grupo con una condición: nadie podrá mencionarlo después de esta ronda.", c: "secretos", f: "reto", s: 88, i: "group", req: ["confesiones"] },
  { id: "400", t: "Oportunidad perdida", x: "{p1}, ¿de qué oportunidad romántica te arrepientes de no haber aprovechado? Sin nombres.", c: "secretos", f: "pregunta", s: 72, req: ["confesiones"] },
  { id: "401", t: "Tono seductor", x: "{p1}, confiesa qué tono de voz usas cuando quieres seducir y demuéstralo con una frase.", c: "secretos", f: "reto", s: 76, req: ["confesiones", "coqueteo"], tags: ["voz"] },
  { id: "402", t: "Guardar el secreto", x: "{p1}, {p2} te pregunta por tu mejor secreto de seducción; si prefieres guardarlo, puedes quitarte una prenda en lugar de responder.", c: "secretos", f: "pregunta", s: 82, pair: ["coqueteo"], rol: { p1: ["confesiones", "quitarse_prenda"] }, aud: ["quitarse_prenda"], audScope: "sesion" },
  { id: "403", t: "Lista pendiente", x: "{p1}, ¿tienes una lista mental de cosas atrevidas por hacer? Comparte el primer punto, sin detalles explícitos.", c: "secretos", f: "pregunta", s: 95, req: ["fantasias", "confesiones"] },
  { id: "404", t: "Te sorprendiste", x: "{p1}, antes de cerrar, confiesa algo que te haya sorprendido de ti esta noche.", c: "secretos", f: "pregunta", s: 69, req: ["confesiones"], tags: ["cierre"] },
  { id: "405", t: "Solo ustedes lo saben", x: "{p1} y {p2}, compartan con quien se queda un secreto atrevido de esta noche que solo ustedes conozcan, o inventen uno muy creíble.", c: "secretos", f: "reto", s: 86, sizes: [3], req: ["confesiones", "roles_juego"], pair: ["coqueteo"], tags: ["risas"] },


  // ---------------------------------------------------------------- quién me conoce
]);
