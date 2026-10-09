"use client";

import { APP_NAME } from "@/domain/models/constants";

import { useEffect, useState } from "react";
import { Button, Dialog } from "@/components/ui";
import { isIos, isStandalone, onInstallAvailability, promptInstall } from "@/pwa/install";

export function InstallButton({ className }: { className?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [native, setNative] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    // Detección del entorno solo en el cliente, tras montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStandalone(isStandalone());
    setIos(isIos());
    return onInstallAvailability(setNative);
  }, []);
  if (standalone) return null;
  return (
    <>
      <Button variant="secondary" icon="download" className={className ?? "!min-h-16 flex-col !gap-1 rounded-3xl !px-2 !text-sm"} onClick={() => setOpen(true)}>
        Instalar
      </Button>
      <Dialog open={open} title={`Instalar ${APP_NAME}`} onClose={() => setOpen(false)}>
        {native ? (
          <div className="space-y-3">
            <p className="text-muted">Tu navegador permite instalar {APP_NAME} como app.</p>
            <Button block onClick={() => void promptInstall().then(() => setOpen(false))}>
              Instalar ahora
            </Button>
          </div>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-muted">
            {ios ? (
              <>
                <li>Abre esta página en Safari.</li>
                <li>Espera el aviso «Disponible sin conexión» en el inicio.</li>
                <li>Toca el botón Compartir y elige «Añadir a pantalla de inicio».</li>
                <li>Si aparece «Abrir como app web», actívalo y confirma «Añadir».</li>
                <li>Abre {APP_NAME} desde el icono.</li>
              </>
            ) : (
              <>
                <li>Abre el menú del navegador.</li>
                <li>Elige «Instalar app» o «Añadir a pantalla de inicio».</li>
                <li>Abre {APP_NAME} desde el icono.</li>
              </>
            )}
          </ol>
        )}
        <p className="text-sm text-faint">Los nombres exactos pueden variar según el sistema. No hace falta tienda de apps.</p>
        <Button variant="secondary" block onClick={() => setOpen(false)}>
          Cerrar
        </Button>
      </Dialog>
    </>
  );
}
