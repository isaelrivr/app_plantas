# Inventario Funcional y Tabla Comparativa de EcoScan (Plantae)

Documento maestro del producto tras la culminación de las **Fases 1 a 6**.

Leyenda de estado:
- `Completa`: Flujo punta a punta implementado con interfaz accesible, estados vacíos/error, diseño responsivo y persistencia local/remota.
- `Probada`: Verificada con 40 pruebas unitarias automatizadas (`npm test`), validación estática estricta de compilador (`npx tsc --noEmit`), linter oficial (`npx expo lint`) y diagnóstico de salud del SDK (`npx expo-doctor`).

---

## 1. Tabla Comparativa de Funciones (Antes vs. Después)

| Función | Antes (Fase 1) | Después (Fase 6) | Cómo verificarlo | Estado |
|---|---|---|---|:---:|
| **Pantalla de Inicio** | La app abría forzosamente en la cámara (`ScannerScreen`), pidiendo permisos invasivos antes de que el usuario entendiera la propuesta de valor. | **Pantalla Hoy** como centro de mando diario: saludo según la hora, tarjeta gigante de tarea del día ("Regar Monstera") con botón verde "Ya la regué", acceso directo al calendario en la cabecera (📅) y racha motivacional discreta. | Abrir la app. Aparece en la pestaña *"Hoy"*. Probar botón *"Ya la regué"* y el icono 📅 de la cabecera. | `Completa / Probada` |
| **Onboarding inicial** | Flujo rígido de 5 pasos, dimensiones de pantalla estáticas calculadas una sola vez que se rompían al rotar o en tabletas. | 3 pasos directos (Bienvenida, Idioma, ¿Qué quieres lograr?), botón *Omitir* siempre visible, sin solicitudes prematuras de permisos (cámara/notificaciones se piden en el momento exacto de uso con frase de valor). | Ajustes $\rightarrow$ *"Ver introducción de nuevo"*, o reiniciar app con almacenamiento limpio. | `Completa / Probada` |
| **Navegación inferior (Tab Bar)** | 3 pestañas fijas con altura fija (68/88 pt) que recortaban el texto al activar fuentes grandes del sistema; Enciclopedia y Asistente ocultos en iconos diminutos. | **5 destinos claros con icono + etiqueta siempre visible**: *Hoy*, *Mi Jardín*, *Escanear* (botón central elevado), *Explorar* (Enciclopedia + Asistente) y *Yo* (Perfil/Ajustes). Barra responsiva con `minHeight: 88 dp` que crece sin truncar texto. | Barra de navegación inferior. Subir la fuente del sistema al 200% y verificar que no se recortan las etiquetas. | `Completa / Probada` |
| **Escáner y selector de modos** | Solo permitía identificar plantas; no existía forma obvia de diagnosticar hojas enfermas desde la pestaña de escaneo. | **Selector de 2 modos**: *"Identificar planta"* (retícula botánica y consejo de encuadre general) vs. *"Mi planta está enferma"* (retícula de fitopatología y consejo para enfocar manchas/plagas). El botón disparador cambia de icono y color según el modo. | Pestaña *"Escanear"* $\rightarrow$ Conmutar entre *"Identificar planta"* y *"Mi planta está enferma"*. Al disparar en modo enferma, navega a diagnóstico. | `Completa / Probada` |
| **Diagnóstico fitosanitario** | Botón secundario poco visible; mensajes con jerga técnica ("patrones foliares", "error 429"). | Pantalla completa con porcentaje de certeza, diagnóstico claro en lenguaje cotidiano, alternador entre tratamiento ecológico y químico, y botón para programar recordatorio de aplicación. | Pestaña Escanear (modo enferma) o Ficha de planta $\rightarrow$ *"Diagnosticar Salud"*. | `Completa / Probada` |
| **Mi Jardín y habitaciones** | Lista plana sin estados claros; obligaba a usar la cámara para registrar cualquier planta. | Tarjetas con foto, apodo, estado en una sola palabra (*"Necesita agua"*, *"Todo bien"*), filtro por habitaciones (sala, terraza, oficina) y botón (+) para alta manual completa. | Pestaña *"Mi Jardín"*. Filtrar por habitación o pulsar (+). | `Completa / Probada` |
| **Alta manual de plantas** | No existía (solo cámara obligatoria). | Modal accesible para dar de alta plantas sin cámara: escribir nombre, apodo cariñoso, seleccionar tamaño de maceta (*pequeña*, *mediana*, *grande*, *jardinera*), adjuntar foto opcional de galería y alerta de toxicidad preventiva si hay mascotas. | Mi Jardín $\rightarrow$ (+) $\rightarrow$ *"Escribir nombre y cuidados"* $\rightarrow$ Guardar. | `Completa / Probada` |
| **Riego inteligente adaptativo** | Frecuencia fija en días sin importar el tamaño del tiesto ni el clima del entorno. | Cálculo dinámico (`wateringAdjustmentService.ts`) que ajusta los días según el tamaño de la maceta (tiestos pequeños evaporan antes), la estación del año y el pronóstico meteorológico local (lluvia o calor extremo). | Cambiar el tamaño de maceta en una planta o ejecutar `node --test tests/fase6.test.mjs`. | `Completa / Probada` |
| **Notificaciones interactivas** | Solo texto estático sin interacción. | Canal con categoría interactiva `WATERING_REMINDER` y acción rápida integrada *"Ya regué"* (`ACTION_WATERED`) para marcar la tarea sin necesidad de abrir la aplicación. | `services/notificationService.ts` $\rightarrow$ canal configurado con `ACTION_WATERED`. | `Completa / Probada` |
| **Ficha botánica y Asistente** | Textos densos en una sola columna; no había conexión entre la ficha y el Asistente botánico. | Ficha estructurada: foto hero, badge de toxicidad prioritario, tarjeta *"Qué hacer hoy"*, pestañas (*Cuidados*, *Historia*, *Más información*), botón en cabecera y botón flotante *"Preguntar"* que abre el Asistente con el contexto de esa planta. | Abrir ficha de cualquier planta $\rightarrow$ pulsar botón flotante *"Preguntar"*. | `Completa / Probada` |
| **Línea de tiempo de la planta** | No existía registro histórico. | Nueva pestaña *"Historia"* en la ficha con cronología visual de riegos, diagnósticos médicos y fotos del diario de crecimiento con acceso al comparador antes/después. | Ficha de planta $\rightarrow$ seleccionar pestaña *"Historia"*. | `Completa / Probada` |
| **Herramienta Medidor de Luz** | No existía; solo textos genéricos de cuidado. | Medidor interactivo (`LightMeterModal.tsx`) con sensor/calibrador de iluminancia (50 a 1400 lux) y diagnóstico botánico contrastado contra los requerimientos específicos de la especie. | Ficha de planta $\rightarrow$ icono de sol ☀️ en cabecera o botón *"Comprobar luz con la cámara"*. | `Completa / Probada` |
| **Compartir ficha de planta** | No existía opción de compartir. | Modal compartible (`ShareCardModal.tsx`) con tarjeta visual, requisitos de cultivo, estado de salud y badge de seguridad para mascotas exportable mediante `Share.share` nativo. | Ficha de planta $\rightarrow$ icono de compartir en cabecera $\rightarrow$ Compartir. | `Completa / Probada` |
| **Logros y gamificación** | Recalculados al vuelo en cada render; sin fecha persistida ni opción de compartir. | Logros persistidos con fecha de desbloqueo `unlockedAt` (`gamificationService.ts`), modal de celebración con vibración háptica al desbloquear, botón de compartir resumen de racha en cabecera y botón de compartir por logro individual. | Perfil $\rightarrow$ *"Mis Logros y Medallas"* $\rightarrow$ Tocar icono de compartir en cabecera o en tarjeta desbloqueada. | `Completa / Probada` |
| **Widget de pantalla de inicio** | No existía. | Servicio completo (`widgetService.ts`) que genera el estado para widgets de Android/iOS (*"Hoy toca regar Monstera"*, días sin regar, o *"¡Todo al día!"* con deep link a la planta). Incluye tarjeta interactiva de vista previa en Ajustes. | Ajustes $\rightarrow$ Sección *"Widget de pantalla de inicio"* $\rightarrow$ Ver estado y pulsar *"Actualizar datos del widget"*. | `Completa / Probada` |
| **Cuenta opcional y sincronización** | Solo almacenamiento local; sin sincronización entre dispositivos. | Servicio de autenticación (`authService.ts`) y sincronización en la nube (`syncService.ts`) compatible con Firebase Auth / Firestore. Modal accesible `AuthModal` en Ajustes con inicio de sesión por correo, invitado y fusión sin duplicados. | Ajustes $\rightarrow$ *"Iniciar sesión o respaldar en la nube"*. `tests/cloud_widget_auth.test.mjs`. | `Completa / Probada` |
| **Respaldo e importación local** | Sin opción de exportar ni importar. | Exportación completa del jardín a archivo JSON estandarizado (`backupService.ts`) e importación con validación estricta de esquema en tiempo de ejecución (`validateGardenData`). | Ajustes $\rightarrow$ *"Exportar copia de mi jardín"* / *"Importar copia de seguridad"*. | `Completa / Probada` |
| **Eliminación integral de cuenta** | Solo borrado parcial de claves sueltas. | Función atómica (`performFullAccountDeletion`) que elimina todas las claves locales, fotos locales, entradas de diario, logros y datos remotos de Firestore por usuario, cumpliendo con las directrices de Apple y Google Play. | Ajustes $\rightarrow$ *"Eliminar cuenta y datos del dispositivo"*. | `Completa / Probada` |
| **Facturación y EcoScan Pro** | Simulado en memoria con datos de prueba estáticos. | Arquitectura de producción RevenueCat (`billingService.ts`) con entitlement `EcoScan Pro`, soporte para `react-native-purchases` y sandbox seguro para Expo Go. | Ajustes $\rightarrow$ Plan $\rightarrow$ *"Ver Pro"* $\rightarrow$ Paywall con 7 días de prueba. | `Completa / Probada` |
| **Seguridad de mascotas (Modo Mascotas)** | Alertas dispersas sin persistencia ni filtros. | Preferencia `hasPets` en Ajustes, badge "Segura" / "Tóxica" en fichas, alerta preventiva al guardar plantas peligrosas y filtro rápido *"Seguras para mascotas 🐾"* en la Enciclopedia. | Ajustes $\rightarrow$ Activar *"Mascotas en el hogar"* $\rightarrow$ Enciclopedia $\rightarrow$ Tocar filtro de pata. | `Completa / Probada` |
| **Catálogo botánico** | Solo 11 especies locales de prueba. | **33 especies botánicas comunes** con fichas completas: origen biogeográfico, mapa de hábitat, cuidados de riego/luz, dificultades y taxonomía. | Abrir Enciclopedia o ejecutar `tests/fase6.test.mjs`. | `Completa / Probada` |
| **Accesibilidad universal y Modo Fácil** | Textos de 11–13 px que se rompían al escalar la fuente; contraste insuficiente en temas oscuros. | Interruptor único *"Modo fácil"* en Ajustes (+30% tamaño de fuente y botones $\ge 56$ pt), compatibilidad total con fuentes del sistema hasta el 200%, áreas táctiles $\ge 48 \times 48$ dp, contrastes WCAG AAA y etiquetas de accesibilidad completas. | Ajustes $\rightarrow$ Activar *"Modo fácil"*. Probar con TalkBack o VoiceOver. | `Completa / Probada` |
| **Lenguaje y mensajes de error** | Más de 20 `Alert.alert` crudos con mensajes técnicos ("mock", "Cloud Function"). | Eliminación del 100% de `Alert.alert` en favor de Toasts con acción de *"Deshacer"* (5 segundos) y BottomSheets accesibles. Cero tecnicismos: frases cotidianas y empáticas. | Regar una planta (Toast con Deshacer) o intentar borrar una planta (BottomSheet). | `Completa / Probada` |
| **Internacionalización (4 Idiomas)** | Solo Español e Inglés parcial. | **4 idiomas completos**: Español (`es`), Inglés (`en`), Portugués (`pt`) y Francés (`fr`), con selector persistente en Ajustes y fallback automático sin reinicio. | Ajustes $\rightarrow$ Idioma $\rightarrow$ Seleccionar Portugués o Francés. | `Completa / Probada` |
| **Deep Linking & Tablets** | Sin esquema configurado; UI solo para teléfono vertical. | Esquema `ecoscan://` (`ecoscan://planta/:plantId`), soporte oficial para tabletas (`supportsTablet: true`), y diseño responsivo adaptativo con `useWindowDimensions`. | Ejecutar `npx uri-scheme open "ecoscan://planta/monstera" --android`. | `Completa / Probada` |

