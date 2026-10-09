"use client";

import { useState } from "react";
import { useAdmin } from "@/admin/store";
import { MUSIC_MOMENTS, MOMENT_HINT, MOMENT_LABEL, type MusicMoment } from "@/music/moments";
import { parseSpotifyUri } from "@/music/spotify";
import { DEFAULT_SONGS, parseSong } from "@/music/selection";
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
  const [songs, setSongs] = useState<Record<MusicMoment, string>>(
    () => Object.fromEntries(MUSIC_MOMENTS.map((m) => [m, (file?.musica?.canciones?.[m] ?? DEFAULT_SONGS[m]).join("\n")])) as Record<MusicMoment, string>,
  );
  const [tried, setTried] = useState(false);
  const [copied, setCopied] = useState(false);
  const redirect = typeof window === "undefined" ? "" : `${window.location.origin}/spotify/`;

  const cleanId = clientId.trim();
  const idOk = cleanId === "" || /^[A-Za-z0-9]{32}$/.test(cleanId);
  const parsed = Object.fromEntries(MUSIC_MOMENTS.map((m) => [m, links[m].trim() ? parseSpotifyUri(links[m]) : undefined])) as Record<MusicMoment, string | null | undefined>;
  const badLinks = MUSIC_MOMENTS.filter((m) => parsed[m] === null);
  const songLines = Object.fromEntries(
    MUSIC_MOMENTS.map((m) => [
      m,
      songs[m]
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    ]),
  ) as Record<MusicMoment, string[]>;
  const badSongs = MUSIC_MOMENTS.flatMap((m) => songLines[m].filter((l) => !parseSong(l) || l.length > 120).map((l) => `«${MOMENT_LABEL[m]}»: «${l.slice(0, 40)}» debe ser «Artista - Canción».`));
  const emptyMoments = MUSIC_MOMENTS.filter((m) => !parsed[m] && songLines[m].length === 0);
  const errors = [
    ...(!idOk ? ["El Client ID tiene 32 letras y números (cópialo del panel de Spotify)."] : []),
    ...badLinks.map((m) => `El enlace de «${MOMENT_LABEL[m]}» no es una lista, álbum o artista de Spotify.`),
    ...badSongs.slice(0, 5),
    ...emptyMoments.map((m) => `«${MOMENT_LABEL[m]}» no tiene canciones ni lista.`),
  ];

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <Title sub="El DJ Cómplice cambia la música sola en la mesa según el nivel y las cartas. Cada persona conecta su Spotify Premium en Ajustes.">Música con Spotify</Title>
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
        <h2 className="text-xl font-bold">DJ Cómplice: canciones por momento</h2>
        <p className="text-sm text-muted">
          Una canción por línea, como «Artista - Canción». La app las busca en Spotify y las pone en orden aleatorio cuando llega cada momento. Si quieres, puedes usar una
          lista tuya en lugar de canciones.
        </p>
        {MUSIC_MOMENTS.map((m) => (
          <div key={m} className="space-y-1.5 border-t border-line pt-3 first-of-type:border-t-0 first-of-type:pt-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{MOMENT_LABEL[m]}</span>
              <span className="text-xs text-faint">{parsed[m] ? "Usa tu lista" : `${songLines[m].length} canciones`}</span>
            </div>
            <span className="block text-xs text-muted">{MOMENT_HINT[m]}</span>
            <textarea
              className={INPUT + " min-h-32 py-2 text-sm leading-relaxed"}
              value={songs[m]}
              onChange={(e) => setSongs((x) => ({ ...x, [m]: e.target.value }))}
              autoCapitalize="off"
              spellCheck={false}
              aria-label={`Canciones para ${MOMENT_LABEL[m]}`}
              disabled={!!parsed[m]}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="text-xs underline" onClick={() => setSongs((x) => ({ ...x, [m]: DEFAULT_SONGS[m].join("\n") }))}>
                Restaurar las de la app
              </button>
            </div>
            <details>
              <summary className="cursor-pointer text-xs text-muted">Usar una lista propia en lugar de canciones</summary>
              <input
                className={INPUT + " mt-1.5"}
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
            </details>
          </div>
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
          // Solo se guardan los momentos cuyas canciones difieren de la selección de la app.
          const canciones = Object.fromEntries(MUSIC_MOMENTS.filter((m) => songLines[m].join("\n") !== DEFAULT_SONGS[m].join("\n")).map((m) => [m, songLines[m]]));
          void publish(
            { kind: "music", musica: { ...(cleanId ? { clientId: cleanId } : {}), listas, ...(Object.keys(canciones).length ? { canciones } : {}) } },
            "Música",
          ).then((r) =>
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
