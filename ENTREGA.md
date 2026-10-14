# Plantae — Documento de Entrega

Aplicación móvil **Expo / React Native** para el cuidado de plantas: escáner por IA, enciclopedia, mapa de hábitat, diario de crecimiento, asistente botánico, gamificación, límites Free/Pro y suscripción.

**Stack**: Expo SDK 57 · React Native 0.86.3 · React 19.2.3 · React Navigation 7 · TypeScript (estricto) · ESLint (`eslint-config-expo`) · React Compiler habilitado.

---

## Cómo probar la app

```bash
npx expo start          # abre Metro; escanea el QR con Expo Go
npx expo start --android
```

El primer arranque muestra el **Onboarding** (3 páginas). Al completarlo se entra al Jardín con plantas de ejemplo.

### Flujo de prueba recomendado
1. **Escáner** (pestaña central): permite 3 identificaciones gratis al día. Al acumular 2+ fotos se guarda el **lote** con un solo botón. Al exceder el límite free ofrece ver el Paywall.
2. **Enciclopedia**: busca y filtra por luz, dificultad, interior/exterior y mascotas. Abre una ficha (con escudo de toxicidad). El toggle *"Mis plantas"* muestra sólo lo guardado.
3. **Ficha botánica**: pestañas Resumen/Cuidados/Hábitat/Problemas. Escudo y panel de **toxicidad** para mascotas, botón de **Diario de crecimiento**, mapa mundial (Pro).
4. **Perfil → Pro**: abre el **Paywall** (planes mensual/anual, trial 7 días, restaurar compras). Activa Pro y vuelve al mapa o diagnóstico de plagas para desbloquear.
5. **Ajustes**: tema claro/oscuro/sistema, idioma, notificaciones, reintroducción y borrado de datos.

---

## Comandos de verificación

```bash
npx tsc --noEmit            # typecheck estricto → 0 errores
npx expo lint               # ESLint  → 0 problemas
npx expo export --platform android   # bundle de producción → OK
npx expo-doctor             # diagnósticos de configuración
```

---

## Cobertura por fases

### FASE 1 — Escáner y Mi Jardín
| Punto | Dónde |
|---|---|
| 1. Escáner por IA (cámara/galería, 12 especies) | `screens/ScannerScreen.tsx`, `services/plantApi.ts` |
| 2. Mi Jardín con clima premium | `screens/GardenScreen.tsx`, `services/weatherService.ts` |
| 3. Almacenamiento local persistente | `context/GardenContext.tsx`, `services/storage.ts` |

### FASE 2 — Fichas, mapa y diagnóstico
| Punto | Dónde |
|---|---|
| 4. Ficha botánica con ConfidenceRing | `screens/PlantDetailScreen.tsx` |
| 5. Mapa mundial (TopoJSON + d3-geo) | `screens/HabitatMapScreen.tsx`, `services/habitatService.ts` |
| 6. Diagnóstico de salud foliar | `screens/HealthDiagnosisScreen.tsx`, `services/healthService.ts` |
| 7. Calendario de cuidados real | `screens/CareCalendarScreen.tsx`, `services/notificationService.ts` |
| 8. Perfil | `screens/ProfileScreen.tsx` |

### FASE 3 — Contenido y valor (apartados 9–14)
| Punto | Dónde |
|---|---|
| 9. Diario de crecimiento antes/después | `screens/GrowthDiaryScreen.tsx`, `services/growthDiaryService.ts`, `components/BeforeAfterSlider.tsx` |
| 10. Toxicidad para mascotas y niños | `components/ToxicityBadge.tsx`, `services/toxicityService.ts` |
| 11. Asistente botánico | `screens/AssistantScreen.tsx`, `services/assistantService.ts`, `components/ChatBubble.tsx` |
| 12. Enciclopedia con filtros | `screens/EncyclopediaScreen.tsx`, `services/encyclopediaService.ts`, `components/FilterChip.tsx` |
| 13. Gamificación y logros | `screens/AchievementsScreen.tsx`, `services/gamificationService.ts`, `components/AchievementCard.tsx` |
| 14. Escáner multi-plantas + zonas | `context/GardenContext.tsx` (habitaciones), `ScannerScreen.tsx` (lotes) |

