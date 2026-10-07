"use client";

import { useState } from "react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CONTACT_PERMISSIONS,
  LIGHT_LABEL,
  PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_HINT,
  PERMISSION_LABEL,
  type Category,
  type Light,
  type Permission,
} from "@/domain/models/constants";
import type { LimitProfile, Preferences } from "@/domain/models/session";
import { normalizeLight, safeBasePermissions } from "@/domain/consent/limits";
import { Button, Card, Chip, ParticipantTag, cx } from "@/components/ui";
import type { Person } from "@/features/session/PrivateRound";

const ICON: Record<Light, string> = { green: "✓", yellow: "?", red: "✕" };
const ACTIVE: Record<Light, string> = {
  green: "border-ok text-ok bg-surface-2",
  yellow: "border-warn text-warn bg-surface-2",
  red: "border-bad text-bad bg-surface-2",
};

export type AcceptMode = "todo" | "parcial" | "nada";

function allGreen(): Record<Permission, Light> {
  return Object.fromEntries(PERMISSIONS.map((p) => [p, "green"])) as Record<Permission, Light>;
}

function sameMap(a: Record<Permission, Light>, b: Record<Permission, Light>): boolean {
  return PERMISSIONS.every((p) => a[p] === b[p]);
}

/** Modo que corresponde a un perfil guardado (para revisar límites ya configurados). */
export function modeOf(perms: Record<Permission, Light>): AcceptMode {
  if (sameMap(perms, allGreen())) return "todo";
  if (sameMap(perms, safeBasePermissions())) return "nada";
  return "parcial";
}

