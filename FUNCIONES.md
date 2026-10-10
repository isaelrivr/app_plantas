# Inventario funcional de Plantae

Leyenda: `Sí` significa que existe en el código; `Completa` significa que el flujo tiene estados principales y no es solo una pantalla decorativa. `Probada` solo se marca cuando hay evidencia ejecutable en este entorno.

| Función | Pantalla/archivo | ¿Existe? | ¿Completa? | ¿Real o mock? | ¿Probada? | Problemas / evidencia |
|---|---|---:|---:|---|---:|---|
| Onboarding de 3 páginas y primera apertura | `OnboardingScreen.tsx`, `SettingsContext.tsx` | Sí | Sí | Local real | Parcial | Persistencia y navegación verificadas por typecheck/export; avance visual requiere dispositivo. |
| Escáner cámara/galería | `ScannerScreen.tsx` | Sí | Sí | Cámara real; fallback local | Parcial | Permisos y cámara requieren dispositivo. |
| Identificación IA y lote multi-foto | `plantApi.ts`, `functions/src/identify.ts` | Sí | Sí | Cloud Function + fallback mock | Sí (compilación) | Proveedor real requiere credenciales y despliegue. |
| Límite Free de identificaciones | `usePlanLimits.ts`, `GardenContext.tsx` | Sí | Sí | Local + cuota backend | Sí (typecheck; lógica revisada) | Prueba interactiva pendiente. |
| Jardín y habitaciones | `GardenScreen.tsx`, `GardenContext.tsx` | Sí | Sí | Local persistente | Sí (exportación) | Prueba táctil pendiente. |
| Clima y recomendaciones | `weatherService.ts` | Sí | Sí | Open-Meteo + caché/fallback | Sí (compilación) | GPS/red requieren dispositivo. |
| Ficha botánica y pestañas | `PlantDetailScreen.tsx` | Sí | Sí | Catálogo local + backend | Sí (exportación) | Proveedor remoto requiere credenciales. |
| Toxicidad mascotas/niños | `toxicityService.ts`, `ToxicityBadge.tsx` | Sí | Sí | Catálogo local | Sí (compilación) | Sin bloqueo conocido. |
| Mapa de hábitat y gating Pro | `HabitatMapScreen.tsx`, `habitatService.ts` | Sí | Sí | Dataset local; gating local | Sí (exportación) | GBIF remoto aún no integrado. |
| Diagnóstico foliar | `HealthDiagnosisScreen.tsx`, `healthService.ts` | Sí | Sí | Cloud Function + fallback mock | Parcial | Cámara/permisos/IA real requieren dispositivo y credenciales. |
| Calendario de cuidados | `CareCalendarScreen.tsx` | Sí | Parcial | Datos de jardín locales | Sí (typecheck) | Completar, eliminar y notificar implementados; edición libre de título/fecha aún no tiene editor dedicado. |
| Notificaciones locales | `notificationService.ts` | Sí | Sí | Expo Notifications real | No | Permiso, canal y entrega deben probarse en Android/iOS. |
| Diario y comparador | `GrowthDiaryScreen.tsx`, `growthDiaryService.ts` | Sí | Sí | AsyncStorage + archivos locales | Parcial | Selector de fotos requiere dispositivo. |
| Asistente botánico | `AssistantScreen.tsx`, `assistantService.ts`, `functions/src/assistant.ts` | Sí | Sí | Gemini remoto opcional + heurística local | Sí (typecheck) | Endpoint requiere despliegue/clave; fallback local disponible. |
| Enciclopedia y filtros combinados | `EncyclopediaScreen.tsx`, `encyclopediaService.ts` | Sí | Sí | Catálogo local offline-first | Sí (typecheck) | Render usa ScrollView y debe probarse con lista larga. |
| Gamificación y logros | `AchievementsScreen.tsx`, `gamificationService.ts` | Sí | Parcial | Calculada desde estadísticas locales | Sí (compilación) | Los logros se calculan, pero no existe un registro persistido independiente de desbloqueos/fecha. |
| Perfil y navegación secundaria | `ProfileScreen.tsx`, `AppNavigator.tsx` | Sí | Sí | Local | Sí (exportación) | Navegación táctil requiere dispositivo. |
| Paywall y gating Free/Pro | `PaywallScreen.tsx`, `PremiumContext.tsx` | Sí | Parcial | Billing mock; Pro local solo desarrollo | Sí (typecheck) | RevenueCat no conectado. |
| Ajustes, idioma, tema y borrado local | `SettingsScreen.tsx`, `SettingsContext.tsx` | Sí | Sí | Local persistente | Sí (typecheck/export) | Borrado remoto no existe porque no hay Auth. |
| Persistencia y migraciones | `services/storage.ts` | Sí | Sí | AsyncStorage real | Sí (test smoke + typecheck) | Migraciones futuras necesitan validadores específicos por modelo. |
| Navegación y rutas | `navigation/AppNavigator.tsx` | Sí | Sí | React Navigation 7 | Sí (exportación) | Flujos completos requieren prueba manual. |

## Problemas encontrados durante el inventario

- La edición libre de tareas del calendario no tenía UI; se dejó eliminación persistente y se documenta la edición como pendiente.
- El historial de logros se recalcula desde estadísticas, pero no conserva una colección propia de `unlockedAt`.
- Billing, GBIF y Firebase Auth/sincronización requieren servicios externos y no se deben simular como producción.
- No se encontraron marcadores de conflicto, `TODO` de ejecución, `lorem` ni botones con `onPress` vacío en el alcance revisado.

## Evidencia automatizada

- `npm run typecheck`: correcto.
- `npx expo lint`: correcto.
- `npm test`: correcto; smoke test de scripts.
- `npm run typecheck` dentro de `functions/`: correcto.
- `npx expo export --platform android --no-bytecode`: correcto.
- `npx expo export --platform ios --no-bytecode`: correcto.
- `npx expo-doctor`: no verificable cuando el registro npm no resuelve por DNS.
