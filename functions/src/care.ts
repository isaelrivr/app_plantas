/**
 * Ficha de cuidados: caché en Firestore + generación con Gemini (JSON validado).
 * Las fichas se cachean por especie para no repetir generaciones costosas.
 */

import * as crypto from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import type { AppConfig } from './config';
import type { Identity } from './guard';
import { consumeQuota } from './rateLimit';
import { generateCareSheetJson } from './providers/gemini';
import type { CareRequest, CareSheet } from './types';
import { badRequest } from './errors';

const CARE_CACHE_COLLECTION = 'care_cache';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value: unknown, fallback: string, maxLength = 600): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
};

const toTextArray = (value: unknown, max: number, maxLength = 300): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim().slice(0, maxLength) : ''))
    .filter((item) => item.length > 0)
    .slice(0, max);
};

export function careCacheKey(commonName: string, scientificName: string): string {
  return crypto
    .createHash('sha256')
    .update(`${commonName.toLowerCase().trim()}|${scientificName.toLowerCase().trim()}`)
    .digest('hex')
    .slice(0, 40);
}

/** Valida y normaliza el JSON del LLM. Devuelve `null` si no es recuperable. */
export function validateCareSheet(raw: unknown, commonName: string, scientificName: string): CareSheet | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const levels = (data.careLevels ?? {}) as Record<string, unknown>;

  const commonProblems = toTextArray(data.commonProblems, 4);
  const nativeRegions = toTextArray(data.nativeRegions, 8, 80);

  const tempMin = clamp(toNumber(levels.tempMinC, 15), -20, 45);
  const tempMax = clamp(toNumber(levels.tempMaxC, 28), tempMin + 2, 50);

  const difficultyRaw = toText(data.difficulty, 'Fácil', 20);
  const difficulty: CareSheet['difficulty'] =
    difficultyRaw === 'Moderado' || difficultyRaw === 'Avanzado' || difficultyRaw === 'Fácil' ? difficultyRaw : 'Fácil';

  const fallbackProblems = [
    'Hojas amarillas o decaídas: suele indicar exceso o falta de riego.',
    'Puntas marrones: humedad ambiental insuficiente o agua con demasiadas sales.',
  ];

  return {
    commonName: toText(data.commonName, commonName, 120),
    scientificName: toText(data.scientificName, scientificName, 160),
    family: toText(data.family, 'Familia no determinada', 80),
    watering: toText(data.watering, 'Riégala cuando los primeros centímetros de sustrato estén secos.', 600),
    wateringFrequencyDays: Math.round(clamp(toNumber(data.wateringFrequencyDays, 7), 1, 45)),
    light: toText(data.light, 'Luz indirecta brillante, evitando el sol directo intenso.', 400),
    temperature: toText(data.temperature, `${Math.round(tempMin)}°C a ${Math.round(tempMax)}°C.`, 200),
    humidity: toText(data.humidity, 'Humedad ambiental media.', 300),
    careLevels: {
      lightLevel: Math.round(clamp(toNumber(levels.lightLevel, 3), 1, 5)),
      wateringLevel: Math.round(clamp(toNumber(levels.wateringLevel, 3), 1, 5)),
      humidityLevel: Math.round(clamp(toNumber(levels.humidityLevel, 3), 1, 5)),
      tempMinC: Math.round(tempMin),
      tempMaxC: Math.round(tempMax),
    },
    difficulty,
    commonProblems: commonProblems.length >= 2 ? commonProblems : fallbackProblems,
    climateTip: toText(data.climateTip, 'Ajusta el riego según la estación y la humedad de tu hogar.', 400),
    habitatSummary: toText(data.habitatSummary, `${commonName} es una especie cultivada habitualmente como planta ornamental.`, 600),
    nativeRegions: nativeRegions.length > 0 ? nativeRegions : ['Origen no confirmado'],
    avatarEmoji: toText(data.avatarEmoji, '🌿', 8),
    toxicity: toText(data.toxicity, 'Sin información específica de toxicidad; mantén mascotas y niños alejados.', 300),
  };
}

async function readCache(config: AppConfig, key: string): Promise<CareSheet | null> {
  try {
    const snap = await getFirestore().collection(CARE_CACHE_COLLECTION).doc(key).get();
    if (!snap.exists) return null;
    const data = snap.data() as { sheet?: CareSheet; savedAt?: number } | undefined;
    if (!data?.sheet || !data.savedAt) return null;
    const ageDays = (Date.now() - Number(data.savedAt)) / (1000 * 60 * 60 * 24);
    if (ageDays > config.careCacheDays) return null;
    return data.sheet;
  } catch {
    return null; // sin Firestore se genera de nuevo
  }
}

async function writeCache(key: string, sheet: CareSheet): Promise<void> {
  try {
    await getFirestore().collection(CARE_CACHE_COLLECTION).doc(key).set({ sheet, savedAt: Date.now() });
  } catch {
    /* caché best-effort */
  }
}

export async function resolveCareSheet(config: AppConfig, identity: Identity, req: CareRequest): Promise<CareSheet> {
  const speciesName = typeof req?.speciesName === 'string' ? req.speciesName.trim().slice(0, 120) : '';
  const scientificName = typeof req?.scientificName === 'string' ? req.scientificName.trim().slice(0, 160) : '';
  if (!speciesName && !scientificName) {
    throw badRequest('Envía speciesName (o scientificName) para generar la ficha de cuidados.');
  }

  const key = careCacheKey(speciesName, scientificName);

  const cached = await readCache(config, key);
  if (cached) return cached;

  await consumeQuota(identity, 'care', config.quotas.care);

  const raw = await generateCareSheetJson(config, speciesName || scientificName, scientificName);
  const sheet = validateCareSheet(raw, speciesName || scientificName, scientificName);
  if (!sheet) {
    // Sin LLM (mock/parse fallido) o claves ausentes: plantilla genérica honesta.
    return validateCareSheet({}, speciesName || scientificName, scientificName) as CareSheet;
  }

  await writeCache(key, sheet);
  return sheet;
}