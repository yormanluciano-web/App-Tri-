"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CONTACT_PERMISSIONS,
  GAME_LABEL,
  INTENSITIES,
  INTENSITY_LABEL,
  INTENSITY_RANGE,
  PERMISSIONS,
  PERMISSION_HINT,
  PERMISSION_LABEL,
  type GameId,
  type Intensity,
} from "@/domain/models/constants";
import type { Activity } from "@/domain/models/activity";
import { validateCatalog, normalizeText } from "@/domain/content/validate";
import { placeholdersIn } from "@/data/define";
import { BASE_ACTIVITIES } from "@/data/catalog";
import {
  buildCustomCard,
  customActivityId,
  customCardsToActivities,
  defaultIntensity,
  formFromCustomCard,
  newCardForm,
  randomCardId,
  type Audience,
  type CardForm,
  type CustomCard,
} from "@/data/custom";
import { useAdmin, savedRepo } from "@/admin/store";
import { Button, Card, Chip, Dialog, Icon, LinkButton, Notice, Screen, Title, cx } from "@/components/ui";

/** Juegos que el formulario ofrece (los meta-juegos toman cartas de estos). */
const FORM_GAMES: GameId[] = ["verdad_reto", "ruleta", "dados", "tarjetas", "cadena", "temporizador"];

const AUDIENCES: { id: Audience; label: string; hint: string }[] = [
  { id: "todos", label: "Cualquiera", hint: "Sale con cualquier combinación de personas." },
  {
    id: "mixta",
    label: "Hombre y mujer",
    hint: "Le sale a un hombre con una mujer, en cualquier orden. En un trío con un hombre y dos mujeres, la app elige al hombre y lo turna con las dos (y al revés). Nunca a dos personas del mismo género.",
  },
  { id: "mujeres", label: "Solo mujeres", hint: "Todas las personas de la carta deben ser mujeres." },
  { id: "hombres", label: "Solo hombres", hint: "Todas las personas de la carta deben ser hombres." },
];

export function AdminApp() {
  const token = useAdmin((s) => s.token);
  return token ? <AdminPanel /> : <AdminLogin />;
}

// ------------------------------------------------------------------ acceso

function AdminLogin() {
  const login = useAdmin((s) => s.login);
  const busy = useAdmin((s) => s.busy);
  const error = useAdmin((s) => s.error);
  const [repo, setRepo] = useState(() => (typeof window === "undefined" ? { owner: "", repo: "", branch: "" } : savedRepo()));
  const [token, setToken] = useState("");
  const [help, setHelp] = useState(false);

  return (
    <Screen>
      <div className="flex items-center gap-3 pt-2">
        <LinkButton href="/ajustes/" variant="secondary" icon="back" className="!min-h-11 !px-3">
          Volver
        </LinkButton>
      </div>
      <Title eyebrow="Solo administración" sub="Agrega, edita, oculta o borra cartas. Los cambios se guardan en el repositorio y llegan a la app en unos minutos.">
        Panel de cartas
      </Title>
      <Card className="space-y-4">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void login(repo, token).then((ok) => ok && setToken(""));
          }}
        >
          <Field label="Usuario u organización de GitHub">
            <input className={INPUT} name="username" autoComplete="username" value={repo.owner} onChange={(e) => setRepo({ ...repo, owner: e.target.value })} />
          </Field>
          <Field label="Repositorio">
            <input className={INPUT} value={repo.repo} autoCapitalize="off" autoCorrect="off" spellCheck={false} onChange={(e) => setRepo({ ...repo, repo: e.target.value })} />
          </Field>
          <Field label="Rama que publica Vercel" hint="Vacío = la rama principal del repositorio.">
            <input className={INPUT} value={repo.branch} placeholder="main" autoCapitalize="off" autoCorrect="off" spellCheck={false} onChange={(e) => setRepo({ ...repo, branch: e.target.value })} />
          </Field>
          <Field label="Llave de acceso de GitHub" hint="Tu iPhone puede guardarla en el llavero. La app no la guarda.">
            <input className={INPUT} type="password" name="password" autoComplete="current-password" value={token} onChange={(e) => setToken(e.target.value)} />
          </Field>
          {error && <Notice tone="warn">{error}</Notice>}
          <Button type="submit" block size="lg" icon="lock" disabled={busy}>
            {busy ? "Comprobando…" : "Entrar como administrador"}
          </Button>
        </form>
        <Button variant="quiet" onClick={() => setHelp(true)}>
          ¿Primera vez? Cómo registrarte
        </Button>
      </Card>

      <Dialog open={help} title="Registrarte como administrador" onClose={() => setHelp(false)}>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            En GitHub ve a <b className="text-ink">Settings → Developer settings → Personal access tokens → Fine-grained tokens</b> y pulsa <b className="text-ink">Generate new token</b>.
          </li>
          <li>
            En <b className="text-ink">Repository access</b> elige solo este repositorio. En <b className="text-ink">Permissions → Contents</b> elige <b className="text-ink">Read and write</b>.
          </li>
          <li>Copia la llave (empieza por «github_pat_») y pégala aquí. Al entrar, deja que el iPhone la guarde en el llavero.</li>
          <li>Solo quien tenga una llave con permiso de escritura puede publicar cambios. Si la pierdes o se filtra, bórrala en GitHub y crea otra.</li>
        </ol>
        <Button block onClick={() => setHelp(false)}>
          Entendido
        </Button>
      </Dialog>
    </Screen>
  );
}

