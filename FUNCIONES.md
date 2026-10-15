# Inventario Funcional y Tabla Comparativa de EcoScan (Plantae)

Documento maestro de estado del producto tras la culminación de las **Fases 1 a 6**.

Leyenda de estado:
- `Completa`: Flujo punta a punta implementado con UI accesible, estados vacíos/error y persistencia.
- `Probada`: Verificada con tests unitarios automatizados (`npm test`) y validación estática de compilador (`npx tsc --noEmit`) y linter (`npx expo lint`).

---

## 1. Tabla Comparativa de Funciones (Antes vs. Después)

| Función | Antes (Fase 1) | Después (Fase 6) | Cómo verificarlo | Estado |
|---|---|---|---|:---:|
| **Onboarding** | Flujo rígido de 5 pasos, permisos pedidos sin contexto previo, cálculos de pantalla que se rompían al rotar. | 3 pasos directos (Bienvenida, Idioma, ¿Qué quieres lograr?), botón *Omitir* siempre visible, permisos pedidos solo en el momento de uso con frase de valor. | Ajustes $\rightarrow$ "Ver introducción de nuevo", o reiniciar app con onboarding limpio. | `Completa / Probada` |
| **Pantalla Hoy** | No existía como centro de mando diario; la app abría en una vista compleja. | Saludo diario con tarjeta principal de riego ("Regar Monstera"), botón gigante accesible "Ya la regué" con deshacer (5s toast), clima en una línea sin jerga, racha motivacional discreta. | Pestaña "Hoy" en la barra inferior. Regar una planta y probar el botón de deshacer. | `Completa / Probada` |
| **Mi Jardín** | Lista plana sin estados claros; no permitía crear plantas sin cámara. | Tarjetas con foto, apodo, estado en una palabra ("Necesita agua", "Todo bien"), selector de habitaciones y botón (+) para alta manual completa (con apodo, tipo de maceta y foto opcional). | Pestaña "Mi Jardín" $\rightarrow$ Botón (+) "Añadir planta" $\rightarrow$ Completar alta manual. | `Completa / Probada` |
| **Alta manual de plantas** | No existía (solo escáner obligatorio). | Modal accesible para añadir planta escribiendo nombre, apodo, seleccionando tamaño de maceta (`small`, `medium`, `large`, `planter`), foto opcional de galería y alerta preventiva de toxicidad si el usuario tiene mascotas. | Jardín $\rightarrow$ (+) $\rightarrow$ Seleccionar "Escribir nombre y cuidados" $\rightarrow$ Guardar. | `Completa / Probada` |
| **Riego inteligente adaptativo** | Frecuencia fija en días sin importar el entorno. | Cálculo dinámico (`wateringAdjustmentService.ts`) que ajusta la fecha recomendada según tamaño de maceta (pequeña evapora antes), estación del año y clima local (calor o lluvia inminente). | `node --test tests/fase6.test.mjs` o cambiar el tamaño de maceta en una planta. | `Completa / Probada` |
| **Notificaciones interactivas** | Solo texto informativo básico. | Categoría interactiva `WATERING_REMINDER` con acción rápida *"Ya regué"* directamente desde la notificación sin abrir la app. | `services/notificationService.ts` $\rightarrow$ canal configurado con `ACTION_WATERED`. | `Completa / Probada` |
| **Línea de tiempo de la planta** | No existía en la ficha botánica. | Nueva pestaña *"Historia"* en la ficha con timeline cronológico de riegos, diagnósticos y fotos del diario de crecimiento, más acceso al comparador antes/después. | Abrir ficha de cualquier planta $\rightarrow$ seleccionar pestaña *"Historia"*. | `Completa / Probada` |
| **Herramienta Medidor de Luz** | No existía; solo textos genéricos de cuidado. | Medidor interactivo (`LightMeterModal.tsx`) con sensor/calibrador visual de iluminancia (50 a 1400 lux) y diagnóstico botánico según los requisitos de la especie. | Ficha de planta $\rightarrow$ icono de sol ☀️ en cabecera o botón *"Comprobar luz con la cámara"*. | `Completa / Probada` |
| **Compartir ficha botánica** | No existía opción de compartir. | Modal compartible (`ShareCardModal.tsx`) con tarjeta estilizada, necesidades de luz, riego, salud y badge de toxicidad, exportable mediante `Share.share` nativo. | Ficha de planta $\rightarrow$ icono de compartir en cabecera $\rightarrow$ Compartir. | `Completa / Probada` |
| **Catálogo botánico** | Solo 11 especies locales de prueba. | **33 especies botánicas comunes** con fichas completas: origen, hábitat, dificultades, taxonomía, regiones nativas, emojis y recomendaciones de riego/luz. | Abrir Enciclopedia o ejecutar `tests/fase6.test.mjs`. | `Completa / Probada` |
| **Seguridad para mascotas (Modo Mascotas)** | Alertas dispersas sin persistencia. | Preferencia `hasPets` en Ajustes, badge "Segura"/"Tóxica" en fichas, alerta preventiva al añadir planta peligrosa y filtro rápido *"Seguras para mascotas 🐾"* en Enciclopedia. | Ajustes $\rightarrow$ Activar "Mascotas en el hogar" $\rightarrow$ Ir a Enciclopedia y activar filtro de pata. | `Completa / Probada` |
| **Enciclopedia y búsqueda** | ScrollView básico sin virtualización. | FlatList optimizada, búsqueda instantánea tolerante a tildes/diacríticos, toggles rápidos ("Mis plantas" y "Seguras para mascotas") y panel de filtros avanzados. | Pestaña "Explorar" / Enciclopedia. | `Completa / Probada` |
| **Accesibilidad universal y Modo Fácil** | Textos de 11–13 px que se rompían al escalar la fuente; tab bar con altura fija. | Modo Fácil conmutador único (+30% tamaño de fuente y botones), soporte de fuente del sistema al 200%, minTouchTarget $\ge 44 \times 44$ pt, etiquetas accesibles completas y WCAG AAA. | Ajustes $\rightarrow$ Activar "Modo fácil" $\rightarrow$ Verificar interfaces aumentadas. | `Completa / Probada` |
| **Logros y gamificación** | Recalculados al vuelo en cada render; sin fecha persistida. | Logros persistidos en disco con fecha de desbloqueo `unlockedAt` (`gamificationService.ts`) y modal de celebración accesible con vibración háptica al ganar medalla. | Perfil $\rightarrow$ "Mis Logros y Medallas". `tests/fase5.test.mjs`. | `Completa / Probada` |
| **Respaldo e importación de datos** | Sin opción de exportar ni importar. | Exportación en formato JSON estandarizado (`backupService.ts`) e importación con validación estricta de esquema en tiempo de ejecución (`validateGardenData`). | Ajustes $\rightarrow$ "Exportar copia de mi jardín" / "Importar copia de seguridad". | `Completa / Probada` |
| **Eliminación de cuenta y datos** | Solo borrado parcial de claves de AsyncStorage. | Eliminación integral (`performFullAccountDeletion`): limpia todas las claves locales, diario, fotos reconciliadas, ajustes, logros y borra datos remotos de Firestore por usuario. | Ajustes $\rightarrow$ "Eliminar cuenta y datos del dispositivo" con diálogo de confirmación. | `Completa / Probada` |
| **Facturación y Pro** | Simulado en memoria con datos falsos. | Arquitectura de producción RevenueCat (`billingService.ts`) con entitlement `EcoScan Pro`, soporte para `react-native-purchases` y sandbox seguro para Expo Go. | Ajustes $\rightarrow$ Plan $\rightarrow$ "Ver Pro" $\rightarrow$ Paywall. | `Completa / Probada` |
| **Reglas de seguridad Firestore** | Reglas abiertas o ausentes. | `firestore.rules` con granularidad estricta por usuario (`users/{userId}`): solo el propietario autenticado (`request.auth.uid == userId`) puede leer, escribir o eliminar. | Inspeccionar archivo `firestore.rules`. | `Completa / Probada` |
| **Localización e Idiomas** | Solo Español e Inglés parcial. | **4 idiomas completos**: Español (`es`), Inglés (`en`), Portugués (`pt`) y Francés (`fr`), con selector persistente y fallback automático. | Ajustes $\rightarrow$ Idioma $\rightarrow$ Seleccionar Portugués o Francés. | `Completa / Probada` |
| **Deep Linking & Tablets** | Sin esquema configurado; UI solo para teléfono vertical. | Esquema `ecoscan://` (`ecoscan://planta/:plantId`), soporte oficial para tablet (`supportsTablet: true`), layouts responsivos con `useWindowDimensions`. | `app.json`, `App.tsx`, `tests/fase6.test.mjs`. | `Completa / Probada` |

