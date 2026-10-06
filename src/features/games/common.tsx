"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { Activity } from "@/domain/models/activity";
import { CATEGORY_LABEL, GAME_LABEL, INTENSITY_LABEL, TIMER_OPTIONS_SEC } from "@/domain/models/constants";
import type { SessionState, Turn } from "@/domain/models/session";
import { timerRemaining } from "@/domain/state/session";
import { useSession } from "@/stores/session";
import { Button, Card, ParticipantTag, cx } from "@/components/ui";
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
    <Card className="space-y-4 animate-in" >
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-faint">
        <span>{GAME_LABEL[turn.game]}</span>
        <span aria-hidden>·</span>
        <span>{CATEGORY_LABEL[activity.categoria]}</span>
        <span aria-hidden>·</span>
        <span className="text-accent">{INTENSITY_LABEL[activity.intensidad]}</span>
        {turn.chainStage !== undefined && (
          <>
            <span aria-hidden>·</span>
            <span>Etapa {turn.chainStage + 1} de 3</span>
          </>
        )}
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold leading-snug">
        <RoleText text={activity.titulo} session={session} turn={turn} />
      </h2>
      {!hideText && (
        <p className="text-xl leading-relaxed" data-testid="activity-text">
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
      {children}
      <button
        type="button"
        onClick={() => void toggleFavorite(activity.id)}
        aria-pressed={isFav}
        className="min-h-11 text-sm text-muted underline-offset-4 hover:underline"
      >
        {isFav ? "★ En favoritas" : "☆ Guardar en favoritas"}
        {favoritesMode === "temporary" && <span className="text-faint"> (temporal)</span>}
      </button>
    </Card>
  );
}

/** Pie fijo: Cumplido, Pasar y Cambiar. */
export function ActionBar({ extra, canComplete = true, completeLabel = "Cumplido" }: { extra?: ReactNode; canComplete?: boolean; completeLabel?: string }) {
  const complete = useSession((s) => s.complete);
  const pass = useSession((s) => s.pass);
  const change = useSession((s) => s.change);
  return (
    <div className="glass safe-bottom sticky bottom-0 z-10 -mx-4 grid grid-cols-3 gap-2 rounded-t-3xl px-4 pt-3">
      {extra}
      <Button variant="secondary" onClick={pass}>
        Pasar
      </Button>
      <Button variant="secondary" onClick={change}>
        Cambiar
      </Button>
      <Button onClick={complete} disabled={!canComplete}>
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
    <div className="space-y-3 rounded-2xl border border-line p-4">
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
                  className={cx("min-h-11 rounded-full border px-4", choice === c ? "border-accent bg-accent text-accent-ink" : "border-line")}
                >
                  {fmt(c * 1000)}
                </button>
              ))}
            </div>
          )}
          <Button block variant="secondary" disabled={!authorized} onClick={() => setPrep(3)}>
            Comenzar reloj ({fmt(choice * 1000)})
          </Button>
        </>
      )}
      {prep !== null && (
        <p className="text-center text-4xl font-bold" aria-hidden>
          Preparados… {prep}
        </p>
      )}
      {timer && (
        <div className="space-y-2 text-center">
          <p className={cx("text-5xl font-bold tabular-nums", remaining <= 0 && "text-faint")} aria-hidden>
            {fmt(remaining)}
          </p>
          {remaining <= 0 ? (
            <p className="text-muted">Tiempo terminado. Pueden marcar Cumplido o Pasar; no hay obligación de seguir.</p>
          ) : timer.running ? (
            <Button variant="secondary" onClick={pauseTimer}>
              Pausar reloj
            </Button>
          ) : (
            <Button variant="secondary" onClick={resumeTimer}>
              Reanudar reloj
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
