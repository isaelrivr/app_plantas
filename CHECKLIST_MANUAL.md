# Checklist de Verificación Manual en Dispositivo (QA y Usabilidad)

Documento exhaustivo para pruebas manuales en dispositivos físicos (Android e iOS).
Ejecutar antes de enviar cada build a Google Play Console o Apple TestFlight.

---

## 1. Protocolos de Usabilidad Humana

### A. Prueba de los 5 Segundos (Claridad Inmediata)
- [ ] **Pantalla Hoy**: Al abrir la app, en menos de 5 segundos se debe identificar claramente cuál es la tarea principal ("Regar Monstera") y cuál es el botón principal ("Ya la regué").
- [ ] **Estado Vacío**: Sin plantas registradas, el botón principal debe ser obvio y enorme: "Escanea tu primera planta" y "o búscala por nombre".
- [ ] **Ficha de Planta**: Se debe ver en el primer pantallazo: nombre común, nombre botánico, badge de toxicidad ("Segura" o "Tóxica") y la tarjeta "Qué hacer hoy".

### B. Prueba con Adultos Mayores y Niños
- [ ] **Modo Fácil**: Ir a Ajustes $\rightarrow$ Activar "Modo fácil".
  - Todos los textos principales deben aumentar un 30% ($\ge 18$ sp).
  - Los botones interactivos deben medir $\ge 56$ pt de alto.
  - El contraste visual de las tarjetas y fuentes debe ser nítido y sin grises desvaídos.
- [ ] **Comprensión Infantil**: Iconografía directa (gota de agua 💧 para riego, sol ☀️ para iluminación, pata 🐾 para mascotas, corazón ❤️ para salud) sin jerga técnica confusa.

### C. Prueba de Escala de Fuente del Sistema al 200%
- [ ] En los ajustes de accesibilidad del sistema operativo, subir la fuente al 200%.
- [ ] Abrir EcoScan:
  - La barra inferior de pestañas (Tab Bar) debe aumentar su altura automáticamente (`minHeight: 88`) sin cortar el texto de "Hoy", "Mi Jardín", "Escanear", "Explorar" o "Yo".
  - Las tarjetas de plantas deben envolver el texto en varias líneas sin desbordar los bordes de la pantalla.
  - Los botones con icono deben acomodarse verticalmente o reducir proporcionalmente el espaciado sin romperse.

### D. Prueba con Lector de Pantalla (VoiceOver / TalkBack)
- [ ] Activar TalkBack (Android) o VoiceOver (iOS).
- [ ] Recorrer la pantalla Hoy:
  - El botón "Ya la regué" debe leerse como: *"Ya la regué, botón"*.
  - El botón de deshacer debe leerse como: *"Deshacer riego, botón"*.
- [ ] Recorrer la Enciclopedia:
  - La tarjeta de cada planta debe anunciar su nombre, especie y nivel de dificultad.
  - Los conmutadores ("Modo sin conexión", "Seguras para mascotas") deben anunciar su rol de interruptor y estado activado/desactivado (`accessibilityState={{ checked }}`).

### E. Prueba en Modo Avión (Resiliencia Offline-First)
- [ ] Poner el teléfono en Modo Avión (sin Wi-Fi ni datos móviles).
- [ ] Abrir la app:
  - La pantalla Hoy y Mi Jardín cargan al instante desde AsyncStorage.
  - El botón "Ya la regué" funciona sin error y guarda el estado localmente.
  - La Enciclopedia permite buscar entre las 33 especies locales sin fallar.
  - El clima muestra la última lectura guardada con su etiqueta de hora o fallback informativo sin quedarse en bucle de carga.
  - Exportar copia de seguridad en JSON funciona 100% desconectado.

---

## 2. Flujo Completo de Fases y Funcionalidades Nuevas

