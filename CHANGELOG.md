# Changelog

## 1.7.0 — 2026-10-09
- **Prioridad a las novedades**: las cartas creadas o editadas desde el panel salen 10 veces más que las demás durante 30 días, siempre dentro de su nivel, su tramo de intensidad y lo que cada persona aceptó. El panel las marca con «Novedad». Las 6 cartas originales que ya habías editado cuentan desde el 8 de octubre.
- **Memoria de cartas ya vistas**: en sesiones normales el teléfono recuerda qué cartas ya salieron (solo el número de la carta) y prefiere las que aún no han salido; así el mazo rota entre sesiones. Recuerda hasta tres cuartas partes del mazo y luego las más antiguas vuelven a la rotación. La sesión privada y la demo no guardan nada; «Eliminar todos mis datos» la borra.
- **Perverso más físico**: se quitaron 21 cartas de verdades sobre amor, sentimientos o relaciones (recuerdos románticos, celos, vida amorosa, citas, vulnerabilidad…). Se conservan las de beso, contacto piel con piel y quitar prendas. Perverso pasa de 410 a 389 cartas base.

## 1.6.1 — 2026-10-08
- Corregido: en el teléfono no sonaban los efectos. El audio se intentaba activar al tocar la pantalla, y Safari en iPhone solo lo permite al levantar el dedo; ahora se activa al soltar el dedo y al terminar el toque. Además, si el audio quedó suspendido (por ejemplo, al volver a la app tras una llamada), cada efecto lo reanuda.
- Nueva opción en Ajustes, encendida por defecto: **«Sonar aunque el iPhone esté en silencio»**. Si escuchas Spotify en el mismo iPhone y los efectos pausan la música, apágala.
- Nuevo botón **«Probar sonido»** en Ajustes.

## 1.6.0 — 2026-10-08
- **Efectos de sonido** en toda la app, encendidos por defecto. Se generan en el propio teléfono (Web Audio), sin archivos ni internet, así que funcionan sin conexión.
- Cartas: sacar carta (barajada), la carta al voltearse (roce de papel y brillo), Cumplido (acorde alegre), Pasar y Cambiar.
- Dados con traqueteo y golpe al caer; la ruleta y la botella hacen tic-tic cada vez más lento hasta detenerse.
- Torre del deseo: bloque de madera al sacarlo, crujido o latido cuando aguanta, y derrumbe completo cuando cae.
- Rasca y descubre: sonido de raspado y brillo al descubrir.
- Parqués: dado, cada salto de la ficha más agudo (más grave si retrocede), latido y redoble de suspenso mientras tiembla la ficha «?», platillo al revelarla, silbido al avanzar o retroceder y fanfarria al llegar al corazón.
- Ronda especial, subir o bajar de nivel, cuenta regresiva y fin del reloj (campanas), y fanfarria al cerrar la sesión. Un clic suave en los demás botones.
- En la mesa hay un botón de altavoz para silenciar la partida (no se guarda nada, ni en sesión privada). En Ajustes: encender o apagar y volumen bajo, medio o alto.
- Si está activada en Ajustes, la vibración acompaña los momentos clave (en teléfonos que la admiten).
- En iPhone los efectos se mezclan con Spotify sin cortarlo; el interruptor de silencio del teléfono los apaga.

## 1.5.1 — 2026-10-08
- **Parqués de la pasión, con más suspenso**: tablero cuadrado de 7×7 en 3D, inclinado como sobre una mesa, con casillas más grandes y fichas de pie que dan un salto en cada casilla.
- Dado 3D con puntos que cae dando tumbos y se detiene en el número; luego aparece en grande «¡Ana sacó 4!».
- La ficha avanza despacio con cuenta regresiva en el centro («faltan 3, 2, 1…») y la casilla donde cae se ilumina: «¿Qué le tocará?».
- Una ficha «?» tiembla, se voltea y anuncia lo que tocó («¡Verdad!», «¡Reto!», «¡Avanza 2!», «Descanso»…). Si es avanzar o retroceder, primero se anuncia y luego se ve a la ficha moverse.
- La carta ya no sale de golpe: aparece solo al tocar «Ver la pregunta», «Ver el reto» o «Ver la carta».

## 1.5.0 — 2026-10-08
- Nuevo minijuego **Parqués de la pasión**: tablero circular de 24 casillas con el corazón al centro. Cada persona tira el dado en su turno y su ficha avanza casilla por casilla.
- Casillas: Verdad (pregunta), Reto, Pareja (carta de pareja si la hay), Comodín (cualquier carta), Avanza/Retrocede (movimiento extra una sola vez) y Descanso (sin carta, pasa el turno).
- La carta es para quien cayó en la casilla; todas pasan por el mismo motor de consentimiento (si no hay una compatible para esa persona, el motor elige otra).
- Quien llega al corazón elige a quién le toca el próximo reto y las fichas vuelven a la salida.
- Está en la lista de juegos, en las rondas especiales, en Noche/Caos y en «Probar» del panel.