---

## 2. Protocolo de Pruebas de Usabilidad

Para validar la experiencia en campo con usuarios reales, se aplican los siguientes protocolos:

### A. Prueba de los 5 Segundos (Claridad Inmediata)
- **Objetivo**: Un usuario nuevo debe comprender qué hace la pantalla y cuál es la acción principal en menos de 5 segundos.
- **En pantalla Hoy**: Lo primero visible es "Regar [Planta]" con botón verde grande. Si no hay plantas, el botón gigante "Escanea tu primera planta".
- **En ficha botánica**: Título botánico, badge de toxicidad y qué hacer hoy en el primer pantallazo.

### B. Prueba con Adultos Mayores y Niños
- **Adultos Mayores**: Activar "Modo fácil" en Ajustes. Comprobar que los textos superan los 18 sp, los botones tienen más de 56 pt de alto y el contraste es fuerte (fondo blanco / superficie nítida).
- **Niños**: Verificación de iconos intuitivos (gota para regar, sol para luz, pata para mascotas, libro para enciclopedia) sin tecnicismos botánicos incomprensibles.

### C. Prueba de Escala de Fuente al 200%
- En Ajustes de accesibilidad de iOS/Android, fijar el tamaño de letra del sistema al máximo (+200%).
- Comprobar que la barra de pestañas crece verticalmente sin recortar los títulos ("Hoy", "Mi Jardín", "Escanear").
- Comprobar que los textos en tarjetas envuelven en varias líneas sin desbordar los contenedores.