// ------------------------------------------------------------------ panel

type Tab = "nueva" | "cartas" | "cuenta";

function AdminPanel() {
  const [tab, setTab] = useState<Tab>("nueva");
  const [editing, setEditing] = useState<CustomCard | null>(null);
  const [done, setDone] = useState<string | null>(null);

  return (
    <Screen>
      <div className="flex items-center justify-between gap-2 pt-2">
        <LinkButton href="/" variant="secondary" icon="back" className="!min-h-11 !px-3">
          Inicio
        </LinkButton>
        <span className="rounded-full border border-gold/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">Administración</span>
      </div>
      <div role="tablist" aria-label="Secciones" className="grid grid-cols-3 gap-2">
        {(
          [
            ["nueva", editing ? "Editar" : "Nueva carta", "sparkle"],
            ["cartas", "Cartas", "cards"],
            ["cuenta", "Cuenta", "settings"],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cx(
              "flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border text-sm transition",
              tab === id ? "border-transparent bg-gradient-to-r from-accent to-accent-2 font-semibold text-accent-ink" : "border-line bg-white/5",
            )}
          >
            <Icon name={icon} className="size-4" />
            {label}
          </button>
        ))}
      </div>
      {done && (
        <Notice>
          {done}{" "}
          <button className="underline" onClick={() => setDone(null)}>
            Cerrar
          </button>
        </Notice>
      )}
      {tab === "nueva" && (
        <CardEditor
          key={editing?.id ?? "nueva"}
          editing={editing}
          onPublished={(msg) => {
            setDone(msg);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
      {tab === "cartas" && (
        <CardList
          onEdit={(c) => {
            setEditing(c);
            setTab("nueva");
          }}
          onDone={setDone}
        />
      )}
      {tab === "cuenta" && <Account />}
    </Screen>
  );
}

const INPUT =
  "min-h-12 w-full rounded-2xl border border-line bg-white/5 px-4 text-base text-ink transition placeholder:text-faint focus:border-accent focus:bg-white/10 focus:outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-sm text-muted">{hint}</span>}
    </label>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-semibold">{title}</legend>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}

const MIXTA_SIN_PAREJA =
  "Una carta «Hombre y mujer» es de pareja: el texto debe nombrar a Persona 1 y Persona 2 (pueden ser cualquiera de los jugadores; la app pone al hombre y a la mujer).";

const PLACEHOLDER_LABEL: Record<string, string> = { "{p1}": "Persona 1", "{p2}": "Persona 2", "{p3}": "Persona 3" };

function previewText(text: string): string {
  return text.replace(/\{p[123]\}/g, (m) => `«${PLACEHOLDER_LABEL[m]}»`);
}

/** Valida la carta con las mismas reglas que el build; también avisa de textos repetidos. */
function checkCard(card: CustomCard, editingId: string | null): { activity: Activity | null; errors: string[]; warnings: string[] } {
  const [activity] = customCardsToActivities([card]);
  if (!activity) return { activity: null, errors: ["No se pudo construir la carta."], warnings: [] };
  const result = validateCatalog([activity]);
  const errors = result.errors.map((e) => e.message);
  const warnings = result.warnings.map((w) => w.message);
  const norm = normalizeText(activity.texto);
  const twin = BASE_ACTIVITIES.find((a) => a.id !== editingId && normalizeText(a.texto) === norm);
  if (twin) errors.push(`Ya existe una carta con el mismo texto (${twin.id}).`);
  return { activity, errors, warnings };
}

function CardEditor({ editing, onPublished, onCancel }: { editing: CustomCard | null; onPublished: (msg: string) => void; onCancel: () => void }) {
  const publish = useAdmin((s) => s.publish);
  const busy = useAdmin((s) => s.busy);
  const error = useAdmin((s) => s.error);
  const file = useAdmin((s) => s.file);
  const [form, setForm] = useState<CardForm>(() => (editing ? formFromCustomCard(editing) : newCardForm()));
  const [id] = useState(() => editing?.id ?? randomCardId());
  const [tried, setTried] = useState(false);

  const roles = placeholdersIn(form.texto + " " + form.titulo);
  const kind = roles.includes("p3") ? "trio" : roles.includes("p2") ? "pareja" : roles.includes("p1") ? "solo" : "grupo";
  const isPair = kind === "pareja";
  const para = form.para;
  const mixtaSinPareja = para === "mixta" && !isPair;

  const built = useMemo(() => {
    try {
      if (mixtaSinPareja) return { card: null, problem: MIXTA_SIN_PAREJA };
      return { card: buildCustomCard(form, id), problem: null as string | null };
    } catch {
      return { card: null, problem: "Completa el título (2 a 60 letras) y el texto (10 a 320)." };
    }
  }, [form, mixtaSinPareja, id]);
  const check = useMemo(() => (built.card ? checkCard(built.card, editing ? customActivityId(editing) : null) : null), [built.card, editing]);
  const errors = built.problem ? [built.problem] : (check?.errors ?? []);
  const canPublish = !busy && errors.length === 0 && !!built.card;

  const set = <K extends keyof CardForm>(k: K, v: CardForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const insert = (token: string) => set("texto", (form.texto.trimEnd() + " " + token + " ").replace(/^\s+/, ""));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const [lo, hi] = INTENSITY_RANGE[form.nivel];
  const contactWithoutPair = !isPair && form.permisos.some((p) => CONTACT_PERMISSIONS.includes(p) || p === "tiempo_a_solas");

  return (
    <div className="space-y-4">
      <Card className="space-y-5">
        <Title sub={editing ? `Editando ${customActivityId(editing)}` : "Llena los campos; abajo ves cómo quedará."}>{editing ? "Editar carta" : "Nueva carta"}</Title>

        <Section title="Nivel">
          <div className="grid grid-cols-3 gap-2">
            {INTENSITIES.map((l) => (
              <Chip
                key={l}
                selected={form.nivel === l}
                onClick={() => setForm((f) => ({ ...f, nivel: l, intensidad: defaultIntensity(l) }))}
              >
                {INTENSITY_LABEL[l]}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Tipo">
          <div className="grid grid-cols-2 gap-2">
            <Chip selected={form.formato === "pregunta"} onClick={() => setForm((f) => ({ ...f, formato: "pregunta", categoria: f.categoria === "retos" ? "preguntas" : f.categoria }))}>
              Pregunta
            </Chip>
            <Chip selected={form.formato === "reto"} onClick={() => setForm((f) => ({ ...f, formato: "reto", categoria: f.categoria === "preguntas" ? "retos" : f.categoria }))}>
              Reto
            </Chip>
          </div>
        </Section>

        <Field label="Título">
          <input className={INPUT} value={form.titulo} maxLength={60} onChange={(e) => set("titulo", e.target.value)} placeholder="Ej.: Baile a ciegas" />
        </Field>

        <div className="space-y-2">
          <Field
            label="Texto de la carta"
            hint="Persona 1, 2 y 3 no son jugadores fijos: en cada turno la app elige entre todos quién ocupa cada lugar. Sin personas = carta para todo el grupo."
          >
            <textarea
              className={INPUT + " min-h-28 py-3"}
              value={form.texto}
              maxLength={320}
              onChange={(e) => set("texto", e.target.value)}
              placeholder="Ej.: {p1}, baila con {p2} una canción lenta."
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {(["{p1}", "{p2}", "{p3}"] as const).map((t) => (
              <Button key={t} variant="secondary" className="!min-h-10 !px-3 !text-sm" onClick={() => insert(t)}>
                + {PLACEHOLDER_LABEL[t]}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted">
            Tipo detectado:{" "}
            <b className="text-ink">
              {kind === "solo" ? "una persona" : kind === "pareja" ? "pareja (2 personas)" : kind === "trio" ? "las tres personas (solo tríos)" : "todo el grupo"}
            </b>
          </p>
        </div>

        {isPair && (
          <Section title="¿Quién hace la acción?">
            <div className="grid grid-cols-2 gap-2">
              <Chip selected={form.dirigida} onClick={() => set("dirigida", true)}>
                Persona 1 hacia Persona 2
              </Chip>
              <Chip selected={!form.dirigida} onClick={() => set("dirigida", false)}>
                Los dos juntos
              </Chip>
            </div>
          </Section>
        )}

        <Section title="¿Para quién es?">
          <div className="grid gap-2">
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={para === a.id}
                onClick={() => set("para", a.id)}
                className={cx("glass rounded-2xl p-3 text-left transition", para === a.id ? "glow-border" : "hover:bg-white/5")}
              >
                <span className="font-semibold">{a.label}</span>
                <span className="block text-sm text-muted">{a.hint}</span>
              </button>
            ))}
          </div>
          {mixtaSinPareja && (
            <Notice tone="warn">
              {MIXTA_SIN_PAREJA}{" "}
              <button type="button" className="underline" onClick={() => setForm((f) => ({ ...f, texto: `{p1} y {p2}, ${f.texto.trim()}`.trim() }))}>
                Añadirlas al inicio
              </button>
            </Notice>
          )}
        </Section>

        {kind !== "trio" && (
          <Section title="Sesiones donde puede salir">
            <div className="grid grid-cols-3 gap-2">
              <Chip selected={form.sizes.length === 2} onClick={() => set("sizes", [2, 3])}>
                Todas
              </Chip>
              <Chip selected={form.sizes.length === 1 && form.sizes[0] === 2} onClick={() => set("sizes", [2])}>
                Solo de 2
              </Chip>
              <Chip selected={form.sizes.length === 1 && form.sizes[0] === 3} onClick={() => set("sizes", [3])}>
                Solo tríos
              </Chip>
            </div>
          </Section>
        )}

        <Section title="Categoría">
          <select className={INPUT} value={form.categoria} onChange={(e) => set("categoria", e.target.value as CardForm["categoria"])}>
            {CATEGORIES.filter((c) => c !== "sorpresa").map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </Section>

        <Section title="¿Qué implica?" hint="Marca todo lo que la carta pide. Solo saldrá a quienes lo aceptaron al empezar.">
          <div className="grid gap-2">
            {PERMISSIONS.filter((p) => p !== "escritura_privada" && p !== "revelacion_grupo").map((p) => (
              <label key={p} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white/5 p-3">
                <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={form.permisos.includes(p)} onChange={() => set("permisos", toggle(form.permisos, p))} />
                <span>
                  <span className="font-semibold">{PERMISSION_LABEL[p]}</span>
                  <span className="block text-sm text-muted">{PERMISSION_HINT[p]}</span>
                </span>
              </label>
            ))}
          </div>
          {contactWithoutPair && <Notice tone="warn">El contacto y el tiempo a solas solo pueden ir en cartas de pareja (Persona 1 y Persona 2).</Notice>}
        </Section>

        <Section title="Juegos donde aparece" hint="Sin marcar = todos los compatibles.">
          <div className="flex flex-wrap gap-2">
            {FORM_GAMES.map((g) => (
              <Chip key={g} selected={form.juegos.includes(g)} onClick={() => set("juegos", toggle(form.juegos, g))}>
                {GAME_LABEL[g]}
              </Chip>
            ))}
          </div>
        </Section>

        <Field label="Duración en segundos (opcional)" hint="Con duración aparece un reloj y la carta puede salir en Temporizador.">
          <input
            className={INPUT}
            inputMode="numeric"
            value={form.duracion ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
              set("duracion", Number.isFinite(n) && n > 0 ? Math.min(n, 1800) : null);
            }}
            placeholder="Ej.: 30"
          />
        </Field>

        <Field label={`Intensidad dentro de ${INTENSITY_LABEL[form.nivel]}: ${form.intensidad}`} hint="Las más intensas salen más tarde en la sesión.">
          <input type="range" min={lo} max={hi} value={form.intensidad} onChange={(e) => set("intensidad", Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </Field>
      </Card>

      <Card glow className="space-y-3" >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Vista previa · {INTENSITY_LABEL[form.nivel]} · {form.formato === "pregunta" ? "Pregunta" : "Reto"}</p>
        <h2 className="text-2xl font-semibold italic">{previewText(form.titulo) || "Título"}</h2>
        <p className="text-lg">{previewText(form.texto) || "Texto de la carta"}</p>
        <p className="text-sm text-muted">
          {AUDIENCES.find((a) => a.id === para)?.label} · {form.permisos.map((p) => PERMISSION_LABEL[p]).join(", ") || "sin permisos"}
          {form.duracion ? ` · ${form.duracion} s` : ""}
        </p>
        {para === "mixta" && isPair && (
          <p className="rounded-2xl bg-white/5 p-3 text-sm text-muted">
            En un trío de un hombre y dos mujeres puede salir: <b className="text-ink">Hombre → Mujer 1</b>, <b className="text-ink">Hombre → Mujer 2</b>,{" "}
            <b className="text-ink">Mujer 1 → Hombre</b> o <b className="text-ink">Mujer 2 → Hombre</b>
            {form.dirigida ? "" : " (los dos juntos)"}. Nunca entre las dos mujeres.
          </p>
        )}
      </Card>

      {tried && errors.length > 0 && (
        <Notice tone="warn">
          <span className="block font-semibold">Hay que corregir:</span>
          {errors.map((e) => (
            <span key={e} className="block">
              • {e}
            </span>
          ))}
        </Notice>
      )}
      {check && check.warnings.length > 0 && errors.length === 0 && <Notice>Aviso: {check.warnings.join(" · ")}</Notice>}
      {error && <Notice tone="warn">{error}</Notice>}

      <div className="grid gap-2">
        <Button
          block
          size="lg"
          icon="check"
          disabled={busy}
          onClick={() => {
            setTried(true);
            if (!canPublish || !built.card) return;
            const exists = !!file?.cartas.some((c) => c.id === id);
            void publish({ kind: editing && exists ? "update" : "add", card: built.card }, built.card.t).then((r) => {
              if (r) onPublished(`Carta «${built.card!.t}» guardada en el repositorio. Aparecerá en la app cuando Vercel termine de publicar (1 a 3 minutos).`);
            });
          }}
        >
          {busy ? "Guardando…" : editing ? "Guardar cambios" : "Publicar carta"}
        </Button>
        {editing && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar edición
          </Button>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ lista

type Source = "todas" | "mias" | "base" | "ocultas";

interface Row {
  id: string;
  activity: Activity;
  custom: CustomCard | null;
  hidden: boolean;
}

function CardList({ onEdit, onDone }: { onEdit: (c: CustomCard) => void; onDone: (msg: string) => void }) {
  const file = useAdmin((s) => s.file);
  const publish = useAdmin((s) => s.publish);
  const reload = useAdmin((s) => s.reload);
  const busy = useAdmin((s) => s.busy);
  const error = useAdmin((s) => s.error);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<Intensity | "todos">("todos");
  const [source, setSource] = useState<Source>("mias");
  const [limit, setLimit] = useState(30);
  const [confirm, setConfirm] = useState<Row | null>(null);

  const rows = useMemo<Row[]>(() => {
    const hidden = new Set(file?.ocultas ?? []);
    const custom = file?.cartas ?? [];
    const customActs = customCardsToActivities(custom);
    const byId = new Map(custom.map((c) => [customActivityId(c), c]));
    return [
      ...customActs.map((a) => ({ id: a.id, activity: a, custom: byId.get(a.id) ?? null, hidden: false })),
      ...BASE_ACTIVITIES.filter((a) => a.formato !== "sorpresa").map((a) => ({ id: a.id, activity: a, custom: null, hidden: hidden.has(a.id) })),
    ];
  }, [file]);

  const filtered = useMemo(() => {
    const needle = normalizeText(q);
    return rows.filter((r) => {
      if (level !== "todos" && r.activity.intensidad !== level) return false;
      if (source === "mias" && !r.custom) return false;
      if (source === "base" && (r.custom || r.hidden)) return false;
      if (source === "ocultas" && !r.hidden) return false;
      if (needle && !normalizeText(r.activity.titulo + " " + r.activity.texto + " " + r.id).includes(needle)) return false;
      return true;
    });
  }, [rows, q, level, source]);

  const act = (row: Row) => {
    const title = row.activity.titulo;
    const change = row.custom ? { kind: "delete" as const, id: row.custom.id } : row.hidden ? { kind: "unhide" as const, activityId: row.id } : { kind: "hide" as const, activityId: row.id };
    void publish(change, title).then((r) => {
      setConfirm(null);
      if (r) onDone(`${row.custom ? "Carta borrada" : row.hidden ? "Carta restaurada" : "Carta ocultada"}: «${title}». Se verá en la app en 1 a 3 minutos.`);
    });
  };

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <input className={INPUT} type="search" placeholder="Buscar por texto o ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cartas" />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["mias", `Mías (${file?.cartas.length ?? 0})`],
              ["base", "Base"],
              ["ocultas", `Ocultas (${file?.ocultas.length ?? 0})`],
              ["todas", "Todas"],
            ] as const
          ).map(([id, label]) => (
            <Chip key={id} selected={source === id} onClick={() => setSource(id)}>
              {label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["todos", ...INTENSITIES] as const).map((l) => (
            <Chip key={l} selected={level === l} onClick={() => setLevel(l)}>
              {l === "todos" ? "Todos los niveles" : INTENSITY_LABEL[l]}
            </Chip>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-muted">
          <span>{filtered.length} cartas</span>
          <Button variant="quiet" onClick={() => void reload()} disabled={busy}>
            Actualizar
          </Button>
        </div>
      </Card>
      {error && <Notice tone="warn">{error}</Notice>}
      {filtered.length === 0 && <Notice>{source === "mias" ? "Todavía no has creado cartas." : "No hay cartas con ese filtro."}</Notice>}
      <ul className="space-y-2">
        {filtered.slice(0, limit).map((r) => (
          <li key={r.id} className={cx("glass space-y-2 rounded-2xl p-4", r.hidden && "opacity-60")}>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-muted">
              <span>{INTENSITY_LABEL[r.activity.intensidad]}</span>
              <span>·</span>
              <span>{r.activity.formato}</span>
              {r.custom && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent">Mía</span>}
              {r.hidden && <span className="rounded-full bg-white/10 px-2 py-0.5">Oculta</span>}
              {r.activity.parejaMixta && <span className="rounded-full bg-white/10 px-2 py-0.5">Hombre y mujer</span>}
              {r.activity.soloGenero && <span className="rounded-full bg-white/10 px-2 py-0.5">Solo {r.activity.soloGenero === "hombre" ? "hombres" : "mujeres"}</span>}
              <span className="ml-auto normal-case tracking-normal text-faint">{r.id}</span>
            </div>
            <p className="font-semibold">{r.activity.titulo}</p>
            <p className="text-sm text-muted">{previewText(r.activity.texto)}</p>
            <div className="flex gap-2">
              {r.custom && (
                <Button variant="secondary" className="!min-h-10 !text-sm" icon="settings" onClick={() => onEdit(r.custom!)}>
                  Editar
                </Button>
              )}
              <Button variant={r.hidden ? "secondary" : "ghost"} className="!min-h-10 !text-sm" icon={r.custom ? "x" : r.hidden ? "eye" : "x"} onClick={() => setConfirm(r)} disabled={busy}>
                {r.custom ? "Borrar" : r.hidden ? "Restaurar" : "Ocultar"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {filtered.length > limit && (
        <Button variant="secondary" block onClick={() => setLimit(limit + 30)}>
          Ver más
        </Button>
      )}
      <Dialog
        open={!!confirm}
        title={confirm?.custom ? "¿Borrar esta carta?" : confirm?.hidden ? "¿Restaurar esta carta?" : "¿Ocultar esta carta?"}
        onClose={() => setConfirm(null)}
      >
        <p className="text-muted">
          {confirm?.custom
            ? "Se elimina del repositorio. Puedes volver a crearla cuando quieras."
            : confirm?.hidden
              ? "Volverá a salir en la app."
              : "Es una carta base: no se borra del código, pero deja de salir en la app. Puedes restaurarla después."}
        </p>
        <p className="font-semibold">«{confirm?.activity.titulo}»</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Cancelar
          </Button>
          <Button variant={confirm?.hidden ? "primary" : "danger"} disabled={busy} onClick={() => confirm && act(confirm)}>
            {busy ? "Guardando…" : confirm?.custom ? "Borrar" : confirm?.hidden ? "Restaurar" : "Ocultar"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

// ------------------------------------------------------------------ cuenta

function Account() {
  const repo = useAdmin((s) => s.repo);
  const file = useAdmin((s) => s.file);
  const logout = useAdmin((s) => s.logout);
  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-bold">Cuenta</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Repositorio</dt>
        <dd className="break-all">
          {repo?.owner}/{repo?.repo}
        </dd>
        <dt className="text-muted">Rama</dt>
        <dd>{repo?.branch}</dd>
        <dt className="text-muted">Cartas propias</dt>
        <dd>{file?.cartas.length ?? 0}</dd>
        <dt className="text-muted">Cartas ocultas</dt>
        <dd>{file?.ocultas.length ?? 0}</dd>
      </dl>
      <Notice>Los cambios se guardan en {`src/data/custom/cartas.json`}. Vercel vuelve a publicar la app con cada cambio (1 a 3 minutos).</Notice>
      <Button variant="danger" block icon="lock" onClick={logout}>
        Cerrar sesión
      </Button>
    </Card>
  );
}