## 1.4.0 — 2026-10-08
- Nuevo permiso **«Ropa interior y desnudez»**, incluido solo en **«Acepto todo»** (sin menú propio). «Acepto todo» ahora dice claramente: «Todo está permitido, sin límites: incluye ropa interior y desnudez».
- Las cartas «Solo a quien acepta todo» del editor lo exigen. Como ocurre ante el grupo, toda la sesión debe haber elegido «Acepto todo»: en un trío no sale si la tercera persona aceptó solo una parte.
- «Acepto parcialmente» no lo incluye aunque se marquen todas las categorías, y las sesiones guardadas antes de esta versión lo cuentan como no aceptado.
- En esas cartas, el aviso «Nunca la ropa interior» se reemplaza por «Solo entre quienes aceptaron todo. Cualquiera puede pasar o parar en cualquier momento».

## 1.3.3 — 2026-10-08
- Editar una carta original ahora **reescribe directamente esa carta en el código** (su línea en `src/data/<nivel>/v2-NN.ts`). No queda versión aparte: desaparecen la etiqueta «Editada», el filtro «Editadas» y «Volver al original».
- Se conservan el ID, la familia, las etiquetas, el peso y el enfriamiento de la carta; el nivel de una carta original no se cambia.
- Probado con las 1.109 líneas reales: todas se reescriben válidas, con las mismas etiquetas y sin perder permisos; solo cambia la línea de la carta editada.

## 1.3.2 — 2026-10-08
- El validador ya no veta vocabulario sexual ni la mención de ropa interior: la propietaria escribe y edita sus cartas sin palabras prohibidas.
- Sigue bloqueando siempre cualquier mención de menores de edad (la app es solo para adultos).
- Alcohol, fotos íntimas, el teléfono de otra persona o el tono de castigo o humillación pasan de error a aviso: se puede publicar igual.

## 1.3.1 — 2026-10-08
- **Comprobación de actualización antes de empezar**: «Nueva sesión», «Ver demo», «Nueva sesión» al terminar y «Probar» del panel buscan primero una versión nueva («Buscando actualizaciones…»). Si la hay, aparece «Hay una versión nueva» y no se puede empezar hasta tocar «Actualizar ahora»; la app se recarga y ya deja empezar. Sin conexión no se puede comprobar y se deja jugar (la app funciona sin red).

## 1.3.0 — 2026-10-08
- **Editar las cartas originales** desde el panel (Cartas → Originales → Editar). Se usa el mismo editor que en tus cartas; tu versión se guarda en `cartas.json` (`ediciones`) y el original sigue en el código. Las cartas editadas llevan la etiqueta «Editada», se pueden filtrar en «Editadas» y tienen el botón «Volver al original».
- Probado con las 1.083 cartas originales: todas se pueden pasar por el editor y siguen siendo válidas, sin pedir nunca menos permisos que el original.
- Editor: nueva opción «Persona 1 con el grupo» (por ejemplo, «Persona 1, elige a quién besar»), que admite contacto. Las duraciones se ajustan a 10–600 s.
- Una carta editada sube su versión de contenido, así que una sesión guardada con la versión vieja la reemplaza de forma segura.

## 1.2.2 — 2026-10-08
- **Torre del deseo**: ahora se sacan bloques por turnos («Turno de Ana: saca un bloque») sin que salga carta. La torre se sacude con cada bloque y tiembla más; cuando alguien la tumba, se inclina y se desploma, y la carta es para esa persona. El color del bloque que la tumbó decide verdad, reto o comodín. Luego se vuelve a armar.
- **Rasca y descubre**: corregido. La capa dorada se medía mientras la carta giraba al aparecer y quedaba en franjas transparentes que dejaban leer la carta. Ahora mide el tamaño real y es opaca desde el primer instante.
- **La botella**: la giras tú (botón, tocarla o deslizarla). El giro dura 5,5 s, con 7 a 9 vueltas y un frenado lento; al detenerse se ilumina a quién apunta («¡Le toca a…!») y después sale la carta.

## 1.2.1 — 2026-10-08
- Panel de administración: pestaña **Probar** para entrar directo a cualquier juego (incluidos los minijuegos, Noche completa y Caos) eligiendo nivel y 2 o 3 jugadores, sin crear sesión. Usa personas ficticias que aceptan todo y nada se guarda; los juegos nuevos aparecen solos en la lista.
- En la mesa, el modo prueba muestra «Volver al panel» y el panel vuelve a la misma pestaña. La etiqueta Demo/Prueba pasa a la segunda línea de la barra para no chocar con «Pausa».

