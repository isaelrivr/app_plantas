/**
 * Plantae Botanical Service
 *
 * Catálogo botánico local (funciona sin conexión) + fachada de identificación
 * y de fichas de cuidados.
 *
 * NOTA DE SEGURIDAD:
 * Las llamadas a los proveedores reales (Plant.id / Gemini) se hacen SIEMPRE
 * desde las Cloud Functions de Plantae (`functions/`). El cliente solo conoce
 * la URL base del backend y nunca maneja claves de API.
 *
 * La identificación real devuelve candidatos con su confianza y sus imágenes de
 * referencia. En desarrollo, si no hay backend configurado, se usan datos
 * simulados deterministas (nunca `Math.random`).
 */

import { ApiError, postJson, shouldUseMocks } from './apiClient';
import { t } from '../i18n';
import { compressImages } from './imageCompression';
import type { BotanicalCareSheet, BotanicalCareLevels } from './plantCareCache';
import {
  buildFallbackCareSheet,
  careSheetKey,
  getCachedCareSheet,
  saveCareSheet,
} from './plantCareCache';

export type IdentificationSource = 'ai-real' | 'mock';

/** Imagen de referencia devuelta por el proveedor de visión. */
export interface ReferenceImage {
  small: string;
  full: string;
}

/** Una posible especie identificada, con su confianza real (0-100). */
export interface IdentificationCandidate {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  genus?: string;
  /** 0 a 100. */
  confidence: number;
  commonNames: string[];
  wikiDescription?: string;
  referenceImages: ReferenceImage[];
  source: IdentificationSource;
}

/** Avisos de calidad de la captura que ayudan a interpretar el resultado. */
export interface ImageQualityFlags {
  lowResolution?: boolean;
  lowConfidence?: boolean;
  note?: string;
}

/** Respuesta cruda del endpoint `/identifyPlant`. */
interface IdentifyResponse {
  candidates: IdentificationCandidate[];
  isPlant: boolean;
  imageQuality: ImageQualityFlags;
}

/** Resultado del escáner: lista de candidatos + metadatos. */
export interface PlantIdentificationResult {
  candidates: IdentificationCandidate[];
  isPlant: boolean;
  imageQuality: ImageQualityFlags;
  /** Confianza del mejor candidato (0-100); 0 si no hay ninguno. */
  confidence: number;
  source: IdentificationSource;
  imageUri?: string;
}

/**
 * Especie del catálogo local con su ficha de cuidados. `name` es el nombre
 * común que usan las pantallas; `commonName` (ficha) se construye al vuelo.
 */
export interface CatalogPlant {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  confidence?: number;
  healthScore?: number;
  watering: string;
  wateringFrequencyDays: number;
  light: string;
  temperature: string;
  humidity: string;
  careLevels: BotanicalCareLevels;
  difficulty: 'Fácil' | 'Moderado' | 'Avanzado';
  commonProblems: string[];
  climateTip: string;
  habitatSummary: string;
  nativeRegions: string[]; // Nombres o ISOs de países
  imageUri?: string;
  avatarEmoji: string;
  /** Tokens de referencia offline del catálogo. */
  referenceImages?: string[];
  toxicity?: string;
  source?: 'catalog' | 'ai-real' | 'mock';
}