### Alta Manual de Plantas (Sin Cámara)
- [ ] Ir a **Mi Jardín** $\rightarrow$ Pulsar botón flotante **(+) "Añadir planta"**.
- [ ] Seleccionar **"Escribir nombre y cuidados"**.
- [ ] Escribir nombre común (ej. "Monstera"), apodo (ej. "Monty") y elegir maceta (ej. "Mediana").
- [ ] Adjuntar foto opcional desde la galería.
- [ ] Si se escribe una planta tóxica teniendo "Mascotas en el hogar" activado en Ajustes, comprobar que aparece el aviso preventivo de toxicidad antes de guardar.
- [ ] Pulsar **"Guardar planta"**: debe añadirse al jardín con su tarjeta, apodo y cuidados asignados.

### Riego Inteligente y Adaptativo
- [ ] Registrar una planta en maceta pequeña (`small`) y otra en maceta grande (`large`).
- [ ] Comprobar que el intervalo de la maceta pequeña es inferior al de la maceta grande.
- [ ] Simular o seleccionar ciudad con pronóstico de lluvia: verificar que la recomendación sugiere posponer el riego para evitar pudrición de raíces.
- [ ] En ola de calor ($> 30^\circ\text{C}$): verificar que sugiere adelantar el riego.

### Medidor de Luz Orientativo
- [ ] Abrir ficha de cualquier planta $\rightarrow$ Pulsar el icono de sol ☀️ en la cabecera o el botón *"Comprobar luz con la cámara"*.
- [ ] Debe abrirse el modal `LightMeterModal`.
- [ ] Probar los botones de ambiente rápido:
  - "Sombra" (~120 lx) $\rightarrow$ Barra azul, aviso de poca luz.
  - "Luz filtrada" (~550 lx) $\rightarrow$ Barra verde, diagnóstico óptimo para plantas de interior.
  - "Sol directo" (~1400 lx) $\rightarrow$ Barra naranja, advertencia sobre hojas sensibles.
- [ ] Comprobar que el consejo botánico coincide con la iluminación recomendada de la especie activa.

### Compartir Ficha Botánica
- [ ] En la ficha botánica, pulsar el icono de compartir en la cabecera.
- [ ] Debe abrirse `ShareCardModal` con la vista previa de la tarjeta: foto, nombre común, nombre botánico, badge de toxicidad para mascotas y requerimientos de riego/luz.
- [ ] Pulsar "Compartir con amigos": debe desplegarse el menú nativo de compartir (`Share.share`) de iOS/Android con el texto formateado.

### Respaldo e Importación de Datos
- [ ] Ir a **Ajustes** $\rightarrow$ **"Exportar copia de mi jardín"**.
  - Debe desplegar la hoja nativa para copiar o compartir el JSON completo.
- [ ] Ir a **"Importar copia de seguridad"**:
  - Pegar un JSON válido $\rightarrow$ Pulsar "Restaurar mi jardín" $\rightarrow$ Debe mostrar Toast de confirmación con el total de plantas recuperadas y refrescar el jardín.
  - Pegar un texto corrupto o inválido $\rightarrow$ Debe rechazarlo con mensaje de error claro y sin cerrar la aplicación.

### Eliminación Integral de Cuenta y Datos
- [ ] Ir a **Ajustes** $\rightarrow$ **"Eliminar cuenta y datos del dispositivo"**.
- [ ] Aparece el modal de confirmación destructiva con aviso de que no se puede deshacer.
- [ ] Confirmar eliminación:
  - Deben borrarse todas las plantas, historial de diario, fotos reconciliadas, logros, caché y ajustes.
  - La app debe quedar como en su primera apertura limpia.

### Internacionalización (4 Idiomas)
- [ ] Ir a **Ajustes** $\rightarrow$ **"Idioma"**:
  - Cambiar a **English**: toda la interfaz cambia al inglés ("Today", "My Garden", "Scan", etc.).
  - Cambiar a **Português**: toda la interfaz cambia al portugués ("Hoje", "Meu Jardim", etc.).
  - Cambiar a **Français**: toda la interfaz cambia al francés ("Aujourd'hui", "Mon Jardin", etc.).
  - Volver a **Español**: traducción inmediata sin reiniciar la aplicación.

### Deep Linking
- [ ] Ejecutar comando de enlace profundo desde la terminal o navegador:
  ```bash
  npx uri-scheme open "ecoscan://planta/monstera" --android
  ```
- [ ] La aplicación debe abrirse y navegar directamente a la ficha botánica de la Monstera Deliciosa.
