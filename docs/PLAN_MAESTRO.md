# TRIO — Plan maestro de producto y ejecución autónoma para Claude

**Versión:** 1.0 · **Fecha:** 6 de octubre de 2026 · **Idioma:** español.

**Entregable de este documento:** instrucciones completas para construir, probar y publicar una PWA para 2 o 3 adultos. Este archivo es una especificación y una orden de trabajo; no representa una aplicación ya implementada.

## 0. Instrucción principal para Claude

Claude: lee este archivo completo antes de modificar archivos. Actúa con las perspectivas de Product Manager, UX/UI, desarrollo Full Stack, diseño de juegos sociales para adultos, privacidad, seguridad y PWA. Construye TRIO hasta obtener una aplicación funcional, probada y desplegada, con la mínima intervención posible de la persona propietaria.

Este encargo autoriza avanzar por todas las fases descritas. La petición anterior de detenerse tras la Fase 1 queda sustituida, para tu ejecución, por este plan completo. Las fases siguen siendo obligatorias como orden de trabajo y control de calidad, pero **no debes pedir aprobación al terminar cada fase**. Revisa sus criterios, corrige problemas y continúa automáticamente.

### 0.1. Forma de trabajar

1. Inspecciona primero el entorno, repositorio, instrucciones existentes y herramientas realmente disponibles. No supongas que tienes terminal, navegador, GitHub o Vercel.
2. Si existe un proyecto, identifica su estado y conserva trabajo ajeno. Si no existe, crea una carpeta `trio-pwa` y un repositorio independiente.
3. Antes de implementar, materializa el producto, modelo de datos, estados, navegación y arquitectura en documentos breves del proyecto. Usa las decisiones de este archivo; no devuelvas al usuario un cuestionario sobre decisiones ya resueltas.
4. Implementa por incrementos que compilen y funcionen. No escribas toda la aplicación de una vez sin verificar sus piezas críticas.
5. Toma decisiones rutinarias por tu cuenta. Documenta las desviaciones con motivo, consecuencias y verificación.
6. No termines con una maqueta, botones sin función, listas aleatorias sin reglas o una explicación de lo que falta por programar.
7. No simules despliegues, pruebas, instalaciones, accesos, métricas ni disponibilidad de nombres. Distingue ejecutado, pendiente y bloqueado.
8. No realices compras, contrates planes, registres dominios, envíes invitaciones ni publiques datos personales. Respeta los permisos de tus herramientas y las instrucciones de mayor prioridad.
9. Usa recursos gratuitos cuando estén disponibles, sin prometer gratuidad permanente. No incorpores consumo de APIs de IA, pagos ni servicios externos a la aplicación inicial.
10. Si dispones de agentes paralelos y está permitido, puedes delegar tareas independientes con responsabilidad definida. Evita ediciones simultáneas del mismo archivo y revisa las integraciones. Si no, realiza el trabajo secuencialmente.
11. Continúa mientras puedas realizar trabajo útil. Si una autenticación bloquea publicar, termina y verifica primero todo lo que no dependa de ella.
12. Comunica avances breves, concretos y sin exigir respuestas: qué quedó operativo, qué verificaste y qué sigue.

### 0.2. Cuándo sí necesitas intervención humana

Solo cuando exista una dependencia que no puedas resolver legítimamente: iniciar sesión o autorizar GitHub/Vercel; elegir entre cuentas existentes realmente ambiguas; aprobar un gasto; modificar infraestructura ajena; resolver una contradicción material; o comprobar una instalación en un iPhone físico al que no tienes acceso.

Agrupa las preguntas indispensables en una única solicitud siempre que sea posible. Explica exactamente qué acción falta. No pidas contraseñas ni tokens en el chat; utiliza los mecanismos oficiales de autenticación.

Si estás en un chat de Claude sin acceso a archivos, terminal o herramientas de desarrollo, explica esa limitación una sola vez y pide abrir este documento en Claude Code o en un entorno con repositorio y ejecución. No afirmes haber construido la aplicación generando únicamente texto.

### 0.3. Continuidad obligatoria

Crea y mantén estos archivos, sin sobrescribir instrucciones existentes del usuario:

| Archivo | Contenido |
|---|---|
| `CLAUDE.md` | Instrucciones del proyecto, comandos reales, invariantes de consentimiento y lectura inicial |
| `docs/PLAN_MAESTRO.md` | Copia de esta especificación |
| `docs/MAPA_PROYECTO.md` | Módulos, rutas, dependencias y archivos relevantes |
| `docs/ESTADO.md` | Fase actual, último resultado verificado y siguiente acción concreta |
| `docs/PENDIENTES.md` | Trabajo pendiente, bloqueos y prioridad |
| `docs/DECISIONES.md` | Decisiones y desviaciones justificadas |
| `docs/PRUEBAS.md` | Comandos, resultados, alcance y pruebas manuales pendientes |
| `docs/CONTENIDO.md` | Recuento real por nivel/categoría y estado editorial |
| `docs/DESPLIEGUE.md` | Repositorio, proyecto, dominio y procedimiento de actualización, sin secretos |
| `CHANGELOG.md` | Cambios por incremento |

Al iniciar o retomar: lee `CLAUDE.md`, `ESTADO`, `PENDIENTES` y `DECISIONES`; inspecciona el estado real de Git. Al cerrar un incremento, actualiza estado y pruebas. Si el entorno permite hooks oficiales, configura lectura/recordatorios o validación ligera sin permisos adicionales; no inventes hooks ni dependas de ellos para la continuidad. Nunca registres respuestas reales, alias o límites personales en esos documentos.

## 1. Producto, identidad y alcance

### 1.1. Nombre

Usa **TRIO** como nombre provisional durante todo el desarrollo, centralizado en configuración. Subtítulo: **Conexión a tu ritmo**. Promesa: **Cada sesión es diferente. Tus límites siempre cuentan.**

Alternativas documentadas para una decisión de marca posterior: Cómplice, Nexo, Luma, Velia, Entre, Afin, Nua, Aura, Pulso, Noche, Prisma, Lazo, Chispa, Ronda, Sutil, Vela, Bruma, Órbita, Marea, Verso, Duet, Trama, Umbral y Alma. No están verificadas como marcas o dominios. No bloquees el desarrollo buscando un nombre definitivo.

### 1.2. Propuesta de valor

PWA de juegos privados para exactamente 2 o 3 adultos consensuantes que comparten un teléfono. Organiza preguntas, actividades y dinámicas según límites, preferencias, intensidad y participación equilibrada. La experiencia debe sentirse personalizada sin utilizar un modelo de IA durante las sesiones.

Público: parejas, amigos adultos y grupos de tres con distintos grados de confianza. Casos de uso: romper el hielo, conversar, coquetear, jugar con música, reforzar confianza o realizar una noche organizada de juegos.

Ventajas frente a cartas tradicionales: compatibilidad individual, progresión, control de repeticiones, distribución de protagonismo, mezcla de modos, recuperación y privacidad local.

### 1.3. Principios no negociables

- Solo mayores de 18 años. Declaración individual obligatoria; no presentarla como verificación documental.
- Sin menores, coacción, humillación, ilegalidad, lesiones, presión económica, intoxicación como requisito ni castigos por negarse.
- Contenido adulto y sugerente, sin imágenes explícitas ni instrucciones sexuales gráficas.
- Pasar, cambiar, pausar y detener son acciones normales; nunca se penalizan.
- Un límite tiene prioridad sobre nivel, azar, favorito, sorpresa, cadena, equilibrio y cualquier permiso anterior.
- Estar en pareja, ser invitado/a o seleccionar Perverso no significa aceptar contacto.
- No publicar sesiones, respuestas, participantes ni límites.
- No manipular con rachas, presión de grupo, mensajes de cobardía o cuenta atrás para consentir.

