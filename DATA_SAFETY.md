# Declaración de Seguridad de Datos y Privacidad · EcoScan

Este documento describe la arquitectura de datos, retención y las declaraciones oficiales requeridas para la publicación en **Google Play Store (Data Safety Section)** y **Apple App Store (App Privacy Nutrition Labels)**.

---

## 1. Principios Fundamentales de EcoScan

1. **Almacenamiento Local Primero (Local-First)**:
   - Toda la información de tu jardín (plantas, nombres, notas, historial de riego, fotos y diario de crecimiento) se guarda exclusivamente en el almacenamiento local del dispositivo mediante `@react-native-async-storage/async-storage` y el sistema de archivos (`expo-file-system`).
   - El usuario puede exportar una copia completa en JSON o borrar todos sus datos en cualquier momento desde *Ajustes → Eliminar mis datos del dispositivo*.

2. **Sin Cuentas Obligatorias**:
   - No se requiere correo electrónico, contraseña ni perfiles sociales para usar las funciones básicas de la aplicación.

3. **Cero Venta o Compartición de Datos Personales**:
   - EcoScan no vende, alquila ni monetiza datos con corredores de datos ni redes publicitarias.

---

## 2. Google Play — Data Safety Section

### Recopilación y Compartición de Datos

| Categoría | Tipo de Dato | Recopilado | Compartido | Finalidad | Opcional | Cifrado en tránsito |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fotos y vídeos** | Fotos tomadas / seleccionadas | Sí (efímero) | No | Funcionalidad de la app (Identificación botánica y diagnóstico de salud foliar) | Sí (solo si usa la cámara) | Sí (HTTPS / TLS 1.3) |
| **Ubicación** | Ubicación aproximada (Ciudad / Coordenadas) | Sí (efímero) | No | Funcionalidad de la app (Pronóstico de lluvia y temperatura para cálculo de riego) | Sí (puede seleccionarse ciudad manual) | Sí (HTTPS / TLS 1.3) |
| **Diagnósticos / Fallos** | Registros de errores y bloqueos | Sí (condicionado) | No | Rendimiento y corrección de bugs técnicos | Sí (consentimiento de analítica) | Sí (HTTPS) |
| **Uso de la aplicación** | Interacciones con funciones (eventos anónimos) | Sí (condicionado) | No | Análisis de uso del producto sin asociar a personas | Sí (desactivable en Ajustes) | Sí (HTTPS) |
| **Información financiera** | Historial de compras dentro de la app | Gestionado por Google Play | No | Gestión de suscripciones y compras digitales | No (manejado por Google Play Billing) | Sí |

### Declaraciones de Seguridad
- **Cifrado en tránsito**: Todos los datos transmitidos viajan bajo protocolo HTTPS / TLS 1.3.
- **Mecanismo de eliminación de datos**: El usuario puede borrar todos los datos locales desde *Ajustes → Privacidad y datos → Eliminar mis datos del dispositivo*, o solicitar asistencia en `privacidad@ecoscan.app`.

---

## 3. Apple App Store — Privacy Nutrition Labels

### Datos Vinculados al Usuario (*Data Linked to You*)
- **Ninguno**. EcoScan no vincula identificadores de usuario con perfiles de seguimiento entre aplicaciones ni sitios web externos.

### Datos No Vinculados al Usuario (*Data Not Linked to You*)

1. **Uso de Datos / Analítica de Producto** (*Product Interaction*):
   - **Propósito**: Analítica interna del funcionamiento de la app.
   - **Condición**: Sujeto al interruptor explícito de consentimiento en *Ajustes → Privacidad y datos*. Si está desactivado, no se emite ningún evento.
   - **Datos**: Nombres de pantallas abiertas, tipo de acción (p. ej. "planta_regada"), sin identificadores de hardware permanentes (IDFA = no utilizado).

2. **Diagnósticos** (*Crash Data & Performance*):
   - **Propósito**: Detección y corrección de caídas inesperadas de la aplicación.
   - **Datos**: Stack trace del error, versión del sistema operativo y modelo genérico del dispositivo.

3. **Ubicación aproximada** (*Coarse Location*):
   - **Propósito**: Consulta del clima atmosférico (temperatura y lluvia de Open-Meteo) para ajustar recomendaciones de riego. No se almacena historial de trayectorias.

4. **Fotos del usuario** (*User Photos*):
   - **Propósito**: Análisis y clasificación visual de hojas, flores y síntomas biológicos. Las imágenes no se utilizan para entrenamiento de modelos faciales ni se publican.

---

## 4. Retención y Ciclo de Vida de Imágenes

- **Fotos en el dispositivo**: Se guardan en la carpeta privada `FileSystem.documentDirectory + 'plantae-media/'`.
- **Eliminación en cascada**: Al borrar una planta, EcoScan borra automáticamente la foto principal del disco y todas las entradas de diario fotográfico asociadas.
- **Reconciliación de fotos huérfanas**: Al iniciar la aplicación, el servicio `mediaService.reconcileOrphanImages` compara los archivos físicos de la carpeta contra las referencias activas del jardín y elimina cualquier archivo residual.

---

## 5. Contacto del Delegado de Protección de Datos

- **Responsable**: Equipo de Privacidad EcoScan
- **Correo Electrónico**: `privacidad@ecoscan.app`
- **Sitio Web Oficial**: `https://ecoscan.app/privacidad`