export const BOTANICAL_KNOWLEDGE_BASE: CatalogPlant[] = [
  {
    id: 'monstera',
    name: 'Monstera Deliciosa (Costilla de Adán)',
    scientificName: 'Monstera deliciosa Liebm.',
    family: 'Araceae',
    confidence: 98,
    healthScore: 92,
    watering: 'Cada 7 a 10 días cuando los primeros 3-5 cm de sustrato estén secos. Evitar encharcamiento.',
    wateringFrequencyDays: 8,
    light: 'Luz indirecta brillante o semisombra. Nunca exponer a rayos directos intensos.',
    temperature: '18°C a 27°C. Proteger de corrientes frías por debajo de 15°C.',
    humidity: 'Alta (60% - 80%). Pulverizar follaje en días secos.',
    careLevels: {
      lightLevel: 4,
      wateringLevel: 3,
      humidityLevel: 4,
      tempMinC: 18,
      tempMaxC: 27,
    },
    difficulty: 'Fácil',
    commonProblems: [
      'Hojas amarillas: Exceso de agua o deficiente drenaje.',
      'Puntas marrones quebradizas: Humedad ambiental insuficiente.',
      'Hojas sin fenestraciones (perforaciones): Falta de luminosidad.',
    ],
    climateTip: 'En climas secos o con calefacción, coloca un plato con guijarros húmedos bajo la maceta.',
    habitatSummary: 'Selvas tropicales húmedas de Mesoamérica, trepando sobre troncos de árboles.',
    nativeRegions: ['Mexico', 'Guatemala', 'Costa Rica', 'Panama'],
    avatarEmoji: '🌿',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Monstera_deliciosa2.jpg/330px-Monstera_deliciosa2.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['monstera_leaf', 'monstera_stem', 'monstera_fenestration'],
  },
  {
    id: 'pothos',
    name: 'Pothos Dorado (Teléfono)',
    scientificName: 'Epipremnum aureum',
    family: 'Araceae',
    confidence: 97,
    healthScore: 96,
    watering: 'Cada 5 a 7 días. Dejar secar ligeramente la superficie antes de volver a regar.',
    wateringFrequencyDays: 6,
    light: 'Luz indirecta moderada a brillante. Tolera niveles bajos de luminosidad.',
    temperature: '16°C a 26°C. Gran estabilidad térmica.',
    humidity: 'Media (40% - 60%). Muy adaptable al entorno doméstico.',
    careLevels: {
      lightLevel: 3,
      wateringLevel: 3,
      humidityLevel: 3,
      tempMinC: 16,
      tempMaxC: 26,
    },
    difficulty: 'Fácil',
    commonProblems: [
      'Tallos desgarbados y espaciados: Busca mayor cercanía a la luz.',
      'Hojas marchitas y decaídas: Señal inmediata de sed (se recupera al regar).',
      'Hojas totalmente verdes sin manchas doradas: Poca intensidad luminosa.',
    ],
    climateTip: 'Planta purificadora por excelencia. Ideal para repisas altas o macetas colgantes.',
    habitatSummary: 'Nativa de las islas de la Sociedad (Polinesia Francesa); extendida en trópicos asiáticos.',
    nativeRegions: ['French Polynesia', 'Indonesia', 'Malaysia', 'Philippines'],
    avatarEmoji: '🍃',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Money_Plant_%28Epipremnum_aureum%29_4.jpg/330px-Money_Plant_%28Epipremnum_aureum%29_4.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['pothos_variegated', 'pothos_vine', 'pothos_root'],
  },
  {
    id: 'aloe-vera',
    name: 'Sábila (Aloe Vera)',
    scientificName: 'Aloe barbadensis Miller',
    family: 'Asphodelaceae',
    confidence: 99,
    healthScore: 95,
    watering: 'Cada 15 a 20 días. Regar en profundidad y dejar secar el sustrato al 100%.',
    wateringFrequencyDays: 16,
    light: 'Sol directo entre 4 y 6 horas al día o semisombra muy luminosa.',
    temperature: '18°C a 32°C. No tolera heladas prolongadas.',
    humidity: 'Baja (20% - 40%). Climas áridos o secos.',
    careLevels: {
      lightLevel: 5,
      wateringLevel: 1,
      humidityLevel: 1,
      tempMinC: 18,
      tempMaxC: 32,
    },
    difficulty: 'Fácil',
    commonProblems: [
      'Pencas marrones y blandas: Pudrición radicular por exceso de agua.',
      'Pencas delgadas y cóncavas: Deshidratación prolongada.',
      'Color cobrizo o rojizo: Exceso brusco de sol sin aclimatación.',
    ],
    climateTip: 'Usa sustrato arenoso con perlita para suculentas y maceta con orificio generoso.',
    habitatSummary: 'Zonas semidesérticas de la península Arábiga y norte de África.',
    nativeRegions: ['Saudi Arabia', 'Oman', 'Yemen', 'Egypt', 'Morocco'],
    avatarEmoji: '🌱',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Aloe_vera_flower_inset.png/330px-Aloe_vera_flower_inset.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['aloe_rosette', 'aloe_leaf_cut', 'aloe_gel'],
  },
  {
    id: 'lavanda',
    name: 'Lavanda Francesa',
    scientificName: 'Lavandula dentata L.',
    family: 'Lamiaceae',
    confidence: 96,
    healthScore: 89,
    watering: 'Cada 10 a 14 días en maceta, muy escaso en suelo directo.',
    wateringFrequencyDays: 12,
    light: 'Sol directo pleno (mínimo 6 horas de sol diario obligatorio).',
    temperature: '15°C a 30°C. Muy resistente al calor y brisas secas.',
    humidity: 'Baja a moderada. No tolera la humedad ambiental densa.',
    careLevels: {
      lightLevel: 5,
      wateringLevel: 2,
      humidityLevel: 2,
      tempMinC: 15,
      tempMaxC: 30,
    },
    difficulty: 'Moderado',
    commonProblems: [
      'Base leñosa sin brotes: Falta de poda de formación primaveral.',
      'Flores marchitas prematuras: Exceso de encharcamiento en la raíz.',
    ],
    climateTip: 'Aroma repelente natural de mosquitos y polillas. Colócala en balcones soleados.',
    habitatSummary: 'Matorrales y colinas rocosas de la cuenca del Mediterráneo occidental.',
    nativeRegions: ['Spain', 'France', 'Portugal', 'Morocco', 'Algeria'],
    avatarEmoji: '🪻',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7e/Single_lavender_flower02.jpg/330px-Single_lavender_flower02.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['lavender_bloom', 'lavender_foliage', 'lavender_field'],
  },
  {
    id: 'succulent',
    name: 'Echeveria Elegans (Rosa de Alabastro)',
    scientificName: 'Echeveria elegans Rose',
    family: 'Crassulaceae',
    confidence: 98,
    healthScore: 94,
    watering: 'Cada 14 a 18 días únicamente cuando la tierra esté completamente seca.',
    wateringFrequencyDays: 15,
    light: 'Sol directo de mañana o filtrado intenso (4-6 horas).',
    temperature: '15°C a 29°C. Proteger de lluvias continuas en invierno.',
    humidity: 'Baja (30% - 40%). Sustrato mineral drenante.',
    careLevels: {
      lightLevel: 5,
      wateringLevel: 1,
      humidityLevel: 1,
      tempMinC: 15,
      tempMaxC: 29,
    },
    difficulty: 'Fácil',
    commonProblems: [
      'Etiolación (tallo estirado y pálido): Déficit crítico de radiación solar.',
      'Hojas translúcidas y caedizas: Hinchamiento celular por sobre-riego.',
    ],
    climateTip: 'No mojes la roseta al regar; aplica el agua directamente al sustrato por los bordes.',
    habitatSummary: 'Zonas semiáridas de barrancas rocosas en Hidalgo y altiplano mexicano.',
    nativeRegions: ['Mexico'],
    avatarEmoji: '🪴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Echeveria_elegans_-_1.png/330px-Echeveria_elegans_-_1.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['echeveria_rosette', 'echeveria_bloom', 'echeveria_offset'],
  },
  {
    id: 'helecho-boston',
    name: 'Helecho Espada de Boston',
    scientificName: 'Nephrolepis exaltata',
    family: 'Nephrolepidaceae',
    confidence: 95,
    healthScore: 88,
    watering: 'Cada 3 a 5 días manteniendo el cepellón uniformemente húmedo (no empapado).',
    wateringFrequencyDays: 4,
    light: 'Luz tamizada brillante o sombra clara. Cero sol directo.',
    temperature: '16°C a 24°C. Evitar fuentes de calor directo y corrientes.',
    humidity: 'Muy alta (70% - 90%). Imprescindible para sus frondas delicadas.',
    careLevels: {
      lightLevel: 3,
      wateringLevel: 4,
      humidityLevel: 5,
      tempMinC: 16,
      tempMaxC: 24,
    },
    difficulty: 'Moderado',
    commonProblems: [
      'Puntas de las frondas secas y quebradizas: Aire ambiental excesivamente seco.',
      'Frondas amarillentas desvaídas: Agua con exceso de cloro o falta de hierro.',
    ],
    climateTip: 'El baño con buena iluminación o cerca de humidificadores es su hábitat doméstico ideal.',
    habitatSummary: 'Sotobosque de selvas húmedas tropicales de América, Polinesia y África.',
    nativeRegions: ['United States of America', 'Mexico', 'Brazil', 'Colombia'],
    avatarEmoji: '🌾',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Boston_Fern_%282873392811%29.png/330px-Boston_Fern_%282873392811%29.png?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['fern_fronds', 'fern_basket', 'fern_spores'],
  },
  {
    id: 'orchid',
    name: 'Orquídea Mariposa',
    scientificName: 'Phalaenopsis aphrodite',
    family: 'Orchidaceae',
    confidence: 97,
    healthScore: 91,
    watering: 'Inmersión cada 7 a 10 días cuando sus raíces velamen se tornen gris-plateadas.',
    wateringFrequencyDays: 8,
    light: 'Luz abundante filtrada por cortina traslúcida.',
    temperature: '19°C a 26°C. Requiere oscilación de 5°C noche-día para inducir floración.',
    humidity: 'Alta (50% - 75%). Mantener corteza bien ventilada.',
    careLevels: {
      lightLevel: 3,
      wateringLevel: 2,
      humidityLevel: 4,
      tempMinC: 19,
      tempMaxC: 26,
    },
    difficulty: 'Moderado',
    commonProblems: [
      'Pérdida súbita de capullos: Corrientes frías o frutos maduros cercanos (etileno).',
      'Raíces blandas marrones: Retención de agua en macetero opaco.',
    ],
    climateTip: 'Cultivar siempre en maceta transparente con corteza de pino y carbón vegetal.',
    habitatSummary: 'Epífita en cortezas de selvas tropicales de Filipinas e Indonesia.',
    nativeRegions: ['Philippines', 'Indonesia', 'Taiwan'],
    avatarEmoji: '🌸',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/Phalaenopsis_philippinensis_NationalOrchidGarden-Singapore.jpg/330px-Phalaenopsis_philippinensis_NationalOrchidGarden-Singapore.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['orchid_flower', 'orchid_aerial_roots', 'orchid_spike'],
  },
  {
    id: 'ficus-lyrata',
    name: 'Ficus Lyrata (Higuera Hoja de Violín)',
    family: 'Moraceae',
    scientificName: 'Ficus lyrata Warb.',
    confidence: 96,
    healthScore: 90,
    watering: 'Cada 8 a 12 días dejando secar los 5 cm superiores entre aplicaciones.',
    wateringFrequencyDays: 10,
    light: 'Luz intensa filtrada o matutina directa suave. Mínimo 5 horas de luz.',
    temperature: '18°C a 25°C constante. Muy sensible a traslados constantes.',
    humidity: 'Media a alta (50% - 65%). Limpiar hojas con paño húmedo semanalmente.',
    careLevels: {
      lightLevel: 4,
      wateringLevel: 3,
      humidityLevel: 3,
      tempMinC: 18,
      tempMaxC: 25,
    },
    difficulty: 'Moderado',
    commonProblems: [
      'Manchas pardo-rojizas circulares: Edema o sobre-riego con drenaje lento.',
      'Caída brusca de hojas basales: Falta de luz o corriente fría directa.',
    ],
    climateTip: 'Gira la maceta un cuarto de vuelta cada mes para que crezca erguido y equilibrado.',
    habitatSummary: 'Bosques lluviosos de tierras bajas de África occidental.',
    nativeRegions: ['Cameroon', 'Nigeria', 'Gabon', 'Congo'],
    avatarEmoji: '🪴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Starr_031108-0130_Ficus_lyrata.jpg/330px-Starr_031108-0130_Ficus_lyrata.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['ficus_leaf_large', 'ficus_foliage', 'ficus_stem'],
  },
  {
    id: 'sansevieria',
    name: 'Sansevieria Trifasciata (Lengua de Suegra)',
    scientificName: 'Dracaena trifasciata',
    family: 'Asparagaceae',
    confidence: 99,
    healthScore: 98,
    watering: 'Cada 2 a 3 semanas en verano; mensual en invierno. Extremadamente resistente.',
    wateringFrequencyDays: 18,
    light: 'Gran tolerancia: desde baja luz indirecta hasta sol directo de media tarde.',
    temperature: '14°C a 32°C. Soporta fluctuaciones térmicas sin inmutarse.',
    humidity: 'Cualquiera. Tolera perfectamente el aire seco de interiores.',
    careLevels: {
      lightLevel: 3,
      wateringLevel: 1,
      humidityLevel: 1,
      tempMinC: 14,
      tempMaxC: 32,
    },
    difficulty: 'Fácil',
    commonProblems: [
      'Base blanda y desprendible: Exceso letal de agua en la raíz.',
      'Hojas arrugadas a lo largo: Sed prolongada (fácil corrección).',
    ],
    climateTip: 'Purificadora avalada por la NASA: produce oxígeno nocturno y absorbe benceno.',
    habitatSummary: 'Matorrales áridos y sabanas tropicales de Nigeria hasta la cuenca del Congo.',
    nativeRegions: ['Nigeria', 'Dem. Rep. Congo', 'Cameroon', 'Angola'],
    avatarEmoji: '🎋',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg/330px-Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['sansevieria_spear', 'sansevieria_margin', 'sansevieria_growth'],
  },
  {
    id: 'calathea',
    name: 'Calathea Orbifolia (Planta de la Oración)',
    scientificName: 'Goeppertia orbifolia',
    family: 'Marantaceae',
    confidence: 94,
    healthScore: 86,
    watering: 'Cada 4 a 6 días con agua filtrada o reposada a temperatura templada.',
    wateringFrequencyDays: 5,
    light: 'Sombra luminosa o luz difusa. El sol directo causa quemaduras foliares.',
    temperature: '18°C a 25°C. Evitar descensos térmicos por debajo de 16°C.',
    humidity: 'Muy alta (65% - 85%). Esencial para evitar curvatura en sus hojas.',
    careLevels: {
      lightLevel: 2,
      wateringLevel: 4,
      humidityLevel: 5,
      tempMinC: 18,
      tempMaxC: 25,
    },
    difficulty: 'Avanzado',
    commonProblems: [
      'Bordes enrollados en tubo: Déficit severo de humedad en el ambiente.',
      'Puntas marrones quemadas: Sensibilidad al cloro y sales del agua corriente.',
    ],
    climateTip: 'Sus hojas realizan nictinastia: se pliegan hacia arriba por las noches como orando.',
    habitatSummary: 'Selva tropical húmeda de la cuenca amazónica de Bolivia y Brasil.',
    nativeRegions: ['Bolivia', 'Brazil', 'Peru'],
    avatarEmoji: '🌱',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Calathea_orbifolia_2.jpg/330px-Calathea_orbifolia_2.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['calathea_pattern', 'calathea_underview', 'calathea_new_leaf'],
  },
  {
    id: 'espatifilo',
    name: 'Espatifilo (Cuna de Moisés)',
    scientificName: 'Spathiphyllum wallisii',
    family: 'Araceae',
    confidence: 97,
    healthScore: 93,
    watering: 'Cada 5 a 7 días. Te avisa bajando ligeramente sus hojas cuando tiene sed.',
    wateringFrequencyDays: 6,
    light: 'Luz indirecta moderada a baja. Florece mejor con luminosidad filtrada suave.',
    temperature: '18°C a 26°C. No tolera frío bajo 14°C.',
    humidity: 'Alta (50% - 70%). Agradece pulverizaciones frecuentes de agua tibia.',
    careLevels: {
      lightLevel: 2,
      wateringLevel: 3,
      humidityLevel: 4,
      tempMinC: 18,
      tempMaxC: 26,
    },
    difficulty: 'Fácil',
    commonProblems: [
      'Hojas desmayadas hacia el suelo: Falta urgente de agua (recupera en 2 horas).',
      'Puntas negras en las espátulas blancas: Exceso de fertilizante mineral.',
    ],
    climateTip: 'Excelente biofiltro contra esporas de moho y formaldehído ambiental.',
    habitatSummary: 'Riberas de arroyos en selvas tropicales de Colombia y Venezuela.',
    nativeRegions: ['Colombia', 'Venezuela', 'Ecuador', 'Panama'],
    avatarEmoji: '🤍',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Peace_lily_-_1_-_cropped.jpg/330px-Peace_lily_-_1_-_cropped.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['spathi_bloom', 'spathi_spathe', 'spathi_leaves'],
  },
  {
    id: 'romero',
    name: 'Romero Aromático',
    scientificName: 'Salvia rosmarinus Spenn.',
    family: 'Lamiaceae',
    confidence: 98,
    healthScore: 92,
    watering: 'Cada 8 a 12 días en maceta profunda. Dejar secar el sustrato completamente.',
    wateringFrequencyDays: 10,
    light: 'Pleno sol directo (6 a 8 horas diarias sin excepciones).',
    temperature: '12°C a 30°C. Muy rústico y resistente.',
    humidity: 'Baja a media. Necesita aireación constante y sustrato calizo drenante.',
    careLevels: {
      lightLevel: 5,
      wateringLevel: 2,
      humidityLevel: 2,
      tempMinC: 12,
      tempMaxC: 30,
    },
    difficulty: 'Fácil',
    commonProblems: [
      'Moho blanco en hojas: Falta de ventilación o humedad ambiental estancada.',
      'Caída de agujas basales: Encharcamiento de raíces en tiesto sin drenaje.',
    ],
    climateTip: 'Hierba culinaria y medicinal. Aumenta la concentración y atrae abejas polinizadoras.',
    habitatSummary: 'Acantilados secos y matorrales costeros de la cuenca mediterránea.',
    nativeRegions: ['Spain', 'Italy', 'Greece', 'Turkey', 'Tunisia'],
    avatarEmoji: '🌿',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Rosemary_in_bloom.JPG/330px-Rosemary_in_bloom.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['rosemary_sprig', 'rosemary_needle', 'rosemary_blue_flowers'],
  },
  {
    id: 'cinta',
    name: 'Cinta (Lazo de Amor)',
    scientificName: 'Chlorophytum comosum',
    family: 'Asparagaceae',
    confidence: 98,
    healthScore: 95,
    watering: 'Cada 5 a 7 días en verano; cada 10 a 12 días en invierno. Dejar secar la capa superior.',
    wateringFrequencyDays: 6,
    light: 'Luz indirecta brillante o semisombra. Tolera luz baja.',
    temperature: '15°C a 25°C. Proteger de heladas bajo 7°C.',
    humidity: 'Media (40% - 60%). Muy resistente a ambientes secos.',
    careLevels: { lightLevel: 3, wateringLevel: 3, humidityLevel: 3, tempMinC: 15, tempMaxC: 25 },
    difficulty: 'Fácil',
    commonProblems: ['Puntas marrones: Acumulación de sales de agua de grifo o sequedad.', 'Pérdida de rayas blancas: Luz insuficiente.'],
    climateTip: 'Genera hijuelos colgantes fácilmente enraizables en agua o sustrato.',
    habitatSummary: 'Pastizales y bosques ribereños del sur y oeste de África.',
    nativeRegions: ['South Africa', 'Mozambique', 'Zimbabwe'],
    avatarEmoji: '🌾',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Hierbabuena_0611_Revised.jpg/330px-Hierbabuena_0611_Revised.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['spider_plant_leaves', 'spider_plant_runners'],
  },
  {
    id: 'pachira',
    name: 'Árbol del Dinero (Pachira)',
    scientificName: 'Pachira aquatica',
    family: 'Malvaceae',
    confidence: 96,
    healthScore: 92,
    watering: 'Cada 7 a 10 días dejando secar los primeros 4 cm de sustrato.',
    wateringFrequencyDays: 8,
    light: 'Luz brillante indirecta o sol filtrado matutino.',
    temperature: '16°C a 26°C. Sensible al frío por debajo de 12°C.',
    humidity: 'Media a alta (50% - 70%). Pulverizar follaje regularmente.',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 4, tempMinC: 16, tempMaxC: 26 },
    difficulty: 'Fácil',
    commonProblems: ['Hojas amarillas y blandas: Encharcamiento de su tronco hinchado.', 'Caída de follaje: Cambios bruscos de temperatura o corrientes.'],
    climateTip: 'Su tronco retiene agua; en caso de duda, pospón el riego 2 días más.',
    habitatSummary: 'Pantanos y selvas tropicales inundables de Centro y Sudamérica.',
    nativeRegions: ['Brazil', 'Costa Rica', 'Panama', 'Mexico'],
    avatarEmoji: '🌳',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Flickr_-_archer10_%28Dennis%29_-_Guatemala-1376.jpg/330px-Flickr_-_archer10_%28Dennis%29_-_Guatemala-1376.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['pachira_braid', 'pachira_canopy'],
  },
  {
    id: 'albahaca',
    name: 'Albahaca Genovesa',
    scientificName: 'Ocimum basilicum',
    family: 'Lamiaceae',
    confidence: 99,
    healthScore: 91,
    watering: 'Cada 2 a 4 días manteniendo el sustrato húmedo pero bien drenado.',
    wateringFrequencyDays: 3,
    light: 'Sol directo pleno (mínimo 6 horas diarias).',
    temperature: '18°C a 28°C. Muy sensible a bajas temperaturas.',
    humidity: 'Media (40% - 60%). Buena ventilación requerida.',
    careLevels: { lightLevel: 5, wateringLevel: 4, humidityLevel: 3, tempMinC: 18, tempMaxC: 28 },
    difficulty: 'Fácil',
    commonProblems: ['Floración prematura: Disminuye el aroma de las hojas; pinzar los botones.', 'Hojas marchitas en horas: Alta demanda hídrica en pleno sol.'],
    climateTip: 'Pinza las puntas de los tallos para estimular un crecimiento frondoso y ramificado.',
    habitatSummary: 'Regiones tropicales de África central hasta el sudeste asiático.',
    nativeRegions: ['India', 'Thailand', 'Iran'],
    avatarEmoji: '🌿',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Ocimum_basilicum_8zz.jpg/330px-Ocimum_basilicum_8zz.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['basil_leaves', 'basil_plant'],
  },
  {
    id: 'menta',
    name: 'Menta Verde (Hierbabuena)',
    scientificName: 'Mentha spicata',
    family: 'Lamiaceae',
    confidence: 98,
    healthScore: 94,
    watering: 'Cada 3 a 5 días; le encanta el suelo fresco y húmedo.',
    wateringFrequencyDays: 4,
    light: 'Luz brillante con sol suave matutino o semisombra.',
    temperature: '14°C a 26°C. Tolera inviernos templados.',
    humidity: 'Media a alta (50% - 70%).',
    careLevels: { lightLevel: 4, wateringLevel: 4, humidityLevel: 4, tempMinC: 14, tempMaxC: 26 },
    difficulty: 'Fácil',
    commonProblems: ['Invasión del tiesto: Crece por estolones rápidos; plantar en maceta independiente.'],
    climateTip: 'Corta tallos con frecuencia para incentivar nuevos brotes tiernos y aromáticos.',
    habitatSummary: 'Zonas templadas y orillas fluviales de Europa y el Mediterráneo.',
    nativeRegions: ['Spain', 'Italy', 'Greece', 'United Kingdom'],
    avatarEmoji: '🍃',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Minze.jpg/330px-Minze.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['mint_sprig', 'mint_foliage'],
  },
  {
    id: 'pilea',
    name: 'Pilea Peperomioides (Planta China del Dinero)',
    scientificName: 'Pilea peperomioides',
    family: 'Urticaceae',
    confidence: 97,
    healthScore: 93,
    watering: 'Cada 6 a 8 días cuando el sustrato empiece a secarse.',
    wateringFrequencyDays: 7,
    light: 'Luz brillante filtrada; evitar rayos directos sobre sus hojas redondas.',
    temperature: '16°C a 24°C. Evitar frío inferior a 10°C.',
    humidity: 'Media (50% - 60%).',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 3, tempMinC: 16, tempMaxC: 24 },
    difficulty: 'Fácil',
    commonProblems: ['Hojas curvadas en cúpula: Demasiada o muy poca luz; ajustar posición.', 'Pérdida de hojas basales: Proceso natural o riego excesivo.'],
    climateTip: 'Gira la maceta semanalmente para que el tallo central crezca recto y equilibrado.',
    habitatSummary: 'Montañas húmedas sombreadas de Yunnan, sudoeste de China.',
    nativeRegions: ['China'],
    avatarEmoji: '🪙',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Pilea_peperomioides_Chinese_money_plant.jpg/330px-Pilea_peperomioides_Chinese_money_plant.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['pilea_leaves', 'pilea_pups'],
  },
  {
    id: 'jade',
    name: 'Árbol de Jade',
    scientificName: 'Crassula ovata',
    family: 'Crassulaceae',
    confidence: 99,
    healthScore: 97,
    watering: 'Cada 14 a 20 días. Dejar secar totalmente la tierra antes de regar de nuevo.',
    wateringFrequencyDays: 16,
    light: 'Luz brillante o sol directo matutino (4 a 6 horas).',
    temperature: '15°C a 28°C. Proteger de heladas.',
    humidity: 'Baja (20% - 40%). Sustrato arenoso de rápido drenaje.',
    careLevels: { lightLevel: 5, wateringLevel: 1, humidityLevel: 1, tempMinC: 15, tempMaxC: 28 },
    difficulty: 'Fácil',
    commonProblems: ['Hojas arrugadas y blandas: Sed.', 'Hojas translúcidas y caedizas: Exceso de riego.'],
    climateTip: 'Planta centenaria asociada a la buena fortuna. Con sol directo toma bordes rojizos.',
    habitatSummary: 'Colinas rocosas secas de Sudáfrica y Mozambique.',
    nativeRegions: ['South Africa', 'Mozambique'],
    avatarEmoji: '🪴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Crassula_ovata_700.jpg/330px-Crassula_ovata_700.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['jade_stem', 'jade_leaves'],
  },
  {
    id: 'potus-plateado',
    name: 'Pothos Plateado (Scindapsus)',
    scientificName: 'Scindapsus pictus',
    family: 'Araceae',
    confidence: 96,
    healthScore: 90,
    watering: 'Cada 7 a 9 días cuando las hojas pierdan turgencia.',
    wateringFrequencyDays: 8,
    light: 'Luz indirecta media a brillante.',
    temperature: '18°C a 27°C. No tolera corrientes gélidas.',
    humidity: 'Media a alta (50% - 70%).',
    careLevels: { lightLevel: 3, wateringLevel: 3, humidityLevel: 4, tempMinC: 18, tempMaxC: 27 },
    difficulty: 'Fácil',
    commonProblems: ['Hojas rizadas hacia adentro: Sed.', 'Pérdida de manchas satinadas: Poca luz.'],
    climateTip: 'Hojas gruesas aterciopeladas con manchas plateadas reflectantes naturales.',
    habitatSummary: 'Selvas húmedas tropicales de Malasia e Indonesia.',
    nativeRegions: ['Malaysia', 'Indonesia', 'Thailand', 'Philippines'],
    avatarEmoji: '✨',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Scindapsus_pictus_01.jpg/330px-Scindapsus_pictus_01.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['scindapsus_variegation', 'scindapsus_vine'],
  },
  {
    id: 'ficus-elastica',
    name: 'Ficus Elástica (Gomero)',
    scientificName: 'Ficus elastica Roxb.',
    family: 'Moraceae',
    confidence: 97,
    healthScore: 93,
    watering: 'Cada 8 a 12 días; dejar secar los primeros 5 cm de sustrato.',
    wateringFrequencyDays: 10,
    light: 'Luz muy luminosa filtrada; acepta sol suave de mañana.',
    temperature: '16°C a 26°C.',
    humidity: 'Media (40% - 60%). Limpiar sus hojas con paño suave.',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 3, tempMinC: 16, tempMaxC: 26 },
    difficulty: 'Fácil',
    commonProblems: ['Hojas inferiores amarillas que caen: Exceso de agua o tiesto oscuro.'],
    climateTip: 'Limpia el polvo de sus hojas coriáceas para maximizar la fotosíntesis.',
    habitatSummary: 'Bosques lluviosos tropicales del noreste de India y Malasia.',
    nativeRegions: ['India', 'Nepal', 'Myanmar', 'Malaysia'],
    avatarEmoji: '🌳',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Ficus_elastica_leaves_02.JPG/330px-Ficus_elastica_leaves_02.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['rubber_leaf', 'rubber_bud'],
  },
  {
    id: 'anturio',
    name: 'Anturio Rojo',
    scientificName: 'Anthurium andraeanum',
    family: 'Araceae',
    confidence: 98,
    healthScore: 92,
    watering: 'Cada 6 a 8 días con agua sin cal.',
    wateringFrequencyDays: 7,
    light: 'Luz brillante difusa; jamás sol directo.',
    temperature: '18°C a 26°C.',
    humidity: 'Alta (60% - 80%). Pulverizar el follaje evitando la flor.',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 4, tempMinC: 18, tempMaxC: 26 },
    difficulty: 'Moderado',
    commonProblems: ['Flores descoloridas o verdes: Poca iluminación.', 'Bordes quemados: Salinidad.'],
    climateTip: 'Sus espátulas rojas cerosas pueden durar hasta 2 meses florecidas.',
    habitatSummary: 'Sotobosque húmedo de selvas de Colombia y Ecuador.',
    nativeRegions: ['Colombia', 'Ecuador'],
    avatarEmoji: '❤️',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/AnthuriumAndraenum.jpg/330px-AnthuriumAndraenum.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['anthurium_flower', 'anthurium_spathe'],
  },
  {
    id: 'dracaena-marginata',
    name: 'Drácena Marginata',
    scientificName: 'Dracaena reflexa var. angustifolia',
    family: 'Asparagaceae',
    confidence: 97,
    healthScore: 94,
    watering: 'Cada 10 a 14 días. Muy sensible al encharcamiento.',
    wateringFrequencyDays: 12,
    light: 'Luz indirecta moderada a brillante.',
    temperature: '16°C a 27°C.',
    humidity: 'Media (40% - 60%).',
    careLevels: { lightLevel: 3, wateringLevel: 2, humidityLevel: 3, tempMinC: 16, tempMaxC: 27 },
    difficulty: 'Fácil',
    commonProblems: ['Puntas marrones: Sensibilidad al flúor del agua de grifo; usar agua reposada.'],
    climateTip: 'Excelente silueta arquitectónica con penachos de hojas finas con ribete rojo.',
    habitatSummary: 'Zonas secas costeras de Madagascar e islas del océano Índico.',
    nativeRegions: ['Madagascar', 'Mauritius'],
    avatarEmoji: '🌴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Dracaena_reflexa.JPG/330px-Dracaena_reflexa.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['dracaena_crest', 'dracaena_stem'],
  },
  {
    id: 'chamaedorea',
    name: 'Palmera de Salón (Chamaedorea)',
    scientificName: 'Chamaedorea elegans',
    family: 'Arecaceae',
    confidence: 97,
    healthScore: 93,
    watering: 'Cada 6 a 8 días manteniendo humedad ligera.',
    wateringFrequencyDays: 7,
    light: 'Semisombra o luz media; tolera rincones poco iluminados.',
    temperature: '16°C a 24°C.',
    humidity: 'Media a alta (50% - 70%).',
    careLevels: { lightLevel: 2, wateringLevel: 3, humidityLevel: 4, tempMinC: 16, tempMaxC: 24 },
    difficulty: 'Fácil',
    commonProblems: ['Hojas secas con telarañas: Araña roja por aire demasiado seco.'],
    climateTip: 'Palmera compacta perfecta para interiores y completamente segura para mascotas.',
    habitatSummary: 'Sotobosque de selvas húmedas de México y Guatemala.',
    nativeRegions: ['Mexico', 'Guatemala'],
    avatarEmoji: '🌴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Chamaedorea_elegans_Mart.JPG/330px-Chamaedorea_elegans_Mart.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['parlor_palm_fronds', 'parlor_palm_clump'],
  },
  {
    id: 'orquidea-vanda',
    name: 'Orquídea Azul (Vanda)',
    scientificName: 'Vanda coerulea',
    family: 'Orchidaceae',
    confidence: 95,
    healthScore: 89,
    watering: 'Inmersión o pulverización diaria de raíces al aire cada 1 a 2 días.',
    wateringFrequencyDays: 2,
    light: 'Mucha luz brillante con sol suave matutino.',
    temperature: '18°C a 30°C.',
    humidity: 'Muy alta (70% - 90%). Ventilación continua indispensable.',
    careLevels: { lightLevel: 5, wateringLevel: 4, humidityLevel: 5, tempMinC: 18, tempMaxC: 30 },
    difficulty: 'Avanzado',
    commonProblems: ['Raíces secas quebradizas: Humedad ambiental insuficiente.'],
    climateTip: 'Suele cultivarse en cestas colgantes sin sustrato, con raíces al aire libre.',
    habitatSummary: 'Montañas tropicales del noreste de India, Tailandia y Myanmar.',
    nativeRegions: ['India', 'Thailand', 'Myanmar', 'China'],
    avatarEmoji: '🪻',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/An_orchid_%28Vanda_caerulea%29%3B_flowering_stem._Watercolour._Wellcome_V0043303.jpg/330px-An_orchid_%28Vanda_caerulea%29%3B_flowering_stem._Watercolour._Wellcome_V0043303.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['vanda_blue_bloom', 'vanda_hanging_roots'],
  },
  {
    id: 'filodendro-brasil',
    name: 'Filodendro Brasil',
    scientificName: 'Philodendron hederaceum var. oxycardium',
    family: 'Araceae',
    confidence: 97,
    healthScore: 94,
    watering: 'Cada 6 a 8 días dejando secar la superficie.',
    wateringFrequencyDays: 7,
    light: 'Luz brillante indirecta para mantener su variegación lima-limón.',
    temperature: '17°C a 26°C.',
    humidity: 'Media (50% - 70%).',
    careLevels: { lightLevel: 3, wateringLevel: 3, humidityLevel: 3, tempMinC: 17, tempMaxC: 26 },
    difficulty: 'Fácil',
    commonProblems: ['Hojas verdes lisas: Poca intensidad luminosa.'],
    climateTip: 'Hojas acorazonadas con llamativa franja central amarillo-neón.',
    habitatSummary: 'Selvas tropicales del Caribe y América del Sur.',
    nativeRegions: ['Brazil', 'Colombia', 'Venezuela'],
    avatarEmoji: '🌿',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Philodendron_scandens_subsp_oxycardium2.jpg/330px-Philodendron_scandens_subsp_oxycardium2.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['philodendron_brasil_leaf', 'philodendron_variegation'],
  },
  {
    id: 'croton',
    name: 'Crotón Variegado',
    scientificName: 'Codiaeum variegatum',
    family: 'Euphorbiaceae',
    confidence: 96,
    healthScore: 88,
    watering: 'Cada 4 a 6 días manteniendo tierra ligeramente fresca.',
    wateringFrequencyDays: 5,
    light: 'Mucha luz directa o sol filtrado intenso para conservar colores vivos.',
    temperature: '18°C a 27°C. Odia el frío por debajo de 15°C.',
    humidity: 'Alta (60% - 80%).',
    careLevels: { lightLevel: 5, wateringLevel: 4, humidityLevel: 4, tempMinC: 18, tempMaxC: 27 },
    difficulty: 'Moderado',
    commonProblems: ['Hojas que se vuelven verdes: Escasez de sol.', 'Caída repentina: Corrientes de aire.'],
    climateTip: 'Explosión de colores rojo, amarillo y naranja; requiere máxima luminosidad.',
    habitatSummary: 'Bosques costeros tropicales de Indonesia, Malasia y Australia.',
    nativeRegions: ['Indonesia', 'Malaysia', 'Australia'],
    avatarEmoji: '🍂',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Colpfl05.jpg/330px-Colpfl05.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['croton_foliage', 'croton_color'],
  },
  {
    id: 'begonia-maculata',
    name: 'Begonia de Lunares (Maculata)',
    scientificName: 'Begonia maculata Raddi',
    family: 'Begoniaceae',
    confidence: 96,
    healthScore: 90,
    watering: 'Cada 5 a 7 días. Dejar secar los 3 cm superiores de sustrato.',
    wateringFrequencyDays: 6,
    light: 'Luz brillante filtrada. Evitar sol directo sobre los lunares plateados.',
    temperature: '18°C a 24°C.',
    humidity: 'Alta (60% - 75%). No mojar sus hojas directamente.',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 4, tempMinC: 18, tempMaxC: 24 },
    difficulty: 'Moderado',
    commonProblems: ['Manchas marrones crujientes: Sequedad ambiental.', 'Moho blanco: Gotas de agua en hojas.'],
    climateTip: 'Envés rojizo intenso y haz verde oliva con lunares plateados reflectantes.',
    habitatSummary: 'Sotobosque húmedo de la Mata Atlántica de Brasil.',
    nativeRegions: ['Brazil'],
    avatarEmoji: '🍃',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/Begonia_maculata3073316230.jpg/330px-Begonia_maculata3073316230.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['begonia_spots', 'begonia_red_underside'],
  },
  {
    id: 'suculenta-cebra',
    name: 'Planta Cebra (Haworthia)',
    scientificName: 'Haworthiopsis fasciata',
    family: 'Asphodelaceae',
    confidence: 98,
    healthScore: 96,
    watering: 'Cada 14 a 20 días. Regar únicamente con sustrato seco al 100%.',
    wateringFrequencyDays: 16,
    light: 'Luz indirecta brillante o sol suave de la mañana.',
    temperature: '15°C a 28°C.',
    humidity: 'Baja (20% - 40%). Sustrato mineral para suculentas.',
    careLevels: { lightLevel: 4, wateringLevel: 1, humidityLevel: 1, tempMinC: 15, tempMaxC: 28 },
    difficulty: 'Fácil',
    commonProblems: ['Roseta blanda amarillenta: Pudrición por agua estancada en el centro.'],
    climateTip: 'Bandas blancas transversales en relieve como rayas de cebra. Segura con gatos.',
    habitatSummary: 'Laderas rocosas y matorrales secos de Cabo Oriental, Sudáfrica.',
    nativeRegions: ['South Africa'],
    avatarEmoji: '🦓',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/1_Haworthia_fasciata_-MBB_Kabeljouws_River.jpg/330px-1_Haworthia_fasciata_-MBB_Kabeljouws_River.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['haworthia_stripes', 'haworthia_rosette'],
  },
  {
    id: 'bromelia',
    name: 'Bromelia Escarlata (Guzmania)',
    scientificName: 'Guzmania lingulata',
    family: 'Bromeliaceae',
    confidence: 97,
    healthScore: 92,
    watering: 'Cada 7 a 9 días. Mantener agua limpia en el cáliz o copa central.',
    wateringFrequencyDays: 8,
    light: 'Luz brillante tamizada o semisombra.',
    temperature: '18°C a 26°C.',
    humidity: 'Alta (60% - 80%).',
    careLevels: { lightLevel: 3, wateringLevel: 3, humidityLevel: 4, tempMinC: 18, tempMaxC: 26 },
    difficulty: 'Fácil',
    commonProblems: ['Pudrición del cáliz: Agua estancada sucia; renovar el agua de la copa mensualmente.'],
    climateTip: 'Epífita tropical. La inflorescencia roja dura de 3 a 5 meses antes de dar hijuelos.',
    habitatSummary: 'Bosques lluviosos neotropicales desde México hasta Bolivia.',
    nativeRegions: ['Ecuador', 'Colombia', 'Costa Rica', 'Brazil'],
    avatarEmoji: '🌺',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Bromeliaceae03.jpg/330px-Bromeliaceae03.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['guzmania_bloom', 'guzmania_cup'],
  },
  {
    id: 'cactus-navidad',
    name: 'Cactus de Navidad',
    scientificName: 'Schlumbergera truncata',
    family: 'Cactaceae',
    confidence: 98,
    healthScore: 95,
    watering: 'Cada 7 a 10 días; a diferencia de cactus desérticos, necesita suelo fresco.',
    wateringFrequencyDays: 8,
    light: 'Luz brillante indirecta. Cero sol ardiente.',
    temperature: '16°C a 22°C. Requiere noches frescas (15°C) en otoño para florecer.',
    humidity: 'Media a alta (50% - 70%).',
    careLevels: { lightLevel: 3, wateringLevel: 3, humidityLevel: 3, tempMinC: 16, tempMaxC: 22 },
    difficulty: 'Fácil',
    commonProblems: ['Caída de capullos florales: Mover la maceta de sitio una vez formados los botones.'],
    climateTip: 'Cactus epífito sin espinas; florece espectacularmente en invierno.',
    habitatSummary: 'Selvas costeras de montaña del sureste de Brasil.',
    nativeRegions: ['Brazil'],
    avatarEmoji: '🌸',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Cactus_de_no%C3%ABl_rev.jpg/330px-Cactus_de_no%C3%ABl_rev.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['schlumbergera_flower', 'schlumbergera_segments'],
  },
  {
    id: 'tomillo',
    name: 'Tomillo Silvestre',
    scientificName: 'Thymus vulgaris',
    family: 'Lamiaceae',
    confidence: 98,
    healthScore: 94,
    watering: 'Cada 10 a 14 días en maceta drenante.',
    wateringFrequencyDays: 12,
    light: 'Pleno sol directo (mínimo 6 horas obligatorias).',
    temperature: '12°C a 29°C. Muy resistente a sequías.',
    humidity: 'Baja a moderada. No tolera aire húmedo condensado.',
    careLevels: { lightLevel: 5, wateringLevel: 2, humidityLevel: 2, tempMinC: 12, tempMaxC: 29 },
    difficulty: 'Fácil',
    commonProblems: ['Tallos negros encharcados: Sustrato pesado o plato con agua estancada.'],
    climateTip: 'Hierba rústica antibacteriana y culinaria. Riega poco y solea mucho.',
    habitatSummary: 'Laderas pedregosas y matorrales soleados del Mediterráneo.',
    nativeRegions: ['Spain', 'France', 'Italy'],
    avatarEmoji: '🌿',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Thymus_vulgaris1.JPG/330px-Thymus_vulgaris1.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['thyme_sprig', 'thyme_blooms'],
  },
  {
    id: 'singonio',
    name: 'Singonio Flecha',
    scientificName: 'Syngonium podophyllum',
    family: 'Araceae',
    confidence: 97,
    healthScore: 94,
    watering: 'Cada 5 a 7 días dejando secar la mitad superior del sustrato.',
    wateringFrequencyDays: 6,
    light: 'Luz indirecta moderada a brillante.',
    temperature: '17°C a 26°C.',
    humidity: 'Media a alta (50% - 75%).',
    careLevels: { lightLevel: 3, wateringLevel: 3, humidityLevel: 4, tempMinC: 17, tempMaxC: 26 },
    difficulty: 'Fácil',
    commonProblems: ['Hojas marchitas y decaídas: Sed.', 'Hojas pálidas con quemaduras: Sol directo.'],
    climateTip: 'Sus hojas juveniles en forma de flecha se transforman en lóbulos a medida que trepa.',
    habitatSummary: 'Selvas tropicales húmedas de México a Sudamérica tropical.',
    nativeRegions: ['Mexico', 'Guatemala', 'Costa Rica', 'Brazil'],
    avatarEmoji: '🏹',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Zingiber_malaysianum.jpg/330px-Zingiber_malaysianum.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['syngonium_arrowhead', 'syngonium_vine'],
  },
  {
    id: 'dieffenbachia',
    name: 'Diefenbaquia Amoena (Lotería)',
    scientificName: 'Dieffenbachia seguine',
    family: 'Araceae',
    confidence: 97,
    healthScore: 93,
    watering: 'Cada 6 a 9 días cuando los 4 cm superiores estén secos.',
    wateringFrequencyDays: 7,
    light: 'Luz filtrada brillante. Evitar sol directo sobre su gran follaje.',
    temperature: '18°C a 27°C. Proteger de corrientes bajo 15°C.',
    humidity: 'Media a alta (55% - 75%).',
    careLevels: { lightLevel: 3, wateringLevel: 3, humidityLevel: 4, tempMinC: 18, tempMaxC: 27 },
    difficulty: 'Fácil',
    commonProblems: ['Bordes de hojas amarillentos: Agua de riego demasiado fría.'],
    climateTip: 'Patrón variegado verde y crema muy decorativo. Manipular con guantes por su savia cáustica.',
    habitatSummary: 'Sotobosque húmedo del trópico americano y las Antillas.',
    nativeRegions: ['Brazil', 'Colombia', 'Costa Rica', 'Cuba'],
    avatarEmoji: '🪴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Starr_061212-2331_Dieffenbachia_seguine.jpg/330px-Starr_061212-2331_Dieffenbachia_seguine.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['dieffenbachia_leaf', 'dieffenbachia_stalk'],
  },
  {
    id: 'maranta',
    name: 'Maranta Tricolor (Fascinator)',
    scientificName: 'Maranta leuconeura var. erythroneura',
    family: 'Marantaceae',
    confidence: 96,
    healthScore: 89,
    watering: 'Cada 4 a 6 días con agua sin cal.',
    wateringFrequencyDays: 5,
    light: 'Sombra brillante o luz tamizada. El sol decolora sus nervaduras rojas.',
    temperature: '18°C a 25°C.',
    humidity: 'Alta (60% - 80%). Pulverizar el entorno con agua tibia.',
    careLevels: { lightLevel: 2, wateringLevel: 4, humidityLevel: 5, tempMinC: 18, tempMaxC: 25 },
    difficulty: 'Moderado',
    commonProblems: ['Hojas rizadas de día: Aire ambiental seco.', 'Puntas marrones: Salinidad en agua.'],
    climateTip: 'Planta de la oración: sus hojas aterciopeladas se pliegan hacia arriba al caer la noche.',
    habitatSummary: 'Selvas húmedas tropicales de tierras bajas en Brasil.',
    nativeRegions: ['Brazil'],
    avatarEmoji: '🎨',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Maranta_leuconeura3.jpg/330px-Maranta_leuconeura3.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ['maranta_tricolor_leaf', 'maranta_pattern'],
  },
  {
    id: 'zamioculcas',
    name: 'Zamioculcas (Planta ZZ)',
    scientificName: 'Zamioculcas zamiifolia',
    family: 'Araceae',
    confidence: 97,
    healthScore: 95,
    watering: 'Cada 15 a 20 días. Tolera sequías prolongadas; regar solo cuando el sustrato esté seco por completo.',
    wateringFrequencyDays: 18,
    light: 'Luz indirecta baja o moderada. Muy resistente a rincones sombríos.',
    temperature: '18°C a 26°C. Sensible a fríos por debajo de 12°C.',
    humidity: 'Media (40% - 50%). Se adapta perfectamente al aire seco de interior.',
    careLevels: { lightLevel: 2, wateringLevel: 1, humidityLevel: 2, tempMinC: 15, tempMaxC: 28 },
    difficulty: 'Fácil',
    commonProblems: [
      "Hojas amarillas y tallos blandos: Exceso de agua en rizomas.",
      "Hojas curvadas hacia abajo: Falta extrema de riego.",
      "Crecimiento lento: Normal en la especie; acelerable con luz indirecta."
],
    climateTip: 'Ideal para principiantes y despachos. Sus rizomas tubulares almacenan agua como reserva.',
    habitatSummary: 'Pastizales y bosques secos de África oriental (Kenia, Tanzania y Zanzíbar).',
    nativeRegions: ["Kenya","Tanzania","Mozambique"],
    avatarEmoji: '🪴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Zamioculcas_zamiifolia_1.jpg/330px-Zamioculcas_zamiifolia_1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["zz_leaf","zz_stem","zz_rhizome"],
    toxicity: 'Tóxica para mascotas por oxalatos insolubles.',
  },
  {
    id: 'areca',
    name: 'Palma Areca (Palmera Amarilla)',
    scientificName: 'Dypsis lutescens',
    family: 'Arecaceae',
    confidence: 96,
    healthScore: 90,
    watering: 'Cada 5 a 7 días en verano y cada 10 días en invierno. Mantener sustrato ligeramente húmedo sin encharcar.',
    wateringFrequencyDays: 6,
    light: 'Luz brillante indirecta. Evitar sol directo del mediodía que quema sus frondas.',
    temperature: '18°C a 25°C. Evitar corrientes de aire acondicionado.',
    humidity: 'Alta (55% - 75%). Agradece pulverizaciones frecuentes.',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 4, tempMinC: 16, tempMaxC: 28 },
    difficulty: 'Moderado',
    commonProblems: [
      "Puntas marrones: Ambiente seco o exceso de sales en el agua.",
      "Frondas pálidas o amarillentas: Falta de luz o carencia de nitrógeno.",
      "Cochinillas en la base de los tallos: Tratar con jabón potásico."
],
    climateTip: 'Excelente purificadora del aire y humidificadora natural para salones amplios.',
    habitatSummary: 'Humedales y márgenes ribereños de Madagascar.',
    nativeRegions: ["Madagascar"],
    avatarEmoji: '🌴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/%E6%95%A3%E5%B0%BE%E8%91%B5Dypsis_lutescens_20210511145013_05.jpg/330px-%E6%95%A3%E5%B0%BE%E8%91%B5Dypsis_lutescens_20210511145013_05.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["areca_frond","areca_clump","areca_trunk"],
    toxicity: 'Segura y no tóxica para perros y gatos.',
  },
  {
    id: 'ficus-benjamina',
    name: 'Ficus Benjamina (Laurel de la India)',
    scientificName: 'Ficus benjamina',
    family: 'Moraceae',
    confidence: 95,
    healthScore: 88,
    watering: 'Cada 7 a 9 días. Esperar a que la capa superficial esté seca al tacto.',
    wateringFrequencyDays: 8,
    light: 'Luz muy luminosa sin sol directo abrasador.',
    temperature: '16°C a 24°C. Muy sensible a cambios bruscos de temperatura y corrientes.',
    humidity: 'Media-alta (50% - 60%).',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 3, tempMinC: 14, tempMaxC: 28 },
    difficulty: 'Moderado',
    commonProblems: [
      "Caída repentina de hojas: Reacción clásica al moverla de sitio o a corrientes frías.",
      "Hojas pegajosas: Presencia de pulgón o cochinilla.",
      "Pérdida de brillo: Polvo en las hojas; limpiar con paño húmedo."
],
    climateTip: 'Una vez que encuentres un rincón donde esté a gusto, no la cambies de sitio.',
    habitatSummary: 'Bosques lluviosos y bordes de ríos del sur y sudeste asiático y Australia.',
    nativeRegions: ["India","Thailand","Indonesia","Australia"],
    avatarEmoji: '🌳',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Starr-080608-7576-Ficus_benjamina-habit_with_Laysan_albatross-Gym_Sand_Island-Midway_Atoll_%2824823189861%29.jpg/330px-Starr-080608-7576-Ficus_benjamina-habit_with_Laysan_albatross-Gym_Sand_Island-Midway_Atoll_%2824823189861%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["benjamina_leaf","benjamina_branch","benjamina_canopy"],
    toxicity: 'Tóxica para mascotas por savia lechosa irritante.',
  },
  {
    id: 'monstera-adansonii',
    name: 'Monstera Adansonii (Monkey Mask)',
    scientificName: 'Monstera adansonii',
    family: 'Araceae',
    confidence: 97,
    healthScore: 93,
    watering: 'Cada 6 a 8 días. Regar cuando los primeros 3 cm de tierra estén secos.',
    wateringFrequencyDays: 7,
    light: 'Luz indirecta brillante o tamizada.',
    temperature: '18°C a 27°C. Proteger del frío por debajo de 15°C.',
    humidity: 'Alta (60% - 80%). Pulverizar o ubicar cerca de otras plantas.',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 4, tempMinC: 16, tempMaxC: 28 },
    difficulty: 'Fácil',
    commonProblems: [
      "Bordes marrones secos: Baja humedad relativa.",
      "Hojas amarillas basales: Riego excesivo.",
      "Crecimiento larguirucho: Falta de tutor o poca luz."
],
    climateTip: 'Planta trepadora o colgante muy vistosa con orificios naturales en sus hojas.',
    habitatSummary: 'Selvas tropicales de Centroamérica y cuenca amazónica sudamericana.',
    nativeRegions: ["Brazil","Colombia","Costa Rica","Peru"],
    avatarEmoji: '🌿',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Monstera_adansonii_79319231.jpg/330px-Monstera_adansonii_79319231.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["adansonii_holes","adansonii_vine","adansonii_climbing"],
    toxicity: 'Tóxica para mascotas por oxalatos de calcio.',
  },
  {
    id: 'hortensia',
    name: 'Hortensia',
    scientificName: 'Hydrangea macrophylla',
    family: 'Hydrangeaceae',
    confidence: 98,
    healthScore: 91,
    watering: 'Frecuente, cada 2 a 4 días en floración. Requiere sustrato húmedo constante pero con buen drenaje.',
    wateringFrequencyDays: 3,
    light: 'Semisombra o sol suave de mañana. Evitar sol fuerte de tarde.',
    temperature: '12°C a 22°C. Agradece frescor nocturno.',
    humidity: 'Media-alta (60% - 70%).',
    careLevels: { lightLevel: 3, wateringLevel: 5, humidityLevel: 4, tempMinC: 10, tempMaxC: 24 },
    difficulty: 'Moderado',
    commonProblems: [
      "Flores y hojas caídas: Falta de agua urgente; sumergir maceta 15 min.",
      "Hojas amarillas con nervios verdes: Clorosis férrica por agua dura.",
      "Falta de floración: Poda tardía en la que se cortaron las yemas del año anterior."
],
    climateTip: 'El color de sus flores depende del pH del suelo: azul en ácidos y rosa en alcalinos.',
    habitatSummary: 'Laderas montañosas marítimas de Japón y Asia oriental.',
    nativeRegions: ["Japan","China","Korea"],
    avatarEmoji: '🌸',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/%28Natural%29_Hydrangea_macrophylla%2C_Iwafune%2C_Isumi%2C_Chiba%2C_Japan_2.jpg/330px-%28Natural%29_Hydrangea_macrophylla%2C_Iwafune%2C_Isumi%2C_Chiba%2C_Japan_2.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["hydrangea_bloom","hydrangea_bush","hydrangea_foliage"],
    toxicity: 'Tóxica para mascotas si se ingieren brotes o flores.',
  },
  {
    id: 'hibisco',
    name: 'Hibisco (Rosa de China)',
    scientificName: 'Hibiscus rosa-sinensis',
    family: 'Malvaceae',
    confidence: 96,
    healthScore: 89,
    watering: 'Cada 3 a 5 días durante la floración primaveral y estival; espaciar en invierno.',
    wateringFrequencyDays: 4,
    light: 'Sol directo moderado (4-6 horas) o luz muy intensa.',
    temperature: '15°C a 28°C. Proteger de heladas invernales.',
    humidity: 'Media (50% - 60%).',
    careLevels: { lightLevel: 5, wateringLevel: 4, humidityLevel: 3, tempMinC: 12, tempMaxC: 30 },
    difficulty: 'Moderado',
    commonProblems: [
      "Botones florales que caen antes de abrir: Cambios bruscos de temperatura o riego irregular.",
      "Mosca blanca y pulgón: Vigilar el envés de hojas jóvenes.",
      "Hojas amarillentas: Clima frío o falta de quelatos de hierro."
],
    climateTip: 'Florece continuamente si recibe buena dosis de sol y fertilizante rico en potasio.',
    habitatSummary: 'Originaria de Asia tropical y subtropical insular.',
    nativeRegions: ["China","India","Pacific Islands"],
    avatarEmoji: '🌺',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Hibiscus_Brilliant.jpg/330px-Hibiscus_Brilliant.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["hibiscus_red","hibiscus_pistil","hibiscus_petal"],
    toxicity: 'No tóxica y segura para perros y gatos.',
  },
  {
    id: 'peperomia-obtusifolia',
    name: 'Peperomia (Cucharita)',
    scientificName: 'Peperomia obtusifolia',
    family: 'Piperaceae',
    confidence: 97,
    healthScore: 94,
    watering: 'Cada 8 a 12 días. Almacena agua en sus hojas carnosas; regar solo cuando la tierra seque.',
    wateringFrequencyDays: 10,
    light: 'Luz indirecta media a brillante.',
    temperature: '18°C a 25°C. Evitar frío por debajo de 14°C.',
    humidity: 'Media (40% - 60%). Tolera bien interiores comunes.',
    careLevels: { lightLevel: 3, wateringLevel: 2, humidityLevel: 3, tempMinC: 15, tempMaxC: 27 },
    difficulty: 'Fácil',
    commonProblems: [
      "Hojas blandas y caedizas: Riego excesivo y asfixia radicular.",
      "Tallos estirados y hojas pequeñas: Iluminación deficiente.",
      "Manchas negras acuosas: Hongo por exceso de humedad."
],
    climateTip: 'Compacta y elegante para escritorios. Hojas gruesas semicarnosas de tacto ceroso.',
    habitatSummary: 'Suelo de selvas lluviosas de Florida, México, Caribe y norte de Sudamérica.',
    nativeRegions: ["Mexico","United States","Colombia","Cuba"],
    avatarEmoji: '🍃',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Peperomia_obtusifolia_3-OB9.jpg/330px-Peperomia_obtusifolia_3-OB9.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["peperomia_spoon","peperomia_foliage","peperomia_pot"],
    toxicity: 'Segura y no tóxica para mascotas y niños.',
  },
  {
    id: 'cactus-asiento-suegra',
    name: 'Cactus Barril Dorado (Asiento de Suegra)',
    scientificName: 'Echinocactus grusonii',
    family: 'Cactaceae',
    confidence: 99,
    healthScore: 98,
    watering: 'Cada 20 a 30 días en primavera/verano; suspender casi totalmente en invierno.',
    wateringFrequencyDays: 25,
    light: 'Pleno sol directo (mínimo 6 horas al día).',
    temperature: '18°C a 35°C. Tolera frío seco hasta 5°C.',
    humidity: 'Muy baja (20% - 35%). Climas áridos.',
    careLevels: { lightLevel: 5, wateringLevel: 1, humidityLevel: 1, tempMinC: 5, tempMaxC: 38 },
    difficulty: 'Fácil',
    commonProblems: [
      "Base reblandecida y oscura: Pudrición fatal por exceso de riego.",
      "Forma alargada en vez de esférica (etiolación): Falta grave de sol directo.",
      "Manchas blanquecinas algodonosas: Cochinilla algodonosa en espinas."
],
    climateTip: 'Usa maceta de barro con orificio amplio y sustrato específico para cactáceas con grava volcánica.',
    habitatSummary: 'Laderas rocosas y cañones áridos del centro de México (Querétaro e Hidalgo).',
    nativeRegions: ["Mexico"],
    avatarEmoji: '🌵',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Echinocactus_grusonii_%28aka%29.jpg/330px-Echinocactus_grusonii_%28aka%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["grusonii_globe","grusonii_spines","grusonii_top"],
    toxicity: 'No tóxico químicamente; manejar con guantes gruesos por sus espinas.',
  },
  {
    id: 'filodendro-birkin',
    name: 'Filodendro Birkin',
    scientificName: "Philodendron 'Birkin'",
    family: 'Araceae',
    confidence: 96,
    healthScore: 92,
    watering: 'Cada 7 a 9 días cuando el sustrato seque a media profundidad.',
    wateringFrequencyDays: 8,
    light: 'Luz indirecta brillante; esencial para mantener sus rayas blancas marcadas.',
    temperature: '18°C a 26°C.',
    humidity: 'Media-alta (50% - 70%).',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 4, tempMinC: 16, tempMaxC: 28 },
    difficulty: 'Fácil',
    commonProblems: [
      "Rayas blancas que desaparecen (hojas totalmente verdes): Falta de luz.",
      "Puntas marrones: Humedad ambiental escasa.",
      "Hojas basales flácidas: Encharcamiento de raíces."
],
    climateTip: 'Variedad híbrida muy cotizada por sus llamativas líneas blanco crema sobre verde oscuro.',
    habitatSummary: 'Híbrido de vivero derivado de especies selváticas tropicales de Sudamérica.',
    nativeRegions: ["Brazil","Colombia"],
    avatarEmoji: '🪴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Philodendron_giganteum_-_Laeken_Royal_Greenhouses_-_Royal_Castle_of_Laeken_-_Brussels%2C_Belgium_-_DSC07236.jpg/330px-Philodendron_giganteum_-_Laeken_Royal_Greenhouses_-_Royal_Castle_of_Laeken_-_Brussels%2C_Belgium_-_DSC07236.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["birkin_stripes","birkin_leaf","birkin_bush"],
    toxicity: 'Tóxica para mascotas por presencia de oxalatos cálcicos.',
  },
  {
    id: 'alocasia-amazonica',
    name: 'Alocasia Polly (Cara de Caballo)',
    scientificName: "Alocasia x amazonica 'Polly'",
    family: 'Araceae',
    confidence: 95,
    healthScore: 87,
    watering: 'Cada 5 a 7 días. Requiere sustrato aireado, húmedo pero nunca empapado.',
    wateringFrequencyDays: 6,
    light: 'Luz indirecta filtrada muy brillante.',
    temperature: '18°C a 27°C. Entra en reposo invernal por debajo de 15°C.',
    humidity: 'Alta (65% - 85%). Fundamental para evitar araña roja.',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 5, tempMinC: 16, tempMaxC: 29 },
    difficulty: 'Avanzado',
    commonProblems: [
      "Pérdida de hojas en invierno: Si el tubérculo está firme, rebrotará en primavera.",
      "Araña roja: Frecuente con calefacción y aire seco; pulverizar follaje.",
      "Puntas quemadas: Sensible al cloro del agua del grifo; usar agua reposada."
],
    climateTip: 'Hojas esculturales con forma de flecha y nervios plateados fluorescentes de gran impacto visual.',
    habitatSummary: 'Híbrido originario de especies del sotobosque húmedo del sudeste asiático.',
    nativeRegions: ["Philippines","Malaysia"],
    avatarEmoji: '🌿',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Alocasia_x_amazonica_a1.jpg/330px-Alocasia_x_amazonica_a1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["alocasia_leaf","alocasia_veins","alocasia_arrow"],
    toxicity: 'Tóxica para perros, gatos y niños por oxalatos de calcio.',
  },
  {
    id: 'senecio-rosario',
    name: 'Planta Rosario (Bolitas de Senecio)',
    scientificName: 'Curio rowleyanus',
    family: 'Asteraceae',
    confidence: 96,
    healthScore: 91,
    watering: 'Cada 10 a 14 días. Regar por inmersión o superficie cuando las bolitas pierdan turgencia.',
    wateringFrequencyDays: 12,
    light: 'Luz brillante indirecta con sol suave matutino.',
    temperature: '16°C a 26°C. Proteger de heladas.',
    humidity: 'Baja a moderada (30% - 50%).',
    careLevels: { lightLevel: 4, wateringLevel: 2, humidityLevel: 2, tempMinC: 12, tempMaxC: 28 },
    difficulty: 'Moderado',
    commonProblems: [
      "Bolitas que se desinflan y arrugan: Deshidratación; regar.",
      "Bolitas amarillas y blandas que se caen solas: Exceso de agua en corona.",
      "Tallo pelado en la parte superior: Falta de luz desde arriba."
],
    climateTip: 'Ideal para macetas colgantes altas. Las bolitas son hojas esféricas modificadas para almacenar agua.',
    habitatSummary: 'Zonas áridas y laderas pedregosas del sudoeste de África.',
    nativeRegions: ["South Africa","Namibia"],
    avatarEmoji: '🌱',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Senecio_rowleyanus_leaves.jpg/330px-Senecio_rowleyanus_leaves.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["rosario_beads","rosario_hanging","rosario_string"],
    toxicity: 'Tóxica para mascotas si se ingiere; puede causar vómitos y letargo.',
  },
  {
    id: 'geranio',
    name: 'Geranio (Gitanilla)',
    scientificName: 'Pelargonium peltatum',
    family: 'Geraniaceae',
    confidence: 98,
    healthScore: 93,
    watering: 'Cada 3 a 5 días en primavera y verano; cada 10 días en invierno.',
    wateringFrequencyDays: 4,
    light: 'Pleno sol directo (mínimo 5-6 horas al día para florecer).',
    temperature: '14°C a 30°C. Resiste bien el calor.',
    humidity: 'Media a baja (40% - 50%). No mojar flores ni hojas al regar.',
    careLevels: { lightLevel: 5, wateringLevel: 3, humidityLevel: 2, tempMinC: 10, tempMaxC: 32 },
    difficulty: 'Fácil',
    commonProblems: [
      "Oruga del geranio (taladro): Perfora tallos; tratar preventivamente.",
      "Flores marchitas: Retirarlas para estimular nuevas floraciones.",
      "Hojas amarillas inferiores: Encharcamiento o falta de abono."
],
    climateTip: 'La reina indiscutible de balcones y terrazas soleadas. Floración ininterrumpida de primavera a otoño.',
    habitatSummary: 'Laderas costeras y acantilados rocosos de Sudáfrica.',
    nativeRegions: ["South Africa"],
    avatarEmoji: '🌸',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Pelargonium_cucullatum_Contour_Path_Rhodes_Mem.JPG/330px-Pelargonium_cucullatum_Contour_Path_Rhodes_Mem.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["geranio_flower","geranio_leaf","geranio_balcony"],
    toxicity: 'Precaución con mascotas por aceites esenciales que pueden provocar dermatitis o náuseas.',
  },
  {
    id: 'jazmin',
    name: 'Jazmín Común',
    scientificName: 'Jasminum officinale',
    family: 'Oleaceae',
    confidence: 97,
    healthScore: 92,
    watering: 'Cada 4 a 6 días en temporada de crecimiento; mantener tierra ligeramente fresca.',
    wateringFrequencyDays: 5,
    light: 'Sol directo o semisombra muy iluminada.',
    temperature: '12°C a 25°C. Tolera frío moderado.',
    humidity: 'Media (50% - 60%).',
    careLevels: { lightLevel: 5, wateringLevel: 3, humidityLevel: 3, tempMinC: 8, tempMaxC: 28 },
    difficulty: 'Fácil',
    commonProblems: [
      "Pocos brotes de flor: Poda tardía o falta de horas de sol directo.",
      "Hojas secas: Déficit hídrico en macetas al sol.",
      "Presencia de pulgón en brotes tiernos: Rociar con infusión de ajo o jabón potásico."
],
    climateTip: 'Inconfundible fragancia nocturna. Arbusto trepador perfecto para pérgolas, celosías y muros soleados.',
    habitatSummary: 'Cáucaso, norte de Irán, Afganistán, Pakistán, Himalaya y oeste de China.',
    nativeRegions: ["Iran","Pakistan","India","China"],
    avatarEmoji: '🤍',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Jasminum_officinale_-_Bot._Mag._31%2C_1787.jpg/330px-Jasminum_officinale_-_Bot._Mag._31%2C_1787.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["jazmin_flower","jazmin_vine","jazmin_buds"],
    toxicity: 'No tóxico y completamente seguro para mascotas.',
  },
  {
    id: 'planta-dolar',
    name: 'Planta del Dinero',
    scientificName: 'Plectranthus verticillatus',
    family: 'Lamiaceae',
    confidence: 98,
    healthScore: 96,
    watering: 'Cada 6 a 8 días. Regar cuando los 2 cm superiores de tierra estén secos.',
    wateringFrequencyDays: 7,
    light: 'Luz indirecta brillante o semisombra luminosa.',
    temperature: '16°C a 25°C. Proteger de heladas.',
    humidity: 'Media (45% - 60%).',
    careLevels: { lightLevel: 3, wateringLevel: 3, humidityLevel: 3, tempMinC: 12, tempMaxC: 28 },
    difficulty: 'Fácil',
    commonProblems: [
      "Tallos muy largos con hojas separadas: Poda las puntas para que crezca más frondosa.",
      "Hojas quemadas o marrones: Exposición directa al sol fuerte.",
      "Hojas que pierden color: Falta de nutrientes; abonar cada 15 días en primavera."
],
    climateTip: 'Popular planta de interior y terraza a la que la tradición atribuye buena fortuna en el hogar.',
    habitatSummary: 'Márgenes de bosques templados y subtropicales del sur de África.',
    nativeRegions: ["South Africa","Eswatini","Mozambique"],
    avatarEmoji: '🪙',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Plectranthus_verticillatus_1.JPG/330px-Plectranthus_verticillatus_1.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["dolar_leaf","dolar_hanging","dolar_trailing"],
    toxicity: 'Segura y no tóxica para mascotas domésticas.',
  },
  {
    id: 'bonsai-ficus',
    name: 'Bonsái Ficus Ginseng',
    scientificName: 'Ficus microcarpa',
    family: 'Moraceae',
    confidence: 96,
    healthScore: 90,
    watering: 'Cada 5 a 7 días. Regar abundantemente cuando la superficie esté casi seca y vaciar el plato sobrante.',
    wateringFrequencyDays: 6,
    light: 'Mucha luz natural indirecta o sol muy suave de mañana.',
    temperature: '16°C a 25°C. Evitar corrientes y calefacción directa.',
    humidity: 'Media-alta (50% - 70%). Pulverizar copa con agua templada.',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 4, tempMinC: 15, tempMaxC: 28 },
    difficulty: 'Moderado',
    commonProblems: [
      "Caída de hojas tras cambiarlo de lugar: Adaptación temporal a nueva luminosidad.",
      "Ramas largas que deforman la silueta: Podar a 2 hojas para mantener la forma compacta.",
      "Pudrición en raíces gruesas aéreas: Agua estancada en el plato."
],
    climateTip: 'El bonsái ideal para iniciarse en este arte milenario gracias a su resistencia y raíces esculturales.',
    habitatSummary: 'Bosques lluviosos y manglares tropicales de Asia Oriental y Oceanía.',
    nativeRegions: ["China","India","Malaysia","Australia"],
    avatarEmoji: '🪴',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Ficus_microcarpa_-_La_Gomera_01.jpg/330px-Ficus_microcarpa_-_La_Gomera_01.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["ginseng_root","ginseng_trunk","ginseng_crown"],
    toxicity: 'Tóxico para mascotas si mastican hojas o raíces aéreas.',
  },
  {
    id: 'eucalipto',
    name: 'Eucalipto Aromático',
    scientificName: 'Eucalyptus gunnii',
    family: 'Myrtaceae',
    confidence: 97,
    healthScore: 92,
    watering: 'Cada 4 a 6 días en maceta; tolerante a sequía una vez establecido en suelo.',
    wateringFrequencyDays: 5,
    light: 'Pleno sol directo (mínimo 6 horas diarias).',
    temperature: '10°C a 28°C. Tolera heladas suaves.',
    humidity: 'Baja a media (30% - 50%).',
    careLevels: { lightLevel: 5, wateringLevel: 3, humidityLevel: 2, tempMinC: -5, tempMaxC: 32 },
    difficulty: 'Fácil',
    commonProblems: [
      "Hojas plateadas que se secan y crujen: Déficit de riego cuando es joven en maceta.",
      "Falta de aroma y follaje ralo: Falta de luz solar directa.",
      "Oidio en hojas: Mejorar ventilación ambiental."
],
    climateTip: 'Follaje azul plateado redondo con un aroma fresco y balsámico que purifica y repele mosquitos.',
    habitatSummary: 'Mesetas alpinas y llanuras de Tasmania y Australia continental.',
    nativeRegions: ["Australia"],
    avatarEmoji: '🌿',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Eucalyptus_tereticornis_flowers%2C_capsules%2C_buds_and_foliage.jpeg/330px-Eucalyptus_tereticornis_flowers%2C_capsules%2C_buds_and_foliage.jpeg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["eucalyptus_silver","eucalyptus_stem","eucalyptus_leaf"],
    toxicity: 'Tóxico para gatos y perros debido a sus aceites esenciales de eucaliptol.',
  },
  {
    id: 'oregano',
    name: 'Orégano Silvestre',
    scientificName: 'Origanum vulgare',
    family: 'Lamiaceae',
    confidence: 99,
    healthScore: 97,
    watering: 'Cada 7 a 10 días. Riego moderado; prefiere pasar algo de sed a tener humedad continua.',
    wateringFrequencyDays: 8,
    light: 'Pleno sol directo para concentrar sus aceites esenciales y aroma.',
    temperature: '12°C a 30°C. Muy rústico y resistente a fríos y calor.',
    humidity: 'Baja (30% - 40%). Climas mediterráneos secos.',
    careLevels: { lightLevel: 5, wateringLevel: 2, humidityLevel: 1, tempMinC: -10, tempMaxC: 35 },
    difficulty: 'Fácil',
    commonProblems: [
      "Pérdida de aroma: Sustrato demasiado rico en nitrógeno o poca exposición solar.",
      "Pudrición en base de tallos: Tierra con mal drenaje o plato con agua estancada.",
      "Hojas secas en verano: Normal en floración; podar para rejuvenecer."
],
    climateTip: 'Planta culinaria imprescindible. Cosecha los brotes a primera hora de la mañana para secar.',
    habitatSummary: 'Laderas soleadas, pastizales secos y matorrales de la cuenca mediterránea y Asia sudoccidental.',
    nativeRegions: ["Spain","Italy","Greece","Turkey"],
    avatarEmoji: '🌱',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Origanum_vulgare_-_harilik_pune.jpg/330px-Origanum_vulgare_-_harilik_pune.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["oregano_herb","oregano_flower","oregano_garden"],
    toxicity: 'Seguro en cantidades culinarias; precaución con aceites concentrados para mascotas.',
  },
  {
    id: 'tradescantia-zebrina',
    name: 'Tradescantia Cebra (Amor de Hombre)',
    scientificName: 'Tradescantia zebrina',
    family: 'Commelinaceae',
    confidence: 98,
    healthScore: 95,
    watering: 'Cada 6 a 8 días. Dejar secar el primer tercio del sustrato entre riegos.',
    wateringFrequencyDays: 7,
    light: 'Luz indirecta brillante; la luz solar suave intensifica sus tonos púrpuras y plateados.',
    temperature: '16°C a 26°C. No resiste heladas.',
    humidity: 'Media (50% - 60%).',
    careLevels: { lightLevel: 4, wateringLevel: 3, humidityLevel: 3, tempMinC: 12, tempMaxC: 28 },
    difficulty: 'Fácil',
    commonProblems: [
      "Pérdida del color morado brillante: Poca iluminación.",
      "Tallos sin hojas en la base: Envejece rápido; fácil de renovar mediante esquejes en agua.",
      "Hojas translúcidas y marchitas: Exceso de riego."
],
    climateTip: 'Crece a gran velocidad y se propaga en agua en menos de una semana. Colgante muy decorativa.',
    habitatSummary: 'Humedales y sotobosques tropicales de México, Belice y Guatemala.',
    nativeRegions: ["Mexico","Guatemala","Belize"],
    avatarEmoji: '💜',
    imageUri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Zebrina_pendula_20060521_2_closer.jpg/330px-Zebrina_pendula_20060521_2_closer.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
    referenceImages: ["zebrina_purple","zebrina_trail","zebrina_pot"],
    toxicity: 'Precaución con mascotas; la savia puede causar dermatitis por contacto.',
  },
];

