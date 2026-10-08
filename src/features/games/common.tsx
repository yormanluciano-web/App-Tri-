"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { Activity } from "@/domain/models/activity";
import { CATEGORY_LABEL, GAME_LABEL, INTENSITY_LABEL, TIMER_OPTIONS_SEC } from "@/domain/models/constants";
import type { SessionState, Turn } from "@/domain/models/session";
import { timerRemaining } from "@/domain/state/session";
import { activityPermissions } from "@/domain/consent/limits";
import { useSession } from "@/stores/session";
import { Button, Card, Icon, Logo, ParticipantTag, cx } from "@/components/ui";
import { Tilt } from "@/components/ui/tilt";
import { GAME_ICON } from "@/components/ui/visuals";
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
}: {
  session: SessionState;
  turn: Turn;
  activity: Activity;
  children?: ReactNode;
  hideText?: boolean;
}) {
  const favorites = useSession((s) => s.favorites);
  const favoritesMode = useSession((s) => s.favoritesMode);
  const toggleFavorite = useSession((s) => s.toggleFavorite);
  const isFav = favorites.includes(activity.id);
  const implicated = peopleOf(session, turn.implicated);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [turn.id]);
  return (
    <Tilt max={6} ignoreInteractive>
      <div className="flip-3d" key={turn.id}>
        <div className="face-front">
    <Card glow className="space-y-5 py-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-2 px-3 py-1 text-accent-ink">
          <Icon name={GAME_ICON[turn.game]} className="size-3.5" />
          {GAME_LABEL[turn.game]}
        </span>
        <span className="rounded-full border border-line px-3 py-1 text-muted">{CATEGORY_LABEL[activity.categoria]}</span>
        <span className="text-gradient">{INTENSITY_LABEL[activity.intensidad]}</span>
        {turn.chainStage !== undefined && <span className="text-muted">Etapa {turn.chainStage + 1} de 3</span>}
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="text-3xl font-semibold italic leading-tight">
        <RoleText text={activity.titulo} session={session} turn={turn} />
      </h2>
      {!hideText && (
        <p className="text-[1.375rem] leading-relaxed text-ink" data-testid="activity-text">
          <RoleText text={activity.texto} session={session} turn={turn} />
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>Participan:</span>
        {activity.tipoInteraccion === "group" ? (
          <span>todas las personas</span>
        ) : (
          implicated.map((p) => <ParticipantTag key={p.id} alias={p.alias} slot={p.slot} />)
        )}
      </div>
      <SafetyNotes activity={activity} />
      {children}
      <button
        type="button"
        onClick={() => void toggleFavorite(activity.id)}
        aria-pressed={isFav}
        className={cx("inline-flex min-h-11 items-center gap-2 text-sm transition hover:text-ink", isFav ? "text-gold" : "text-muted")}
      >
        <Icon name="star" className={cx("size-5 transition", isFav && "fill-current animate-pop")} />
        {isFav ? "En favoritas" : "Guardar en favoritas"}
        {favoritesMode === "temporary" && <span className="text-faint"> (temporal)</span>}
      </button>
    </Card>
        </div>
        <div className="face-back card-back flex items-center justify-center" aria-hidden>
          <Logo className="size-28 opacity-90 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
        </div>
      </div>
    </Tilt>
  );
}

/** Recordatorios automáticos según los permisos de la carta. */
function SafetyNotes({ activity }: { activity: Activity }) {
  const perms = activityPermissions(activity);
  const notes: string[] = [];
  if (perms.includes("quitarse_prenda")) notes.push("Nunca la ropa interior. Puedes pasar sin dar explicaciones.");
  if (perms.includes("tiempo_a_solas")) notes.push("Pueden volver cuando quieran. A solas, todo sigue siendo voluntario y cualquiera puede parar.");
  if (perms.includes("beso_intenso") || perms.includes("caricias")) notes.push("Cualquiera puede parar en cualquier momento.");
  if (notes.length === 0) return null;
  return (
    <ul className="space-y-1 rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-muted">
      {notes.map((n) => (
        <li key={n} className="flex gap-2">
          <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-accent" />
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
    <div className="glass safe-bottom sticky bottom-0 z-10 -mx-4 mt-auto grid grid-cols-[1fr_1fr_1.4fr] gap-2 rounded-t-[28px] px-4 pt-3">
      {extra}
      <Button variant="secondary" icon="skip" className="!min-h-14 flex-col !gap-0.5 !px-2 !text-sm" onClick={pass}>
        Pasar
      </Button>
      <Button variant="secondary" icon="refresh" className="!min-h-14 flex-col !gap-0.5 !px-2 !text-sm" onClick={change}>
        Cambiar
      </Button>
      <Button icon="check" size="lg" className="!min-h-14 pulse-glow" onClick={complete} disabled={!canComplete}>
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
    if (timer?.running && remaining <= 0) timerFinished();
  }, [remaining, timer?.running, timerFinished]);

  useEffect(() => {
    if (prep === null) return;
    const id = setTimeout(() => {
      if (prep <= 1) {
        setPrep(null);
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
    <div className="space-y-4 rounded-3xl border border-line bg-white/5 p-4">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {!timer && prep === null && (
        <>
          {autoChoices && choices.length > 1 && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Duración del reloj">
              {choices.map((c) => (
                <button
                  key={c}
                  role="radio"
                  aria-checked={choice === c}
                  onClick={() => setChoice(c)}
                  className={cx(
                    "min-h-11 rounded-full border px-4 transition active:scale-95",
                    choice === c ? "border-transparent bg-gradient-to-r from-accent to-accent-2 font-semibold text-accent-ink" : "border-line hover:bg-white/10",
                  )}
                >
                  {fmt(c * 1000)}
                </button>
              ))}
            </div>
          )}
          <Button block variant="secondary" icon="timer" disabled={!authorized} onClick={() => setPrep(3)}>
            Comenzar reloj ({fmt(choice * 1000)})
          </Button>
        </>
      )}
      {prep !== null && (
        <p className="text-center font-display text-5xl italic text-gradient animate-pop" key={prep} aria-hidden>
          {prep}
        </p>
      )}
      {timer && (
        <div className="space-y-2 text-center">
          <div className="relative mx-auto size-40" aria-hidden>
            <svg viewBox="0 0 100 100" className="size-40 -rotate-90">
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
            <span className={cx("absolute inset-0 flex items-center justify-center text-4xl font-semibold tabular-nums", remaining <= 0 && "text-faint")}>
              {fmt(remaining)}
            </span>
          </div>
          {remaining <= 0 ? (
            <p className="text-muted">Tiempo terminado. Pueden marcar Cumplido o Pasar; no hay obligación de seguir.</p>
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
