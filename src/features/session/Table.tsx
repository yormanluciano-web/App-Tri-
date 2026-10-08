"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  GAME_DESCRIPTION,
  GAME_LABEL,
  INTENSITY_LABEL,
  type Category,
  type GameId,
} from "@/domain/models/constants";
import type { SessionState } from "@/domain/models/session";
import { enabledBaseGames, nightPhase } from "@/domain/engine/orchestrator";
import { lowerLevels, nextLevel, remainingMs } from "@/domain/engine/progression";
import { getActivity } from "@/data/catalog";
import { useSession } from "@/stores/session";
import { applyUpdate } from "@/pwa/register";
import { useStartGate } from "@/pwa/StartGate";
import { Button, Card, Chip, Dialog, GameEmblem, Icon, LinkButton, Logo3D, Notice, Screen, Title, cx } from "@/components/ui";
import { GAME_THEME, themeStyle, type ThemeKey } from "@/components/ui/visuals";
import { MusicDirector, MusicStatus } from "@/music/ui";
import { BottleLauncher, BottleRound, ParquesLauncher, ParquesRound, ScratchRound, SpecialRound, TowerLauncher, TowerRound } from "@/features/games/minis";
import { Tilt } from "@/components/ui/tilt";
import { ConsentRound, PrivateRound } from "./PrivateRound";
import { LimitsEditor, SharedLimitsEditor } from "@/features/setup/LimitsEditor";
import { peopleOf, RoleText, useNow } from "@/features/games/common";
import {
  DiceRound,
  RouletteRound,
  StandardRound,
  SurpriseRound,
} from "@/features/games/rounds";

function formatRemaining(ms: number): string {
  const m = Math.ceil(ms / 60_000);
  return m <= 1 ? "menos de 1 min" : `${m} min`;
}