// ---------------------------------------------------------------------------
// Catálogo local
// ---------------------------------------------------------------------------

/** Obtiene una planta del catálogo local por id. */
export function getPlantById(id: string): CatalogPlant | undefined {
  return BOTANICAL_KNOWLEDGE_BASE.find((p) => p.id === id);
}

/** Busca plantas en el catálogo local. */
export function searchPlants(query: string): CatalogPlant[] {
  const q = query.toLowerCase().trim();
  if (!q) return BOTANICAL_KNOWLEDGE_BASE;
  return BOTANICAL_KNOWLEDGE_BASE.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.scientificName.toLowerCase().includes(q) ||
      p.family.toLowerCase().includes(q)
  );
}

/**
 * Resuelve el id de especie del catálogo a partir del nombre y/o nombre
 * científico de una planta guardada (la que proviene del escáner).
 */
export function resolveSpeciesId(name: string, scientificName?: string): string | undefined {
  const n = (name || '').toLowerCase();
  const s = (scientificName || '').toLowerCase();
  const match = BOTANICAL_KNOWLEDGE_BASE.find((p) => {
    const commonFirst = p.name.toLowerCase().split(' ')[0];
    const sciFirst = p.scientificName.toLowerCase().split(' ')[0];
    return (
      (commonFirst.length > 3 && n.includes(commonFirst)) ||
      (sciFirst.length > 3 && s.includes(sciFirst))
    );
  });
  return match?.id;
}

