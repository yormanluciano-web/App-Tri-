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
import { useStartGate } from "@/pwa/StartGate";
import { FitScale } from "@/components/ui/fit";

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
  // Antes de empezar, comprobar que no haya una versión nueva pendiente.
  const { guard, checking, gate } = useStartGate();

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
    <Screen fit className="justify-between">
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 pt-2">
        <header className="shrink-0 space-y-2 text-center">
          <div className="relative mx-auto size-[clamp(4.5rem,13dvh,8rem)]">
            <div aria-hidden className="absolute inset-3 rounded-full bg-[radial-gradient(circle,rgba(255,77,141,0.55),transparent_70%)] blur-2xl" />
            <Logo3D className="relative size-full animate-float" />
          </div>
          <h1 className="wordmark text-[clamp(2.6rem,min(14vw,8dvh),4rem)] leading-none animate-in">{APP_NAME}</h1>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent animate-in">{APP_SUBTITLE}</p>
          <p className="mx-auto max-w-xs font-display text-base italic text-muted animate-in [@media(max-height:700px)]:hidden">{APP_PROMISE}</p>
        </header>

        <FitScale className="max-h-40">
          <CardFan />
        </FitScale>

        <nav aria-label="Principal" className="shrink-0 space-y-2.5 animate-in">
          <Button block size="xl" icon="flame" className="pulse-glow" disabled={checking} onClick={() => guard(() => router.push("/crear/"))}>
            Nueva sesión
          </Button>
          <Button variant="secondary" icon="play" block disabled={!hydrated || !canContinue} onClick={() => void onContinue()}>
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
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="ghost" icon="sparkle" disabled={checking} onClick={() => guard(onDemo)}>
              Ver demo
            </Button>
            <LinkButton href="/ayuda/" variant="ghost" icon="help">
              Cómo funciona
            </LinkButton>
          </div>
        </nav>
      </div>

      <footer className="shrink-0 space-y-2 pt-3">
        {storageIssue === "unavailable" && (
          <Notice tone="warn">El almacenamiento local no está disponible: puedes jugar, pero nada se guardará.</Notice>
        )}
        <nav aria-label="Más" className="flex gap-2 [&>*]:flex-1">
          <LinkButton href="/favoritas/" variant="secondary" icon="star" className={TAB}>
            Favoritas
          </LinkButton>
          <LinkButton href="/ajustes/" variant="secondary" icon="settings" className={TAB}>
            Ajustes
          </LinkButton>
          <InstallButton className={TAB} />
        </nav>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-center text-[0.7rem] text-muted">
          <span>
            Solo mayores de 18 años · Todo queda en este dispositivo ·{" "}
            <Link href="/ajustes/#privacidad" className="underline">
              Privacidad
            </Link>
          </span>
          <OfflineBadge compact />
        </div>
      </footer>

      {gate}
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

/** Botón de la barra inferior: icono arriba y texto corto. */
const TAB = "!min-h-14 flex-col !gap-0.5 rounded-2xl !px-2 !py-1.5 !text-xs";

const FAN: { theme: ThemeKey; label: string; rot: number; y: number }[] = [
  { theme: "verdad", label: "Verdad", rot: -14, y: 10 },
  { theme: "ruleta", label: "Ruleta", rot: -5, y: 0 },
  { theme: "reto", label: "Reto", rot: 5, y: 0 },
  { theme: "dados", label: "Dados", rot: 14, y: 10 },
];

/** Abanico decorativo de cartas, como una baraja sobre la mesa. */
function CardFan() {
  return (
    <div aria-hidden className="relative flex h-36 w-80 items-end justify-center animate-in">
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

