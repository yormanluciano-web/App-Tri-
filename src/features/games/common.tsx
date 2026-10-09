"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { Activity } from "@/domain/models/activity";
import { CATEGORY_LABEL, GAME_LABEL, INTENSITY_LABEL, TIMER_OPTIONS_SEC } from "@/domain/models/constants";
import type { SessionState, Turn } from "@/domain/models/session";
import { timerRemaining } from "@/domain/state/session";
import { activityPermissions } from "@/domain/consent/limits";
import { useSession } from "@/stores/session";
import { Button, GameEmblem, Icon, ParticipantTag, cx } from "@/components/ui";
import { Tilt } from "@/components/ui/tilt";
import { FitText } from "@/components/ui/fit";
import { GAME_THEME, LEVEL_MARK, themeStyle, type ThemeKey } from "@/components/ui/visuals";
import { haptic, sfx } from "@/sound/sfx";

/** Tema visual de la carta: Verdad y Reto tienen colores propios. */
export function cardTheme(game: Turn["game"], activity: Activity): ThemeKey {
  if (game === "verdad_reto") return activity.formato === "pregunta" ? "verdad" : "reto";
  return game;
}
import type { Person } from "@/features/session/PrivateRound";

export function peopleOf(s: SessionState, ids?: readonly string[]): Person[] {
  const list = ids ? s.config.participants.filter((p) => ids.includes(p.id)) : s.config.participants;
  return list.map((p) => ({ id: p.id, alias: p.alias, slot: p.slot }));
}

/** Reloj de pantalla que se actualiza cada `ms` (fuera del render). */
export function useNow(ms = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Sustituye {p1}/{p2}/{p3} por etiquetas de participante. Siempre como texto, nunca HTML. */
export function RoleText({ text, session, turn }: { text: string; session: SessionState; turn: Turn }) {
  const parts = text.split(/(\{p[123]\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\{(p[123])\}$/);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        const pid = turn.assignment[m[1] as "p1" | "p2" | "p3"];
        const p = session.config.participants.find((x) => x.id === pid);
        return p ? <ParticipantTag key={i} alias={p.alias} slot={p.slot} /> : <Fragment key={i}>alguien</Fragment>;
      })}
    </>
  );
}