/** Busca en el catálogo por nombre común o científico (tolerante). */
function findCatalogByName(name: string, scientificName = ''): CatalogPlant | undefined {
  const n = name.toLowerCase().trim();
  const s = scientificName.toLowerCase().trim();
  const nToken = n.split(/\s+/)[0] ?? '';
  const sToken = s.split(/\s+/)[0] ?? '';

  return BOTANICAL_KNOWLEDGE_BASE.find((p) => {
    const pName = p.name.toLowerCase();
    const pSci = p.scientificName.toLowerCase();
    const pNameToken = pName.split(/\s+/)[0] ?? '';
    return (
      (sToken.length > 3 && pSci.includes(sToken)) ||
      (nToken.length > 3 && pName.includes(nToken)) ||
      (n.length > 3 && pName.includes(n)) ||
      (pNameToken.length > 3 && n.includes(pNameToken))
    );
  });
}

// ---------------------------------------------------------------------------
// Conversión entre catálogo y ficha de cuidados
// ---------------------------------------------------------------------------

export function catalogPlantToCareSheet(plant: CatalogPlant): BotanicalCareSheet {
  return {
    commonName: plant.name,
    scientificName: plant.scientificName,
    family: plant.family,
    watering: plant.watering,
    wateringFrequencyDays: plant.wateringFrequencyDays,
    light: plant.light,
    temperature: plant.temperature,
    humidity: plant.humidity,
    careLevels: plant.careLevels,
    difficulty: plant.difficulty,
    commonProblems: plant.commonProblems,
    climateTip: plant.climateTip,
    habitatSummary: plant.habitatSummary,
    nativeRegions: plant.nativeRegions,
    avatarEmoji: plant.avatarEmoji,
    toxicity: plant.toxicity,
  };
}

