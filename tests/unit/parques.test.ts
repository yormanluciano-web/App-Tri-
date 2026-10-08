import { describe, expect, it } from "vitest";
import { draw } from "@/domain/engine/orchestrator";
import { closeTurn } from "@/domain/state/session";
import { seededRng } from "@/domain/engine/rng";
import { CATALOG } from "@/data/catalog";
import { BOARD, BOARD_SIZE, GRID, cardFor, gridCell, move, squareAnnouncement } from "@/features/games/parques-logic";
import { allLights, config, participant, readySession } from "../helpers";

const two = () => [participant("a", allLights("green")), participant("b", allLights("green"))];

describe("parqués: tablero", () => {
  it("tiene 24 casillas y empieza en la salida", () => {
    expect(BOARD).toHaveLength(BOARD_SIZE);
    expect(BOARD[0].kind).toBe("salida");
  });

  it("avanza lo que marca el dado, casilla por casilla", () => {
    const m = move(0, 2);
    expect(m.path).toEqual([1, 2]);
    expect(m.to).toBe(2);
    expect(m.bonus).toBe(0);
    expect(m.finished).toBe(false);
  });

  it("«avanza» y «retrocede» se aplican una sola vez", () => {
    const fwd = move(0, 3); // cae en «avanza 2» (casilla 3)
    expect(fwd.landed).toBe(3);
    expect(fwd.bonus).toBe(2);
    expect(fwd.to).toBe(5);
    expect(fwd.path).toEqual([1, 2, 3, 4, 5]);

    const back = move(5, 3); // cae en «retrocede 2» (casilla 8)
    expect(back.landed).toBe(8);
    expect(back.to).toBe(6);
    expect(back.path.at(-1)).toBe(6);
  });

  it("llegar o pasar el corazón gana la vuelta", () => {
    const m = move(21, 6);
    expect(m.finished).toBe(true);
    expect(m.to).toBe(BOARD_SIZE);
    expect(m.path.at(-1)).toBe(BOARD_SIZE);
    // El avance extra también puede llevar al corazón.
    expect(move(12, 2).finished).toBe(false);
  });

  it("cada casilla pide su tipo de carta y las de movimiento no traen carta", () => {
    expect(cardFor(1)).toEqual({ formats: ["pregunta"] });
    expect(cardFor(2)).toEqual({ formats: ["reto"] });
    expect(cardFor(4)).toEqual({ interactions: ["pair", "directed_pair"] });
    expect(cardFor(6)).toEqual({});
    expect(cardFor(0)).toBeNull();
    expect(cardFor(11)).toBeNull(); // descanso
    expect(cardFor(BOARD_SIZE)).toBeNull();
  });

  it("nunca se sale del tablero hacia atrás", () => {
    for (let from = 0; from < BOARD_SIZE; from++)
      for (let roll = 1; roll <= 6; roll++) {
        const m = move(from, roll);
        expect(m.to).toBeGreaterThanOrEqual(0);
        expect(m.to).toBeLessThanOrEqual(BOARD_SIZE);
        if (!m.finished) expect(BOARD[m.to].kind === "avanza" || BOARD[m.to].kind === "retrocede").toBe(false);
      }
  });
});

describe("parqués: cartas por el motor", () => {
  it("las casillas de pareja prefieren cartas de pareja del mazo de Tarjetas", () => {
    let s = readySession(config(two(), { initialLevel: "picante", games: ["parques"] }));
    const rng = seededRng(11);
    for (let i = 0; i < 15; i++) {
      s = draw(CATALOG, s, rng, 1000 + i * 60_000, { game: "parques", strictGame: true, interactions: ["pair", "directed_pair"] }).state;
      const t = s.currentTurn!;
      expect(t.game).toBe("parques");
      const a = CATALOG.find((x) => x.id === t.activityId)!;
      expect(a.gameModes).toContain("tarjetas");
      expect(["pair", "directed_pair"]).toContain(a.tipoInteraccion);
      s = closeTurn(s, t.id, "cumplido", 1000 + i * 60_000 + 500);
    }
  });

  it("si no hay cartas de pareja permitidas, usa cualquier carta permitida", () => {
    const s = readySession(config([participant("a"), participant("b")], { initialLevel: "leve", games: ["parques"] }));
    const out = draw(CATALOG, s, seededRng(3), 1000, { game: "parques", strictGame: true, interactions: ["pair", "directed_pair"] });
    expect(out.state.status).toBe("playing");
    expect(out.state.currentTurn!.game).toBe("parques");
  });

  it("verdad trae preguntas y reto trae retos", () => {
    const s = readySession(config(two(), { initialLevel: "leve", games: ["parques"] }));
    for (const f of ["pregunta", "reto"] as const) {
      const out = draw(CATALOG, s, seededRng(5), 1000, { game: "parques", strictGame: true, formats: [f] });
      expect(CATALOG.find((x) => x.id === out.state.currentTurn!.activityId)!.formato).toBe(f);
    }
  });
});

describe("parqués: tablero cuadrado", () => {
  it("las 24 casillas ocupan el borde de 7×7 sin repetirse y el corazón queda al centro", () => {
    const seen = new Set<string>();
    for (let i = 0; i < BOARD_SIZE; i++) {
      const { col, row } = gridCell(i);
      expect(col === 0 || col === GRID - 1 || row === 0 || row === GRID - 1).toBe(true);
      seen.add(`${col},${row}`);
      if (i > 0) {
        const prev = gridCell(i - 1);
        expect(Math.abs(prev.col - col) + Math.abs(prev.row - row)).toBe(1);
      }
    }
    expect(seen.size).toBe(BOARD_SIZE);
    expect(gridCell(BOARD_SIZE)).toEqual({ col: 3, row: 3 });
  });

  it("cada casilla tiene su anuncio", () => {
    expect(squareAnnouncement(1).title).toBe("¡Verdad!");
    expect(squareAnnouncement(3).title).toBe("¡Avanza 2!");
    expect(squareAnnouncement(8).title).toBe("¡Retrocede 2!");
    expect(squareAnnouncement(11).title).toBe("Descanso");
  });
});
