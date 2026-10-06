# Evolución prevista (fuera de la primera versión)

## Panel editorial
`src/domain/content/repository.ts` define `CatalogReader` (implementado por `LocalCatalogRepository`) y `CatalogWriter` (futuro). Un panel podrá crear, editar, desactivar, cambiar intensidad/categoría y marcar premium. Reglas: nunca reciclar IDs; desactivar en lugar de borrar; subir `contentVersion`; solo `reviewed` llega a producción. Añadir una carta o paquete no requiere tocar el motor.

## Paquetes y cartas propias
Paquetes previstos: Parejas, Trío, Primera vez, Fiesta, Preguntas, Retos, Picante, Perverso y Personalizado (`ContentPack`). Las cartas propias usarán el mismo esquema y `validateImportedPack`: datos no confiables, entran como borrador, sin código ejecutable, sin eludir límites.

## Supabase (solo conceptual)
Requeriría migraciones, autenticación, reglas de acceso (RLS) y un consentimiento específico antes de sincronizar cualquier dato. No se ha instalado ningún SDK ni se envía información. Alias, límites y respuestas seguirían siendo locales salvo decisión explícita.

## Monetización
Solo paquetes de contenido y temas visuales. Sin publicidad invasiva ni venta de datos. Seguridad, consentimiento, borrado y accesibilidad nunca detrás de un pago. Sin cobros en esta versión.
