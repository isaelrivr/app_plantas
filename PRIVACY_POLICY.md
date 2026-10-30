# Política de Privacidad de EcoScan

**Última actualización:** 29 de octubre de 2026  
**Aplicación:** EcoScan (`com.isaelrivr.ecoscan`)  
**Responsable:** Equipo de Desarrollo EcoScan (`privacidad@ecoscan.app`)  
**URL Pública:** [https://ecoscan.app/privacidad](https://ecoscan.app/privacidad)

---

## 1. Introducción y Compromiso de Privacidad

En **EcoScan**, la privacidad del usuario es un pilar de diseño fundamental. Nuestra aplicación está construida bajo una arquitectura **100% Local-First** (local primero): toda la información relativa a tus plantas, nombres, zonas, tareas de riego, fotos y anotaciones personales vive únicamente en tu dispositivo.

No comercializamos con tus datos personales, no vendemos perfiles a intermediarios publicitarios ni empleamos rastreadores invasivos de comportamiento entre aplicaciones.

---

## 2. Datos Procesados y Finalidad

### A. Fotografías de Plantas y Visión Artificial (IA)
- **Datos**: Fotografías capturadas con la cámara o seleccionadas desde la galería de tu dispositivo.
- **Finalidad**: Identificar la especie botánica y evaluar la presencia de plagas o anomalías foliares.
- **Tratamiento**: Las imágenes se transmiten cifradas de punto a punto (HTTPS / TLS 1.3) a través de nuestro servidor proxy seguro hacia los proveedores de visión botánica (**Google Gemini 1.5 Flash** y **Plant.id v3** de Kindwise). Las fotos se procesan exclusivamente en memoria de forma efímera para generar la respuesta botánica y no se almacenan permanentemente en servidores externos ni se usan para entrenar modelos biométricos.
- **Almacenamiento Local**: En tu dispositivo, las fotos guardadas residen en el directorio de almacenamiento privado de la app y se eliminan automáticamente cuando borras la planta correspondiente.

### B. Ubicación Aproximada
- **Datos**: Coordenadas geográficas aproximadas o ciudad seleccionada manualmente.
- **Finalidad**: Consultar datos meteorológicos en tiempo real (temperatura, radiación y probabilidad de lluvia) mediante la API pública de **Open-Meteo** para calcular el riego adaptativo de tus plantas.
- **Tratamiento**: Solo se solicita permiso de ubicación en primer plano (`WhenInUse`) de nivel aproximado (`ACCESS_COARSE_LOCATION`). No se solicita ni se rastrea tu ubicación en segundo plano.

### C. Identificador Anónimo del Dispositivo (Device ID)
- **Datos**: Un identificador aleatorio UUID v4 generado localmente en el dispositivo.
- **Finalidad**: Control de tasa de solicitudes (rate limiting stateless) para evitar abusos o denegaciones de servicio en el backend de IA y gestión técnica de compras in-app.
- **Tratamiento**: No se asocia con tu nombre, documento de identidad ni cuenta de correo electrónico.

### D. Compras dentro de la App y Suscripciones (RevenueCat)
- **Datos**: Estado de la suscripción (EcoScan Pro), identificador anónimo de cliente, fecha de expiración y recibos de transacción de la tienda oficial.
- **Finalidad**: Habilitar el acceso a las funciones Pro (asistente ilimitado, comparador fotográfico y diagnósticos fitosanitarios).
- **Tratamiento**: El procesamiento financiero lo realiza directamente **Apple App Store** o **Google Play Store**. Utilizamos el SDK oficial de **RevenueCat** para validar los entitlements de forma anónima. La clave de suscripción se resguarda en el almacenamiento seguro del sistema operativo (`expo-secure-store`).

### E. Analíticas de Uso y Rendimiento Técnico (Opcional)
- **Datos**: Registros de errores no identificables, caídas de la app y eventos genéricos de navegación.
- **Finalidad**: Garantizar la estabilidad y rendimiento técnico de la app.
- **Control**: Puedes activar o desactivar la telemetría en cualquier momento desde *Ajustes → Privacidad y datos → Compartir analíticas anónimas*.

---

## 3. Notificaciones Locales

EcoScan programa recordatorios de riego y cuidados fitosanitarios que se ejecutan **100% de forma local** en el sistema operativo mediante el motor de notificaciones del dispositivo (`expo-notifications`). No se utilizan servidores Push externos ni se envía el token de notificación a la nube.

Puedes cancelar los recordatorios en cualquier momento eliminando la planta, restableciendo los datos o desactivando los permisos en los Ajustes del sistema.

---

## 4. Retención y Eliminación de Datos

- **Eliminación Total por el Usuario**: Puedes purgar de forma inmediata e irreversible todos los datos almacenados (plantas, fotos, logros, historial y credenciales seguras) accediendo a *Ajustes → Zona de Peligro → Eliminar todos los datos*.
- **Exportación de Datos**: Tienes derecho a la portabilidad de tus datos, pudiendo exportar tu jardín completo en formato JSON estándar desde el menú de Ajustes.
- **Solicitud Asistida**: También puedes solicitar asistencia para la eliminación de datos escribiendo a `privacidad@ecoscan.app`.

---

## 5. Permisos Requeridos del Sistema

| Permiso | Plataforma | Motivo |
| :--- | :--- | :--- |
| **Cámara** | iOS / Android | Capturar fotos de plantas y hojas para identificación y salud foliar. |
| **Galería / Fotos** | iOS / Android | Seleccionar fotos almacenadas para análisis botánico y diario de crecimiento. |
| **Ubicación en uso (Aproximada)** | iOS / Android | Ajustar sugerencias de riego según el clima local (solo suscriptores Pro). |
| **Notificaciones** | iOS / Android | Recordatorios locales programados de riego y tratamientos. |

---

## 6. Seguridad de la Información

Implementamos medidas técnicas y organizativas rigurosas para proteger tu información:
- Cifrado en tránsito con **TLS 1.3 / HTTPS** para todas las peticiones al proxy de IA.
- Cifrado en reposo para estados sensibles mediante el llavero del sistema operativo (**iOS Keychain** y **Android Keystore** vía `expo-secure-store`).
- Desactivación de copias de seguridad automáticas no controladas (`allowBackup: false` en Android) para evitar fugas de información.
- Declaración de cifrado estándar exento (`usesNonExemptEncryption: false` en iOS).

---

## 7. Aviso sobre Seguridad Botánica y Salud de Mascotas

Las recomendaciones de cuidado, compatibilidad y toxicidad para mascotas y niños proporcionadas por EcoScan y su Asistente IA son de carácter **meramente orientativo y educativo**. Aunque se basan en literatura botánica contrastada y modelos de IA avanzados, no sustituyen el diagnóstico de un botánico certificado ni la atención médica veterinaria de urgencia. Ante la ingestión o sospecha de intoxicación de un animal doméstico o infante, acude de inmediato a un centro veterinario o de salud.

---

## 8. Modificaciones y Contacto

Nos reservamos el derecho de actualizar esta política de privacidad para reflejar mejoras en la aplicación o cambios regulatorios. Cualquier cambio sustancial se notificará en las notas de versión de la tienda.

Para cualquier duda, sugerencia o ejercicio de derechos ARCO/GDPR, contáctanos en:
- **Correo Electrónico**: `privacidad@ecoscan.app`
- **Página Web**: [https://ecoscan.app](https://ecoscan.app)
