/**
 * Plantae Care Cache
 *
 * Las fichas de cuidados pueden venir del catálogo local, de una identificación
 * real (enriquecimiento offline) o del backend (LLM). Este módulo centraliza:
 *  - Los tipos de la ficha de cuidados.
 *  - Una caché local persistida con caducidad, para no pedir dos veces la
 *    misma especie ni gastar cuota/coste de IA.
 *
 * Los tipos viven aquí (y no en plantApi.ts) para romper el ciclo de imports.
 */

import { loadJSON, saveJSON, STORAGE_KEYS } from './storage';
import { t } from '../i18n';

export interface BotanicalCareLevels {
  lightLevel: number; // 1 a 5
  wateringLevel: number; // 1 a 5
  humidityLevel: number; // 1 a 5
  tempMinC: number;
  tempMaxC: number;
}

export interface BotanicalCareSheet {
  commonName: string;
  scientificName: string;
  family: string;
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
  nativeRegions: string[];
  avatarEmoji: string;
  /** Nota informativa de toxicidad para mascotas/niños (opcional). */
  toxicity?: string;
}

interface CareCacheEntry {
  sheet: BotanicalCareSheet;
  savedAt: number;
}

type CareCacheMap = Record<string, CareCacheEntry>;

const CACHE_TTL_DAYS = 30;

/** Clave estable para una especie (sin acentos, minúsculas). */
export function careSheetKey(commonName: string, scientificName = ''): string {
  return `${commonName.toLowerCase().trim()}|${scientificName.toLowerCase().trim()}`;
}

let memoryCache: CareCacheMap | null = null;
let loadingPromise: Promise<CareCacheMap> | null = null;

async function loadCache(): Promise<CareCacheMap> {
  if (memoryCache) return memoryCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const stored = await loadJSON<CareCacheMap>(STORAGE_KEYS.careCache, {});
    memoryCache = stored && typeof stored === 'object' ? stored : {};
    return memoryCache;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export async function getCachedCareSheet(key: string): Promise<BotanicalCareSheet | null> {
  const cache = await loadCache();
  const entry = cache[key];
  if (!entry?.sheet) return null;
  const ageDays = (Date.now() - entry.savedAt) / (1000 * 60 * 60 * 24);
  if (ageDays > CACHE_TTL_DAYS) return null;
  return entry.sheet;
}

export async function saveCareSheet(key: string, sheet: BotanicalCareSheet): Promise<void> {
  const cache = await loadCache();
  cache[key] = { sheet, savedAt: Date.now() };
  memoryCache = cache;
  void saveJSON(STORAGE_KEYS.careCache, cache);
}

/** Ficha genérica honesta para cuando no hay catálogo ni conexión. */
export function buildFallbackCareSheet(commonName: string, scientificName = ''): BotanicalCareSheet {
  const name = commonName.trim() || t('Esta planta');
  return {
    commonName: name,
    scientificName: scientificName.trim(),
    family: t('Familia no determinada'),
    watering: t('Riégala cuando los primeros 3-5 cm de sustrato estén secos al tacto.'),
    wateringFrequencyDays: 7,
    light: t('Luz indirecta brillante, evitando el sol directo intenso del mediodía.'),
    temperature: t('18°C a 26°C.'),
    humidity: t('Humedad ambiental media.'),
    careLevels: {
      lightLevel: 3,
      wateringLevel: 3,
      humidityLevel: 3,
      tempMinC: 18,
      tempMaxC: 26,
    },
    difficulty: t('Fácil') as BotanicalCareSheet['difficulty'],
    commonProblems: [
      t('Hojas amarillas o decaídas: suele indicar exceso o falta de riego.'),
      t('Puntas marrones: humedad ambiental baja o agua con demasiadas sales.'),
    ],
    climateTip: t('Ajusta el riego según la estación y la humedad de tu hogar.'),
    habitatSummary: t('{nombre} es una especie que puede cultivarse como planta ornamental.', { nombre: name }),
    nativeRegions: [t('Origen no confirmado')],
    avatarEmoji: '🌿',
    toxicity: t('Sin información específica de toxicidad; mantén mascotas y niños alejados.'),
  };
}
