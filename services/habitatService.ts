/**
 * Plantae Habitat Service
 *
 * PROVEEDOR DE DATOS BIOGEOGRÁFICOS Y HÁBITAT MUNDIAL
 *
 * INTEGRACIÓN CON GBIF (Global Biodiversity Information Facility):
 * Para conectar este servicio a la API pública global en producción:
 *
 * 1. Endpoint oficial de GBIF:
 *    https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(scientificName)}&limit=200
 *
 * 2. Arquitectura recomendada con Firebase Cloud Functions:
 *    No consumas GBIF directamente desde el cliente para evitar rate limits y parseo pesado en el dispositivo.
 *    Implementa una Cloud Function con caché en Firestore:
 *    ```ts
 *    // functions/src/gbifHabitat.ts
 *    export const fetchPlantOccurrences = functions.https.onCall(async (data, context) => {
 *      const { scientificName } = data;
 *      const cached = await db.collection('species_habitats').doc(scientificName).get();
 *      if (cached.exists) return cached.data();
 *      const res = await fetch(`https://api.gbif.org/v1/occurrence/search?scientificName=${scientificName}&limit=150`);
 *      const json = await res.json();
 *      // Agrupar por país (countryCode) y categorizar en native, naturalized, cultivated
 *      return processedHabitat;
 *    });
 *    ```
 */

import { t } from '../i18n';

export type HabitatZoneType = 'native' | 'naturalized' | 'cultivated';

export interface HabitatRegionDetail {
  countryName: string; // Coincide con properties.name en world-atlas
  zoneType: HabitatZoneType;
  climate: string;
  floweringSeason: string;
  biogeographicZone: string;
  elevationMeters: string;
  notes: string;
}

export interface PlantHabitatInfo {
  plantId: string;
  scientificName: string;
  originSummary: string;
  globalCoverage: string;
  regions: HabitatRegionDetail[];
  conservationStatus: string;
}

