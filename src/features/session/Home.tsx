"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/stores/session";
import { APP_NAME, APP_PROMISE, APP_SUBTITLE, INTENSITY_LABEL } from "@/domain/models/constants";
import { Button, Dialog, GameEmblem, LinkButton, Logo3D, Notice, Screen } from "@/components/ui";
import { GAME_THEME, themeStyle, type ThemeKey } from "@/components/ui/visuals";
import { OfflineBadge } from "./OfflineBadge";
import { InstallButton } from "./InstallPanel";
import { demoConfig } from "./demo";

export function Home() {
  const router = useRouter();
  const session = useSession((s) => s.session);
  const recoverable = useSession((s) => s.recoverable);
  const hydrated = useSession((s) => s.hydrated);
  const storageIssue = useSession((s) => s.storageIssue);
  const resumeRecovered = useSession((s) => s.resumeRecovered);
  const discardRecovered = useSession((s) => s.discardRecovered);
  const startSession = useSession((s) => s.startSession);
  const initialConsent = useSession((s) => s.initialConsent);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const activeInMemory = !!session && session.status !== "finished" && session.status !== "setup";
  const canContinue = activeInMemory || recoverable?.kind === "found";

  const onContinue = async () => {
    if (!activeInMemory && recoverable?.kind === "found") await resumeRecovered();
    router.push("/jugar/");
  };

  const onDemo = () => {
    startSession(demoConfig());
    initialConsent(true);
    router.push("/jugar/");
  };

  return (
    <Screen className="justify-between">
      <div className="flex flex-1 flex-col justify-center gap-10 py-8">
        <header className="space-y-4 text-center">
          <div className="relative mx-auto size-36">
            <div aria-hidden className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(255,77,141,0.55),transparent_70%)] blur-2xl" />
            <Logo3D className="relative size-36 animate-float" />
          </div>
          <h1 className="wordmark text-[clamp(3rem,16vw,4.25rem)] leading-none animate-in">{APP_NAME}</h1>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-accent animate-in">{APP_SUBTITLE}</p>
          <p className="mx-auto max-w-xs font-display text-lg italic text-muted animate-in">{APP_PROMISE}</p>
        </header>

        <CardFan />

        <nav aria-label="Principal" className="space-y-3 animate-in">
          <LinkButton href="/crear/" block size="xl" icon="flame" className="pulse-glow">
            Nueva sesión
          </LinkButton>
          <Button variant="secondary" size="lg" icon="play" block disabled={!hydrated || !canContinue} onClick={() => void onContinue()}>
            Continuar sesión
          </Button>
          {recoverable?.kind === "found" && !activeInMemory && (
            <div className="glass flex items-center justify-between gap-2 rounded-2xl px-4 py-2 text-sm text-muted">
              <span>
                Sesión guardada: {recoverable.participants} personas · {recoverable.level ? INTENSITY_LABEL[recoverable.level] : ""}
              </span>
              <Button variant="quiet" onClick={() => setConfirmDiscard(true)}>
                Descartar
              </Button>
            </div>
          )}
          {recoverable && recoverable.kind !== "found" && (
            <Notice tone="warn">
              Hay datos de una sesión anterior que esta versión no puede abrir de forma segura.{" "}
              <button className="underline" onClick={() => setConfirmDiscard(true)}>
                Eliminarlos
              </button>
            </Notice>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" icon="sparkle" onClick={onDemo}>
              Ver demo
            </Button>
            <LinkButton href="/ayuda/" variant="ghost" icon="help">
              Cómo funciona
            </LinkButton>
          </div>
        </nav>
      </div>

      <footer className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <LinkButton href="/favoritas/" variant="secondary" icon="star" className="!min-h-16 flex-col !gap-1 rounded-3xl !px-2 !text-sm">
            Favoritas
          </LinkButton>
          <LinkButton href="/ajustes/" variant="secondary" icon="settings" className="!min-h-16 flex-col !gap-1 rounded-3xl !px-2 !text-sm">
            Ajustes
          </LinkButton>
          <InstallButton />
        </div>
        <p className="text-center text-sm text-muted">
          Solo para mayores de 18 años. Tus sesiones permanecen en este dispositivo.{" "}
          <Link href="/ajustes/#privacidad" className="underline">
            Privacidad
          </Link>
        </p>
        {storageIssue === "unavailable" && (
          <Notice tone="warn">El almacenamiento local no está disponible: puedes jugar, pero nada se guardará.</Notice>
        )}
        <div className="flex justify-center">
          <OfflineBadge />
        </div>
      </footer>

      <Dialog open={confirmDiscard} title="¿Descartar la sesión guardada?" onClose={() => setConfirmDiscard(false)}>
        <p className="text-muted">Se eliminará de este dispositivo y no se podrá recuperar.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              void discardRecovered();
              setConfirmDiscard(false);
            }}
          >
            Descartar
          </Button>
        </div>
      </Dialog>
    </Screen>
  );
}

const FAN: { theme: ThemeKey; label: string; rot: number; y: number }[] = [
  { theme: "verdad", label: "Verdad", rot: -14, y: 10 },
  { theme: "ruleta", label: "Ruleta", rot: -5, y: 0 },
  { theme: "reto", label: "Reto", rot: 5, y: 0 },
  { theme: "dados", label: "Dados", rot: 14, y: 10 },
];

/** Abanico decorativo de cartas, como una baraja sobre la mesa. */
function CardFan() {
  return (
    <div aria-hidden className="relative mx-auto flex h-36 w-full max-w-xs items-end justify-center animate-in">
      {FAN.map((c, i) => (
        <div
          key={c.theme}
          className="deck-face absolute bottom-0 flex h-32 w-[5.25rem] flex-col items-center justify-center gap-1 transition duration-300 hover:-translate-y-2"
          style={{
            ...themeStyle(c.theme),
            left: `calc(50% - 2.625rem + ${(i - 1.5) * 4.3}rem)`,
            transform: `translateY(${c.y}px) rotate(${c.rot}deg)`,
            borderRadius: 16,
          }}
        >
          <span className="absolute left-2 top-1.5 font-display text-xs font-bold text-white/85">{GAME_THEME[c.theme].suit}</span>
          <GameEmblem theme={c.theme} className="size-10" />
          <span className="font-display text-sm font-semibold italic">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