export function careSheetToCatalogPlant(
  sheet: BotanicalCareSheet,
  id: string,
  confidence?: number
): CatalogPlant {
  return {
    id,
    name: sheet.commonName,
    scientificName: sheet.scientificName,
    family: sheet.family,
    confidence,
    watering: sheet.watering,
    wateringFrequencyDays: sheet.wateringFrequencyDays,
    light: sheet.light,
    temperature: sheet.temperature,
    humidity: sheet.humidity,
    careLevels: sheet.careLevels,
    difficulty: sheet.difficulty,
    commonProblems: sheet.commonProblems,
    climateTip: sheet.climateTip,
    habitatSummary: sheet.habitatSummary,
    nativeRegions: sheet.nativeRegions,
    avatarEmoji: sheet.avatarEmoji,
    toxicity: sheet.toxicity,
    source: 'ai-real',
  };
}

/** Rellena huecos de una ficha recibida del backend con valores por defecto. */
function normalizeCareSheet(
  raw: Partial<BotanicalCareSheet>,
  commonName: string,
  scientificName: string
): BotanicalCareSheet {
  const fallback = buildFallbackCareSheet(commonName, scientificName);
  const levels: Partial<BotanicalCareLevels> = raw.careLevels ?? {};
  const clampLevel = (value: unknown, def: number, min = 1, max = 5): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : def;
  };
  const clampTemp = (value: unknown, def: number): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : def;
  };

  return {
    commonName: raw.commonName?.trim() || fallback.commonName,
    scientificName: raw.scientificName?.trim() || fallback.scientificName,
    family: raw.family?.trim() || fallback.family,
    watering: raw.watering?.trim() || fallback.watering,
    wateringFrequencyDays:
      Number.isFinite(Number(raw.wateringFrequencyDays)) && Number(raw.wateringFrequencyDays) > 0
        ? Math.min(45, Math.round(Number(raw.wateringFrequencyDays)))
        : fallback.wateringFrequencyDays,
    light: raw.light?.trim() || fallback.light,
    temperature: raw.temperature?.trim() || fallback.temperature,
    humidity: raw.humidity?.trim() || fallback.humidity,
    careLevels: {
      lightLevel: clampLevel(levels.lightLevel, fallback.careLevels.lightLevel),
      wateringLevel: clampLevel(levels.wateringLevel, fallback.careLevels.wateringLevel),
      humidityLevel: clampLevel(levels.humidityLevel, fallback.careLevels.humidityLevel),
      tempMinC: clampTemp(levels.tempMinC, fallback.careLevels.tempMinC),
      tempMaxC: clampTemp(levels.tempMaxC, fallback.careLevels.tempMaxC),
    },
    difficulty:
      raw.difficulty === 'Moderado' || raw.difficulty === 'Avanzado' || raw.difficulty === 'Fácil'
        ? raw.difficulty
        : fallback.difficulty,
    commonProblems:
      Array.isArray(raw.commonProblems) && raw.commonProblems.length > 0
        ? raw.commonProblems.filter((p) => typeof p === 'string' && p.trim().length > 0)
        : fallback.commonProblems,
    climateTip: raw.climateTip?.trim() || fallback.climateTip,
    habitatSummary: raw.habitatSummary?.trim() || fallback.habitatSummary,
    nativeRegions:
      Array.isArray(raw.nativeRegions) && raw.nativeRegions.length > 0
        ? raw.nativeRegions.filter((r) => typeof r === 'string' && r.trim().length > 0)
        : fallback.nativeRegions,
    avatarEmoji: raw.avatarEmoji?.trim() || fallback.avatarEmoji,
    toxicity: raw.toxicity?.trim() || fallback.toxicity,
  };
}

