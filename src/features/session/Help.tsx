"use client";

import { APP_NAME, GAMES, GAME_DESCRIPTION, GAME_LABEL, INTENSITIES, INTENSITY_DESCRIPTION, INTENSITY_LABEL } from "@/domain/models/constants";
import { Card, LinkButton } from "@/components/ui";
import { MenuPage, type MenuSection } from "@/components/ui/menu";

export function Help() {
  const sections: MenuSection[] = [
    {
      id: "adultos",
      icon: "shield",
      title: "Aviso para adultos",
      sub: "Solo mayores de 18 años",
      content: (
        <Card>
          <p className="text-muted">
            {APP_NAME} es solo para mayores de 18 años. Cada persona lo declara por sí misma; no es una verificación documental. El contenido es sugerente, sin imágenes ni
            instrucciones explícitas.
          </p>
        </Card>
      ),
    },
    {
      id: "limites",
      icon: "heart",
      title: "Tus límites mandan",
      sub: "Qué aceptas y cómo se respeta",
      content: (
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>Cada persona elige en privado: «Acepto todo», «Acepto parcialmente» (por temas) o «No acepto». Quien no acepta solo recibe charla, música y juegos sin contacto.</li>
            <li>Lo marcado como «No acepto» nunca aparece, en ningún nivel ni modo de juego.</li>
            <li>Lo que cada persona acepta al inicio ya no se vuelve a preguntar en cada carta. Quien quiera que le pregunten cada vez puede marcar «Preguntar antes» en opciones avanzadas.</li>
            <li>Prendas: nunca la ropa interior, salvo entre quienes eligieron «Acepto todo», que incluye ropa interior y desnudez.</li>
            <li>Pasar, cambiar, pausar y detener son normales y nunca se penalizan.</li>
            <li>Subir la intensidad requiere el sí privado de todas las personas; bajar es inmediato. En el modo «Sin miedo» todos aceptan al empezar que suba sola con el tiempo.</li>
            <li>Nadie ve quién rechazó algo ni cuántas personas lo hicieron.</li>
          </ul>
        </Card>
      ),
    },
    {
      id: "intensidades",
      icon: "flame",
      title: "Intensidades",
      sub: INTENSITIES.map((l) => INTENSITY_LABEL[l]).join(" · "),
      content: (
        <Card className="space-y-3">
          {INTENSITIES.map((l) => (
            <p key={l} className="text-muted">
              <strong className="text-ink">{INTENSITY_LABEL[l]}:</strong> {INTENSITY_DESCRIPTION[l]}
            </p>
          ))}
          <p className="text-sm text-faint">Dentro de cada nivel la intensidad crece poco a poco con el tiempo. Solo «Sin miedo» cambia de nivel sola.</p>
        </Card>
      ),
    },
    {
      id: "juegos",
      icon: "cards",
      title: "Juegos y modos",
      sub: `${GAMES.length} formas de jugar`,
      content: (
        <Card>
          <dl className="space-y-3">
            {GAMES.map((g) => (
              <div key={g}>
                <dt className="font-semibold">{GAME_LABEL[g]}</dt>
                <dd className="text-sm text-muted">{GAME_DESCRIPTION[g]}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ),
    },
    {
      id: "equilibrio",
      icon: "users",
      title: "Turnos justos",
      sub: "Nadie se queda fuera",
      content: (
        <Card>
          <p className="text-muted">
            La app reparte el protagonismo entre quienes tienen opciones compatibles: nadie queda fuera más de 3 rondas seguidas cuando hay una actividad posible para esa
            persona. Si los límites no lo permiten, se usan actividades de grupo o se avisa, sin forzar nada.
          </p>
        </Card>
      ),
    },
  ];
  return (
    <MenuPage
      title="Cómo funciona"
      sub="Juegos privados para 2 o 3 adultos"
      sections={sections}
      footer={
        <LinkButton href="/crear/" block>
          Crear una sesión
        </LinkButton>
      }
    />
  );
}
