"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { create } from "zustand";
import type { Activity } from "@/domain/models/activity";
import { GAME_LABEL, MINI_GAMES, PARTICIPANT_COLORS, type Format, type GameId, type Interaction } from "@/domain/models/constants";
import { BOARD, BOARD_SIZE, GRID, SQUARE_STYLE, cardFor, gridCell, move, squareAnnouncement, type SquareKind } from "./parques-logic";
import type { SessionState, Turn } from "@/domain/models/session";
import { useSession } from "@/stores/session";
import { GameEmblem, Notice, ParticipantTag, cx } from "@/components/ui";
import { GAME_THEME, themeStyle } from "@/components/ui/visuals";
import { ActionBar, ActivityCard, TimerControl, peopleOf } from "./common";

function reducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return document.documentElement.dataset.motion === "reduce" || (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, reducedMotion() ? 0 : ms));

// ------------------------------------------------------------------ estado de mesa (solo memoria)

type BlockKind = "verdad" | "reto" | "comodin";

interface MiniState {
  sessionId: string | null;
  /** Bloques sacados de la torre (índices). */
  pulled: number[];
  /** La última carta de la torre vino de un derrumbe. */
  collapsed: boolean;
  /** Turno dentro de la torre: índice de la persona que saca el próximo bloque. */
  puller: number;
  /** Quién tumbó la torre (para mostrarlo con la carta). */
  toppledBy: string | null;
  /** Parqués: casilla de cada ficha, turno y la última jugada (para mostrarla con la carta). */
  parques: { pos: Record<string, number>; turn: number; last: string | null };
  /** Ronda especial en curso: a qué juego volver y desde qué ronda. */
  special: { returnTo: GameId; atTurn: number } | null;
  /** Ronda en la que se dijo «Ahora no» a la ronda especial. */
  dismissedAt: number | null;
  reset(sessionId: string): void;
  set(p: Partial<MiniState>): void;
}

/** Estado de los minijuegos: solo en memoria (nunca se guarda en el dispositivo). */
export const useMinis = create<MiniState>((set) => ({
  sessionId: null,
  pulled: [],
  collapsed: false,
  puller: 0,
  toppledBy: null,
  parques: { pos: {}, turn: 0, last: null },
  special: null,
  dismissedAt: null,
  reset(sessionId) {
    set({ sessionId, pulled: [], collapsed: false, puller: 0, toppledBy: null, parques: { pos: {}, turn: 0, last: null }, special: null, dismissedAt: null });
  },
  set(p) {
    set(p);
  },
}));

function useMinisFor(session: SessionState) {
  const sessionId = useMinis((s) => s.sessionId);
  const reset = useMinis((s) => s.reset);
  useEffect(() => {
    if (sessionId !== session.id) reset(session.id);
  }, [sessionId, session.id, reset]);
}

// ------------------------------------------------------------------ rondas especiales

/** Cada cuántas rondas se ofrece un minijuego como ronda especial. */
export const SPECIAL_EVERY = 6;

export function specialFor(session: SessionState): GameId | null {
  if (session.turnCounter === 0 || session.turnCounter % SPECIAL_EVERY !== 0) return null;
  if (MINI_GAMES.includes(session.currentGame)) return null;
  const options = MINI_GAMES.filter((g) => g !== session.currentGame);
  return options[(session.turnCounter / SPECIAL_EVERY - 1) % options.length] ?? null;
}