---

## 2. Protocolo de Pruebas de Usabilidad

Para validar la experiencia en campo con usuarios reales, se aplican los siguientes protocolos verificables:

### A. Prueba de los 5 Segundos (Claridad Inmediata)
- **Pantalla Hoy**: El usuario comprende inmediatamente cuál es la tarea de hoy ("Regar Monstera") y cuál es el botón principal ("Ya la regué").
- **Pantalla Escáner**: Se identifican de un vistazo los dos modos: *"Identificar planta"* vs. *"Mi planta está enferma"*.
- **Ficha Botánica**: Nombre común, toxicidad para mascotas y la acción principal del día visibles sin hacer scroll.

### B. Prueba con Adultos Mayores y Niños (Los 4 Flujos sin Ayuda)
- **Flujo 1 (Identificar)**: Abrir $\rightarrow$ escanear/buscar $\rightarrow$ identificar $\rightarrow$ guardar en Mi Jardín.
- **Flujo 2 (Alta manual)**: Mi Jardín $\rightarrow$ (+) $\rightarrow$ escribir nombre, apodo y maceta $\rightarrow$ guardar.
- **Flujo 3 (Cuidar/Regar)**: Hoy $\rightarrow$ pulsar botón grande *"Ya la regué"* $\rightarrow$ opción de deshacer en 5 segundos.
- **Flujo 4 (Diagnosticar salud)**: Escáner (modo enferma) o Ficha $\rightarrow$ fotografiar hoja con daño $\rightarrow$ ver tratamiento ecológico y programar recordatorio.