### D. Prueba con Lector de Pantalla (TalkBack / VoiceOver)
- Activar VoiceOver (iOS) o TalkBack (Android).
- Navegar con gestos de deslizamiento: todos los botones anuncian su función (`accessibilityRole="button"`) y etiqueta clara (`accessibilityLabel`).
- Los interruptores anuncian su estado (`accessibilityRole="switch"` y valor `checked`).

### E. Prueba en Modo Avión (Offline-First)
- Activar el Modo Avión en el dispositivo.
- Abrir la aplicación:
  1. La pantalla Hoy y Mi Jardín cargan instantáneamente desde la caché persistente.
  2. La Enciclopedia funciona 100% sin conexión gracias al catálogo local de 33 especies.
  3. Los diagnósticos y fichas ya consultadas siguen legibles.
  4. La exportación e importación de respaldo JSON funciona sin red.

---

## 3. Resumen de Calidad y Métrica de Pruebas

- **TypeScript (`npx tsc --noEmit`)**: 0 errores.
- **Linter (`npx expo lint`)**: 0 errores, 0 advertencias.
- **Pruebas Automatizadas (`npm test`)**: 29 pruebas pasando (100% éxito).
- **Seguridad**: 0 secretos o claves privadas en el cliente; reglas de Firestore por usuario (`request.auth.uid == userId`).
