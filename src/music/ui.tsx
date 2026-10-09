"use client";

import { useEffect, useState } from "react";
import type { SessionState } from "@/domain/models/session";
import { getActivity } from "@/data/catalog";
import { useSession } from "@/stores/session";
import { Button, Card, Icon, Notice, Toggle } from "@/components/ui";
import { MOMENT_LABEL, momentFor, sourceFor, type MusicMoment, type MusicSource } from "./moments";
import { DEFAULT_SONGS } from "./selection";
import { MUSIC_CONFIG, useMusic } from "./store";
import { MusicError, beginLogin } from "./spotify";

const SWITCH_DELAY_MS = 1200;

/** Hay música si la app está registrada en Spotify: sin listas propias suena el DJ Cómplice. */
export function musicConfigured(): boolean {
  return !!MUSIC_CONFIG.clientId;
}

/** Música del momento: la lista configurada o la selección del DJ Cómplice. */
export function musicFor(moment: MusicMoment): MusicSource {
  return sourceFor(moment, MUSIC_CONFIG, DEFAULT_SONGS);
}

/** DJ con IA de Spotify (Livi en español): solo se puede abrir en la app de Spotify, no controlar desde aquí. */
const SPOTIFY_DJ_URL = "https://open.spotify.com/playlist/37i9dQZF1EYkqdzj48dyYq";

/**
 * Cambia la música de Spotify cuando cambia el momento (nivel, baile, calma,
 * cierre). Espera un poco antes de cambiar para no saltar si se pasa de carta rápido.
 */
