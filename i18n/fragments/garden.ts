/** Traducciones al inglés: Jardín y calendario. Clave = texto fuente en español. */
const fragment: Record<string, string> = {
  // ── Pantalla Mi Jardín (GardenScreen) ──────────────────────────────
  '🔔 Notificación Programada': '🔔 Notification Scheduled',
  'Recibirás un recordatorio para regar tu {planta} cada {dias} días.':
    'You will receive a reminder to water your {planta} every {dias} days.',
  'Aviso': 'Notice',
  'Activa los permisos de notificaciones para recibir alertas de riego.':
    'Enable notification permissions to receive watering alerts.',
  'Recomendaciones de clima y ubicación, exclusivo para usuarios Premium':
    'Weather and location recommendations, exclusive to Premium users',
  'Recomendaciones por Clima y GPS': 'Weather & GPS Recommendations',
  'Exclusivo Pro': 'Pro Only',
  'Conecta tu ubicación con satélites meteorológicos en tiempo real (Open-Meteo) para ajustar automáticamente el riego según lluvia, frío o calor extremo.':
    'Connect your location to real-time weather satellites (Open-Meteo) to automatically adjust watering based on rain, cold, or extreme heat.',
  'Desbloquear con Plantae Pro ({precio})': 'Unlock with Plantae Pro ({precio})',
  'Cargando pronóstico del clima': 'Loading weather forecast',
  'Sincronizando pronóstico Open-Meteo para tu ciudad...':
    'Syncing Open-Meteo forecast for your city...',
  'No pudimos conectar con tu ubicación. Mostramos datos de respaldo: activa el GPS o revisa tu conexión para obtener recomendaciones reales.':
    "We couldn\'t connect to your location. Showing fallback data: enable GPS or check your connection for real recommendations.",
  'Clima en {ciudad}: {temperatura} grados, {alerta}':
    'Weather in {ciudad}: {temperatura} degrees, {alerta}',
  'Datos de respaldo': 'Fallback data',
  'Consejo de hoy: {consejo}': "Today's tip: {consejo}",
  'Ver detalles de {nombre}': 'View details for {nombre}',
  'Hidratada hoy': 'Watered today',
  'Cada {dias} días': 'Every {dias} days',
  'Salud de {nombre}: {puntuacion} por ciento. Toca para diagnosticar.':
    'Health of {nombre}: {puntuacion} percent. Tap to diagnose.',
  'Salud': 'Health',
  'Plan de cuidados:': 'Care plan:',
  '{tarea}, {fecha}, {estado}': '{tarea}, {fecha}, {estado}',
  'completada': 'completed',
  'pendiente': 'pending',
  'Toca para marcar o desmarcar esta tarea': 'Tap to mark or unmark this task',
  'Volver a regar': 'Water again',
  'Marcar como regada hoy': 'Mark as watered today',
  'Regada': 'Watered',
  'Regar hoy': 'Water today',
  'Diagnosticar salud de {nombre}': 'Diagnose health of {nombre}',
  'Programar recordatorios para {nombre}': 'Schedule reminders for {nombre}',
  'Ver ficha completa de {nombre}': 'View full profile for {nombre}',
  'Sin zona': 'No zone',
  'planta': 'plant',
  'plantas': 'plants',
  'Mi Jardín': 'My Garden',
  '{n} plantas bajo tu cuidado': '{n} plants in your care',
  'Identificar nueva planta con la cámara': 'Identify a new plant with the camera',
  'Abrir {seccion}': 'Open {seccion}',
  'Mis Especies Registradas': 'My Registered Species',
  'Organizar plantas por zona': 'Organize plants by zone',
  'Organizar zonas': 'Organize zones',
  'Restablecer las plantas de ejemplo del jardín (solo desarrollo)':
    'Reset the garden sample plants (development only)',
  'Restablecer': 'Reset',
  'Tu jardín está esperando': 'Your garden is waiting',
  'Escanea o fotografía tu primera planta para comenzar a monitorear su salud, calendario de riego y origen biogeográfico.':
    'Scan or photograph your first plant to start monitoring its health, watering schedule, and biogeographic origin.',
  'Escanear primera planta': 'Scan your first plant',
  'Cargando tus plantas': 'Loading your plants',
  'Organizar por zonas': 'Organize by zones',
  'Cerrar': 'Close',
  '1. Elige una planta · 2. Asigna su zona': '1. Choose a plant · 2. Assign its zone',
  'Planta {nombre}': 'Plant {nombre}',
  'Asignar a {zona}, {n} plantas': 'Assign to {zona}, {n} plants',
  'Eliminar zona {zona}': 'Delete zone {zona}',
  'Nueva zona (ej. Baño)...': 'New zone (e.g. Bathroom)...',
  'Nombre de la nueva zona': 'New zone name',
  'Crear zona': 'Create zone',

  // ── Accesos rápidos (GardenScreen) ─────────────────────────────────
  'Enciclopedia': 'Encyclopedia',
  'Asistente': 'Assistant',
  'Logros': 'Achievements',
  'Calendario': 'Calendar',

  // ── Nombres de zonas por defecto ───────────────────────────────────
  'Sala': 'Living Room',
  'Dormitorio': 'Bedroom',
  'Cocina': 'Kitchen',
  'Balcón': 'Balcony',
  'Oficina': 'Office',

  // ── Tareas de cuidado por defecto ──────────────────────────────────
  'Riego profundo de sustrato': 'Deep substrate watering',
  'Abono líquido equilibrado': 'Balanced liquid fertilizer',
  'Limpieza de hojas basales': 'Lower leaf cleanup',
  'Riego de recuperación': 'Recovery watering',
  'Poda de brote apical': 'Apical bud pruning',
  'Riego mensual ligero': 'Light monthly watering',
  'Cambio a maceta de barro': 'Repot into clay pot',
  'Riego regular de superficie': 'Regular surface watering',
  'Humus de lombriz': 'Vermicompost',
  'Riego regular': 'Regular watering',
  'Nutrición foliar': 'Foliar feeding',

  // ── Pantalla Plan de Cuidados (CareCalendarScreen) ─────────────────
  '🔔 Recordatorio Programado': '🔔 Reminder Scheduled',
  'Recibirás una notificación para regar "{planta}" en tu dispositivo.':
    'You will receive a notification to water "{planta}" on your device.',
  'Activa las notificaciones de Plantae en los Ajustes de tu dispositivo para recibir recordatorios de riego.':
    'Enable Plantae notifications in your device Settings to receive watering reminders.',
  'Se avisará "{tarea}" para {planta} en {dias} día(s).':
    'You will be reminded of "{tarea}" for {planta} in {dias} day(s).',
  'No se pudo programar el recordatorio. Revisa los permisos de notificación.':
    "Couldn't schedule the reminder. Check notification permissions.",
  'Completado ✓': 'Completed ✓',
  'Marcar "{tarea}" como {estado}': 'Mark "{tarea}" as {estado}',
  'Programar recordatorio para "{tarea}"': 'Schedule reminder for "{tarea}"',
  'Ver diagnóstico de salud de {nombre}': 'View health diagnosis for {nombre}',
  'Sin diagnóstico reciente': 'No recent diagnosis',
  'Plan de Cuidados': 'Care Plan',
  'Calendario inteligente de tareas botánicas': 'Smart calendar of botanical tasks',
  'Puntuación de Salud': 'Health Score',
  'Semana': 'Week',
  'Mes': 'Month',
  'Ver calendario por {vista}': 'View calendar by {vista}',
  'Período anterior': 'Previous period',
  'Período siguiente': 'Next period',
  'Día {dia}, {n} tareas': 'Day {dia}, {n} tasks',
  'Día {dia}': 'Day {dia}',
  'Quitar filtro de día': 'Clear day filter',
  'Tareas Pendientes': 'Pending Tasks',
  '🌿 Todas': '🌿 All',
  '💧 Riego': '💧 Watering',
  '🌱 Fertilizante': '🌱 Fertilizer',
  '✂️ Poda': '✂️ Pruning',
  '🪴 Trasplante': '🪴 Repotting',
  'Filtrar por {filtro}': 'Filter by {filtro}',
  '¡Todo al día!': 'All caught up!',
  'No hay tareas pendientes para el día seleccionado. Toca de nuevo el día o quita el filtro para ver el resto.':
    'There are no pending tasks for the selected day. Tap the day again or clear the filter to see the rest.',
  'No hay tareas pendientes con el filtro seleccionado. ¡Tu jardín está perfectamente cuidado!':
    'There are no pending tasks with the selected filter. Your garden is perfectly cared for!',
  'Completadas Recientemente ✓': 'Recently Completed ✓',
  'Programar Recordatorios': 'Schedule Reminders',
  'Riego cada {dias} días': 'Watering every {dias} days',
  'Programar recordatorio de riego para {nombre}': 'Schedule watering reminder for {nombre}',

  // ── Meses y días de la semana ──────────────────────────────────────
  'Enero': 'January',
  'Febrero': 'February',
  'Marzo': 'March',
  'Abril': 'April',
  'Mayo': 'May',
  'Junio': 'June',
  'Julio': 'July',
  'Agosto': 'August',
  'Septiembre': 'September',
  'Octubre': 'October',
  'Noviembre': 'November',
  'Diciembre': 'December',
  'L': 'M',
  'M': 'T',
  'X': 'W',
  'J': 'T',
  'V': 'F',
  'S': 'S',
  'D': 'S',
};

export default fragment;
