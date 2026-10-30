# Declaración de Seguridad de Datos y Privacidad · EcoScan

Este documento describe la arquitectura de datos, retención y las declaraciones oficiales requeridas para la publicación en **Google Play Store (Data Safety Section)** y **Apple App Store (App Privacy Nutrition Labels)** para la aplicación **EcoScan** (`com.isaelrivr.ecoscan`).

---

## 1. Principios Fundamentales de EcoScan

1. **Arquitectura 100% Local Primero (Local-First)**:
   - Toda la información de tu jardín (plantas, nombres, notas, historial de riego, fotos y diario de crecimiento) se guarda exclusivamente en el almacenamiento local del dispositivo mediante `@react-native-async-storage/async-storage` y el sistema de archivos (`expo-file-system`).
   - Los datos sensibles de estado y suscripción se almacenan cifrados con hardware mediante `expo-secure-store`.
   - El usuario puede exportar una copia completa en JSON o borrar todos sus datos en cualquier momento desde *Ajustes → Eliminar mis datos del dispositivo*.

2. **Sin Cuentas Obligatorias ni Rastreo Personal**:
   - No se requiere correo electrónico, contraseña ni perfiles sociales para usar las funciones de la aplicación.
   - El backend opera de forma stateless (sin base de datos de usuarios en la nube).

3. **Cero Venta o Compartición con Terceros Publicitarios**:
   - EcoScan no vende, alquila ni monetiza datos con corredores de datos ni redes publicitarias. No se utiliza IDFA (Identifier for Advertisers) ni AAID de seguimiento.

---

## 2. Google Play — Data Safety Section

### Recopilación y Compartición de Datos

| Categoría | Tipo de Dato | Recopilado | Compartido | Finalidad | Opcional | Cifrado en tránsito |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fotos y vídeos** | Fotos de plantas y hojas tomadas o seleccionadas | Sí (efímero) | Sí (Proveedores de IA: Gemini / Plant.id v3) | Funcionalidad de la app (Identificación botánica y diagnóstico de salud foliar). Se transmiten vía HTTPS, se procesan en memoria y se descartan inmediatamente sin retención en servidores. | Sí (solo si usa la cámara o galería) | Sí (HTTPS / TLS 1.3) |
| **Ubicación** | Ubicación aproximada (Ciudad / Región) | Sí (efímero) | No | Funcionalidad de la app (Pronóstico de lluvia y temperatura para cálculo de riego adaptativo). No se registra geolocalización en segundo plano. | Sí (puede seleccionarse ciudad manual) | Sí (HTTPS / TLS 1.3) |
| **Identificadores del dispositivo** | Device ID anónimo (UUID v4) | Sí | Sí (RevenueCat) | Prevención de fraude, rate-limiting de cuota stateless y gestión de compras digitales. | No | Sí (HTTPS / TLS 1.3) |
| **Información financiera y compras** | Historial de compras / estado de suscripción | Gestionado por Google Play y RevenueCat | Sí (RevenueCat) | Gestión de suscripciones EcoScan Pro y validación de recibos de compra. | No (manejado por Google Play Billing) | Sí (HTTPS / TLS 1.3) |
| **Diagnósticos / Fallos** | Registros de errores y bloqueos | Sí (condicionado) | No | Rendimiento y corrección de bugs técnicos. | Sí (consentimiento en Ajustes) | Sí (HTTPS) |
| **Uso de la aplicación** | Interacciones con funciones (eventos anónimos) | Sí (condicionado) | No | Análisis de uso del producto sin asociar a personas. | Sí (desactivable en Ajustes) | Sí (HTTPS) |

### Declaraciones de Seguridad
- **Cifrado en tránsito**: Todos los datos transmitidos viajan bajo protocolo HTTPS / TLS 1.3.
- **Mecanismo de eliminación de datos**: El usuario puede borrar todos los datos locales desde *Ajustes → Privacidad y datos → Eliminar mis datos del dispositivo*, o solicitar asistencia en `privacidad@ecoscan.app`. Al borrar los datos locales, se cancelan de inmediato todas las notificaciones programadas y se purga el almacenamiento seguro.

---

## 3. Apple App Store — Privacy Nutrition Labels

### Datos Vinculados al Usuario (*Data Linked to You*)
- **Ninguno**. EcoScan no vincula identificadores de usuario con perfiles de seguimiento entre aplicaciones ni sitios web externos.

### Datos No Vinculados al Usuario (*Data Not Linked to You*)

1. **Compras y Suscripciones** (*Purchases*):
   - **Propósito**: Gestión de compras dentro de la app (StoreKit y RevenueCat SDK).
   - **Datos**: Historial de transacciones, identificador de producto y estado de suscripción (`pro`).

2. **Identificadores** (*Identifiers*):
   - **Propósito**: Prevención de abusos de cuota del servidor y sincronización anónima de compras mediante App User ID / Device ID aleatorio.
   - **Datos**: UUID v4 generado aleatoriamente en el dispositivo.

3. **Fotos del usuario** (*User Photos*):
   - **Propósito**: Análisis y clasificación visual de especies y patologías foliares. Las imágenes no se utilizan para entrenamiento de modelos faciales ni se publican ni se retienen tras la inferencia.

4. **Ubicación aproximada** (*Coarse Location*):
   - **Propósito**: Consulta del clima atmosférico (temperatura y lluvia de Open-Meteo) para ajustar recomendaciones de riego. No se requiere geolocalización precisa ni acceso en segundo plano.

5. **Uso de Datos / Analítica de Producto** (*Product Interaction*):
   - **Propósito**: Analítica interna del funcionamiento de la app. Sujeto a interruptor de consentimiento en *Ajustes*.

---

## 4. Retención y Ciclo de Vida de Imágenes y Archivos

- **Fotos en el dispositivo**: Se guardan en la carpeta privada `FileSystem.documentDirectory + 'plantae-media/'` (subdirectorios `garden` y `diary`).
- **Eliminación en cascada**: Al borrar una planta, EcoScan borra automáticamente la foto principal del disco, todas las entradas de diario de crecimiento asociadas y cancela sus notificaciones programadas.
- **Reconciliación de fotos huérfanas**: Al iniciar la aplicación, `reconcileOrphanImages` compara los archivos físicos de la carpeta contra las referencias activas del jardín y del diario de crecimiento, eliminando cualquier archivo huérfano.

---

## 5. Proveedores y Procesadores Externos

- **Google Gemini API**: Procesamiento de fichas botánicas, asistente botánico y análisis de fotos mediante proxy seguro en Cloud Functions sin exposición de credenciales en el cliente.
- **Plant.id v3 (Kindwise)**: Identificación taxonómica y diagnóstico de patologías vegetales mediante llamada serverless autenticada.
- **RevenueCat**: Gestión técnica de entitlements de suscripción in-app y comunicación con Apple App Store / Google Play Billing.
- **Open-Meteo**: API meteorológica abierta para pronóstico de clima local basada en coordenadas aproximadas, sin recolección de identificadores personales.

---

## 6. Contacto del Delegado de Protección de Datos

- **Responsable**: Equipo de Privacidad y Seguridad EcoScan
- **Correo Electrónico**: `privacidad@ecoscan.app`
- **Sitio Web Oficial**: `https://ecoscan.app/privacidad`
