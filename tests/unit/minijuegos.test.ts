import { describe, expect, it } from "vitest";
import { draw } from "@/domain/engine/orchestrator";
import { closeTurn, setGame } from "@/domain/state/session";
import { seededRng } from "@/domain/engine/rng";
import { CATALOG } from "@/data/catalog";
import { allLights, config, participant, readySession } from "../helpers";

const two = () => [participant("a", allLights("green")), participant("b", allLights("green"))];

describe("minijuegos", () => {
  it("la botella prefiere cartas de pareja y el turno queda como «botella»", () => {
    let s = readySession(config(two(), { initialLevel: "picante", games: ["botella"] }));
    const rng = seededRng(4);
    for (let i = 0; i < 25; i++) {
      s = draw(CATALOG, s, rng, 1000 + i * 60_000, { game: "botella", strictGame: true }).state;
      const t = s.currentTurn!;
      expect(t.game).toBe("botella");
      const a = CATALOG.find((x) => x.id === t.activityId)!;
      expect(["pair", "directed_pair"]).toContain(a.tipoInteraccion);
      s = closeTurn(s, t.id, "cumplido", 1000 + i * 60_000 + 500);
    }
  });

  it("si no hay cartas de pareja compatibles, la botella usa cualquier carta permitida", () => {
    // Nadie aceptó coqueteo ni contacto: solo quedan cartas individuales o de grupo.
    const safe = (id: string) => participant(id);
    const s = readySession(config([safe("a"), safe("b")], { initialLevel: "leve", games: ["botella"] }));
    const out = draw(CATALOG, s, seededRng(2), 1000, { game: "botella", strictGame: true });
    expect(out.state.status).toBe("playing");
    expect(out.state.currentTurn!.game).toBe("botella");
  });

  it("torre y rasca toman sus cartas del mazo de Tarjetas", () => {
    for (const game of ["torre", "rasca"] as const) {
      const s = readySession(config(two(), { initialLevel: "leve", games: [game] }));
      const out = draw(CATALOG, s, seededRng(7), 1000, { game, strictGame: true, formats: ["reto"] });
      const a = CATALOG.find((x) => x.id === out.state.currentTurn!.activityId)!;
      expect(a.gameModes).toContain("tarjetas");
      expect(a.formato).toBe("reto");
      expect(out.state.currentGame).toBe(game);
    }
  });

  it("una ronda especial puede usar un minijuego aunque no se eligiera, y luego se vuelve al juego anterior", () => {
    const s = readySession(config(two(), { initialLevel: "leve", games: ["verdad_reto"] }));
    const special = setGame(s, "torre", 1000);
    expect(special.currentGame).toBe("torre");
    const back = setGame(special, "verdad_reto", 2000);
    expect(back.currentGame).toBe("verdad_reto");
    // Un juego normal no elegido sigue sin poder activarse.
    expect(setGame(s, "dados", 1000).currentGame).toBe("verdad_reto");
  });
});
