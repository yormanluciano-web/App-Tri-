import { GAMES, GAME_DESCRIPTION, GAME_LABEL, INTENSITIES, INTENSITY_DESCRIPTION, INTENSITY_LABEL } from "@/domain/models/constants";
import { Card, LinkButton, Screen, Title } from "@/components/ui";

export function Help() {
  return (
    <Screen>
      <div>
        <LinkButton href="/" variant="ghost">
          ← Inicio
        </LinkButton>
      </div>
      <Title sub="Juegos privados para 2 o 3 adultos que comparten un teléfono.">Cómo funciona</Title>
      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Aviso para adultos</h2>
        <p className="text-muted">
          TRIO es solo para mayores de 18 años. Cada persona lo declara por sí misma; no es una verificación documental. El contenido es sugerente, sin imágenes
          ni instrucciones explícitas.
        </p>
      </Card>
      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Tus límites mandan</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>
            <strong className="text-ok">✓ Permitido:</strong> se puede proponer, y siempre puedes rechazar.
          </li>
          <li>
            <strong className="text-warn">? Preguntar antes:</strong> antes de cada actividad, las personas implicadas responden en privado. Solo empieza si todas dicen sí.
          </li>
          <li>
            <strong className="text-bad">✕ Nunca mostrar:</strong> nada que lo requiera aparecerá.
          </li>
          <li>Todo empieza en la base segura: el contacto físico está bloqueado hasta que cada persona lo configure.</li>
          <li>Pasar, cambiar, pausar y detener son normales y nunca se penalizan.</li>
          <li>Subir la intensidad requiere el sí privado de todas las personas; bajar es inmediato.</li>
          <li>Nadie ve quién rechazó algo ni cuántas personas lo hicieron.</li>
        </ul>
      </Card>
      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Intensidades</h2>
        {INTENSITIES.map((l) => (
          <p key={l} className="text-muted">
            <strong className="text-ink">{INTENSITY_LABEL[l]}:</strong> {INTENSITY_DESCRIPTION[l]}
          </p>
        ))}
        <p className="text-sm text-faint">Dentro de cada nivel la intensidad crece poco a poco, pero nunca cambia de nivel sola.</p>
      </Card>
      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Los 12 juegos</h2>
        <dl className="space-y-2">
          {GAMES.map((g) => (
            <div key={g}>
              <dt className="font-semibold">{GAME_LABEL[g]}</dt>
              <dd className="text-muted">{GAME_DESCRIPTION[g]}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-faint">Carta sorpresa añade eventos entre rondas; si es el único juego elegido, las rondas normales usan Tarjetas.</p>
      </Card>
      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Equilibrio</h2>
        <p className="text-muted">
          La app reparte el protagonismo entre quienes tienen opciones compatibles: nadie queda fuera más de 3 rondas seguidas cuando hay una actividad posible para esa
          persona. Si los límites no lo permiten, se usan actividades de grupo o se avisa, sin forzar nada.
        </p>
      </Card>
      <LinkButton href="/crear/">Crear una sesión</LinkButton>
    </Screen>
  );
}
