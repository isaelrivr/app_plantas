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
    referenceImages: ['rosemary_sprig', 'rosemary_needle', 'rosemary_blue_flowers'],
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
  const clampLevel = (value: unknown, def: number): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? Math.min(5, Math.max(1, Math.round(parsed))) : def;
  };
  const tempMin = Number(levels.tempMinC);
  const tempMax = Number(levels.tempMaxC);

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
      tempMinC: Number.isFinite(tempMin) ? Math.round(tempMin) : fallback.careLevels.tempMinC,
      tempMaxC: Number.isFinite(tempMax) ? Math.round(tempMax) : fallback.careLevels.tempMaxC,
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
    return { success: false, isPlant: false, candidates: [], error: 'No se pudo procesar ninguna imagen' };
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
    return { success: false, isPlant: false, candidates: [], error: 'Error al contactar el servicio de identificacion' };
  }
}

async function mockIdentifyPlants(imageUris: string[], seed: number): Promise<PlantIdentificationResult> {
  const plants = BOTANICAL_KNOWLEDGE_BASE;
  const first = plants[seed % plants.length];
  const second = plants[(seed + 5) % plants.length];
  const matchQuality = seed % 100;
  if (matchQuality < 30) {
    return { candidates: [], isPlant: false, imageQuality: { note: "No pude identificarla" }, confidence: 0, source: "mock", imageUri: imageUris[0] };
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
      'No se pudo procesar ninguna imagen. Vuelve a tomar la foto con buena iluminación.',
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
    return { ...catalog, confidence: confidence ?? catalog.confidence };
  }

  const speciesName = (plantName || scientificName || '').trim();
  if (!speciesName) return null;

  const sheet = await fetchCareSheet(speciesName, scientificName);
  return careSheetToCatalogPlant(sheet, plantId, confidence);
}

