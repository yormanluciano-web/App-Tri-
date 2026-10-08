"use client";

import { useState } from "react";
import { useAdmin } from "@/admin/store";
import { MUSIC_MOMENTS, MOMENT_HINT, MOMENT_LABEL, type MusicMoment } from "@/music/moments";
import { parseSpotifyUri } from "@/music/spotify";
import { Button, Card, Notice, Title } from "@/components/ui";

const INPUT =
  "min-h-12 w-full rounded-2xl border border-line bg-white/5 px-4 text-base text-ink transition placeholder:text-faint focus:border-accent focus:bg-white/10 focus:outline-none";

export interface MusicOutcome {
  ok: boolean;
  title: string;
  message: string;
  commitUrl?: string | null;
}

function uriToLink(uri: string | undefined): string {
  if (!uri) return "";
  const [, type, id] = uri.split(":");
  return `https://open.spotify.com/${type}/${id}`;
}

/** Pestaña «Música»: Client ID de Spotify y una lista por momento, guardados en el repositorio. */
export function MusicAdmin({ onResult }: { onResult: (r: MusicOutcome) => void }) {
  const file = useAdmin((s) => s.file);
  const publish = useAdmin((s) => s.publish);
  const busy = useAdmin((s) => s.busy);
  const [clientId, setClientId] = useState(file?.musica?.clientId ?? "");
  const [links, setLinks] = useState<Record<MusicMoment, string>>(
    () => Object.fromEntries(MUSIC_MOMENTS.map((m) => [m, uriToLink(file?.musica?.listas?.[m])])) as Record<MusicMoment, string>,
  );
  const [tried, setTried] = useState(false);
  const [copied, setCopied] = useState(false);
  const redirect = typeof window === "undefined" ? "" : `${window.location.origin}/spotify/`;

  const cleanId = clientId.trim();
  const idOk = cleanId === "" || /^[A-Za-z0-9]{32}$/.test(cleanId);
  const parsed = Object.fromEntries(MUSIC_MOMENTS.map((m) => [m, links[m].trim() ? parseSpotifyUri(links[m]) : undefined])) as Record<MusicMoment, string | null | undefined>;
  const badLinks = MUSIC_MOMENTS.filter((m) => parsed[m] === null);
  const anyLevel = !!(parsed.leve || parsed.picante || parsed.perverso);
  const errors = [
    ...(!idOk ? ["El Client ID tiene 32 letras y números (cópialo del panel de Spotify)."] : []),
    ...badLinks.map((m) => `El enlace de «${MOMENT_LABEL[m]}» no es una lista, álbum o artista de Spotify.`),
    ...(cleanId && !anyLevel ? ["Pon al menos una lista para un nivel (Leve, Picante o Perverso)."] : []),
  ];

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <Title sub="La música cambia sola en la mesa según el nivel y las cartas. Cada persona conecta su Spotify Premium en Ajustes.">Música con Spotify</Title>
        <details className="rounded-2xl border border-line bg-white/5 p-3 text-sm text-muted">
          <summary className="cursor-pointer font-semibold text-ink">Cómo registrar la app en Spotify (una sola vez)</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Entra a <b className="text-ink">developer.spotify.com/dashboard</b> con tu cuenta Premium y pulsa <b className="text-ink">Create app</b>.
            </li>
            <li>
              Nombre: «Cómplice». En <b className="text-ink">Redirect URIs</b> pega exactamente la dirección de abajo y marca <b className="text-ink">Web API</b>.
            </li>
            <li>
              Guarda, abre <b className="text-ink">Settings</b> y copia el <b className="text-ink">Client ID</b> aquí. (Es público; no hace falta el «Client secret».)
            </li>
            <li>
              En <b className="text-ink">User Management</b> añade el correo de Spotify de cada persona que vaya a conectarse (máximo 5).
            </li>
          </ol>
        </details>
        <div className="space-y-1">
          <p className="font-semibold">Dirección de regreso (Redirect URI)</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-xl bg-black/30 px-3 py-2 text-sm">{redirect}</code>
            <Button
              variant="secondary"
              className="!min-h-10 !px-3 !text-sm"
              onClick={() => {
                void navigator.clipboard?.writeText(redirect).then(() => setCopied(true));
              }}
            >
              {copied ? "Copiada" : "Copiar"}
            </Button>
          </div>
        </div>
        <label className="block space-y-1">
          <span className="font-semibold">Client ID de Spotify</span>
          <input className={INPUT} value={clientId} onChange={(e) => setClientId(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="32 letras y números" />
        </label>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Listas por momento</h2>
        <p className="text-sm text-muted">Pega el enlace de una lista, álbum o artista (en Spotify: Compartir → Copiar enlace). Si un momento queda vacío, suena la lista del nivel.</p>
        {MUSIC_MOMENTS.map((m) => (
          <label key={m} className="block space-y-1">
            <span className="font-semibold">{MOMENT_LABEL[m]}</span>
            <span className="block text-sm text-muted">{MOMENT_HINT[m]}</span>
            <input
              className={INPUT}
              value={links[m]}
              onChange={(e) => setLinks((l) => ({ ...l, [m]: e.target.value }))}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
              placeholder="https://open.spotify.com/playlist/…"
              aria-label={`Lista para ${MOMENT_LABEL[m]}`}
            />
            {parsed[m] === null && <span className="text-sm text-bad">No es un enlace válido de Spotify.</span>}
          </label>
        ))}
      </Card>

      {tried && errors.length > 0 && (
        <Notice tone="warn">
          {errors.map((e) => (
            <span key={e} className="block">
              • {e}
            </span>
          ))}
        </Notice>
      )}
      <Button
        block
        size="lg"
        icon="check"
        disabled={busy}
        onClick={() => {
          setTried(true);
          if (errors.length) return;
          const listas = Object.fromEntries(MUSIC_MOMENTS.filter((m) => parsed[m]).map((m) => [m, parsed[m]!]));
          void publish({ kind: "music", musica: { ...(cleanId ? { clientId: cleanId } : {}), listas } }, "Música").then((r) =>
            onResult(
              r
                ? { ok: true, title: "¡Música guardada!", message: "La configuración de Spotify ya está en el repositorio.", commitUrl: r.commitUrl }
                : { ok: false, title: "No se pudo guardar", message: useAdmin.getState().error ?? "Algo salió mal. Revisa tu conexión y vuelve a intentarlo." },
            ),
          );
        }}
      >
        {busy ? "Publicando en GitHub…" : "Guardar música"}
      </Button>
    </div>
  );
}