### 1.4. Alcance de lanzamiento

Incluye los 12 juegos, tres niveles, configuración individual, sesiones normales y privadas, favoritas, motor de equilibrio, recuperación local, borrado, accesibilidad, instalación y juego offline.

El catálogo debe soportar al menos 1.000 actividades desde su diseño. Implementa primero 180 actividades curadas, 60 por nivel, para probar el producto. Después amplía de forma autónoma hasta la meta de lanzamiento de 1.000: 350 Leve, 350 Picante y 300 Perverso. Las 180 forman parte de las 1.000. No detengas la programación esperando escribir todas; no publiques una cifra falsa ni llenes el catálogo con duplicados cosméticos. Si una limitación real impide completar la ampliación, informa el total exacto y etiqueta la entrega como beta, sin dar por completo el objetivo editorial.

Fuera de la primera versión: multijugador remoto, cuentas, chat, citas, marketplace, pagos, generación online, sincronización con Supabase y panel de administración operativo. Prepara interfaces para integrarlos posteriormente sin construirlos ahora.

## 2. Decisiones predeterminadas para evitar preguntas

| Decisión | Valor |
|---|---|
| Idioma | Español neutro, cercano, adecuado para Colombia |
| Nombre de trabajo | TRIO |
| Usuarios por sesión | 2 o 3 |
| Modo inicial | Leve |
| Duración inicial | 30 minutos |
| Juegos preseleccionados | Verdad o reto y Tarjetas |
| Modo de almacenamiento inicial | Normal, explicado antes de guardar datos; privada visible como alternativa |
| Relación | Opcional, sin efecto sobre permisos |
| Datos personales | Alias; sin correo, teléfono, ubicación ni fecha de nacimiento |
| Preferencias iniciales | Conversación, música y conexión; no conceden permisos |
| Límites sin configurar | Rojo para categorías no incluidas en la base segura |
| Contacto físico | Bloqueado hasta configuración explícita |
| Sonido y vibración | Apagados; opcionales si el dispositivo los admite |
| Hosting | Vercel |
| GitHub | Repositorio privado cuando se cree uno nuevo |
| URL | Subdominio generado por Vercel; sin comprar dominio |
| Acceso a la web | Web utilizable por quien tenga la URL; privacidad de sesiones local, no autenticación de acceso |
| Analytics y publicidad | Desactivados y sin SDK |
| Sin actividades válidas | Estado explícito con alternativas; nunca ampliar permisos |

Aclara en privacidad que una URL poco difundida o `noindex` no constituyen control de acceso. La versión inicial no promete un portal autenticado. No confundas repositorio privado con sitio privado.

## 3. UX y mapa de pantallas

### 3.1. Inicio

Logo tipográfico original, subtítulo, botones Nueva sesión, Continuar sesión y Cómo funciona. Continuar solo está activo si existe una sesión normal recuperable. Accesos secundarios: Favoritas, Ajustes e Instalar. Mostrar aviso de almacenamiento local.

### 3.2. Creación

0. Elegir sesión normal o privada, explicando guardado y recuperación antes de recoger alias.
1. Seleccionar 2 o 3 participantes.
2. Introducir alias, de 1 a 24 caracteres tras recortar espacios. Permitir alias repetidos pero diferenciarlos con un marcador visual y un ID interno distinto. Cada persona confirma ser mayor de 18.
3. Relación opcional: Pareja, Amigos, Pareja + invitado/a u Otro.
4. Configurar límites individuales con entrega del teléfono, y después límites compartidos. No mostrar un resumen comparativo de las respuestas individuales.
5. Elegir Leve, Picante o Perverso, con descripción breve. La selección inicial requiere confirmación de cada participante antes de comenzar.
6. Duración: 15, 30, 45, 60 minutos o sin límite.
7. Seleccionar uno o varios juegos; al menos uno obligatorio. Noche completa fija 60 minutos y explica su mezcla automática. Caos usa todos los juegos compatibles, salvo los que se deshabiliten expresamente.
8. Resumen sin detalles privados: cantidad de personas, nivel, duración y juegos. Consentimiento inicial individual. Si alguien no acepta, no iniciar; ofrecer revisar configuración sin señalar quién.

No activar por defecto checkboxes de edad o consentimiento. No interpretar silencio ni vencimiento de tiempo como aceptación.

### 3.3. Mapa funcional

| Área | Pantallas o estados |
|---|---|
| Entrada | Inicio, Cómo funciona, aviso para adultos |
| Configuración | Almacenamiento, participantes, alias/edad, relación |
| Límites | Entregar teléfono, editor individual, base segura, restricciones compartidas |
| Sesión | Intensidad, duración, juegos, consentimiento inicial, lista para comenzar |
| Mesa | Carta activa, participantes, categoría, nivel, progreso, temporizador |
| Autorización | Explicación, respuestas privadas, resultado colectivo |
| Cambio de nivel | Selección, confirmación individual para subir, resultado |
| Verdad o reto | Elección de tipo, carta |
| Ruleta/Dados | Animación, resultado válido |
| Tarjetas | Filtros, carta, favorita |
| Más probable | Entrega del teléfono, voto, espera, resultados |
| Conocimiento | Respuesta de referencia, adivinanzas, revelación |
| Secretos | Aviso, escritura, revisión, mezcla, adivinación, revelación opcional |
| Temporizador | Duración, preparación, cuenta atrás, cierre |
| Cadena | Etapa y transición |
| Noche completa | Bloque actual, transición, cierre |
| Caos/Sorpresa | Selección compatible, actividad especial |
| Pausa | Continuar, bajar nivel, cambiar juego, revisar límites, terminar |
| Cierre | Resumen agregado opcional, nueva sesión, salir |
| Recuperación | Sesión encontrada, reanudar, descartar, datos incompatibles |
| Ajustes | Privacidad, borrar datos, accesibilidad, instalación, versión |
| Excepciones | Sin candidatos, error local, contenido inválido, offline incompleto, actualización |

Rutas propuestas: `/`, `/crear`, `/jugar`, `/favoritas`, `/ajustes`, `/ayuda`. Los pasos son estados de interfaz; nunca coloques alias, límites o respuestas en URL, parámetros o fragmentos.

### 3.4. Mesa de juego

Tarjeta grande con alias o participantes, juego, categoría, nivel, texto y temporizador cuando aplica. Pie fijo: Cumplido, Pasar y Cambiar. Pausa y Detener siempre visibles, también en pantallas modales y animaciones.

Pasar termina la oportunidad sin penalizar y continúa la rotación. Cambiar reemplaza la actividad, intenta mantener protagonistas compatibles y registra el descarte para no insistir. Cumplido termina solo la actividad; no concede permisos nuevos.

Detener interrumpe actividad y reloj inmediatamente. Después muestra un panel neutral para terminar o volver a la pausa; la actividad no sigue detrás de una confirmación. En sesión privada, finalizar descarta datos volátiles.

### 3.5. Accesibilidad y diseño

Fondo `#0B0B12`, superficies `#171722`, texto principal claro y secundarios con contraste comprobado. Leve usa lavanda; Picante coral/magenta; Perverso ciruela y acentos dorados. Estos son tokens iniciales: corrige contraste sin cambiar la intención.

Usa tipografía local o del sistema, tarjetas redondeadas, vidrio moderado, animaciones breves y controles de al menos 44 × 44 CSS px. Respeta `prefers-reduced-motion`, foco, teclado, lectores de pantalla, ampliación al 200 %, safe areas y teclado virtual. No dependas de hover, color o gestos ocultos. Evita texto diminuto y desplazamiento horizontal desde 320 px.

