import { defineCards } from "../define";

// Perverso v2 · lote 02: juego de roles, contacto gradual, masajes.
// Intensidad 3-5: contacto táctil sin ropa, besos exploratorios.
// Notas: solo cartas únicas no repetidas.
export const perversoV2_02 = defineCards("perverso", "v2", "base", [
  { id: "02001", t: "Elige prenda", x: "{p2} elige qué prenda se quita {p1}. Quita despacio con mirada intensa.", c: "retos", f: "reto", s: 88, pair: ["miradas", "coqueteo"], rol: { p1: ["quitarse_prenda"] }, aud: ["quitarse_prenda"], audScope: "sesion" },
  { id: "02002", t: "Números prendas", x: "{p2} dice 1-3: {p1} quita ese número de prendas, una cada 10s.", c: "retos", f: "reto", s: 97, pair: ["coqueteo"], rol: { p1: ["quitarse_prenda"] }, aud: ["quitarse_prenda"], audScope: "sesion", d: [30, 10, 60] },
  { id: "02003", t: "Beso cuello", x: "{p1}, si {p2} autoriza, beso intenso en cuello y regresa sin hablar.", c: "retos", f: "reto", s: 92, i: "directed_pair", pair: ["beso_intenso"], d: [30, 15, 45] },
  { id: "02004", t: "Adivina tacto", x: "{p1} cierra ojos, adivina quién toca sus antebrazos, 40s por persona.", c: "desafios", f: "reto", s: 82, i: "group", sizes: [3], req: ["adivinanzas"], pair: ["caricias"], rol: { p1: ["ojos_cerrados"] }, d: [40, 20, 60] },
  { id: "02005", t: "Beso 10s", x: "{p1} y {p2}, uno autoriza, beso intenso 10s sin separar.", c: "retos", f: "reto", s: 94, pair: ["beso_intenso"], d: [10, 10, 20] },
  { id: "02006", t: "Beso dedo", x: "{p1}, si {p2} autoriza, queda un dedo de su boca 10s y beso lento.", c: "desafios", f: "reto", s: 99, i: "directed_pair", pair: ["beso", "miradas"], d: [10, 10, 20] },
  { id: "02007", t: "Masaje susurrar", x: "{p1} masajea hombros de {p2} 1min susurra qué le gusta.", c: "masajes", f: "reto", s: 73, i: "directed_pair", pair: ["masaje_hombros", "coqueteo"], d: [60, 30, 120], tags: ["voz", "calma"] },
  { id: "02008", t: "Guante seda", x: "{p1} acaricia manos y antebrazos de {p2} 1min sin hablar, sosteniendo miradas.", c: "retos", f: "reto", s: 77, i: "directed_pair", pair: ["caricias", "miradas"], d: [60, 30, 90], tags: ["calma"] },
  { id: "02009", t: "Loto prendas", x: "{p1}, {p2} y {p3} dicen 1-3. Mayor quita prenda. Empate: juegan.", c: "desafios", f: "reto", s: 84, i: "group", sizes: [3], req: ["quitarse_prenda"], aud: ["quitarse_prenda"], audScope: "sesion", tags: ["risas"] },
  { id: "02010", t: "Respiro cuello", x: "{p1}, si {p2} autoriza, rostro cerca cuello 15s sin tocar, susurra.", c: "retos", f: "reto", s: 79, i: "directed_pair", pair: ["coqueteo"], tags: ["voz", "cumplido"] },
  { id: "02011", t: "Reto espejo", x: "{p1} y {p2}, por prenda que se quite uno, otro quita. Máx 2.", c: "retos", f: "reto", s: 95, req: ["quitarse_prenda"], pair: ["miradas"], aud: ["quitarse_prenda"], audScope: "sesion" },
  { id: "02012", t: "Sin reirse", x: "{p1} y {p2} miradas 1min; quien ríe confiesa o pasa.", c: "desafios", f: "reto", s: 72, req: ["confesiones"], pair: ["miradas", "coqueteo"], d: [60, 30, 90], tags: ["risas"] },
  { id: "02013", t: "Beso adivinado", x: "{p1} cierra ojos: {p2} o {p3} le dan beso en cuello. Adivina quién.", c: "desafios", f: "reto", s: 100, i: "group", sizes: [3], req: ["adivinanzas"], pair: ["beso_intenso", "miradas"], rol: { p1: ["ojos_cerrados"] } },
  { id: "02014", t: "Palabra espalda", x: "{p1}, escribe palabra en espalda de {p2}; {p2} adivina en 3 intentos.", c: "desafios", f: "reto", s: 74, i: "directed_pair", req: ["adivinanzas"], pair: ["caricias"], tags: ["risas", "cumplido"] },
  { id: "02015", t: "Susurros ciegos", x: "{p1} cierra ojos; {p2} y {p3} susurran frases; adivina quiénes.", c: "desafios", f: "reto", s: 85, i: "group", sizes: [3], req: ["adivinanzas", "coqueteo"], rol: { p1: ["ojos_cerrados"] }, tags: ["voz"] },
  { id: "02016", t: "Cuenta regresiva", x: "{p2} cuenta 10-0; {p1} quita prenda antes de cero.", c: "retos", f: "reto", s: 78, pair: ["coqueteo"], rol: { p1: ["quitarse_prenda"] }, aud: ["quitarse_prenda"], audScope: "sesion", d: [15, 10, 30] },
  { id: "02017", t: "Sube mano", x: "{p1}, si {p2} autoriza, besos desde muñeca hasta codo sin prisa.", c: "retos", f: "reto", s: 89, i: "directed_pair", pair: ["beso"], d: [60, 30, 90] },
  { id: "02018", t: "Dilema doble", x: "{p1} elige: quitarse prenda o recibir beso a elección de {p2}.", c: "desafios", f: "reto", s: 96, pair: ["beso"], rol: { p1: ["quitarse_prenda"] }, aud: ["quitarse_prenda"], audScope: "sesion" },
  { id: "02019", t: "Retrato", x: "{p1} describe en voz lenta a {p2} como tentadora.", c: "retos", f: "reto", s: 75, i: "directed_pair", pair: ["coqueteo"], tags: ["cumplido", "voz"] },
  { id: "02020", t: "Pierna con pierna", x: "{p1} y {p2}, pierna con pierna, hablan 2min de lo que atrae.", c: "retos", f: "reto", s: 87, pair: ["caricias", "coqueteo"], d: [120, 60, 180] },
  { id: "02021", t: "Prenda pista", x: "{p1} cierra ojos; {p2} describe prenda. Quita la correcta.", c: "desafios", f: "reto", s: 93, req: ["adivinanzas"], pair: ["coqueteo"], rol: { p1: ["quitarse_prenda", "ojos_cerrados"] }, aud: ["quitarse_prenda"], audScope: "sesion", tags: ["risas"] },
  { id: "02022", t: "Cabello nuca", x: "{p1}, si {p2} autoriza, acaricia cabello y nuca 1min.", c: "retos", f: "reto", s: 80, i: "directed_pair", pair: ["caricias"], d: [60, 30, 90], tags: ["calma"] },
  { id: "02023", t: "Respiración abrazo", x: "{p1} y {p2}, abrazados 30s respirando sincronizados.", c: "retos", f: "reto", s: 69, pair: ["abrazo"], d: [30, 20, 60], tags: ["calma"] },
]);
