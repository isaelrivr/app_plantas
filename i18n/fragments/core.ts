/** Traducciones al inglés: navegación, contextos y hooks. Clave = texto fuente en español. */
const fragment: Record<string, string> = {
  // ── Navegación (AppNavigator) ──────────────────────────────────────
  'Escáner': 'Scanner',
  'Mi Jardín': 'My Garden',
  'Perfil': 'Profile',
  'Perfil (Pro)': 'Profile (Pro)',
  'Pestaña de Escáner y Reconocimiento de Plantas': 'Scanner and Plant Recognition tab',
  'Pestaña de Mi Jardín y Registro de Riegos': 'My Garden and Watering Log tab',
  'Pestaña de Perfil y Suscripción Premium': 'Profile and Premium Subscription tab',

  // ── Zonas por defecto (GardenContext) ──────────────────────────────
  'Sala': 'Living Room',
  'Dormitorio': 'Bedroom',
  'Cocina': 'Kitchen',
  'Balcón': 'Balcony',
  'Oficina': 'Office',

  // ── Datos de ejemplo del jardín (GardenContext) ────────────────────
  'Hace 3 días': '3 days ago',
  'Hace 6 días': '6 days ago',
  'Hace 12 días': '12 days ago',
  'Ayer': 'Yesterday',
  'Luz indirecta brillante': 'Bright indirect light',
  'Luz filtrada intensa': 'Intense filtered light',
  'Cualquier iluminación': 'Any lighting',
  'Luz indirecta': 'Indirect light',
  'Estado óptimo y vigoroso': 'Optimal and vigorous condition',
  'Leve clorosis por luz baja': 'Mild chlorosis due to low light',
  'Excelente resistencia': 'Excellent resistance',
  'Crecimiento activo': 'Active growth',
  'Riego profundo de sustrato': 'Deep substrate watering',
  'Abono líquido equilibrado': 'Balanced liquid fertilizer',
  'Limpieza de hojas basales': 'Lower leaf cleanup',
  'Riego de recuperación': 'Recovery watering',
  'Poda de brote apical': 'Apical bud pruning',
  'Riego mensual ligero': 'Light monthly watering',
  'Cambio a maceta de barro': 'Repot into clay pot',
  'Riego regular de superficie': 'Regular surface watering',
  'Humus de lombriz': 'Vermicompost',
  'En 5 días': 'In 5 days',
  'En 12 días': 'In 12 days',
  'Próximo mes': 'Next month',
  'En 4 días': 'In 4 days',
  'En 2 semanas': 'In 2 weeks',
  'En 6 días': 'In 6 days',
  'En primavera': 'In spring',
  'En 15 días': 'In 15 days',

  // ── GardenContext (runtime) ────────────────────────────────────────
  'Hoy a las {hora}': 'Today at {hora}',
  'Hoy recién agregada': 'Just added today',
  'Saludable': 'Healthy',
  'Riego regular': 'Regular watering',
  'Nutrición foliar': 'Foliar feeding',
  'En {dias} días': 'In {dias} days',
  'En 20 días': 'In 20 days',
  'Nueva zona': 'New zone',
  'useGarden debe utilizarse dentro de GardenProvider':
    'useGarden must be used within GardenProvider',

  // ── PremiumContext ─────────────────────────────────────────────────
  '$29 MXN/mes': '$29 MXN/month',
  'usePremium debe utilizarse dentro de un PremiumProvider':
    'usePremium must be used within a PremiumProvider',

  // ── Funciones Premium (usePlanLimits · FEATURE_LABELS) ─────────────
  'Mapa de hábitat animado': 'Animated habitat map',
  'Explora el origen natural de cada especie con un mapa interactivo.':
    "Explore each species' natural origin with an interactive map.",
  'Diagnóstico de plagas': 'Pest diagnosis',
  'Detecta plagas y enfermedades con la cámara y recibe un plan de tratamiento.':
    'Detect pests and diseases with the camera and get a treatment plan.',
  'Clima personalizado': 'Personalized climate',
  'Ajustes de riego según el clima local de tu ciudad.':
    "Watering adjustments based on your city's local climate.",
  'Diario de crecimiento': 'Growth diary',
  'Registra el crecimiento de tus plantas con fotos y comparador.':
    "Track your plants' growth with photos and a comparison.",
  'Asistente de plantas': 'Plant assistant',
  'Pregunta lo que necesites sobre el cuidado de tus plantas.':
    'Ask anything you need about caring for your plants.',
};

export default fragment;