El semáforo tiene icono, palabra y descripción. Los temporizadores no deben saturar `aria-live` cada segundo. Nunca escondas controles de seguridad bajo contenido largo. El icono será abstracto y no explícito, creado con SVG original y exportaciones PNG.

## 4. Límites y consentimiento

### 4.1. Semáforo

| Valor interno | Etiqueta | Regla |
|---|---|---|
| `green` | Permitido | Se puede proponer; siempre se puede rechazar |
| `yellow` | Preguntar antes | Necesita autorización específica para esa ejecución |
| `red` | Nunca mostrar | Descarta la actividad para esa persona |

Taxonomía inicial: conversación ligera, preguntas personales, confesiones, imaginación/fantasías no gráficas, coqueteo, miradas, música, baile individual, baile cercano, contacto de manos, abrazo, beso consensuado, masaje de manos, masaje de hombros, ojos cerrados, roles de juego, escritura privada y revelación al grupo.

Base segura: conversación ligera, música, adivinanzas y baile individual sin contacto en verde; resto en rojo. Nada de contacto activado de forma silenciosa. Cada persona puede modificarla.

Los límites compartidos se aplican como restricción adicional. Usa el orden de severidad `red > yellow > green`. Un valor ausente o desconocido se trata como rojo. Los límites por combinación de participantes permiten restringir contacto con una persona concreta, incluso si la categoría general está en verde. La configuración inicial de parejas hereda los límites individuales; nunca añade permisos.

### 4.2. Ámbito de aplicación

Cada actividad declara quién está implicado y qué permisos requiere por rol. Valida a todas las personas implicadas, no solo al protagonista. Las actividades con revelación al grupo consideran a todos los receptores afectados. Una persona espectadora no es una vía para eludir límites: incorpora restricciones compartidas sobre lo que ocurre ante el grupo.

No infieras compatibilidad por género, orientación, relación o alias. Nadie puede editar los límites de otra persona desde una pantalla colectiva; la app entrega el teléfono al participante correspondiente. Reconoce que un solo dispositivo no autentica la identidad de quien toca la pantalla.

### 4.3. Consentimiento puntual

1. Filtra primero los rojos; ninguna propuesta bloqueada llega a pantalla.
2. Explica la actividad y quiénes participan antes de solicitar aceptación.
3. Si existe amarillo o `requiresConfirmation`, cada persona implicada responde en una pantalla de entrega privada.
4. Completa todas las respuestas sin revelar un rechazo anticipadamente.
5. Acepta solo con unanimidad; ausencia de respuesta nunca equivale a sí.
6. Si se rechaza, muestra «Elegiremos otra actividad». No muestres recuentos ni autorías del rechazo.
7. Borra las respuestas individuales; conserva como máximo un resultado agregado temporal para ejecutar la actividad.
8. La autorización vale para un turno, actividad, asignación y versión de límites concretos. Caduca si cualquiera cambia.

Evita repetir inmediatamente una solicitud rechazada. No crees un historial de quién bloqueó qué.

### 4.4. Subir y bajar nivel

Subir: «¿Todos quieren subir la intensidad?». Ronda privada para cada participante. Si todos aceptan, activa el nuevo nivel en su tramo inferior. Si alguien rechaza, «Se mantiene el nivel actual». Nunca muestres quién ni cuántos rechazaron. No caducar la pregunta con aceptación implícita.

Bajar: inmediato, sin votación, cancela autorizaciones y actividades de mayor nivel. Desde Pausa debe estar a un toque. La selección inicial de Picante o Perverso también requiere acuerdo de todos.

Editar límites invalida la carta, cola, cadena y autorizaciones afectadas, incluso si la actividad estaba iniciada. Revalida antes de mostrar y antes de comenzar. No uses una selección hecha con límites antiguos.

### 4.5. Límites reales de privacidad

Oculta votos y rechazos en la interfaz, evita pistas temporales y usa pantallas neutrales entre personas. No prometas anonimato absoluto en un teléfono compartido: alguien puede mirar o inferir respuestas. Tampoco prometas impedir capturas o grabaciones.

## 5. Motor LEVE / PICANTE / PERVERSO

| Nivel | Score | Experiencia |
|---|---:|---|
| Leve | 0–30 | Rompehielos, gustos, miradas, música, cumplidos, retos sociales sencillos |
| Picante | 31–65 | Mayor complicidad, elecciones, cercanía autorizada, preguntas atrevidas y cooperación |
| Perverso | 66–100 | Confesiones, imaginación, decisiones personales, roles, cadenas y sorpresas más elaboradas |

Los tres modos cambian contenido, ritmo, mecánicas, combinaciones y tiempos. Perverso debe distinguirse por complejidad, suspense y exposición personal voluntaria; no por ignorar límites. Puede funcionar completamente sin contacto.

### 5.1. Progresión verificable

La interfaz solo muestra el nombre del nivel; `intensityScore` es interno. Divide cada intervalo en tramo bajo, medio y alto. En duración finita, calcula progreso por tiempo activo desde que se entró al nivel, con un horizonte igual al tiempo restante en ese momento, y limita el avance según turnos ofrecidos: bajo durante los primeros 3, medio hasta completar 7, alto desde el 8 si el tiempo también lo permite. En sin límite usa solo esas ventanas de turnos. Parametriza y prueba estos umbrales.

El score máximo elegible aumenta dentro del nivel; nunca selecciona automáticamente otro nivel. Permite mantener el ritmo actual y bajar. Al subir, reinicia la progresión del nuevo nivel. Al bajar, empieza en el tramo bajo por defecto. Las pausas y pantallas de consentimiento no consumen tiempo activo.

No deduzcas autorización a partir de haber completado retos. Pasar no cambia los límites ni penaliza. No repitas categorías recientemente omitidas de forma insistente. Al final de una sesión, prioriza cierre y actividades breves sin presionar a completar pendientes.

## 6. Motor de turnos, selección y equilibrio

### 6.1. Separación entre elegibilidad y preferencias

Primero aplica filtros obligatorios; después calcula pesos. Ningún peso puede rehabilitar una opción descartada.

Proceso de cada turno:

1. Tomar una instantánea versionada del estado y límites.
2. Filtrar catálogo por activación, versión válida, juego, nivel exacto y cantidad de participantes compatible.
3. Enumerar asignaciones de roles para 2 o 3 personas; no seleccionar una actividad sin comprobar sus asignaciones posibles.
4. Aplicar permisos individuales, por pareja, compartidos y restricciones de audiencia.
5. Aplicar techo de progresión, disponibilidad de tiempo y cooldown obligatorio.
6. Excluir ofertas recientes, variantes equivalentes y solicitudes rechazadas en la ventana definida.
7. Ponderar candidatos válidos según preferencias, novedad de categoría, tiempo sin protagonismo y menor uso de combinaciones.
8. Sortear con un generador inyectable; determinista con semilla en pruebas y semilla nueva en cada sesión real.
9. Revalidar que no cambió la versión del estado.
10. Mostrar y, si corresponde, consultar autorización puntual.
11. Iniciar temporizador solo cuando la actividad está autorizada y el usuario indica comenzar.

No filtrar por lectura automática del texto: usa metadatos estructurados y validación editorial.

### 6.2. Estadísticas

Para cada participante: turnos ofrecidos, completados, últimos turnos como protagonista y participaciones compartidas. Para tres: A→B, A→C, B→A, B→C, C→A y C→B; parejas A+B, A+C y B+C; y grupo A+B+C. Diferencia dirección de pareja no dirigida. Mantén métricas sin respuestas privadas.

