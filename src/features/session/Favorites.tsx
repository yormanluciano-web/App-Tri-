"use client";

import { useEffect } from "react";
import { CATEGORY_LABEL, INTENSITY_LABEL } from "@/domain/models/constants";
import { getActivity } from "@/data/catalog";
import { useSession } from "@/stores/session";
import { Button, Card, LinkButton, Notice, Screen, Title } from "@/components/ui";

/** Favoritas: solo IDs de cartas, sin participantes ni respuestas. */
export function Favorites() {
  const favorites = useSession((s) => s.favorites);
  const mode = useSession((s) => s.favoritesMode);
  const loadFavorites = useSession((s) => s.loadFavorites);
  const toggleFavorite = useSession((s) => s.toggleFavorite);
  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);
  const items = favorites.map((id) => getActivity(id)).filter((a) => !!a);
  return (
    <Screen>
      <div>
        <LinkButton href="/" variant="ghost">
          ← Inicio
        </LinkButton>
      </div>
      <Title sub="Se guardan solo las cartas, nunca quién jugó ni qué respondió. Durante una partida se proponen siempre respetando los límites.">Favoritas</Title>
      {mode === "temporary" && <Notice>Estás en una sesión privada: estas favoritas son temporales y se descartan al terminar.</Notice>}
      {items.length === 0 && <p className="text-muted">Aún no hay favoritas. Toca «☆ Guardar en favoritas» en una carta.</p>}
      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a!.id}>
            <Card className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-faint">
                {INTENSITY_LABEL[a!.intensidad]} · {CATEGORY_LABEL[a!.categoria]}
              </p>
              <p className="font-semibold">{a!.titulo.replace(/\{p[123]\}/g, "…")}</p>
              <p className="text-muted">{a!.texto.replace(/\{p1\}/g, "Persona A").replace(/\{p2\}/g, "Persona B").replace(/\{p3\}/g, "Persona C")}</p>
              <Button variant="quiet" onClick={() => void toggleFavorite(a!.id)}>
                Quitar de favoritas
              </Button>
            </Card>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