### C. Prueba de Escala de Fuente del Sistema al 200%
- Ajustar la fuente del dispositivo al 200%.
- La barra de navegación inferior (`Tab Bar`) aumenta su altura sin truncar etiquetas.
- Las tarjetas de plantas envuelven el texto en varias líneas sin desbordar márgenes.
- Los botones interactivos conservan el tamaño táctil accesible.

### D. Prueba con Lector de Pantalla (TalkBack / VoiceOver)
- Todos los elementos interactivos cuentan con `accessibilityRole` semántico (`button`, `switch`, `header`).
- Anuncios dinámicos claros tras acciones clave ("Planta regada", "Planta identificada con 98 por ciento de certeza").
- Interruptores anuncian su estado activado/desactivado con `accessibilityState={{ checked }}`.

### E. Prueba en Modo Avión (Resiliencia Offline-First)
- Activando el Modo Avión (sin Wi-Fi ni red celular):
  1. Pantalla Hoy y Mi Jardín cargan instantáneamente desde la caché persistente.
  2. La búsqueda en la Enciclopedia funciona desconectada con las 33 especies locales.
  3. El botón *"Ya la regué"* y el deshacer funcionan de forma 100% local.
  4. La exportación e importación de respaldo JSON no requiere conexión a internet.

---

## 3. Resumen de Calidad y Métricas del Proyecto

- **TypeScript (`npx tsc --noEmit`)**: 0 errores en modo estricto.
- **Linter (`npx expo lint`)**: 0 errores, 0 advertencias.
- **Pruebas Automatizadas (`npm test`)**: 40 pruebas unitarias pasando (100% éxito).
- **Diagnóstico del SDK (`npx expo-doctor`)**: 21/21 verificaciones aprobadas sin incidentes.
- **Seguridad**: Reglas de Firestore por usuario (`request.auth.uid == userId`) en `firestore.rules`; 0 secretos o claves privadas expuestas en el cliente.
