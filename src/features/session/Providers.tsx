"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "@/stores/session";
import { loadSettings } from "@/storage/settings";
import { registerServiceWorker, subscribePwa } from "@/pwa/register";
import { Button } from "@/components/ui";
import { APP_NAME } from "@/domain/models/constants";
import { configureSfx, releaseAudioNow, unlockAudio } from "@/sound/sfx";

const PAUSABLE = ["ready", "selecting", "playing", "awaitingActivityConsent", "awaitingLevelConsent", "roundReveal", "blocked"];

export function applySettingsToDocument() {
  const s = loadSettings();
  configureSfx(s);
  const root = document.documentElement;
  root.style.setProperty("--text-scale", String(s.textScale));
  if (s.reducedMotion === "on") root.dataset.motion = "reduce";
  else if (s.reducedMotion === "off") root.dataset.motion = "full";
  else delete root.dataset.motion;
}

export function Providers({ children }: { children: ReactNode }) {
  const hydrate = useSession((s) => s.hydrate);
  const curtain = useSession((s) => s.curtain);
  const setCurtain = useSession((s) => s.setCurtain);
  const setUpdateReady = useSession((s) => s.setUpdateReady);

  useEffect(() => {
    applySettingsToDocument();
    void hydrate();
    void registerServiceWorker();
    return subscribePwa((p) => setUpdateReady(p.updateWaiting));
  }, [hydrate, setUpdateReady]);

  useEffect(() => {
    // El navegador solo deja activar el audio al terminar un gesto (en iPhone,
    // al levantar el dedo), así que se desbloquea en esos eventos.
    const unlock = () => unlockAudio();
    const unlockEvents = ["pointerup", "touchend", "click", "keydown"] as const;
    for (const ev of unlockEvents) document.addEventListener(ev, unlock, { capture: true, passive: true });
    // Los menús y botones comunes no suenan: solo los momentos del juego (cartas, dados, minijuegos…).
    return () => {
      for (const ev of unlockEvents) document.removeEventListener(ev, unlock, { capture: true });
    };
  }, []);

  useEffect(() => {
    // Al pasar a segundo plano: pausa y oculta el contenido. Al volver, pantalla neutral.
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      // Fuera de la app no debe quedar el audio activo (ni el indicador de la isla dinámica).
      releaseAudioNow();
      const st = useSession.getState();
      const s = st.session;
      if (s && s.status !== "finished") {
        if (PAUSABLE.includes(s.status)) st.pause();
        setCurtain(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
    };
  }, [setCurtain]);

  return (
    <>
      <div aria-hidden={curtain} className={curtain ? "invisible" : undefined}>
        {children}
      </div>
      {curtain && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-bg p-6 text-center" role="dialog" aria-modal="true" aria-label="Sesión en pausa">
          <p className="wordmark text-4xl">{APP_NAME}</p>
          <p className="text-muted">Sesión en pausa. El contenido está oculto.</p>
          <Button autoFocus onClick={() => setCurtain(false)}>
            Continuar
          </Button>
        </div>
      )}
    </>
  );
}
