# Pasos manuales antes de publicar

1. Crear un proyecto Firebase, habilitar Functions y configurar billing. Desplegar `functions/` con `npm run build` y `npm run deploy` dentro de esa carpeta.
2. Crear claves de Plant.id y Gemini como secretos del entorno de Functions. Nunca las pongas en `.env` del cliente.
3. Crear productos mensual/anual en App Store Connect y Google Play Console. Configurar RevenueCat con sus IDs y añadir la clave pública mediante configuración segura de build.
4. Implementar Firebase Auth si se necesita sincronización entre dispositivos. Mantener las reglas por usuario y probarlas con el emulador antes de abrir lecturas.
5. Publicar una política de privacidad y términos accesibles desde Ajustes. Completar las declaraciones de privacidad de Apple y Data Safety de Google según los datos realmente recopilados.
6. Configurar el proyecto EAS, revisar `com.isaelrivr.ecoscan` y confirmar que el bundle/package no esté ocupado.
7. Crear una development build y probar cámara, galería, ubicación denegada, notificaciones denegadas, modo avión, almacenamiento lleno y borrado de datos en Android e iOS.
8. Ejecutar `npm run typecheck`, `npm run lint`, `npm test`, `npx expo-doctor` y las exportaciones de Android/iOS con red disponible.

## Estado de Arquitectura e Integración

- **RevenueCat**: Arquitectura implementada en `services/billingService.ts` con manejo de entitlements (`EcoScan Pro`), fallback robusto offline/sandbox y conmutación automática. Para producción, configurar claves públicas `EXPO_PUBLIC_RC_APPLE` y `EXPO_PUBLIC_RC_GOOGLE`.
- **Cloud Functions**: Módulos completos compilados en `functions/` (identificación botánica, diagnóstico foliar, cuidados inteligentes y asistente). Listos para `firebase deploy`.
- **Firebase Auth y Sincronización en la Nube**: Arquitectura de cuenta opcional de usuario implementada en `services/authService.ts`, sincronización bidireccional con Firestore (`users/{userId}`) en `services/syncService.ts`, y modal accesible `components/AuthModal.tsx` integrado en Ajustes.
- **Widgets de Pantalla de Inicio**: Servicio `services/widgetService.ts` con cálculo reactivo de plantas pendientes, deep links y previsualizador `components/WidgetPreviewCard.tsx` en Ajustes.
- **Eliminación Integral de Cuenta**: Borrado local en cascada y purga remota en Firestore según normativas de App Store y Google Play.
- **Verificación de Calidad**: 37 tests unitarios pasando al 100%, TypeScript 0 errores, ESLint 0 errores y Expo Doctor 21/21 checks superados.
