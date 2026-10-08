"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { create } from "zustand";
import type { Activity } from "@/domain/models/activity";
import { GAME_LABEL, MINI_GAMES, PARTICIPANT_COLORS, type Format, type GameId } from "@/domain/models/constants";
import type { SessionState, Turn } from "@/domain/models/session";
import { useSession } from "@/stores/session";
import { Card, GameEmblem, Notice, cx } from "@/components/ui";
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
  special: null,
  dismissedAt: null,
  reset(sessionId) {
    set({ sessionId, pulled: [], collapsed: false, special: null, dismissedAt: null });
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
 * Probabilidad de que la torre caiga al sacar un bloque: crece con los bloques
 * ya sacados y es segura si una capa queda sostenida por un solo bloque lateral.
 */
export function collapseChance(pulledBefore: readonly number[], next: number): number {
  const pulled = [...pulledBefore, next];
  const layer = Math.floor(next / PER_LAYER);
  const left = [0, 1, 2].filter((k) => !pulled.includes(layer * PER_LAYER + k));
  if (left.length === 0 || (left.length === 1 && left[0] !== 1)) return 1;
  return Math.min(0.6, Math.max(0, pulled.length - 4) * 0.06);
}

export function TowerLauncher({ session }: { session: SessionState }) {
  useMinisFor(session);
  const draw = useSession((s) => s.draw);
  const pulled = useMinis((s) => s.pulled);
  const set = useMinis((s) => s.set);
  const [moving, setMoving] = useState<number | null>(null);
  const [falling, setFalling] = useState(false);
  const busy = moving !== null || falling;
  const risk = Math.min(1, pulled.length / 12);

  const pull = async (i: number) => {
    if (busy || pulled.includes(i)) return;
    setMoving(i);
    await wait(520);
    const falls = Math.random() < collapseChance(pulled, i);
    if (falls) {
      setFalling(true);
      await wait(1100);
      set({ pulled: [], collapsed: true });
      setFalling(false);
      setMoving(null);
      draw({ game: "torre", strictGame: true, formats: ["reto"] });
      return;
    }
    set({ pulled: [...pulled, i], collapsed: false });
    setMoving(null);
    const kind = blockKind(i);
    const formats: readonly Format[] | undefined = kind === "verdad" ? ["pregunta"] : kind === "reto" ? ["reto"] : undefined;
    draw({ game: "torre", strictGame: true, formats });
  };

  return (
    <div className="space-y-4">
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
          className={cx("tower", falling && "tower-fall", !falling && risk > 0.3 && "tower-wobble")}
          style={{ ["--wobble" as string]: `${0.6 + risk * 1.8}deg` }}
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
                        ["--fall-x" as string]: `${(k - 1) * 70 + (layer % 3) * 13 - 13}px`,
                        ["--fall-r" as string]: `${(k - 1) * 40 + layer * 9 - 20}deg`,
                        ["--fall-d" as string]: `${(LAYERS - layer) * 40}ms`,
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
      <p className="text-center text-sm text-muted" aria-live="polite">
        {falling ? "¡La torre se cae!" : pulled.length === 0 ? "Toca un bloque para sacarlo." : `Bloques fuera: ${pulled.length}. Cada vez tiembla más…`}
      </p>
    </div>
  );
}

/** Carta de la torre: igual que una estándar, con aviso si vino de un derrumbe. */
export function TowerRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const collapsed = useMinis((s) => s.collapsed);
  return (
    <>
      {collapsed && (
        <p className="text-center font-display text-2xl font-semibold italic text-gradient animate-pop" role="status">
          ¡La torre se cayó!
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

export function BottleRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const people = peopleOf(session);
  const [done, setDone] = useState(false);
  const target = turn.assignment.p2 ?? turn.protagonist ?? turn.assignment.p1 ?? people[0].id;
  const from = turn.assignment.p2 ? turn.assignment.p1 : null;
  const targetIndex = Math.max(0, people.findIndex((p) => p.id === target));
  // Pequeña variación estable por turno para que no se detenga siempre igual.
  const jitter = useMemo(() => ([...turn.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) % 17) - 8, [turn.id]);
  const spinTo = 360 * 4 + seatAngle(targetIndex, people.length) + jitter;

  useEffect(() => {
    const t = setTimeout(() => setDone(true), reducedMotion() ? 50 : 2300);
    return () => clearTimeout(t);
  }, []);

  if (done)
    return (
      <>
        <ActivityCard session={session} turn={turn} activity={activity}>
          {activity.duracion && <TimerControl session={session} activity={activity} />}
        </ActivityCard>
        <ActionBar />
      </>
    );
  const fromP = people.find((p) => p.id === from);
  return (
    <Card glow className="flex flex-col items-center gap-3 overflow-hidden" >
      <p className="font-display text-xl italic text-muted" aria-live="polite">
        {fromP ? `${fromP.alias} gira la botella…` : "La botella gira…"}
      </p>
      <div className="relative size-72" style={themeStyle("botella")}>
        <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.18),transparent_70%)]" aria-hidden />
        {people.map((p, i) => {
          const a = (seatAngle(i, people.length) - 90) * (Math.PI / 180);
          return (
            <span
              key={p.id}
              className="absolute flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-xl font-semibold italic text-[#1a0612]"
              style={{
                left: `${50 + 42 * Math.cos(a)}%`,
                top: `${50 + 42 * Math.sin(a)}%`,
                background: `radial-gradient(circle at 30% 30%, #fff8, ${PARTICIPANT_COLORS[p.slot]})`,
                boxShadow: `0 0 24px ${PARTICIPANT_COLORS[p.slot]}99`,
              }}
            >
              {p.alias.charAt(0).toUpperCase()}
            </span>
          );
        })}
        <svg viewBox="-50 -50 100 100" className="bottle-spin absolute inset-0 m-auto size-44" style={{ ["--spin-to" as string]: `${spinTo}deg` }} aria-hidden>
          <defs>
            <linearGradient id="bottle-glass" x1="0" x2="1">
              <stop offset="0" stopColor="#0f766e" />
              <stop offset="0.45" stopColor="#5eead4" />
              <stop offset="1" stopColor="#115e59" />
            </linearGradient>
          </defs>
          <path d="M-3.5 -46 h7 v14 l7 12 v48 a5 5 0 0 1 -5 5 h-11 a5 5 0 0 1 -5 -5 v-48 l7 -12 z" fill="url(#bottle-glass)" stroke="#ccfbf1" strokeOpacity="0.6" strokeWidth="1.2" />
          <rect x="-4.5" y="-49" width="9" height="5" rx="1.5" fill="#f5c76b" />
          <path d="M-6 -10 v30" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="-8.5" y="2" width="17" height="14" rx="2" fill="#f5c76b" opacity="0.9" />
          <text x="0" y="12" textAnchor="middle" fontSize="6" fontWeight="700" fill="#5b1a2c">
            ♥
          </text>
        </svg>
      </div>
    </Card>
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

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, "#b8862e");
    g.addColorStop(0.35, "#fff1c9");
    g.addColorStop(0.6, "#f5c76b");
    g.addColorStop(1, "#a8741f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);
    // Brillo en diagonal y texto.
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    for (let x = -rect.height; x < rect.width; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, rect.height);
      ctx.lineTo(x + rect.height, 0);
      ctx.lineTo(x + rect.height + 8, 0);
      ctx.lineTo(x + 8, rect.height);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#5b1a2c";
    ctx.textAlign = "center";
    ctx.font = "italic 600 30px 'Playfair Display Variable', Georgia, serif";
    ctx.fillText("Raspa aquí", rect.width / 2, rect.height / 2 - 6);
    ctx.font = "600 15px 'Outfit Variable', system-ui, sans-serif";
    ctx.fillText("con el dedo ★", rect.width / 2, rect.height / 2 + 22);
    grid.current = { cols: Math.ceil(rect.width / CELL), rows: Math.ceil(rect.height / CELL), cleared: new Set() };
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
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
    <div className={cx("absolute inset-0 z-[4] overflow-hidden rounded-[24px] transition-opacity duration-500", fading && "opacity-0")} data-no-tilt>
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
