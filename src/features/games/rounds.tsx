"use client";

import { useEffect, useMemo, useState } from "react";
import type { Activity } from "@/domain/models/activity";
import { BASE_GAMES, CATEGORY_LABEL, GAME_LABEL, PARTICIPANT_COLORS, PARTICIPANT_MARKS } from "@/domain/models/constants";
import type { SessionState, Turn } from "@/domain/models/session";
import { compatiblePartners, eligibleProtagonists, enabledBaseGames } from "@/domain/engine/orchestrator";
import { freshSeed, seededRng } from "@/domain/engine/rng";
import { nextLevel } from "@/domain/engine/progression";
import { CATALOG, getActivity } from "@/data/catalog";
import { useSession } from "@/stores/session";
import { Button, Card, Notice, ParticipantTag } from "@/components/ui";
import { ActionBar, ActivityCard, TimerControl, peopleOf, useNow } from "./common";
import { haptic, sfx, spinTicks } from "@/sound/sfx";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return document.documentElement.dataset.motion === "reduce" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Ronda estándar: carta, reloj opcional y acciones comunes. */
export function StandardRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  return (
    <>
      <ActivityCard session={session} turn={turn} activity={activity}>
        {activity.duracion && <TimerControl session={session} activity={activity} />}
      </ActivityCard>
      <ActionBar />
    </>
  );
}

/** Ruleta: la animación representa el resultado ya validado; nunca corrige después. */
export function RouletteRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const [done, setDone] = useState(false);
  const people = peopleOf(session);
  const segments = activity.tipoInteraccion === "group" && !turn.protagonist ? [...people.map((p) => p.alias), "Todos"] : people.map((p) => p.alias);
  const targetIndex = turn.protagonist ? people.findIndex((p) => p.id === turn.protagonist) : segments.length - 1;
  const seg = 360 / segments.length;
  const spinTo = 360 * 4 + (360 - (targetIndex * seg + seg / 2));
  useEffect(() => {
    const reduced = prefersReducedMotion();
    // Un tic por cada gajo que pasa bajo la flecha, cada vez más lentos.
    if (!reduced) spinTicks(1.8, Math.round(spinTo / seg));
    const t = setTimeout(() => setDone(true), reduced ? 50 : 1900);
    return () => clearTimeout(t);
  }, [spinTo, seg]);
  if (done) return <StandardRound session={session} turn={turn} activity={activity} />;
  const colors = [...PARTICIPANT_COLORS, "#8f8aa6"];
  return (
    <Card glow className="flex flex-col items-center gap-4 overflow-hidden">
      <p className="font-display text-xl italic text-muted" aria-live="polite">
        La ruleta gira…
      </p>
      <div className="scene-3d">
      <div className="wheel-3d relative size-64 rounded-full shadow-[0_30px_60px_-20px_var(--glow)]">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-2xl text-gold" aria-hidden>
          ▼
        </div>
        <svg viewBox="-100 -100 200 200" className="size-full" style={{ animation: "spin-wheel 1.8s cubic-bezier(.12,.7,.15,1) forwards", ["--spin-to" as string]: `${spinTo}deg` }} aria-hidden>
          {segments.map((label, i) => {
            const a0 = ((i * seg - 90) * Math.PI) / 180;
            const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
            const large = seg > 180 ? 1 : 0;
            const mid = (((i + 0.5) * seg - 90) * Math.PI) / 180;
            return (
              <g key={i}>
                <path d={`M0 0 L${95 * Math.cos(a0)} ${95 * Math.sin(a0)} A95 95 0 ${large} 1 ${95 * Math.cos(a1)} ${95 * Math.sin(a1)} Z`} fill={colors[i % colors.length]} opacity={0.85} stroke="#0b0b12" strokeWidth="2" />
                <text x={60 * Math.cos(mid)} y={60 * Math.sin(mid)} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#0b0b12" fontWeight="700">
                  {label.slice(0, 10)}
                </text>
              </g>
            );
          })}
          <circle r="14" fill="#1a0d22" stroke="url(#wheel-hub)" strokeWidth="4" />
          <defs>
            <linearGradient id="wheel-hub" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#F5C76B" />
              <stop offset="1" stopColor="#FF4D8D" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      </div>
    </Card>
  );
}

/** Dados: participante, actividad y duración, todos validados antes de animar. */
export function DiceRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const reduced = prefersReducedMotion();
    if (!reduced) sfx("diceRoll", { duration: 1.25 });
    const t = setTimeout(() => {
      if (!reduced) {
        sfx("diceLand");
        haptic(30);
      }
      setDone(true);
    }, reduced ? 50 : 1600);
    return () => clearTimeout(t);
  }, []);
  const who = turn.protagonist ? session.config.participants.find((p) => p.id === turn.protagonist) : null;
  const faces = [
    { label: "Participante", value: who ? `${PARTICIPANT_MARKS[who.slot]} ${who.alias}` : "Todos" },
    { label: "Actividad", value: CATEGORY_LABEL[activity.categoria] },
    { label: "Duración", value: activity.duracion ? `${activity.duracion.sugerida} s` : "Libre" },
  ];
  return (
    <>
      <Card className="space-y-3">
        <p className="sr-only" aria-live="polite">
          {done ? `Resultado: ${faces.map((f) => `${f.label} ${f.value}`).join(", ")}` : "Lanzando dados"}
        </p>
        <div className="grid grid-cols-3 gap-2 py-2">
          {faces.map((f, i) => (
            <div key={f.label} className="flex flex-col items-center gap-1">
              <div className="scene-3d flex h-28 items-end justify-center">
                <div className={done ? "cube" : "cube rolling"} style={{ animationDelay: `${i * 120}ms` }} aria-hidden>
                  <div className="f1">{f.value}</div>
                  <div className="f2">✦</div>
                  <div className="f3">♥</div>
                  <div className="f4">✦</div>
                  <div className="f5">♥</div>
                  <div className="f6">✦</div>
                </div>
              </div>
              <div className="cube-shadow" aria-hidden />
              <span className="text-xs uppercase tracking-widest text-faint">{f.label}</span>
            </div>
          ))}
        </div>
      </Card>
      {done && <StandardRound session={session} turn={turn} activity={activity} />}
    </>
  );
}

