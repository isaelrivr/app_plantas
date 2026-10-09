/** Traducciones al inglés: Mapa de hábitat. Clave = texto fuente en español. */
<<<<<<< HEAD
const fragment: Record<string, string> = {
  // Pantalla Mapa de Hábitat
  'Volver a la pantalla anterior': 'Back to the previous screen',
  'Atrás': 'Back',
  'Hábitat Global': 'Global Habitat',
  'Distribución biogeográfica': 'Biogeographic distribution',
  'Esta planta': 'This plant',
  'la especie': 'the species',
  'la planta': 'the plant',
  'El mapa interactivo revela dónde {especie} crece de forma nativa, naturalizada y cultivada: proyección cartográfica en vivo, regiones iluminadas y datos biogeográficos por país.':
    'The interactive map reveals where {especie} grows natively, naturalized, and cultivated: a live cartographic projection, illuminated regions, and biogeographic data by country.',
  Nativa: 'Native',
  Naturalizada: 'Naturalized',
  Cultivada: 'Cultivated',
  Otras: 'Other',
  'Generando proyección cartográfica...': 'Generating map projection...',
  'No pudimos cargar el hábitat de esta planta. Revisa que el catálogo esté disponible e inténtalo de nuevo.':
    'We could not load this plant’s habitat. Check that the catalog is available and try again.',
  'No se pudo construir el mapa': 'The map could not be built',
  'La proyección cartográfica no está disponible en este dispositivo.':
    'Map projection is not available on this device.',
  'Sin registros de hábitat': 'No habitat records',
  'Aún no tenemos datos biogeográficos para esta especie, pero los estaremos agregando pronto.':
    'We do not have biogeographic data for this species yet, but we will be adding it soon.',
  'Obtener información de hábitat en {pais}': 'Get habitat information for {pais}',
  'Hábitat de {planta} en {pais}': 'Habitat of {planta} in {pais}',
  'Aumentar zoom del mapa': 'Zoom in on the map',
  'Reducir zoom del mapa': 'Zoom out on the map',
  'Restablecer zoom del mapa': 'Reset the map zoom',
  'Toca una región iluminada para ver clima y floración':
    'Tap a highlighted region to see climate and flowering',
  'Zona Nativa de Origen': 'Native Origin Zone',
  'Población Naturalizada': 'Naturalized Population',
  'Zona de Cultivo': 'Cultivation Zone',
  'Clima predominante': 'Predominant climate',
  'Época de floración': 'Flowering season',
  'Altitud / Rango': 'Altitude / Range',
  'Ecorregión': 'Ecoregion',
  'Selecciona una región del mapa para inspeccionar sus condiciones naturales':
    'Select a region on the map to inspect its natural conditions',
  'Sin registro endémico oficial': 'No official endemic record',
  'Variable según cultivo': 'Varies by cultivation',
  'Zona no principal': 'Non-primary zone',
  'esta especie': 'this species',
  'No se registran poblaciones silvestres significativas de {especie} en este territorio.':
    'No significant wild populations of {especie} are recorded in this territory.',

  // Servicio de hábitat: estados de conservación
  'Preocupación Menor (LC)': 'Least Concern (LC)',
  'No Evaluada (NE)': 'Not Evaluated (NE)',
  'Vulnerable (VU)': 'Vulnerable (VU)',

  // Servicio de hábitat: resúmenes de origen y cobertura
  'Bosques lluviosos y selvas tropicales húmedas de Mesoamérica desde el sur de México hasta Panamá.':
    'Rainforests and humid tropical jungles of Mesoamerica from southern Mexico to Panama.',
  'Nativa en Mesoamérica; ampliamente naturalizada en islas tropicales del Pacífico y cultivada globalmente como ornamental de interior.':
    'Native to Mesoamerica; widely naturalized on tropical Pacific islands and cultivated worldwide as an indoor ornamental.',
  'Archipiélago de las Islas de la Sociedad (Moorea y Tahití) en la Polinesia Francesa.':
    'Society Islands archipelago (Moorea and Tahiti) in French Polynesia.',
  'Ampliamente naturalizada en todos los trópicos y la planta de interior más extendida del planeta.':
    'Widely naturalized throughout the tropics and the most widespread indoor plant on the planet.',
  'Zonas semidesérticas y valles secos de la Península Arábiga (suroeste de Arabia Saudita y Omán).':
    'Semi-desert areas and dry valleys of the Arabian Peninsula (southwestern Saudi Arabia and Oman).',
  'Naturalizada en toda la cuenca del Mediterráneo, norte de África, Canarias y México; cultivada a nivel industrial en todo el globo.':
    'Naturalized throughout the Mediterranean basin, North Africa, the Canary Islands, and Mexico; cultivated industrially around the globe.',
  'Colinas calcáreas secas y garrigas de la cuenca occidental del mar Mediterráneo.':
    'Dry limestone hills and scrublands of the western Mediterranean basin.',
  'Nativa en España, Portugal, Marruecos y Argelia; cultivada como aromática en campos de Provenza y jardines del mundo.':
    'Native to Spain, Portugal, Morocco, and Algeria; cultivated as an aromatic in the fields of Provence and gardens worldwide.',
  'Gargantas escarpadas y riscos semidesérticos del altiplano central de México (estado de Hidalgo).':
    'Steep gorges and semi-desert cliffs of the central Mexican highlands (state of Hidalgo).',
  'Endémica de México; cultivada internacionalmente como la suculenta en roseta más admirada.':
    'Endemic to Mexico; cultivated internationally as the most admired rosette succulent.',
  'Bosques y humedales tropicales de Florida, el Caribe, Mesoamérica y cuenca del Amazonas.':
    'Tropical forests and wetlands of Florida, the Caribbean, Mesoamerica, and the Amazon basin.',
  'Circuntropical en pantanos y selvas; cultivado como helecho de suspensión en todo el planeta.':
    'Circumtropical in swamps and jungles; cultivated as a hanging fern all over the planet.',
  'Sotobosque húmedo de las selvas insulares de Filipinas, Taiwán y el este de Indonesia.':
    'Humid understory of the island jungles of the Philippines, Taiwan, and eastern Indonesia.',
  'Nativa en archipiélagos del Pacífico asiático; la orquídea en maceta más hibridada y vendida en el comercio mundial.':
    'Native to archipelagos of the Asian Pacific; the most hybridized and best-selling potted orchid in world trade.',
  'Tierras bajas de la selva tropical guineo-congoleña de África occidental (Camerún, Gabón, Nigeria).':
    'Lowlands of the Guineo-Congolian tropical rainforest of West Africa (Cameroon, Gabon, Nigeria).',
  'Nativa en África central y occidental; convertida en la planta arquitectónica icónica del diseño de interiores contemporáneo.':
    'Native to central and western Africa; now the iconic architectural plant of contemporary interior design.',
  'Sabanas secas y matorrales tropicales de África occidental desde Nigeria hasta el este de la cuenca del Congo.':
    'Dry savannas and tropical scrublands of West Africa from Nigeria to the eastern Congo basin.',
  'Nativa en África tropical; naturalizada en el Caribe e islas del Pacífico; cultivada en hogares de todo el mundo.':
    'Native to tropical Africa; naturalized in the Caribbean and the Pacific islands; cultivated in homes around the world.',
  'Sotobosque húmedo y sombrío de la selva amazónica de Bolivia y el suroeste de Brasil.':
    'Humid, shady understory of the Amazon rainforest of Bolivia and southwestern Brazil.',
  'Endémica de la cuenca amazónica sudamericana; cultivada por coleccionistas de plantas tropicales exóticas.':
    'Endemic to the South American Amazon basin; cultivated by collectors of exotic tropical plants.',
  'Orillas de arroyos y cañadas sombrías de las selvas tropicales de Colombia y Venezuela.':
    'Banks of streams and shady ravines of the tropical jungles of Colombia and Venezuela.',
  'Nativa en el norte de Sudamérica; cultivada mundialmente en millones de hogares por sus elegantes flores blancas.':
    'Native to northern South America; cultivated worldwide in millions of homes for its elegant white flowers.',
  'Acantilados costeros rocosos y matorrales secos de la cuenca del mar Mediterráneo.':
    'Rocky coastal cliffs and dry scrublands of the Mediterranean Sea basin.',
  'Nativa en todo el sur de Europa y norte de África; cultivada a nivel culinario y medicinal en todo el mundo.':
    'Native throughout southern Europe and North Africa; cultivated for culinary and medicinal use worldwide.',

  // Servicio de hábitat: climas
  'Tropical lluvioso de sotobosque cálido': 'Rainy tropical warm understory',
  'Tropical húmedo premontano': 'Humid premontane tropical',
  'Pluvisilva tropical húmeda (alta nubosidad)': 'Humid tropical rainforest (high cloud cover)',
  'Húmedo tropical de dosel denso': 'Humid tropical with dense canopy',
  'Subtropical húmedo con microclimas cálidos': 'Humid subtropical with warm microclimates',
  'Subtropical y templado urbano': 'Subtropical and temperate urban',
  'Mediterráneo costero y cultivo en interiores': 'Coastal Mediterranean and indoor cultivation',
  'Marítimo tropical ecuatorial': 'Equatorial maritime tropical',
  'Monzónico tropical muy húmedo': 'Very humid tropical monsoonal',
  'Ecuatorial lluvioso perenne': 'Evergreen rainy equatorial',
  'Tropical de tifones y estación lluviosa': 'Tropical with typhoons and a rainy season',
  'Interiores templados y cálidos': 'Warm and temperate indoors',
  'Interiores climatizados': 'Climate-controlled indoors',
  'Desértico árido cálido con noches frescas': 'Hot arid desert with cool nights',
  'Árido de nieblas costeras y estepa': 'Arid with coastal fog and steppe',
  'Subdesértico de meseta rocosa': 'Sub-desert rocky plateau',
  'Desértico subtropical hiperárido': 'Hyper-arid subtropical desert',
  'Semiárido y matorral xerófilo': 'Semi-arid and xerophytic scrubland',
  'Mediterráneo y subtropical canario': 'Mediterranean and Canarian subtropical',
  'Mediterráneo árido y estepario': 'Arid Mediterranean and steppe',
  'Mediterráneo con influencia atlántica': 'Mediterranean with Atlantic influence',
  'Mediterráneo de montaña y estepa': 'Mountain Mediterranean and steppe',
  'Mediterráneo templado': 'Temperate Mediterranean',
  'Templado subhúmedo de altiplano': 'Sub-humid temperate highland',
  'Semiseco templado de altitud con mañanas frías': 'Temperate semi-dry highland with cold mornings',
  'Mediterráneo y desértico': 'Mediterranean and desert',
  'Mediterráneo seco': 'Dry Mediterranean',
  'Tropical húmedo de llanura costera': 'Humid tropical coastal plain',
  'Ecuatorial hiperhúmedo': 'Hyper-humid equatorial',
  'Pluvial tropical de valles interandinos': 'Rainy tropical inter-Andean valleys',
  'Tropical monzónico de sotobosque sombreado': 'Shaded tropical monsoonal understory',
  'Subtropical húmedo con nieblas frecuentes': 'Humid subtropical with frequent fog',
  'Ecuatorial de archipiélago': 'Equatorial archipelago',
  'Invernaderos de alta tecnología climatizada': 'High-tech climate-controlled greenhouses',
  'Ecuatorial de lluvias constantes': 'Equatorial with constant rain',
  'Tropical húmedo del delta': 'Humid tropical delta',
  'Selva densa ombrófila perennifolia': 'Dense evergreen ombrophilous forest',
  'Interiores urbanos': 'Urban indoors',
  'Tropical de sabana con estación seca prolongada': 'Tropical savanna with a prolonged dry season',
  'Ecuatorial de mosaico bosque-sabana': 'Equatorial forest-savanna mosaic',
  'Semiárido subtropical con invierno seco': 'Semi-arid subtropical with a dry winter',
  'Todo tipo de microclima doméstico': 'Any type of household microclimate',
  'Tropical lluvioso de pie de monte andino': 'Rainy tropical Andean foothill',
  'Ecuatorial cálido y húmedo perenne': 'Evergreen warm and humid equatorial',
  'Selva alta y baja tropical': 'Tropical lowland and montane jungle',
  'Tropical húmedo de sotobosque ribereño': 'Humid tropical riparian understory',
  'Húmedo tropical de selva de galería': 'Humid tropical gallery forest',
  'Pluvial tropical de estribaciones andinas': 'Rainy tropical Andean foothills',
  'Mediterráneo seco y subárido calizo': 'Dry Mediterranean and calcareous sub-arid',
  'Mediterráneo peninsular e insular': 'Peninsular and insular Mediterranean',
  'Mediterráneo de veranos secos y calurosos': 'Mediterranean with dry, hot summers',
  'Mediterráneo egeo y anatólico': 'Aegean and Anatolian Mediterranean',
  'Mediterráneo árido norteafricano': 'Arid North African Mediterranean',
  'Subtropical húmedo pantanoso': 'Humid subtropical swampy',

  // Servicio de hábitat: épocas de floración
  'Mayo a Septiembre': 'May to September',
  'Junio a Octubre': 'June to October',
  'Todo el año con pico en lluvias': 'Year-round with a peak during the rains',
  'Julio a Noviembre': 'July to November',
  'Verano tardío': 'Late summer',
  'Primavera a Verano': 'Spring to Summer',
  'Rara en cultivo cerrado': 'Rare in closed cultivation',
  'Extremadamente rara (reproducción asexual)': 'Extremely rare (asexual reproduction)',
  'Rara floración natural': 'Rare natural flowering',
  Rara: 'Rare',
  'Sin floración en interiores': 'No flowering indoors',
  No: 'No',
  'Invierno a Primavera': 'Winter to Spring',
  'Enero a Marzo': 'January to March',
  'Diciembre a Febrero': 'December to February',
  'Febrero a Mayo': 'February to May',
  'Marzo a Junio': 'March to June',
  Primavera: 'Spring',
  'Marzo a Noviembre (casi todo el año en costa)': 'March to November (almost year-round on the coast)',
  'Abril a Septiembre': 'April to September',
  'Febrero a Junio': 'February to June',
  'Junio a Agosto': 'June to August',
  'Primavera a Otoño': 'Spring to Autumn',
  'Abril a Junio': 'April to June',
  'Mayo a Julio': 'May to July',
  'Esporulación continua': 'Continuous sporulation',
  'Esporulación': 'Sporulation',
  'Noviembre a Abril': 'November to April',
  'Enero a Mayo': 'January to May',
  'Todo el año': 'Year-round',
  'Programada por pulsos térmicos todo el año': 'Scheduled year-round by thermal pulses',
  'Higos sinóforos en verano': 'Syconia (figs) in summer',
  'Época de lluvias': 'Rainy season',
  'Finales de la estación seca (flores nocturnas muy fragantes)':
    'End of the dry season (very fragrant night flowers)',
  'Julio a Septiembre': 'July to September',
  'Ocasional en verano': 'Occasional in summer',
  'Diciembre a Marzo': 'December to March',
  'Enero a Abril': 'January to April',
  'Verano austral': 'Southern summer',
  'Primavera y Verano (casi continuo en trópicos)': 'Spring and Summer (almost continuous in the tropics)',
  'Otoño a Primavera (pico en Marzo-Mayo)': 'Autumn to Spring (peak in March-May)',
  'Primavera y Otoño': 'Spring and Autumn',
  'Sin flores (esporulación primaveral)': 'No flowers (spring sporulation)',
  'Primavera a Inicios de Verano': 'Spring to Early Summer',
  'Noviembre a Enero': 'November to January',

  // Servicio de hábitat: zonas biogeográficas
  'Neotropical (Selva Lacandona y Veracruz)': 'Neotropical (Lacandon Jungle and Veracruz)',
  'Neotropical (Petén e Izabal)': 'Neotropical (Petén and Izabal)',
  'Neotropical (Tortuguero y Golfo Dulce)': 'Neotropical (Tortuguero and Golfo Dulce)',
  'Neotropical (Darién y Canal)': 'Neotropical (Darién and Canal)',
  'Florida y Hawái': 'Florida and Hawaii',
  'Regiones metropolitanas y Mata Atlántica': 'Metropolitan regions and Atlantic Forest',
  'Península Ibérica e Islas Canarias': 'Iberian Peninsula and Canary Islands',
  'Oceanía / Pacífico Sur': 'Oceania / South Pacific',
  'Indomalaya (Java, Sumatra, Bali)': 'Indomalaya (Java, Sumatra, Bali)',
  'Indomalaya peninsular y Borneo': 'Peninsular Indomalaya and Borneo',
  'Sureste Asiático': 'Southeast Asia',
  'Doméstico nacional': 'Domestic national',
  'Norteamérica': 'North America',
  'Montañas de Asir y Sarawat': 'Asir and Sarawat Mountains',
  'Región de Dhofar': 'Dhofar Region',
  'Tierras altas yemeníes': 'Yemeni highlands',
  'Riberas del Nilo y oasis saharianos': 'Nile banks and Saharan oases',
  'Tamaulipas, Sonora, Zacatecas y Oaxaca': 'Tamaulipas, Sonora, Zacatecas, and Oaxaca',
  'Islas Canarias, Murcia y Almería': 'Canary Islands, Murcia, and Almería',
  'Andalucía, Murcia, Comunidad Valenciana y Baleares':
    'Andalusia, Murcia, Valencian Community, and the Balearic Islands',
  'Algarve y Alentejo': 'Algarve and Alentejo',
  'Cordilleras del Rif y Atlas Medio': 'Rif and Middle Atlas mountain ranges',
  'Provenza-Alpes-Costa Azul': 'Provence-Alpes-Côte d’Azur',
  'Querétaro, Guanajuato y Puebla': 'Querétaro, Guanajuato, and Puebla',
  'Barranca de Tolantongo y Valle del Mezquital (Hidalgo)':
    'Tolantongo Canyon and Mezquital Valley (Hidalgo)',
  'California, Arizona y Texas': 'California, Arizona, and Texas',
  'Levante y costa mediterránea': 'Levante and the Mediterranean coast',
  'Humedales de Tabasco y Veracruz': 'Wetlands of Tabasco and Veracruz',
  'Mata Atlántica y Amazonia': 'Atlantic Forest and Amazonia',
  'Chocó biogeográfico y Magdalena': 'Biogeographic Chocó and Magdalena',
  'Luzón, Mindanao, Batanes': 'Luzon, Mindanao, Batanes',
  'Isla de las Orquídeas (Lanyu) y sur de Taiwán': 'Orchid Island (Lanyu) and southern Taiwan',
  'Islas Molucas y Célebes': 'Moluccas and Celebes',
  Westland: 'Westland',
  'Bosques litorales de Sanaga y Dja': 'Coastal forests of Sanaga and Dja',
  'Delta del Níger y selvas del sur': 'Niger Delta and southern jungles',
  'Cuenca del río Ogooué': 'Ogooué River basin',
  'California, Nueva York, Texas': 'California, New York, Texas',
  'Sabana guineana y bosques caducifolios': 'Guinean savanna and deciduous forests',
  'Cuenca del río Congo': 'Congo River basin',
  'Mesetas de Uíge y Cuanza': 'Uíge and Cuanza plateaus',
  'Hogares urbanos de todo el país': 'Urban homes throughout the country',
  'Parque Nacional Madidi y Yungas de La Paz': 'Madidi National Park and Yungas of La Paz',
  'Amazonas, Acre y Rondônia': 'Amazonas, Acre, and Rondônia',
  'Madre de Dios y Loreto': 'Madre de Dios and Loreto',
  'Valles del Cauca, Magdalena y piedemonte andino': 'Cauca and Magdalena valleys and Andean foothills',
  'Cordillera de la Costa y cuenca del Orinoco': 'Coastal Range and Orinoco basin',
  'Esmeraldas y vertiente occidental': 'Esmeraldas and western slope',
  'Matorrales de romeral en casi toda la península':
    'Rosemary scrublands across almost the entire peninsula',
  'Costa de Liguria, Toscana, Cerdeña y Sicilia': 'Coast of Liguria, Tuscany, Sardinia, and Sicily',
  'Peloponeso, Creta y archipiélago Egeo': 'Peloponnese, Crete, and the Aegean archipelago',
  'Costas de Anatolia meridional': 'Coasts of southern Anatolia',
  'Montes de Kroumirie y costa de Cartago': 'Kroumirie Mountains and the coast of Carthage',
  'Everglades de Florida y costas de Georgia': 'Florida Everglades and Georgia coasts',

  // Servicio de hábitat: altitudes (s.n.m. → m a.s.l.)
  '0 - 1,200 m s.n.m.': '0 - 1,200 m a.s.l.',
  '100 - 900 m s.n.m.': '100 - 900 m a.s.l.',
  '0 - 800 m s.n.m.': '0 - 800 m a.s.l.',
  '50 - 600 m s.n.m.': '50 - 600 m a.s.l.',
  '0 - 300 m s.n.m.': '0 - 300 m a.s.l.',
  '100 - 800 m s.n.m.': '100 - 800 m a.s.l.',
  'N/A (Interiores y patios andaluces)': 'N/A (Andalusian indoors and patios)',
  '0 - 500 m s.n.m.': '0 - 500 m a.s.l.',
  '0 - 1,000 m s.n.m.': '0 - 1,000 m a.s.l.',
  'Todo rango altitudinal': 'All altitudinal ranges',
  Interior: 'Indoor',
  Interiores: 'Indoors',
  '0 - 750 m s.n.m.': '0 - 750 m a.s.l.',
  '10 - 850 m s.n.m.': '10 - 850 m a.s.l.',
  '0 - 100 m s.n.m.': '0 - 100 m a.s.l.',
  '10 - 400 m s.n.m.': '10 - 400 m a.s.l.',
  '800 - 2,000 m s.n.m.': '800 - 2,000 m a.s.l.',
  '300 - 1,500 m s.n.m.': '300 - 1,500 m a.s.l.',
  '1,000 - 2,200 m s.n.m.': '1,000 - 2,200 m a.s.l.',
  '0 - 400 m s.n.m.': '0 - 400 m a.s.l.',
  '200 - 1,800 m s.n.m.': '200 - 1,800 m a.s.l.',
  '0 - 600 m s.n.m.': '0 - 600 m a.s.l.',
  '0 - 1,400 m s.n.m.': '0 - 1,400 m a.s.l.',
  '50 - 800 m s.n.m.': '50 - 800 m a.s.l.',
  '400 - 1,800 m s.n.m.': '400 - 1,800 m a.s.l.',
  '300 - 1,100 m s.n.m.': '300 - 1,100 m a.s.l.',
  '1,500 - 2,400 m s.n.m.': '1,500 - 2,400 m a.s.l.',
  '1,700 - 2,300 m s.n.m.': '1,700 - 2,300 m a.s.l.',
  '100 - 1,200 m s.n.m.': '100 - 1,200 m a.s.l.',
  '50 - 450 m s.n.m.': '50 - 450 m a.s.l.',
  '50 - 650 m s.n.m.': '50 - 650 m a.s.l.',
  '400 - 1,200 m s.n.m.': '400 - 1,200 m a.s.l.',
  '0 - 2,600 m s.n.m.': '0 - 2,600 m a.s.l.',
  '200 - 900 m s.n.m.': '200 - 900 m a.s.l.',
  '100 - 700 m s.n.m.': '100 - 700 m a.s.l.',
  '150 - 800 m s.n.m.': '150 - 800 m a.s.l.',
  '200 - 950 m s.n.m.': '200 - 950 m a.s.l.',
  '0 - 1,500 m s.n.m.': '0 - 1,500 m a.s.l.',
  '50 - 900 m s.n.m.': '50 - 900 m a.s.l.',

  // Servicio de hábitat: notas botánicas
  'Crecimiento epífito sobre troncos de árboles milenarios con raíces aéreas descendentes.':
    'Epiphytic growth on the trunks of ancient trees with descending aerial roots.',
  'Poblaciones silvestres densas protegidas en reservas de biosfera.':
    'Dense wild populations protected in biosphere reserves.',
  'Produce frutos comestibles maduros con aroma a piña y plátano.':
    'Produces ripe edible fruits with a pineapple and banana aroma.',
  'Abundante en corredores biológicos centroamericanos.':
    'Abundant in Central American biological corridors.',
  'Introducida a inicios del siglo XX en jardines botánicos de Florida y el archipiélago hawaiano.':
    'Introduced in the early 20th century to botanical gardens in Florida and the Hawaiian archipelago.',
  'Una de las plantas ornamentales más coleccionadas en paisajismo residencial.':
    'One of the most collected ornamental plants in residential landscaping.',
  'Resguardada en patios sombríos y salones iluminados.':
    'Sheltered in shady patios and bright living rooms.',
  'En estado salvaje trepa hasta 20 metros y sus hojas superan el metro de longitud.':
    'In the wild it climbs up to 20 meters and its leaves exceed one meter in length.',
  'Naturalizada en bosques perturbados y cercados.':
    'Naturalized in disturbed forests and fencerows.',
  'Cubre suelos y troncos de plantaciones forestales.':
    'Covers the ground and trunks of forest plantations.',
  'Común en cañadas y muros de jardines de Luzón.':
    'Common in ravines and garden walls in Luzon.',
  'Presente en casi cualquier hogar u oficina por su resiliencia purificadora.':
    'Found in almost any home or office thanks to its purifying resilience.',
  'Planta de escritorio predilecta por su tolerancia a baja luz.':
    'A favorite desk plant for its tolerance to low light.',
  'Crecimiento en laderas de piedra caliza con escasa pluviosidad anual.':
    'Growth on limestone slopes with low annual rainfall.',
  'Capaz de capturar condensación nocturna mediante sus cutículas cerosas.':
    'Able to capture nighttime condensation through its waxy cuticles.',
  'Uso medicinal documentado desde hace más de 4,000 años.':
    'Medicinal use documented for more than 4,000 years.',
  'Denominada "la planta de la inmortalidad" por los faraones del antiguo Egipto.':
    'Called "the plant of immortality" by the pharaohs of ancient Egypt.',
  'Grandes campos de cultivo para extracción de gel cosmético y terapéutico.':
    'Large fields cultivated for the extraction of cosmetic and therapeutic gel.',
  'Excelente calidad de mucílago gracias a la alta insolación de Fuerteventura y Lanzarote.':
    'Excellent mucilage quality thanks to the high sunlight of Fuerteventura and Lanzarote.',
  'Hojas dentadas grisáceas resistentes a sequías estivales extremas.':
    'Grayish toothed leaves resistant to extreme summer droughts.',
  'Crecimiento espontáneo sobre sustratos calizos y arenosos bien soleados.':
    'Spontaneous growth on well-sunned calcareous and sandy substrates.',
  'Destilación artesanal de aceites esenciales para perfumería tradicional.':
    'Artisanal distillation of essential oils for traditional perfumery.',
  'Famosos campos violetas cultivados para la industria de Grasse.':
    'Famous violet fields cultivated for the Grasse industry.',
  'Cultivo en auge para apicultura y paisajismo sostenible de bajo consumo hídrico.':
    'A booming crop for beekeeping and low-water sustainable landscaping.',
  'Crece verticalmente entre grietas rocosas donde el agua jamás se encharca.':
    'Grows vertically in rocky crevices where water never pools.',
  'Elemento fundamental en jardines xerófitos y xerojardinería urbana.':
    'A key element in xerophytic gardens and urban xeriscaping.',
  'Muy apreciada en balcones soleados y macetas de barro cocido.':
    'Highly prized on sunny balconies and in fired clay pots.',
  'Crece como epífito sobre palmeras sabal o en humus de turbera.':
    'Grows as an epiphyte on sabal palms or in peat humus.',
  'Frondas de hasta 1.5 metros de arco verde brillante.':
    'Fronds up to 1.5 meters of bright green arch.',
  'Comunidades epífitas muy ricas que albergan anfibios y microfauna.':
    'Very rich epiphytic communities that host amphibians and microfauna.',
  'Una de las zonas con mayor humedad atmosférica de la Tierra.':
    'One of the areas with the highest atmospheric humidity on Earth.',
  'Vive adherida a la corteza musgosa de árboles centenarios con raíces fotosintéticas.':
    'Lives attached to the mossy bark of century-old trees with photosynthetic roots.',
  'Poblaciones silvestres en recuperación bajo estricta ley de conservación floral.':
    'Wild populations recovering under strict floral conservation law.',
  'Flores de hasta 10 cm con pétalos blancos nacarados y labelo amarillo-rojizo.':
    'Flowers up to 10 cm with pearly white petals and a yellow-reddish lip.',
  'Epicentro de hibridación europea que distribuye millones de clones al año.':
    'Epicenter of European hybridization that distributes millions of clones per year.',
  'Comienza como epífita en horquillas de ramas altas y envía raíces estranguladoras al suelo.':
    'Starts as an epiphyte in the forks of high branches and sends strangling roots to the ground.',
  'Árbol imponente que puede alcanzar de 12 a 15 metros en su dosel nativo.':
    'A towering tree that can reach 12 to 15 meters in its native canopy.',
  'Hojas coriáceas de 45 cm adaptadas a desviar lluvias torrenciales.':
    'Leathery 45 cm leaves adapted to deflect torrential rain.',
  'Planta de declaración visual favorita de diseñadores de interiores y revistas de arquitectura.':
    'A favorite visual statement plant of interior designers and architecture magazines.',
  'Sus fibras foliares se utilizaban tradicionalmente para confeccionar cuerdas de arco de cacería.':
    'Its leaf fibers were traditionally used to make hunting bowstrings.',
  'Tolera sombra intensa en el sotobosque y sequías extremas en la sabana abierta.':
    'Tolerates deep shade in the understory and extreme droughts in the open savanna.',
  'Rizomas subterráneos gruesos capaces de almacenar agua durante meses de estiaje.':
    'Thick underground rhizomes capable of storing water during months of drought.',
  'Muy popular en la cultura mexicana por su simbología de protección y fácil supervivencia.':
    'Very popular in Mexican culture for its symbolism of protection and easy survival.',
  'Vive en suelo cubierto de hojarasca con luz filtrada que nunca excede el 15% del sol pleno.':
    'Lives on leaf-littered ground with filtered light that never exceeds 15% of full sun.',
  'Sus hojas gigantescas con bandas plateadas captan la luz difusa rebotada en el dosel selvático.':
    'Its gigantic leaves with silvery bands capture diffuse light bouncing off the jungle canopy.',
  'Movimiento foliar circadiano coordinado por el pulvínulo en la base del peciolo.':
    'Circadian leaf movement coordinated by the pulvinus at the base of the petiole.',
  'Crecimiento en suelos cenagosos ricos en materia orgánica descompuesta.':
    'Growth in marshy soils rich in decomposed organic matter.',
  'Espádices protegidos por una bráctea blanca modificada denominada espata.':
    'Spadices protected by a modified white bract called a spathe.',
  'Especie clave en la regeneración de suelos húmedos de orilla fluvial.':
    'A key species in the regeneration of moist riverside soils.',
  'Resiste la salinidad de los vientos marinos y sequías de varios meses.':
    'Withstands the salinity of sea winds and droughts lasting several months.',
  'Elemento fundamental de la maquia mediterránea italiana.':
    'A fundamental element of the Italian Mediterranean maquis.',
  'Símbolo ancestral de la memoria y la fidelidad en la mitología helénica.':
    'An ancestral symbol of memory and fidelity in Hellenic mythology.',
  'Crecimiento silvestre denso que previene la erosión en pendientes calizas.':
    'Dense wild growth that prevents erosion on limestone slopes.',
  'Recolección silvestre para aceites con alto contenido de alcanfor y cineol.':
    'Wild harvesting for oils with a high camphor and cineole content.',
};
=======
const fragment: Record<string, string> = {};
>>>>>>> 7a9d4053c8f94b7a00027dab5aeb4f25da6b778b

export default fragment;
