"use client";

import { useState } from "react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CONTACT_PERMISSIONS,
  LIGHT_DESCRIPTION,
  LIGHT_LABEL,
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

function SemaforoLegend({ labels = LIGHT_LABEL, descriptions = LIGHT_DESCRIPTION }: { labels?: Record<Light, string>; descriptions?: Record<Light, string> }) {
  return (
    <ul className="space-y-1 text-sm">
      {(["green", "yellow", "red"] as Light[]).map((l) => (
        <li key={l} className="flex gap-2">
          <span aria-hidden className={l === "green" ? "text-ok" : l === "yellow" ? "text-warn" : "text-bad"}>
            {ICON[l]}
          </span>
          <span>
            <strong>{labels[l]}:</strong> <span className="text-muted">{descriptions[l]}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

type PairChoice = "same" | "yellow" | "red";

function pairChoiceOf(over: Partial<Record<Permission, Light>> | undefined): PairChoice {
  if (!over) return "same";
  const vals = CONTACT_PERMISSIONS.map((p) => over[p]).filter(Boolean);
  if (vals.length === 0) return "same";
  return vals.includes("red") ? "red" : "yellow";
}

/** Editor individual: solo la persona que tiene el teléfono edita sus propios límites. */
export function LimitsEditor({
  person,
  others,
  initial,
  initialPrefs,
  onDone,
  submitLabel = "Guardar mis límites",
}: {
  person: Person;
  others: Person[];
  initial: LimitProfile;
  initialPrefs: Preferences;
  onDone: (limits: LimitProfile, prefs: Preferences) => void;
  submitLabel?: string;
}) {
  const [perms, setPerms] = useState<Record<Permission, Light>>(() => {
    const base = safeBasePermissions();
    for (const k of Object.keys(base) as Permission[]) base[k] = normalizeLight(initial.permissions[k] ?? base[k]);
    return base;
  });
  const [pairs, setPairs] = useState<Record<string, PairChoice>>(() =>
    Object.fromEntries(others.map((o) => [o.id, pairChoiceOf(initial.pairOverrides[o.id])])),
  );
  const [prefs, setPrefs] = useState<Preferences>(initialPrefs);

  const anyContactAllowed = CONTACT_PERMISSIONS.some((p) => perms[p] !== "red");

  const save = () => {
    const pairOverrides: LimitProfile["pairOverrides"] = {};
    for (const o of others) {
      const c = pairs[o.id];
      if (c === "same") continue;
      pairOverrides[o.id] = Object.fromEntries(CONTACT_PERMISSIONS.map((p) => [p, c]));
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
          Límites de <ParticipantTag alias={person.alias} slot={person.slot} />
        </h2>
        <p className="text-muted">
          Empiezas con la base segura: conversación ligera, música, adivinanzas y baile individual permitidos; todo lo demás en «Nunca
          mostrar». Cambia solo lo que quieras. Nadie verá esta pantalla ni un resumen comparativo.
        </p>
        <SemaforoLegend />
        <Button variant="quiet" onClick={() => setPerms(safeBasePermissions())}>
          Restablecer base segura
        </Button>
      </Card>

      {PERMISSION_GROUPS.map((g) => (
        <Card key={g.title}>
          <details open={g.title !== "Contacto físico"}>
            <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold">{g.title}</summary>
            {g.title === "Contacto físico" && (
              <p className="pb-2 text-sm text-muted">
                El contacto está bloqueado hasta que lo configures. Permitirlo aquí no obliga a nada: cada propuesta se puede rechazar.
              </p>
            )}
            {g.items.map((perm) => (
              <PermissionRow key={perm} perm={perm} name={`${person.id}-${perm}`} value={perms[perm]} onChange={(l) => setPerms((p) => ({ ...p, [perm]: l }))} />
            ))}
          </details>
        </Card>
      ))}

      {others.length > 0 && anyContactAllowed && (
        <Card className="space-y-3">
          <h3 className="text-lg font-semibold">Contacto con cada persona</h3>
          <p className="text-sm text-muted">Puedes restringir el contacto con alguien en concreto, aunque la categoría general esté permitida.</p>
          {others.map((o) => (
            <fieldset key={o.id} className="space-y-2">
              <legend className="font-semibold">
                Con <ParticipantTag alias={o.alias} slot={o.slot} />
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["same", "Según mi configuración"],
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
        </Card>
      )}

      <Card className="space-y-3">
        <details>
          <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold">Preferencias (opcional)</summary>
          <p className="pb-2 text-sm text-muted">Solo cambian la frecuencia de las categorías. Nunca conceden permisos.</p>
          <p className="py-1 text-sm font-semibold">Me gustan más</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c} selected={prefs.preferred.includes(c)} onClick={() => togglePref("preferred", c)}>
                {CATEGORY_LABEL[c]}
              </Chip>
            ))}
          </div>
          <p className="py-1 pt-3 text-sm font-semibold">Mejor menos</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c} selected={prefs.avoided.includes(c)} onClick={() => togglePref("avoided", c)}>
                {CATEGORY_LABEL[c]}
              </Chip>
            ))}
          </div>
        </details>
      </Card>

      <Button block onClick={save}>
        {submitLabel}
      </Button>
    </div>
  );
}

export const SHARED_LABELS: Record<Light, string> = { green: "Según cada persona", yellow: "Preguntar siempre", red: "Nunca en esta sesión" };
const SHARED_DESC: Record<Light, string> = {
  green: "No añade restricción: decide el límite de cada persona.",
  yellow: "Se pedirá autorización privada de todas las personas implicadas.",
  red: "Bloqueado para toda la sesión, también ante el grupo.",
};

/** Restricciones compartidas: solo pueden restringir, nunca conceder. */
export function SharedLimitsEditor({
  initial,
  onDone,
  submitLabel = "Guardar límites compartidos",
}: {
  initial: Partial<Record<Permission, Light>>;
  onDone: (shared: Record<Permission, Light>) => void;
  submitLabel?: string;
}) {
  const [shared, setShared] = useState<Record<Permission, Light>>(() => {
    const out = {} as Record<Permission, Light>;
    for (const g of PERMISSION_GROUPS) for (const p of g.items) out[p] = normalizeLight(initial[p] ?? "green");
    return out;
  });
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Límites compartidos</h2>
        <p className="text-muted">
          Restricciones para toda la sesión, incluido lo que ocurre delante del grupo. Se aplican además de los límites de cada persona y
          nunca los amplían.
        </p>
        <SemaforoLegend labels={SHARED_LABELS} descriptions={SHARED_DESC} />
      </Card>
      {PERMISSION_GROUPS.map((g) => (
        <Card key={g.title}>
          <details open={g.title === "Contacto físico"}>
            <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold">{g.title}</summary>
            {g.items.map((perm) => (
              <PermissionRow key={perm} perm={perm} name={`shared-${perm}`} labels={SHARED_LABELS} value={shared[perm]} onChange={(l) => setShared((s) => ({ ...s, [perm]: l }))} />
            ))}
          </details>
        </Card>
      ))}
      <Button block onClick={() => onDone(shared)}>
        {submitLabel}
      </Button>
    </div>
  );
}
