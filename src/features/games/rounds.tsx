"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Activity } from "@/domain/models/activity";
import { BASE_GAMES, CATEGORY_LABEL, GAME_LABEL, PARTICIPANT_COLORS, PARTICIPANT_MARKS } from "@/domain/models/constants";
import type { SessionState, Turn } from "@/domain/models/session";
import { compatiblePartners, eligibleProtagonists, enabledBaseGames } from "@/domain/engine/orchestrator";
import { freshSeed, seededRng, shuffle } from "@/domain/engine/rng";
import { normalizeText } from "@/domain/content/validate";
import { nextLevel } from "@/domain/engine/progression";
import { CATALOG, getActivity } from "@/data/catalog";
import { useSession } from "@/stores/session";
import { Button, Card, Notice, ParticipantTag } from "@/components/ui";
import { PrivateRound, type Person } from "@/features/session/PrivateRound";
import { ActionBar, ActivityCard, RoleText, TimerControl, peopleOf, useNow } from "./common";

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
    const t = setTimeout(() => setDone(true), prefersReducedMotion() ? 50 : 1900);
    return () => clearTimeout(t);
  }, []);
  if (done) return <StandardRound session={session} turn={turn} activity={activity} />;
  const colors = [...PARTICIPANT_COLORS, "#8f8aa6"];
  return (
    <Card className="flex flex-col items-center gap-4">
      <p className="text-muted" aria-live="polite">
        La ruleta gira…
      </p>
      <div className="relative size-64">
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
        </svg>
      </div>
    </Card>
  );
}

/** Dados: participante, actividad y duración, todos validados antes de animar. */
export function DiceRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), prefersReducedMotion() ? 50 : 1400);
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
        <div className="grid grid-cols-3 gap-2">
          {faces.map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1">
              <div
                className="flex size-20 items-center justify-center rounded-2xl border-2 border-accent bg-surface-2 p-1 text-center text-sm font-bold"
                style={done ? undefined : { animation: "dice-roll 0.45s linear infinite" }}
                aria-hidden
              >
                {done ? f.value : "?"}
              </div>
              <span className="text-xs text-faint">{f.label}</span>
            </div>
          ))}
        </div>
      </Card>
      {done && <StandardRound session={session} turn={turn} activity={activity} />}
    </>
  );
}

/** ¿Quién es más probable?: voto privado por persona, abstención posible, resultado agregado sin votantes. */
export function MostLikelyRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const [phase, setPhase] = useState<"question" | "voting" | "result">("question");
  const [tally, setTally] = useState<Record<string, number> | null>(null);
  const enterReveal = useSession((s) => s.enterReveal);
  const people = peopleOf(session);

  if (phase === "voting") {
    return (
      <PrivateRound<string>
        key="voting"
        people={people}
        title="Votación privada"
        onCancel={() => setPhase("question")}
        cancelLabel="Volver a la pregunta"
        renderPrivate={(p, submit) => (
          <Card className="space-y-4">
            <p className="text-sm text-faint">
              Voto privado de <ParticipantTag alias={p.alias} slot={p.slot} />
            </p>
            <p className="text-xl font-semibold">{activity.texto}</p>
            <div className="grid gap-2">
              {people.map((o) => (
                <Button key={o.id} variant="secondary" onClick={() => submit(o.id)}>
                  <ParticipantTag alias={o.alias} slot={o.slot} />
                </Button>
              ))}
              <Button variant="ghost" onClick={() => submit("abstain")}>
                Abstenerme
              </Button>
            </div>
          </Card>
        )}
        onComplete={(answers) => {
          const t: Record<string, number> = {};
          for (const v of answers.values()) if (v !== "abstain") t[v] = (t[v] ?? 0) + 1;
          answers.clear();
          setTally(t);
          setPhase("result");
          enterReveal();
        }}
      />
    );
  }

  if (phase === "result" && tally) {
    const max = Math.max(0, ...Object.values(tally));
    const winners = people.filter((p) => (tally[p.id] ?? 0) === max && max > 0);
    return (
      <>
        <Card className="space-y-4">
          <p className="text-lg">{activity.texto}</p>
          <ul className="space-y-2" aria-label="Resultado agregado">
            {people.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
                <ParticipantTag alias={p.alias} slot={p.slot} />
                <span className="tabular-nums">{tally[p.id] ?? 0} votos</span>
              </li>
            ))}
          </ul>
          <p className="text-xl font-bold" role="status">
            {max === 0 ? "Todas las personas se abstuvieron." : winners.length > 1 ? "¡Empate!" : <>Resultado: <ParticipantTag alias={winners[0].alias} slot={winners[0].slot} /></>}
          </p>
          <Notice>Los votos no muestran quién votó, aunque en grupos pequeños se puede intuir. Ningún voto decide contacto ni límites.</Notice>
        </Card>
        <ActionBar completeLabel="Nueva ronda" />
      </>
    );
  }

  return (
    <>
      <ActivityCard session={session} turn={turn} activity={activity}>
        <Button block onClick={() => setPhase("voting")}>
          Votar en privado
        </Button>
      </ActivityCard>
      <ActionBar canComplete={false} />
    </>
  );
}