/** Carta sorpresa: efecto compatible o pasar. Una elección manual solo afecta una oportunidad. */
export function SurpriseRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const complete = useSession((s) => s.complete);
  const pass = useSession((s) => s.pass);
  const setPending = useSession((s) => s.setPending);
  const setGame = useSession((s) => s.setGame);
  const requestLevelUp = useSession((s) => s.requestLevelUp);
  const people = peopleOf(session);
  const rng = useMemo(() => seededRng(freshSeed()), []);
  const now = useNow();
  const effect = activity.effect;

  const partners = useMemo(
    () => (effect === "elegir_companero" && turn.assignment.p1 ? compatiblePartners(CATALOG, session, turn.assignment.p1, now, rng) : []),
    [effect, session, turn.assignment.p1, rng, now],
  );
  const protagonists = useMemo(() => (effect === "elegir_protagonista" ? eligibleProtagonists(CATALOG, session, rng, now) : []), [effect, session, rng, now]);
  const repeatable = useMemo(() => {
    if (effect !== "repetir_voluntaria") return [];
    const ids: string[] = [];
    for (let i = session.history.length - 1; i >= 0 && ids.length < 5; i--) {
      const h = session.history[i];
      const a = getActivity(h.activityId);
      if (!a || a.formato === "sorpresa" || h.rejected || ids.includes(a.id) || a.intensidad !== session.level) continue;
      ids.push(a.id);
    }
    return ids.map((id) => getActivity(id)!);
  }, [effect, session]);
  const games = enabledBaseGames(session).filter((g) => g !== turn.game);
  useEffect(() => sfx("special"), [turn.id]);

  let body: React.ReactNode = null;
  if (effect === "elegir_companero") {
    body = partners.length ? (
      <div className="grid gap-2">
        {partners.map((pid) => {
          const p = people.find((x) => x.id === pid)!;
          return (
            <Button
              key={pid}
              variant="secondary"
              onClick={() => {
                setPending({ forcedAssignment: { p1: turn.assignment.p1, p2: pid } });
                complete();
              }}
            >
              <ParticipantTag alias={p.alias} slot={p.slot} />
            </Button>
          );
        })}
      </div>
    ) : (
      <Notice>No hay ahora una actividad en pareja compatible. Sigamos con la rotación normal.</Notice>
    );
  } else if (effect === "elegir_protagonista") {
    body = (
      <div className="grid gap-2">
        {protagonists.map((pid) => {
          const p = people.find((x) => x.id === pid)!;
          return (
            <Button
              key={pid}
              variant="secondary"
              onClick={() => {
                setPending({ forcedProtagonist: pid });
                complete();
              }}
            >
              <ParticipantTag alias={p.alias} slot={p.slot} />
            </Button>
          );
        })}
        {protagonists.length === 0 && <Notice>No hay opciones individuales compatibles ahora.</Notice>}
      </div>
    );
  } else if (effect === "repetir_voluntaria") {
    body = repeatable.length ? (
      <div className="grid gap-2">
        <p className="text-sm text-muted">Al elegir, se volverá a validar y todas las personas implicadas responderán de nuevo en privado.</p>
        {repeatable.map((a) => (
          <Button
            key={a.id}
            variant="secondary"
            onClick={() => {
              setPending({ repeatActivityId: a.id });
              complete();
            }}
          >
            {a.titulo.replace(/\{p[123]\}/g, "…")}
          </Button>
        ))}
      </div>
    ) : (
      <Notice>Todavía no hay actividades para repetir.</Notice>
    );
  } else if (effect === "doble_mini") {
    body = (
      <Button
        block
        onClick={() => {
          setPending({ miniRemaining: 2 });
          complete();
        }}
      >
        Vamos con dos mini actividades
      </Button>
    );
  } else if (effect === "cambiar_juego") {
    body = games.length ? (
      <div className="grid gap-2">
        {games.map((g) => (
          <Button
            key={g}
            variant="secondary"
            onClick={() => {
              complete();
              setGame(g);
            }}
          >
            {GAME_LABEL[g]}
          </Button>
        ))}
      </div>
    ) : (
      <Notice>Solo hay un juego activo.</Notice>
    );
  } else if (effect === "proponer_subir") {
    body = nextLevel(session.level) ? (
      <Button
        block
        onClick={() => {
          complete();
          requestLevelUp();
        }}
      >
        Preguntar en privado
      </Button>
    ) : null;
  }

  const plainCard = effect === "todos_participan" || effect === "roles_juego" || !effect;
  return (
    <>
      <ActivityCard session={session} turn={turn} activity={activity}>
        <p className="text-sm font-semibold text-gold">Carta sorpresa</p>
        {body}
      </ActivityCard>
      {plainCard ? (
        <ActionBar />
      ) : (
        <div className="glass safe-bottom sticky bottom-0 z-10 -mx-4 mt-auto grid grid-cols-1 gap-2 rounded-t-3xl px-4 pt-3">
          <Button variant="secondary" onClick={pass}>
            Pasar la sorpresa
          </Button>
        </div>
      )}
    </>
  );
}

export function isBaseGame(g: string): boolean {
  return (BASE_GAMES as readonly string[]).includes(g);
}

