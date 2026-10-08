import type { Format, Interaction } from "@/domain/models/constants";

/**
 * Parqués de la pasión: tablero circular de 24 casillas con el corazón al
 * centro. Lógica pura (sin interfaz) para poder probarla.
 */
export type SquareKind = "salida" | "verdad" | "reto" | "pareja" | "comodin" | "avanza" | "retrocede" | "descanso";

export const BOARD_SIZE = 24;

/** Recorrido fijo: casi todas las casillas traen carta, con algunas de movimiento y descanso. */
export const BOARD: readonly { kind: SquareKind; steps?: number }[] = [
  { kind: "salida" },
  { kind: "verdad" },
  { kind: "reto" },
  { kind: "avanza", steps: 2 },
  { kind: "pareja" },
  { kind: "verdad" },
  { kind: "comodin" },
  { kind: "reto" },
  { kind: "retrocede", steps: 2 },
  { kind: "pareja" },
  { kind: "verdad" },
  { kind: "descanso" },
  { kind: "reto" },
  { kind: "pareja" },
  { kind: "avanza", steps: 3 },
  { kind: "verdad" },
  { kind: "reto" },
  { kind: "comodin" },
  { kind: "pareja" },
  { kind: "retrocede", steps: 3 },
  { kind: "verdad" },
  { kind: "reto" },
  { kind: "pareja" },
  { kind: "comodin" },
];

export const SQUARE_STYLE: Record<SquareKind, { label: string; glyph: string; from: string; to: string }> = {
  salida: { label: "Salida", glyph: "⚑", from: "#f5c76b", to: "#b8862e" },
  verdad: { label: "Verdad", glyph: "?", from: "#9b5cff", to: "#ff4fa3" },
  reto: { label: "Reto", glyph: "!", from: "#ff2e63", to: "#ff8a3d" },
  pareja: { label: "Pareja", glyph: "♥", from: "#ff4d8d", to: "#b026ff" },
  comodin: { label: "Comodín", glyph: "★", from: "#fcd34d", to: "#e8457a" },
  avanza: { label: "Avanza", glyph: "»", from: "#10b981", to: "#0e7490" },
  retrocede: { label: "Retrocede", glyph: "«", from: "#64748b", to: "#334155" },
  descanso: { label: "Descanso", glyph: "☾", from: "#3b2db8", to: "#1e1b4b" },
};

export interface MoveResult {
  /** Casillas recorridas una a una (para animar la ficha). */
  path: number[];
  /** Casilla final (o BOARD_SIZE si llegó al corazón). */
  to: number;
  /** Casilla donde cayó con el dado, antes de avanzar o retroceder por la casilla. */
  landed: number;
  /** Movimiento extra por casilla de «avanza» o «retrocede». */
  bonus: number;
  /** Llegó al corazón: ganó la vuelta. */
  finished: boolean;
}

/** Mueve una ficha: el dado, y si cae en «avanza»/«retrocede», ese movimiento extra (una sola vez). */
export function move(from: number, roll: number): MoveResult {
  const path: number[] = [];
  let pos = from;
  for (let i = 0; i < roll; i++) {
    pos += 1;
    path.push(Math.min(pos, BOARD_SIZE));
    if (pos >= BOARD_SIZE) return { path, to: BOARD_SIZE, landed: BOARD_SIZE, bonus: 0, finished: true };
  }
  const landed = pos;
  const sq = BOARD[landed];
  let bonus = 0;
  if (sq.kind === "avanza") bonus = sq.steps ?? 0;
  if (sq.kind === "retrocede") bonus = -(sq.steps ?? 0);
  if (bonus !== 0) {
    const dir = Math.sign(bonus);
    for (let i = 0; i < Math.abs(bonus); i++) {
      pos = Math.max(0, pos + dir);
      path.push(Math.min(pos, BOARD_SIZE));
      if (pos >= BOARD_SIZE) return { path, to: BOARD_SIZE, landed, bonus, finished: true };
    }
  }
  return { path, to: pos, landed, bonus, finished: false };
}

/** Qué carta pide la casilla final (null = no hay carta). */
export function cardFor(square: number): { formats?: readonly Format[]; interactions?: readonly Interaction[] } | null {
  const sq = BOARD[square];
  if (!sq) return null;
  switch (sq.kind) {
    case "verdad":
      return { formats: ["pregunta"] };
    case "reto":
      return { formats: ["reto"] };
    case "pareja":
      return { interactions: ["pair", "directed_pair"] };
    case "comodin":
      return {};
    default:
      return null;
  }
}

/** Lado del tablero: 7×7, con las 24 casillas en el borde y el corazón en el centro. */
export const GRID = 7;

/**
 * Celda (columna, fila) de cada casilla en el borde del tablero, en el sentido
 * de las agujas del reloj desde la esquina superior izquierda. BOARD_SIZE
 * (el corazón) es el centro.
 */
export function gridCell(i: number): { col: number; row: number } {
  const last = GRID - 1;
  if (i >= BOARD_SIZE) return { col: last / 2, row: last / 2 };
  if (i <= last) return { col: i, row: 0 }; // arriba →
  if (i <= 2 * last) return { col: last, row: i - last }; // derecha ↓
  if (i <= 3 * last) return { col: 3 * last - i, row: last }; // abajo ←
  return { col: 0, row: 4 * last - i }; // izquierda ↑
}

/** Qué le toca a quien cae en la casilla, para anunciarlo antes de la carta. */
export function squareAnnouncement(i: number): { title: string; hint: string } {
  const sq = BOARD[i];
  if (!sq) return { title: "¡Corazón!", hint: "Llegó al centro del tablero." };
  switch (sq.kind) {
    case "verdad":
      return { title: "¡Verdad!", hint: "Te toca responder una pregunta." };
    case "reto":
      return { title: "¡Reto!", hint: "Te toca cumplir un reto." };
    case "pareja":
      return { title: "¡Pareja!", hint: "Una carta para hacer entre dos." };
    case "comodin":
      return { title: "¡Comodín!", hint: "Puede salir cualquier carta." };
    case "avanza":
      return { title: `¡Avanza ${sq.steps}!`, hint: "La ficha sigue de largo…" };
    case "retrocede":
      return { title: `¡Retrocede ${sq.steps}!`, hint: "La ficha se devuelve…" };
    case "descanso":
      return { title: "Descanso", hint: "Esta vez no hay carta: pasa el turno." };
    default:
      return { title: "Salida", hint: "De vuelta al inicio: pasa el turno." };
  }
}