// ---------------------------------------------------------------------------
// Identificación
// ---------------------------------------------------------------------------

/** Hash determinista simple (sin `Math.random`). */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function mockCandidateFromCatalog(
  plant: CatalogPlant,
  confidence: number,
  source: IdentificationSource
): IdentificationCandidate {
  return {
    id: plant.id,
    name: plant.name,
    scientificName: plant.scientificName,
    family: plant.family,
    confidence,
    commonNames: [plant.name],
    referenceImages: [],
    source,
  };
}

/** Identificación simulada, determinista a partir del contenido de la imagen. */
/**
 * Interfaz para API real (Pl@ntNet o Plant.id) via Cloud Function.
 */
export interface RealPlantIdRequest {
  images: string[];
  options?: { provider?: 'plantnet' | 'plantid' | 'auto'; includeReferenceImages?: boolean; };
}
export interface RealPlantIdResponse {
  success: boolean;
  isPlant: boolean;
  candidates: IdentificationCandidate[];
  imageQuality?: ImageQualityFlags;
  error?: string;
}
export async function identifyWithRealApi(
  imageUris: string[],
  options?: RealPlantIdRequest['options']
): Promise<RealPlantIdResponse> {
  const compressed = await compressImages(imageUris, { max: 4 });
  if (compressed.length === 0) {
    return { success: false, isPlant: false, candidates: [], error: t('No se pudo procesar ninguna imagen') };
  }
  try {
    const response = await postJson<RealPlantIdResponse>('/identifyPlantReal', {
      images: compressed.map((c) => c.base64),
      options,
    });
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, isPlant: false, candidates: [], error: error.message };
    }
    return { success: false, isPlant: false, candidates: [], error: t('Error al contactar el servicio de identificacion') };
  }
}

