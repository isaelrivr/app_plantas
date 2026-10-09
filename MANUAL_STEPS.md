# Pasos manuales antes de publicar

1. Crear un proyecto Firebase, habilitar Functions y configurar billing. Desplegar `functions/` con `npm run build` y `npm run deploy` dentro de esa carpeta.
2. Crear claves de Plant.id y Gemini como secretos del entorno de Functions. Nunca las pongas en `.env` del cliente.
3. Crear productos mensual/anual en App Store Connect y Google Play Console. Configurar RevenueCat con sus IDs y añadir la clave pública mediante configuración segura de build.
4. Implementar Firebase Auth si se necesita sincronización entre dispositivos. Mantener las reglas por usuario y probarlas con el emulador antes de abrir lecturas.
5. Publicar una política de privacidad y términos accesibles desde Ajustes. Completar las declaraciones de privacidad de Apple y Data Safety de Google según los datos realmente recopilados.
6. Configurar el proyecto EAS, revisar `com.isaelrivr.plantae` y confirmar que el bundle/package no esté ocupado.
7. Crear una development build y probar cámara, galería, ubicación denegada, notificaciones denegadas, modo avión, almacenamiento lleno y borrado de datos en Android e iOS.
8. Ejecutar `npm run typecheck`, `npm run lint`, `npm test`, `npx expo-doctor` y las exportaciones de Android/iOS con red disponible.

## Pendientes conocidos

- RevenueCat todavía no está conectado; el servicio actual es un adaptador local.
- El asistente remoto requiere una Cloud Function `assistantChat`, todavía no exportada en `functions/src/index.ts`.
- Firebase Auth y sincronización no están implementados; el borrado actual elimina datos locales del dispositivo.
- Expo Doctor necesita acceso al registro npm para validar dependencias.
