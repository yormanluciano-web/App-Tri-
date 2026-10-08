"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/stores/session";
import { APP_NAME, APP_PROMISE, APP_SUBTITLE, INTENSITY_LABEL } from "@/domain/models/constants";
import { Button, Dialog, LinkButton, Logo3D, Notice, Screen } from "@/components/ui";
import { OfflineBadge } from "./OfflineBadge";
import { InstallButton } from "./InstallPanel";

export function Home() {
  const router = useRouter();
  const session = useSession((s) => s.session);
  const recoverable = useSession((s) => s.recoverable);
  const hydrated = useSession((s) => s.hydrated);
  const storageIssue = useSession((s) => s.storageIssue);
  const resumeRecovered = useSession((s) => s.resumeRecovered);
  const discardRecovered = useSession((s) => s.discardRecovered);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const activeInMemory = !!session && session.status !== "finished" && session.status !== "setup";
  const canContinue = activeInMemory || recoverable?.kind === "found";

  const onContinue = async () => {
    if (!activeInMemory && recoverable?.kind === "found") await resumeRecovered();
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
          <LinkButton href="/ayuda/" variant="ghost" icon="help" block>
            Cómo funciona
          </LinkButton>
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
