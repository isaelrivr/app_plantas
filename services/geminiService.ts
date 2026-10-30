/**
 * Plantae Google Gemini AI Proxy Client
 *
 * Cliente seguro para las capacidades botánicas de IA (Gemini y Plant.id).
 *
 * ⚠️ SEGURIDAD CRÍTICA (P0):
 * Ninguna API Key de Gemini ni secretos residen en el cliente de la app.
 * Todas las peticiones se delegan al backend proxy seguro configurado
 * en `EXPO_PUBLIC_PLANT_AI_ENDPOINT`.
 */

import type { IdentificationCandidate, PlantIdentificationResult } from './plantApi.ts';
import type { BotanicalCareSheet, BotanicalCareLevels } from './plantCareCache.ts';
import type { HealthDiagnosisResult, HealthCategory, HealthSeverity } from './healthService.ts';
import { loadJSON, saveJSON, STORAGE_KEYS } from './storage.ts';

const t = (text: string) => text;

export const HEALTH_DISCLAIMER =
  'Este diagnóstico es orientativo y generado por inteligencia artificial; no sustituye la evaluación de un fitopatólogo profesional. Verifica siempre las indicaciones y las etiquetas oficiales de los productos fitosanitarios antes de aplicarlos.';

export class HealthNoPlantError extends Error {
  constructor(
    message = t('La imagen no parece contener hojas, tallos ni partes de una planta analizables.')
  ) {
    super(message);
    this.name = 'HealthNoPlantError';
  }
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number = 0) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const API_BASE_URL = (process.env.EXPO_PUBLIC_PLANT_AI_ENDPOINT ?? '').trim().replace(/\/+$/, '');

/**
 * En la arquitectura segura local-first, la IA remota está disponible
 * siempre que el backend proxy de Cloud Functions esté configurado.
 */
export function isGeminiDirectAvailable(): boolean {
  return API_BASE_URL.length > 0;
}

/** Convierte una cadena de texto a un slug seguro y limpio. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/** Parsea respuestas JSON limpiando posibles bloques de código markdown. */
export function parseGeminiJson<T>(rawText: string): T {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error('La respuesta de la IA no contiene un JSON válido.');
  }
}

async function postProxyJson<T>(path: string, body: unknown): Promise<T> {
  if (!isGeminiDirectAvailable()) {
    throw new ApiError(
      'NOT_CONFIGURED',
      t('No se ha configurado el servidor seguro de IA de EcoScan (EXPO_PUBLIC_PLANT_AI_ENDPOINT).'),
      0
    );
  }

  let deviceId = 'dev_anonymous';
  try {
    const stored = await loadJSON<string | null>(STORAGE_KEYS.deviceId, null);
    if (typeof stored === 'string' && stored.length > 0) {
      deviceId = stored;
    } else if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      deviceId = crypto.randomUUID();
    }
  } catch {
    // fallback
  }

  const requestId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `req_${Date.now()}`;

  const payload = {
    ...(body && typeof body === 'object' ? body : {}),
    requestId,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new ApiError(
      `HTTP_${response.status}`,
      `Error ${response.status} del servidor proxy: ${errText.slice(0, 200)}`,
      response.status
    );
  }

  return (await response.json()) as T;
}

/**
 * Realiza una consulta al backend proxy de IA sin exponer claves en el cliente.
 */
export async function callGeminiApi(
  contents: unknown[],
  systemInstruction?: string,
  _model?: string
): Promise<string> {
  let promptText = '';
  if (Array.isArray(contents)) {
    for (const item of contents) {
      if (item && typeof item === 'object') {
        const parts = (item as any).parts;
        if (Array.isArray(parts)) {
          for (const p of parts) {
            if (typeof p?.text === 'string') {
              promptText += p.text + '\n';
            }
          }
        }
      }
    }
  }

  if (!promptText.trim()) {
    promptText = typeof contents === 'string' ? contents : JSON.stringify(contents);
  }

  const response = await postProxyJson<{ reply: string }>('/assistantChat', {
    message: promptText.trim(),
    systemInstruction,
  });

  return response.reply;
}

