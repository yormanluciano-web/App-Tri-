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
import { Button, Card, Chip, GameEmblem, Icon, InfoButton, cx, Notice, OptionTile, ParticipantTag, Screen, Steps, Title, Toggle } from "@/components/ui";
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

/** Modos que mezclan todos los juegos. */
const META_MODES: readonly GameId[] = ["noche", "caos", "sin_miedo"];

/** Configuración final: Noche completa, Caos y Sin miedo expanden su mezcla de juegos. */
export function finalGames(
  selected: GameId[],
  caosExcluded: GameId[],
): { games: GameId[]; forcedDuration: number | null; forcedLevel?: Intensity; unlimited?: boolean } {
  if (selected.includes("noche")) return { games: ["noche", ...BASE_GAMES, "sorpresa"], forcedDuration: 60 };
  // Sin miedo: siempre empieza en Leve y no tiene límite de tiempo (el nivel sube solo).
  if (selected.includes("sin_miedo")) return { games: ["sin_miedo", ...BASE_GAMES, "sorpresa"], forcedDuration: null, forcedLevel: "leve", unlimited: true };
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

  const { games: resolvedGames, forcedDuration, forcedLevel, unlimited } = finalGames(games, caosExcluded);
  const effectiveDuration = unlimited ? null : (forcedDuration ?? duration);
  const effectiveLevel = forcedLevel ?? level;
  const fearless = games.includes("sin_miedo");

  const config: SessionConfig = {
    mode,
    participants,
    relationship,
    initialLevel: effectiveLevel,
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
      if (g === "noche" || g === "caos" || g === "sin_miedo") continue;
      out[g] = buildCandidates(CATALOG, wide, { game: g, formats: GAME_FORMATS[g], requireDuration: g === "temporizador" }, 0).length > 0;
    }
    out.noche = BASE_GAMES.some((g) => out[g]);
    out.caos = out.noche;
    out.sin_miedo = out.noche;
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
      <Screen level={effectiveLevel}>
        <Title sub="Cada persona responde en privado. Si alguien no acepta, no se empieza y nadie sabrá quién fue.">Consentimiento inicial</Title>
        <ConsentRound
          people={people}
          title="Consentimiento inicial"
          question="¿Aceptas comenzar con esta configuración?"
          detail={
            <ul className="list-disc pl-5">
              <li>{count} personas</li>
              <li>Intensidad: {INTENSITY_LABEL[effectiveLevel]}</li>
              <li>Duración: {effectiveDuration ? `${effectiveDuration} minutos` : "sin límite"}</li>
              <li>Juegos: {games.map((g) => GAME_LABEL[g]).join(", ")}</li>
              {fearless && (
                <li className="font-semibold text-text">
                  Sin miedo: el nivel sube solo, sin volver a preguntar. 15 minutos en Leve, 20 en Picante y luego Perverso hasta el final.
                </li>
              )}
              {fearless && <li>Tus límites personales se respetan siempre: lo que marcaste como «no» nunca aparece, en ningún nivel.</li>}
              {fearless && <li>Cualquiera puede bajar el nivel en cualquier momento; si lo hacen, la subida automática se detiene.</li>}
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
    <Screen fit level={effectiveLevel}>
      <div className="shrink-0">{header}</div>
      {/* Cuerpo del paso: se desplaza por dentro; el botón principal queda fijo abajo. */}
      <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-1">

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
          <div className="step-action">
            <Button block size="lg" onClick={() => go(1)}>
              Continuar
            </Button>
          </div>
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
          <div className="step-action">
            <Button block size="lg" onClick={() => go(1)}>
              Continuar
            </Button>
          </div>
        </>
      )}

      {step === "aliases" && (
        <>
          <Title sub="Solo un alias y si es hombre o mujer. Sin correo, teléfono ni fecha de nacimiento.">¿Quiénes juegan?</Title>
          <div className="space-y-2.5">
            {active.map((d, i) => (
              <Card key={d.id} className="space-y-2 !rounded-3xl !p-3">
                <label className="flex items-center gap-2">
                  <ParticipantTag alias="" slot={i} className="shrink-0" />
                  <input
                    className="min-h-11 w-full rounded-xl border border-line bg-white/5 px-3 text-base text-ink transition placeholder:text-faint focus:border-accent focus:bg-white/10 focus:outline-none"
                    placeholder={`Alias de la persona ${i + 1}`}
                    value={d.alias}
                    maxLength={40}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label={`Alias de la persona ${i + 1}`}
                    onChange={(e) => updateDraft(d.id, { alias: e.target.value })}
                  />
                </label>
                {trimAlias(d.alias).length > 24 && <span className="text-sm text-bad">Máximo 24 caracteres.</span>}
                <div className="flex items-center gap-2">
                <div role="radiogroup" aria-label={`Género de la persona ${i + 1}`} className="grid shrink-0 grid-cols-2 gap-1.5">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      role="radio"
                      aria-checked={d.gender === g}
                      onClick={() => updateDraft(d.id, { gender: g })}
                      className={cx(
                        "inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border px-2.5 text-sm transition duration-200 active:scale-[0.97]",
                        d.gender === g
                          ? "border-transparent bg-gradient-to-r from-accent to-accent-2 font-semibold text-accent-ink shadow-[0_6px_20px_-8px_var(--glow)]"
                          : "border-line bg-white/5 text-ink hover:bg-white/10",
                      )}
                    >
                      {d.gender === g && <Icon name="check" className="size-3.5" />}
                      {GENDER_LABEL[g]}
                    </button>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <Toggle compact checked={d.adult} onChange={(v) => updateDraft(d.id, { adult: v })} label="Soy mayor de 18 años" />
                </div>
                </div>
              </Card>
            ))}
            <p className="text-center text-xs text-faint">Cada persona declara por sí misma que es mayor de 18 años. No es una verificación documental.</p>
          </div>
          {duplicateAliases && <Notice>Hay alias repetidos: se distinguirán por su color y símbolo.</Notice>}
          <div className="step-action">
            <Button block disabled={!aliasesValid} onClick={() => go(1)}>
              Continuar
            </Button>
          </div>
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
          <div className="step-action">
            <Button block onClick={() => go(1)}>
              {relationship ? "Continuar" : "Omitir"}
            </Button>
          </div>
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
          {!active.every((d) => d.limitsDone) && <p className="text-center text-sm text-faint">Cada persona debe responder antes de continuar.</p>}
          <div className="step-action space-y-2">
            <Button block size="lg" icon="users" onClick={() => setEditing(true)}>
              Responder (pasando el teléfono)
            </Button>
            <Button variant="secondary" block disabled={!active.every((d) => d.limitsDone)} onClick={() => go(1)}>
              Continuar
            </Button>
          </div>
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
          <div className="step-action">
            <Button block size="lg" onClick={() => go(1)}>
              Continuar
            </Button>
          </div>
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
          <div className="step-action">
            <Button block size="lg" onClick={() => go(1)}>
              Continuar
            </Button>
          </div>
        </>
      )}

      {step === "games" && (
        <>
          <div className="flex items-start justify-between gap-3">
            <Title sub="Elijan uno o varios, o un modo que los mezcla todos.">Juegos</Title>
            <InfoButton title="¿Qué es cada juego?" label="Qué es cada juego" className="mt-1">
              <ul className="space-y-2.5">
                {GAMES.map((g) => (
                  <li key={g}>
                    <span className="font-semibold text-ink">{GAME_LABEL[g]}:</span> {GAME_DESCRIPTION[g]}
                  </li>
                ))}
              </ul>
            </InfoButton>
          </div>
          {(
            [
              ["Modos", GAMES.filter((g) => META_MODES.includes(g))],
              ["Juegos", GAMES.filter((g) => !META_MODES.includes(g))],
            ] as const
          ).map(([label, list]) => (
            <section key={label} className="space-y-1.5">
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-faint">{label}</h2>
              <div className="grid grid-cols-3 gap-2">
                {list.map((g) => {
                  const selected = games.includes(g);
                  const ok = availability[g] !== false;
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setGames((gs) => {
                          if (gs.includes(g)) return gs.filter((x) => x !== g);
                          if (g === "noche" || g === "sin_miedo") return [g];
                          return [...gs.filter((x) => x !== "noche" && x !== "sin_miedo"), g];
                        })
                      }
                      className={cx(
                        "glass relative flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-center transition duration-200 active:scale-[0.97]",
                        selected ? "glow-border" : "opacity-80 hover:bg-white/5",
                      )}
                    >
                      <span className="text-[0.78rem] font-semibold leading-tight">{GAME_LABEL[g]}</span>
                      <GameEmblem theme={g} className={cx("order-first size-9 transition", !selected && "grayscale-[35%]")} />
                      {!ok && <span className="text-[0.6rem] leading-none text-warn">Sin cartas</span>}
                      {selected && (
                        <span aria-hidden className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-accent text-accent-ink">
                          <Icon name="check" className="size-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {games.includes("noche") && <Notice>Noche completa dura 60 minutos: 10 de apertura, 40 de desarrollo con todos los juegos y 10 de cierre. Pueden terminar antes.</Notice>}
          {games.includes("sin_miedo") && (
            <Notice>
              Sin miedo empieza en Leve, no tiene límite de tiempo y sube solo: 15 minutos en Leve, 20 en Picante y luego Perverso. Al empezar, cada persona lo acepta en privado; si
              alguien no acepta, no se empieza. Las pausas no cuentan tiempo.
            </Notice>
          )}
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
          <div className="step-action">
            <Button block disabled={games.length === 0} onClick={() => go(1)}>
              Continuar
            </Button>
          </div>
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
              <dd>{fearless ? "Leve → Picante → Perverso (sube solo)" : INTENSITY_LABEL[effectiveLevel]}</dd>
              <dt className="text-muted">Duración</dt>
              <dd>{effectiveDuration ? `${effectiveDuration} min` : "Sin límite"}</dd>
              <dt className="text-muted">Juegos</dt>
              <dd>{games.map((g) => GAME_LABEL[g]).join(", ")}</dd>
            </dl>
          </Card>
          {games.some((g) => availability[g] === false) && <Notice tone="warn">Algún juego no tiene actividades compatibles con sus límites; se usarán los demás.</Notice>}
          <div className="step-action">
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
          </div>
        </>
      )}
      </div>
    </Screen>
  );
}
