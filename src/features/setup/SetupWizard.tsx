"use client";


import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APP_NAME,
  BASE_GAMES,
  GAMES,
  GAME_DESCRIPTION,
  GAME_LABEL,
  INTENSITIES,
  INTENSITY_DESCRIPTION,
  INTENSITY_LABEL,
  RELATIONSHIPS,
  RELATIONSHIP_LABEL,
  type GameId,
  type Intensity,
  type Light,
  type Permission,
  type Relationship,
  GENDERS,
  GENDER_LABEL,
  type Gender,
} from "@/domain/models/constants";
import type { LimitProfile, Participant, Preferences, SessionConfig, StorageMode } from "@/domain/models/session";
import { neutralSharedLimits, newLimitProfile } from "@/domain/consent/limits";
import { randomId, seededRng } from "@/domain/engine/rng";
import { buildCandidates } from "@/domain/engine/select";
import { GAME_FORMATS } from "@/domain/engine/orchestrator";
import { createSession, resolveInitialConsent } from "@/domain/state/session";
import { CATALOG, CONTENT_VERSION } from "@/data/catalog";
import { useSession } from "@/stores/session";
import { Button, Card, Chip, GameEmblem, Icon, cx, Notice, OptionTile, ParticipantTag, Screen, Steps, Title, Toggle } from "@/components/ui";
import { LEVEL_ICON } from "@/components/ui/visuals";
import { ConsentRound, PrivateRound, type Person } from "@/features/session/PrivateRound";
import { LimitsEditor, SharedLimitsEditor } from "./LimitsEditor";

type Step = "mode" | "count" | "aliases" | "relationship" | "limits" | "shared" | "level" | "duration" | "games" | "summary" | "consent";
const ORDER: Step[] = ["mode", "count", "aliases", "relationship", "limits", "shared", "level", "duration", "games", "summary"];

interface Draft {
  id: string;
  alias: string;
  adult: boolean;
  gender: Gender | null;
  limits: LimitProfile;
  prefs: Preferences;
  limitsDone: boolean;
}

const DEFAULT_PREFS: Preferences = { preferred: ["preguntas", "musica", "conexion"], avoided: [] };
const DURATIONS: (number | null)[] = [15, 30, 45, 60, null];

function newDraft(): Draft {
  return { id: randomId("u_"), alias: "", adult: false, gender: null, limits: newLimitProfile(), prefs: { ...DEFAULT_PREFS, preferred: [...DEFAULT_PREFS.preferred] }, limitsDone: false };
}

function trimAlias(a: string): string {
  return a.trim().replace(/\s+/g, " ");
}

/** Configuración final: Noche completa y Caos expanden su mezcla de juegos. */
export function finalGames(selected: GameId[], caosExcluded: GameId[]): { games: GameId[]; forcedDuration: number | null } {
  if (selected.includes("noche")) return { games: ["noche", ...BASE_GAMES, "sorpresa"], forcedDuration: 60 };
  if (selected.includes("caos")) {
    const base = BASE_GAMES.filter((g) => !caosExcluded.includes(g));
    return { games: ["caos", ...base, ...(selected.includes("sorpresa") ? (["sorpresa"] as GameId[]) : [])], forcedDuration: null };
  }
  return { games: selected, forcedDuration: null };
}