El equilibrio debe ser condicional a opciones compatibles. Si varias personas tienen candidatos equivalentes, prioriza a quien tenga menos oportunidades y mayor espera. Una vez que existe un turno compatible para una persona, no dejarla fuera más de 3 turnos consecutivos en la simulación de referencia. Si no puede cumplirse por las restricciones, usa actividades grupales seguras cuando existan; no fuerces contacto ni modifiques límites.

Pasar cuenta como oportunidad ofrecida, no como deuda. Equilibra principalmente oportunidades; registra completados solo para diagnóstico. No compenses rechazos con turnos insistentes.

### 6.3. Variedad y cooldown

Define `cooldownTurns` por actividad, valor inicial 12. Una carta ofrecida cuenta para cooldown aunque se pase o cambie. Añade `familyId` y separación de familias, valor inicial 4 turnos. Evita dos propuestas idénticas consecutivas y penaliza categorías o juegos recientes. Si la cantidad de candidatos es escasa, informa el agotamiento temporal y ofrece cambiar juego, bajar nivel o permitir expresamente repetir; jamás ignora límites. Una sorpresa de repetir solicita una excepción explícita al cooldown, siempre con revalidación y nuevo consentimiento.

Cambiar actividad no consume un nuevo turno de rotación hasta que se cierre la oportunidad, pero sí actualiza el historial de ofertas para evitar bucles. Limita reintentos internos y presenta un estado sin candidatos en lugar de un `while` infinito.

### 6.4. No usar IA online

La inteligencia consiste en reglas, ponderaciones, estado e historial. No envíes contexto a un LLM. El catálogo se redacta durante el desarrollo, se valida y se incluye como contenido estático.

## 7. Los 12 juegos: reglas y condiciones de finalización

Todos comparten límites, selección y controles. Implementa controladores diferentes; no presentes 12 pestañas que muestren la misma carta sin mecánicas.

| Juego | Mecánica obligatoria | Cierre |
|---|---|---|
| Verdad o reto | Elegir pregunta o desafío; asignar protagonistas compatibles | Cumplido, Pasar o Cambiar |
| Ruleta | Sortear asignación válida y actividad; animación representa ese resultado | Carta resultante y acciones comunes |
| Dados | Dados de participante, actividad y duración opcional; resultado conjunto validado antes de animar | Actividad resultante |
| Tarjetas | Filtros por categoría, selección compatible y favorita | Acciones comunes |
| Más probable | Pregunta, un voto privado por participante, abstención posible y resultado agregado | Revelación y nueva ronda |
| Quién me conoce mejor | Una respuesta de referencia y adivinanzas de los otros | Revelación y elección voluntaria de coincidencias |
| Secretos | Respuestas temporales, revisión, mezcla y adivinación opcional | Revelación opcional y borrado |
| Temporizador | 30 s, 60 s, 120 s o 180 s compatibles con la carta | Fin del reloj, Cumplido o Pasar |
| Cadena de retos | 3 etapas compatibles y progresivas dentro del nivel | Cada etapa puede pasarse; salir siempre disponible |
| Noche completa | 60 min aproximados; 10 de apertura, 40 de desarrollo y 10 de cierre | Cierre opcional al terminar; puede finalizar antes |
| Caos | Elige juego, asignación, carta y tiempo compatible sin patrón fijo | Cada ronda usa el controlador correspondiente |
| Carta sorpresa | Evento cada 4–7 oportunidades cerradas, intervalo aleatorio | Resolver efecto compatible o pasar |

Detalles de implementación:

- Ruleta y dados nunca muestran resultados incompatibles para corregirlos después. Si no hay actividad grupal válida, no animar una combinación A+B+C.
- Más probable evita preguntas degradantes. Con empates, muestra empate. Votos son secretos durante captura; resultados no atribuyen votantes. En grupos pequeños se pueden inferir, y el aviso debe reconocerlo. Ninguna votación decide contacto o límites de otra persona.
- Quién me conoce mejor no necesita calificación por IA: permite comparación humana sin puntuación obligatoria, o coincidencia exacta normalizada en preguntas cerradas. Las respuestas desaparecen al cerrar la ronda.
- Secretos explica antes de escribir que el texto se compartirá con el grupo. Permite editar o retirar antes de mezclar. Máximo 280 caracteres. No revelar autoría sin autorización individual; eliminar el mapa de autores al cerrar. Si alguien pasa, no se le exige una respuesta sustitutiva.
- Temporizador no comienza en la pantalla de consentimiento. Pausar, poner la app en segundo plano o detener congela el tiempo. Un reloj terminado no significa obligación de continuar o completar nada.
- Cadena revalida en cada etapa; no convierte aceptar la primera en aceptar las siguientes. Evita guardar una cola de actividades como si siguiera autorizada tras un cambio de límites.
- Noche completa no sube de nivel sola. Distribuye actividades y descanso dentro del nivel elegido; permite propuestas opcionales de cambio, nunca insistentes.
- Caos usa solamente juegos habilitados y compatibles. Controla variedad a través del historial.
- Sorpresas: todos participan, roles de juego, elegir compañero compatible, repetición voluntaria, dos mini actividades independientes, cambiar juego, proponer subir nivel o elegir próximo protagonista. Una sorpresa no puede saltarse equilibrio de manera sistemática; una elección manual solo afecta una oportunidad.

Categorías visibles: Rompehielo, Preguntas, Retos, Pareja, Trío, Confianza, Masajes, Música, Baile, Desafíos, Conexión, Elección, Secretos y Sorpresa.

Favoritas guarda el ID de la carta, no participantes ni respuestas. En sesión privada usa favoritas temporales y descártalas al terminar; no exportes preferencias de ese modo silenciosamente.

## 8. Modelo de datos y contratos

Los nombres de tipos siguientes son una especificación para implementar y validar, no código de producción listo para copiar sin revisión. Usa TypeScript estricto y un validador de esquema compatible, por ejemplo Zod. Conserva los valores de intensidad `leve`, `picante`, `perverso`.

### 8.1. Activity

| Campo | Tipo/contrato |
|---|---|
| `id` | String estable, único y no reciclable |
| `schemaVersion` / `contentVersion` | Versiones independientes del contrato y contenido |
| `titulo` / `texto` | Texto plano; placeholders de roles permitidos y validados |
| `categoria` | Categoría principal enumerada |
| `intensidad` | `leve` / `picante` / `perverso` |
| `intensityScore` | Entero dentro del intervalo del nivel |
| `participantesMinimos` / `participantesMaximos` | Personas implicadas; entre 1 y 3 |
| `sessionSizes` | Sesiones permitidas: 2, 3 o ambas |
| `tipoInteraccion` | `solo`, `pair`, `directed_pair`, `group` |
| `roles` | Roles necesarios y restricciones de asignación; no repetir personas salvo regla explícita válida |
| `audienceScope` | Quién recibe o presencia contenido; puede abarcar toda la sesión |
| `duracion` | Sugerida, mínima y máxima en segundos, o null sin reloj |
| `tags` | Lista controlada |
| `restricciones` | Permisos requeridos por rol, pareja y audiencia |
| `gameModes` | Juegos compatibles |
| `pesoAleatorio` | Número positivo finito |
| `cooldown` | Entero no negativo de oportunidades cerradas |
| `familyId` | Familia semántica para controlar variantes |
| `requiereConfirmacion` | Booleano; no sustituye el amarillo |
| `active` / `premium` | Booleanos; todo el catálogo inicial incluido y accesible |
| `packId` / `locale` | Paquete y `es` |
| `editorialStatus` | `draft`, `reviewed` o `disabled`; producción solo reviewed |
| `effect` | Efecto estructurado opcional para sorpresas; enum cerrado, nunca código ejecutable |

