"use client";

import { APP_NAME } from "@/domain/models/constants";

import { useEffect, useState } from "react";
import { useSession } from "@/stores/session";
import { loadSettings, saveSettings, type AppSettings } from "@/storage/settings";
import { applySettingsToDocument } from "@/features/session/Providers";
import { Button, Card, Dialog, LinkButton, Notice, Screen, Title, Toggle, cx } from "@/components/ui";
import { CATALOG, CONTENT_VERSION } from "@/data/catalog";
import { OfflineBadge } from "@/features/session/OfflineBadge";
import { applyUpdate } from "@/pwa/register";

export const APP_VERSION = "0.4.0";

export function Settings() {
  const wipeAll = useSession((s) => s.wipeAll);
  const updateReady = useSession((s) => s.updateReady);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Lectura de almacenamiento del navegador tras montar (el HTML estático no la conoce).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSettings(loadSettings()), []);

  const update = (patch: Partial<AppSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    applySettingsToDocument();
  };

  return (
    <Screen>
      <div>
        <LinkButton href="/" variant="ghost">
          ← Inicio
        </LinkButton>
      </div>
      <Title>Ajustes</Title>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Accesibilidad</h2>
        {settings && (
          <>
            <fieldset className="space-y-2">
              <legend className="font-semibold">Tamaño del texto</legend>
              <div className="grid grid-cols-3 gap-2">
                {([1, 1.15, 1.3] as const).map((v) => (
                  <Button key={v} variant={settings.textScale === v ? "primary" : "secondary"} aria-pressed={settings.textScale === v} onClick={() => update({ textScale: v })}>
                    {v === 1 ? "Normal" : v === 1.15 ? "Grande" : "Muy grande"}
                  </Button>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="font-semibold">Animaciones</legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["system", "Según el sistema"],
                    ["on", "Reducidas"],
                    ["off", "Normales"],
                  ] as const
                ).map(([v, label]) => (
                  <Button key={v} variant={settings.reducedMotion === v ? "primary" : "secondary"} aria-pressed={settings.reducedMotion === v} onClick={() => update({ reducedMotion: v })}>
                    {label}
                  </Button>
                ))}
              </div>
            </fieldset>
            <Toggle checked={settings.sound} onChange={(v) => update({ sound: v })} label="Sonido" hint={`Apagado por defecto. ${APP_NAME} no reproduce música.`} />
            <Toggle checked={settings.vibration} onChange={(v) => update({ vibration: v })} label="Vibración" hint="Apagada por defecto; solo si el dispositivo la admite." />
          </>
        )}
      </Card>

      <Card className="space-y-3" >
        <h2 id="privacidad" className="text-xl font-bold">
          Privacidad
        </h2>
        <p className="font-semibold">Tus sesiones permanecen en este dispositivo.</p>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Sin cuentas, publicidad, analítica ni rastreadores. Ningún dato de juego se envía a internet ni a servicios de IA.</li>
          <li>Sesión normal: alias, límites y progreso se guardan en el almacenamiento local del navegador para continuar después.</li>
          <li>Sesión privada: nada se escribe en el dispositivo; al terminar se descarta.</li>
          <li>Respuestas, votos y secretos solo existen en memoria durante la ronda y nunca se guardan.</li>
          <li>Favoritas guardan solo el identificador de la carta, sin personas ni respuestas.</li>
          <li>El servidor que entrega la web puede ver datos técnicos (como la IP) al descargarla; no promete anonimato de red.</li>
          <li>Una dirección poco conocida no es un control de acceso: cualquiera con la URL puede abrir la web, pero no tus sesiones.</li>
          <li>En un teléfono compartido alguien puede mirar o deducir respuestas. {APP_NAME} no puede impedir capturas de pantalla ni grabaciones.</li>
          <li>El navegador puede borrar datos locales; guardar aquí no es un respaldo permanente. Cambiar de dirección web no traslada los datos.</li>
        </ul>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Borrar datos</h2>
        <p className="text-muted">
          Elimina sesiones, límites, favoritas y ajustes de {APP_NAME} en este dispositivo, también en otras pestañas abiertas. Los archivos públicos de la app que permiten usarla sin
          conexión se conservan.
        </p>
        <Button variant="danger" block onClick={() => setConfirm(true)}>
          Eliminar todos mis datos
        </Button>
        {result && <Notice>{result}</Notice>}
      </Card>

      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Instalación y versión</h2>
        <OfflineBadge />
        <p className="text-sm text-muted">
          Versión {APP_VERSION} · catálogo v{CONTENT_VERSION} · {CATALOG.length} actividades
        </p>
        {updateReady && (
          <Button variant="secondary" onClick={applyUpdate}>
            Aplicar actualización disponible
          </Button>
        )}
      </Card>

      <Dialog open={confirm} title="¿Eliminar todos tus datos?" onClose={() => setConfirm(false)}>
        <p className="text-muted">Esta acción no se puede deshacer. Se cerrará cualquier sesión en curso.</p>
        <div className={cx("grid grid-cols-2 gap-3")}>
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              setConfirm(false);
              const r = await wipeAll();
              setSettings(loadSettings());
              applySettingsToDocument();
              setResult(
                r === "deleted"
                  ? `Listo: los datos de ${APP_NAME} se eliminaron de este dispositivo.`
                  : r === "blocked"
                    ? `Datos marcados para borrar. Cierra las demás pestañas de ${APP_NAME} para completar la eliminación.`
                    : "No se pudo completar el borrado. Inténtalo de nuevo.",
              );
            }}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </Screen>
  );
}
