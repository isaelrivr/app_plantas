# Checklist de Verificación Manual en Dispositivo (QA y Usabilidad)

Documento exhaustivo para pruebas manuales en dispositivos físicos (Android e iOS).
Ejecutar antes de enviar cada build a Google Play Console o Apple TestFlight.

---

## 1. Protocolos de Usabilidad Humana (Requisitos Esenciales)

### A. Prueba de los 5 Segundos (Claridad Inmediata por Pantalla)
*Objetivo: Cualquier persona (de 8 a 80 años) debe comprender la acción principal de la pantalla en menos de 5 segundos.*

- [ ] **Pantalla Hoy**:
  - Al abrir la app con plantas pendientes: en < 5 s se visualiza la tarjeta grande *"Regar [Nombre]"* y el botón primario *"Ya la regué"*.
  - Al abrir sin plantas (estado vacío): en < 5 s se visualiza el botón gigante *"Escanea tu primera planta"* y el enlace *"o búscala por nombre"*.
  - En la cabecera superior: acceso directo inmediato al calendario con el icono 📅.
- [ ] **Pantalla Mi Jardín**:
  - En < 5 s se reconocen las plantas guardadas, su estado en una sola palabra (*"Necesita agua"*, *"Todo bien"*) y el botón (+) destacado para añadir planta.
- [ ] **Pantalla Escáner**:
  - En < 5 s se distingue el selector superior de dos modos:
    1. *"Identificar planta"* (icono de hoja verde, retícula botánica).
    2. *"Mi planta está enferma"* (icono médico naranja, retícula de diagnóstico).
  - El botón disparador central (82 dp) muestra el icono correspondiente al modo activo.
- [ ] **Pantalla Explorar / Enciclopedia**:
  - En < 5 s se ubican la barra de búsqueda instantánea y los filtros rápidos de un toque (*"Mis plantas"*, *"Seguras para mascotas 🐾"*).
- [ ] **Ficha Botánica de Planta**:
  - En el primer pantallazo (sin scroll): foto hero, nombre común, nombre botánico en cursiva, badge de toxicidad para mascotas y la tarjeta de acción principal *"Qué hacer hoy"*.
  - En la esquina inferior derecha: botón flotante *"Preguntar"* para resolver dudas botánicas al instante.
- [ ] **Diagnóstico Fitosanitario**:
  - Muestra inmediatamente el porcentaje de certeza, diagnóstico principal (*Roya*, *Trips*, etc.), nivel de gravedad y alternador *"Tratamiento Ecológico"* vs. *"Tratamiento Químico"*.
- [ ] **Calendario de Cuidados**:
  - Visualización limpia por días de la semana con puntos de colores según el tipo de tarea (riego, fertilizante, poda).
- [ ] **Perfil y Ajustes ("Yo")**:
  - En < 5 s se distinguen los accesos a *"Mis Logros y Medallas"*, *"Copia de seguridad y sincronización"* y el interruptor destacado *"Modo fácil"*.

---

### B. Prueba con Adultos Mayores y Niños (Los 4 Flujos Principales sin Ayuda)
*Criterio de éxito: Tanto un adulto mayor (70+ años) como un niño (8+ años) deben completar cada flujo de punta a punta sin requerir explicaciones externas.*

#### Flujo 1: Abrir $\rightarrow$ Escanear / Buscar $\rightarrow$ Identificar $\rightarrow$ Guardar
- [ ] **Adulto Mayor**:
  1. Abre la app en la pantalla Hoy $\rightarrow$ Toca la pestaña central *"Escanear"* o el botón *"Escanea tu primera planta"*.
  2. Apunta a la planta y pulsa el botón disparador grande (82 dp).
  3. En la tarjeta de resultado, lee el nombre en letra grande ($\ge 20$ sp) con certeza legible (*"98% de certeza"*).
  4. Toca *"Guardar en Mi Jardín"*. Recibe confirmación visual (Toast) y vibración háptica suave.
- [ ] **Niño**:
  1. Abre la pestaña *"Explorar"* $\rightarrow$ Escribe el nombre o toca una tarjeta ilustrada con emoji.
  2. Toca *"Guardar en Mi Jardín"*.

#### Flujo 2: Alta Manual de Plantas (Sin Cámara, con Maceta y Apodo)
- [ ] **Adulto Mayor**:
  1. Va a **Mi Jardín** $\rightarrow$ Toca el botón flotante **(+) "Añadir planta"**.
  2. Selecciona **"Escribir nombre y cuidados"**.
  3. Escribe el nombre (ej. *"Monstera"*), un apodo cariñoso (ej. *"Monty"*) y selecciona el tamaño de maceta tocando una opción clara (*Pequeña*, *Mediana*, *Grande*, *Jardinera*).
  4. Si tiene activado "Mascotas en el hogar" y la planta es tóxica, observa el aviso amarillo preventivo antes de confirmar.
  5. Pulsa el botón grande *"Guardar planta"*. La planta aparece de inmediato en su jardín con su tiesto y cuidados calculados.