Una actividad individual puede tener mínimo 1 aunque la sesión requiera 2 o 3. Distingue tamaño de sesión de cantidad de personas activas para no perder preguntas individuales.

### 8.2. Otras entidades

| Entidad | Campos mínimos |
|---|---|
| Participant | ID local aleatorio, alias, color/icono, declaración 18+, perfil de límites |
| LimitProfile | Versión, mapa de permisos, restricciones opcionales por pareja |
| Preferences | Categorías preferidas/evitadas, ritmo; nunca permisos |
| SessionConfig | Privada/normal, participantes, nivel, duración, juegos, restricciones compartidas |
| SessionState | ID, versión, estado, nivel, progreso, turno, tiempos, estadísticas, historial mínimo |
| Turn | ID idempotente, carta/versión, roles, estado, versión de límites y desenlace |
| ConsentRequest | Turno, alcance, personas implicadas, versiones, resultado temporal |
| RoundEphemeral | Respuestas, votos y autorías solo en memoria, separados de SessionState persistible |
| Favorite | ID/versión de actividad; sin respuestas ni personas |
| ContentPack | ID, nombre, versión, actividad IDs, idioma, marca premium futura |

No mezcles votos/respuestas con un store persistido automáticamente. Serializa mediante una lista explícita de campos permitidos; nunca guardes el objeto completo por comodidad.

### 8.3. Estados y transiciones

Estados propuestos: `setup`, `awaitingInitialConsent`, `ready`, `selecting`, `awaitingActivityConsent`, `playing`, `paused`, `awaitingLevelConsent`, `roundReveal`, `finished` y `blocked`.

Define eventos y transiciones legales. Un doble toque en Cumplido no puede duplicar un turno. Un resultado de temporizador antiguo no puede completar otra carta. Los eventos incluyen IDs y versiones; ignora eventos caducados. Cualquier evento Detener gana prioridad y congela ejecución.

Mientras se escribe una respuesta o se vota, Pasar abandona esa participación sin revelar contenido previo. Pausa oculta textos sensibles. Volver atrás no muestra la respuesta del participante anterior.

Al recargar una sesión normal, restaura un punto seguro: si había consentimiento pendiente, vuelve a solicitarlo; si había una ronda con respuestas privadas, reiníciala sin recuperar respuestas; si había reloj, restaura pausado. No reanudar contacto ni temporizador automáticamente.

## 9. Arquitectura técnica y estructura de proyecto

### 9.1. Stack

Next.js App Router, TypeScript estricto, Tailwind CSS, Zustand, IndexedDB con un adaptador ligero, validación de esquemas, Vitest, Playwright y pruebas generativas de invariantes si aportan cobertura útil. Usa versiones estables compatibles consultando documentación oficial al iniciar; fija el lockfile y registra versiones realmente instaladas. No copies una versión supuestamente reciente de memoria.

Usa un único gestor de paquetes, por defecto npm, y una versión de Node compatible fijada en `.nvmrc` y `engines`. No incorpores un SDK de Supabase ni variables de entorno innecesarias en la versión local.

### 9.2. Diseño de ejecución

La lógica de juego y datos sensibles vive en el cliente. Los componentes de servidor solo entregan recursos y estructura genérica. No uses Server Actions o endpoints para procesar sesiones. Evita que alias, límites o respuestas entren en HTML generado en servidor, solicitudes de navegación o telemetría.

El motor es una biblioteca de funciones puras con reloj y RNG inyectables. Zustand coordina la UI; no contiene las reglas dispersas en componentes. Los juegos usan adaptadores sobre el mismo motor. La persistencia se implementa mediante interfaces y adaptadores `IndexedDbRepository` y `MemoryRepository`, seleccionados al crear la sesión.

### 9.3. Estructura orientativa

| Directorio/archivo | Responsabilidad |
|---|---|
| `src/app/` | Rutas, layouts, metadata y estados de error |
| `src/components/ui/` | Botones, diálogos, inputs, tarjetas |
| `src/features/setup/` | Creación y límites |
| `src/features/session/` | Mesa, pausa, cierre, recuperación |
| `src/features/games/` | Un controlador por juego |
| `src/features/privacy/` | Borrado, ocultación y modo privado |
| `src/domain/models/` | Tipos, enums y esquemas |
| `src/domain/engine/` | Elegibilidad, intensidad, equilibrio, variedad, selección |
| `src/domain/consent/` | Autorizaciones y compatibilidad |
| `src/domain/state/` | Transiciones de sesión y turnos |
| `src/data/leve/` | `questions.ts`, `challenges.ts`, otros contenidos |
| `src/data/picante/` | Contenido del nivel |
| `src/data/perverso/` | Contenido del nivel |
| `src/data/catalog.ts` | Composición y validación del catálogo |
| `src/storage/` | Interfaces, IndexedDB, memoria, migraciones y borrado |
| `src/stores/` | Estado de UI y coordinadores |
| `src/pwa/` | Registro, disponibilidad offline y actualizaciones |
| `public/` | Manifest, iconos y recursos estáticos |
| `scripts/` | Validación de contenido, reporte y recursos PWA |
| `tests/unit/`, `tests/integration/`, `tests/e2e/` | Verificaciones |
| `docs/` | Continuidad, decisiones y entrega |

Usa `src/data` como raíz única del contenido; equivale a la organización `/data/leve`, `/data/picante`, `/data/perverso` solicitada. Añadir cartas no debe requerir modificar el algoritmo.

### 9.4. Persistencia y concurrencia

Guarda sesiones normales en transacciones con `schemaVersion` y `contentVersion`. La escritura debe ser idempotente por turno. Trata errores de cuota, acceso denegado o base dañada sin perder controles de seguridad: ofrece continuar en memoria con aviso claro.

Evita dos pestañas editando la misma sesión a la vez: bloqueo de escritor con expiración y coordinación de pestañas cuando el navegador lo permita. Un segundo acceso muestra «Esta sesión está abierta en otra ventana» y permite tomar control de forma explícita. No uses únicamente un booleano permanente que deje bloqueada la sesión tras un cierre inesperado.

Al migrar datos, valida antes de sustituir. Una versión no soportada muestra recuperación o eliminación; no borres silenciosamente ni reinterpretes límites desconocidos como permiso.

## 10. Privacidad y seguridad de la primera versión

### 10.1. Matriz de almacenamiento

| Información | Normal | Privada |
|---|---|---|
| Alias y límites | IndexedDB tras elegir modo normal | Solo memoria |
| Configuración y progreso | IndexedDB | Solo memoria |
| IDs e historial mínimo de cartas | Local para restaurar | Solo memoria |
| Respuestas, votos y autorías | Solo memoria hasta cierre de ronda | Solo memoria hasta cierre de ronda |
| Favoritas | Local, sin referencias a participantes | Temporales |
| Preferencias reutilizables | Solo si se activa guardar configuración | No persistir |
| Resumen de cierre | Agregado, sin confesiones | Temporal y descartable |

La sesión privada no escribe datos sensibles en IndexedDB, localStorage, sessionStorage, caché, URL o logs. Desactiva para esa sesión cualquier middleware de persistencia y herramientas de desarrollo que serialicen el estado. Que los recursos de la PWA se guarden para offline no significa guardar la sesión.

No dependas de `beforeunload` para borrar: puede no ejecutarse. La privacidad se consigue no persistiendo desde el principio. Al finalizar, limpia stores, referencias a respuestas y pantallas. No prometas borrado forense de memoria, capturas, backups del sistema o rastros controlados por el navegador.

### 10.2. Controles

