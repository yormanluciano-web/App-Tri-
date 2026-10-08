"use client";

import { useEffect, useState } from "react";
import type { SessionState } from "@/domain/models/session";
import { getActivity } from "@/data/catalog";
import { useSession } from "@/stores/session";
import { Button, Card, Icon, Notice, Toggle } from "@/components/ui";
import { MOMENT_LABEL, momentFor, playlistFor } from "./moments";
import { MUSIC_CONFIG, useMusic } from "./store";
import { MusicError, beginLogin } from "./spotify";

const SWITCH_DELAY_MS = 1200;

export function musicConfigured(): boolean {
  return !!MUSIC_CONFIG.clientId && Object.keys(MUSIC_CONFIG.listas).length > 0;
}

/**
 * Cambia la lista de Spotify cuando cambia el momento (nivel, baile, calma,
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
  const moment = momentFor(session, openActivity);
  const uri = playlistFor(moment, session.level, MUSIC_CONFIG.listas);

  useEffect(() => {
    if (!ready) init();
  }, [ready, init]);

  useEffect(() => {
    if (!connected || !auto || !uri) return;
    const t = setTimeout(() => void play(uri, moment), SWITCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [connected, auto, uri, moment, play]);

  return null;
}

/** Indicador compacto en la barra de la mesa: momento actual y errores. */
export function MusicStatus() {
  const connected = useMusic((s) => s.connected);
  const auto = useMusic((s) => s.auto);
  const moment = useMusic((s) => s.moment);
  const error = useMusic((s) => s.error);
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
            const lvl = session?.level ?? "leve";
            const uri = playlistFor(moment ?? lvl, lvl, MUSIC_CONFIG.listas);
            if (uri) void play(uri, moment ?? lvl, true);
          }}
        >
          Reintentar
        </button>
      </Notice>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted">
      <span aria-hidden className="text-gold">
        ♪
      </span>
      <span aria-live="polite">{!auto ? "Música automática en pausa" : moment && current ? `Sonando: lista ${MOMENT_LABEL[moment]}` : "Música automática lista"}</span>
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
  const session = useSession((s) => s.session);
  const [connecting, setConnecting] = useState(false);
  const [tested, setTested] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) init();
  }, [ready, init]);

  const clientId = MUSIC_CONFIG.clientId;
  const privateActive = !!session && session.config.mode === "private" && session.status !== "finished" && session.status !== "setup";
  const testUri = playlistFor(session?.level ?? "leve", session?.level ?? "leve", MUSIC_CONFIG.listas);

  return (
    <Card className="space-y-3">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <span aria-hidden className="text-gold">
          ♪
        </span>
        Música con Spotify
      </h2>
      {!clientId ? (
        <p className="text-sm text-muted">Aún no está configurada. Quien administra la app debe añadir el Client ID de Spotify y las listas en el panel de administración (pestaña «Música»).</p>
      ) : !connected ? (
        <>
          <p className="text-sm text-muted">
            Conecta tu cuenta Premium y la música cambiará sola según el nivel y las cartas (baile, calma, cierre). Spotify solo recibe qué lista poner: nunca las cartas, los nombres ni los límites.
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
          <Toggle checked={auto} onChange={setAuto} label="Cambiar la música según las cartas" hint="Deja Spotify abierto en el teléfono; Cómplice elige la lista." />
          {error && <Notice tone="warn">{error}</Notice>}
          {tested && !error && !busy && <Notice>Si escuchas música, ¡todo listo!</Notice>}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={busy || !testUri}
              onClick={() => {
                setTested(false);
                if (testUri) void play(testUri, session?.level ?? "leve", true).then(() => setTested(true));
              }}
            >
              {busy ? "Probando…" : "Probar"}
            </Button>
            <Button variant="ghost" onClick={disconnect}>
              Desconectar
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