- [ ] **Niño**:
  1. Realiza el alta manual eligiendo su emoji favorito y escribiendo el apodo de su planta en su habitación.

#### Flujo 3: Cuidar / Regar ("Ya la regué") con Opción de Deshacer
- [ ] **Adulto Mayor**:
  1. En la pantalla **Hoy**, ve la tarjeta *"Regar Monstera"*.
  2. Toca el botón grande verde *"Ya la regué"*.
  3. La tarjeta se marca como completada con animación suave.
  4. Aparece un mensaje inferior (Toast) con botón *"Deshacer"* visible durante 5 segundos.
  5. Toca *"Deshacer"*: el estado de riego se revierte inmediatamente sin penalización.
  6. Si lo deja pasar, la racha diaria de cuidados se incrementa automáticamente.
- [ ] **Niño**:
  1. Pulsa *"Ya la regué"*, ve aumentar el contador de racha con el icono de fuego 🔥 y desbloquea el logro de jardinero novato.

#### Flujo 4: Diagnosticar Hoja Enferma / Consultar Tratamientos
- [ ] **Adulto Mayor**:
  1. Va a la pestaña **Escanear** $\rightarrow$ Toca la opción *"Mi planta está enferma"* en el selector superior.
  2. Lee la guía contextual: *"Acércate a la hoja con manchas, plagas o daño visible"*.
  3. Toma la foto de la hoja afectada con el disparador naranja.
  4. Se abre la pantalla de diagnóstico fitosanitario con el nombre del problema en lenguaje cotidiano (sin jerga técnica incomprensible).
  5. Cambia al tratamiento ecológico (remedios caseros como jabón potásico) y pulsa *"Recordarme aplicar tratamiento"*.
- [ ] **Niño**:
  1. Desde la ficha de su planta, toca el botón flotante *"Preguntar"* $\rightarrow$ En el Asistente botánico selecciona una pregunta rápida: *"¿Por qué tiene hojas amarillas?"* y recibe una respuesta clara en frases cortas.

---

### C. Prueba de Escala de Fuente del Sistema al 200% (Accesibilidad Visual)
- [ ] En los ajustes de accesibilidad de iOS/Android, configurar el tamaño de texto del sistema al máximo (+200%).
- [ ] Abrir EcoScan y verificar:
  - **Barra inferior de navegación (Tab Bar)**: Aumenta su altura dinámicamente (`minHeight: 88 dp`) sin cortar las etiquetas de *"Hoy"*, *"Mi Jardín"*, *"Escanear"*, *"Explorar"* ni *"Yo"*.
  - **Tarjetas de planta**: Los textos envuelven en múltiples líneas fluidamente sin desbordar los bordes de la pantalla.
  - **Botones interactivos**: Ningún texto se trunca con puntos suspensivos ("..."); los contenedores crecen verticalmente respetando el área táctil mínima.
  - **Modo Fácil**: Al activar *"Modo fácil"* en Ajustes con fuente al 200%, la interfaz se mantiene usable, legible y proporcionada para personas con baja visión.

---

### D. Prueba con Lector de Pantalla (VoiceOver en iOS / TalkBack en Android)
- [ ] Activar TalkBack (Android) o VoiceOver (iOS).
- [ ] Navegar pantalla por pantalla con gestos de deslizamiento:
  - **Roles semánticos**: Todos los elementos interactivos se identifican como botones (`accessibilityRole="button"`), encabezados (`accessibilityRole="header"`) o interruptores (`accessibilityRole="switch"`).
  - **Pantalla Hoy**:
    - El botón de riego se vocaliza como: *"Ya la regué, botón"*.
    - El botón de deshacer se vocaliza como: *"Deshacer riego, botón"*.
    - El resumen del clima anuncia: *"Madrid, 22 grados, soleado"*.
  - **Pantalla Escáner**:
    - El selector superior anuncia: *"Identificar planta, botón, seleccionado"* o *"Mi planta está enferma, botón, no seleccionado"*.
    - El disparador anuncia: *"Capturar foto de la planta, botón"* o *"Diagnosticar hoja enferma, botón"*.
  - **Ficha botánica**:
    - Los badges anuncian: *"Segura para mascotas"* o *"Tóxica para mascotas, precaución"*.
    - El botón flotante anuncia: *"Pregúntale a EcoScan, botón"*.
  - **Ajustes**:
    - Los interruptores anuncian su estado activado/desactivado (`accessibilityState={{ checked }}`).

---