/** ¿Quién me conoce mejor?: respuesta de referencia y adivinanzas; revelación con coincidencias voluntarias. */
export function KnowMeRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const [phase, setPhase] = useState<"intro" | "reference" | "guesses" | "reveal">("intro");
  const reference = useRef<string | null>(null);
  const guesses = useRef(new Map<string, string>());
  const [revealData, setRevealData] = useState<{ ref: string; guesses: [string, string][] } | null>(null);
  const [matches, setMatches] = useState<Record<string, boolean>>({});
  const enterReveal = useSession((s) => s.enterReveal);
  const refPerson = peopleOf(session).find((p) => p.id === turn.assignment.p1)!;
  const guessers = peopleOf(session).filter((p) => p.id !== refPerson.id);
  const closed = activity.opciones;

  useEffect(() => {
    const g = guesses.current;
    return () => {
      g.clear();
      reference.current = null;
    };
  }, []);

  const answerInput = (p: Person, submit: (v: string) => void, prompt: string) =>
    closed ? (
      <Card className="space-y-3">
        <p className="text-sm text-faint">
          Respuesta privada de <ParticipantTag alias={p.alias} slot={p.slot} />
        </p>
        <p className="text-lg font-semibold">{prompt}</p>
        <div className="grid gap-2">
          {closed.map((o) => (
            <Button key={o} variant="secondary" onClick={() => submit(o)}>
              {o}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => submit("")}>
            Pasar
          </Button>
        </div>
      </Card>
    ) : (
      <FreeTextAnswer person={p} prompt={prompt} onSubmit={submit} maxLength={120} />
    );

  if (phase === "reference") {
    return (
      <PrivateRound<string>
        key="reference"
        people={[refPerson]}
        title="Respuesta de referencia"
        onCancel={() => setPhase("intro")}
        renderPrivate={(p, submit) => answerInput(p, submit, `Tu respuesta: ${activity.texto.replace("{p1}", "ti")}`)}
        onComplete={(a) => {
          reference.current = a.get(refPerson.id) ?? "";
          setPhase("guesses");
        }}
      />
    );
  }
  if (phase === "guesses") {
    return (
      <PrivateRound<string>
        key="guesses"
        people={guessers}
        title="Adivinanzas"
        onCancel={() => setPhase("intro")}
        renderPrivate={(p, submit) => answerInput(p, submit, `Adivina: ${activity.texto.replace("{p1}", refPerson.alias)}`)}
        onComplete={(a) => {
          guesses.current = a;
          setRevealData({ ref: reference.current ?? "", guesses: [...a.entries()] });
          if (closed) {
            const auto: Record<string, boolean> = {};
            for (const [pid, g] of a.entries()) auto[pid] = !!g && normalizeText(g) === normalizeText(reference.current ?? "");
            setMatches(auto);
          }
          setPhase("reveal");
          enterReveal();
        }}
      />
    );
  }
  if (phase === "reveal" && revealData) {
    return (
      <>
        <Card className="space-y-4">
          <p className="text-lg">
            <RoleText text={activity.texto} session={session} turn={turn} />
          </p>
          <div className="rounded-xl border border-accent p-3">
            <p className="text-sm text-faint">
              Respuesta de <ParticipantTag alias={refPerson.alias} slot={refPerson.slot} />
            </p>
            <p className="text-xl font-bold">{revealData.ref || "(prefirió no responder)"}</p>
          </div>
          <ul className="space-y-2">
            {revealData.guesses.map(([pid, g]) => {
              const p = guessers.find((x) => x.id === pid)!;
              return (
                <li key={pid} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                  <span>
                    <ParticipantTag alias={p.alias} slot={p.slot} />: {g || "(pasó)"}
                  </span>
                  {!closed && g && (
                    <Button variant={matches[pid] ? "primary" : "ghost"} aria-pressed={!!matches[pid]} onClick={() => setMatches((m) => ({ ...m, [pid]: !m[pid] }))}>
                      {matches[pid] ? "Coincide ✓" : "¿Coincide?"}
                    </Button>
                  )}
                  {closed && <span>{matches[pid] ? "✓ Coincide" : "—"}</span>}
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-muted">Marcar coincidencias es opcional; no hay puntuación obligatoria. Las respuestas desaparecen al cerrar la ronda.</p>
        </Card>
        <ActionBar completeLabel="Cerrar ronda" />
      </>
    );
  }
  return (
    <>
      <ActivityCard session={session} turn={turn} activity={activity}>
        <p className="text-muted">
          Primero responde en privado <ParticipantTag alias={refPerson.alias} slot={refPerson.slot} />; después, las demás personas intentan adivinar.
        </p>
        <Button block onClick={() => setPhase("reference")}>
          Empezar
        </Button>
      </ActivityCard>
      <ActionBar canComplete={false} />
    </>
  );
}

function FreeTextAnswer({ person, prompt, onSubmit, maxLength }: { person: Person; prompt: string; onSubmit: (v: string) => void; maxLength: number }) {
  const [text, setText] = useState("");
  return (
    <Card className="space-y-3">
      <p className="text-sm text-faint">
        Respuesta privada de <ParticipantTag alias={person.alias} slot={person.slot} />
      </p>
      <label className="block space-y-2">
        <span className="text-lg font-semibold">{prompt}</span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-line bg-surface-2 p-3 text-ink"
          value={text}
          maxLength={maxLength}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <p className="text-right text-xs text-faint">
        {text.length}/{maxLength}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={() => onSubmit("")}>
          Pasar
        </Button>
        <Button disabled={text.trim().length === 0} onClick={() => onSubmit(text.trim())}>
          Guardar
        </Button>
      </div>
    </Card>
  );
}

/** Secretos: escritura temporal, revisión, mezcla y revelación; la autoría solo con permiso individual. */
export function SecretsRound({ session, turn, activity }: { session: SessionState; turn: Turn; activity: Activity }) {
  const [phase, setPhase] = useState<"warning" | "writing" | "shuffled" | "authorship" | "end">("warning");
  const [entries, setEntries] = useState<{ text: string; author: string }[]>([]);
  const [index, setIndex] = useState(0);
  const [revealedAuthors, setRevealedAuthors] = useState<Record<number, string>>({});
  const enterReveal = useSession((s) => s.enterReveal);
  const people = peopleOf(session);
  const [authorMap] = useState(() => new Map<number, string>());
  const [authorIds, setAuthorIds] = useState<string[]>([]);

  useEffect(() => () => authorMap.clear(), [authorMap]);

  if (phase === "writing") {
    return (
      <PrivateRound<string>
        key="writing"
        people={people}
        title="Secretos"
        onCancel={() => setPhase("warning")}
        renderPrivate={(p, submit) => <SecretWriter person={p} prompt={activity.texto} onSubmit={submit} />}
        onComplete={(answers) => {
          const rng = seededRng(freshSeed());
          const list = shuffle(
            [...answers.entries()].filter(([, t]) => t.trim().length > 0).map(([author, text]) => ({ author, text })),
            rng,
          );
          answers.clear();
          list.forEach((e, i) => authorMap.set(i, e.author));
          setAuthorIds([...new Set(list.map((e) => e.author))]);
          setEntries(list.map((e) => ({ text: e.text, author: "" })));
          setPhase("shuffled");
          enterReveal();
        }}
      />
    );
  }

  if (phase === "authorship") {
    const authors = people.filter((p) => authorIds.includes(p.id));
    return (
      <PrivateRound<boolean>
        key="authorship"
        people={authors}
        title="Revelar autoría (opcional)"
        onCancel={() => setPhase("shuffled")}
        renderPrivate={(p, submit) => (
          <Card className="space-y-3">
            <p className="text-sm text-faint">
              Decisión privada de <ParticipantTag alias={p.alias} slot={p.slot} />
            </p>
            <p className="text-lg font-semibold">¿Quieres que el grupo sepa cuál escribiste?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => submit(false)}>
                No
              </Button>
              <Button variant="secondary" onClick={() => submit(true)}>
                Sí
              </Button>
            </div>
          </Card>
        )}
        onComplete={(a) => {
          const out: Record<number, string> = {};
          for (const [i, pid] of authorMap.entries()) if (a.get(pid) === true) out[i] = pid;
          a.clear();
          setRevealedAuthors(out);
          setPhase("end");
        }}
      />
    );
  }

  if (phase === "shuffled" || phase === "end") {
    const showAll = phase === "end";
    return (
      <>
        <Card className="space-y-4">
          <p className="text-sm text-faint">{activity.texto}</p>
          {entries.length === 0 ? (
            <p className="text-lg">Nadie escribió en esta ronda. Está bien.</p>
          ) : showAll ? (
            <ul className="space-y-2">
              {entries.map((e, i) => {
                const pid = revealedAuthors[i];
                const p = pid ? people.find((x) => x.id === pid) : null;
                return (
                  <li key={i} className="rounded-xl border border-line p-3">
                    <p className="text-lg">«{e.text}»</p>
                    <p className="text-sm text-faint">{p ? <>Autoría revelada: <ParticipantTag alias={p.alias} slot={p.slot} /></> : "Autoría anónima"}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-faint">
                Secreto {index + 1} de {entries.length}
              </p>
              <p className="text-2xl leading-relaxed">«{entries[index].text}»</p>
              <p className="text-sm text-muted">Pueden intentar adivinar en voz alta quién lo escribió. Nadie está obligado a confirmarlo.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                  Anterior
                </Button>
                {index + 1 < entries.length ? (
                  <Button onClick={() => setIndex((i) => i + 1)}>Siguiente</Button>
                ) : (
                  <Button onClick={() => setPhase("authorship")}>Autorías (opcional)</Button>
                )}
              </div>
            </div>
          )}
        </Card>
        <ActionBar completeLabel="Borrar y cerrar" />
      </>
    );
  }

  return (
    <>
      <ActivityCard session={session} turn={turn} activity={activity}>
        <Notice tone="warn">
          Lo que escribas se leerá al grupo, mezclado y sin nombre. Podrás revisarlo, editarlo o retirarlo antes de pasar el teléfono. Máximo 280
          caracteres. Todo se borra al cerrar la ronda.
        </Notice>
        <Button block onClick={() => setPhase("writing")}>
          Empezar a escribir
        </Button>
      </ActivityCard>
      <ActionBar canComplete={false} />
    </>
  );
}

function SecretWriter({ person, prompt, onSubmit }: { person: Person; prompt: string; onSubmit: (v: string) => void }) {
  const [text, setText] = useState("");
  const [review, setReview] = useState(false);
  if (review) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-faint">Revisión privada</p>
        <p className="text-lg">«{text.trim()}»</p>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="ghost" onClick={() => onSubmit("")}>
            Retirar
          </Button>
          <Button variant="secondary" onClick={() => setReview(false)}>
            Editar
          </Button>
          <Button onClick={() => onSubmit(text.trim())}>Confirmar</Button>
        </div>
      </Card>
    );
  }
  return (
    <Card className="space-y-3">
      <p className="text-sm text-faint">
        Escritura privada de <ParticipantTag alias={person.alias} slot={person.slot} />
      </p>
      <label className="block space-y-2">
        <span className="text-lg font-semibold">{prompt}</span>
        <textarea
          className="min-h-32 w-full rounded-xl border border-line bg-surface-2 p-3 text-ink"
          value={text}
          maxLength={280}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <p className="text-right text-xs text-faint">{text.length}/280</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={() => onSubmit("")}>
          Pasar
        </Button>
        <Button disabled={text.trim().length === 0} onClick={() => setReview(true)}>
          Revisar
        </Button>
      </div>
    </Card>
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
        <div className="glass safe-bottom sticky bottom-0 z-10 -mx-4 grid grid-cols-1 gap-2 rounded-t-3xl px-4 pt-3">
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

