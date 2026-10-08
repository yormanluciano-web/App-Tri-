"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES, GAME_DESCRIPTION, GAME_LABEL, INTENSITIES, INTENSITY_LABEL, MINI_GAMES, type GameId, type Intensity } from "@/domain/models/constants";
import { useSession } from "@/stores/session";
import { testConfig } from "@/features/session/demo";
import { useStartGate } from "@/pwa/StartGate";
import { Button, Card, Chip, Dialog, GameEmblem, Notice, Title, cx } from "@/components/ui";

/**
 * Pestaña «Probar»: entra directo a cualquier juego, sin crear sesión.
 * La lista sale de GAMES, así que los juegos nuevos aparecen solos.
 */
export function GameTester() {
  const router = useRouter();
  const session = useSession((s) => s.session);
  const startSession = useSession((s) => s.startSession);
  const initialConsent = useSession((s) => s.initialConsent);
  const [level, setLevel] = useState<Intensity>("picante");
  const [count, setCount] = useState<2 | 3>(3);
  const [pending, setPending] = useState<GameId | null>(null);
  const { guard, checking, gate } = useStartGate();

  const realSessionActive = !!session && !session.config.prueba && session.status !== "finished" && session.status !== "setup";

  const start = (game: GameId) => {
    startSession(testConfig(game, level, count));
    initialConsent(true);
    router.push("/jugar/");
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <Title sub="Entra directo a cualquier juego para verlo y probarlo. Usa personas ficticias (Ana, Leo y Sol) que aceptan todo, así ves todas las cartas del nivel. Nada se guarda.">Probar juegos</Title>
        <div className="space-y-2">
          <p className="font-semibold">Nivel</p>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITIES.map((l) => (
              <Chip key={l} selected={level === l} onClick={() => setLevel(l)}>
                {INTENSITY_LABEL[l]}
              </Chip>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Jugadores</p>
          <div className="grid grid-cols-2 gap-2">
            <Chip selected={count === 2} onClick={() => setCount(2)}>
              2 (Ana y Leo)
            </Chip>
            <Chip selected={count === 3} onClick={() => setCount(3)}>
              3 (Ana, Leo y Sol)
            </Chip>
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        {GAMES.map((g) => (
          <button
            key={g}
            type="button"
            disabled={checking}
            onClick={() => (realSessionActive ? setPending(g) : guard(() => start(g)))}
            className="glass flex w-full items-center gap-4 rounded-3xl p-4 text-left transition active:scale-[0.98] hover:bg-white/5"
          >
            <GameEmblem theme={g} className="size-12 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-lg font-semibold">{GAME_LABEL[g]}</span>
                {MINI_GAMES.includes(g) && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-gold">Minijuego</span>}
              </span>
              <span className="block text-sm text-muted">{GAME_DESCRIPTION[g]}</span>
            </span>
            <span aria-hidden className={cx("text-2xl text-gold")}>
              ▸
            </span>
          </button>
        ))}
      </div>
      <Notice>Las rondas especiales salen cada 6 rondas: para verlas, prueba «Tarjetas» y juega 6 cartas.</Notice>

      {gate}
      <Dialog open={!!pending} title="Hay una sesión en curso" onClose={() => setPending(null)}>
        <p className="text-muted">Al probar un juego se cerrará la sesión que está abierta en este teléfono.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setPending(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              const g = pending;
              setPending(null);
              if (g) guard(() => start(g));
            }}
          >
            Probar igual
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
