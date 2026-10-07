# Changelog

## 0.4.1 — 2026-10-07
- 25 confesiones en voz alta para Leve (1.083 cartas).

## 0.4.0 — 2026-10-07
- Se retiran «¿Quién me conoce mejor?» y «Secretos»: 9 juegos y 1.058 cartas, sin rondas de pasar el teléfono durante el juego.

## 0.3.0 — 2026-10-07
- Se retira «¿Quién es más probable?» (votaciones pasando el teléfono): 11 juegos, 1.164 cartas.
- Lo aceptado al inicio ya no se vuelve a preguntar en cada carta de contacto, besos o tiempo a solas.

## 0.2.0 — 2026-10-07
- Nombre visible: Cómplice.
- Catálogo v2 más atrevido: 1.200 actividades nuevas (300 Leve, 450 Picante, 450 Perverso); se retiran las 1.000 anteriores.
- Permisos nuevos: besos intensos, caricias sobre la ropa, quitarse prendas y tiempo a solas, con reglas de validación y avisos en las cartas.
- Límites simplificados: «Acepto todo», «Acepto parcialmente» (por temas) o «No acepto»; detalle en opciones avanzadas.
- Límites del grupo en una sola pantalla opcional.

## 0.1.0 — 2026-10-06
- Proyecto Next.js 16 con exportación estática, TypeScript estricto, Tailwind 4, Zustand y Zod.
- Motor puro: límites y consentimiento, progresión por tramos, selección con equilibrio (espera ≤ 3), variedad y cooldown, transiciones idempotentes.
- Catálogo de 1.000 actividades revisadas (350 Leve, 350 Picante, 300 Perverso) y validador con reporte por familia.
- Interfaz completa: creación con límites por entrega del teléfono, mesa con 12 juegos, pausa/detener, niveles, favoritas, ajustes y ayuda.
- Almacenamiento normal (IndexedDB) y privado (memoria), restauración segura, bloqueo entre pestañas y borrado total.
- PWA: manifest, iconos, service worker con precache completo, indicador offline y actualización a petición.
- CI de GitHub Actions; 61 pruebas unitarias/integración y 32 E2E.
