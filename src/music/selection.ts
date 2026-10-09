import type { MusicMoment } from "./moments";

/**
 * «DJ Cómplice»: selección de canciones por momento, solo en español y de
 * artistas muy escuchados en Colombia y Venezuela. La app busca cada canción
 * en el Spotify de quien juega y las pone en orden aleatorio; quien administra
 * puede cambiarlas en el panel (pestaña «Música»). Formato: «Artista - Canción».
 */
export const DEFAULT_SONGS: Record<MusicMoment, readonly string[]> = {
  // Coqueteo y buena vibra: pop urbano y romántico.
  leve: [
    "Karol G - Si Antes Te Hubiera Conocido",
    "Karol G - Provenza",
    "Karol G - Mi Ex Tenía Razón",
    "Feid - Normal",
    "Feid - Classy 101",
    "Danny Ocean - Me Rehúso",
    "Danny Ocean - Fuera del Mercado",
    "Camilo - Vida de Rico",
    "Camilo - Índigo",
    "Sebastián Yatra - Tacones Rojos",
    "Sebastián Yatra - Pareja del Año",
    "Manuel Turizo - La Bachata",
    "Manuel Turizo - Una Lady Como Tú",
    "Morat - Besos en Guerra",
    "Kapo - Ohnana",
    "Mau y Ricky - Desconocidos",
    "Greeicy - Amantes",
    "Bad Bunny - Ojitos Lindos",
    "Bad Bunny - Baile Inolvidable",
    "Rauw Alejandro - Todo de Ti",
    "Chino y Nacho - Mi Niña Bonita",
    "Blessd - Mírame",
  ],
  // Reggaetón sensual de tempo medio.
  picante: [
    "Feid - Luna",
    "Feid - Prohibidox",
    "Ozuna - Hey Mor",
    "Ozuna - Se Preparó",
    "Karol G - Bichota",
    "Karol G - Qlona",
    "Karol G - Gatúbela",
    "Bad Bunny - Me Porto Bonito",
    "Bad Bunny - Perro Negro",
    "Bad Bunny - Monaco",
    "Myke Towers - Lala",
    "Myke Towers - Diosa",
    "Rauw Alejandro - Desesperados",
    "Rauw Alejandro - Lokera",
    "Sech - Otro Trago",
    "Jhayco - Holanda",
    "Kapo - Uwaie",
    "Dalex - Hola",
    "Maluma - Hawái",
    "Romeo Santos - Propuesta Indecente",
    "Nicky Jam - Hasta el Amanecer",
    "Young Miko - Riri",
  ],
  // Perreo intenso y muy sensual.
  perverso: [
    "Bad Bunny - Safaera",
    "Bad Bunny - Yo Perreo Sola",
    "Bad Bunny - Voy a Llevarte Pa PR",
    "Karol G - Ay, Dios Mío!",
    "Karol G - Mamiii",
    "Feid - Porfa",
    "Feid - Feliz Cumpleaños Ferxxo",
    "Plan B - Fanática Sensual",
    "Plan B - Mi Vecinita",
    "Wisin & Yandel - Abusadora",
    "Zion & Lennox - Otra Vez",
    "Jowell & Randy - Bonita",
    "Maluma - Felices los 4",
    "Myke Towers - Bandido",
    "Sech - Relación",
    "Ozuna - Te Boté",
    "Daddy Yankee - Shaky Shaky",
    "Daddy Yankee - Rompe",
    "Don Omar - Dile",
    "J Balvin - Ginza",
    "Ivy Queen - Yo Quiero Bailar",
    "Nicky Jam - Travesuras",
  ],
  // Para retos de baile: reggaetón, salsa, merengue y vallenato de fiesta.
  baile: [
    "Daddy Yankee - Gasolina",
    "Don Omar - Danza Kuduro",
    "J Balvin - Mi Gente",
    "Bad Bunny - Tití Me Preguntó",
    "Bad Bunny - Dákiti",
    "Manuel Turizo - El Merengue",
    "Karol G - TQG",
    "Shakira - Bzrp Music Sessions, Vol. 53",
    "Carlos Vives - La Bicicleta",
    "Carlos Vives - La Gota Fría",
    "Grupo Niche - Cali Pachanguero",
    "Grupo Niche - Una Aventura",
    "Joe Arroyo - La Rebelión",
    "Marc Anthony - Vivir Mi Vida",
    "Silvestre Dangond - Materialista",
    "Wisin & Yandel - Rakata",
    "Chino y Nacho - Andas en Mi Cabeza",
    "Aventura - Obsesión",
    "Elvis Crespo - Suavemente",
    "Juan Luis Guerra - La Bilirrubina",
    "Nicky Jam - X",
    "Bomba Estéreo - Soy Yo",
  ],
  // Cartas tranquilas: abrazos largos, respiración, confesiones suaves.
  calma: [
    "Pedro Capó - Calma",
    "Rauw Alejandro - Aquel Nap ZzZz",
    "Morat - Cómo Te Atreves",
    "Morat - Mi Nuevo Vicio",
    "Reik - Me Niego",
    "Romeo Santos - Imitadora",
    "Prince Royce - Darte un Beso",
    "Prince Royce - Corazón Sin Cara",
    "Natalia Lafourcade - Hasta la Raíz",
    "Rels B - A Mí",
    "Camilo - Tutu",
    "Sebastián Yatra - Traicionera",
    "Carlos Vives - Robarte un Beso",
    "Fonseca - Te Mando Flores",
    "Juanes - Es Por Ti",
    "Danny Ocean - Dembow",
  ],
  // Al terminar la sesión.
  cierre: [
    "Bad Bunny - DtMF",
    "Karol G - Mientras Me Curo del Cora",
    "Carlos Vives - Volví a Nacer",
    "Juanes - La Camisa Negra",
    "Juanes - Me Enamora",
    "Shakira - Antología",
    "Sebastián Yatra - Un Año",
    "Manuel Medrano - Bajo el Agua",
    "Silvestre Dangond - Cásate Conmigo",
    "Fonseca - Arroyito",
    "Camilo - Ropa Cara",
  ],
};

/** «Artista - Canción» → partes (acepta guion normal o largo). */
export function parseSong(line: string): { artist: string; title: string } | null {
  const m = /^\s*(.+?)\s+[-–—]\s+(.+?)\s*$/.exec(line);
  if (!m) return null;
  return { artist: m[1], title: m[2] };
}

/** Búsquedas para Spotify: primero exacta por artista y título; si no, texto libre. */
export function songQueries(line: string): string[] {
  const p = parseSong(line);
  if (!p) return [line.trim()];
  const clean = (s: string) => s.replace(/"/g, "");
  return [`track:"${clean(p.title)}" artist:"${clean(p.artist)}"`, `${p.artist} ${p.title}`];
}
