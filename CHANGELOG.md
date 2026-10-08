# Changelog

## 0.8.0 — 2026-10-08
- Al registrar a cada persona se elige «Hombre» o «Mujer» (obligatorio).
- Nuevo atributo de carta `mixta: true` («solo hombre y mujer»): el motor solo la asigna a una pareja de un hombre y una mujer, en cualquier orden; nunca a dos hombres, dos mujeres o alguien sin género registrado (sesiones antiguas).
- 26 cartas nuevas «solo hombre y mujer» (6 Leve, 10 Picante, 10 Perverso). La demo usa a Ana (mujer) y Leo (hombre).

## 0.7.2 — 2026-10-08
- La carta ya no se traba a mitad del giro: el reverso y el frente son dos piezas que giran por separado (el reverso sale acelerando y el frente entra frenando), sin `backface-visibility`, así que el teléfono no tiene que dibujar el frente justo a mitad del giro.
- El logo del reverso ya no late dentro de la carta que gira, y enfocar el título de la carta no desplaza la pantalla.

## 0.7.1 — 2026-10-08
- Animaciones más fluidas en el móvil: se quita el desenfoque de fondo (backdrop-filter) de las superficies de vidrio y de la aurora, el texto en degradado deja de repintarse, el brillo de los botones anima solo opacidad, la carta gira en un solo tramo sin frenarse a mitad, el dado tiene una curva por tramo y la inclinación escribe la transformación directamente.
- Medido en Chromium con la CPU 4× más lenta: la mesa en reposo pasa de ~17 a 60 fps.

## 0.7.0 — 2026-10-08
- «Ver demo» en el menú principal: entra directo a la mesa con dos personas ficticias (Ana y Leo), nivel Leve y cartas sin contacto, sin escribir nombres ni responder límites. Es privada (no guarda nada) y muestra la etiqueta «Demo».

## 0.6.0 — 2026-10-08
- Animaciones 3D con CSS nativo: cartas que se voltean al repartirse, inclinación 3D con reflejo que sigue al dedo (carta y lanzadores), dados cúbicos que ruedan, ruleta en perspectiva y logo en capas con profundidad.
- Todas se desactivan con «reducir movimiento»; la inclinación se pausa sobre botones para no mover el objetivo al tocar.

## 0.5.0 — 2026-10-07
- Rediseño visual completo: paleta ciruela/rosa/dorado por nivel, fondo animado tipo aurora, tipografías autoalojadas (Playfair Display y Outfit), botones con degradado y brillo, iconos propios.
- Animaciones: carta que se reparte, logo flotante con corazón, reloj circular, botones que laten; todas se desactivan con «reducir movimiento».
- Lanzadores grandes tipo carta (Verdad / Reto, ruleta, dados…), barra de progreso en la creación y en la duración de la sesión.

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