/** Barra superior: Pausa y Detener siempre visibles. */
function TopBar({ session }: { session: SessionState }) {
  const pause = useSession((s) => s.pause);
  const stop = useSession((s) => s.stop);
  const now = useNow();
  const liveActive = session.lastTickAt !== null ? session.activeMs + Math.max(0, now - session.lastTickAt) : session.activeMs;
  const remaining = remainingMs(session.config.durationMin, liveActive);
  const total = session.config.durationMin ? session.config.durationMin * 60_000 : null;
  const isNight = session.config.games.includes("noche");
  return (
    <header className="glass sticky top-0 z-20 -mx-4 space-y-2 rounded-b-[28px] px-4 pb-3 safe-top">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <GameEmblem theme={isNight ? "noche" : session.currentGame} className="size-11 shrink-0" />
          <div className="min-w-0 leading-tight">
            <p className="font-display text-lg font-semibold italic text-gradient">{INTENSITY_LABEL[session.level]}</p>
            <p className="truncate text-xs text-muted">
              {session.config.demo && (
                <span className="mr-1.5 rounded-full border border-gold/60 px-1.5 py-px text-[0.6rem] font-semibold uppercase tracking-widest text-gold">
                  {session.config.prueba ? "Prueba" : "Demo"}
                </span>
              )}
              {isNight ? `Noche completa · ${nightPhase(liveActive)}` : GAME_LABEL[session.currentGame]}
              {remaining !== null ? ` · ${formatRemaining(remaining)}` : ` · ronda ${session.turnCounter + 1}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {session.status !== "paused" && (
            <Button variant="secondary" icon="pause" className="!min-h-11 !px-3 !text-sm" onClick={pause}>
              Pausa
            </Button>
          )}
          <Button variant="danger" icon="stop" className="!min-h-11 !px-3 !text-sm" onClick={stop}>
            Detener
          </Button>
        </div>
      </div>
      {total && remaining !== null && (
        <div className="h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 shadow-[0_0_10px_var(--glow)] transition-[width] duration-1000"
            style={{ width: `${Math.max(0, Math.min(100, 100 - (remaining / total) * 100))}%` }}
          />
        </div>
      )}
    </header>
  );
}

/** Mazo para lanzar una ronda: carta con el color y el emblema del juego, y cartas asomando detrás. */
function BigDraw({ label, hint, theme, onClick, className }: { label: string; hint?: string; theme: ThemeKey; onClick: () => void; className?: string }) {
  return (
    <Tilt max={10} className="w-full px-2 pb-2">
      <div className="deck" style={themeStyle(theme)}>
        <button
          type="button"
          onClick={onClick}
          className={cx(
            "deck-face group relative flex min-h-44 w-full flex-col items-center justify-center gap-2 p-5 text-center transition duration-200 active:scale-[0.97]",
            className,
          )}
        >
          <span aria-hidden className="absolute left-4 top-3 font-display text-lg font-bold text-white/85">
            {GAME_THEME[theme].suit}
          </span>
          <span aria-hidden className="absolute bottom-3 right-4 rotate-180 font-display text-lg font-bold text-white/85">
            {GAME_THEME[theme].suit}
          </span>
          <GameEmblem theme={theme} className="size-16 transition duration-300 group-hover:scale-110 group-hover:rotate-6" />
          <span className="font-display text-3xl font-semibold italic">{label}</span>
          {hint && (
            <span aria-hidden className="text-sm font-medium uppercase tracking-[0.2em] text-white/85">
              {hint}
            </span>
          )}
        </button>
      </div>
    </Tilt>
  );
}

/** Lanzador de la ronda según el juego actual. */
function Launcher({ session }: { session: SessionState }) {
  const draw = useSession((s) => s.draw);
  const exitChain = useSession((s) => s.exitChain);
  const [cats, setCats] = useState<Category[]>([]);
  const game = session.currentGame;
  const meta = session.config.games.includes("noche") || session.config.games.includes("caos");
  const onlySurprise = session.config.games.length === 1 && session.config.games[0] === "sorpresa";
  const effective: GameId = onlySurprise ? "tarjetas" : game;

  if (meta) {
    const night = session.config.games.includes("noche");
    return (
      <div className="flex flex-1 flex-col justify-center gap-4 animate-in">
        <p className="text-center text-muted">{night ? "La noche elige el juego de cada ronda." : "Caos elige juego, persona y carta sin patrón fijo."}</p>
        <BigDraw label="Siguiente ronda" hint={night ? "Noche completa" : "Caos"} theme={night ? "noche" : "caos"} onClick={() => draw()} />
      </div>
    );
  }

  const body = (() => {
    switch (effective) {
      case "verdad_reto":
        return (
          <div className="grid grid-cols-2 gap-3">
            <BigDraw label="Verdad" hint="Pregunta" theme="verdad" onClick={() => draw({ game: "verdad_reto", formats: ["pregunta"] })} />
            <BigDraw label="Reto" hint="Desafío" theme="reto" onClick={() => draw({ game: "verdad_reto", formats: ["reto"] })} />
          </div>
        );
      case "ruleta":
        return <BigDraw label="Girar la ruleta" theme="ruleta" onClick={() => draw({ game: "ruleta" })} />;
      case "dados":
        return <BigDraw label="Lanzar los dados" theme="dados" onClick={() => draw({ game: "dados" })} />;
      case "tarjetas":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted">Filtrar por categoría (opcional):</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c !== "sorpresa" && c !== "secretos").map((c) => (
                <Chip key={c} selected={cats.includes(c)} onClick={() => setCats((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}>
                  {CATEGORY_LABEL[c]}
                </Chip>
              ))}
            </div>
            <BigDraw label="Sacar carta" theme="tarjetas" onClick={() => draw({ game: "tarjetas", categories: cats, strictGame: cats.length > 0 })} />
          </div>
        );
      case "temporizador":
        return <BigDraw label="Siguiente reto con reloj" theme="temporizador" onClick={() => draw({ game: "temporizador" })} />;
      case "cadena":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cx(
                    "h-2 w-10 rounded-full transition",
                    session.chain && i < session.chain.stage ? "bg-gradient-to-r from-accent to-accent-2" : session.chain && i === session.chain.stage ? "bg-accent/60" : "bg-white/10",
                  )}
                />
              ))}
            </div>
            <p className="text-center text-muted">{session.chain ? `Etapa ${session.chain.stage + 1} de 3` : "Tres etapas progresivas. Cada una se puede pasar."}</p>
            <BigDraw label={session.chain ? "Siguiente etapa" : "Empezar cadena"} theme="cadena" onClick={() => draw({ game: "cadena" })} />
            {session.chain && (
              <Button variant="ghost" block onClick={exitChain}>
                Salir de la cadena
              </Button>
            )}
          </div>
        );
      case "torre":
        return <TowerLauncher session={session} />;
      case "botella":
        return <BottleLauncher session={session} />;
      case "parques":
        return <ParquesLauncher session={session} />;
      case "rasca":
        return <BigDraw label="Sacar carta" hint="y rasparla" theme="rasca" onClick={() => draw({ game: "rasca", strictGame: true })} />;
      default:
        return <BigDraw label="Siguiente" theme="sorpresa" onClick={() => draw()} />;
    }
  })();

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 animate-in">
      <SpecialRound session={session} />
      <div className="text-center">
        <p className="foil-text text-xs font-semibold uppercase tracking-[0.3em]">Tu turno</p>
        <h2 className="text-3xl font-semibold italic">{GAME_LABEL[effective]}</h2>
        <p className="text-sm text-muted">{GAME_DESCRIPTION[effective]}</p>
      </div>
      {body}
    </div>
  );
}

/** Ronda activa: delega en el controlador del juego de la carta. */
function Round({ session }: { session: SessionState }) {
  const turn = session.currentTurn!;
  const activity = getActivity(turn.activityId);
  if (!activity) return <Notice tone="warn">La actividad ya no está disponible.</Notice>;
  const props = { session, turn, activity };
  if (turn.game === "sorpresa") return <SurpriseRound key={turn.id} {...props} />;
  if (turn.game === "ruleta") return <RouletteRound key={turn.id} {...props} />;
  if (turn.game === "dados") return <DiceRound key={turn.id} {...props} />;
  if (turn.game === "torre") return <TowerRound key={turn.id} {...props} />;
  if (turn.game === "botella") return <BottleRound key={turn.id} {...props} />;
  if (turn.game === "rasca") return <ScratchRound key={turn.id} {...props} />;
  if (turn.game === "parques") return <ParquesRound key={turn.id} {...props} />;
  return <StandardRound key={turn.id} {...props} />;
}

function ActivityConsent({ session }: { session: SessionState }) {
  const activityConsent = useSession((s) => s.activityConsent);
  const change = useSession((s) => s.change);
  const [asking, setAsking] = useState(false);
  const turn = session.currentTurn!;
  const activity = getActivity(turn.activityId);
  if (!activity) return null;
  const askees = peopleOf(session, turn.consentAskees);
  if (!asking) {
    return (
      <Card glow className="space-y-4 animate-deal">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Antes de empezar</p>
        <h2 className="text-3xl font-semibold italic">
          <RoleText text={activity.titulo} session={session} turn={turn} />
        </h2>
        <p className="text-lg">
          <RoleText text={activity.texto} session={session} turn={turn} />
        </p>
        <p className="text-muted">Esta actividad necesita la autorización privada de las personas implicadas. Solo empieza si todas dicen que sí.</p>
        <Button block size="lg" icon="lock" onClick={() => setAsking(true)}>
          Preguntar en privado
        </Button>
        <Button variant="ghost" block onClick={change}>
          Elegir otra
        </Button>
      </Card>
    );
  }
  return (
    <ConsentRound
      people={askees}
      title="Autorización"
      question={<RoleText text={activity.texto} session={session} turn={turn} />}
      detail="¿Quieres hacer esta actividad ahora?"
      onCancel={() => setAsking(false)}
      onResult={(ok) => activityConsent(ok)}
    />
  );
}

function LevelConsent({ session }: { session: SessionState }) {
  const levelUpResult = useSession((s) => s.levelUpResult);
  const target = nextLevel(session.level);
  const [asking, setAsking] = useState(false);
  if (!target) return null;
  if (!asking) {
    return (
      <Card glow className="space-y-4 py-8 text-center animate-deal">
        <span aria-hidden className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-accent-ink shadow-[0_0_30px_var(--glow)] animate-heartbeat">
          <Icon name="flame" className="size-8" />
        </span>
        <h2 className="text-3xl font-semibold">¿Todos quieren subir la intensidad?</h2>
        <p className="text-muted">
          De {INTENSITY_LABEL[session.level]} a {INTENSITY_LABEL[target]}. Cada persona responde en privado; si alguien no quiere, se mantiene el nivel actual y nadie
          sabrá quién fue.
        </p>
        <Button block size="lg" icon="lock" onClick={() => setAsking(true)}>
          Empezar ronda privada
        </Button>
        <Button variant="ghost" block onClick={() => levelUpResult(false)}>
          Cancelar la propuesta
        </Button>
      </Card>
    );
  }
  return (
    <ConsentRound
      people={peopleOf(session)}
      title="Subir intensidad"
      question={`¿Quieres subir a ${INTENSITY_LABEL[target]}?`}
      onResult={(ok) => levelUpResult(ok)}
    />
  );
}

function LimitsReview({ session, onDone }: { session: SessionState; onDone: () => void }) {
  const updateLimits = useSession((s) => s.updateLimits);
  const updateShared = useSession((s) => s.updateShared);
  const [mode, setMode] = useState<"menu" | "individual" | "shared">("menu");
  const people = peopleOf(session);
  if (mode === "individual") {
    return (
      <PrivateRound<{ limits: SessionState["config"]["participants"][number]["limits"] } | null>
        people={people}
        title="Revisar límites"
        onCancel={() => setMode("menu")}
        renderPrivate={(p, submit) => {
          const part = session.config.participants.find((x) => x.id === p.id)!;
          return (
            <div className="space-y-3">
              <LimitsEditor
                person={p}
                others={people.filter((o) => o.id !== p.id)}
                initial={part.limits}
                initialPrefs={part.preferences}
                requireChoice={false}
                submitLabel="Guardar cambios"
                onDone={(limits) => submit({ limits })}
              />
              <Button variant="ghost" block onClick={() => submit(null)}>
                Dejarlos como están
              </Button>
            </div>
          );
        }}
        onComplete={(answers) => {
          for (const [pid, a] of answers.entries()) if (a) updateLimits(pid, a.limits);
          answers.clear();
          onDone();
        }}
      />
    );
  }
  if (mode === "shared") {
    return (
      <SharedLimitsEditor
        submitLabel="Guardar"
        initial={session.config.sharedLimits}
        onDone={(s) => {
          updateShared(s);
          onDone();
        }}
      />
    );
  }
  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-bold">Revisar límites</h2>
      <p className="text-muted">Cualquier cambio descarta la carta actual y las autorizaciones anteriores.</p>
      <Button block onClick={() => setMode("individual")}>
        Lo que acepta cada persona (pasando el teléfono)
      </Button>
      <Button variant="secondary" block onClick={() => setMode("shared")}>
        Lo que nadie quiere en la sesión
      </Button>
      <Button variant="ghost" block onClick={onDone}>
        Volver
      </Button>
    </Card>
  );
}

function PausePanel({ session, onFinish }: { session: SessionState; onFinish: () => void }) {
  const resume = useSession((s) => s.resume);
  const dismissStop = useSession((s) => s.dismissStop);
  const lower = useSession((s) => s.lowerLevel);
  const requestLevelUp = useSession((s) => s.requestLevelUp);
  const setGame = useSession((s) => s.setGame);
  const updateReady = useSession((s) => s.updateReady);
  const [view, setView] = useState<"main" | "limits" | "games">("main");
  const games = enabledBaseGames(session);

  if (session.stopped && view === "main") {
    return (
      <Card glow className="space-y-4 py-8 text-center animate-deal">
        <span aria-hidden className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/10 text-accent">
          <Icon name="stop" className="size-7" />
        </span>
        <h2 className="text-3xl font-semibold">Actividad detenida</h2>
        <p className="text-muted">Todo está en pausa. Pueden terminar la sesión o volver a la pausa.</p>
        <Button variant="danger" size="lg" icon="x" block onClick={onFinish}>
          Terminar sesión
        </Button>
        <Button variant="secondary" size="lg" icon="pause" block onClick={dismissStop}>
          Volver a la pausa
        </Button>
      </Card>
    );
  }
  if (view === "limits") return <LimitsReview session={session} onDone={() => setView("main")} />;
  if (view === "games") {
    return (
      <Card className="space-y-3 animate-deal">
        <h2 className="text-2xl font-semibold">Cambiar juego</h2>
        {games.map((g) => (
          <Button
            key={g}
            variant={g === session.currentGame ? "primary" : "secondary"}
            block
            onClick={() => {
              setGame(g);
              setView("main");
            }}
          >
            {GAME_LABEL[g]}
          </Button>
        ))}
        <Button variant="ghost" block onClick={() => setView("main")}>
          Volver
        </Button>
      </Card>
    );
  }
  return (
    <Card glow className="space-y-3 animate-deal">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-accent">
          <Icon name="pause" className="size-6" />
        </span>
        <h2 className="text-3xl font-semibold">Pausa</h2>
      </div>
      <p className="text-muted">El contenido está oculto y el reloj congelado.</p>
      {session.notice && <Notice>{session.notice}</Notice>}
      <Button block size="lg" icon="play" className="pulse-glow" onClick={resume}>
        Continuar
      </Button>
      {lowerLevels(session.level).map((l) => (
        <Button key={l} variant="secondary" icon="arrowDown" block onClick={() => lower(l)}>
          Bajar a {INTENSITY_LABEL[l]}
        </Button>
      ))}
      {nextLevel(session.level) && (
        <Button variant="secondary" icon="arrowUp" block onClick={requestLevelUp}>
          Proponer subir intensidad
        </Button>
      )}
      {games.length > 1 && !session.config.games.includes("noche") && !session.config.games.includes("caos") && (
        <Button variant="secondary" icon="shuffle" block onClick={() => setView("games")}>
          Cambiar juego
        </Button>
      )}
      <Button variant="secondary" icon="shield" block onClick={() => setView("limits")}>
        Revisar límites
      </Button>
      {updateReady && (
        <Button variant="ghost" block onClick={applyUpdate}>
          Hay una actualización: aplicar ahora
        </Button>
      )}
      <Button variant="danger" icon="x" block onClick={onFinish}>
        Terminar sesión
      </Button>
    </Card>
  );
}

function Blocked({ session }: { session: SessionState }) {
  const draw = useSession((s) => s.draw);
  const unblock = useSession((s) => s.unblock);
  const lower = useSession((s) => s.lowerLevel);
  const pause = useSession((s) => s.pause);
  const exhausted = session.notice?.startsWith("Ya se mostraron");
  return (
    <Card glow className="space-y-3 animate-deal">
      <h2 className="text-2xl font-semibold">Sin actividades disponibles</h2>
      <p className="text-muted">
        {session.notice} Nunca ampliamos permisos para conseguir más cartas.
      </p>
      {exhausted && (
        <Button
          block
          onClick={() => {
            unblock();
            draw({ allowRepeat: true });
          }}
        >
          Permitir repetir cartas
        </Button>
      )}
      {lowerLevels(session.level).map((l) => (
        <Button key={l} variant="secondary" block onClick={() => lower(l)}>
          Bajar a {INTENSITY_LABEL[l]}
        </Button>
      ))}
      <Button
        variant="secondary"
        block
        onClick={() => {
          unblock();
          pause();
        }}
      >
        Cambiar juego o revisar límites
      </Button>
    </Card>
  );
}

function Closing({ session }: { session: SessionState }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const { guard, checking, gate } = useStartGate();
  const updateReady = useSession((s) => s.updateReady);
  const completed = Object.values(session.stats.completed).reduce((a, b) => a + b, 0);
  return (
    <Screen level={session.level} className="justify-center text-center">
      <MusicDirector session={session} />
      <div className="relative mx-auto size-28">
        <div aria-hidden className="absolute inset-3 rounded-full bg-[radial-gradient(circle,var(--glow),transparent_70%)] blur-2xl" />
        <Logo3D className="relative size-28 animate-float" />
      </div>
      {session.config.prueba && (
        <LinkButton href="/admin/" variant="secondary" icon="back">
          Volver al panel de pruebas
        </LinkButton>
      )}
      <Title sub={session.config.prueba ? "Prueba terminada." : session.config.demo ? "Así se juega Cómplice. Crea tu propia sesión para elegir nombres, límites y nivel." : session.config.mode === "private" ? "Los datos de esta sesión privada se descartaron." : "La sesión terminó y se eliminó del dispositivo."}>Gracias por jugar</Title>
      {show ? (
        <Card glow className="animate-deal">
          <dl className="grid grid-cols-2 gap-4">
            {[
              ["Rondas", session.turnCounter],
              ["Cumplidas", completed],
              ["Intensidad", INTENSITY_LABEL[session.level]],
              ["Minutos", Math.round(session.activeMs / 60_000)],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl bg-white/5 p-3">
                <dt className="text-xs uppercase tracking-widest text-muted">{label}</dt>
                <dd className="font-display text-3xl font-semibold italic text-gradient">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : (
        <Button variant="secondary" icon="sparkle" onClick={() => setShow(true)}>
          Ver resumen (sin detalles privados)
        </Button>
      )}
      {updateReady && (
        <Button variant="ghost" onClick={applyUpdate}>
          Aplicar actualización
        </Button>
      )}
      <Button size="lg" icon="flame" className="pulse-glow" disabled={checking} onClick={() => guard(() => router.push("/crear/"))}>
        Nueva sesión
      </Button>
      {gate}
      <LinkButton href="/" variant="ghost">
        Salir
      </LinkButton>
    </Screen>
  );
}

export function Table() {
  const session = useSession((s) => s.session);
  const hydrated = useSession((s) => s.hydrated);
  const lockedElsewhere = useSession((s) => s.lockedElsewhere);
  const takeControl = useSession((s) => s.takeControl);
  const finish = useSession((s) => s.finish);
  const draw = useSession((s) => s.draw);
  const clearNotice = useSession((s) => s.clearNotice);
  const storageIssue = useSession((s) => s.storageIssue);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [timeUpDismissed, setTimeUpDismissed] = useState(false);
  const lastSelecting = useRef<string | null>(null);
  const now = useNow();

  // Tras Cambiar o un rechazo, se elige otra actividad del mismo juego automáticamente.
  useEffect(() => {
    if (!session || session.status !== "selecting") return;
    const key = `${session.id}:${session.version}`;
    if (lastSelecting.current === key) return;
    lastSelecting.current = key;
    const prev = session.currentTurn;
    const t = setTimeout(() => draw(prev ? { game: prev.game === "sorpresa" ? undefined : prev.game, skipSurprise: true } : {}), 600);
    return () => clearTimeout(t);
  }, [session, draw]);

  if (!hydrated) return <Screen><p className="text-muted">Cargando…</p></Screen>;

  if (!session || session.status === "setup") {
    return (
      <Screen className="justify-center">
        <Title sub="Puede que la sesión fuera privada o que se haya terminado.">No hay una sesión activa</Title>
        <LinkButton href="/crear/">Nueva sesión</LinkButton>
        <LinkButton href="/" variant="ghost">
          Inicio
        </LinkButton>
      </Screen>
    );
  }
  if (session.status === "finished") return <Closing session={session} />;

  if (lockedElsewhere) {
    return (
      <Screen className="justify-center">
        <Title sub="Para evitar conflictos, solo una ventana puede jugar la sesión a la vez.">Esta sesión está abierta en otra ventana</Title>
        <Button onClick={() => void takeControl()}>Tomar el control aquí</Button>
        <LinkButton href="/" variant="ghost">
          Inicio
        </LinkButton>
      </Screen>
    );
  }

  const liveActive = session.lastTickAt !== null ? session.activeMs + Math.max(0, now - session.lastTickAt) : session.activeMs;
  const remaining = remainingMs(session.config.durationMin, liveActive);
  const timeUp = remaining === 0 && !timeUpDismissed && session.status === "ready";

  const onFinish = () => setConfirmFinish(true);

  let body: React.ReactNode;
  switch (session.status) {
    case "awaitingInitialConsent":
      body = <Notice>Falta el consentimiento inicial. Vuelvan a crear la sesión.</Notice>;
      break;
    case "paused":
      body = <PausePanel session={session} onFinish={onFinish} />;
      break;
    case "awaitingLevelConsent":
      body = <LevelConsent session={session} />;
      break;
    case "awaitingActivityConsent":
      body = <ActivityConsent key={session.currentTurn?.id} session={session} />;
      break;
    case "blocked":
      body = <Blocked session={session} />;
      break;
    case "selecting":
      body = (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Icon name="cards" className="size-12 text-accent animate-float" />
          <p className="font-display text-2xl italic" role="status">
            {session.notice ?? "Eligiendo otra actividad…"}
          </p>
        </div>
      );
      break;
    case "playing":
    case "roundReveal":
      body = session.currentTurn && session.currentTurn.status !== "closed" ? <Round session={session} /> : <Launcher session={session} />;
      break;
    default:
      body = (
        <>
          {session.notice && (
            <Notice>
              {session.notice}{" "}
              <button className="underline" onClick={clearNotice}>
                Entendido
              </button>
            </Notice>
          )}
          {timeUp ? (
            <Card glow className="space-y-3 text-center animate-deal">
              <h2 className="text-2xl font-semibold">Se cumplió el tiempo previsto</h2>
              <p className="text-muted">Pueden cerrar aquí o seguir un poco más, sin presión.</p>
              <Button block onClick={onFinish}>
                Terminar sesión
              </Button>
              <Button variant="secondary" block onClick={() => setTimeUpDismissed(true)}>
                Seguir jugando
              </Button>
            </Card>
          ) : (
            <Launcher session={session} />
          )}
        </>
      );
  }

  return (
    <Screen level={session.level} className="gap-4">
      <TopBar session={session} />
      <MusicDirector session={session} />
      <MusicStatus />
      {session.config.prueba ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-2 text-sm">
          <span className="text-muted">Modo prueba · personas ficticias que aceptan todo</span>
          <Link href="/admin/" className="shrink-0 font-semibold text-gold underline underline-offset-2">
            Volver al panel
          </Link>
        </div>
      ) : (
        session.config.demo &&
        session.turnCounter === 0 &&
        session.status === "ready" && <Notice>Demo con dos personas ficticias (Ana y Leo) y cartas suaves sin contacto. Nada se guarda.</Notice>
      )}
      {storageIssue === "quota" && <Notice tone="warn">No se pudo guardar en el dispositivo. Pueden seguir jugando; la sesión continúa en memoria.</Notice>}
      <div className="flex flex-1 flex-col gap-4">{body}</div>
      <Dialog open={confirmFinish} title="¿Terminar la sesión?" onClose={() => setConfirmFinish(false)}>
        <p className="text-muted">
          {session.config.mode === "private" ? "Se descartarán todos los datos de esta sesión privada." : "Se eliminará la sesión guardada en este dispositivo."}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setConfirmFinish(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmFinish(false);
              void finish();
            }}
          >
            Terminar
          </Button>
        </div>
      </Dialog>
    </Screen>
  );
}