- Mensaje: «Tus sesiones permanecen en este dispositivo» y explicación de límites reales del almacenamiento local.
- Sin cuentas, perfiles públicos, publicidad, rastreadores ni SDK de analítica.
- No enviar datos de juego a Vercel, logs, reportes de errores o servicios de IA. El hosting puede procesar IP y solicitudes técnicas al entregar la web; no anunciar anonimato de red.
- Recursos y fuentes propios. No incrustar servicios de música; una carta puede sugerir elegir una canción fuera de la app.
- Ocultar contenido al pasar a segundo plano y pausar; al volver, pantalla neutral con Continuar. No garantizar que el sistema nunca capture una miniatura anterior.
- No recordar formularios privados mediante autocomplete; no prometer controlar aprendizaje del teclado del sistema.
- Renderizar entrada como texto. Sin `dangerouslySetInnerHTML`, ejecución de cartas o HTML arbitrario.
- Política de seguridad de contenido y cabeceras compatibles con el build; restringir conexiones y evitar iframes. Probar en producción para no romper la aplicación.
- Sin secretos en `NEXT_PUBLIC_*`, código cliente, Git o documentos. `.env.example` solo si realmente se necesita, con valores ficticios.
- Sin permisos de cámara, micrófono, ubicación o contactos.

### 10.3. Borrar datos

«Eliminar todos mis datos» requiere confirmación por ser destructivo. Después elimina bases locales de TRIO, claves de ajustes, favoritas, sesiones y memoria; informa a otras pestañas para que descarten datos y no vuelvan a escribir una sesión borrada. Cierra conexiones de IndexedDB y gestiona eliminación bloqueada. La caché de recursos públicos puede conservarse para offline y debe explicarse; una opción separada puede restablecer instalación/caché si se implementa.

Prueba que reiniciar, abrir otra pestaña o reactivar una ventana anterior no restaure los datos borrados. No elimines almacenamiento de otras aplicaciones del mismo entorno.

## 11. Plan editorial de 1.000 actividades

### 11.1. Distribución de contenido principal

Esta tabla cuenta cada carta una sola vez por categoría principal. `gameModes` puede permitir usarla en varios juegos sin contarla varias veces.

| Familia editorial | Leve | Picante | Perverso | Total |
|---|---:|---:|---:|---:|
| Preguntas y rompehielos | 85 | 55 | 30 | 170 |
| Retos y desafíos | 65 | 65 | 55 | 185 |
| Conexión y confianza | 45 | 40 | 35 | 120 |
| Música y baile | 40 | 30 | 20 | 90 |
| Dinámicas de dos y tres | 30 | 45 | 45 | 120 |
| Elecciones | 25 | 30 | 30 | 85 |
| Confesiones y secretos | 15 | 35 | 45 | 95 |
| Conocimiento y más probable | 35 | 30 | 20 | 85 |
| Sorpresas | 10 | 20 | 20 | 50 |
| **Total** | **350** | **350** | **300** | **1.000** |

Incluye masajes autorizados dentro de las familias de retos o conexión; ruleta, dados y temporizador son formas de ejecución, no necesitan copiar la misma actividad como nuevos IDs.

### 11.2. Reglas editoriales

Redacta cartas originales, claras y ejecutables sin materiales especiales. Usa una acción central y tiempos razonables. Cada nivel debe tener actividades sin contacto y compatibles con 2 y 3 personas. Cada juego debe disponer de suficientes actividades para no agotarse en una sesión normal; mide esa cobertura.

No aumentes el recuento cambiando solo nombres, tiempos o adjetivos. Las variantes semánticas comparten `familyId`. Evita estereotipos, suponer orientación o roles de género, exigir revelar trauma, involucrar a terceros ausentes, acceder a teléfonos ajenos, compartir imágenes privadas o introducir alcohol como facilitador.

Perverso puede incluir decisiones, confesiones y fantasías conversacionales no gráficas, siempre opcionales. No conviertas «máxima intensidad» en contacto obligatorio o descripción sexual explícita. Usa roles lúdicos como quien dirige la música o propone la siguiente elección, sin autoridad sobre otra persona.

Escribe en lotes de 30–60, valida y revisa antes de integrar. La revisión automática de permisos por palabras clave solo genera alertas; no demuestra que una carta sea segura. Revisa semánticamente texto y metadatos. Marca `reviewed` solo después de esa revisión.

### 11.3. Validador obligatorio

Comprueba IDs únicos, esquemas, intervalos de score, duraciones, placeholders, roles, permisos conocidos, mínimo/máximo, compatibilidad de juego, textos vacíos y efectos permitidos. Produce recuentos por nivel, juego, categoría, cantidad de personas y contacto/no contacto. Detecta duplicados exactos y sugiere similares para revisión.

Si una actividad de contacto carece de permiso correspondiente, corrige metadatos o desactívala; no publiques el lote. `draft` y `disabled` nunca entran al selector de producción. No anuncies 1.000 cartas hasta tener 1.000 actividades activas, revisadas y válidas.

## 12. PWA, offline e instalación

Objetivo: abrir desde Safari en iPhone, añadir a pantalla de inicio y jugar sin conexión después de una primera carga completa. Una instalación inicial sin haber descargado recursos no puede funcionar offline; la UI debe informar cuándo está lista.

### 12.1. Recursos

- Un manifest canónico accesible como `/manifest.json`, con nombre, nombre corto, descripción, `id`, `start_url`, `scope`, colores y `display: standalone`.
- Iconos PNG 192 × 192 y 512 × 512, variante maskable con área segura y Apple touch icon 180 × 180; verificar tamaños y transparencia según uso.
- Metadatos para instalación y color de navegador, favicon y pantalla inicial coherente. No prometer un comportamiento idéntico de splash/fullscreen en todos los sistemas.
- Service worker versionado en producción y registro controlado. No registrar un worker de desarrollo que interfiera con HMR.
- Interfaz de instalación adaptada: usar evento de instalación donde exista; en iPhone mostrar instrucciones manuales, sin fingir un botón nativo de instalación disponible universalmente.

### 12.2. Estrategia offline

Selecciona una estrategia compatible con la versión real de Next.js y verifica el build. Precachea shell, rutas necesarias, CSS, JS, iconos, fuentes y catálogo validado. No basta con guardar `/` y un `offline.html` si el motor o rutas cargan chunks no disponibles.

Considera exportación estática cuando sea compatible con todas las rutas y el despliegue; documenta la decisión y adapta el comando de preview. Si usas App Router sin exportación, comprueba explícitamente recarga profunda y navegación offline, incluidos recursos de navegación del framework. No caches indiscriminadamente toda respuesta del origen ni solicitudes que contengan datos privados.

El indicador «Disponible sin conexión» aparece solo cuando worker, shell y contenido están descargados y verificados. Una respuesta HTML de fallback no debe servirse en lugar de un chunk JS. Prueba desde un contexto nuevo sin caché HTTP previa.

### 12.3. Actualización sin pérdida

Usa versiones de recursos y catálogo. Si existe una actualización mientras hay una sesión, ofrécela al finalizar o pausar; no recargues automáticamente. No elimines recursos todavía necesarios por clientes activos. Coordina varias pestañas antes de activar y limpiar cachés antiguas.

Una sesión restaurada debe validar cartas y versiones; una autorización antigua no sobrevive a un cambio de contenido. Si una carta desapareció, reemplázala por una compatible sin modificar límites. Explica que el navegador puede desalojar almacenamiento y que guardar localmente no equivale a un respaldo permanente.

## 13. Fases de ejecución autónoma y puertas de calidad

Ejecuta en este orden. No preguntes «¿continúo?»; cada puerta se cierra con evidencia. Se permiten ajustes de detalle registrados, pero no eliminar requisitos silenciosamente.