export function SetupWizard() {
  const router = useRouter();
  const startSession = useSession((s) => s.startSession);
  const initialConsent = useSession((s) => s.initialConsent);

  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<StorageMode>("normal");
  const [count, setCount] = useState<2 | 3>(2);
  const [drafts, setDrafts] = useState<Draft[]>([newDraft(), newDraft(), newDraft()]);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [shared, setShared] = useState<Partial<Record<Permission, Light>>>(neutralSharedLimits());
  const [level, setLevel] = useState<Intensity>("leve");
  const [duration, setDuration] = useState<number | null>(30);
  const [games, setGames] = useState<GameId[]>(["verdad_reto", "tarjetas"]);
  const [caosExcluded, setCaosExcluded] = useState<GameId[]>([]);
  const [editing, setEditing] = useState(false);
  const [rejected, setRejected] = useState(false);

  const active = drafts.slice(0, count);
  const people: Person[] = active.map((d, i) => ({ id: d.id, alias: trimAlias(d.alias), slot: i }));

  const participants: Participant[] = active.map((d, i) => ({
    id: d.id,
    alias: trimAlias(d.alias),
    slot: i,
    adultDeclared: d.adult,
    ...(d.gender ? { gender: d.gender } : {}),
    limits: d.limits,
    preferences: d.prefs,
  }));

  const { games: resolvedGames, forcedDuration } = finalGames(games, caosExcluded);
  const effectiveDuration = forcedDuration ?? duration;

  const config: SessionConfig = {
    mode,
    participants,
    relationship,
    initialLevel: level,
    durationMin: effectiveDuration,
    games: resolvedGames,
    sharedLimits: shared,
  };

  // Disponibilidad por juego con los límites actuales (sin mostrar detalles privados).
  const availability = useMemo(() => {
    if (step !== "games" && step !== "summary") return {} as Record<GameId, boolean>;
    const probe = resolveInitialConsent(
      createSession({ ...config, games: [...BASE_GAMES, "sorpresa"] }, { now: 0, contentVersion: CONTENT_VERSION, seed: 1, rng: seededRng(1) }),
      true,
      0,
    );
    const wide = { ...probe, progress: { ...probe.progress, turnsOfferedInLevel: 99, horizonMs: null } };
    const out = {} as Record<GameId, boolean>;
    for (const g of GAMES) {
      if (g === "noche" || g === "caos") continue;
      out[g] = buildCandidates(CATALOG, wide, { game: g, formats: GAME_FORMATS[g], requireDuration: g === "temporizador" }, 0).length > 0;
    }
    out.noche = BASE_GAMES.some((g) => out[g]);
    out.caos = out.noche;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, level, count, drafts, shared]);

  const go = (dir: 1 | -1) => {
    const i = ORDER.indexOf(step);
    const next = ORDER[Math.min(ORDER.length - 1, Math.max(0, i + dir))];
    setEditing(false);
    setRejected(false);
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const aliasesValid = active.every((d) => {
    const a = trimAlias(d.alias);
    return a.length >= 1 && a.length <= 24 && d.adult && d.gender !== null;
  });
  const filledAliases = active.map((d) => trimAlias(d.alias).toLowerCase()).filter(Boolean);
  const duplicateAliases = new Set(filledAliases).size < filledAliases.length;

  const updateDraft = (id: string, patch: Partial<Draft>) => setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const header = (
    <div className="flex items-center gap-3">
      <Button variant="secondary" icon="back" className="!min-h-11 !px-3" onClick={() => (step === "mode" ? router.push("/") : go(-1))} aria-label="Atrás">
        <span className="sr-only">Atrás</span>
      </Button>
      <Steps current={Math.min(ORDER.indexOf(step) + 1, ORDER.length)} total={ORDER.length} />
    </div>
  );

  if (step === "consent") {
    return (
      <Screen level={level}>
        <Title sub="Cada persona responde en privado. Si alguien no acepta, no se empieza y nadie sabrá quién fue.">Consentimiento inicial</Title>
        <ConsentRound
          people={people}
          title="Consentimiento inicial"
          question="¿Aceptas comenzar con esta configuración?"
          detail={
            <ul className="list-disc pl-5">
              <li>{count} personas</li>
              <li>Intensidad: {INTENSITY_LABEL[level]}</li>
              <li>Duración: {effectiveDuration ? `${effectiveDuration} minutos` : "sin límite"}</li>
              <li>Juegos: {games.map((g) => GAME_LABEL[g]).join(", ")}</li>
              <li>Puedes pasar, pausar o detener en cualquier momento.</li>
            </ul>
          }
          onCancel={() => setStep("summary")}
          onResult={(ok) => {
            if (!ok) {
              setRejected(true);
              setStep("summary");
              return;
            }
            startSession(config);
            initialConsent(true);
            router.push("/jugar/");
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen level={level}>
      {header}

      {step === "mode" && (
        <>
          <Title sub="Antes de pedir nombres, decide si esta sesión se guarda en el dispositivo.">¿Cómo quieren guardar la sesión?</Title>
          <div className="space-y-3" role="radiogroup" aria-label="Modo de almacenamiento">
            <OptionTile
              selected={mode === "normal"}
              onClick={() => setMode("normal")}
              icon="heart"
              title="Sesión normal"
              description="Alias, límites y progreso se guardan solo en este dispositivo para continuar después."
            />
            <OptionTile
              selected={mode === "private"}
              onClick={() => setMode("private")}
              icon="lock"
              title="Sesión privada"
              description="Nada se guarda: al terminar o cerrar, todo se descarta."
            />
          </div>
          <Notice>
            Guardar en el dispositivo no es un respaldo permanente: el navegador puede borrar datos locales. Cualquiera con acceso a este teléfono
            podría ver la app.
          </Notice>
          <Button block size="lg" onClick={() => go(1)}>
            Continuar
          </Button>
        </>
      )}

      {step === "count" && (
        <>
          <Title sub={`${APP_NAME} funciona con exactamente 2 o 3 adultos que comparten este teléfono.`}>¿Cuántas personas juegan?</Title>
          <div className="grid grid-cols-2 gap-3">
            {[2, 3].map((n) => (
              <Button
                key={n}
                variant={count === n ? "primary" : "secondary"}
                aria-pressed={count === n}
                className="!min-h-32 flex-col rounded-[28px] font-display text-5xl italic"
                onClick={() => setCount(n as 2 | 3)}
              >
                {n}
                <span className="font-sans text-sm not-italic opacity-80">{n === 2 ? "en pareja" : "de a tres"}</span>
              </Button>
            ))}
          </div>
          <Button block size="lg" onClick={() => go(1)}>
            Continuar
          </Button>
        </>
      )}

      {step === "aliases" && (
        <>
          <Title sub="Solo un alias y si es hombre o mujer (para las cartas de pareja hombre y mujer). Sin correo, teléfono ni fecha de nacimiento.">¿Quiénes juegan?</Title>
          <div className="space-y-4">
            {active.map((d, i) => (
              <Card key={d.id} className="space-y-3">
                <label className="block space-y-1">
                  <span className="font-semibold">
                    <ParticipantTag alias={`Persona ${i + 1}`} slot={i} />
                  </span>
                  <input
                    className="min-h-12 w-full rounded-2xl border border-line bg-white/5 px-4 text-lg text-ink transition placeholder:text-faint focus:border-accent focus:bg-white/10 focus:outline-none"
                    placeholder="Alias"
                    value={d.alias}
                    maxLength={40}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label={`Alias de la persona ${i + 1}`}
                    onChange={(e) => updateDraft(d.id, { alias: e.target.value })}
                  />
                  {trimAlias(d.alias).length > 24 && <span className="text-sm text-bad">Máximo 24 caracteres.</span>}
                </label>
                <div role="radiogroup" aria-label={`Género de la persona ${i + 1}`} className="grid grid-cols-2 gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      role="radio"
                      aria-checked={d.gender === g}
                      onClick={() => updateDraft(d.id, { gender: g })}
                      className={cx(
                        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-base transition duration-200 active:scale-[0.97]",
                        d.gender === g
                          ? "border-transparent bg-gradient-to-r from-accent to-accent-2 font-semibold text-accent-ink shadow-[0_6px_20px_-8px_var(--glow)]"
                          : "border-line bg-white/5 text-ink hover:bg-white/10",
                      )}
                    >
                      {d.gender === g && <Icon name="check" className="size-4" />}
                      {GENDER_LABEL[g]}
                    </button>
                  ))}
                </div>
                <Toggle checked={d.adult} onChange={(v) => updateDraft(d.id, { adult: v })} label="Declaro que soy mayor de 18 años" hint="Cada persona lo confirma por sí misma. No es una verificación documental." />
              </Card>
            ))}
          </div>
          {duplicateAliases && <Notice>Hay alias repetidos: se distinguirán por su color y símbolo.</Notice>}
          <Button block disabled={!aliasesValid} onClick={() => go(1)}>
            Continuar
          </Button>
        </>
      )}

      {step === "relationship" && (
        <>
          <Title sub="Opcional. No cambia ningún permiso.">¿Qué relación tienen?</Title>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIPS.map((r) => (
              <Chip key={r} selected={relationship === r} onClick={() => setRelationship(relationship === r ? null : r)}>
                {RELATIONSHIP_LABEL[r]}
              </Chip>
            ))}
          </div>
          <Notice>Estar en pareja, ser invitado o invitada, o elegir Perverso no significa aceptar contacto.</Notice>
          <Button block onClick={() => go(1)}>
            {relationship ? "Continuar" : "Omitir"}
          </Button>
        </>
      )}

      {step === "limits" && !editing && (
        <>
          <Title sub="Cada persona responde a solas qué acepta. Nadie ve ni puede cambiar la respuesta de otra persona.">¿Qué acepta cada persona?</Title>
          <div className="space-y-2">
            {people.map((p, i) => (
              <div key={p.id} className="glass flex items-center justify-between rounded-2xl px-4 py-3">
                <ParticipantTag alias={p.alias} slot={i} />
                <span className={active[i].limitsDone ? "flex items-center gap-1 text-sm font-semibold text-ok" : "text-sm text-faint"}>
                  {active[i].limitsDone && <Icon name="check" className="size-4" />}
                  {active[i].limitsDone ? "Respondido" : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
          <Button block size="lg" icon="users" onClick={() => setEditing(true)}>
            Responder (pasando el teléfono)
          </Button>
          <Button variant="secondary" block disabled={!active.every((d) => d.limitsDone)} onClick={() => go(1)}>
            Continuar
          </Button>
          {!active.every((d) => d.limitsDone) && <p className="text-center text-sm text-faint">Cada persona debe responder antes de continuar.</p>}
        </>
      )}

      {step === "limits" && editing && (
        <PrivateRound<{ limits: LimitProfile; prefs: Preferences }>
          people={people}
          title="Límites individuales"
          onCancel={() => setEditing(false)}
          renderPrivate={(p, submit) => {
            const d = active.find((x) => x.id === p.id)!;
            return (
              <LimitsEditor
                person={p}
                others={people.filter((o) => o.id !== p.id)}
                initial={d.limits}
                initialPrefs={d.prefs}
                onDone={(limits, prefs) => submit({ limits, prefs })}
              />
            );
          }}
          onComplete={(answers) => {
            setDrafts((ds) =>
              ds.map((d) => {
                const a = answers.get(d.id);
                return a ? { ...d, limits: { ...a.limits, version: d.limits.version + 1 }, prefs: a.prefs, limitsDone: true } : d;
              }),
            );
            setEditing(false);
          }}
        />
      )}

      {step === "shared" && (
        <SharedLimitsEditor
          initial={shared}
          onDone={(s) => {
            setShared(s);
            go(1);
          }}
        />
      )}

      {step === "level" && (
        <>
          <Title sub="Pueden bajar en cualquier momento. Subir requiere el acuerdo privado de todas las personas.">Intensidad inicial</Title>
          <div className="space-y-3" role="radiogroup" aria-label="Intensidad">
            {INTENSITIES.map((l) => (
              <OptionTile
                key={l}
                level={l}
                selected={level === l}
                onClick={() => setLevel(l)}
                icon={LEVEL_ICON[l]}
                title={<span className="font-display text-2xl italic text-gradient">{INTENSITY_LABEL[l]}</span>}
                description={INTENSITY_DESCRIPTION[l]}
              />
            ))}
          </div>
          {level !== "leve" && <Notice>Esta intensidad se confirma en privado con cada persona antes de comenzar.</Notice>}
          <Button block size="lg" onClick={() => go(1)}>
            Continuar
          </Button>
        </>
      )}

      {step === "duration" && (
        <>
          <Title sub="Las pausas y las pantallas de consentimiento no consumen tiempo.">Duración</Title>
          <div className="grid grid-cols-3 gap-3">
            {DURATIONS.map((d) => (
              <Button key={String(d)} variant={duration === d ? "primary" : "secondary"} aria-pressed={duration === d} className="!min-h-16 rounded-3xl" onClick={() => setDuration(d)}>
                {d ? `${d} min` : "Sin límite"}
              </Button>
            ))}
          </div>
          <Button block size="lg" onClick={() => go(1)}>
            Continuar
          </Button>
        </>
      )}

      {step === "games" && (
        <>
          <Title sub="Elijan uno o varios. Las cartas siempre respetan los límites.">Juegos</Title>
          <div className="space-y-3">
            {GAMES.map((g) => {
              const selected = games.includes(g);
              const ok = availability[g] !== false;
              return (
                <OptionTile
                  key={g}
                  role="button"
                  selected={selected}
                  emblem={<GameEmblem theme={g} className="size-12" />}
                  title={GAME_LABEL[g]}
                  description={GAME_DESCRIPTION[g]}
                  badge={!ok ? <span className="text-xs text-warn">Sin cartas con sus límites</span> : undefined}
                  onClick={() =>
                    setGames((gs) => {
                      if (gs.includes(g)) return gs.filter((x) => x !== g);
                      if (g === "noche") return ["noche"];
                      return [...gs.filter((x) => x !== "noche"), g];
                    })
                  }
                />
              );
            })}
          </div>
          {games.includes("noche") && <Notice>Noche completa dura 60 minutos: 10 de apertura, 40 de desarrollo con todos los juegos y 10 de cierre. Pueden terminar antes.</Notice>}
          {games.includes("caos") && !games.includes("noche") && (
            <Card className="space-y-2">
              <p className="font-semibold">Caos usa todos los juegos compatibles. Desactiva los que no quieran:</p>
              <div className="flex flex-wrap gap-2">
                {BASE_GAMES.map((g) => (
                  <Chip key={g} selected={!caosExcluded.includes(g)} onClick={() => setCaosExcluded((x) => (x.includes(g) ? x.filter((y) => y !== g) : [...x, g]))}>
                    {GAME_LABEL[g]}
                  </Chip>
                ))}
              </div>
            </Card>
          )}
          {games.length === 1 && games[0] === "sorpresa" && <Notice>Con solo Carta sorpresa, las rondas normales usan Tarjetas.</Notice>}
          <Button block disabled={games.length === 0} onClick={() => go(1)}>
            Continuar
          </Button>
        </>
      )}

      {step === "summary" && (
        <>
          <Title sub="Sin detalles privados.">Resumen</Title>
          {rejected && <Notice tone="warn">No todas las personas aceptaron esta configuración. Pueden revisarla y volver a intentarlo.</Notice>}
          <Card glow>
            <dl className="grid grid-cols-2 gap-y-3">
              <dt className="text-muted">Personas</dt>
              <dd>{count}</dd>
              <dt className="text-muted">Guardado</dt>
              <dd>{mode === "normal" ? "Sesión normal" : "Sesión privada"}</dd>
              <dt className="text-muted">Intensidad</dt>
              <dd>{INTENSITY_LABEL[level]}</dd>
              <dt className="text-muted">Duración</dt>
              <dd>{effectiveDuration ? `${effectiveDuration} min` : "Sin límite"}</dd>
              <dt className="text-muted">Juegos</dt>
              <dd>{games.map((g) => GAME_LABEL[g]).join(", ")}</dd>
            </dl>
          </Card>
          {games.some((g) => availability[g] === false) && <Notice tone="warn">Algún juego no tiene actividades compatibles con sus límites; se usarán los demás.</Notice>}
          <Button
            block
            size="xl"
            icon="flame"
            className="pulse-glow"
            onClick={() => {
              setRejected(false);
              setStep("consent");
            }}
          >
            Pedir consentimiento y comenzar
          </Button>
        </>
      )}
    </Screen>
  );
}
