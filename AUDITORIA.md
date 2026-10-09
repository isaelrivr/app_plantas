# Auditoría técnica de Plantae

Fecha: 9 de octubre de 2026  
Alcance: `screens/`, `components/`, `context/`, `hooks/`, `services/`, `navigation/`, `theme/`, `functions/src/` y `firestore.rules`.

## Estado general

El proyecto ya tiene estructura de app móvil y varios flujos implementados, pero todavía es un prototipo y **no está listo para publicarse**. Hay compras simuladas, un asistente local de demostración, catálogo de hábitat local y ausencia de autenticación/sincronización. Los límites locales y el `X-Device-Id` no equivalen a una identidad protegida.

Se corrigió en esta fase el borrado local: vacía jardín, habitaciones, estadísticas, diario, imágenes locales, preferencia Pro y ajustes en memoria y almacenamiento. Antes, podía dejar habitaciones/estadísticas y estado premium vivos en los providers, y una acción posterior podía volver a escribir parte de los datos. La eliminación sigue siendo **solo del dispositivo** porque la app no tiene autenticación ni una cuenta remota que borrar.

## Hallazgos priorizados

### P0 — bloquean una publicación confiable

1. **Compras y acceso Pro son ficticios.** `services/billingService.ts` simula compra/restauración/cancelación y `context/PremiumContext.tsx` aplica un entitlement local. No se puede cobrar, verificar renovación ni restaurar compras de tienda. No publicar un paywall que prometa una suscripción real hasta integrar y validar RevenueCat. (Fase 3.)
2. **Identificación, salud y cuidados no tienen garantía de proveedor real configurado.** El cliente tiene fallback mock en desarrollo (`services/apiClient.ts`, `services/plantApi.ts`, `services/healthService.ts`) y Cloud Functions (`functions/src/`), pero requieren secretos/configuración del proyecto Firebase y de Plant.id/Gemini. La disponibilidad de endpoints y credenciales reales no se puede verificar en este repositorio. Mantener claro al usuario cuándo la respuesta es simulada.
3. **El asistente es mock y no existe su endpoint en las Cloud Functions.** `services/assistantService.ts` fija `USE_REMOTE_ASSISTANT = false`; el endpoint que contiene no corresponde a una función exportada en `functions/src/index.ts`. Afirmar que responde con IA real sería engañoso. (Fase 2.)
4. **No hay autenticación/sincronización.** `services/firebase.ts` exporta `isFirebaseConfigured = false`; la configuración son placeholders y `firestore.rules` deniega todo acceso de cliente. Los datos son locales y no se restauran en otro dispositivo. (Fase 1 opcional.)

### P1 — afectan datos, límites o confianza

1. **El contador local Free puede quedar obsoleto al cambiar de día.** `context/GardenContext.tsx` hidrata `identificationsToday` guardado sin comparar `lastIdentificationDate` con la fecha actual. `hooks/usePlanLimits.ts` usa ese contador directamente, así que puede bloquear el cupo nuevo hasta que se registre otra identificación. Debe normalizarse al hidratar y al volver la app a primer plano.
2. **Esquema persistido insuficientemente validado.** `services/storage.ts` tiene versión 1 pero no transforma datos en la migración v0→v1; `loadJSON` solo atrapa JSON inválido, no valida la forma de objetos parseados. Un JSON válido pero con campos inesperados puede dejar el estado incoherente. También se tragan errores de escritura/borrado, lo que impide a la UI distinguir éxito de fallo.
3. **No se limpia el diario de crecimiento asociado al borrar una planta.** `GardenContext.removePlant` elimina solo el registro del jardín; las entradas permanecen en `growth-diary` y sus fotos ocupan espacio. Hace falta decidir y ejecutar la política de cascada en Fase 1.
4. **Fotos huérfanas no se reconcilian.** `services/mediaService.ts` copia imágenes persistentes y puede borrar el directorio completo, pero no compara archivos con las URIs referenciadas al iniciar ni elimina huérfanos tras reemplazar/eliminar plantas o entradas. Además, ante fallo de copia devuelve URI temporal, que puede caducar.
5. **La cuota de servidor por dispositivo es falsificable y no atómica.** `functions/src/guard.ts` admite `X-Device-Id` sin login; se puede generar otro ID. `functions/src/rateLimit.ts` hace lectura y escritura separadas en Firestore, por lo que peticiones concurrentes pueden sobrepasar el cupo. El fallback en memoria no persiste entre instancias. Se necesita identidad verificada y transacción/contador atómico antes de confiar en límites de pago.
6. **Clima sin timeout ni caché.** `services/weatherService.ts` llama a ubicación y Open-Meteo sin timeout ni caché; el fallback siempre muestra datos fijos de Ciudad de México cuando se niega permiso o falla la red y no ofrece selección manual de ciudad. Puede tardar o presentar el fallback como si fuera el clima actual.
7. **Hábitat es un catálogo estático, no una fuente actualizada.** `services/habitatService.ts` tiene datos locales y devuelve el hábitat de Monstera ante un ID desconocido; no diferencia especie desconocida de especie con ese hábitat. No hay caché remota de GBIF.
8. **El borrado no borra una cuenta remota.** No existe cuenta implementada. Se cambió el rótulo para decir explícitamente que se eliminan datos del dispositivo; el borrado remoto requerirá autenticación y un flujo servidor.

