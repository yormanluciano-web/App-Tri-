import { defineCards } from "../define";

// Perverso v2 · lote 09: cartas solo para una pareja hombre y mujer (`mixta: true`).
export const perversoV2_09 = defineCards("perverso", "v2", "base", [
  { id: "451", t: "Beso de película", x: "{p1}, dale a {p2} el beso más de película que sepas dar, en la boca, como si fuera el final de la historia.", c: "retos", f: "reto", s: 88, i: "directed_pair", pair: ["beso_intenso"], mixta: true },
  { id: "452", t: "Cuello lento", x: "{p1}, besa despacio el cuello de {p2} durante veinte segundos. {p2} puede pedir que pares cuando quiera.", c: "retos", f: "reto", s: 90, i: "directed_pair", pair: ["beso_intenso"], mixta: true, d: [20, 10, 30] },
  { id: "453", t: "Caricia por la espalda", x: "{p1}, recorre con tus manos la espalda de {p2}, por encima de la ropa, durante treinta segundos.", c: "retos", f: "reto", s: 84, i: "directed_pair", pair: ["caricias"], mixta: true, d: [30, 20, 60] },
  { id: "454", t: "Prenda elegida", x: "{p1}, elige una prenda exterior de {p2} (nunca ropa interior) para que se la quite ahora mismo. {p2} puede pasar.", c: "retos", f: "reto", s: 86, i: "directed_pair", req: ["quitarse_prenda"], aud: ["quitarse_prenda"], audScope: "sesion", pair: ["coqueteo"], mixta: true },
  { id: "455", t: "Fantasía entre los dos", x: "{p1}, cuéntale a {p2} una fantasía que tengas con alguien como {p2}, sin nombres ni detalles que no quieras dar.", c: "secretos", f: "pregunta", s: 80, i: "directed_pair", req: ["fantasias"], pair: ["coqueteo"], mixta: true },
  { id: "456", t: "Baile muy pegado", x: "{p1} y {p2}, bailen pegados una canción entera, con las manos donde ambos quieran por encima de la ropa.", c: "baile", f: "reto", s: 82, req: ["musica"], pair: ["baile_cercano", "caricias"], mixta: true, d: [90, 45, 180], tags: ["movimiento"] },
  { id: "457", t: "Cinco minutos a solas", x: "{p1} y {p2}, váyanse cinco minutos a solas a otra habitación. Lo que pase allí lo deciden entre los dos, y cualquiera puede volver cuando quiera.", c: "retos", f: "reto", s: 95, pair: ["tiempo_a_solas"], mixta: true, d: [300, 120, 600], sizes: [3] },
  { id: "458", t: "Ojos vendados", x: "{p1}, con los ojos cerrados, deja que {p2} te dé tres besos donde quiera, en la cara o el cuello.", c: "retos", f: "reto", s: 92, rol: { p1: ["ojos_cerrados"] }, pair: ["beso_intenso"], mixta: true },
  { id: "459", t: "Lo que me provocas", x: "{p1}, dile a {p2} al oído, con todo detalle, lo que te provoca tenerle tan cerca.", c: "retos", f: "reto", s: 78, i: "directed_pair", pair: ["coqueteo", "miradas"], mixta: true, tags: ["voz"] },
  { id: "460", t: "Abrazo sin prisa", x: "{p1} y {p2}, abrácense un minuto, muy juntos, con las manos en la cintura del otro.", c: "retos", f: "reto", s: 76, pair: ["abrazo", "caricias"], mixta: true, d: [60, 30, 90], tags: ["calma"] },
]);