export function PermissionRow({
  perm,
  value,
  onChange,
  labels = LIGHT_LABEL,
  name,
}: {
  perm: Permission;
  value: Light;
  onChange: (l: Light) => void;
  labels?: Record<Light, string>;
  name: string;
}) {
  return (
    <fieldset className="space-y-2 border-b border-line py-3 last:border-b-0">
      <legend className="font-semibold">{PERMISSION_LABEL[perm]}</legend>
      <p className="text-sm text-muted">{PERMISSION_HINT[perm]}</p>
      <div className="grid grid-cols-3 gap-2">
        {(["green", "yellow", "red"] as Light[]).map((l) => (
          <label
            key={l}
            className={cx(
              "flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-xl border px-1 text-center text-sm",
              value === l ? ACTIVE[l] : "border-line text-muted",
            )}
          >
            <input type="radio" className="sr-only" name={name} checked={value === l} onChange={() => onChange(l)} />
            <span aria-hidden>{ICON[l]}</span>
            <span>{labels[l]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const MODES: { mode: AcceptMode; title: string; desc: string }[] = [
  {
    mode: "todo",
    title: "Acepto todo",
    desc: "Cualquier carta puede aparecer sin volver a preguntarte. Igual puedes pasar cuando quieras.",
  },
  { mode: "parcial", title: "Acepto parcialmente", desc: "Eliges qué sí y qué no, por temas." },
  { mode: "nada", title: "No acepto", desc: "Solo charla ligera, música, adivinanzas y baile sin contacto." },
];

/** Botones Acepto / No acepto de un tema. */
function GroupToggle({ title, hint, state, onChange, name }: { title: string; hint: string; state: "yes" | "no" | "mixed"; onChange: (yes: boolean) => void; name: string }) {
  return (
    <fieldset className="space-y-2 border-b border-line py-3 last:border-b-0">
      <legend className="font-semibold">{title}</legend>
      <p className="text-sm text-muted">{hint}</p>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            [true, "Acepto", "border-ok text-ok"],
            [false, "No acepto", "border-bad text-bad"],
          ] as const
        ).map(([yes, label, cls]) => {
          const checked = state === (yes ? "yes" : "no");
          return (
            <label key={label} className={cx("flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-xl border text-sm", checked ? cls + " bg-surface-2 font-semibold" : "border-line text-muted")}>
              <input type="radio" className="sr-only" name={name} checked={checked} onChange={() => onChange(yes)} />
              <span aria-hidden>{yes ? "✓" : "✕"}</span>
              {label}
            </label>
          );
        })}
      </div>
      {state === "mixed" && <p className="text-xs text-faint">Ajustado en opciones avanzadas.</p>}
    </fieldset>
  );
}

function groupState(perms: Record<Permission, Light>, items: Permission[]): "yes" | "no" | "mixed" {
  if (items.every((p) => perms[p] === "green")) return "yes";
  if (items.every((p) => perms[p] === "red")) return "no";
  return "mixed";
}

type PairChoice = "same" | "yellow" | "red";

function pairChoiceOf(over: Partial<Record<Permission, Light>> | undefined): PairChoice {
  if (!over) return "same";
  const vals = CONTACT_PERMISSIONS.map((p) => over[p]).filter(Boolean);
  if (vals.length === 0) return "same";
  return vals.includes("red") ? "red" : "yellow";
}

/**
 * Editor individual simplificado: Acepto todo / Acepto parcialmente / No acepto.
 * Solo la persona que tiene el teléfono edita sus propios límites.
 */
export function LimitsEditor({
  person,
  others,
  initial,
  initialPrefs,
  onDone,
  requireChoice = true,
  submitLabel = "Guardar",
}: {
  person: Person;
  others: Person[];
  initial: LimitProfile;
  initialPrefs: Preferences;
  onDone: (limits: LimitProfile, prefs: Preferences) => void;
  requireChoice?: boolean;
  submitLabel?: string;
}) {
  const [perms, setPerms] = useState<Record<Permission, Light>>(() => {
    const base = safeBasePermissions();
    for (const k of PERMISSIONS) base[k] = normalizeLight(initial.permissions[k] ?? base[k]);
    return base;
  });
  const [mode, setMode] = useState<AcceptMode | null>(() => (requireChoice ? null : modeOf(perms)));
  const [pairs, setPairs] = useState<Record<string, PairChoice>>(() =>
    Object.fromEntries(others.map((o) => [o.id, pairChoiceOf(initial.pairOverrides[o.id])])),
  );
  const [prefs, setPrefs] = useState<Preferences>(initialPrefs);

  const choose = (m: AcceptMode) => {
    setMode(m);
    if (m === "todo") setPerms(allGreen());
    if (m === "nada") setPerms(safeBasePermissions());
    if (m === "parcial" && (sameMap(perms, allGreen()) || sameMap(perms, safeBasePermissions()))) {
      // Punto de partida razonable: charla, coqueteo y secretos sí; lo demás no.
      const start = safeBasePermissions();
      for (const g of PERMISSION_GROUPS) if (["charla", "coqueteo", "secretos"].includes(g.id)) g.items.forEach((p) => (start[p] = "green"));
      setPerms(start);
    }
  };

  const anyContactAllowed = CONTACT_PERMISSIONS.some((p) => perms[p] !== "red");

  const save = () => {
    const pairOverrides: LimitProfile["pairOverrides"] = {};
    for (const o of others) {
      const c = pairs[o.id];
      if (c === "same") continue;
      pairOverrides[o.id] = Object.fromEntries([...CONTACT_PERMISSIONS, "tiempo_a_solas"].map((p) => [p, c]));
    }
    onDone({ version: initial.version, permissions: { ...perms }, pairOverrides }, prefs);
  };

  const togglePref = (kind: "preferred" | "avoided", c: Category) => {
    setPrefs((p) => {
      const other = kind === "preferred" ? "avoided" : "preferred";
      const list = p[kind].includes(c) ? p[kind].filter((x) => x !== c) : [...p[kind], c];
      return { ...p, [kind]: list, [other]: p[other].filter((x) => x !== c) };
    });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">
          ¿Qué aceptas, <ParticipantTag alias={person.alias} slot={person.slot} />?
        </h2>
        <p className="text-sm text-muted">Nadie verá tu respuesta. Puedes cambiarla durante el juego desde Pausa.</p>
        <div className="space-y-2" role="radiogroup" aria-label="Qué aceptas">
          {MODES.map((m) => (
            <button
              key={m.mode}
              role="radio"
              aria-checked={mode === m.mode}
              onClick={() => choose(m.mode)}
              className={cx("w-full rounded-2xl border p-4 text-left", mode === m.mode ? "border-accent bg-surface-2" : "border-line")}
            >
              <span className="block font-semibold">
                {mode === m.mode ? "◉ " : "○ "}
                {m.title}
              </span>
              <span className="text-sm text-muted">{m.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {mode === "parcial" && (
        <Card>
          {PERMISSION_GROUPS.map((g) => (
            <GroupToggle
              key={g.id}
              name={`${person.id}-g-${g.id}`}
              title={g.title}
              hint={g.hint}
              state={groupState(perms, g.items)}
              onChange={(yes) =>
                setPerms((p) => {
                  const next = { ...p };
                  g.items.forEach((it) => (next[it] = yes ? "green" : "red"));
                  return next;
                })
              }
            />
          ))}
        </Card>
      )}

      {mode && mode !== "nada" && (
        <Card>
          <details>
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Opciones avanzadas (opcional)</summary>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted">Lo que aceptas aquí ya no se vuelve a preguntar durante el juego. Si prefieres que te pregunten en privado cada vez, marca «Preguntar antes».</p>
              {PERMISSION_GROUPS.map((g) => (
                <div key={g.id}>
                  <p className="pt-2 text-sm font-semibold uppercase tracking-wider text-faint">{g.title}</p>
                  {g.items.map((perm) => (
                    <PermissionRow key={perm} perm={perm} name={`${person.id}-${perm}`} value={perms[perm]} onChange={(l) => {
                      setPerms((p) => ({ ...p, [perm]: l }));
                      setMode("parcial");
                    }} />
                  ))}
                </div>
              ))}
              {others.length > 0 && anyContactAllowed && (
                <div className="space-y-3">
                  <p className="font-semibold">Contacto con cada persona</p>
                  {others.map((o) => (
                    <fieldset key={o.id} className="space-y-2">
                      <legend className="text-sm">
                        Con <ParticipantTag alias={o.alias} slot={o.slot} />
                      </legend>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            ["same", "Igual que arriba"],
                            ["yellow", "Preguntar antes"],
                            ["red", "Nunca"],
                          ] as [PairChoice, string][]
                        ).map(([v, label]) => (
                          <label
                            key={v}
                            className={cx(
                              "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-1 text-center text-sm",
                              pairs[o.id] === v ? "border-accent bg-surface-2 text-ink" : "border-line text-muted",
                            )}
                          >
                            <input type="radio" className="sr-only" name={`pair-${person.id}-${o.id}`} checked={pairs[o.id] === v} onChange={() => setPairs((p) => ({ ...p, [o.id]: v }))} />
                            {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <p className="font-semibold">Me gustan más</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <Chip key={c} selected={prefs.preferred.includes(c)} onClick={() => togglePref("preferred", c)}>
                      {CATEGORY_LABEL[c]}
                    </Chip>
                  ))}
                </div>
                <p className="pt-2 font-semibold">Mejor menos</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <Chip key={c} selected={prefs.avoided.includes(c)} onClick={() => togglePref("avoided", c)}>
                      {CATEGORY_LABEL[c]}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </Card>
      )}

      <Button block disabled={!mode} onClick={save}>
        {submitLabel}
      </Button>
    </div>
  );
}

/** Límites del grupo: opcionales, solo pueden restringir. */
export function SharedLimitsEditor({
  initial,
  onDone,
  submitLabel = "Continuar",
}: {
  initial: Partial<Record<Permission, Light>>;
  onDone: (shared: Record<Permission, Light>) => void;
  submitLabel?: string;
}) {
  const [shared, setShared] = useState<Record<Permission, Light>>(() => {
    const out = {} as Record<Permission, Light>;
    for (const p of PERMISSIONS) out[p] = normalizeLight(initial[p] ?? "green");
    return out;
  });
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-xl font-bold">¿Algo que nadie quiera en esta sesión?</h2>
        <p className="text-muted">
          Opcional. Lo que marquen como «Nadie» queda fuera para todas las personas, también ante el grupo. Esto nunca amplía lo que cada persona aceptó.
        </p>
      </Card>
      <Card>
        {PERMISSION_GROUPS.map((g) => {
          const blocked = g.items.every((p) => shared[p] === "red");
          return (
            <fieldset key={g.id} className="space-y-2 border-b border-line py-3 last:border-b-0">
              <legend className="font-semibold">{g.title}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    [false, "Según cada quien"],
                    [true, "Nadie"],
                  ] as const
                ).map(([block, label]) => (
                  <label
                    key={label}
                    className={cx(
                      "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-xs",
                      blocked === block ? (block ? "border-bad text-bad" : "border-ok text-ok") + " bg-surface-2 font-semibold" : "border-line text-muted",
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={`shared-${g.id}`}
                      checked={blocked === block}
                      onChange={() =>
                        setShared((s) => {
                          const next = { ...s };
                          g.items.forEach((p) => (next[p] = block ? "red" : "green"));
                          return next;
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </Card>
      <Button block onClick={() => onDone(shared)}>
        {submitLabel}
      </Button>
    </div>
  );
}