// ---------------------------------------------------------------------------
// Normalización de Fichas de Cuidados
// ---------------------------------------------------------------------------

export interface RawGeminiCareSheet {
  family?: string;
  watering?: string;
  wateringFrequencyDays?: number;
  light?: string;
  temperature?: string;
  humidity?: string;
  difficulty?: 'Fácil' | 'Moderado' | 'Avanzado';
  careLevels?: Partial<BotanicalCareLevels>;
  toxicity?: string;
  climateTip?: string;
  habitatSummary?: string;
  nativeRegions?: string[];
  commonProblems?: string[];
}

export function normalizeGeminiCareSheet(
  raw: RawGeminiCareSheet | undefined,
  commonName: string,
  scientificName: string,
  family: string
): BotanicalCareSheet {
  const clamp = (v: unknown, def: number, min = 1, max = 5): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
  };
  const clampTemp = (v: unknown, def: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : def;
  };

  const rawDays = Number(raw?.wateringFrequencyDays);
  const wateringFrequencyDays =
    Number.isFinite(rawDays) && rawDays >= 1 && rawDays <= 45 ? Math.round(rawDays) : 7;

  return {
    commonName,
    scientificName,
    family: family || raw?.family || 'Familia botánica',
    watering: raw?.watering?.trim() || t('Riego moderado cuando el sustrato se seque'),
    wateringFrequencyDays,
    light: raw?.light?.trim() || t('Luz indirecta brillante'),
    temperature: raw?.temperature?.trim() || '18°C - 26°C',
    humidity: raw?.humidity?.trim() || t('Humedad ambiental media'),
    careLevels: {
      lightLevel: clamp(raw?.careLevels?.lightLevel, 3),
      wateringLevel: clamp(raw?.careLevels?.wateringLevel, 3),
      humidityLevel: clamp(raw?.careLevels?.humidityLevel, 3),
      tempMinC: clampTemp(raw?.careLevels?.tempMinC, 15),
      tempMaxC: clampTemp(raw?.careLevels?.tempMaxC, 28),
    },
    difficulty:
      raw?.difficulty === 'Fácil' || raw?.difficulty === 'Moderado' || raw?.difficulty === 'Avanzado'
        ? raw.difficulty
        : 'Fácil',
    commonProblems:
      Array.isArray(raw?.commonProblems) && raw.commonProblems.length > 0
        ? raw.commonProblems.map((p) => String(p).trim()).filter(Boolean)
        : [t('Exceso de riego'), t('Falta de luz indirecta')],
    climateTip:
      raw?.climateTip?.trim() || t('Mantener protegida de corrientes de aire frío y fuentes de calor intenso.'),
    habitatSummary:
      raw?.habitatSummary?.trim() || t('Especie adaptada a climas templados o subtropicales luminosos.'),
    nativeRegions:
      Array.isArray(raw?.nativeRegions) && raw.nativeRegions.length > 0
        ? raw.nativeRegions.map((r) => String(r).trim()).filter(Boolean)
        : [t('Regiones tropicales')],
    avatarEmoji: '🌿',
    toxicity:
      raw?.toxicity?.trim() || t('Generalmente no tóxica para mascotas en condiciones normales.'),
  };
}

// ---------------------------------------------------------------------------
// Identificación Botánica
// ---------------------------------------------------------------------------

interface IdentifyApiResponse {
  candidates: IdentificationCandidate[];
  isPlant: boolean;
  imageQuality?: Record<string, unknown>;
}

