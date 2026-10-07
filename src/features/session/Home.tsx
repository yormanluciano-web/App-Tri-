"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/stores/session";
import { APP_NAME, APP_PROMISE, APP_SUBTITLE, INTENSITY_LABEL } from "@/domain/models/constants";
import { Button, Dialog, LinkButton, Notice, Screen } from "@/components/ui";
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
      <div className="flex flex-1 flex-col justify-center gap-8 py-8">
        <header className="space-y-3 text-center">
          <svg aria-hidden viewBox="0 0 120 120" className="mx-auto size-20">
            <defs>
              <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#B9A7FF" />
                <stop offset="0.55" stopColor="#FF6F9F" />
                <stop offset="1" stopColor="#F5C76B" />
              </linearGradient>
            </defs>
            <circle cx="44" cy="50" r="26" fill="none" stroke="url(#g)" strokeWidth="7" />
            <circle cx="76" cy="50" r="26" fill="none" stroke="url(#g)" strokeWidth="7" opacity="0.85" />
            <circle cx="60" cy="76" r="26" fill="none" stroke="url(#g)" strokeWidth="7" opacity="0.7" />
          </svg>
          <h1 className="wordmark text-[clamp(2.25rem,13vw,3rem)] leading-tight">{APP_NAME}</h1>
          <p className="text-lg font-semibold">{APP_SUBTITLE}</p>
          <p className="text-muted">{APP_PROMISE}</p>
        </header>

        <nav aria-label="Principal" className="space-y-3">
          <LinkButton href="/crear/" block>
            Nueva sesión
          </LinkButton>
          <Button variant="secondary" block disabled={!hydrated || !canContinue} onClick={() => void onContinue()}>
            Continuar sesión
          </Button>
          {recoverable?.kind === "found" && !activeInMemory && (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-line px-4 py-2 text-sm text-muted">
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
          <LinkButton href="/ayuda/" variant="ghost" block>
            Cómo funciona
          </LinkButton>
        </nav>
      </div>

      <footer className="space-y-4">
        <div className="flex flex-wrap justify-center gap-2">
          <LinkButton href="/favoritas/" variant="ghost">
            Favoritas
          </LinkButton>
          <LinkButton href="/ajustes/" variant="ghost">
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