### E. Prueba en Modo Avión (Resiliencia Offline-First en los 4 Flujos)
- [ ] Activar el **Modo Avión** en el dispositivo (sin Wi-Fi ni red celular).
- [ ] Ejecutar los 4 flujos principales desconectado:
  1. **Flujo 1**: Abrir la app $\rightarrow$ La pantalla Hoy y Mi Jardín cargan instantáneamente desde la caché persistente de AsyncStorage. La búsqueda en la Enciclopedia funciona 100% desconectada buscando en el catálogo local de 33 especies.
  2. **Flujo 2**: Dar de alta una planta manualmente con foto de la galería $\rightarrow$ Se guarda correctamente en disco local sin requerir red.
  3. **Flujo 3**: Tocar *"Ya la regué"* $\rightarrow$ Se actualiza el estado, se agenda la próxima fecha de riego localmente, la racha suma y el botón de deshacer funciona en local.
  4. **Flujo 4**: Abrir el comparador antes/después del diario de crecimiento o consultar una ficha previamente vista $\rightarrow$ Todo el contenido e imágenes persistidas se visualizan de inmediato.
  5. **Copia de seguridad local**: Ir a Ajustes $\rightarrow$ *"Exportar copia de mi jardín"* $\rightarrow$ Genera el archivo JSON completo sin conexión.

---

## 2. Checklist de Funcionalidades Profesionales (Fase 6)

### Widget de Pantalla de Inicio ("Hoy toca regar...")
- [ ] Ir a **Ajustes** $\rightarrow$ Sección **"Widget de pantalla de inicio"**.
- [ ] Verificar la tarjeta interactiva de vista previa con su estado en vivo:
  - Si hay plantas pendientes: muestra el nombre de la planta, días sin regar y botón *"Regar ahora"* con deep link a `ecoscan://planta/:id`.
  - Si todas están regadas: muestra mensaje verde *"¡Todo al día! Jardín hidratado"*.
- [ ] Probar el botón *"Actualizar datos del widget"* $\rightarrow$ Muestra confirmación Toast inmediata.

### Cuenta Opcional (Firebase Auth) y Sincronización en la Nube
- [ ] Ir a **Ajustes** $\rightarrow$ Tocar *"Iniciar sesión o respaldar en la nube"*.
- [ ] Se abre el modal `AuthModal`:
  - Registrar nueva cuenta con correo y contraseña.
  - Probar acceso como invitado (*"Continuar como invitado"*).
  - Tocar *"Sincronizar ahora con la nube"*: sincronización bidireccional con Firestore (`users/{userId}`) sin duplicar plantas.

### Medidor de Luz Orientativo
- [ ] En la ficha de una planta, tocar el icono de sol ☀️ o *"Comprobar luz con la cámara"*.
- [ ] Probar los botones de calibración rápida:
  - *Sombra* (120 lx) $\rightarrow$ Advertencia de poca luz si la especie requiere sol.
  - *Luz filtrada* (550 lx) $\rightarrow$ Diagnóstico óptimo para plantas tropicales de interior.
  - *Sol directo* (1400 lx) $\rightarrow$ Advertencia sobre hojas sensibles en plantas de sombra.
- [ ] El diagnóstico botánico se adapta a la iluminación específica recomendada para la planta activa.

### Compartir Ficha de Planta y Logros
- [ ] **Ficha de Planta**: Tocar el icono de compartir $\rightarrow$ Se despliega `ShareCardModal` con vista previa estilizada y botón nativo `Share.share`.
- [ ] **Logros**:
  - En la cabecera de *"Mis Logros y Medallas"*, tocar el icono de compartir $\rightarrow$ Comparte racha y total de medallas desbloqueadas.
  - En cada tarjeta de logro desbloqueado, tocar *"Compartir"* $\rightarrow$ Comparte la medalla específica con su descripción.

### Eliminación Integral de Cuenta y Datos
- [ ] En **Ajustes**, tocar *"Eliminar cuenta y datos del dispositivo"*.
- [ ] Se presenta el diálogo de confirmación destructiva.
- [ ] Confirmar: se limpian todas las claves de almacenamiento local, fotos persistidas, entradas de diario, logros y datos remotos en Firestore.

### Internacionalización a 4 Idiomas (ES, EN, PT, FR)
- [ ] En **Ajustes** $\rightarrow$ **Idioma**:
  - Cambiar a **English**: Toda la app cambia a inglés (*Today*, *My Garden*, *Scan*, *Explore*, *Me*).
  - Cambiar a **Português**: Toda la app cambia a portugués (*Hoje*, *Meu Jardim*, *Escanear*, *Explorar*, *Eu*).
  - Cambiar a **Français**: Toda la app cambia a francés (*Aujourd'hui*, *Mon Jardin*, *Scanner*, *Explorer*, *Moi*).
  - Cambiar a **Español**: Retorno fluido al español sin reinicio.

### Deep Linking
- [ ] Probar enlace profundo desde la terminal:
  ```bash
  npx uri-scheme open "ecoscan://planta/monstera" --android
  ```
- [ ] La aplicación se abre y navega directamente a la ficha botánica de la especie solicitada.
