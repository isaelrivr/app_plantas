/** Traducciones al inglés: núcleo, contextos y servicios. Clave = texto fuente en español. */
<<<<<<< HEAD
const fragment: Record<string, string> = {
  // Servicio meteorológico: alertas, consejos y descripciones del clima
  '❄️ Alerta de Frío y Heladas': '❄️ Cold and Frost Alert',
  'Las bajas temperaturas reducen la evaporación del agua. Resguarda tus plantas tropicales en interiores y espacia el riego para evitar pudrición radicular por frío.':
    'Low temperatures reduce water evaporation. Move your tropical plants indoors and space out watering to prevent cold-related root rot.',
  'Pospón el riego 2 a 3 días y usa agua a temperatura templada.':
    'Delay watering for 2 to 3 days and use lukewarm water.',
  '🌧️ Alta Humedad y Lluvia Pronosticada': '🌧️ High Humidity and Forecast Rain',
  'La atmósfera saturada y las precipitaciones mantienen el cepellón húmedo. No apliques agua hoy a las plantas de exterior.':
    'The saturated atmosphere and rainfall keep the root ball moist. Do not water outdoor plants today.',
  'Suspende el riego hoy; la humedad ambiental nutre el follaje.':
    'Skip watering today; ambient humidity nourishes the foliage.',
  '🔥 Alerta de Ola de Calor': '🔥 Heat Wave Alert',
  'Las altas temperaturas evaporan la humedad del sustrato al doble de velocidad. Revisa la maceta y pulveriza follaje en horas tempranas.':
    'High temperatures evaporate substrate moisture twice as fast. Check the pot and mist the foliage in the early hours.',
  'Riega a primera hora de la mañana o al atardecer para evitar choque térmico.':
    'Water early in the morning or at dusk to avoid thermal shock.',
  '🌿 Clima Templado Favorable': '🌿 Favorable Mild Weather',
  'Temperatura y humedad en niveles de confort biológico. El sustrato se seca de acuerdo al calendario habitual.':
    'Temperature and humidity at biologically comfortable levels. The substrate dries according to the usual schedule.',
  'Mantén el calendario de riego estándar según la especie.':
    'Keep the standard watering schedule according to the species.',
  'Mayormente soleado': 'Mostly sunny',
  Despejado: 'Clear',
  'Parcialmente nublado': 'Partly cloudy',
  'Niebla matutina': 'Morning fog',
  'Lluvia ligera': 'Light rain',
  'Precipitación fría': 'Cold precipitation',

  // Servicio de notificaciones locales
  'Recordatorios de Cuidado y Jardín': 'Care and Garden Reminders',
  '💧 Hora de regar tu {plantName}': '💧 Time to water your {plantName}',
  'Tu planta necesita hidratación cada {interval} días. Revisa que el sustrato esté seco antes de regar.':
    'Your plant needs hydration every {interval} days. Check that the substrate is dry before watering.',
  '🧪 Aplicación de tratamiento: {plantName}': '🧪 Treatment application: {plantName}',
  'Toca aplicar "{treatmentTitle}" a tu planta. Frecuencia recomendada: cada {interval} días. Usa guantes y mantén alejados a niños y mascotas.':
    'Time to apply "{treatmentTitle}" to your plant. Recommended frequency: every {interval} days. Wear gloves and keep children and pets away.',
  Riego: 'Watering',
  Fertilizante: 'Fertilizer',
  Poda: 'Pruning',
  Trasplante: 'Repotting',
  '{icon} {taskTitle} — {plantName}': '{icon} {taskTitle} — {plantName}',
  'Tarea de {tipo} programada para {dias} días más.': '{tipo} task scheduled for {dias} more days.',

  // Servicio de toxicidad: notas, resúmenes y etiquetas de nivel
  'Sin datos específicos: mantén igualmente las mascotas alejadas del follaje.':
    'No specific data: still keep pets away from the foliage.',
  'Sin datos específicos: evita que los niños ingieran partes de la planta.':
    'No specific data: prevent children from ingesting parts of the plant.',
  'Seguridad no confirmada, actúa con precaución.': 'Safety unconfirmed, act with caution.',
  'Contiene oxalato de calcio insoluble. Irrita la boca y puede causar vómitos en perros y gatos.':
    'Contains insoluble calcium oxalate. It irritates the mouth and can cause vomiting in dogs and cats.',
  'Provoca ardor e hinchazón si se mastica. No apta para mesas al alcance de niños pequeños.':
    'Causes burning and swelling if chewed. Not suitable for tables within reach of small children.',
  '🟠 Tóxica para mascotas por oxalatos; precaución con niños.':
    '🟠 Toxic to pets due to oxalates; caution with children.',
  'Oxalato de calcio: salivación, vómito y dificultad para tragar si la mascota la mordisquea.':
    'Calcium oxalate: salivation, vomiting, and difficulty swallowing if the pet nibbles it.',
  'Irritante oral. Colócala en colgantes o repisas altas fuera del alcance infantil.':
    'Oral irritant. Place it in hanging planters or high shelves out of children’s reach.',
  '🟠 Tóxica para mascotas; no apta para niños pequeños.': '🟠 Toxic to pets; not suitable for small children.',
  'La saponina y la aloína del gel causan diarrea y letargo en gatos y perros.':
    'The saponin and aloin in the gel cause diarrhea and lethargy in cats and dogs.',
  'El látex amarillo de la penca es un potente laxante; usar el gel solo de uso externo.':
    'The yellow latex of the leaf is a powerful laxative; use the gel for external use only.',
  '🟠 Tóxica para mascotas; gel de uso externo en niños.': '🟠 Toxic to pets; external-use gel for children.',
  'El aceite esencial concentrado puede irritar; la planta entera es de riesgo leve.':
    'Concentrated essential oil can irritate; the whole plant is low risk.',
  'Especie segura al tacto; evita la ingesta de flores en grandes cantidades.':
    'Safe species to the touch; avoid ingesting flowers in large quantities.',
  '🟢 Prácticamente segura; precaución con aceites esenciales.':
    '🟢 Practically safe; caution with essential oils.',
  'Las echeverias no son tóxicas para perros ni gatos.': 'Echeverias are not toxic to dogs or cats.',
  'Planta no tóxica y apta para el hogar con niños.': 'Non-toxic plant, suitable for a home with children.',
  '🟢 Segura para mascotas y niños.': '🟢 Safe for pets and children.',
  'El helecho de Boston no es tóxico para mascotas domésticas.':
    'The Boston fern is not toxic to domestic pets.',
  'Especie no tóxica; su textura puede atraer a los niños pero no supone riesgo.':
    'Non-toxic species; its texture may attract children but poses no risk.',
  'Las phalaenopsis son consideradas no tóxicas para perros y gatos.':
    'Phalaenopsis are considered non-toxic to dogs and cats.',
  'Planta segura y no tóxica para el hogar.': 'Safe, non-toxic plant for the home.',
  'La savia lechosa irrita la piel y la boca; puede causar vómitos en mascotas.':
    'The milky sap irritates the skin and mouth; it can cause vomiting in pets.',
  'El látex irrita ojos y piel. Manipula con guantes y aleja de niños.':
    'The latex irritates eyes and skin. Handle with gloves and keep away from children.',
  '🟠 Tóxica para mascotas por savia irritante.': '🟠 Toxic to pets due to irritating sap.',
  'Saponinas que provocan náuseas, vómito y diarrea en gatos y perros.':
    'Saponins that cause nausea, vomiting, and diarrhea in cats and dogs.',
  'Irritante digestivo leve si se ingiere; mantén fuera del alcance.':
    'Mild digestive irritant if ingested; keep out of reach.',
  '🟠 Tóxica para mascotas; precaución con niños.': '🟠 Toxic to pets; caution with children.',
  'Las calatheas (Goeppertia) no son tóxicas para mascotas.':
    'Calatheas (Goeppertia) are not toxic to pets.',
  'Oxalato de calcio: irrita la boca, salivación y vómito en mascotas.':
    'Calcium oxalate: irritates the mouth, salivation, and vomiting in pets.',
  'Irritante oral si se mastica; ubícala fuera del alcance de los niños.':
    'Oral irritant if chewed; place it out of children’s reach.',
  'Hierba culinaria no tóxica para perros y gatos en pequeñas cantidades.':
    'Culinary herb non-toxic to dogs and cats in small amounts.',
  'Aroma y textura seguros; ideal incluso para huertos escolares.':
    'Safe aroma and texture; ideal even for school gardens.',
  Segura: 'Safe',
  'Precaución': 'Caution',
  'Tóxica': 'Toxic',

  // Cliente API: mensajes de error de red y servidor
  'El servidor de Plantae no está disponible en este momento. Inténtalo de nuevo.':
    'The Plantae server is not available right now. Please try again.',
  'La petición no se pudo completar. Revisa los datos e inténtalo de nuevo.':
    'The request could not be completed. Check the data and try again.',
  'La app no tiene configurado el servidor de reconocimiento (EXPO_PUBLIC_PLANT_AI_ENDPOINT).':
    'The app does not have the recognition server configured (EXPO_PUBLIC_PLANT_AI_ENDPOINT).',
  'El análisis tardó demasiado. Comprueba tu conexión e inténtalo de nuevo.':
    'The analysis took too long. Check your connection and try again.',
  'No se pudo conectar con el servidor de Plantae. Revisa tu conexión.':
    'Could not connect to the Plantae server. Check your connection.',
  'No se pudo conectar con el servidor de Plantae.': 'Could not connect to the Plantae server.',

  // Caché de fichas de cuidados: ficha de respaldo
  'Esta planta': 'This plant',
  'Familia no determinada': 'Undetermined family',
  'Riégala cuando los primeros 3-5 cm de sustrato estén secos al tacto.':
    'Water it when the top 3-5 cm of substrate are dry to the touch.',
  'Luz indirecta brillante, evitando el sol directo intenso del mediodía.':
    'Bright indirect light, avoiding intense direct midday sun.',
  '18°C a 26°C.': '18°C to 26°C.',
  'Humedad ambiental media.': 'Medium ambient humidity.',
  'Fácil': 'Easy',
  'Hojas amarillas o decaídas: suele indicar exceso o falta de riego.':
    'Yellow or drooping leaves: usually indicates too much or too little watering.',
  'Puntas marrones: humedad ambiental baja o agua con demasiadas sales.':
    'Brown tips: low ambient humidity or water with too many salts.',
  'Ajusta el riego según la estación y la humedad de tu hogar.':
    'Adjust watering according to the season and the humidity of your home.',
  '{nombre} es una especie que puede cultivarse como planta ornamental.':
    '{nombre} is a species that can be grown as an ornamental plant.',
  'Origen no confirmado': 'Unconfirmed origin',
  'Sin información específica de toxicidad; mantén mascotas y niños alejados.':
    'No specific toxicity information; keep pets and children away.',
};
=======
const fragment: Record<string, string> = {};
>>>>>>> 7a9d4053c8f94b7a00027dab5aeb4f25da6b778b

export default fragment;
