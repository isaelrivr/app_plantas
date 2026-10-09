# Plantae

Aplicación móvil Expo/React Native para identificar plantas, organizar un jardín y registrar cuidados.

## Requisitos

- Node.js compatible con Expo SDK 57
- Una development build para cámara, notificaciones y módulos nativos
- `npm install`

## Desarrollo

```bash
npm install
npx expo start
npm run typecheck
npm run lint
npm test
```

Las variables públicas se documentan en `.env.example`. No pongas claves privadas en variables `EXPO_PUBLIC_*`.

## Arquitectura

- `screens/`: pantallas y flujos de navegación.
- `components/`: controles reutilizables.
- `context/`: jardín, preferencias y estado Pro local.
- `services/`: persistencia, medios, clima, catálogo y clientes de red.
- `functions/src/`: Cloud Functions para identificación, cuidados y salud.

La app funciona offline-first con AsyncStorage y mantiene fallbacks locales para los servicios que todavía no estén configurados.

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
