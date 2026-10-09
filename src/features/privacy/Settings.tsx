"use client";

import { APP_NAME } from "@/domain/models/constants";

import { useEffect, useState } from "react";
import { useSession } from "@/stores/session";
import { loadSettings, saveSettings, type AppSettings } from "@/storage/settings";
import { applySettingsToDocument } from "@/features/session/Providers";
import { Button, Card, Dialog, LinkButton, Notice, Toggle, cx } from "@/components/ui";
import { MusicSettings } from "@/music/ui";
import { MenuPage, type MenuSection } from "@/components/ui/menu";
import { CATALOG, CONTENT_VERSION } from "@/data/catalog";
import { OfflineBadge } from "@/features/session/OfflineBadge";
import { applyUpdate } from "@/pwa/register";
import { sfx } from "@/sound/sfx";

export const APP_VERSION = "1.12.4";

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

  const sections: MenuSection[] = [
    {
      id: "accesibilidad",
      icon: "eye",
      title: "Accesibilidad",
      sub: "Tamaño del texto y animaciones",
      content: settings && (
        <Card className="space-y-4">
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
        </Card>
      ),
    },
    {
      id: "sonido",
      icon: "sound",
      title: "Sonido y vibración",
      sub: settings ? (settings.sfx ? `Efectos encendidos · volumen ${settings.sfxVolume}` : "Efectos apagados") : undefined,
      content: settings && (
        <Card className="space-y-3">
            <Toggle
            checked={settings.sfx}
            onChange={(v) => update({ sfx: v })}
            label="Efectos de sonido"
            hint="Dados, cartas, fichas y suspenso. Se generan en el teléfono, sin internet."
          />
          {settings.sfx && (
            <>
              <Toggle
                checked={settings.sfxOverSilent}
                onChange={(v) => update({ sfxOverSilent: v })}
                label="Sonar aunque el iPhone esté en silencio"
                hint="Con la música de Spotify activa, los efectos se mezclan con ella sin pausarla (y entonces el interruptor de silencio los apaga)."
              />
              <Button variant="secondary" icon="sound" block data-sfx="test" onClick={() => sfx("win")}>
                Probar sonido
              </Button>
              <fieldset className="space-y-2">
                <legend className="font-semibold">Volumen de los efectos</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["bajo", "Bajo"],
                      ["medio", "Medio"],
                      ["alto", "Alto"],
                    ] as const
                  ).map(([v, label]) => (
                    <Button
                      key={v}
                      variant={settings.sfxVolume === v ? "primary" : "secondary"}
                      aria-pressed={settings.sfxVolume === v}
                      onClick={() => update({ sfxVolume: v })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          <Toggle checked={settings.vibration} onChange={(v) => update({ vibration: v })} label="Vibración" hint="Apagada por defecto; solo si el dispositivo la admite." />
        </Card>
      ),
    },
    { id: "musica", icon: "sparkle", title: "Música con Spotify", sub: "Listas que cambian con el juego", content: <MusicSettings /> },
    {
      id: "privacidad",
      icon: "shield",
      title: "Privacidad",
      sub: "Qué se guarda y qué no",
      content: (
        <Card className="space-y-3">
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
      ),
    },
    {
      id: "datos",
      icon: "x",
      tone: "danger",
      title: "Borrar datos",
      sub: "Eliminar todo de este dispositivo",
      content: (
        <Card className="space-y-3">
        <p className="text-muted">
          Elimina sesiones, límites, favoritas y ajustes de {APP_NAME} en este dispositivo, también en otras pestañas abiertas. Los archivos públicos de la app que permiten usarla sin
          conexión se conservan.
        </p>
        <Button variant="danger" block onClick={() => setConfirm(true)}>
          Eliminar todos mis datos
        </Button>
        {result && <Notice>{result}</Notice>}
        </Card>
      ),
    },
    {
      id: "administracion",
      icon: "lock",
      title: "Administración",
      sub: "Panel para editar las cartas",
      content: (
        <Card className="space-y-3">
        <p className="text-sm text-muted">Solo para quien administra las cartas: agregar, editar, ocultar o borrar. Requiere una llave de GitHub con permiso de escritura.</p>
        <LinkButton href="/admin/" variant="secondary" icon="lock" block>
          Panel de administración
        </LinkButton>
        </Card>
      ),
    },
    {
      id: "version",
      icon: "download",
      title: "Instalación y versión",
      sub: `Versión ${APP_VERSION}${updateReady ? " · actualización lista" : ""}`,
      content: (
        <Card className="space-y-3">
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
      ),
    },
  ];

  return (
    <>
      <MenuPage title="Ajustes" sub={`${APP_NAME} · versión ${APP_VERSION}`} sections={sections} />
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
    </>
  );
}
