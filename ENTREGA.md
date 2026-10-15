# EcoScan (Plantae) — Documento Final de Entrega

Aplicación móvil integral **Expo / React Native** para el cuidado inteligente de plantas: escáner e identificación por visión botánica, pantalla Hoy con acciones del día, línea de tiempo por planta, recordatorios adaptativos al clima y maceta, medidor de luz, seguridad para mascotas, enciclopedia de 33 especies, respaldo/importación de datos, accesibilidad universal y facturación profesional.

**Stack Tecnológico**: Expo SDK 57 · React Native 0.86.3 · React 19.2.3 · React Navigation 7 · TypeScript 6 (estricto) · ESLint 9 (`eslint-config-expo`) · AsyncStorage · React Native Reanimated · Node Test Runner.

---

## 1. Comandos de Verificación Inmediata

```bash
# 1. Pruebas unitarias completas (29 tests pasando al 100%)
npm test

# 2. Comprobación estricta de TypeScript (0 errores)
npx tsc --noEmit

# 3. Linter oficial de Expo (0 errores, 0 advertencias)
npx expo lint

# 4. Iniciar servidor de desarrollo
npx expo start
```

---

## 2. Resumen de las 6 Fases Implementadas

### FASE 1 — Escáner, Mi Jardín y Persistencia Base
- Escáner con cámara en vivo y selección de galería fotográfica.
- Mi Jardín con habitaciones personalizadas (sala, dormitorio, balcón, cocina, oficina).
- Persistencia local offline-first mediante AsyncStorage y gestión de sistema de archivos (`expo-file-system`).

### FASE 2 — Legibilidad y Accesibilidad Universal
- **Escala tipográfica accesible**: textos principales $\ge 16$–$18$ sp; etiquetas secundarias $\ge 14$ sp; ningún texto crítico en caption.
- **Soporte de fuente del sistema hasta 200%**: layouts flexibles con `minHeight`, textos multilínea y tab bar que crece sin romper la navegación.
- **Modo Fácil**: interruptor único en Ajustes que aumenta un 30% la escala de fuentes, iconos y botones interactivos.
- **Áreas táctiles**: `minTouchTarget` de $48 \times 48$ pt y padding holgado para personas mayores y niños.
- **Atributos de accesibilidad completos**: `accessibilityRole`, `accessibilityLabel` y `accessibilityState` en todas las pantallas.

### FASE 3 — Lenguaje, Mensajes y Retroalimentación
- **Cero jerga técnica**: sustitución de términos de demo ("mock", "Cloud Function", "patrones foliares", "biogeográfico") por lenguaje cotidiano y cálido ("Revisando tu planta...", "Revisando el clima de tu zona...", "Hoy toca regar la Monstera").
- **Eliminación de Alert.alert**: sustituido por sistema propio y coherente de feedback:
  - `Toast` animado con opción de "Deshacer" (5 segundos) para acciones reversibles (riego, borrado).
  - `BottomSheet` accesible para confirmaciones y selecciones modales.
- **Emojis limpios**: retirada de emojis dentro de títulos y botones para garantizar locución natural en lectores de pantalla.

### FASE 4 — Rediseño de Pantallas Clave
- **4.1 Onboarding**: 3 pasos (Bienvenida, Idioma, ¿Qué quieres lograr?), botón "Omitir" visible, sin permisos prematuros.
- **4.2 Hoy**: centro de mando con la tarea principal en tarjeta grande ("Regar Monstera"), botón accesible "Ya la regué", resumen de clima y racha discreta.
- **4.3 Mi Jardín**: tarjetas de planta con estado claro ("Necesita agua", "Todo bien"), botón (+) para alta manual completa con apodo y maceta.
- **4.4 Escáner**: botón disparador grande (82 pt), ayuda visual "Buena vs. mala foto", ficha de resultado con nombre común destacado y certeza en palabras.
- **4.5 Ficha botánica**: bloque "Qué hacer hoy" prioritario, banner de toxicidad para mascotas y revelación progresiva de información.
- **4.6 Enciclopedia**: lista virtualizada con `FlatList`, buscador instantáneo tolerante a tildes (`normalizeDiacritics`) y filtros combinados.
- **4.7 Calendario**: vista semanal con alternador mensual y edición accesible de tareas (`EditCareTaskModal`).
- **4.8 Paywall**: precios transparentes mensual/anual, 4 viñetas de valor honestas, prueba gratuita de 7 días y restauración de compras.

### FASE 5 — Confianza y Calidad de Producto
- **Logros persistidos**: cada medalla se almacena con su fecha exacta de desbloqueo (`unlockedAt`) y modal de celebración accesible con feedback háptico.
- **Borrado en cascada**: al eliminar una planta, se limpian sus fotos locales y entradas de diario de crecimiento sin dejar archivos huérfanos.
- **Reconciliación de fotos huérfanas**: escaneo en segundo plano (`reconcileOrphanImages`) para liberar espacio en el almacenamiento del usuario.
- **Clima robusto con selección manual de ciudad**: 10 ciudades globales precargadas con coordenadas exactas, timeout y caché estricta de 30 minutos.
- **Analítica privada y Crash Reporting**: solo con consentimiento explícito del usuario (`analyticsConsent`) y documentado con transparencia en Ajustes.
- **Pantallas legales reales**: Política de Privacidad y Términos y Condiciones integrados con URLs públicas.
- **Pantalla de Ayuda**: 6 preguntas frecuentes, contacto directo por correo (`soporte@ecoscan.app`) y reporte de problemas.