export async function identifyPlantWithGemini(
  base64Images: string[]
): Promise<PlantIdentificationResult & { careSheet?: BotanicalCareSheet }> {
  const response = await postProxyJson<IdentifyApiResponse>('/identifyPlant', {
    images: base64Images,
  });

  const candidates = (response.candidates ?? []).map((c) => ({
    ...c,
    referenceImages: Array.isArray(c.referenceImages) ? c.referenceImages : [],
    source: 'ai-real' as const,
  }));

  const top = candidates[0];
  let careSheet: BotanicalCareSheet | undefined;

  if (top) {
    try {
      careSheet = await generateCareSheetWithGemini(top.name, top.scientificName) ?? undefined;
    } catch {
      // Si la ficha remota falla, continuamos sin romper el resultado
    }
  }

  return {
    candidates,
    isPlant: response.isPlant === true,
    imageQuality: response.imageQuality ?? {},
    confidence: top?.confidence ?? 0,
    source: 'ai-real',
    careSheet,
  };
}

// ---------------------------------------------------------------------------
// Ficha de cuidados
// ---------------------------------------------------------------------------

export async function generateCareSheetWithGemini(
  commonName: string,
  scientificName = ''
): Promise<BotanicalCareSheet | null> {
  const response = await postProxyJson<BotanicalCareSheet>('/careSheet', {
    speciesName: commonName,
    scientificName,
  });
  return response;
}

// ---------------------------------------------------------------------------
// Diagnóstico de Salud
// ---------------------------------------------------------------------------

export async function diagnoseHealthWithGemini(
  base64Images: string[],
  plantName?: string
): Promise<HealthDiagnosisResult> {
  const response = await postProxyJson<any>('/healthAssessment', {
    images: base64Images,
    plantName,
  });

  if (response.isPlant === false) {
    throw new HealthNoPlantError();
  }

  return {
    id: response.id || `diag-${slugify(response.name || 'problema')}`,
    issueKey: response.issueKey || slugify(response.name || 'problema'),
    name: response.name || t('Diagnóstico botánico'),
    scientificName: response.scientificName || t('Condición botánica'),
    category: (response.category as HealthCategory) || 'Plaga',
    severity: (response.severity as HealthSeverity) || 'moderada',
    confidence: typeof response.confidence === 'number' ? response.confidence : 85,
    symptoms: Array.isArray(response.symptoms) ? response.symptoms : [t('Signos detectados en el follaje')],
    description: response.description || t('Evaluación fitosanitaria generada por IA.'),
    referenceImages: Array.isArray(response.referenceImages) ? response.referenceImages : [],
    treatment: response.treatment,
    disclaimer: response.disclaimer || HEALTH_DISCLAIMER,
    source: 'ai-real',
  };
}

// ---------------------------------------------------------------------------
// Asistente Botánico Conversacional
// ---------------------------------------------------------------------------

export interface GeminiAssistantContext {
  plantName?: string;
  gardenPlants?: {
    name: string;
    scientificName?: string;
    isWateredToday?: boolean;
    wateringFrequencyDays?: number;
    healthScore?: number;
    room?: string;
  }[];
  history?: {
    role: 'user' | 'assistant';
    text: string;
  }[];
}

export interface GeminiAssistantResult {
  reply: string;
  quickReplies?: string[];
}