## 1.2.0 — 2026-10-08
- Tres minijuegos nuevos (primera tanda):
  - **Torre del deseo** (tipo Jenga): sacas un bloque y su color decide verdad (violeta), reto (rojo) o comodín (dorado). La torre tiembla más con cada bloque y, si cae, sale un reto para quien la tumbó.
  - **La botella**: gira entre los jugadores y apunta a la pareja del reto (prefiere cartas de pareja; si no hay compatibles, cualquiera permitida).
  - **Rasca y descubre**: la carta sale cubierta de dorado y se raspa con el dedo; el reto se revela al descubrir más de la mitad (o con «Descubrir todo»).
- **Rondas especiales**: cada 6 rondas se ofrece uno de los minijuegos (¡A jugar! / Ahora no) y al terminar se vuelve al juego anterior. También entran en Noche completa, Caos y la demo.
- Los minijuegos usan el mismo mazo y el mismo filtro de límites (Torre y Rasca: cartas de Tarjetas; Botella: de Verdad o reto), así que respetan lo aceptado y también reparten las cartas creadas en el panel.

## 1.1.0 — 2026-10-08
- Música con Spotify (opcional, cuentas Premium): cada persona conecta su cuenta en Ajustes y la música cambia sola por momentos: Leve, Picante, Perverso, Baile, Calma y Cierre. Si un momento no tiene lista, suena la del nivel. La línea «Sonando» en la mesa permite pausar o activar el cambio automático.
- Panel de administración: nueva pestaña «Música» para el Client ID de Spotify y los enlaces de las listas, guardados en `cartas.json`.
- Verificado contra el esquema OpenAPI oficial de Spotify; aviso claro si Spotify pide esperar (429).
- Conexión segura PKCE, sin secreto ni servidor. Spotify solo recibe qué lista poner. CSP: `accounts.spotify.com` y `api.spotify.com`.

## 1.0.1 — 2026-10-08
- Panel de administración: al publicar, borrar, ocultar o restaurar aparece un aviso grande de éxito (con los pasos: guardada, Vercel publicando, abrir la app) o de error. Tras publicar, el formulario queda vacío para crear otra.
- La lista marca cada carta propia como «En la app» o «Publicándose».
- Las peticiones a GitHub tienen un tiempo máximo (25 s): con mala señal avisa en vez de quedarse cargando.
- Corrige los diálogos de toda la app, que aparecían al final de la página en lugar de encima, y las barras superiores, que no quedaban fijas al desplazarse. Los diálogos ahora son opacos.

## 1.0.0 — 2026-10-08
- Rediseño «mesa de juego moderna»: fondo de terciopelo vino con textura, emblemas (medallones) y mezcla de colores propia para cada juego y para Verdad / Reto por separado.
- La carta es un naipe: marco con el degradado del juego, filete dorado, índices de esquina (nivel y palo), ornamento central y reverso con rombos y emblema.
- Los lanzadores son mazos con cartas asomando detrás; la portada muestra un abanico de cartas; la creación de sesión usa los emblemas.
- Botones principales con mezcla intensa por nivel y texto blanco. Sin efectos costosos: el rendimiento se mantiene (60 fps en reposo).

## 0.9.2 — 2026-10-08
- Editor de cartas: «¿A quién le puede salir?» con las mismas tres opciones del inicio del juego: «A todos» (incluso «No acepto»), «Por categoría» (las categorías de «Acepto parcialmente») y «Solo a quien acepta todo». La lista de permisos uno por uno queda como opción avanzada.

## 0.9.1 — 2026-10-08
- Editor de cartas: «Hombre y mujer» siempre visible. Explica que Persona 1, 2 y 3 no son jugadores fijos. Si falta la pareja en el texto, ofrece añadir «Persona 1 y Persona 2». La vista previa muestra a quién puede salir en un trío.
- Prueba que fija el reparto: en un trío de un hombre y dos mujeres, el hombre se turna con ambas y en ambos sentidos.

## 0.9.0 — 2026-10-08
- Panel de administración (Ajustes → Panel de administración): entrar con una llave de GitHub, crear y editar cartas con vista previa y validación, borrar cartas propias y ocultar o restaurar cartas base. Cada cambio se guarda en `src/data/custom/cartas.json` del repositorio y Vercel vuelve a publicar.
- La llave solo vive en memoria mientras dura la sesión (el llavero del sistema puede autocompletarla); en el dispositivo solo queda el nombre del repositorio y la rama.
- CSP: `connect-src` permite `https://api.github.com`, usada solo por el panel.

## 0.8.1 — 2026-10-08
- Cartas propias sin programar: `src/data/custom/cartas.json` añade cartas y oculta cartas base; se carga en el catálogo y pasa por el mismo validador (guía en docs/CONTENIDO.md).
- Nuevo atributo «solo un género» (`genero: "hombre" | "mujer"`): todas las personas de la carta deben tener ese género; sin género declarado no sale.
- Las metas editoriales se miden sobre las cartas base, así que agregar u ocultar cartas propias no rompe las pruebas.

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
