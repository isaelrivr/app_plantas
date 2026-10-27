# EcoScan (Plantae) — Rediseño Material Design 3 / Material You

Aplicación móvil Expo/React Native nativa para Android y cross-platform para identificar plantas, organizar un jardín y registrar cuidados con diseño limpio, minimalista y elegante siguiendo las directrices de Material Design 3 (Material You).

## Requisitos y Entorno

- Expo SDK 57 (`expo ~57.0.30`)
- React Native 0.86.3, React 19.2.3
- TypeScript 6 (estricto)
- React Navigation 7 (Stack Nativo + Bottom Tabs)
- Reanimated 4
- Cero dependencias de desenfoque (`expo-blur` eliminado para máxima fluidez y rendimiento a 60–120 FPS en Android).

## Desarrollo y Verificación

```bash
npm install
npx expo start         # Iniciar el servidor de desarrollo
npm run typecheck      # npx tsc --noEmit (0 errores de tipos)
npm run lint           # npx expo lint (0 advertencias)
npm test               # 76 pruebas unitarias aprobadas
npx expo-doctor        # 21/21 verificaciones de salud del SDK
npm run verify         # Pipeline completo de validación
```

Para validar el bundle de producción de Android:
```bash
npx expo export --platform android
```

## Arquitectura del Rediseño M3

- **Sistema de diseño (`theme/`)**: Esquema tonal completo Material 3 derivado del verde botánico `#2E7D32` (`primary`, `primaryContainer`, `surfaceContainer`, `outlineVariant`, etc.), con modo claro y modo oscuro tonal real, escala de curvaturas M3 (8/12/16/28 dp) y política de cero desenfoque.
- **Componentes base (`components/`)**:
  - `Surface`: Contenedor tonal nativo M3 con elevación limpia y bordes sutiles.
  - `Button`: Variantes M3 (`filled`, `tonal`, `outlined`, `text`, `elevated`) con feedback háptico y ripple táctil.
  - `Card`: Tarjetas basadas en `Surface` sin sombras pesadas ni sobrecarga de GPU.
  - `NavigationBar`: Barra inferior nativa anclada de 80dp con indicador tipo píldora activa (64x32dp), iconos vectoriales y etiquetas siempre visibles.
- **Pantallas (`screens/`)**: 19 pantallas completamente migradas a Material 3, eliminando gradientes pesados y glassmorphism en favor de jerarquía visual limpia y aire respirable.
- **Servicios optimizados (`services/`)**:
  - `botanicalCatalogData.ts`: Catálogo botánico desacoplado para aligerar `plantApi.ts` a <500 líneas.
  - `habitatRegionsData.ts`: Geometrías separadas para modularizar `habitatService.ts`.
  - Carga diferida (`import(...)`) del dataset de TopoJSON mundial en `HabitatMapScreen`.
  - Cancelación mediante `AbortController` (timeout 10s) y caché de clima y red.
- **Internacionalización (`i18n/`)**: Cobertura 100% en los 4 idiomas: Español (`es`), Inglés (`en`), Portugués (`pt`) y Francés (`fr`).

## Servicios externos

Para IA real despliega `functions/`, configura Plant.id/Gemini en el entorno de Functions y define `EXPO_PUBLIC_PLANT_AI_ENDPOINT`. El asistente remoto requiere además `EXPO_PUBLIC_USE_REMOTE_ASSISTANT=true` y `EXPO_PUBLIC_ASSISTANT_ENDPOINT`.

RevenueCat, Firebase Auth y sincronización remota requieren los pasos de [MANUAL_STEPS.md](MANUAL_STEPS.md).

## Publicación

```bash
npx eas build --profile production
npx eas submit --platform android
npx eas submit --platform ios
```

Consulta [ENTREGA.md](ENTREGA.md) para el estado real del proyecto y [MANUAL_STEPS.md](MANUAL_STEPS.md) antes de enviar a las tiendas.