async function mockIdentifyPlants(imageUris: string[], seed: number): Promise<PlantIdentificationResult> {
  const plants = BOTANICAL_KNOWLEDGE_BASE;
  const first = plants[seed % plants.length];
  const second = plants[(seed + 5) % plants.length];
  const matchQuality = seed % 100;
  if (matchQuality < 30) {
    return { candidates: [], isPlant: false, imageQuality: { note: t('No pude identificarla') }, confidence: 0, source: "mock", imageUri: imageUris[0] };
  }
  const topConfidence = 72 + (seed % 24);
  const candidateA = mockCandidateFromCatalog(first, topConfidence, "mock");
  let candidates = [candidateA];
  if (first.id !== second.id && matchQuality > 70) {
    const candidateB = mockCandidateFromCatalog(second, Math.max(3, 100 - topConfidence - 5), "mock");
    candidates = [candidateA, candidateB];
  }
  return { candidates, isPlant: true, imageQuality: {}, confidence: candidateA.confidence, source: "mock", imageUri: imageUris[0] };
}

/**
 * Identifica una planta a partir de 1 a 4 fotos de la misma (mejoran la
 * precisión). Comprime las imágenes, las envía al backend y devuelve los
 * candidatos con su confianza real.
 */
export async function identifyPlants(imageUris: string[]): Promise<PlantIdentificationResult> {
  const compressed = await compressImages(imageUris, { max: 4 });
  if (compressed.length === 0) {
    throw new ApiError(
      'NO_IMAGE',
      t('No se pudo procesar ninguna imagen. Vuelve a tomar la foto con buena iluminación.'),
      0
    );
  }

  if (shouldUseMocks()) {
    const seed = hashString(compressed.map((c) => c.base64.slice(0, 256)).join('|'));
    return mockIdentifyPlants(imageUris, seed);
  }

  const response = await postJson<IdentifyResponse>('/identifyPlant', {
    images: compressed.map((c) => c.base64),
  });

  const candidates = (response.candidates ?? []).map((candidate) => ({
    ...candidate,
    referenceImages: Array.isArray(candidate.referenceImages) ? candidate.referenceImages : [],
    source: candidate.source ?? ('ai-real' as IdentificationSource),
  }));

  return {
    candidates,
    isPlant: response.isPlant === true,
    imageQuality: response.imageQuality ?? {},
    confidence: candidates[0]?.confidence ?? 0,
    source: 'ai-real',
    imageUri: imageUris[0],
  };
}