/** Aviso «¡Ronda especial!» y regreso automático al juego anterior al terminarla. */
export function SpecialRound({ session }: { session: SessionState }) {
  useMinisFor(session);
  const setGame = useSession((s) => s.setGame);
  const special = useMinis((s) => s.special);
  const dismissedAt = useMinis((s) => s.dismissedAt);
  const set = useMinis((s) => s.set);

  // Al cerrar la carta de la ronda especial, se vuelve al juego en que estaban.
  useEffect(() => {
    if (special && session.status === "ready" && session.turnCounter > special.atTurn) {
      set({ special: null });
      setGame(special.returnTo);
    }
  }, [special, session.status, session.turnCounter, set, setGame]);

  const mini = specialFor(session);
  if (!mini || special || dismissedAt === session.turnCounter) return null;
  const theme = GAME_THEME[mini];
  return (
    <div className="deck animate-deal" style={themeStyle(mini)}>
      <div className="deck-face flex items-center gap-4 p-4" role="region" aria-label="Ronda especial">
        <GameEmblem theme={mini} className="size-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-white/85">{theme.suit} Ronda especial</p>
          <p className="font-display text-2xl font-semibold italic">{GAME_LABEL[mini]}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#2a0410] shadow"
              onClick={() => {
                set({ special: { returnTo: session.currentGame, atTurn: session.turnCounter } });
                setGame(mini);
              }}
            >
              ¡A jugar!
            </button>
            <button type="button" className="rounded-full border border-white/60 px-4 py-2 text-sm" onClick={() => set({ dismissedAt: session.turnCounter })}>
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Torre del deseo

const LAYERS = 6;
const PER_LAYER = 3;
const TOTAL = LAYERS * PER_LAYER;

const BLOCK_COLOR: Record<BlockKind, { from: string; to: string; label: string }> = {
  verdad: { from: "#9b5cff", to: "#ff4fa3", label: "Verdad" },
  reto: { from: "#ff2e63", to: "#ff8a3d", label: "Reto" },
  comodin: { from: "#f5c76b", to: "#d4a23a", label: "Comodín" },
};

/** Patrón fijo de colores: más retos abajo, más verdades arriba, comodines repartidos. */
export function blockKind(i: number): BlockKind {
  if (i % 7 === 3) return "comodin";
  return (i + Math.floor(i / PER_LAYER)) % 2 === 0 ? "verdad" : "reto";
}

/**
 * Probabilidad de que la torre caiga al sacar un bloque: empieza en cero, crece
 * con cada bloque sacado y es segura si una capa queda sostenida por un solo
 * bloque lateral. En promedio cae entre el 7.º y el 11.º bloque.
 */
export function collapseChance(pulledBefore: readonly number[], next: number): number {
  const pulled = [...pulledBefore, next];
  const layer = Math.floor(next / PER_LAYER);
  const left = [0, 1, 2].filter((k) => !pulled.includes(layer * PER_LAYER + k));
  if (left.length === 0 || (left.length === 1 && left[0] !== 1)) return 1;
  return Math.min(0.55, Math.max(0, pulled.length - 3) * 0.05);
}

/**
 * Torre del deseo: se sacan bloques por turnos, sin cartas. Cuando alguien
 * tumba la torre, le toca una carta a esa persona y el color del bloque que la
 * tumbó decide si es verdad, reto o comodín.
 */
export function TowerLauncher({ session }: { session: SessionState }) {
  useMinisFor(session);
  const draw = useSession((s) => s.draw);
  const setPending = useSession((s) => s.setPending);
  const pulled = useMinis((s) => s.pulled);
  const puller = useMinis((s) => s.puller);
  const set = useMinis((s) => s.set);
  const [moving, setMoving] = useState<number | null>(null);
  const [falling, setFalling] = useState(false);
  const [shake, setShake] = useState(false);
  const busy = moving !== null || falling;
  const risk = Math.min(1, pulled.length / 10);
  const people = peopleOf(session);
  const current = people[puller % people.length];

  const pull = async (i: number) => {
    if (busy || pulled.includes(i)) return;
    setMoving(i);
    await wait(650);
    const falls = Math.random() < collapseChance(pulled, i);
    if (!falls) {
      // Sobrevivió: sacudida breve y turno de la siguiente persona.
      set({ pulled: [...pulled, i], puller: puller + 1, collapsed: false });
      setMoving(null);
      setShake(true);
      await wait(450);
      setShake(false);
      return;
    }
    setFalling(true);
    await wait(1500);
    set({ pulled: [], collapsed: true, toppledBy: current.alias, puller: puller + 1 });
    setFalling(false);
    setMoving(null);
    const kind = blockKind(i);
    const formats: readonly Format[] | undefined = kind === "verdad" ? ["pregunta"] : kind === "reto" ? ["reto"] : undefined;
    // La carta es para quien tumbó la torre (si no hay una compatible, el motor elige a otra persona).
    setPending({ forcedProtagonist: current.id });
    draw({ game: "torre", strictGame: true, formats });
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-lg" aria-live="polite">
        {falling ? (
          <span className="font-display text-2xl font-semibold italic text-gradient">¡{current.alias} tumbó la torre!</span>
        ) : (
          <>
            Turno de <ParticipantTag alias={current.alias} slot={current.slot} />: saca un bloque
          </>
        )}
      </p>
      <div className="flex justify-center gap-3 text-xs font-semibold uppercase tracking-widest" aria-hidden>
        {(Object.keys(BLOCK_COLOR) as BlockKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-muted">
            <span className="size-3 rounded-sm" style={{ background: `linear-gradient(135deg, ${BLOCK_COLOR[k].from}, ${BLOCK_COLOR[k].to})` }} />
            {BLOCK_COLOR[k].label}
          </span>
        ))}
      </div>
      <div className="scene-3d flex justify-center py-2">
        <div
          className={cx("tower", falling && "tower-fall", !falling && shake && "tower-shake", !falling && !shake && risk > 0.25 && "tower-wobble")}
          style={{ ["--wobble" as string]: `${0.5 + risk * 2.2}deg` }}
          role="group"
          aria-label={`Torre del deseo: quedan ${TOTAL - pulled.length} bloques`}
        >
          {Array.from({ length: LAYERS }, (_, li) => {
            const layer = LAYERS - 1 - li; // de arriba hacia abajo
            const cross = layer % 2 === 1;
            return (
              <div key={layer} className={cx("tower-layer", cross && "cross")}>
                {[0, 1, 2].map((k) => {
                  const i = layer * PER_LAYER + k;
                  const kind = blockKind(i);
                  const gone = pulled.includes(i);
                  const c = BLOCK_COLOR[kind];
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={busy || gone}
                      aria-label={`Bloque ${BLOCK_COLOR[kind].label.toLowerCase()} de la capa ${layer + 1}`}
                      onClick={() => void pull(i)}
                      className={cx("tower-block", gone && "gone", moving === i && "pulling")}
                      style={{
                        background: `linear-gradient(160deg, rgba(255,255,255,0.35), transparent 45%), linear-gradient(135deg, ${c.from}, ${c.to})`,
                        ["--fall-x" as string]: `${(k - 1) * 80 + (layer % 3) * 17 - 17}px`,
                        ["--fall-r" as string]: `${(k - 1) * 55 + layer * 13 - 30}deg`,
                        ["--fall-d" as string]: `${(LAYERS - layer) * 70}ms`,
                      }}
                    >
                      {kind === "comodin" && <span aria-hidden>★</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div className="tower-base" aria-hidden />
        </div>
      </div>
      <p className="text-center text-sm text-muted">
        {pulled.length === 0
          ? "Saquen bloques por turnos. A quien tumbe la torre le toca carta: el color del bloque decide verdad, reto o comodín."
          : `Bloques fuera: ${pulled.length}. La torre tiembla cada vez más…`}
      </p>
    </div>
  );
}

/** Carta de la torre: igual que una estándar, con aviso de quién la tumbó. */
export function TowerRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const collapsed = useMinis((s) => s.collapsed);
  const toppledBy = useMinis((s) => s.toppledBy);
  return (
    <>
      {collapsed && (
        <p className="text-center font-display text-2xl font-semibold italic text-gradient animate-pop" role="status">
          {toppledBy ? `¡${toppledBy} tumbó la torre!` : "¡La torre se cayó!"}
        </p>
      )}
      <ActivityCard session={session} turn={turn} activity={activity}>
        {activity.duracion && <TimerControl session={session} activity={activity} />}
      </ActivityCard>
      <ActionBar />
    </>
  );
}

// ------------------------------------------------------------------ La botella

/** Ángulo (grados, 0 = arriba) de cada persona alrededor de la botella. */
export function seatAngle(index: number, count: number): number {
  return (360 / count) * index;
}

/** Duración del giro: largo, con frenado lento para dar suspenso. */
export const BOTTLE_SPIN_MS = 5500;

type Seat = { id: string; alias: string; slot: number };

/** Mesa con los jugadores en círculo y la botella al centro. */
function BottleScene({
  people,
  rotation,
  spinning,
  highlight,
  onSpin,
}: {
  people: Seat[];
  rotation: { from: number; to: number } | null;
  spinning: boolean;
  highlight: string | null;
  onSpin?: () => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return (
    <div className="relative mx-auto size-72" style={themeStyle("botella")}>
      <div className="absolute inset-4 rounded-full border border-[#2dd4bf]/25 bg-[radial-gradient(circle,rgba(45,212,191,0.2),transparent_70%)]" aria-hidden />
      {people.map((p, i) => {
        const a = (seatAngle(i, people.length) - 90) * (Math.PI / 180);
        const lit = highlight === p.id;
        return (
          <span
            key={p.id}
            className={cx(
              "absolute flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-xl font-semibold italic text-[#1a0612] transition duration-500",
              lit && "scale-125 ring-4 ring-gold animate-pop",
              highlight && !lit && "opacity-50",
            )}
            style={{
              left: `${50 + 42 * Math.cos(a)}%`,
              top: `${50 + 42 * Math.sin(a)}%`,
              background: `radial-gradient(circle at 30% 30%, #fff8, ${PARTICIPANT_COLORS[p.slot]})`,
              boxShadow: `0 0 ${lit ? 40 : 24}px ${PARTICIPANT_COLORS[p.slot]}${lit ? "" : "99"}`,
            }}
            aria-hidden
          >
            {p.alias.charAt(0).toUpperCase()}
          </span>
        );
      })}
      <button
        type="button"
        aria-label="Girar la botella"
        disabled={!onSpin}
        onClick={() => onSpin?.()}
        onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          // Un deslizamiento sobre la botella también la hace girar.
          const s0 = start.current;
          start.current = null;
          if (s0 && onSpin && Math.hypot(e.clientX - s0.x, e.clientY - s0.y) > 24) onSpin();
        }}
        className="absolute inset-0 m-auto size-44 touch-none rounded-full disabled:cursor-default"
        data-no-tilt
      >
        <svg
          viewBox="-50 -50 100 100"
          className={cx("size-full", spinning && "bottle-spin")}
          style={
            rotation
              ? ({ ["--spin-from" as string]: `${rotation.from}deg`, ["--spin-to" as string]: `${rotation.to}deg`, transform: spinning ? undefined : `rotate(${rotation.to}deg)` } as CSSProperties)
              : { transform: "rotate(-24deg)" }
          }
          aria-hidden
        >
          <defs>
            <linearGradient id="bottle-glass" x1="0" x2="1">
              <stop offset="0" stopColor="#0f766e" />
              <stop offset="0.45" stopColor="#5eead4" />
              <stop offset="1" stopColor="#115e59" />
            </linearGradient>
          </defs>
          <ellipse cx="2" cy="4" rx="13" ry="40" fill="#000" opacity="0.25" />
          <path d="M-3.5 -46 h7 v14 l7 12 v48 a5 5 0 0 1 -5 5 h-11 a5 5 0 0 1 -5 -5 v-48 l7 -12 z" fill="url(#bottle-glass)" stroke="#ccfbf1" strokeOpacity="0.6" strokeWidth="1.2" />
          <rect x="-4.5" y="-49" width="9" height="5" rx="1.5" fill="#f5c76b" />
          <path d="M-6 -10 v30" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="-8.5" y="2" width="17" height="14" rx="2" fill="#f5c76b" opacity="0.9" />
          <text x="0" y="12" textAnchor="middle" fontSize="6" fontWeight="700" fill="#5b1a2c">
            ♥
          </text>
        </svg>
      </button>
    </div>
  );
}

/** Lanzador: la botella quieta en la mesa; la giras tú (tocándola, deslizando o con el botón). */
export function BottleLauncher({ session }: { session: SessionState }) {
  const draw = useSession((s) => s.draw);
  const people = peopleOf(session);
  const spin = () => draw({ game: "botella", strictGame: true });
  return (
    <div className="space-y-4">
      <BottleScene people={people} rotation={null} spinning={false} highlight={null} onSpin={spin} />
      <p className="text-center text-sm text-muted">Toca la botella o deslízala con el dedo para girarla.</p>
      <div className="deck" style={themeStyle("botella")}>
        <button type="button" onClick={spin} className="deck-face w-full px-5 py-4 font-display text-2xl font-semibold italic">
          ¡Girar la botella!
        </button>
      </div>
    </div>
  );
}

/**
 * Giro: la carta ya está validada (la pareja ya es compatible); la botella solo
 * lo representa, con un giro largo y frenado lento para dar suspenso.
 */
export function BottleRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const people = peopleOf(session);
  const [phase, setPhase] = useState<"spinning" | "landed" | "done">("spinning");
  const target = turn.assignment.p2 ?? turn.protagonist ?? turn.assignment.p1 ?? people[0].id;
  const from = turn.assignment.p2 ? turn.assignment.p1 : null;
  const targetIndex = Math.max(0, people.findIndex((p) => p.id === target));
  // Variación estable por turno: cuántas vueltas y dónde exactamente se detiene.
  const seed = useMemo(() => [...turn.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7), [turn.id]);
  const turns = 7 + (seed % 3);
  const rotation = { from: -24, to: 360 * turns + seatAngle(targetIndex, people.length) + ((seed % 17) - 8) };

  useEffect(() => {
    const fast = reducedMotion();
    const t1 = setTimeout(() => setPhase("landed"), fast ? 30 : BOTTLE_SPIN_MS);
    const t2 = setTimeout(() => setPhase("done"), fast ? 60 : BOTTLE_SPIN_MS + 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "done")
    return (
      <>
        <ActivityCard session={session} turn={turn} activity={activity}>
          {activity.duracion && <TimerControl session={session} activity={activity} />}
        </ActivityCard>
        <ActionBar />
      </>
    );
  const fromP = people.find((p) => p.id === from);
  const targetP = people[targetIndex];
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <p className="text-center font-display text-2xl italic" aria-live="polite">
        {phase === "landed" ? (
          <span className="text-gradient animate-pop">¡Le toca a {targetP.alias}!</span>
        ) : fromP ? (
          `${fromP.alias} gira la botella…`
        ) : (
          "La botella gira…"
        )}
      </p>
      <BottleScene people={people} rotation={rotation} spinning={phase === "spinning"} highlight={phase === "landed" ? targetP.id : null} />
    </div>
  );
}

// ------------------------------------------------------------------ Rasca y descubre

const CELL = 18;

/** Capa dorada para raspar con el dedo. Al descubrir más de la mitad, se desvanece. */
export function ScratchCover({ onReveal }: { onReveal: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const grid = useRef<{ cols: number; rows: number; cleared: Set<number> } | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [fading, setFading] = useState(false);

  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Tamaño de maquetación (offsetWidth/Height): no lo deforma el giro 3D de la
    // carta al aparecer. getBoundingClientRect medía la carta de canto y la
    // capa quedaba como unas franjas transparentes.
    const paint = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w < 10 || h < 10 || (grid.current && grid.current.cleared.size > 0)) return false;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#b8862e");
      g.addColorStop(0.35, "#fff1c9");
      g.addColorStop(0.6, "#f5c76b");
      g.addColorStop(1, "#a8741f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Brillo en diagonal y texto.
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#ffffff";
      for (let x = -h; x < w; x += 26) {
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + h, 0);
        ctx.lineTo(x + h + 8, 0);
        ctx.lineTo(x + 8, h);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#5b1a2c";
      ctx.textAlign = "center";
      ctx.font = "italic 600 30px 'Playfair Display Variable', Georgia, serif";
      ctx.fillText("Raspa aquí", w / 2, h / 2 - 6);
      ctx.font = "600 15px 'Outfit Variable', system-ui, sans-serif";
      ctx.fillText("con el dedo ★", w / 2, h / 2 + 22);
      grid.current = { cols: Math.ceil(w / CELL), rows: Math.ceil(h / CELL), cleared: new Set() };
      setPainted(true);
      return true;
    };
    if (paint()) return;
    // Si aún no tenía tamaño, pintar en cuanto lo tenga.
    const ro = new ResizeObserver(() => {
      if (paint()) ro.disconnect();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const reveal = () => {
    if (fading) return;
    setFading(true);
    setTimeout(onReveal, reducedMotion() ? 0 : 450);
  };

  const scratch = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    const gr = grid.current;
    if (!canvas || !ctx || !gr || fading) return;
    // Coordenadas del dedo en el espacio de la capa (corrige cualquier escala visual).
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvas.offsetWidth) / Math.max(1, rect.width);
    const y = ((e.clientY - rect.top) * canvas.offsetHeight) / Math.max(1, rect.height);
    const r = 24;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineWidth = r * 2;
    ctx.beginPath();
    const from = last.current ?? { x, y };
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
    // Progreso por celdas (sin leer píxeles: barato en el teléfono).
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (CELL / 2)));
    for (let s = 0; s <= steps; s++) {
      const px = from.x + ((x - from.x) * s) / steps;
      const py = from.y + ((y - from.y) * s) / steps;
      for (let cx = Math.floor((px - r) / CELL); cx <= Math.floor((px + r) / CELL); cx++) {
        for (let cy = Math.floor((py - r) / CELL); cy <= Math.floor((py + r) / CELL); cy++) {
          if (cx < 0 || cy < 0 || cx >= gr.cols || cy >= gr.rows) continue;
          if (Math.hypot(cx * CELL + CELL / 2 - px, cy * CELL + CELL / 2 - py) <= r) gr.cleared.add(cy * gr.cols + cx);
        }
      }
    }
    if (gr.cleared.size / (gr.cols * gr.rows) > 0.55) reveal();
  };

  return (
    <div
      className={cx("absolute inset-0 z-[4] overflow-hidden rounded-[24px] transition-opacity duration-500", fading && "opacity-0")}
      // Opaca desde el primer instante: nunca se lee la carta antes de raspar.
      style={painted ? undefined : { background: "linear-gradient(135deg, #b8862e, #fff1c9 35%, #f5c76b 60%, #a8741f)" }}
      data-no-tilt
    >
      <canvas
        ref={ref}
        className="size-full touch-none"
        aria-hidden
        onPointerDown={(e) => {
          drawing.current = true;
          last.current = null;
          e.currentTarget.setPointerCapture(e.pointerId);
          scratch(e);
        }}
        onPointerMove={(e) => drawing.current && scratch(e)}
        onPointerUp={() => {
          drawing.current = false;
          last.current = null;
        }}
        onPointerCancel={() => {
          drawing.current = false;
          last.current = null;
        }}
      />
      <button type="button" onClick={reveal} className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#5b1a2c]/85 px-4 py-2 text-sm font-semibold text-[#fff1c9]">
        Descubrir todo
      </button>
    </div>
  );
}

export function ScratchRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <ActivityCard session={session} turn={turn} activity={activity} cover={revealed ? undefined : <ScratchCover onReveal={() => setRevealed(true)} />}>
        {revealed && activity.duracion && <TimerControl session={session} activity={activity} />}
      </ActivityCard>
      {!revealed && <Notice>Raspa la carta para descubrir qué te toca. Puedes pasarla sin descubrirla.</Notice>}
      <ActionBar />
    </>
  );
}

export function isMiniGame(g: GameId): boolean {
  return MINI_GAMES.includes(g);
}

// ------------------------------------------------------------------ Parqués de la pasión

/** Ritmo pensado para el suspenso: se ve cada salto, dónde cae y qué le toca. */
const ROLL_MS = 1700;
const SHOW_ROLL_MS = 900;
const STEP_MS = 560;
const LANDED_MS = 850;
const REVEAL_MS = 1700;

/** Cara al azar del dado (solo desde eventos, nunca al pintar). */
function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};

/** Giro que deja cada número de frente (cara 1 delante, 2 arriba, 3 a la derecha…). */
const DIE_TURN: Record<number, { fx: string; fy: string }> = {
  1: { fx: "0deg", fy: "0deg" },
  2: { fx: "-90deg", fy: "0deg" },
  3: { fx: "0deg", fy: "-90deg" },
  4: { fx: "0deg", fy: "90deg" },
  5: { fx: "90deg", fy: "0deg" },
  6: { fx: "0deg", fy: "180deg" },
};

/** Dado 3D con puntos: cae dando tumbos y se detiene en el número ya sorteado. */
function Die3D({ value, rolling, rollKey }: { value: number; rolling: boolean; rollKey: number }) {
  const turn = DIE_TURN[value];
  return (
    <div className="pdie-scene" aria-hidden>
      <div key={rollKey} className={cx("pdie", rolling && "rolling")} style={{ "--fx": turn.fx, "--fy": turn.fy } as CSSProperties}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className={`pdie-face pf${n}`}>
            <svg viewBox="0 0 100 100" className="size-full">
              {PIPS[n].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="9" fill="#b3123e" />
              ))}
            </svg>
          </div>
        ))}
      </div>
      <div className="pdie-shadow" />
    </div>
  );
}

