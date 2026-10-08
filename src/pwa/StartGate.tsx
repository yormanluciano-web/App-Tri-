"use client";

import { useState, type ReactNode } from "react";
import { Button, Dialog, Icon } from "@/components/ui";
import { applyUpdate, checkForUpdate } from "./register";

type Phase = "idle" | "checking" | "update" | "updating";

/**
 * Antes de empezar una sesión (nueva, demo o prueba), busca una versión nueva
 * de la app. Si la hay, no deja empezar hasta aplicarla. Sin conexión no se
 * puede comprobar y se deja jugar: la app funciona sin red.
 */
export function useStartGate(): { guard: (start: () => void) => void; checking: boolean; gate: ReactNode } {
  const [phase, setPhase] = useState<Phase>("idle");

  const guard = (start: () => void) => {
    if (phase !== "idle") return;
    setPhase("checking");
    void checkForUpdate().then((r) => {
      if (r === "update") {
        setPhase("update");
        return;
      }
      setPhase("idle");
      start();
    });
  };

  const gate = (
    <>
      <Dialog open={phase === "checking"} title="Buscando actualizaciones…">
        <div className="flex justify-center py-2" aria-hidden>
          <Icon name="refresh" className="size-10 animate-spin text-accent" />
        </div>
        <p className="text-center text-muted" role="status">
          Un momento: antes de empezar comprobamos que tengas la última versión.
        </p>
      </Dialog>
      <Dialog open={phase === "update" || phase === "updating"} title="Hay una versión nueva">
        <div className="flex justify-center" aria-hidden>
          <span className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-accent-ink shadow-[0_0_30px_var(--glow)]">
            <Icon name="download" className="size-8" />
          </span>
        </div>
        <p className="text-center text-muted">Para empezar una sesión hay que actualizar la app. Tarda unos segundos y luego vuelves a tocar el botón.</p>
        <Button
          block
          size="lg"
          icon="refresh"
          disabled={phase === "updating"}
          onClick={() => {
            setPhase("updating");
            applyUpdate();
          }}
        >
          {phase === "updating" ? "Actualizando…" : "Actualizar ahora"}
        </Button>
      </Dialog>
    </>
  );

  return { guard, checking: phase === "checking", gate };
}
