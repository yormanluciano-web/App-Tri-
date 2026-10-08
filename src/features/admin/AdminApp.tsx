"use client";

import { useMemo, useState, type ReactNode } from "react";
import { create } from "zustand";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CONTACT_PERMISSIONS,
  GAME_LABEL,
  INTENSITIES,
  INTENSITY_LABEL,
  INTENSITY_RANGE,
  PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_HINT,
  PERMISSION_LABEL,
  type GameId,
  type Intensity,
} from "@/domain/models/constants";
import type { Activity } from "@/domain/models/activity";
import { validateCatalog, normalizeText } from "@/domain/content/validate";
import { placeholdersIn } from "@/data/define";
import { BASE_ACTIVITIES, CUSTOM_FILE } from "@/data/catalog";
import {
  buildCustomCard,
  customActivityId,
  customCardsToActivities,
  defaultIntensity,
  formFromActivity,
  formFromCustomCard,
  formPermissions,
  implicaFromPermissions,
  newCardForm,
  randomCardId,
  type Audience,
  type CardForm,
  type Implica,
  type CustomCard,
} from "@/data/custom";
import { useAdmin, savedRepo } from "@/admin/store";
import { MusicAdmin } from "./MusicAdmin";
import { GameTester } from "./GameTester";
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

/** Lo que se está editando: una carta propia o una carta original del sistema. */
type Editing = { kind: "custom"; card: CustomCard } | { kind: "base"; activity: Activity };

type Tab = "nueva" | "cartas" | "probar" | "musica" | "cuenta";

/** Última pestaña abierta (en memoria): al volver de una prueba, el panel sigue en «Probar». */
const useAdminTab = create<{ tab: Tab; setTab: (t: Tab) => void }>((set) => ({ tab: "nueva", setTab: (tab) => set({ tab }) }));

function AdminPanel() {
  const tab = useAdminTab((s) => s.tab);
  const setTab = useAdminTab((s) => s.setTab);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [result, setResult] = useState<PublishOutcome | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const finish = (r: PublishOutcome) => {
    setResult(r);
    if (r.ok) {
      setEditing(null);
      setEditorKey((k) => k + 1);
    }
  };

  return (
    <Screen>
      <div className="flex items-center justify-between gap-2 pt-2">
        <LinkButton href="/" variant="secondary" icon="back" className="!min-h-11 !px-3">
          Inicio
        </LinkButton>
        <span className="rounded-full border border-gold/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">Administración</span>
      </div>
      <div role="tablist" aria-label="Secciones" className="grid grid-cols-5 gap-1">
        {(
          [
            ["nueva", editing ? "Editar" : "Nueva", "sparkle"],
            ["cartas", "Cartas", "cards"],
            ["probar", "Probar", "dice"],
            ["musica", "Música", "play"],
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
              "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border text-xs transition",
              tab === id ? "border-transparent bg-gradient-to-r from-accent to-accent-2 font-semibold text-accent-ink" : "border-line bg-white/5",
            )}
          >
            <Icon name={icon} className="size-4" />
            {label}
          </button>
        ))}
      </div>
      {tab === "nueva" && (
        <CardEditor
          key={`${editing ? (editing.kind === "custom" ? editing.card.id : editing.activity.id) : "nueva"}-${editorKey}`}
          editing={editing}
          onResult={finish}
          onCancel={() => setEditing(null)}
        />
      )}
      {tab === "cartas" && (
        <CardList
          onEdit={(c) => {
            setEditing(c);
            setTab("nueva");
          }}
          onDone={finish}
        />
      )}
      {tab === "probar" && <GameTester />}
      {tab === "musica" && <MusicAdmin onResult={finish} />}
      {tab === "cuenta" && <Account />}
      <ResultDialog
        result={result}
        onClose={() => setResult(null)}
        onSeeCards={() => {
          setResult(null);
          setTab("cartas");
        }}
      />
    </Screen>
  );
}

/** Resultado de publicar, borrar, ocultar o restaurar: se muestra en un diálogo imposible de pasar por alto. */
interface PublishOutcome {
  ok: boolean;
  title: string;
  message: string;
  commitUrl?: string | null;
}