const HEART_STYLE = { from: "#e11d74", to: "#6d28d9", glyph: "♥", label: "Corazón" };

function squareLook(i: number) {
  const sq = BOARD[i];
  if (!sq) return HEART_STYLE;
  const st = SQUARE_STYLE[sq.kind];
  return { ...st, glyph: sq.kind === "avanza" || sq.kind === "retrocede" ? `${st.glyph}${sq.steps}` : st.glyph };
}

const PCELL = 100 / GRID;

/** Tablero cuadrado inclinado en 3D: 24 casillas en el borde, fichas de pie y el corazón al centro. */
function ParquesBoard({
  people,
  pos,
  active,
  hot,
  center,
}: {
  people: Seat[];
  pos: Record<string, number>;
  active: string | null;
  hot: number | null;
  center: ReactNode;
}) {
  return (
    <div className="parques-stage" style={themeStyle("parques")}>
      <div className="parques-board">
        {BOARD.map((_, i) => {
          const { col, row } = gridCell(i);
          const look = squareLook(i);
          return (
            <div
              key={i}
              className={cx("parques-tile", hot === i && "hot")}
              style={{ left: `${col * PCELL}%`, top: `${row * PCELL}%`, width: `${PCELL}%`, height: `${PCELL}%` }}
              data-casilla={i}
              aria-hidden
            >
              <span style={{ background: `linear-gradient(135deg, ${look.from}, ${look.to})` }}>{i === 0 ? "⚑" : look.glyph}</span>
            </div>
          );
        })}
        <div className="parques-center" style={{ left: `${PCELL}%`, top: `${PCELL}%`, width: `${PCELL * 5}%`, height: `${PCELL * 5}%` }}>
          {center}
        </div>
        {people.map((p) => {
          const at = pos[p.id] ?? 0;
          const { col, row } = gridCell(at);
          const same = people.filter((o) => (pos[o.id] ?? 0) === at);
          const idx = same.findIndex((o) => o.id === p.id);
          const off = same.length > 1 ? (idx - (same.length - 1) / 2) * 26 : 0;
          return (
            <div
              key={p.id}
              className="parques-token"
              style={{ width: `${PCELL}%`, height: `${PCELL}%`, transform: `translate3d(${col * 100}%, ${row * 100}%, 0)` }}
              aria-hidden
            >
              <div className="parques-token-slot" style={{ transform: `translate3d(${off}%, ${-off / 2}%, 0)` }}>
                <div className="parques-token-shadow" />
                <div key={at} className={cx("parques-pawn", active === p.id && "active")} style={{ "--pc": PARTICIPANT_COLORS[p.slot] } as CSSProperties}>
                  <span className="head">{p.alias.charAt(0).toUpperCase()}</span>
                  <span className="body" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Ficha que se voltea para anunciar lo que tocó, antes de mostrar la carta. */
function RevealTile({ square, title, hint }: { square: number; title: string; hint: string }) {
  const look = squareLook(square);
  return (
    <div className="parques-reveal" role="status" aria-live="assertive">
      <div className="parques-reveal-card">
        <div className="pr-face pr-mystery">?</div>
        <div className="pr-face pr-result" style={{ background: `linear-gradient(145deg, ${look.from}, ${look.to})` }}>
          <span className="text-5xl leading-none">{look.glyph}</span>
          <span className="font-display text-2xl font-semibold italic">{title}</span>
        </div>
      </div>
      <p className="parques-reveal-hint">{hint}</p>
    </div>
  );
}

type ParquesPhase = "idle" | "rolling" | "rolled" | "moving" | "landed" | "bonus" | "reveal" | "decide" | "winner";

export function ParquesLauncher({ session }: { session: SessionState }) {
  useMinisFor(session);
  const draw = useSession((s) => s.draw);
  const setPending = useSession((s) => s.setPending);
  const state = useMinis((s) => s.parques);
  const set = useMinis((s) => s.set);
  const people = peopleOf(session);
  const current = people[state.turn % people.length];
  const [pos, setPos] = useState<Record<string, number>>(state.pos);
  const [die, setDie] = useState(1);
  const [rollKey, setRollKey] = useState(0);
  const [phase, setPhase] = useState<ParquesPhase>("idle");
  const [left, setLeft] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const [reveal, setReveal] = useState<{ square: number; title: string; hint: string } | null>(null);
  const [play, setPlay] = useState<{ value: number; bonus: number; to: number } | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const finishTurn = (nextPos: Record<string, number>, last: string | null) => set({ parques: { pos: nextPos, turn: state.turn + 1, last } });

  const giveCard = (nextPos: Record<string, number>, to: string, req: { formats?: readonly Format[]; interactions?: readonly Interaction[] }, last: string) => {
    finishTurn(nextPos, last);
    // La carta es para quien cayó en la casilla (si no hay una compatible, el motor elige a otra persona).
    setPending({ forcedProtagonist: to });
    draw({ game: "parques", strictGame: true, ...req });
  };

  const roll = async () => {
    if (phase !== "idle") return;
    const value = rollDie();
    setInfo(null);
    setDie(value);
    setRollKey((k) => k + 1);
    setPhase("rolling");
    await wait(ROLL_MS);
    setPhase("rolled");
    await wait(SHOW_ROLL_MS);

    const m = move(pos[current.id] ?? 0, value);
    const diceSteps = Math.min(value, m.path.length);
    let shown = { ...pos };
    const walk = async (steps: number[]) => {
      setPhase("moving");
      for (let k = 0; k < steps.length; k++) {
        shown = { ...shown, [current.id]: steps[k] };
        setPos(shown);
        setHot(steps[k]);
        setLeft(steps.length - k - 1);
        await wait(STEP_MS);
      }
    };
    const win = () => {
      setHot(null);
      setReveal({ square: BOARD_SIZE, title: "¡Al corazón!", hint: `${current.alias} ganó la vuelta. Elige a quién le toca el próximo reto.` });
      setPhase("winner");
    };

    await walk(m.path.slice(0, diceSteps));
    if (m.finished && diceSteps === m.path.length) return win();
    setHot(m.landed);
    setPhase("landed");
    await wait(LANDED_MS);

    if (m.bonus !== 0) {
      setReveal({ square: m.landed, ...squareAnnouncement(m.landed) });
      setPhase("bonus");
      await wait(REVEAL_MS + 600);
      setReveal(null);
      await walk(m.path.slice(diceSteps));
      if (m.finished) return win();
      setHot(m.to);
      setPhase("landed");
      await wait(LANDED_MS);
    }

    // La ficha queda donde cayó aunque la pantalla se cierre antes de decidir.
    set({ parques: { pos: shown, turn: state.turn, last: state.last } });
    setPlay({ value, bonus: m.bonus, to: m.to });
    setReveal({ square: m.to, ...squareAnnouncement(m.to) });
    setPhase("reveal");
    await wait(REVEAL_MS);
    setPhase("decide");
  };

  const proceed = () => {
    if (!play || !reveal) return;
    const moved = play.bonus > 0 ? ` y avanzó ${play.bonus}` : play.bonus < 0 ? ` y retrocedió ${-play.bonus}` : "";
    const label = `${current.alias} sacó ${play.value}${moved}: ${reveal.title.replace(/[¡!]/g, "")}`;
    const card = cardFor(play.to);
    if (card) {
      giveCard(pos, current.id, card, label);
      return;
    }
    finishTurn(pos, null);
    setInfo(`${label}. Pasó el turno.`);
    setReveal(null);
    setHot(null);
    setPlay(null);
    setPhase("idle");
  };

  const prize = (to: Seat) => {
    const reset = Object.fromEntries(people.map((p) => [p.id, 0]));
    setPos(reset);
    giveCard(reset, to.id, { formats: ["reto"] }, `${current.alias} llegó al corazón y eligió a ${to.alias}`);
  };

  const proceedLabel = (() => {
    const kind = play ? BOARD[play.to]?.kind : undefined;
    if (kind === "verdad") return "Ver la pregunta";
    if (kind === "reto") return "Ver el reto";
    if (kind === "pareja" || kind === "comodin") return "Ver la carta";
    return "Pasar el turno";
  })();

  const status = (() => {
    switch (phase) {
      case "rolling":
        return "Rodando el dado…";
      case "rolled":
        return `¡${current.alias} sacó ${die}!`;
      case "moving":
        return left > 0 ? `Avanzando… faltan ${left}` : "Avanzando…";
      case "landed":
        return "¿Qué le tocará?";
      case "bonus":
      case "reveal":
        return `${current.alias} cayó en…`;
      case "decide":
        return reveal ? `${reveal.title.replace(/!$/, "")} para ${current.alias}!` : null;
      default:
        return null;
    }
  })();

  const center = (
    <>
      <GameEmblem theme="parques" className={cx("parques-emblem", (phase === "rolled" || phase === "moving") && "dim")} />
      {phase === "rolled" && (
        <span key="roll" className="parques-big animate-pop">
          {die}
        </span>
      )}
      {phase === "moving" && (
        <span key={`left-${left}`} className="parques-big animate-pop">
          {left}
        </span>
      )}
    </>
  );

  const busy = phase !== "idle";
  return (
    <div className="space-y-3">
      <div className="min-h-[3.5rem] text-center" aria-live="polite">
        {phase === "winner" ? (
          <p className="font-display text-2xl font-semibold italic text-gradient">¡{current.alias} llegó al corazón!</p>
        ) : status ? (
          <p className="font-display text-2xl font-semibold italic text-gradient">{status}</p>
        ) : (
          <p className="text-lg">
            Turno de <ParticipantTag alias={current.alias} slot={current.slot} />
          </p>
        )}
        {phase === "idle" && <p className="text-sm text-muted">{info ?? "Toca el dado y que la suerte decida"}</p>}
      </div>

      <div className="relative">
        <ParquesBoard people={people} pos={pos} active={phase === "winner" ? null : current.id} hot={hot} center={center} />
        {reveal && <RevealTile key={`${reveal.square}-${phase === "bonus" ? "b" : "f"}`} {...reveal} />}
      </div>

      {phase === "winner" ? (
        <div className="glass space-y-3 rounded-3xl p-4 text-center animate-deal">
          <p className="font-semibold">Premio: elige a quién le toca el próximo reto</p>
          <div className="grid gap-2">
            {people
              .filter((p) => p.id !== current.id)
              .map((p) => (
                <button key={p.id} type="button" onClick={() => prize(p)} className="btn-glass flex min-h-12 items-center justify-center gap-2 rounded-full">
                  <ParticipantTag alias={p.alias} slot={p.slot} />
                </button>
              ))}
          </div>
        </div>
      ) : phase === "decide" ? (
        <div className="deck animate-deal" style={themeStyle("parques")}>
          <button type="button" onClick={proceed} className="deck-face w-full px-5 py-4 font-display text-xl font-semibold italic">
            {proceedLabel}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-5">
          <button type="button" aria-label="Tirar el dado" disabled={busy} onClick={() => void roll()} className="transition active:scale-95">
            <Die3D value={die} rolling={phase === "rolling"} rollKey={rollKey} />
          </button>
          <div className="deck" style={themeStyle("parques")}>
            <button type="button" disabled={busy} onClick={() => void roll()} className="deck-face px-5 py-4 font-display text-xl font-semibold italic disabled:opacity-70">
              {busy ? "Tirando…" : "¡Tirar el dado!"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[0.7rem] font-semibold uppercase tracking-widest text-muted" aria-hidden>
        {(["verdad", "reto", "pareja", "comodin", "avanza", "retrocede", "descanso"] as SquareKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className="size-3 rounded-sm" style={{ background: `linear-gradient(135deg, ${SQUARE_STYLE[k].from}, ${SQUARE_STYLE[k].to})` }} />
            {SQUARE_STYLE[k].label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Carta del parqués: con la jugada que la trajo. */
export function ParquesRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const last = useMinis((s) => s.parques.last);
  return (
    <>
      {last && (
        <p className="text-center font-display text-xl font-semibold italic text-gradient animate-pop" role="status">
          {last}
        </p>
      )}
      <ActivityCard session={session} turn={turn} activity={activity}>
        {activity.duracion && <TimerControl session={session} activity={activity} />}
      </ActivityCard>
      <ActionBar />
    </>
  );
}

