/**
 * EcoScan Botanical Service
 *
 * Catálogo botánico local (funciona sin conexión) + fachada de identificación
 * y de fichas de cuidados.
 *
 * NOTA DE SEGURIDAD:
 * Las llamadas a los proveedores reales (Plant.id / Gemini) se hacen SIEMPRE
 * desde las Cloud Functions de EcoScan (`functions/`). El cliente solo conoce
 * la URL base del backend y nunca maneja claves de API.
 *
 * La identificación real devuelve candidatos con su confianza y sus imágenes de
 * referencia. En desarrollo, si no hay backend configurado, se usan datos
 * simulados deterministas (nunca `Math.random`).
 */

import { ApiError, postJson, shouldUseMocks, isApiConfigured } from './apiClient';
import {
  isGeminiDirectAvailable,
  identifyPlantWithGemini,
  generateCareSheetWithGemini,
  slugify,
} from './geminiService';
import { t } from '../i18n';
import { compressImages } from './imageCompression';
import { BOTANICAL_KNOWLEDGE_BASE } from './botanicalCatalogData';
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

export { BOTANICAL_KNOWLEDGE_BASE };

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

  if (isGeminiDirectAvailable()) {
    try {
      const geminiResult = await identifyPlantWithGemini(compressed.map((c) => c.base64));
      if (geminiResult.careSheet && geminiResult.candidates.length > 0) {
        const top = geminiResult.candidates[0];
        const key = careSheetKey(top.name, top.scientificName);
        void saveCareSheet(key, geminiResult.careSheet);
      }
      return {
        candidates: geminiResult.candidates,
        isPlant: geminiResult.isPlant,
        imageQuality: geminiResult.imageQuality,
        confidence: geminiResult.confidence,
        source: 'ai-real',
        imageUri: imageUris[0],
      };
    } catch (err) {
      console.warn('[Gemini Vision] Error en detección directa:', err);
      if (!isApiConfigured() && __DEV__) {
        const seed = hashString(compressed.map((c) => c.base64.slice(0, 256)).join('|'));
        return mockIdentifyPlants(imageUris, seed);
      }
      throw err;
    }
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

  // 2.5 Gemini LLM directo (100% gratuito)
  if (isGeminiDirectAvailable()) {
    try {
      const geminiSheet = await generateCareSheetWithGemini(name, scientificName);
      if (geminiSheet) {
        void saveCareSheet(key, geminiSheet);
        return geminiSheet;
      }
    } catch (err) {
      console.warn('[Gemini CareSheet] Error generando ficha directa:', err);
    }
  }

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

/**
 * Busca una planta en el catálogo local y, si no existe, la genera
 * en tiempo real usando Google Gemini con ficha de cuidados completa,
 * requerimientos de luz y agua, toxicidad y origen geográfico.
 */
export async function searchOrGeneratePlantWithGemini(
  query: string
): Promise<CatalogPlant | null> {
  const clean = query.trim();
  if (!clean) return null;

  // 1. Catálogo local
  const local = findCatalogByName(clean);
  if (local) {
    return localizeCatalogPlant(local);
  }

  // 2. Generación dinámica con Gemini
  if (isGeminiDirectAvailable()) {
    try {
      const sheet = await generateCareSheetWithGemini(clean, '');
      if (sheet) {
        const id = slugify(sheet.scientificName || sheet.commonName);
        const key = careSheetKey(sheet.commonName, sheet.scientificName);
        void saveCareSheet(key, sheet);
        return localizeCatalogPlant(careSheetToCatalogPlant(sheet, id, 95));
      }
    } catch (err) {
      console.warn('[Gemini Search] Error generando especie:', err);
    }
  }

  return null;
}