export async function askGeminiAssistant(
  message: string,
  context?: GeminiAssistantContext
): Promise<GeminiAssistantResult> {
  let contextPrompt = '';
  if (context?.gardenPlants && context.gardenPlants.length > 0) {
    contextPrompt += 'Jardín actual del usuario:\n';
    for (const p of context.gardenPlants) {
      const waterStatus = p.isWateredToday ? 'regada hoy' : 'pendiente de riego';
      const freq = p.wateringFrequencyDays ? `cada ${p.wateringFrequencyDays} días` : 'frecuencia estándar';
      contextPrompt += `- ${p.name}${p.scientificName ? ` (${p.scientificName})` : ''}: ${waterStatus}, frecuencia ${freq}${p.room ? `, en ${p.room}` : ''}.\n`;
    }
    contextPrompt += '\n';
  } else if (context?.plantName) {
    contextPrompt += `Planta sobre la que consulta el usuario: "${context.plantName}".\n\n`;
  }

  if (context?.history && context.history.length > 0) {
    contextPrompt += 'Historial reciente de la conversación:\n';
    for (const turn of context.history.slice(-6)) {
      contextPrompt += `${turn.role === 'user' ? 'Usuario' : 'Asistente'}: ${turn.text}\n`;
    }
    contextPrompt += '\n';
  }

  const prompt = `${contextPrompt}Pregunta del usuario: "${message}"\nResponde en español de forma rigurosa, clara y estructurada en Markdown.`;

  try {
    const raw = await callGeminiApi([prompt]);
    return {
      reply: raw.trim(),
      quickReplies: ['¿Cómo debo regarla?', '¿Qué sustrato necesita?', '¿Es tóxica para mascotas?'],
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return {
      reply: t('Para mantener tu planta saludable, verifica la humedad del sustrato y asegúrate de que reciba luz indirecta adecuada.'),
      quickReplies: undefined,
    };
  }
}

// ---------------------------------------------------------------------------
// Briefing Diario
// ---------------------------------------------------------------------------

export interface DailyGardenBriefingInput {
  plantsCount: number;
  plantsNeedingWater: string[];
  totalPlantsSummary: string[];
  weather?: {
    city?: string;
    temperatureC: number;
    weatherDescription: string;
  } | null;
}

export async function generateDailyGardenAdviceWithGemini(
  input: DailyGardenBriefingInput
): Promise<string> {
  const prompt = `Eres el asesor agronómico de EcoScan.
Datos de hoy:
- Clima local: ${input.weather ? `${Math.round(input.weather.temperatureC)}°C, ${input.weather.weatherDescription}${input.weather.city ? ` en ${input.weather.city}` : ''}` : 'Clima estándar'}.
- Total de plantas: ${input.plantsCount} ${input.totalPlantsSummary.length > 0 ? `(${input.totalPlantsSummary.join(', ')})` : ''}.
- Necesitan riego hoy: ${input.plantsNeedingWater.length > 0 ? input.plantsNeedingWater.join(', ') : 'Ninguna (todas al día)'}.

Escribe un consejo agronómico breve de 1 o 2 oraciones cálidas con un emoji para cuidar el jardín hoy.`;

  try {
    const advice = await callGeminiApi([prompt]);
    return advice.trim();
  } catch {
    return 'Revisa la humedad del sustrato de tus plantas antes de regar y aprovecha la luz natural indirecta hoy. 🌿';
  }
}

interface CachedDailyAdvice {
  dateKey: string;
  advice: string;
}

export async function getOrFetchDailyGardenAdvice(
  input: DailyGardenBriefingInput,
  forceRefresh = false
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  if (!forceRefresh) {
    try {
      const cached = await loadJSON<CachedDailyAdvice | null>(STORAGE_KEYS.dailyAiAdvice, null);
      if (cached && cached.dateKey === today && cached.advice) {
        return cached.advice;
      }
    } catch {}
  }

  const advice = await generateDailyGardenAdviceWithGemini(input);
  try {
    await saveJSON(STORAGE_KEYS.dailyAiAdvice, { dateKey: today, advice });
  } catch {}
  return advice;
}

// ---------------------------------------------------------------------------
// Evaluación de Crecimiento
// ---------------------------------------------------------------------------

export interface GrowthEvaluationResult {
  summary: string;
  nextStepAdvice: string;
}

export async function analyzeGrowthWithGemini(
  plantName: string,
  entries: { date: string; note: string; photoUri?: string }[]
): Promise<GrowthEvaluationResult> {
  const entriesText = entries
    .slice(0, 8)
    .map((e) => `- Fecha: ${e.date}. Nota: "${e.note || 'Registro fotográfico'}"`)
    .join('\n');

  const prompt = `Evalúa la evolución de crecimiento de la planta: "${plantName}".
Registros cronológicos del diario:
${entriesText || 'Primer registro de la planta.'}
Escribe una evaluación breve y motivadora de 2 oraciones y un consejo para su siguiente etapa.
Responde ÚNICAMENTE un JSON con: {"summary": "...", "nextStepAdvice": "..."}`;

  try {
    const raw = await callGeminiApi([prompt]);
    const parsed = parseGeminiJson<any>(raw);
    return {
      summary: parsed.summary || 'Tu planta muestra un desarrollo continuo y saludable. 🌿',
      nextStepAdvice: parsed.nextStepAdvice || 'Continúa manteniendo su pauta de luz y humedad ambiental.',
    };
  } catch {
    return {
      summary: 'Tu planta sigue un ritmo de crecimiento constante y vigoroso. 🌿',
      nextStepAdvice: 'Mantén la regularidad en el riego y rota la maceta periódicamente hacia la luz.',
    };
  }
}

// ---------------------------------------------------------------------------
// Hábitat y Geobotánica
// ---------------------------------------------------------------------------

export interface GeminiHabitatResult {
  plantId: string;
  scientificName: string;
  originSummary: string;
  globalCoverage: string;
  conservationStatus: string;
  regions: {
    countryName: string;
    zoneType: 'native' | 'naturalized' | 'cultivated';
    climate: string;
    floweringSeason: string;
    biogeographicZone: string;
    elevationMeters: string;
    notes: string;
  }[];
}

export async function generateHabitatWithGemini(
  commonName: string,
  scientificName = ''
): Promise<GeminiHabitatResult | null> {
  const prompt = `Para la planta "${commonName}" (${scientificName || 'especie botánica'}), indica su hábitat silvestre natural y países donde es nativa.
Responde ÚNICAMENTE un JSON con:
{
  "scientificName": "${scientificName || commonName}",
  "originSummary": "Resumen en español de 2 oraciones sobre su origen geográfico.",
  "globalCoverage": "Breve descripción de su distribución mundial.",
  "conservationStatus": "Preocupación Menor (LC)",
  "regions": [
    {
      "countryName": "País nativo exacto (ej: Mexico, Colombia, Brazil, Costa Rica, Madagascar, South Africa, China, Japan)",
      "zoneType": "native",
      "climate": "Tipo de clima natural",
      "floweringSeason": "Primavera a Verano",
      "biogeographicZone": "Zona o bioma",
      "elevationMeters": "0 - 1,500 m s.n.m.",
      "notes": "Detalle sobre cómo crece en la naturaleza."
    }
  ]
}`;

  try {
    const raw = await callGeminiApi([prompt]);
    const parsed = parseGeminiJson<any>(raw);
    if (!parsed || !Array.isArray(parsed.regions) || parsed.regions.length === 0) {
      return null;
    }
    return {
      plantId: slugify(scientificName || commonName),
      scientificName: parsed.scientificName || scientificName || commonName,
      originSummary: parsed.originSummary || `${commonName} es originaria de sus regiones silvestres nativas.`,
      globalCoverage: parsed.globalCoverage || 'Ampliamente cultivada en hogares y jardines a nivel mundial.',
      conservationStatus: parsed.conservationStatus || 'Preocupación Menor (LC)',
      regions: parsed.regions.map((r: any) => ({
        countryName: String(r.countryName || 'Región nativa').trim(),
        zoneType: (r.zoneType === 'native' || r.zoneType === 'naturalized' || r.zoneType === 'cultivated') ? r.zoneType : 'native',
        climate: String(r.climate || 'Clima favorable').trim(),
        floweringSeason: String(r.floweringSeason || 'Primavera a Verano').trim(),
        biogeographicZone: String(r.biogeographicZone || r.countryName || 'Zona silvestre').trim(),
        elevationMeters: String(r.elevationMeters || '0 - 1,500 m s.n.m.').trim(),
        notes: String(r.notes || `Hábitat originario en ${r.countryName}.`).trim(),
      })),
    };
  } catch {
    return null;
  }
}
