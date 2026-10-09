/** Traducciones al inglés: Fichas botánicas y enciclopedia. Clave = texto fuente en español. */
const fragment: Record<string, string> = {
  // Pantalla de detalle: navegación y estados
  Volver: 'Back',
  Atrás: 'Back',
  'Ficha Botánica': 'Plant profile',
  'Cargando ficha botánica': 'Loading plant profile',
  'Especie no encontrada': 'Species not found',
  'No pudimos recuperar la ficha de esta planta. Vuelve a escanearla o elige otra especie del catálogo.':
    "We could not retrieve this plant's profile. Scan it again or choose another species from the catalog.",
  'Ficha de {nombre}, familia {familia}': 'Profile of {nombre}, family {familia}',
  'Ya en tu jardín': 'Already in your garden',
  'Guardar en jardín': 'Save to garden',
  'Guardar en Mi Jardín': 'Save to My Garden',
  'Guardada en Mi Jardín ✓': 'Saved in My Garden ✓',

  // Límite del plan gratuito
  'Jardín gratuito lleno': 'Free garden full',
  'El plan gratuito permite {limite} plantas. Con Plantae Pro guardas las que quieras.':
    'The free plan allows {limite} plants. With Plantae Pro you can save as many as you want.',
  'Ahora no': 'Not now',
  'Ver Pro': 'See Pro',

  // Tarjeta principal y pestañas
  'Familia {familia}': 'Family {familia}',
  Precisión: 'Accuracy',
  IA: 'AI',
  'Cada {dias} días': 'Every {dias} days',
  Riego: 'Watering',
  'Nivel {nivel}/5': 'Level {nivel}/5',
  'Luz solar': 'Sunlight',
  Dificultad: 'Difficulty',
  Resumen: 'Overview',
  Cuidados: 'Care',
  Hábitat: 'Habitat',
  Problemas: 'Problems',
  'Pestaña {pestaña}': 'Tab {pestaña}',

  // Pestaña Resumen
  'Acerca de la especie': 'About the species',
  'Clasificación Taxonómica': 'Taxonomic Classification',
  Reino: 'Kingdom',
  Familia: 'Family',
  'Nombre Científico': 'Scientific Name',
  'Toxicidad en el hogar': 'Household toxicity',
  'Información clave si convives con mascotas o niños': 'Key information if you live with pets or children',

  // Pestaña Cuidados
  'Parámetros Botánicos de Nivel': 'Botanical Level Parameters',
  'Luz solar ': 'Sunlight',
  'Frecuencia de Riego': 'Watering Frequency',
  'Humedad Ambiental': 'Environmental Humidity',
  'Temperatura Óptima': 'Optimal Temperature',
  '{min}°C a {max}°C': '{min}°C to {max}°C',
  'Cada {dias} días.': 'Every {dias} days.',
  'Pauta Detallada de Riego': 'Detailed Watering Guide',

  // Pestaña de hábitat
  'Función Estrella': 'Star feature',
  'Distribución y Origen': 'Distribution and Origin',
  'Descubre en qué regiones del planeta habita esta especie de forma nativa, dónde ha sido naturalizada y sus zonas de cultivo global.':
    'Discover the regions where this species grows natively, where it has naturalized, and its global cultivation zones.',
  'Países de Presencia Principal:': 'Main Presence Countries:',
  'Abrir Mapa Mundial Interactivo 🌍': 'Open Interactive World Map 🌍',

  // Problemas y diagnóstico
  'Problemas Comunes': 'Common Problems',
  'Síntomas frecuentes identificables en sus hojas': 'Common symptoms identifiable in its leaves',
  'Diagnosticar Salud con IA 🩺': 'Diagnose Health with AI 🩺',
  '📈 Ver Diario de Crecimiento': '📈 View Growth Diary',

  // Nivel de dificultad
  Fácil: 'Easy',
  Moderado: 'Moderate',
  Avanzado: 'Advanced',

  // Enciclopedia
  Enciclopedia: 'Encyclopedia',
  'Buscar por nombre o familia...': 'Search by name or family...',
  'Buscar plantas': 'Search plants',
  'Borrar búsqueda': 'Clear search',
  'Modo sin conexión: solo mis plantas guardadas': 'Offline mode: only my saved plants',
  'Sin conexión · mis plantas guardadas ({total})': 'Offline · my saved plants ({total})',
  'Limpiar filtros': 'Clear filters',
  'Limpiar ({total})': 'Clear ({total})',
  'Segura para mascotas': 'Pet safe',
  'Toda luz': 'Any light',
  'Poca luz': 'Low light',
  'Luz media': 'Medium light',
  'Luz intensa': 'Bright light',
  'Toda dificultad': 'Any difficulty',
  'Interior y exterior': 'Indoor and outdoor',
  Interior: 'Indoor',
  Exterior: 'Outdoor',
  'Interior/Exterior': 'Indoor/Outdoor',
  'Mascotas ✓': 'Pets ✓',
  'Sin resultados': 'No results',
  'Aún no has guardado plantas en Mi Jardín.': 'You have not saved any plants in My Garden yet.',
  'Prueba con otros términos o ajusta los filtros.': 'Try other terms or adjust the filters.',
  '{total} especie': '{total} species',
  '{total} especies': '{total} species',
  'Ver ficha de {nombre}': 'View profile of {nombre}',

  // Mensajes de identificación
  'No se pudo procesar ninguna imagen': 'Could not process any image',
  'No se pudo procesar ninguna imagen. Vuelve a tomar la foto con buena iluminación.':
    'Could not process any image. Retake the photo with good lighting.',
  'Error al contactar el servicio de identificacion': 'Error contacting the identification service',
  'No pude identificarla': 'I could not identify it',

  // Ficha genérica (especie sin catálogo)
  'Familia no determinada': 'Undetermined family',
  'Riégala cuando los primeros 3-5 cm de sustrato estén secos al tacto.':
    'Water it when the top 3-5 cm of substrate are dry to the touch.',
  'Luz indirecta brillante, evitando el sol directo intenso del mediodía.':
    'Bright indirect light, avoiding intense midday direct sun.',
  '18°C a 26°C.': '18°C to 26°C.',
  'Humedad ambiental media.': 'Medium ambient humidity.',
  'Hojas amarillas o decaídas: suele indicar exceso o falta de riego.':
    'Yellow or drooping leaves: usually indicates over- or underwatering.',
  'Puntas marrones: humedad ambiental baja o agua con demasiadas sales.':
    'Brown tips: low ambient humidity or water with too many salts.',
  'Ajusta el riego según la estación y la humedad de tu hogar.':
    'Adjust watering according to the season and your home humidity.',
  'Sin información específica de toxicidad; mantén mascotas y niños alejados.':
    'No specific toxicity information; keep pets and children away.',

  // Catálogo: cuidados de Monstera
  'Cada 7 a 10 días cuando los primeros 3-5 cm de sustrato estén secos. Evitar encharcamiento.':
    'Every 7 to 10 days when the top 3-5 cm of substrate are dry. Avoid waterlogging.',
  'Luz indirecta brillante o semisombra. Nunca exponer a rayos directos intensos.':
    'Bright indirect light or partial shade. Never expose to intense direct rays.',
  '18°C a 27°C. Proteger de corrientes frías por debajo de 15°C.':
    '18°C to 27°C. Protect from cold drafts below 15°C.',
  'Alta (60% - 80%). Pulverizar follaje en días secos.':
    'High (60% - 80%). Mist the foliage on dry days.',
  'Hojas amarillas: Exceso de agua o deficiente drenaje.':
    'Yellow leaves: Overwatering or poor drainage.',
  'Puntas marrones quebradizas: Humedad ambiental insuficiente.':
    'Brittle brown tips: Insufficient ambient humidity.',
  'Hojas sin fenestraciones (perforaciones): Falta de luminosidad.':
    'Leaves without fenestrations (holes): Lack of light.',
  'En climas secos o con calefacción, coloca un plato con guijarros húmedos bajo la maceta.':
    'In dry climates or with heating, place a tray with wet pebbles under the pot.',
  'Selvas tropicales húmedas de Mesoamérica, trepando sobre troncos de árboles.':
    'Humid tropical rainforests of Mesoamerica, climbing on tree trunks.',

  // Catálogo: cuidados de Pothos
  'Cada 5 a 7 días. Dejar secar ligeramente la superficie antes de volver a regar.':
    'Every 5 to 7 days. Let the surface dry slightly before watering again.',
  'Luz indirecta moderada a brillante. Tolera niveles bajos de luminosidad.':
    'Moderate to bright indirect light. Tolerates low light levels.',
  '16°C a 26°C. Gran estabilidad térmica.':
    '16°C to 26°C. Very thermostable.',
  'Media (40% - 60%). Muy adaptable al entorno doméstico.':
    'Medium (40% - 60%). Very adaptable to the home environment.',
  'Tallos desgarbados y espaciados: Busca mayor cercanía a la luz.':
    'Lanky, spaced-out stems: Move it closer to the light.',
  'Hojas marchitas y decaídas: Señal inmediata de sed (se recupera al regar).':
    'Wilted, drooping leaves: Immediate sign of thirst (recovers when watered).',
  'Hojas totalmente verdes sin manchas doradas: Poca intensidad luminosa.':
    'Fully green leaves without golden spots: Low light intensity.',
  'Planta purificadora por excelencia. Ideal para repisas altas o macetas colgantes.':
    'The ultimate air-purifying plant. Ideal for high shelves or hanging pots.',
  'Nativa de las islas de la Sociedad (Polinesia Francesa); extendida en trópicos asiáticos.':
    'Native to the Society Islands (French Polynesia); widespread in Asian tropics.',

  // Catálogo: cuidados de Aloe Vera
  'Cada 15 a 20 días. Regar en profundidad y dejar secar el sustrato al 100%.':
    'Every 15 to 20 days. Water deeply and let the substrate dry out completely.',
  'Sol directo entre 4 y 6 horas al día o semisombra muy luminosa.':
    'Direct sun for 4 to 6 hours a day or very bright partial shade.',
  '18°C a 32°C. No tolera heladas prolongadas.':
    '18°C to 32°C. Does not tolerate prolonged frost.',
  'Baja (20% - 40%). Climas áridos o secos.':
    'Low (20% - 40%). Arid or dry climates.',
  'Pencas marrones y blandas: Pudrición radicular por exceso de agua.':
    'Brown, soft leaves: Root rot from overwatering.',
  'Pencas delgadas y cóncavas: Deshidratación prolongada.':
    'Thin, concave leaves: Prolonged dehydration.',
  'Color cobrizo o rojizo: Exceso brusco de sol sin aclimatación.':
    'Coppery or reddish color: Sudden excess of sun without acclimation.',
  'Usa sustrato arenoso con perlita para suculentas y maceta con orificio generoso.':
    'Use sandy substrate with perlite for succulents and a pot with a generous drainage hole.',
  'Zonas semidesérticas de la península Arábiga y norte de África.':
    'Semi-desert areas of the Arabian Peninsula and North Africa.',

  // Catálogo: cuidados de Lavanda
  'Cada 10 a 14 días en maceta, muy escaso en suelo directo.':
    'Every 10 to 14 days in a pot, very sparse in direct soil.',
  'Sol directo pleno (mínimo 6 horas de sol diario obligatorio).':
    'Full direct sun (at least 6 hours of sunlight daily).',
  '15°C a 30°C. Muy resistente al calor y brisas secas.':
    '15°C to 30°C. Very resistant to heat and dry breezes.',
  'Baja a moderada. No tolera la humedad ambiental densa.':
    'Low to moderate. Does not tolerate dense ambient humidity.',
  'Base leñosa sin brotes: Falta de poda de formación primaveral.':
    'Woody base without shoots: Lack of spring shaping pruning.',
  'Flores marchitas prematuras: Exceso de encharcamiento en la raíz.':
    'Prematurely wilted flowers: Waterlogged roots.',
  'Aroma repelente natural de mosquitos y polillas. Colócala en balcones soleados.':
    'A natural mosquito- and moth-repellent aroma. Place it on sunny balconies.',
  'Matorrales y colinas rocosas de la cuenca del Mediterráneo occidental.':
    'Scrubland and rocky hills of the western Mediterranean basin.',

  // Catálogo: cuidados de Echeveria
  'Cada 14 a 18 días únicamente cuando la tierra esté completamente seca.':
    'Every 14 to 18 days, only when the soil is completely dry.',
  'Sol directo de mañana o filtrado intenso (4-6 horas).':
    'Morning direct sun or intense filtered light (4-6 hours).',
  '15°C a 29°C. Proteger de lluvias continuas en invierno.':
    '15°C to 29°C. Protect from continuous rain in winter.',
  'Baja (30% - 40%). Sustrato mineral drenante.':
    'Low (30% - 40%). Free-draining mineral substrate.',
  'Etiolación (tallo estirado y pálido): Déficit crítico de radiación solar.':
    'Etiolation (stretched, pale stem): Critical lack of sunlight.',
  'Hojas translúcidas y caedizas: Hinchamiento celular por sobre-riego.':
    'Translucent, falling leaves: Cell swelling from overwatering.',
  'No mojes la roseta al regar; aplica el agua directamente al sustrato por los bordes.':
    'Do not wet the rosette when watering; apply water directly to the substrate around the edges.',
  'Zonas semiáridas de barrancas rocosas en Hidalgo y altiplano mexicano.':
    'Semi-arid rocky ravine areas in Hidalgo and the Mexican highlands.',

  // Catálogo: cuidados de Helecho de Boston
  'Cada 3 a 5 días manteniendo el cepellón uniformemente húmedo (no empapado).':
    'Every 3 to 5 days, keeping the root ball evenly moist (not soggy).',
  'Luz tamizada brillante o sombra clara. Cero sol directo.':
    'Bright filtered light or light shade. No direct sun.',
  '16°C a 24°C. Evitar fuentes de calor directo y corrientes.':
    '16°C to 24°C. Avoid direct heat sources and drafts.',
  'Muy alta (70% - 90%). Imprescindible para sus frondas delicadas.':
    'Very high (70% - 90%). Essential for its delicate fronds.',
  'Puntas de las frondas secas y quebradizas: Aire ambiental excesivamente seco.':
    'Dry, brittle frond tips: Excessively dry ambient air.',
  'Frondas amarillentas desvaídas: Agua con exceso de cloro o falta de hierro.':
    'Faded yellowish fronds: Water with excess chlorine or lack of iron.',
  'El baño con buena iluminación o cerca de humidificadores es su hábitat doméstico ideal.':
    'A well-lit bathroom or a spot near humidifiers is its ideal home habitat.',
  'Sotobosque de selvas húmedas tropicales de América, Polinesia y África.':
    'Understory of humid tropical rainforests of the Americas, Polynesia and Africa.',

  // Catálogo: cuidados de Orquídea
  'Inmersión cada 7 a 10 días cuando sus raíces velamen se tornen gris-plateadas.':
    'Soak every 7 to 10 days when its velamen roots turn silver-gray.',
  'Luz abundante filtrada por cortina traslúcida.':
    'Abundant light filtered through a translucent curtain.',
  '19°C a 26°C. Requiere oscilación de 5°C noche-día para inducir floración.':
    '19°C to 26°C. Requires a 5°C night-day swing to induce blooming.',
  'Alta (50% - 75%). Mantener corteza bien ventilada.':
    'High (50% - 75%). Keep the bark well ventilated.',
  'Pérdida súbita de capullos: Corrientes frías o frutos maduros cercanos (etileno).':
    'Sudden bud drop: Cold drafts or ripe fruit nearby (ethylene).',
  'Raíces blandas marrones: Retención de agua en macetero opaco.':
    'Soft brown roots: Water retention in an opaque pot.',
  'Cultivar siempre en maceta transparente con corteza de pino y carbón vegetal.':
    'Always grow in a transparent pot with pine bark and charcoal.',
  'Epífita en cortezas de selvas tropicales de Filipinas e Indonesia.':
    'Epiphyte on the bark of tropical rainforests of the Philippines and Indonesia.',

  // Catálogo: cuidados de Ficus Lyrata
  'Cada 8 a 12 días dejando secar los 5 cm superiores entre aplicaciones.':
    'Every 8 to 12 days, letting the top 5 cm dry between waterings.',
  'Luz intensa filtrada o matutina directa suave. Mínimo 5 horas de luz.':
    'Intense filtered light or soft direct morning sun. At least 5 hours of light.',
  '18°C a 25°C constante. Muy sensible a traslados constantes.':
    'A constant 18°C to 25°C. Very sensitive to constant moving.',
  'Media a alta (50% - 65%). Limpiar hojas con paño húmedo semanalmente.':
    'Medium to high (50% - 65%). Wipe the leaves with a damp cloth weekly.',
  'Manchas pardo-rojizas circulares: Edema o sobre-riego con drenaje lento.':
    'Circular brownish-red spots: Edema or overwatering with slow drainage.',
  'Caída brusca de hojas basales: Falta de luz o corriente fría directa.':
    'Sudden drop of lower leaves: Lack of light or direct cold draft.',
  'Gira la maceta un cuarto de vuelta cada mes para que crezca erguido y equilibrado.':
    'Turn the pot a quarter turn each month so it grows upright and balanced.',
  'Bosques lluviosos de tierras bajas de África occidental.':
    'Lowland rainforests of West Africa.',

  // Catálogo: cuidados de Sansevieria
  'Cada 2 a 3 semanas en verano; mensual en invierno. Extremadamente resistente.':
    'Every 2 to 3 weeks in summer; monthly in winter. Extremely resistant.',
  'Gran tolerancia: desde baja luz indirecta hasta sol directo de media tarde.':
    'Great tolerance: from low indirect light to mid-afternoon direct sun.',
  '14°C a 32°C. Soporta fluctuaciones térmicas sin inmutarse.':
    '14°C to 32°C. Withstands temperature fluctuations without flinching.',
  'Cualquiera. Tolera perfectamente el aire seco de interiores.':
    'Any. Tolerates dry indoor air perfectly.',
  'Base blanda y desprendible: Exceso letal de agua en la raíz.':
    'Soft, detachable base: Lethal excess of water at the root.',
  'Hojas arrugadas a lo largo: Sed prolongada (fácil corrección).':
    'Leaves wrinkled lengthwise: Prolonged thirst (easy to fix).',
  'Purificadora avalada por la NASA: produce oxígeno nocturno y absorbe benceno.':
    'NASA-endorsed air purifier: produces nighttime oxygen and absorbs benzene.',
  'Matorrales áridos y sabanas tropicales de Nigeria hasta la cuenca del Congo.':
    'Arid scrubland and tropical savannas from Nigeria to the Congo basin.',

  // Catálogo: cuidados de Calathea
  'Cada 4 a 6 días con agua filtrada o reposada a temperatura templada.':
    'Every 4 to 6 days with filtered or rested water at lukewarm temperature.',
  'Sombra luminosa o luz difusa. El sol directo causa quemaduras foliares.':
    'Bright shade or diffuse light. Direct sun causes leaf scorch.',
  '18°C a 25°C. Evitar descensos térmicos por debajo de 16°C.':
    '18°C to 25°C. Avoid temperature drops below 16°C.',
  'Muy alta (65% - 85%). Esencial para evitar curvatura en sus hojas.':
    'Very high (65% - 85%). Essential to prevent curling in its leaves.',
  'Bordes enrollados en tubo: Déficit severo de humedad en el ambiente.':
    'Edges rolled into a tube: Severe lack of ambient humidity.',
  'Puntas marrones quemadas: Sensibilidad al cloro y sales del agua corriente.':
    'Burnt brown tips: Sensitivity to chlorine and salts in tap water.',
  'Sus hojas realizan nictinastia: se pliegan hacia arriba por las noches como orando.':
    'Its leaves perform nyctinasty: they fold upward at night as if praying.',
  'Selva tropical húmeda de la cuenca amazónica de Bolivia y Brasil.':
    'Humid tropical rainforest of the Amazon basin in Bolivia and Brazil.',

  // Catálogo: cuidados de Espatifilo
  'Cada 5 a 7 días. Te avisa bajando ligeramente sus hojas cuando tiene sed.':
    'Every 5 to 7 days. It warns you by dropping its leaves slightly when thirsty.',
  'Luz indirecta moderada a baja. Florece mejor con luminosidad filtrada suave.':
    'Moderate to low indirect light. Blooms best with soft filtered light.',
  '18°C a 26°C. No tolera frío bajo 14°C.':
    '18°C to 26°C. Does not tolerate cold below 14°C.',
  'Alta (50% - 70%). Agradece pulverizaciones frecuentes de agua tibia.':
    'High (50% - 70%). Appreciates frequent misting with lukewarm water.',
  'Hojas desmayadas hacia el suelo: Falta urgente de agua (recupera en 2 horas).':
    'Leaves drooping to the ground: Urgent lack of water (recovers in 2 hours).',
  'Puntas negras en las espátulas blancas: Exceso de fertilizante mineral.':
    'Black tips on the white spathes: Excess mineral fertilizer.',
  'Excelente biofiltro contra esporas de moho y formaldehído ambiental.':
    'Excellent biofilter against mold spores and ambient formaldehyde.',
  'Riberas de arroyos en selvas tropicales de Colombia y Venezuela.':
    'Stream banks in tropical rainforests of Colombia and Venezuela.',

  // Catálogo: cuidados de Romero
  'Cada 8 a 12 días en maceta profunda. Dejar secar el sustrato completamente.':
    'Every 8 to 12 days in a deep pot. Let the substrate dry out completely.',
  'Pleno sol directo (6 a 8 horas diarias sin excepciones).':
    'Full direct sun (6 to 8 hours daily, no exceptions).',
  '12°C a 30°C. Muy rústico y resistente.':
    '12°C to 30°C. Very hardy and resistant.',
  'Baja a media. Necesita aireación constante y sustrato calizo drenante.':
    'Low to medium. Needs constant aeration and free-draining calcareous substrate.',
  'Moho blanco en hojas: Falta de ventilación o humedad ambiental estancada.':
    'White mold on leaves: Lack of ventilation or stagnant ambient humidity.',
  'Caída de agujas basales: Encharcamiento de raíces en tiesto sin drenaje.':
    'Lower needle drop: Waterlogged roots in a pot without drainage.',
  'Hierba culinaria y medicinal. Aumenta la concentración y atrae abejas polinizadoras.':
    'Culinary and medicinal herb. Boosts concentration and attracts pollinating bees.',
  'Acantilados secos y matorrales costeros de la cuenca mediterránea.':
    'Dry cliffs and coastal scrubland of the Mediterranean basin.',

};

export default fragment;