const HABITAT_DATABASE: Record<string, PlantHabitatInfo> = {
  monstera: {
    plantId: 'monstera',
    scientificName: 'Monstera deliciosa Liebm.',
    originSummary: 'Bosques lluviosos y selvas tropicales húmedas de Mesoamérica desde el sur de México hasta Panamá.',
    globalCoverage: 'Nativa en Mesoamérica; ampliamente naturalizada en islas tropicales del Pacífico y cultivada globalmente como ornamental de interior.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'Mexico',
        zoneType: 'native',
        climate: 'Tropical lluvioso de sotobosque cálido',
        floweringSeason: 'Mayo a Septiembre',
        biogeographicZone: 'Neotropical (Selva Lacandona y Veracruz)',
        elevationMeters: '0 - 1,200 m s.n.m.',
        notes: 'Crecimiento epífito sobre troncos de árboles milenarios con raíces aéreas descendentes.',
      },
      {
        countryName: 'Guatemala',
        zoneType: 'native',
        climate: 'Tropical húmedo premontano',
        floweringSeason: 'Junio a Octubre',
        biogeographicZone: 'Neotropical (Petén e Izabal)',
        elevationMeters: '100 - 900 m s.n.m.',
        notes: 'Poblaciones silvestres densas protegidas en reservas de biosfera.',
      },
      {
        countryName: 'Costa Rica',
        zoneType: 'native',
        climate: 'Pluvisilva tropical húmeda (alta nubosidad)',
        floweringSeason: 'Todo el año con pico en lluvias',
        biogeographicZone: 'Neotropical (Tortuguero y Golfo Dulce)',
        elevationMeters: '0 - 800 m s.n.m.',
        notes: 'Produce frutos comestibles maduros con aroma a piña y plátano.',
      },
      {
        countryName: 'Panama',
        zoneType: 'native',
        climate: 'Húmedo tropical de dosel denso',
        floweringSeason: 'Julio a Noviembre',
        biogeographicZone: 'Neotropical (Darién y Canal)',
        elevationMeters: '50 - 600 m s.n.m.',
        notes: 'Abundante en corredores biológicos centroamericanos.',
      },
      {
        countryName: 'United States of America',
        zoneType: 'naturalized',
        climate: 'Subtropical húmedo con microclimas cálidos',
        floweringSeason: 'Verano tardío',
        biogeographicZone: 'Florida y Hawái',
        elevationMeters: '0 - 300 m s.n.m.',
        notes: 'Introducida a inicios del siglo XX en jardines botánicos de Florida y el archipiélago hawaiano.',
      },
      {
        countryName: 'Brazil',
        zoneType: 'cultivated',
        climate: 'Subtropical y templado urbano',
        floweringSeason: 'Primavera a Verano',
        biogeographicZone: 'Regiones metropolitanas y Mata Atlántica',
        elevationMeters: '100 - 800 m s.n.m.',
        notes: 'Una de las plantas ornamentales más coleccionadas en paisajismo residencial.',
      },
      {
        countryName: 'Spain',
        zoneType: 'cultivated',
        climate: 'Mediterráneo costero y cultivo en interiores',
        floweringSeason: 'Rara en cultivo cerrado',
        biogeographicZone: 'Península Ibérica e Islas Canarias',
        elevationMeters: 'N/A (Interiores y patios andaluces)',
        notes: 'Resguardada en patios sombríos y salones iluminados.',
      },
    ],
  },
  pothos: {
    plantId: 'pothos',
    scientificName: 'Epipremnum aureum',
    originSummary: 'Archipiélago de las Islas de la Sociedad (Moorea y Tahití) en la Polinesia Francesa.',
    globalCoverage: 'Ampliamente naturalizada en todos los trópicos y la planta de interior más extendida del planeta.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'French Polynesia',
        zoneType: 'native',
        climate: 'Marítimo tropical ecuatorial',
        floweringSeason: 'Extremadamente rara (reproducción asexual)',
        biogeographicZone: 'Oceanía / Pacífico Sur',
        elevationMeters: '0 - 500 m s.n.m.',
        notes: 'En estado salvaje trepa hasta 20 metros y sus hojas superan el metro de longitud.',
      },
      {
        countryName: 'Indonesia',
        zoneType: 'naturalized',
        climate: 'Monzónico tropical muy húmedo',
        floweringSeason: 'Rara floración natural',
        biogeographicZone: 'Indomalaya (Java, Sumatra, Bali)',
        elevationMeters: '0 - 1,000 m s.n.m.',
        notes: 'Naturalizada en bosques perturbados y cercados.',
      },
      {
        countryName: 'Malaysia',
        zoneType: 'naturalized',
        climate: 'Ecuatorial lluvioso perenne',
        floweringSeason: 'Rara',
        biogeographicZone: 'Indomalaya peninsular y Borneo',
        elevationMeters: '0 - 750 m s.n.m.',
        notes: 'Cubre suelos y troncos de plantaciones forestales.',
      },
      {
        countryName: 'Philippines',
        zoneType: 'naturalized',
        climate: 'Tropical de tifones y estación lluviosa',
        floweringSeason: 'Rara',
        biogeographicZone: 'Sureste Asiático',
        elevationMeters: '10 - 850 m s.n.m.',
        notes: 'Común en cañadas y muros de jardines de Luzón.',
      },
      {
        countryName: 'Mexico',
        zoneType: 'cultivated',
        climate: 'Interiores templados y cálidos',
        floweringSeason: 'Sin floración en interiores',
        biogeographicZone: 'Doméstico nacional',
        elevationMeters: 'Todo rango altitudinal',
        notes: 'Presente en casi cualquier hogar u oficina por su resiliencia purificadora.',
      },
      {
        countryName: 'United States of America',
        zoneType: 'cultivated',
        climate: 'Interiores climatizados',
        floweringSeason: 'No',
        biogeographicZone: 'Norteamérica',
        elevationMeters: 'Interior',
        notes: 'Planta de escritorio predilecta por su tolerancia a baja luz.',
      },
    ],
  },
  'aloe-vera': {
    plantId: 'aloe-vera',
    scientificName: 'Aloe barbadensis Miller',
    originSummary: 'Zonas semidesérticas y valles secos de la Península Arábiga (suroeste de Arabia Saudita y Omán).',
    globalCoverage: 'Naturalizada en toda la cuenca del Mediterráneo, norte de África, Canarias y México; cultivada a nivel industrial en todo el globo.',
    conservationStatus: 'No Evaluada (NE)',
    regions: [
      {
        countryName: 'Saudi Arabia',
        zoneType: 'native',
        climate: 'Desértico árido cálido con noches frescas',
        floweringSeason: 'Invierno a Primavera',
        biogeographicZone: 'Montañas de Asir y Sarawat',
        elevationMeters: '800 - 2,000 m s.n.m.',
        notes: 'Crecimiento en laderas de piedra caliza con escasa pluviosidad anual.',
      },
      {
        countryName: 'Oman',
        zoneType: 'native',
        climate: 'Árido de nieblas costeras y estepa',
        floweringSeason: 'Enero a Marzo',
        biogeographicZone: 'Región de Dhofar',
        elevationMeters: '300 - 1,500 m s.n.m.',
        notes: 'Capaz de capturar condensación nocturna mediante sus cutículas cerosas.',
      },
      {
        countryName: 'Yemen',
        zoneType: 'native',
        climate: 'Subdesértico de meseta rocosa',
        floweringSeason: 'Diciembre a Febrero',
        biogeographicZone: 'Tierras altas yemeníes',
        elevationMeters: '1,000 - 2,200 m s.n.m.',
        notes: 'Uso medicinal documentado desde hace más de 4,000 años.',
      },
      {
        countryName: 'Egypt',
        zoneType: 'naturalized',
        climate: 'Desértico subtropical hiperárido',
        floweringSeason: 'Febrero a Mayo',
        biogeographicZone: 'Riberas del Nilo y oasis saharianos',
        elevationMeters: '0 - 400 m s.n.m.',
        notes: 'Denominada "la planta de la inmortalidad" por los faraones del antiguo Egipto.',
      },
      {
        countryName: 'Mexico',
        zoneType: 'naturalized',
        climate: 'Semiárido y matorral xerófilo',
        floweringSeason: 'Marzo a Junio',
        biogeographicZone: 'Tamaulipas, Sonora, Zacatecas y Oaxaca',
        elevationMeters: '200 - 1,800 m s.n.m.',
        notes: 'Grandes campos de cultivo para extracción de gel cosmético y terapéutico.',
      },
      {
        countryName: 'Spain',
        zoneType: 'naturalized',
        climate: 'Mediterráneo y subtropical canario',
        floweringSeason: 'Primavera',
        biogeographicZone: 'Islas Canarias, Murcia y Almería',
        elevationMeters: '0 - 600 m s.n.m.',
        notes: 'Excelente calidad de mucílago gracias a la alta insolación de Fuerteventura y Lanzarote.',
      },
    ],
  },
  lavanda: {
    plantId: 'lavanda',
    scientificName: 'Lavandula dentata L.',
    originSummary: 'Colinas calcáreas secas y garrigas de la cuenca occidental del mar Mediterráneo.',
    globalCoverage: 'Nativa en España, Portugal, Marruecos y Argelia; cultivada como aromática en campos de Provenza y jardines del mundo.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'Spain',
        zoneType: 'native',
        climate: 'Mediterráneo árido y estepario',
        floweringSeason: 'Marzo a Noviembre (casi todo el año en costa)',
        biogeographicZone: 'Andalucía, Murcia, Comunidad Valenciana y Baleares',
        elevationMeters: '0 - 1,400 m s.n.m.',
        notes: 'Hojas dentadas grisáceas resistentes a sequías estivales extremas.',
      },
      {
        countryName: 'Portugal',
        zoneType: 'native',
        climate: 'Mediterráneo con influencia atlántica',
        floweringSeason: 'Abril a Septiembre',
        biogeographicZone: 'Algarve y Alentejo',
        elevationMeters: '50 - 800 m s.n.m.',
        notes: 'Crecimiento espontáneo sobre sustratos calizos y arenosos bien soleados.',
      },
      {
        countryName: 'Morocco',
        zoneType: 'native',
        climate: 'Mediterráneo de montaña y estepa',
        floweringSeason: 'Febrero a Junio',
        biogeographicZone: 'Cordilleras del Rif y Atlas Medio',
        elevationMeters: '400 - 1,800 m s.n.m.',
        notes: 'Destilación artesanal de aceites esenciales para perfumería tradicional.',
      },
      {
        countryName: 'France',
        zoneType: 'cultivated',
        climate: 'Mediterráneo templado',
        floweringSeason: 'Junio a Agosto',
        biogeographicZone: 'Provenza-Alpes-Costa Azul',
        elevationMeters: '300 - 1,100 m s.n.m.',
        notes: 'Famosos campos violetas cultivados para la industria de Grasse.',
      },
      {
        countryName: 'Mexico',
        zoneType: 'cultivated',
        climate: 'Templado subhúmedo de altiplano',
        floweringSeason: 'Primavera a Otoño',
        biogeographicZone: 'Querétaro, Guanajuato y Puebla',
        elevationMeters: '1,500 - 2,400 m s.n.m.',
        notes: 'Cultivo en auge para apicultura y paisajismo sostenible de bajo consumo hídrico.',
      },
    ],
  },
  succulent: {
    plantId: 'succulent',
    scientificName: 'Echeveria elegans Rose',
    originSummary: 'Gargantas escarpadas y riscos semidesérticos del altiplano central de México (estado de Hidalgo).',
    globalCoverage: 'Endémica de México; cultivada internacionalmente como la suculenta en roseta más admirada.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'Mexico',
        zoneType: 'native',
        climate: 'Semiseco templado de altitud con mañanas frías',
        floweringSeason: 'Primavera a Inicios de Verano',
        biogeographicZone: 'Barranca de Tolantongo y Valle del Mezquital (Hidalgo)',
        elevationMeters: '1,700 - 2,300 m s.n.m.',
        notes: 'Crece verticalmente entre grietas rocosas donde el agua jamás se encharca.',
      },
      {
        countryName: 'United States of America',
        zoneType: 'cultivated',
        climate: 'Mediterráneo y desértico',
        floweringSeason: 'Abril a Junio',
        biogeographicZone: 'California, Arizona y Texas',
        elevationMeters: '0 - 1,000 m s.n.m.',
        notes: 'Elemento fundamental en jardines xerófitos y xerojardinería urbana.',
      },
      {
        countryName: 'Spain',
        zoneType: 'cultivated',
        climate: 'Mediterráneo seco',
        floweringSeason: 'Mayo a Julio',
        biogeographicZone: 'Levante y costa mediterránea',
        elevationMeters: '0 - 500 m s.n.m.',
        notes: 'Muy apreciada en balcones soleados y macetas de barro cocido.',
      },
    ],
  },
  'helecho-boston': {
    plantId: 'helecho-boston',
    scientificName: 'Nephrolepis exaltata',
    originSummary: 'Bosques y humedales tropicales de Florida, el Caribe, Mesoamérica y cuenca del Amazonas.',
    globalCoverage: 'Circuntropical en pantanos y selvas; cultivado como helecho de suspensión en todo el planeta.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'United States of America',
        zoneType: 'native',
        climate: 'Subtropical húmedo pantanoso',
        floweringSeason: 'Sin flores (esporulación primaveral)',
        biogeographicZone: 'Everglades de Florida y costas de Georgia',
        elevationMeters: '0 - 100 m s.n.m.',
        notes: 'Crece como epífito sobre palmeras sabal o en humus de turbera.',
      },
      {
        countryName: 'Mexico',
        zoneType: 'native',
        climate: 'Tropical húmedo de llanura costera',
        floweringSeason: 'Esporulación continua',
        biogeographicZone: 'Humedales de Tabasco y Veracruz',
        elevationMeters: '0 - 400 m s.n.m.',
        notes: 'Frondas de hasta 1.5 metros de arco verde brillante.',
      },
      {
        countryName: 'Brazil',
        zoneType: 'native',
        climate: 'Ecuatorial hiperhúmedo',
        floweringSeason: 'Esporulación',
        biogeographicZone: 'Mata Atlántica y Amazonia',
        elevationMeters: '0 - 800 m s.n.m.',
        notes: 'Comunidades epífitas muy ricas que albergan anfibios y microfauna.',
      },
      {
        countryName: 'Colombia',
        zoneType: 'native',
        climate: 'Pluvial tropical de valles interandinos',
        floweringSeason: 'Esporulación',
        biogeographicZone: 'Chocó biogeográfico y Magdalena',
        elevationMeters: '100 - 1,200 m s.n.m.',
        notes: 'Una de las zonas con mayor humedad atmosférica de la Tierra.',
      },
    ],
  },
  orchid: {
    plantId: 'orchid',
    scientificName: 'Phalaenopsis aphrodite',
    originSummary: 'Sotobosque húmedo de las selvas insulares de Filipinas, Taiwán y el este de Indonesia.',
    globalCoverage: 'Nativa en archipiélagos del Pacífico asiático; la orquídea en maceta más hibridada y vendida en el comercio mundial.',
    conservationStatus: 'Vulnerable (VU)',
    regions: [
      {
        countryName: 'Philippines',
        zoneType: 'native',
        climate: 'Tropical monzónico de sotobosque sombreado',
        floweringSeason: 'Noviembre a Abril',
        biogeographicZone: 'Luzón, Mindanao, Batanes',
        elevationMeters: '0 - 500 m s.n.m.',
        notes: 'Vive adherida a la corteza musgosa de árboles centenarios con raíces fotosintéticas.',
      },
      {
        countryName: 'Taiwan',
        zoneType: 'native',
        climate: 'Subtropical húmedo con nieblas frecuentes',
        floweringSeason: 'Enero a Mayo',
        biogeographicZone: 'Isla de las Orquídeas (Lanyu) y sur de Taiwán',
        elevationMeters: '50 - 450 m s.n.m.',
        notes: 'Poblaciones silvestres en recuperación bajo estricta ley de conservación floral.',
      },
      {
        countryName: 'Indonesia',
        zoneType: 'native',
        climate: 'Ecuatorial de archipiélago',
        floweringSeason: 'Todo el año',
        biogeographicZone: 'Islas Molucas y Célebes',
        elevationMeters: '0 - 600 m s.n.m.',
        notes: 'Flores de hasta 10 cm con pétalos blancos nacarados y labelo amarillo-rojizo.',
      },
      {
        countryName: 'Netherlands',
        zoneType: 'cultivated',
        climate: 'Invernaderos de alta tecnología climatizada',
        floweringSeason: 'Programada por pulsos térmicos todo el año',
        biogeographicZone: 'Westland',
        elevationMeters: 'N/A',
        notes: 'Epicentro de hibridación europea que distribuye millones de clones al año.',
      },
    ],
  },
  'ficus-lyrata': {
    plantId: 'ficus-lyrata',
    scientificName: 'Ficus lyrata Warb.',
    originSummary: 'Tierras bajas de la selva tropical guineo-congoleña de África occidental (Camerún, Gabón, Nigeria).',
    globalCoverage: 'Nativa en África central y occidental; convertida en la planta arquitectónica icónica del diseño de interiores contemporáneo.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'Cameroon',
        zoneType: 'native',
        climate: 'Ecuatorial de lluvias constantes',
        floweringSeason: 'Higos sinóforos en verano',
        biogeographicZone: 'Bosques litorales de Sanaga y Dja',
        elevationMeters: '0 - 800 m s.n.m.',
        notes: 'Comienza como epífita en horquillas de ramas altas y envía raíces estranguladoras al suelo.',
      },
      {
        countryName: 'Nigeria',
        zoneType: 'native',
        climate: 'Tropical húmedo del delta',
        floweringSeason: 'Época de lluvias',
        biogeographicZone: 'Delta del Níger y selvas del sur',
        elevationMeters: '10 - 400 m s.n.m.',
        notes: 'Árbol imponente que puede alcanzar de 12 a 15 metros en su dosel nativo.',
      },
      {
        countryName: 'Gabon',
        zoneType: 'native',
        climate: 'Selva densa ombrófila perennifolia',
        floweringSeason: 'Todo el año',
        biogeographicZone: 'Cuenca del río Ogooué',
        elevationMeters: '50 - 650 m s.n.m.',
        notes: 'Hojas coriáceas de 45 cm adaptadas a desviar lluvias torrenciales.',
      },
      {
        countryName: 'United States of America',
        zoneType: 'cultivated',
        climate: 'Interiores urbanos',
        floweringSeason: 'Rara en cultivo cerrado',
        biogeographicZone: 'California, Nueva York, Texas',
        elevationMeters: 'Interiores',
        notes: 'Planta de declaración visual favorita de diseñadores de interiores y revistas de arquitectura.',
      },
    ],
  },
  sansevieria: {
    plantId: 'sansevieria',
    scientificName: 'Dracaena trifasciata',
    originSummary: 'Sabanas secas y matorrales tropicales de África occidental desde Nigeria hasta el este de la cuenca del Congo.',
    globalCoverage: 'Nativa en África tropical; naturalizada en el Caribe e islas del Pacífico; cultivada en hogares de todo el mundo.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'Nigeria',
        zoneType: 'native',
        climate: 'Tropical de sabana con estación seca prolongada',
        floweringSeason: 'Finales de la estación seca (flores nocturnas muy fragantes)',
        biogeographicZone: 'Sabana guineana y bosques caducifolios',
        elevationMeters: '100 - 900 m s.n.m.',
        notes: 'Sus fibras foliares se utilizaban tradicionalmente para confeccionar cuerdas de arco de cacería.',
      },
      {
        countryName: 'Dem. Rep. Congo',
        zoneType: 'native',
        climate: 'Ecuatorial de mosaico bosque-sabana',
        floweringSeason: 'Noviembre a Enero',
        biogeographicZone: 'Cuenca del río Congo',
        elevationMeters: '300 - 1,100 m s.n.m.',
        notes: 'Tolera sombra intensa en el sotobosque y sequías extremas en la sabana abierta.',
      },
      {
        countryName: 'Angola',
        zoneType: 'native',
        climate: 'Semiárido subtropical con invierno seco',
        floweringSeason: 'Julio a Septiembre',
        biogeographicZone: 'Mesetas de Uíge y Cuanza',
        elevationMeters: '400 - 1,200 m s.n.m.',
        notes: 'Rizomas subterráneos gruesos capaces de almacenar agua durante meses de estiaje.',
      },
      {
        countryName: 'Mexico',
        zoneType: 'cultivated',
        climate: 'Todo tipo de microclima doméstico',
        floweringSeason: 'Ocasional en verano',
        biogeographicZone: 'Hogares urbanos de todo el país',
        elevationMeters: '0 - 2,600 m s.n.m.',
        notes: 'Muy popular en la cultura mexicana por su simbología de protección y fácil supervivencia.',
      },
    ],
  },
  calathea: {
    plantId: 'calathea',
    scientificName: 'Goeppertia orbifolia',
    originSummary: 'Sotobosque húmedo y sombrío de la selva amazónica de Bolivia y el suroeste de Brasil.',
    globalCoverage: 'Endémica de la cuenca amazónica sudamericana; cultivada por coleccionistas de plantas tropicales exóticas.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'Bolivia',
        zoneType: 'native',
        climate: 'Tropical lluvioso de pie de monte andino',
        floweringSeason: 'Diciembre a Marzo',
        biogeographicZone: 'Parque Nacional Madidi y Yungas de La Paz',
        elevationMeters: '200 - 900 m s.n.m.',
        notes: 'Vive en suelo cubierto de hojarasca con luz filtrada que nunca excede el 15% del sol pleno.',
      },
      {
        countryName: 'Brazil',
        zoneType: 'native',
        climate: 'Ecuatorial cálido y húmedo perenne',
        floweringSeason: 'Enero a Abril',
        biogeographicZone: 'Amazonas, Acre y Rondônia',
        elevationMeters: '100 - 700 m s.n.m.',
        notes: 'Sus hojas gigantescas con bandas plateadas captan la luz difusa rebotada en el dosel selvático.',
      },
      {
        countryName: 'Peru',
        zoneType: 'native',
        climate: 'Selva alta y baja tropical',
        floweringSeason: 'Verano austral',
        biogeographicZone: 'Madre de Dios y Loreto',
        elevationMeters: '150 - 800 m s.n.m.',
        notes: 'Movimiento foliar circadiano coordinado por el pulvínulo en la base del peciolo.',
      },
    ],
  },
  espatifilo: {
    plantId: 'espatifilo',
    scientificName: 'Spathiphyllum wallisii',
    originSummary: 'Orillas de arroyos y cañadas sombrías de las selvas tropicales de Colombia y Venezuela.',
    globalCoverage: 'Nativa en el norte de Sudamérica; cultivada mundialmente en millones de hogares por sus elegantes flores blancas.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'Colombia',
        zoneType: 'native',
        climate: 'Tropical húmedo de sotobosque ribereño',
        floweringSeason: 'Primavera y Verano (casi continuo en trópicos)',
        biogeographicZone: 'Valles del Cauca, Magdalena y piedemonte andino',
        elevationMeters: '100 - 1,200 m s.n.m.',
        notes: 'Crecimiento en suelos cenagosos ricos en materia orgánica descompuesta.',
      },
      {
        countryName: 'Venezuela',
        zoneType: 'native',
        climate: 'Húmedo tropical de selva de galería',
        floweringSeason: 'Abril a Septiembre',
        biogeographicZone: 'Cordillera de la Costa y cuenca del Orinoco',
        elevationMeters: '200 - 950 m s.n.m.',
        notes: 'Espádices protegidos por una bráctea blanca modificada denominada espata.',
      },
      {
        countryName: 'Ecuador',
        zoneType: 'native',
        climate: 'Pluvial tropical de estribaciones andinas',
        floweringSeason: 'Todo el año',
        biogeographicZone: 'Esmeraldas y vertiente occidental',
        elevationMeters: '100 - 800 m s.n.m.',
        notes: 'Especie clave en la regeneración de suelos húmedos de orilla fluvial.',
      },
    ],
  },
  romero: {
    plantId: 'romero',
    scientificName: 'Salvia rosmarinus Spenn.',
    originSummary: 'Acantilados costeros rocosos y matorrales secos de la cuenca del mar Mediterráneo.',
    globalCoverage: 'Nativa en todo el sur de Europa y norte de África; cultivada a nivel culinario y medicinal en todo el mundo.',
    conservationStatus: 'Preocupación Menor (LC)',
    regions: [
      {
        countryName: 'Spain',
        zoneType: 'native',
        climate: 'Mediterráneo seco y subárido calizo',
        floweringSeason: 'Otoño a Primavera (pico en Marzo-Mayo)',
        biogeographicZone: 'Matorrales de romeral en casi toda la península',
        elevationMeters: '0 - 1,500 m s.n.m.',
        notes: 'Resiste la salinidad de los vientos marinos y sequías de varios meses.',
      },
      {
        countryName: 'Italy',
        zoneType: 'native',
        climate: 'Mediterráneo peninsular e insular',
        floweringSeason: 'Primavera y Otoño',
        biogeographicZone: 'Costa de Liguria, Toscana, Cerdeña y Sicilia',
        elevationMeters: '0 - 1,000 m s.n.m.',
        notes: 'Elemento fundamental de la maquia mediterránea italiana.',
      },
      {
        countryName: 'Greece',
        zoneType: 'native',
        climate: 'Mediterráneo de veranos secos y calurosos',
        floweringSeason: 'Marzo a Junio',
        biogeographicZone: 'Peloponeso, Creta y archipiélago Egeo',
        elevationMeters: '0 - 1,200 m s.n.m.',
        notes: 'Símbolo ancestral de la memoria y la fidelidad en la mitología helénica.',
      },
      {
        countryName: 'Turkey',
        zoneType: 'native',
        climate: 'Mediterráneo egeo y anatólico',
        floweringSeason: 'Primavera',
        biogeographicZone: 'Costas de Anatolia meridional',
        elevationMeters: '0 - 800 m s.n.m.',
        notes: 'Crecimiento silvestre denso que previene la erosión en pendientes calizas.',
      },
      {
        countryName: 'Tunisia',
        zoneType: 'native',
        climate: 'Mediterráneo árido norteafricano',
        floweringSeason: 'Enero a Abril',
        biogeographicZone: 'Montes de Kroumirie y costa de Cartago',
        elevationMeters: '50 - 900 m s.n.m.',
        notes: 'Recolección silvestre para aceites con alto contenido de alcanfor y cineol.',
      },
    ],
  },
};
/**
 * Traduce los textos visibles de una ficha de hábitat al idioma activo.
 * Se ejecuta al construir el resultado para respetar el idioma en uso.
 */