export function ActivityCard({
  session,
  turn,
  activity,
  children,
  hideText,
  cover,
}: {
  session: SessionState;
  turn: Turn;
  activity: Activity;
  children?: ReactNode;
  hideText?: boolean;
  /** Capa encima de la carta (p. ej. Rasca y descubre). */
  cover?: ReactNode;
}) {
  const favorites = useSession((s) => s.favorites);
  const favoritesMode = useSession((s) => s.favoritesMode);
  const toggleFavorite = useSession((s) => s.toggleFavorite);
  const isFav = favorites.includes(activity.id);
  const implicated = peopleOf(session, turn.implicated);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // La carta se voltea: un roce de papel y un brillo.
  useEffect(() => {
    sfx("flip");
    haptic(15);
  }, [turn.id]);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [turn.id]);
  const theme = cardTheme(turn.game, activity);
  const suit = GAME_THEME[theme].suit;
  const corner = (pos: "tl" | "br") => (
    <span className={`card-corner ${pos}`} aria-hidden>
      <span className="text-2xl">{LEVEL_MARK[activity.intensidad]}</span>
      <span className="text-base">{suit}</span>
    </span>
  );
  return (
    <Tilt max={6} ignoreInteractive fill className="flex min-h-0 flex-1 flex-col">
      <div className="flip-3d h-full" key={turn.id} style={themeStyle(theme)}>
        <div className="face-front h-full">
          <section className="play-card flex h-full flex-col gap-2 px-5 pb-3 pt-4">
            {corner("tl")}
            {corner("br")}
            {cover}
            <button
              type="button"
              onClick={() => void toggleFavorite(activity.id)}
              aria-pressed={isFav}
              aria-label={isFav ? "En favoritas (toca para quitarla)" : favoritesMode === "temporary" ? "Guardar en favoritas (temporal)" : "Guardar en favoritas"}
              className={cx("absolute right-3 top-3 z-[2] flex size-11 items-center justify-center rounded-full transition hover:text-ink", isFav ? "text-gold" : "text-muted")}
            >
              <Icon name="star" className={cx("size-6 transition", isFav && "fill-current animate-pop")} />
            </button>
            <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
              <GameEmblem theme={theme} className="size-11 drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]" />
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                <span className="text-[var(--g3)]">{theme === "verdad" ? "Verdad" : theme === "reto" ? "Reto" : GAME_LABEL[turn.game]}</span>
                <span className="text-faint">·</span>
                <span className="text-muted">{CATEGORY_LABEL[activity.categoria]}</span>
                <span className="text-faint">·</span>
                <span className="foil-text">{INTENSITY_LABEL[activity.intensidad]}</span>
                {turn.chainStage !== undefined && <span className="text-muted">· Etapa {turn.chainStage + 1} de 3</span>}
              </div>
            </div>
            <h2 ref={headingRef} tabIndex={-1} className="shrink-0 px-6 text-center text-[1.65rem] font-semibold italic leading-tight">
              <RoleText text={activity.titulo} session={session} turn={turn} />
            </h2>
            <p className="card-ornament shrink-0 text-xs" aria-hidden>
              {suit}
            </p>
            <FitText className="-mx-1 px-1" max={1.75} deps={[turn.id, hideText]}>
              <div className="space-y-3">
                {!hideText && (
                  <p className="text-center leading-snug text-ink" data-testid="activity-text">
                    <RoleText text={activity.texto} session={session} turn={turn} />
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2 text-[0.8125rem] text-muted">
                  <span>Participan:</span>
                  {activity.tipoInteraccion === "group" ? (
                    <span>todas las personas</span>
                  ) : (
                    implicated.map((p) => <ParticipantTag key={p.id} alias={p.alias} slot={p.slot} />)
                  )}
                </div>
                <SafetyNotes activity={activity} />
              </div>
            </FitText>
            {children && <div className="shrink-0 px-4">{children}</div>}
          </section>
        </div>
        <div className="face-back card-back flex flex-col items-center justify-center gap-3" aria-hidden>
          <GameEmblem theme={theme} className="size-28" />
          <span className="font-display text-3xl font-semibold italic text-white/90">Cómplice</span>
        </div>
      </div>
    </Tilt>
  );
}

/** Recordatorios automáticos según los permisos de la carta. */
function SafetyNotes({ activity }: { activity: Activity }) {
  const perms = activityPermissions(activity);
  const notes: string[] = [];
  if (perms.includes("desnudez")) notes.push("Solo entre quienes aceptaron todo. Cualquiera puede pasar o parar en cualquier momento, sin dar explicaciones.");
  else if (perms.includes("quitarse_prenda")) notes.push("Nunca la ropa interior. Puedes pasar sin dar explicaciones.");
  if (perms.includes("tiempo_a_solas")) notes.push("Pueden volver cuando quieran. A solas, todo sigue siendo voluntario y cualquiera puede parar.");
  if (perms.includes("beso_intenso") || perms.includes("caricias")) notes.push("Cualquiera puede parar en cualquier momento.");
  if (notes.length === 0) return null;
  return (
    <ul className="space-y-1 rounded-2xl border border-line bg-white/5 px-3 py-2 text-[0.75rem] leading-snug text-muted">
      {notes.map((n) => (
        <li key={n} className="flex gap-2">
          <Icon name="shield" className="mt-px size-3.5 shrink-0 text-accent" />
          {n}
        </li>
      ))}
    </ul>
  );
}

/** Pie fijo: Cumplido, Pasar y Cambiar. */
export function ActionBar({ extra, canComplete = true, completeLabel = "Cumplido" }: { extra?: ReactNode; canComplete?: boolean; completeLabel?: string }) {
  const complete = useSession((s) => s.complete);
  const pass = useSession((s) => s.pass);
  const change = useSession((s) => s.change);
  return (
    <div className="glass z-10 -mx-4 -mb-3 mt-auto grid shrink-0 grid-cols-[1fr_1fr_1.4fr] gap-2 rounded-t-[28px] px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2.5">
      {extra}
      <Button
        variant="secondary"
        icon="skip"
        data-sfx="pass"
        className="!min-h-12 flex-col !gap-0 !px-2 !py-1 !text-sm"
        onClick={() => {
          sfx("pass");
          pass();
        }}
      >
        Pasar
      </Button>
      <Button
        variant="secondary"
        icon="refresh"
        data-sfx="swap"
        className="!min-h-12 flex-col !gap-0 !px-2 !py-1 !text-sm"
        onClick={() => {
          sfx("swap");
          change();
        }}
      >
        Cambiar
      </Button>
      <Button
        icon="check"
        size="lg"
        data-sfx="done"
        className="!min-h-12 pulse-glow"
        onClick={() => {
          sfx("done");
          haptic([20, 40, 20]);
          complete();
        }}
        disabled={!canComplete}
      >
        {completeLabel}
      </Button>
    </div>
  );
}

function fmt(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Reloj de una actividad autorizada. No empieza solo; pausar o salir lo congela. */
export function TimerControl({ session, activity, autoChoices = true }: { session: SessionState; activity: Activity; autoChoices?: boolean }) {
  const startTimer = useSession((s) => s.startTimer);
  const pauseTimer = useSession((s) => s.pauseTimer);
  const resumeTimer = useSession((s) => s.resumeTimer);
  const timerFinished = useSession((s) => s.timerFinished);
  const d = activity.duracion;
  const options = d ? TIMER_OPTIONS_SEC.filter((o) => o >= d.minima && o <= d.maxima) : [];
  const fallback = d ? [d.sugerida] : [];
  const choices = options.length ? options : fallback;
  const [choice, setChoice] = useState<number>(() => (d ? (choices.includes(d.sugerida) ? d.sugerida : choices[0]) : 60));
  const [prep, setPrep] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const timer = session.timer && session.currentTurn && session.timer.turnId === session.currentTurn.id ? session.timer : null;

  useEffect(() => {
    if (!timer?.running) return;
    const id = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer?.running]);

  const remaining = timer ? timerRemaining(session, nowTick) : 0;

  useEffect(() => {
    if (timer?.running && remaining <= 0) {
      sfx("timerEnd");
      haptic([200, 100, 200]);
      timerFinished();
    }
  }, [remaining, timer?.running, timerFinished]);

  // Últimos 5 segundos: un tic por segundo.
  const lastSecond = timer?.running && remaining > 0 && remaining <= 5_000 ? Math.ceil(remaining / 1000) : null;
  useEffect(() => {
    if (lastSecond !== null) sfx("count");
  }, [lastSecond]);

  useEffect(() => {
    if (prep === null) return;
    sfx("count");
    const id = setTimeout(() => {
      if (prep <= 1) {
        setPrep(null);
        sfx("go");
        startTimer(choice * 1000);
      } else setPrep(prep - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [prep, choice, startTimer]);

  // Anuncios solo en umbrales, sin saturar aria-live cada segundo.
  const announce = !timer
    ? ""
    : remaining <= 0
      ? "Tiempo terminado. No obliga a nada."
      : remaining <= 10_000
        ? "Quedan 10 segundos"
        : timer.running
          ? `Reloj en marcha: ${fmt(timer.durationMs)}`
          : "Reloj en pausa";

  if (!d) return null;
  const authorized = session.currentTurn?.authorized && session.status === "playing";

  return (
    <div className="space-y-2 rounded-2xl border border-line bg-white/5 p-2.5">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {!timer && prep === null && (
        <>
          {autoChoices && choices.length > 1 && (
            <div className="flex flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Duración del reloj">
              {choices.map((c) => (
                <button
                  key={c}
                  role="radio"
                  aria-checked={choice === c}
                  onClick={() => setChoice(c)}
                  className={cx(
                    "min-h-9 rounded-full border px-3 text-sm transition active:scale-95",
                    choice === c ? "border-transparent bg-gradient-to-r from-accent to-accent-2 font-semibold text-accent-ink" : "border-line hover:bg-white/10",
                  )}
                >
                  {fmt(c * 1000)}
                </button>
              ))}
            </div>
          )}
          <Button block variant="secondary" icon="timer" className="!min-h-10 !py-1.5 !text-sm" disabled={!authorized} onClick={() => setPrep(3)}>
            Comenzar reloj ({fmt(choice * 1000)})
          </Button>
        </>
      )}
      {prep !== null && (
        <p className="text-center font-display text-4xl italic text-gradient animate-pop" key={prep} aria-hidden>
          {prep}
        </p>
      )}
      {timer && (
        <div className="flex items-center justify-center gap-4 text-center">
          <div className="relative size-24 shrink-0" aria-hidden>
            <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
              <defs>
                <linearGradient id="timer-g" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--accent)" />
                  <stop offset="1" stopColor="var(--accent-2)" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#timer-g)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - Math.max(0, remaining) / timer.durationMs)}
                style={{ transition: "stroke-dashoffset 250ms linear", filter: "drop-shadow(0 0 6px var(--glow))" }}
              />
            </svg>
            <span className={cx("absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums", remaining <= 0 && "text-faint")}>
              {fmt(remaining)}
            </span>
          </div>
          {remaining <= 0 ? (
            <p className="text-sm text-muted">Tiempo terminado. Pueden marcar Cumplido o Pasar; no hay obligación de seguir.</p>
          ) : timer.running ? (
            <Button variant="secondary" icon="pause" onClick={pauseTimer}>
              Pausar reloj
            </Button>
          ) : (
            <Button variant="secondary" icon="play" onClick={resumeTimer}>
              Reanudar reloj
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