### FASE 4 — Rediseño de pantallas clave y arquitectura limpia
| Pantalla / Componente | Cambios y mejoras realizadas |
|---|---|
| **4.1 Onboarding** (`screens/OnboardingScreen.tsx`) | Rediseñado a 3 pasos claros: Selector de idioma accesible, personalización según objetivo ("¿Qué quieres lograr?": identificar / recordar riego / curar planta), y resumen de valor. Botón "Omitir" siempre visible. Cero permisos solicitados prematuramente. |
| **4.2 Hoy** (`screens/TodayScreen.tsx`) | Saludo personalizado con frase motivacional según el objetivo del usuario. Tarjetas grandes de tareas del día con botón "Ya la regué" y deshacer durante 5s. Estado vacío enorme con escáner o búsqueda por nombre. Clima en una sola línea sin jerga técnica. Racha visible. |
| **4.3 Mi Jardín** (`screens/GardenScreen.tsx`) | Tarjetas de planta grandes con foto, nombre común, pastilla de estado clara (`StatusPill`), riego rápido con deshacer y menú "⋯" accesible (`PlantActionSheet`). Botón flotante "+ Añadir planta" que abre `AddPlantModal` (Escanear, Buscar en catálogo o Escribir nombre). |
| **4.4 Escanear** (`screens/ScannerScreen.tsx`) | Botón central de obturador enorme (82dp), galería a la izquierda y controles de flash/cámara a la derecha. Ayuda contextual en una línea con modal visual ("Buena vs Mala foto"). Ficha de resultado simplificada con nombre común destacado, certeza en palabras y 2 botones principales. |
| **4.5 Ficha de planta** (`screens/PlantDetailScreen.tsx`) | Bloque destacado "Qué hacer hoy" antes de detalles técnicos. Banner de toxicidad para mascotas y niños en cabecera. Revelación progresiva con pestañas claras "Cuidados" y "Más información" (`SegmentedControl`). |
| **4.6 Enciclopedia** (`screens/EncyclopediaScreen.tsx`) | Migración de ScrollView a `FlatList` virtualizada. Barra de búsqueda permanente tolerante a tildes y mayúsculas (`normalizeDiacritics`). Filtros accesibles en BottomSheet con contador activo y botón de limpiar. |
| **4.7 Calendario** (`screens/CareCalendarScreen.tsx`) | Vista por defecto "Esta semana" con días claros y alternador a "Mes completo". Marcado rápido con 5s de deshacer. Modal para editar tareas (`EditCareTaskModal`): nombre, próxima fecha y frecuencia de repetición. |
| **4.8 Perfil y Ajustes** (`ProfileScreen.tsx`, `SettingsScreen.tsx`) | Eliminada fila técnica de base de datos en Perfil. Ajustes agrupados en 8 secciones limpias: Modo fácil, Apariencia, Idioma, Notificaciones con horario de aviso, Plan, Privacidad y datos (con exportación de jardín en JSON), Ayuda y contacto con enlace por correo, y Acerca de sin jerga. |
| **4.9 Paywall** (`screens/PaywallScreen.tsx`) | 4 viñetas honestas sin falsas promesas. Precio transparente anual/mensual con desglose y prueba de 7 días. Claridad de cancelación ("Cancela cuando quieras"). Enlaces reales a Términos y Privacidad. Restaurar compras visible con feedback claro. |

---

## Inventario de archivos nuevos/reescritos (FASE 3–4)

| Tipo | Archivos |
|---|---|
| Servicios | `billingService.ts`, `toxicityService.ts`, `growthDiaryService.ts`, `assistantService.ts`, `encyclopediaService.ts`, `gamificationService.ts` |
| Contextos | `SettingsContext.tsx` (nuevo), `PremiumContext.tsx`, `GardenContext.tsx` (reescritos) |
| Hook | `hooks/usePlanLimits.ts` |
| Componentes | `ToxicityBadge.tsx`, `LockedPreview.tsx`, `BeforeAfterSlider.tsx`, `ChatBubble.tsx`, `AchievementCard.tsx`, `FilterChip.tsx` |
| Pantallas | `GrowthDiary`, `Assistant`, `Encyclopedia`, `Achievements`, `Paywall`, `Onboarding`, `Settings` |
| Navegación | `navigation/AppNavigator.tsx`, `App.tsx` (providers + RootGate) |
| Tema | `theme/motion.ts` (nuevo), `theme/useTheme.ts` → `SettingsContext`, `theme/index.ts` |

---

## Mock vs Real (de dónde viene cada dato)

| Dato | Hoy (mock) | Producción (documentado en el código) |
|---|---|---|
| Identificación de especies (escáner) | Base local de 12 plantas con lógica de coincidencia | Cloud Function IA (Google Cloud) + GBIF para metadatos |
| Diagnóstico de salud / plagas | Catálogo local por síntomas | Cloud Function IA (Cloud Vision + LLM) |
| Hábitat mundial | `services/habitatService.ts` (regiones por especie) | GBIF occurrence API vía Cloud Function |
| Asistente botánico | Heurísticas locales como fallback | Cloud Function `assistantChat` (Firebase), activable con variable de entorno |
| Clima | `weatherService.ts` (mock con variación diaria) | Open-Meteo API gratuita vía Cloud Function |
| Suscripciones | `billingService.ts` (latencia simulada, trial 7 días, `plantae_premium_*`) | RevenueCat (productIds ya definidos) |
| Persistencia | En memoria (Context) | Firestore + AsyncStorage (`services/firebase.ts` listo) |

---

## Estado real y limitaciones conocidas

- **Persistencia local**: jardín, estadísticas, ajustes, diario y premium local se guardan con AsyncStorage; las fotos locales se copian a `expo-file-system`. Firebase Auth y sincronización entre dispositivos aún no están conectados.
- **Modo Pro**: el adaptador de billing sigue siendo local y no verifica compras con RevenueCat. El botón de activación directa solo funciona en desarrollo.
- **Expo**: para usar IA real se necesita desplegar las Cloud Functions y encender `EXPO_PUBLIC_USE_REMOTE_ASSISTANT=true` junto con `EXPO_PUBLIC_ASSISTANT_ENDPOINT`.
- **Expo Go**: funcionalidad completa de cámara/notificaciones disponible; para un build con RevenueCat se requiere dev build (`npx expo run:android`).
- No hay `ios/`/`android/`: la app usa Continuous Native Generation (configurable vía `app.json`).

---

## Verificación final
- TypeScript estricto: **0 errores** (`npx tsc --noEmit`)
- ESLint (`npx expo lint`): **0 problemas** (incluye reglas `react-hooks/refs` y del React Compiler)
- Bundle de producción Android: **exporta correctamente** (`npx expo export --platform android`)
- Bundle iOS: **exporta correctamente** (`npx expo export --platform ios`)
- Functions typecheck: **0 errores** (`npm run typecheck` dentro de `functions/`)