function localizeHabitat(source: PlantHabitatInfo): PlantHabitatInfo {
  return {
    ...source,
    originSummary: t(source.originSummary),
    globalCoverage: t(source.globalCoverage),
    conservationStatus: t(source.conservationStatus),
    regions: source.regions.map((region) => ({
      ...region,
      climate: t(region.climate),
      floweringSeason: t(region.floweringSeason),
      biogeographicZone: t(region.biogeographicZone),
      elevationMeters: t(region.elevationMeters),
      notes: t(region.notes),
    })),
  };
}

/**
 * Obtiene los datos biogeográficos y regiones de hábitat de una especie
 */
export async function getPlantHabitat(plantId: string): Promise<PlantHabitatInfo> {
  // Simulación realista con respuesta inmediata desde la base biogeográfica local
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = HABITAT_DATABASE[plantId] || HABITAT_DATABASE['monstera'];
      resolve(localizeHabitat(data));
    }, 350);
  });
}

/**
 * Retorna todos los países únicos donde habita la planta clasificados por tipo de zona
 */
export function getRegionTypeColor(zoneType: HabitatZoneType, isDark: boolean): string {
  switch (zoneType) {
    case 'native':
      return isDark ? '#4CAF50' : '#2E7D32'; // Verde esmeralda intenso
    case 'naturalized':
      return isDark ? '#26C6DA' : '#00838F'; // Cian / azul cielo
    case 'cultivated':
      return isDark ? '#FFCA28' : '#D4A017'; // Ámbar dorado
    default:
      return '#8E8E93';
  }
}