| Fase | Trabajo y entregable | Puerta de salida |
|---|---|---|
| 1. Concepto | Consolidar producto, alcance, nombre, principios y decisiones | Documentos iniciales y requisitos sin contradicción |
| 2. UX | Flujos completos, pantallas, copy y estados de error | 2 y 3 personas recorren todos los pasos en diseño |
| 3. Juegos | Contratos y estados de los 12 modos | Cada juego tiene entrada, acciones, salida y control de consentimiento |
| 4. Motor | Funciones puras de filtrado, asignación, equilibrio e historial | Pruebas de invariantes y simulaciones iniciales pasan |
| 5. Biblioteca | Esquema, validador y 180 cartas iniciales | 60 por nivel revisadas; todos los juegos cubiertos |
| 6. Progresión | Scores, ventanas, reloj y cambios de nivel | No hay ascensos automáticos ni score fuera de rango |
| 7. Consentimiento | Semáforos, confirmaciones, pausa, límites editables | Rojo bloquea; amarillo exige unanimidad; cambios invalidan |
| 8. Diseño | Sistema visual, navegación y mesa móvil | Flujos legibles y controles siempre accesibles |
| 9. Integración | Aplicación Next.js funcional y 12 controladores | Build real y recorridos E2E de los modos |
| 10. Privacidad | Adaptadores memoria/local, ocultación y borrado | Sin persistencia privada ni solicitudes con datos de juego |
| 11. Datos | Recuperación, migraciones, catálogo ampliado | Restauración segura y meta 350/350/300 validada |
| 12. Panel futuro | Contratos de repositorio/editorial y documento de evolución | Añadir una carta o paquete no exige modificar motor |
| 13. Expansiones | Paquetes, cartas propias y Supabase documentados | Interfaces previstas sin servicios ni costes activados |
| 14. PWA | Manifest, iconos, worker, offline, instalación | Pruebas en build de producción y guía iPhone |
| 15. Integración final | Resolver deuda funcional y revisar coherencia | Ningún botón del alcance es decorativo o placeholder |
| 16. Pruebas | Suite final, privacidad, accesibilidad y fallos | Cero fallos conocidos en invariantes de seguridad |
| 17. Publicación | GitHub, Vercel, URL, verificación y manual | Deploy verificado o bloqueo de acceso preciso documentado |

El orden original es un mapa de temas; esta secuencia permite construir las dependencias antes de integrarlas. La planificación de fases 1–3 ocurre antes del código. Las revisiones de cada incremento son internas de Claude, sin aprobación humana rutinaria.

## 14. Estrategia de pruebas y evidencias

No te limites a comprobar que compila. Las pruebas deben capturar riesgos reales del producto. Usa datos ficticios, RNG y reloj controlables. Prueba PWA en producción, no solamente con `npm run dev`.

### 14.1. Motor y consentimiento

1. Con un permiso rojo individual, no se selecciona ninguna asignación que lo requiera para esa persona.
2. Rojo compartido descarta la categoría para toda la sesión.
3. Permiso desconocido, ausente o metadatos inválidos fallan de forma cerrada.
4. Amarillo no inicia actividad con aceptación parcial, cancelación o timeout.
5. Editar límites invalida selección pendiente, cola, temporizador y autorización anterior.
6. Una carta favorita, sorpresa, dado, ruleta o etapa de cadena pasa por los mismos filtros.
7. Nivel y score respetan rango y techo de progresión.
8. Un rechazo al ascenso mantiene nivel; la UI no muestra autoría ni recuento de rechazos.
9. Bajar nivel funciona desde cualquier estado y no necesita unanimidad.
10. Rechazar o pasar no genera penalización ni insistencia de la misma familia.
11. Cooldown se respeta; agotamiento no produce bucle infinito ni filtro relajado.
12. Doble toque, eventos atrasados y respuestas con versión antigua son idempotentes o descartados.

### 14.2. Equilibrio y variedad

Simula al menos 100 semillas de 200 oportunidades con 2 y 3 personas, usando un catálogo sintético donde todas las combinaciones sean igualmente elegibles. Comprueba la espera máxima de 3 turnos cuando existe oportunidad individual compatible y reparto de oportunidades coherente. Para pares dirigidos/no dirigidos con igual elegibilidad, define una tolerancia explícita de dispersión y corrige sesgos; no afirmes equilibrio basado en una única ejecución.

Después simula límites asimétricos y verifica que el motor prioriza seguridad, encuentra participación alternativa y no se atasca. Las estadísticas no deben comparar como fallo combinaciones imposibles. Guarda informes agregados sin datos reales.

### 14.3. Privacidad y persistencia

- Inspecciona requests durante creación, juego, votos y secretos: ningún payload, URL o cabecera de app contiene alias, respuestas o límites.
- En sesión privada, intercepta escrituras de IndexedDB y Web Storage: cero datos de sesión. Comprueba terminar, recargar, cerrar y volver.
- En sesión normal, restaura progreso y límites; nunca restaura respuestas de una ronda ni una autorización ya interrumpida.
- Borrar datos funciona con varias pestañas, evita reescrituras antiguas y confirma eliminación real.
- Error de cuota, base dañada, migración desconocida y almacenamiento no disponible muestran salida segura.
- Revisión de logs de desarrollo/producción para detectar exposición accidental.

### 14.4. Interfaz, juegos y PWA

- E2E: crear sesiones de 2 y 3, completar cada modo, pasar, cambiar, pausar, detener y finalizar.
- Votos empatados, abstención, retiro de un secreto y cancelación de cadena.
- Temporizadores con pausa, segundo plano, reanudación y eventos antiguos.
- Viewports 320, 375, 390 y 430 px, orientación horizontal y teclado abierto.
- Navegación por teclado, foco de modales, lector de pantalla donde esté disponible y movimiento reducido.
- Primera descarga, disponibilidad offline, cerrar y reabrir sin red, acceso directo a ruta y carga de catálogo completo.
- Actualización con sesión activa y con dos pestañas; no perder datos ni servir mezcla incompatible de versiones.
- Manifest e iconos accesibles, scope correcto y worker sin errores en HTTPS.
- Chromium y WebKit automatizados cuando estén disponibles. La emulación de WebKit no sustituye un iPhone real; registra esa prueba como pendiente si no tienes dispositivo.

### 14.5. Comandos que debes implementar

`npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run content:validate` y `npm run content:report`.

Cada comando debe existir y funcionar con la arquitectura elegida. `preview` sirve el build de producción, sea servidor Next.js o exportación estática; documenta la implementación real. Usa el lint compatible con la versión instalada, sin asumir que un comando histórico del framework todavía existe.

CI: instalación con lockfile, tipos, lint, catálogo, pruebas unitarias/integración y build. Añade E2E críticos en un entorno compatible. No desactives pruebas, reglas o filtros para conseguir verde. Registra limitaciones reales de CI sin presentar pruebas no ejecutadas como aprobadas.

## 15. GitHub, Vercel e instalación en iPhone

Esta sección define el procedimiento objetivo. Al ejecutarlo, verifica interfaces y comandos vigentes en documentación oficial y adapta `docs/DESPLIEGUE.md` a lo que realmente se hizo.

### 15.1. Ejecución local

1. Instala o verifica la versión de Node fijada para el proyecto.
2. Desde el repositorio, ejecuta `npm ci`.
3. Ejecuta `npm run dev` y usa la URL local que muestre la terminal.
4. Para verificar producción: `npm run build` y `npm run preview`.
5. No confundas una IP HTTP de la red local con un origen HTTPS válido para probar todas las funciones PWA. Usa el despliegue HTTPS para la instalación móvil final.