### P2 — calidad, accesibilidad y mantenimiento

1. **Listas con catálogo usan `ScrollView`.** `screens/EncyclopediaScreen.tsx` renderiza resultados dentro de un `ScrollView`; con catálogo grande carga/monta todos los elementos y puede degradar memoria/scroll. Evaluar `FlatList` con claves estables y virtualización.
2. **Cobertura de accesibilidad inconsistente.** Componentes base como `Button` tienen rol/label, pero hay controles táctiles secundarios en pantallas con labels/roles ausentes o incompletos (por ejemplo, borrar búsqueda en Enciclopedia y controles de la pantalla de mapa). Auditar todas las acciones con lector de pantalla, tamaño táctil y fuentes grandes.
3. **Textos y datos de ejemplo siguen hardcodeados.** Hay textos de clima/fallback en `services/weatherService.ts`, textos de dominio en servicios, datos iniciales y copys de demostración. Aunque existe i18n es/en, hay que comprobar cobertura de claves y formatos (fechas, pluralización, accesibilidad) y no construir estado persistente con textos ya traducidos.
4. **Código/funciones de demostración y dead code.** `components/PremiumBanner.tsx` no tiene usos en `screens/`; hay helpers de demo y mocks en servicios. Inventariar y eliminar lo no usado o restringirlo a `__DEV__` de forma verificable antes de distribución.
5. **ErrorBoundary sin reporte remoto.** `components/ErrorBoundary.tsx` evita caída completa y registra en consola, pero no hay integración de crash reporting ni flujo de recuperación para todos los errores asíncronos.
6. **Faltan pruebas automatizadas.** `package.json` no define `test`/`typecheck`; no hay pruebas unitarias/de componentes ni CI en el alcance revisado.
7. **Comentario obsoleto.** `context/SettingsContext.tsx` describe la persistencia como mock/en memoria aunque ya usa `services/storage.ts` y AsyncStorage.

## Inventario de mock vs. real

| Área | Estado encontrado |
|---|---|
| Jardín, ajustes, premium local, diario | AsyncStorage para datos locales; sin cuenta/sync. |
| Fotos | Copia a `expo-file-system` en el flujo principal; falta reconciliación de huérfanos y garantía si falla la copia. |
| Identificación | Cloud Function y proveedor Plant.id presentes; requieren endpoint/secretos; mock habilitado solo en desarrollo. |
| Diagnóstico | Cloud Function/Plant.id+Gemini presentes; requiere configuración; catálogo de demostración local. |
| Fichas de cuidados | Cloud Function/Gemini con caché Firestore; fallback de plantilla local. |
| Asistente | Mock heurístico local; función remota no implementada. |
| Clima | Open-Meteo real, permiso de ubicación, fallback fijo; sin timeout/caché/ciudad manual. |
| Hábitat | Dataset estático local con retardo simulado; no GBIF. |
| Suscripciones | Completamente mock, sin RevenueCat ni productos de tienda. |
| Firestore/Auth | SDK cliente no conectado; reglas niegan acceso directo. Functions usan Admin SDK y aceptan device ID. |

## Corrección crítica realizada en Fase 0

El flujo de “Eliminar cuenta y datos” ahora vacía también habitaciones y estadísticas del estado de jardín, desactiva el entitlement local sin invocar una cancelación de suscripción simulada, y limpia diario, fotos persistentes y preferencias. El borrado no equivale a eliminar una cuenta remota; la app aún no tiene autenticación.

## Verificación

- `npx tsc --noEmit`: correcto.
- `npx expo lint`: correcto.
- `npx expo export --platform android --no-bytecode`: correcto.
- `npx expo export --platform ios --no-bytecode`: correcto.
- `npx expo-doctor`: no se pudo completar porque el entorno no pudo acceder a `registry.npmjs.org` (DNS `ENOTFOUND`).

La auditoría estática no sustituye pruebas en dispositivo, revisión de políticas de las tiendas ni verificación de las cuentas/servicios externos.