function ResultDialog({ result, onClose, onSeeCards }: { result: PublishOutcome | null; onClose: () => void; onSeeCards: () => void }) {
  if (!result) return null;
  return (
    <Dialog open title={result.title} onClose={onClose}>
      <div className="flex justify-center" aria-hidden>
        <span
          className={cx(
            "flex size-20 items-center justify-center rounded-full animate-pop",
            result.ok ? "bg-gradient-to-br from-[#34d399] to-[#10b981] text-white shadow-[0_0_40px_rgba(52,211,153,0.55)]" : "bg-gradient-to-br from-[#ff7a8a] to-[#e8457a] text-white",
          )}
        >
          <Icon name={result.ok ? "check" : "x"} className="size-10" strokeWidth={2.6} />
        </span>
      </div>
      <p className="text-center text-muted" role="status">
        {result.message}
      </p>
      {result.ok && (
        <ol className="space-y-1 rounded-2xl bg-white/5 p-3 text-sm text-muted">
          <li>✓ Guardada en el repositorio.</li>
          <li>⏳ Vercel está publicando la nueva versión (1 a 3 minutos).</li>
          <li>↻ Después, cierra y abre la app para verla.</li>
        </ol>
      )}
      {result.ok && result.commitUrl && (
        <a href={result.commitUrl} target="_blank" rel="noreferrer noopener" className="block text-center text-sm text-muted underline">
          Ver el cambio en GitHub
        </a>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onSeeCards}>
          Ver mis cartas
        </Button>
        <Button onClick={onClose}>{result.ok ? "Crear otra" : "Entendido"}</Button>
      </div>
    </Dialog>
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

const IMPLICA: { id: Exclude<Implica, "detalle">; label: string; hint: string }[] = [
  { id: "todos", label: "A todos", hint: "Carta suave: sale incluso a quien eligió «No acepto»." },
  { id: "categorias", label: "Por categoría", hint: "Solo a quien aceptó la categoría que elijas (como «Acepto parcialmente»)." },
  { id: "acepta_todo", label: "Solo a quien acepta todo", hint: "Solo a quien eligió «Acepto todo» al empezar (incluye ropa interior y desnudez). Úsala para cartas sin límites." },
];

function implicaLabel(form: CardForm): string {
  if (form.implica === "todos") return "a todos";
  if (form.implica === "acepta_todo") return "solo a quien acepta todo";
  if (form.implica === "categorias") {
    const names = PERMISSION_GROUPS.filter((g) => form.grupos.includes(g.id)).map((g) => g.title);
    return names.length ? names.join(", ") : "elige una categoría";
  }
  return form.permisos.map((p) => PERMISSION_LABEL[p]).join(", ") || "sin permisos";
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

function CardEditor({ editing, onResult, onCancel }: { editing: Editing | null; onResult: (r: PublishOutcome) => void; onCancel: () => void }) {
  const publish = useAdmin((s) => s.publish);
  const publishOriginal = useAdmin((s) => s.publishOriginal);
  const busy = useAdmin((s) => s.busy);
  const error = useAdmin((s) => s.error);
  const file = useAdmin((s) => s.file);
  const [form, setForm] = useState<CardForm>(() =>
    !editing ? newCardForm() : editing.kind === "custom" ? formFromCustomCard(editing.card) : formFromActivity(editing.activity),
  );
  // Las cartas originales conservan su ID; el formulario usa uno provisional solo para construirla.
  const [id] = useState(() => (editing?.kind === "custom" ? editing.card.id : editing?.kind === "base" ? "base0000" : randomCardId()));
  const editingId = editing ? (editing.kind === "custom" ? customActivityId(editing.card) : editing.activity.id) : null;
  const [tried, setTried] = useState(false);

  const roles = placeholdersIn(form.texto + " " + form.titulo);
  const kind = roles.includes("p3") ? "trio" : roles.includes("p2") ? "pareja" : roles.includes("p1") ? "solo" : "grupo";
  const isPair = kind === "pareja";
  const para = form.para;
  const mixtaSinPareja = para === "mixta" && !isPair;

  const built = useMemo(() => {
    try {
      if (mixtaSinPareja) return { card: null, problem: MIXTA_SIN_PAREJA };
      if (form.implica === "categorias" && form.grupos.length === 0) return { card: null, problem: "Elige al menos una categoría en «¿A quién le puede salir?»." };
      return { card: buildCustomCard(form, id), problem: null as string | null };
    } catch {
      return { card: null, problem: "Completa el título (2 a 60 letras) y el texto (10 a 320)." };
    }
  }, [form, mixtaSinPareja, id]);
  const check = useMemo(() => (built.card ? checkCard(built.card, editingId) : null), [built.card, editingId]);
  const errors = built.problem ? [built.problem] : (check?.errors ?? []);
  const canPublish = !busy && errors.length === 0 && !!built.card;

  const set = <K extends keyof CardForm>(k: K, v: CardForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const insert = (token: string) => set("texto", (form.texto.trimEnd() + " " + token + " ").replace(/^\s+/, ""));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const [lo, hi] = INTENSITY_RANGE[form.nivel];
  const perms = formPermissions(form);
  // Solo las cartas de una persona (sin grupo) no admiten contacto ni tiempo a solas.
  const contactWithoutPair = kind === "solo" && !form.grupo && perms.some((p) => CONTACT_PERMISSIONS.includes(p) || p === "tiempo_a_solas");

  return (
    <div className="space-y-4">
      <Card className="space-y-5">
        <Title
          sub={
            editing?.kind === "base"
              ? `Carta original ${editing.activity.id}. Los cambios reemplazan esta carta directamente en el código: no queda otra versión.`
              : editing
                ? `Editando ${editingId}`
                : "Llena los campos; abajo ves cómo quedará."
          }
        >
          {editing?.kind === "base" ? "Editar carta original" : editing ? "Editar carta" : "Nueva carta"}
        </Title>

        <Section title="Nivel" hint={editing?.kind === "base" ? "El nivel de una carta original no se cambia (forma parte de su lugar en el catálogo)." : undefined}>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITIES.map((l) => (
              <Chip
                key={l}
                selected={form.nivel === l}
                disabled={editing?.kind === "base" && form.nivel !== l}
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
              {kind === "solo" ? (form.grupo ? "Persona 1 con el grupo" : "una persona") : kind === "pareja" ? "pareja (2 personas)" : kind === "trio" ? "las tres personas (solo tríos)" : "todo el grupo"}
            </b>
          </p>
        </div>

        {kind === "solo" && (
          <Section title="¿Quién participa?" hint="Ej.: «Persona 1, elige a quién besar» involucra a todo el grupo.">
            <div className="grid grid-cols-2 gap-2">
              <Chip selected={!form.grupo} onClick={() => set("grupo", false)}>
                Solo Persona 1
              </Chip>
              <Chip selected={!!form.grupo} onClick={() => set("grupo", true)}>
                Persona 1 con el grupo
              </Chip>
            </div>
          </Section>
        )}

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

        <Section title="¿A quién le puede salir?" hint="Las mismas opciones que cada persona elige al empezar a jugar.">
          <div className="grid gap-2" role="radiogroup" aria-label="A quién le puede salir">
            {IMPLICA.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={form.implica === o.id}
                onClick={() => set("implica", o.id)}
                className={cx("glass rounded-2xl p-3 text-left transition", form.implica === o.id ? "glow-border" : "hover:bg-white/5")}
              >
                <span className="font-semibold">{o.label}</span>
                <span className="block text-sm text-muted">{o.hint}</span>
              </button>
            ))}
          </div>
          {form.implica === "categorias" && (
            <div className="space-y-2 pt-1">
              <p className="text-sm font-semibold">¿De qué categoría es? (puedes marcar varias)</p>
              <div className="grid gap-2">
                {PERMISSION_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={form.grupos.includes(g.id)}
                    onClick={() => set("grupos", toggle(form.grupos, g.id))}
                    className={cx(
                      "flex items-start gap-3 rounded-2xl border p-3 text-left transition",
                      form.grupos.includes(g.id) ? "border-transparent bg-gradient-to-r from-accent/25 to-accent-2/25 ring-1 ring-accent" : "border-line bg-white/5",
                    )}
                  >
                    <span className={cx("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border", form.grupos.includes(g.id) ? "border-transparent bg-accent text-accent-ink" : "border-line")}>
                      {form.grupos.includes(g.id) && <Icon name="check" className="size-4" />}
                    </span>
                    <span>
                      <span className="font-semibold">{g.title}</span>
                      <span className="block text-sm text-muted">{g.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {form.implica === "detalle" && (
            <div className="grid gap-2 pt-1">
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
          )}
          {form.implica !== "detalle" ? (
            <Button variant="quiet" onClick={() => setForm((f) => ({ ...f, implica: "detalle", permisos: formPermissions(f) }))}>
              Opción avanzada: elegir permisos uno por uno
            </Button>
          ) : (
            <Button variant="quiet" onClick={() => setForm((f) => ({ ...f, ...implicaFromPermissions(f.permisos, isPair) }))}>
              Volver a las tres opciones
            </Button>
          )}
          {contactWithoutPair && (
            <Notice tone="warn">El contacto, los besos y el tiempo a solas necesitan a otra persona: usa Persona 1 y Persona 2, o marca «Persona 1 con el grupo».</Notice>
          )}
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
          {AUDIENCES.find((a) => a.id === para)?.label} · {implicaLabel(form)}
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
            const title = built.card.t;
            const done =
              editing?.kind === "base"
                ? publishOriginal(editing.activity.id, built.card)
                : publish({ kind: editing && exists ? "update" : "add", card: built.card }, title);
            void done.then((r) => {
              onResult(
                r
                  ? { ok: true, title: editing ? "¡Cambios guardados!" : "¡Carta publicada!", message: `«${title}» ya está en el repositorio.`, commitUrl: r.commitUrl }
                  : { ok: false, title: "No se pudo publicar", message: useAdmin.getState().error ?? "Algo salió mal. Revisa tu conexión y vuelve a intentarlo." },
              );
            });
          }}
        >
          {busy ? "Publicando en GitHub…" : editing ? "Guardar cambios" : "Publicar carta"}
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

type ListAction = "delete" | "hide" | "unhide";

const ACTION_TEXT: Record<ListAction, { title: string; body: string; button: string; done: string }> = {
  delete: { title: "¿Borrar esta carta?", body: "Se elimina del repositorio. Puedes volver a crearla cuando quieras.", button: "Borrar", done: "borrada" },
  hide: { title: "¿Ocultar esta carta?", body: "Es una carta original: no se borra del código, pero deja de salir en la app. Puedes restaurarla después.", button: "Ocultar", done: "ocultada" },
  unhide: { title: "¿Restaurar esta carta?", body: "Volverá a salir en la app.", button: "Restaurar", done: "restaurada" },
};

function CardList({ onEdit, onDone }: { onEdit: (e: Editing) => void; onDone: (r: PublishOutcome) => void }) {
  const file = useAdmin((s) => s.file);
  const publish = useAdmin((s) => s.publish);
  const reload = useAdmin((s) => s.reload);
  const busy = useAdmin((s) => s.busy);
  const error = useAdmin((s) => s.error);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<Intensity | "todos">("todos");
  const [source, setSource] = useState<Source>("mias");
  const [limit, setLimit] = useState(30);
  const [confirm, setConfirm] = useState<{ row: Row; action: ListAction } | null>(null);

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

  const act = (row: Row, action: ListAction) => {
    const title = row.activity.titulo;
    const change =
      action === "delete"
        ? { kind: "delete" as const, id: row.custom!.id }
        : action === "unhide"
          ? { kind: "unhide" as const, activityId: row.id }
          : { kind: "hide" as const, activityId: row.id };
    void publish(change, title).then((r) => {
      setConfirm(null);
      const verb = ACTION_TEXT[action].done;
      onDone(
        r
          ? { ok: true, title: `¡Carta ${verb}!`, message: `«${title}» quedó ${verb} en el repositorio.`, commitUrl: r.commitUrl }
          : { ok: false, title: "No se pudo guardar", message: useAdmin.getState().error ?? "Algo salió mal. Revisa tu conexión y vuelve a intentarlo." },
      );
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
              ["base", "Originales"],
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
              {r.custom &&
                (inThisVersion(r.custom) ? (
                  <span className="rounded-full bg-ok/15 px-2 py-0.5 text-ok">En la app</span>
                ) : (
                  <span className="rounded-full bg-warn/15 px-2 py-0.5 text-warn">Publicándose</span>
                ))}
              {r.hidden && <span className="rounded-full bg-white/10 px-2 py-0.5">Oculta</span>}
              {r.activity.parejaMixta && <span className="rounded-full bg-white/10 px-2 py-0.5">Hombre y mujer</span>}
              {r.activity.soloGenero && <span className="rounded-full bg-white/10 px-2 py-0.5">Solo {r.activity.soloGenero === "hombre" ? "hombres" : "mujeres"}</span>}
              <span className="ml-auto normal-case tracking-normal text-faint">{r.id}</span>
            </div>
            <p className="font-semibold">{r.activity.titulo}</p>
            <p className="text-sm text-muted">{previewText(r.activity.texto)}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="!min-h-10 !text-sm"
                icon="settings"
                onClick={() => onEdit(r.custom ? { kind: "custom", card: r.custom } : { kind: "base", activity: r.activity })}
              >
                Editar
              </Button>
              <Button
                variant={r.hidden ? "secondary" : "ghost"}
                className="!min-h-10 !text-sm"
                icon={r.hidden ? "eye" : "x"}
                onClick={() => setConfirm({ row: r, action: r.custom ? "delete" : r.hidden ? "unhide" : "hide" })}
                disabled={busy}
              >
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
      <Dialog open={!!confirm} title={confirm ? ACTION_TEXT[confirm.action].title : ""} onClose={() => setConfirm(null)}>
        <p className="text-muted">{confirm && ACTION_TEXT[confirm.action].body}</p>
        <p className="font-semibold">«{confirm?.row.activity.titulo}»</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Cancelar
          </Button>
          <Button variant={confirm?.action === "unhide" ? "primary" : "danger"} disabled={busy} onClick={() => confirm && act(confirm.row, confirm.action)}>
            {busy ? "Guardando…" : confirm ? ACTION_TEXT[confirm.action].button : ""}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}


/** ¿Esta versión de la app ya trae la carta tal cual está en el repositorio? */
function inThisVersion(card: CustomCard): boolean {
  const bundled = CUSTOM_FILE.cartas.find((c) => c.id === card.id);
  return !!bundled && JSON.stringify(bundled) === JSON.stringify(card);
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