Claude debe ejecutar estos pasos, corregir errores y registrar los comandos comprobados; no limitarse a explicarlos.

### 15.2. GitHub

1. Inspecciona Git y remotos; no reemplaces un remoto existente sin entenderlo.
2. Asegura `.gitignore` para dependencias, builds, secretos, resultados temporales y datos personales.
3. Revisa el diff y crea commits de avances coherentes. No hagas force-push ni reescribas historial ajeno.
4. Si existe autenticación y cuenta inequívoca, crea `trio-pwa` privado o reutiliza el repositorio explícitamente destinado a este trabajo. No sobrescribas un repositorio homónimo no relacionado.
5. Sube la rama de trabajo/final según el flujo existente. En un proyecto nuevo puedes usar `main`.
6. Registra URL y commit. Si falta acceso, deja repo y commits locales listos y solicita únicamente la autorización oficial necesaria.

### 15.3. Vercel

1. Comprueba cuenta/equipo y proyecto existente. Reutiliza el vinculado; no crees duplicados en reintentos.
2. Importa el repositorio o usa la CLI autenticada disponible. Configura raíz, versión de Node y build reales. La app base no necesita secretos de servidor.
3. Genera preview y comprueba flujos críticos, manifest, worker, HTTPS y consola de producción.
4. Si las pruebas pasan, publica en producción usando la autorización de este encargo y las reglas de las herramientas. No hace falta una confirmación adicional rutinaria; sí detenerse ante gastos o un cambio de audiencia de infraestructura existente no autorizado.
5. Si el proveedor exige un paso humano, documenta exactamente cuál. No intentes eludir controles de acceso.
6. Verifica que la URL final responde y corresponde al commit probado. No inventes una URL ni declares éxito con un despliegue todavía en construcción.

Los despliegues de ramas y la producción deben distinguirse. No prometas que una URL de preview es privada por ser preview. No cambies protecciones de un proyecto existente sin permiso.

### 15.4. iPhone

Entrega instrucciones breves con la URL real:

1. Abrir la URL en Safari.
2. Esperar el indicador de disponibilidad sin conexión.
3. Abrir el menú Compartir y elegir Añadir a pantalla de inicio.
4. Si aparece Abrir como app web, activarlo; confirmar Añadir.
5. Abrir TRIO desde el icono y crear una sesión de prueba.
6. Comprobar una sesión sin conexión después de haber cargado todos los recursos.

Los nombres exactos pueden variar con iOS. No necesitas App Store ni perfil de desarrollador para este flujo web. Si no puedes manipular el teléfono, pide únicamente esa comprobación final y no la marques realizada.

### 15.5. Actualizaciones

Documenta: editar contenido/código, validar, probar, build, commit y push; verificar el despliegue del commit; aceptar actualización dentro de la app en un punto seguro. Explica cómo volver a un despliegue anterior desde Vercel si una versión falla y cómo manejar cambios de datos sin destruir sesiones. Una reversión de código no revierte automáticamente datos migrados: mantener compatibilidad o documentar limitación.

No cambies de dominio sin advertir que el almacenamiento local pertenece al origen y no se trasladará automáticamente.

## 16. Preparación para panel, Supabase y monetización

Define interfaces de repositorio para leer/escribir actividades y paquetes, con validación, versionado y estados editoriales. El catálogo local implementa la lectura; un futuro panel podrá crear, editar, desactivar, cambiar intensidad/categoría y marcar premium. La eliminación debe preservar IDs usados por versiones anteriores o manejar referencias huérfanas de forma segura.

Supabase solo se diseña conceptualmente. Si se introduce en otra fase, requerirá migraciones, autenticación, reglas de acceso y consentimiento específico antes de sincronizar información. No crear un backend sin usar ni enviar datos «por si acaso».

Paquetes previstos: Parejas, Trío, Primera vez, Fiesta, Preguntas, Retos, Picante, Perverso y Personalizado. Las cartas propias futuras usarán el mismo esquema; nunca podrán ejecutar JavaScript o eludir límites. Los datos importados se validarán y tratarán como no confiables.

Monetización futura: paquetes de contenido y temas visuales. Sin publicidad invasiva ni comercialización de datos personales. Seguridad, consentimiento, borrado y accesibilidad nunca estarán detrás de un pago. No implementar cobros en esta entrega.

## 17. Definición de terminado y entrega final

La aplicación está terminada cuando:

- Los 12 juegos funcionan con mecánicas reales.
- 2 y 3 adultos pueden crear, jugar y finalizar una sesión completa.
- Los tres niveles se diferencian y respetan permisos, progresión y cambios autorizados.
- El motor tiene pruebas de filtrado, asignación, cooldown, variedad y equilibrio.
- Hay 1.000 actividades revisadas y validadas en la distribución prevista, o se informa explícitamente una beta con recuento real y pendiente editorial.
- Los controles de pasar/cambiar/pausar/detener funcionan en todos los estados relevantes.
- Sesión normal recupera desde un punto seguro; sesión privada no persiste datos personales.
- Borrado elimina los datos de la app y previene reescritura desde otras pestañas.
- Build, tipos, lint, pruebas críticas y validador de catálogo pasan.
- Offline y actualización están probados en producción, sin confundir emulación con dispositivo real.
- El repositorio y despliegue corresponden al código verificado, o se indica el único bloqueo externo pendiente sin fingir publicación.
- Existe documentación para operar, añadir cartas, actualizar, restaurar y continuar trabajo.

Entrega al propietario, sin saturarlo con detalles:

1. URL de la aplicación y del repositorio, si existen.
2. Funciones disponibles y número real de cartas por nivel.
3. Resultado resumido de pruebas y cualquier limitación material.
4. Pasos exactos de instalación en su iPhone.
5. Cómo actualizar y dónde están los documentos de continuidad.
6. Una sola lista de acciones humanas pendientes, únicamente si son imprescindibles.

No cierres con «puedo continuar si quieres» si aún puedes completar trabajo autorizado. No clasifiques como completo algo que solo diseñaste. El objetivo es una aplicación utilizable, no una presentación del concepto.

## 18. Documentación oficial de referencia

Referencias consultadas para el plan el 6 de octubre de 2026. Claude debe comprobarlas otra vez al implementar, porque versiones y procedimientos pueden cambiar. Las reglas de producto, modelos y algoritmos de este documento son decisiones de diseño propias, no requisitos atribuidos a estas fuentes.

- [Next.js: Progressive Web Apps](https://nextjs.org/docs/app/guides/progressive-web-apps): manifest, instalación y orientación PWA. Esta guía no sustituye diseñar y probar el almacenamiento offline de la aplicación.
- [Next.js: documentación](https://nextjs.org/docs): compatibilidad, estructura, build y APIs reales de la versión instalada.
- [Apple: convertir un sitio web en una app en Safari en el iPhone](https://support.apple.com/es-co/guide/iphone/iphea86e5236/ios): flujo de Añadir a pantalla de inicio.
- [Vercel: desplegar proyectos de GitHub](https://vercel.com/docs/git/vercel-for-github): integración del repositorio y despliegues.
- [Vercel: despliegues](https://vercel.com/docs/deployments): estado y operación de despliegues.

## 19. Primera acción que debes realizar al recibir este archivo

Comprueba tus capacidades de ejecución y el directorio de trabajo. Lee las instrucciones existentes, crea los documentos de continuidad, registra las decisiones predeterminadas y comienza las fases 1–3. Una vez definidos modelos y flujos, implementa el motor con pruebas y continúa automáticamente hasta publicación o hasta encontrar un bloqueo externo real. Mantén este documento como especificación de referencia y evita pedir a la persona propietaria que repita requisitos ya incluidos aquí.

**Fin del plan maestro.**