### FASE 6 — Funciones Profesionales para Publicación
- **Facturación RevenueCat**: arquitectura desacoplada en `services/billingService.ts` con entitlement `EcoScan Pro`, soporte para `react-native-purchases` y sandbox seguro para Expo Go.
- **Reglas de seguridad Firestore**: `firestore.rules` con granularidad estricta por usuario (`users/{userId}`): autorización estricta donde únicamente el usuario autenticado (`request.auth.uid == userId`) puede leer, escribir o eliminar datos.
- **Copia de seguridad local e importación**: exportación completa del jardín a archivo JSON (`backupService.ts`) e importación con validación estricta de esquema en tiempo de ejecución.
- **Eliminación integral de cuenta**: borrado definitivo tanto de datos locales como de colecciones remotas (`performFullAccountDeletion`) cumpliendo normativas de Google Play y Apple App Store.
- **Alta manual de plantas**: registro sin cámara con selector de tamaño de maceta (`small`, `medium`, `large`, `planter`), apodo y foto opcional de galería.
- **Riego inteligente adaptativo**: servicio `wateringAdjustmentService.ts` que calcula dinámicamente el intervalo de riego óptimo cruzando tamaño de tiesto, estación climática y pronóstico en tiempo real (lluvia o calor extremo).
- **Notificaciones interactivas**: canal con categoría `WATERING_REMINDER` y acción rápida *"Ya regué"* (`ACTION_WATERED`).
- **Línea de tiempo de crecimiento**: componente `PlantTimeline.tsx` en pestaña dedicada *"Historia"*, con hitos de riego, diagnósticos médicos y comparador fotográfico antes/después.
- **Medidor de luz orientativo**: modal interactivo `LightMeterModal.tsx` con medidor de iluminancia (50 a 1400 lux) y diagnóstico botánico según las necesidades específicas de la planta.
- **Compartir ficha de planta**: modal compartible `ShareCardModal.tsx` con tarjeta visual, requisitos de cultivo y badge de seguridad para mascotas exportable mediante `Share.share`.
- **Modo mascotas**: preferencia en Ajustes `hasPets`, advertencia preventiva al agregar plantas tóxicas y filtro instantáneo en la Enciclopedia (*"Seguras para mascotas 🐾"*).
- **Catálogo botánico ampliado**: **33 especies botánicas comunes** con fichas taxonómicas y de cuidado completas.
- **Internacionalización a 4 idiomas**: Español (`es`), Inglés (`en`), Portugués (`pt`) y Francés (`fr`).
- **Deep Linking**: esquema `ecoscan://` (`ecoscan://planta/:plantId`), soporte oficial para tabletas (`supportsTablet: true`) y diseño responsivo.

---

## 3. Estado de Pruebas Automatizadas

```
✔ touch target tokens meet accessibility standards
✔ typography scale meets readable criteria for all ages
✔ contrast compliance tokens
✔ storage: isRecord correctly discriminates valid objects from primitives and arrays
✔ storage: validateGardenData cleans corrupted plants and retains valid structure
✔ storage: validateSettingsData returns safe defaults for malformed input
✔ storage: validateAchievementsData filters out non-timestamped keys
✔ achievements: checkNewAchievements detects unearned milestones and creates unlockedAt
✔ achievements: getAchievements preserves historical unlockedAt timestamps
✔ daily counter: dateKey rollover logic resets count
✔ weather: SUPPORTED_CITIES contains valid latitude and longitude coordinates
✔ weather: cache TTL is strictly 30 minutes
✔ media: orphan image reconciliation identifies detached files
✔ analytics: no events emitted without user consent and no PII allowed
✔ fase 6: smart watering interval adjusts dynamically for pot, season, and weather
✔ fase 6: botanical catalog is expanded to 32+ common species with full metadata
✔ fase 6: pet safety and toxicity filtering correctly classifies species
✔ fase 6: backup validation and runtime schema defense
✔ fase 6: multilingual support includes complete dictionaries for PT and FR
✔ fase 6: app.json defines deep linking scheme and tablet support
✔ undo action manager behaves correctly with timers
✔ natural copy has eliminated technical jargon and emojis from actions
✔ habitat country mapping uses ids present in world-atlas
✔ habitat geometry helpers are exported
✔ normalizeDiacritics strips accents and lowercases correctly
✔ diacritic-insensitive matching finds plants regardless of user typing accents
✔ manual plant creation generates valid care structure
✔ fase 4 translations for onboarding and garden are complete
✔ project exposes verification scripts

Total: 29 tests passing (100% éxito)
```