// ---------------------------------------------------------------------------
// Fichas de cuidados
// ---------------------------------------------------------------------------

/**
 * Obtiene la ficha de cuidados de una especie: catálogo local → caché local →
 * backend (LLM). Si el backend falla por red, devuelve una ficha genérica
 * honesta en lugar de romper la pantalla.
 */
export async function fetchCareSheet(commonName: string, scientificName = ''): Promise<BotanicalCareSheet> {
  const name = commonName.trim();
  const key = careSheetKey(name, scientificName);

  // 1. Catálogo local (offline).
  const catalogMatch = findCatalogByName(name, scientificName);
  if (catalogMatch) {
    const sheet = catalogPlantToCareSheet(catalogMatch);
    void saveCareSheet(key, sheet);
    return sheet;
  }

  // 2. Caché local.
  const cached = await getCachedCareSheet(key);
  if (cached) return cached;

  // 3. Respaldo en desarrollo (sin backend configurado).
  if (shouldUseMocks()) {
    const sheet = buildFallbackCareSheet(name, scientificName);
    void saveCareSheet(key, sheet);
    return sheet;
  }

  try {
    const raw = await postJson<Partial<BotanicalCareSheet>>('/careSheet', {
      speciesName: name,
      scientificName,
    });
    const sheet = normalizeCareSheet(raw, name, scientificName);
    void saveCareSheet(key, sheet);
    return sheet;
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) throw error;
    return buildFallbackCareSheet(name, scientificName);
  }
}

/**
 * Devuelve una copia de la especie con los textos de UI de su ficha en el
 * idioma activo. Los nombres común y científico, la familia y las regiones se
 * mantienen intactos por ser nombres propios o taxonómicos.
 */
function localizeCatalogPlant(plant: CatalogPlant): CatalogPlant {
  return {
    ...plant,
    watering: t(plant.watering),
    light: t(plant.light),
    temperature: t(plant.temperature),
    humidity: t(plant.humidity),
    difficulty: t(plant.difficulty) as CatalogPlant['difficulty'],
    commonProblems: plant.commonProblems.map((problem) => t(problem)),
    climateTip: t(plant.climateTip),
    habitatSummary: t(plant.habitatSummary),
  };
}

/**
 * Resuelve la ficha completa de una planta para la pantalla de detalle:
 * catálogo local si existe, o ficha generada por IA a partir de su nombre.
 */
export async function resolvePlantForDetail(
  plantId: string,
  plantName?: string,
  scientificName?: string,
  confidence?: number
): Promise<CatalogPlant | null> {
  const catalog = getPlantById(plantId);
  if (catalog) {
    return localizeCatalogPlant({ ...catalog, confidence: confidence ?? catalog.confidence });
  }

  const speciesName = (plantName || scientificName || '').trim();
  if (!speciesName) return null;

  const sheet = await fetchCareSheet(speciesName, scientificName);
  return localizeCatalogPlant(careSheetToCatalogPlant(sheet, plantId, confidence));
}

