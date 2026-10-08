"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LinkButton, Notice, Screen, Title } from "@/components/ui";
import { MUSIC_CONFIG, useMusic } from "./store";
import { MusicError, completeLogin } from "./spotify";

/** Regreso desde Spotify: completa la conexión y vuelve a la app. */
export function SpotifyCallback() {
  const router = useRouter();
  const init = useMusic((s) => s.init);
  const [error, setError] = useState<string | null>(() =>
    MUSIC_CONFIG.clientId ? null : "La música con Spotify no está configurada en esta versión de la app.",
  );
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const search = window.location.search;
    // La URL con el código no debe quedar en el historial.
    window.history.replaceState(null, "", "/spotify/");
    if (!MUSIC_CONFIG.clientId) return;
    completeLogin(search, MUSIC_CONFIG.clientId)
      .then((back) => {
        init();
        router.replace(back);
      })
      .catch((e) => setError(e instanceof MusicError ? e.message : "No se pudo conectar con Spotify."));
  }, [init, router]);

  return (
    <Screen className="justify-center">
      <Title eyebrow="Música">{error ? "No se pudo conectar" : "Conectando con Spotify…"}</Title>
      {error && (
        <>
          <Notice tone="warn">{error}</Notice>
          <LinkButton href="/ajustes/">Volver a Ajustes</LinkButton>
        </>
      )}
    </Screen>
  );
}