export function MusicDirector({ session }: { session: SessionState }) {
  const init = useMusic((s) => s.init);
  const ready = useMusic((s) => s.ready);
  const connected = useMusic((s) => s.connected);
  const auto = useMusic((s) => s.auto);
  const play = useMusic((s) => s.play);
  const turn = session.currentTurn;
  const openActivity = turn && turn.status !== "closed" ? (getActivity(turn.activityId) ?? null) : null;
  const live = momentFor(session, openActivity);
  // Entre cartas no se cambia la música: solo cuando sale una carta de otro momento
  // (o cambia el nivel, o termina la sesión). Así no se corta en cada carta.
  const [held, setHeld] = useState<{ moment: MusicMoment; level: string }>({ moment: live, level: session.level });
  const between = !openActivity && session.status !== "finished" && held.level === session.level;
  const moment = between ? held.moment : live;
  if (moment !== held.moment || held.level !== session.level) setHeld({ moment, level: session.level });

  useEffect(() => {
    if (!ready) init();
  }, [ready, init]);

  useEffect(() => {
    if (!connected || !auto || !musicConfigured()) return;
    const t = setTimeout(() => void play(musicFor(moment), moment), SWITCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [connected, auto, moment, play]);

  return null;
}

/** Indicador compacto en la barra de la mesa: momento actual y errores. */
export function MusicStatus() {
  const connected = useMusic((s) => s.connected);
  const auto = useMusic((s) => s.auto);
  const moment = useMusic((s) => s.moment);
  const error = useMusic((s) => s.error);
  const errorDetail = useMusic((s) => s.errorDetail);
  const current = useMusic((s) => s.current);
  const play = useMusic((s) => s.play);
  const clearError = useMusic((s) => s.clearError);
  const setAuto = useMusic((s) => s.setAuto);
  const session = useSession((s) => s.session);
  if (!connected || !musicConfigured()) return null;
  if (error) {
    return (
      <Notice tone="warn">
        <span className="font-semibold">Música:</span> {error}{" "}
        <button
          className="underline"
          onClick={() => {
            clearError();
            const m = moment ?? session?.level ?? "leve";
            void play(musicFor(m), m, true);
          }}
        >
          Reintentar
        </button>
        {errorDetail && <span className="mt-1 block text-[0.7rem] opacity-70">Detalle técnico: {errorDetail}</span>}
      </Notice>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted">
      <span aria-hidden className="text-gold">
        ♪
      </span>
      <span aria-live="polite">
        {!auto
          ? "Música automática en pausa"
          : moment && current
            ? `Sonando: ${current.startsWith("dj:") ? "DJ Cómplice" : "lista"} · ${MOMENT_LABEL[moment]}`
            : "Música automática lista"}
      </span>
      <button type="button" className="underline underline-offset-2" onClick={() => setAuto(!auto)}>
        {auto ? "Pausar" : "Activar"}
      </button>
    </div>
  );
}

/** Sección de Ajustes: conectar, cambiar sola, probar y desconectar. */
export function MusicSettings() {
  const init = useMusic((s) => s.init);
  const ready = useMusic((s) => s.ready);
  const connected = useMusic((s) => s.connected);
  const auto = useMusic((s) => s.auto);
  const setAuto = useMusic((s) => s.setAuto);
  const disconnect = useMusic((s) => s.disconnect);
  const play = useMusic((s) => s.play);
  const busy = useMusic((s) => s.busy);
  const error = useMusic((s) => s.error);
  const errorDetail = useMusic((s) => s.errorDetail);
  const session = useSession((s) => s.session);
  const [connecting, setConnecting] = useState(false);
  const [tested, setTested] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) init();
  }, [ready, init]);

  const clientId = MUSIC_CONFIG.clientId;
  const privateActive = !!session && session.config.mode === "private" && session.status !== "finished" && session.status !== "setup";
  const testMoment: MusicMoment = session?.level ?? "leve";

  return (
    <Card className="space-y-3">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <span aria-hidden className="text-gold">
          ♪
        </span>
        Música con Spotify
      </h2>
      {!clientId ? (
        <p className="text-sm text-muted">Aún no está configurada. Quien administra la app debe añadir el Client ID de Spotify en el panel de administración (pestaña «Música»).</p>
      ) : !connected ? (
        <>
          <p className="text-sm text-muted">
            Conecta tu cuenta Premium y el DJ Cómplice pondrá música en español según el nivel y las cartas (baile, calma, cierre). Spotify solo recibe qué canciones buscar y poner: nunca las cartas, los nombres ni los límites.
          </p>
          {privateActive && <Notice tone="warn">Hay una sesión privada en curso: conectar Spotify sale un momento de la app y esa sesión se perdería. Conéctalo antes de empezar.</Notice>}
          {connectError && <Notice tone="warn">{connectError}</Notice>}
          <Button
            block
            icon="play"
            disabled={connecting}
            onClick={() => {
              setConnecting(true);
              setConnectError(null);
              beginLogin(clientId, "/ajustes/").catch((e) => {
                setConnecting(false);
                setConnectError(e instanceof MusicError ? e.message : "No se pudo abrir Spotify.");
              });
            }}
          >
            {connecting ? "Abriendo Spotify…" : "Conectar con Spotify"}
          </Button>
        </>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-ok">
            <Icon name="check" className="size-4" /> Spotify conectado
          </p>
          <Toggle checked={auto} onChange={setAuto} label="DJ Cómplice: cambiar la música según las cartas" hint="Deja Spotify abierto en el teléfono; Cómplice elige las canciones de cada momento." />
          {error && (
            <Notice tone="warn">
              {error}
              {errorDetail && <span className="mt-1 block text-[0.7rem] opacity-70">Detalle técnico: {errorDetail}</span>}
            </Notice>
          )}
          {tested && !error && !busy && <Notice>Si escuchas música, ¡todo listo!</Notice>}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setTested(false);
                void play(musicFor(testMoment), testMoment, true).then(() => setTested(true));
              }}
            >
              {busy ? "Probando…" : "Probar"}
            </Button>
            <Button variant="ghost" onClick={disconnect}>
              Desconectar
            </Button>
          </div>
          <div className="space-y-1.5 rounded-2xl border border-line bg-white/5 p-3">
            <p className="text-sm font-semibold">¿Prefieres el DJ de Spotify (Livi)?</p>
            <p className="text-xs text-muted">
              Se abre en la app de Spotify. Cómplice no puede manejarlo, así que el DJ Cómplice se pausa para no interrumpirlo. Puedes volver a activarlo aquí.
            </p>
            <a
              href={SPOTIFY_DJ_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAuto(false)}
              className="btn-glass flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
            >
              <Icon name="play" className="size-4" /> Abrir el DJ de Spotify
            </a>
          </div>
        </>
      )}
    </Card>
  );
}
