/** Traducciones al inglés: Perfil, ajustes, paywall y asistente. Clave = texto fuente en español. */
<<<<<<< HEAD
const fragment: Record<string, string> = {
  // Perfil
  'Perfil': 'Profile',
  'Ajustes y Suscripción': 'Settings and Subscription',
  'Cargando datos de la suscripción': 'Loading subscription data',
  'PLAN PRO ACTIVO': 'PRO PLAN ACTIVE',
  'PLAN BÁSICO GRATUITO': 'FREE BASIC PLAN',
  'Activo': 'Active',
  'facturación mensual': 'monthly billing',
  '¡Gracias por apoyar a Plantae! Disfrutas de análisis botánicos avanzados y recomendaciones inteligentes ilimitadas.':
    'Thank you for supporting Plantae! You enjoy advanced botanical analyses and unlimited smart recommendations.',
  'Desbloquea recomendaciones inteligentes de clima, diagnósticos botánicos ilimitados y alertas de riego.':
    'Unlock smart climate recommendations, unlimited botanical diagnoses and watering alerts.',
  'Gestionar mi plan Pro': 'Manage my Pro plan',
  'Explorar Plantae Pro': 'Explore Plantae Pro',
  'Ver planes de Plantae Pro': 'View Plantae Pro plans',
  'Abrir los ajustes de la aplicación': 'Open app settings',
  'Ajustes de la aplicación': 'App settings',
  'Tema, idioma, notificaciones y privacidad': 'Theme, language, notifications and privacy',
  'Beneficios incluidos en Plantae Pro': 'Benefits included in Plantae Pro',
  'Diagnósticos ilimitados por IA': 'Unlimited AI diagnoses',
  'Escanea tantas plantas como desees sin límites diarios.':
    'Scan as many plants as you want with no daily limits.',
  'Consejos de Clima y Ubicación': 'Climate and Location Tips',
  'Alertas en tiempo real adaptadas a la temperatura y humedad de tu ciudad.':
    'Real-time alerts adapted to the temperature and humidity of your city.',
  'Detección temprana de plagas y hongos': 'Early detection of pests and fungi',
  'Identifica manchas en hojas antes de que dañen toda la planta.':
    'Identify spots on leaves before they damage the whole plant.',
  'Calendario inteligente de riego': 'Smart watering calendar',
  'Notificaciones automáticas basadas en el clima local.': 'Automatic notifications based on the local climate.',
  'Soporte botánico prioritario': 'Priority botanical support',
  'Consulta directa con especialistas en jardinería.': 'Direct consultation with gardening specialists.',
  'Incluido en tu plan': 'Included in your plan',
  'Requiere plan Pro': 'Requires Pro plan',
  'Detalles de la Aplicación': 'App Details',
  'Tema del sistema': 'System theme',
  'Oscuro (Dark Mode)': 'Dark (Dark Mode)',
  'Claro (Light Mode)': 'Light (Light Mode)',
  'Versión': 'Version',
  'Base de datos botánica': 'Botanical database',
  'Mock Local (Listo para Firebase)': 'Local Mock (Firebase Ready)',

  // Ajustes
  'Sistema': 'System',
  'Claro': 'Light',
  'Oscuro': 'Dark',
  'Volver': 'Back',
  'Atrás': 'Back',
  'Ajustes': 'Settings',
  'Apariencia': 'Appearance',
  'Tema': 'Theme',
  'Tema {theme}': 'Theme {theme}',
  'Idioma': 'Language',
  'Idioma {lenguaje}': 'Language {lenguaje}',
  'Notificaciones': 'Notifications',
  'Recordatorios de cuidado': 'Care reminders',
  'Riego, abono y poda según cada planta': 'Watering, fertilizing and pruning for each plant',
  'Activar recordatorios de cuidado': 'Enable care reminders',
  'Suscripción': 'Subscription',
  'Gestionar suscripción': 'Manage subscription',
  'Ver planes Premium': 'View Premium plans',
  'Plantae Pro activo': 'Plantae Pro active',
  'Mejorar a Plantae Pro': 'Upgrade to Plantae Pro',
  'Gestiona tu plan y facturación': 'Manage your plan and billing',
  'Desbloquea todas las funciones': 'Unlock all features',
  'Privacidad y datos': 'Privacy and data',
  'Política de privacidad': 'Privacy policy',
  'Ver introducción de nuevo': 'View introduction again',
  'Eliminar cuenta y datos': 'Delete account and data',
  'Plantae · Versión 1.0.0 (Expo SDK 57)': 'Plantae · Version 1.0.0 (Expo SDK 57)',
  'Se borrarán tu jardín, estadísticas, ajustes y suscripción local de forma permanente. Esta acción no se puede deshacer.':
    'Your garden, statistics, settings and local subscription will be permanently deleted. This action cannot be undone.',
  'Cancelar': 'Cancel',
  'Eliminar todo': 'Delete everything',
  'Datos eliminados': 'Data deleted',
  'Tu cuenta y datos locales han sido eliminados.': 'Your account and local data have been deleted.',
  'Privacidad': 'Privacy',
  'En Plantae las fotos se procesan para identificar plantas. En producción, la identificación se realiza mediante Cloud Functions y no se almacenan imágenes sin tu consentimiento. Puedes eliminar todos tus datos en cualquier momento desde esta pantalla.\n\nPolítica completa: plantae.app/privacidad':
    'At Plantae photos are processed to identify plants. In production, identification is done through Cloud Functions and images are not stored without your consent. You can delete all your data at any time from this screen.\n\nFull policy: plantae.app/privacidad',
  'Entendido': 'Got it',

  // Paywall
  'Cerrar': 'Close',
  'PRUEBA 7 DÍAS GRATIS': '7-DAY FREE TRIAL',
  'Cuida tus plantas como un experto: análisis ilimitados, clima local y diagnóstico de plagas.':
    'Take care of your plants like an expert: unlimited analyses, local climate and pest diagnosis.',
  'Plan {titulo}, {precio} {periodo}': 'Plan {titulo}, {precio} {periodo}',
  'Anual': 'Annual',
  'Mensual': 'Monthly',
  'por año': 'per year',
  'por mes': 'per month',
  '$20.75 MXN / mes': '$20.75 MXN / month',
  '$29 MXN / mes': '$29 MXN / month',
  'Ahorra 28% vs. mensual': 'Save 28% vs. monthly',
  'Mejor precio': 'Best price',
  'Función': 'Feature',
  'Identificaciones con IA': 'AI identifications',
  '3 por día': '3 per day',
  'Ilimitadas': 'Unlimited',
  'Plantas en Mi Jardín': 'Plants in My Garden',
  '5 plantas': '5 plants',
  'Mapa de hábitat animado': 'Animated habitat map',
  'Diagnóstico de plagas': 'Pest diagnosis',
  'Clima personalizado': 'Personalized climate',
  'Calendario de riego': 'Watering calendar',
  'Diario de crecimiento': 'Growth diary',
  'Asistente de plantas': 'Plant assistant',
  'Probar 7 días gratis': 'Try 7 days free',
  'Luego {precio} {periodo}. Cancela cuando quieras.': 'Then {precio} {periodo}. Cancel anytime.',
  'Restaurar compras': 'Restore purchases',
  'No se pudo completar la compra.': 'The purchase could not be completed.',
  'No se pudo completar la compra. Inténtalo de nuevo.': 'The purchase could not be completed. Please try again.',
  'No encontramos compras previas asociadas a tu cuenta.':
    'We did not find previous purchases associated with your account.',
  'No se pudieron restaurar las compras.': 'Purchases could not be restored.',
  'El pago se cargará a tu cuenta de la tienda al confirmar. La suscripción se renueva automáticamente salvo que se cancele al menos 24 h antes del final del periodo. Gestiona o cancela en los ajustes de tu tienda. Al continuar aceptas los Términos de uso y la Política de privacidad.':
    'The payment will be charged to your store account upon confirmation. The subscription renews automatically unless cancelled at least 24 h before the end of the period. Manage or cancel it in your store settings. By continuing you accept the Terms of Use and the Privacy Policy.',

  // Asistente (pantalla)
  'Lo siento, hubo un problema al procesar tu pregunta. Inténtalo de nuevo.':
    'Sorry, there was a problem processing your question. Please try again.',
  'Asistente de Plantas': 'Plant Assistant',
  'Respuestas botánicas al instante': 'Instant botanical answers',
  'Pensando...': 'Thinking...',
  'Preguntas frecuentes': 'Frequently asked questions',
  'Preguntar: {pregunta}': 'Ask: {pregunta}',
  'Escribe tu pregunta...': 'Type your question...',
  'Mensaje para el asistente': 'Message to the assistant',
  'Enviar mensaje': 'Send message',

  // Asistente (servicio)
  '¡Hola! Soy tu asistente botánico de Plantae 🌿. Pregúntame sobre riego, luz, plagas, toxicidad o cuidados de tus plantas. Puedes empezar con una de las sugerencias de abajo.':
    'Hi! I am your Plantae botanical assistant 🌿. Ask me about watering, light, pests, toxicity or caring for your plants. You can start with one of the suggestions below.',
  '{nombre}: {resumen}\n\n• Mascotas ({mascotas}): {notasMascotas}\n• Niños ({ninos}): {notasNinos}\n\nPuedes ver la etiqueta de toxicidad en la ficha de la especie.':
    '{nombre}: {resumen}\n\n• Pets ({mascotas}): {notasMascotas}\n• Children ({ninos}): {notasNinos}\n\nYou can see the toxicity label on the species page.',
  '¿Qué plantas son 100% seguras?': 'Which plants are 100% safe?',
  'Muéstrame el catálogo seguro': 'Show me the safe catalog',
  'La seguridad depende de cada especie. Aloe Vera, Espatifilo, Ficus y Sansevieria son tóxicas o irritantes para gatos y perros, mientras que Echeverias, Calatheas y Helecho de Boston son seguras. Filtra el catálogo por "Segura para mascotas" para ver la lista completa.':
    'Safety depends on each species. Aloe Vera, Peace Lily, Ficus and Snake Plant are toxic or irritating to cats and dogs, while Echeverias, Calatheas and Boston Fern are safe. Filter the catalog by "Pet safe" to see the full list.',
  '¿Qué plantas son 100% segura?': 'Which plants are 100% safe?',
  'Abrir enciclopedia': 'Open encyclopedia',
  'Programar recordatorio de riego': 'Schedule watering reminder',
  '¿Cada cuánto?': 'How often?',
  'Para tu {nombre}, riega {riego}\n\nTip: {tip}': 'For your {nombre}, water {riego}\n\nTip: {tip}',
  'La regla de oro: introduce un dedo 3-5 cm en el sustrato y riega solo si está seco. Evita calendarios rígidos; ajusta según temperatura, humedad y estación. Dime el nombre de tu planta y te doy su frecuencia exacta.':
    'The golden rule: put a finger 3-5 cm into the substrate and water only if it is dry. Avoid rigid schedules; adjust according to temperature, humidity and season. Tell me your plant name and I will give you its exact frequency.',
  '¿Cómo sé si mi planta tiene sed?': 'How do I know if my plant is thirsty?',
  'Abrir calendario': 'Open calendar',
  '{nombre} necesita: {luz}': '{nombre} needs: {luz}',
  'La mayoría de plantas de interior prefieren luz indirecta brillante (cerca de una ventana sin sol directo). El sol directo de mediodía suele quemar las hojas tropicales. ¿Para qué planta quieres la recomendación?':
    'Most indoor plants prefer bright indirect light (near a window without direct sun). Direct midday sun usually burns tropical leaves. Which plant do you want the recommendation for?',
  '¿Qué es luz indirecta?': 'What is indirect light?',
  'Tengo la ventana al norte': 'My window faces north',
  'Las puntas marrones suelen indicar humedad ambiental baja o agua con exceso de sales/cloro. Prueba: 1) usa agua reposada o filtrada, 2) pulveriza el follaje, 3) aleja la planta de radiadores. Si son manchas amarillas con bultos, podría ser una plaga: usa el diagnóstico de salud.':
    'Brown tips usually indicate low ambient humidity or water with excess salts/chlorine. Try: 1) use rested or filtered water, 2) mist the foliage, 3) keep the plant away from radiators. If there are yellow spots with bumps, it could be a pest: use the health diagnosis.',
  'Diagnosticar con una foto': 'Diagnose with a photo',
  '¿Humedad ideal?': 'Ideal humidity?',
  'Para empezar te recomiendo: Sansevieria (casi indestructible), Pothos (crece rápido), Echeveria (suculenta) y Espatifilo (florece con poca luz). Las cuatro toleran olvidos de riego. ¿Quieres que te muestre sus fichas?':
    'To start, I recommend: Snake Plant (almost indestructible), Pothos (grows fast), Echeveria (succulent) and Peace Lily (blooms in low light). All four tolerate missed watering. Want me to show you their profiles?',
  'Comparar las 4': 'Compare the 4',
  'Para subir la humedad: agrupa plantas, usa un humidificador, coloca la maceta sobre guijarros con agua (sin tocar el fondo) o pulveriza por la mañana. Las calatheas y helechos agradecen 60-80% de humedad.':
    'To raise humidity: group plants, use a humidifier, place the pot on pebbles with water (without touching the bottom) or mist in the morning. Calatheas and ferns appreciate 60-80% humidity.',
  '¿Humidificador o nebulizador?': 'Humidifier or nebulizer?',
  'Abrir calathea': 'Open calathea',
  'Trasplanta cuando las raíces asomen por los agujeros o la maceta quede pequeña, idealmente en primavera. Sube solo 2-4 cm de diámetro y usa sustrato con buen drenaje. Evita trasplantar en invierno o en plena floración.':
    'Repot when roots appear through the holes or the pot becomes too small, ideally in spring. Go up only 2-4 cm in diameter and use well-draining substrate. Avoid repotting in winter or during full bloom.',
  '¿Qué sustrato uso?': 'What substrate should I use?',
  'Programar trasplante': 'Schedule repotting',
  'Entiendo. Sobre "{pregunta}" en relación a tu {planta}: la mejor práctica es observar el sustrato, la luz y el ambiente antes de actuar. Puedo darte detalle si mencionas el nombre de la planta o el síntoma que ves (manchas, puntas secas, hojas caídas...).':
    'I understand. About "{pregunta}" in relation to your {planta}: the best practice is to observe the substrate, light and environment before acting. I can give you details if you mention the plant name or the symptom you see (spots, dry tips, drooping leaves...).',
  'Entiendo. Sobre "{pregunta}": la mejor práctica es observar el sustrato, la luz y el ambiente antes de actuar. Puedo darte detalle si mencionas el nombre de la planta o el síntoma que ves (manchas, puntas secas, hojas caídas...).':
    'I understand. About "{pregunta}": the best practice is to observe the substrate, light and environment before acting. I can give you details if you mention the plant name or the symptom you see (spots, dry tips, drooping leaves...).',
  '¿Cada cuánto riego mi monstera?': 'How often should I water my monstera?',
  '¿Qué planta es segura para mi gato?': 'Which plant is safe for my cat?',
  'Tengo las puntas de las hojas marrones, ¿qué hago?': 'My leaf tips are brown, what should I do?',
  '¿Cuál es una planta fácil para principiantes?': 'What is an easy plant for beginners?',
  '¿Cómo aumento la humedad para mi calathea?': 'How do I increase humidity for my calathea?',
  '¿Cuándo debo trasplantar mi planta?': 'When should I repot my plant?',
};
=======
const fragment: Record<string, string> = {};
>>>>>>> 7a9d4053c8f94b7a00027dab5aeb4f25da6b778b

export default fragment;
