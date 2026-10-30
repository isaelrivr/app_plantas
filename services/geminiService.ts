/**
 * EcoScan Google Gemini AI Client (Directo & Proxy para Demostración Académica)
 *
 * Soporta dos modos de operación:
 * 1. MODO DIRECTO (Recomendado para Demo Universitaria):
 *    Consume directamente Google AI Studio (API oficial de Gemini) con la clave
 *    `EXPO_PUBLIC_GEMINI_API_KEY` usando modelos estables y vigentes (`gemini-1.5-flash`).
 *    Soporta multimodalidad (visión foliar, identificación de especies y diagnóstico).
 *
 * 2. MODO PROXY (Backend):
 *    Si no hay clave directa configurada, delega la petición al proxy de Cloud Functions
 *    definido en `EXPO_PUBLIC_PLANT_AI_ENDPOINT`.
 */

import type { IdentificationCandidate, PlantIdentificationResult } from './plantApi.ts';
import type { BotanicalCareSheet, BotanicalCareLevels } from './plantCareCache.ts';
import type { HealthDiagnosisResult, HealthCategory, HealthSeverity } from './healthService.ts';
import { loadJSON, saveJSON, STORAGE_KEYS } from './storage.ts';
import { ApiError, postJson, isApiConfigured } from './apiClient.ts';
export { ApiError };

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

// Configuración de Gemini desde variables de entorno
const GEMINI_API_KEY = (process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim();
const GEMINI_MODEL = (process.env.EXPO_PUBLIC_GEMINI_MODEL ?? 'gemini-1.5-flash').trim();
const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * La IA directa está disponible si hay una clave de Gemini directa configurada.
 */
export function isGeminiDirectAvailable(): boolean {
  return GEMINI_API_KEY.length > 0;
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
  return postJson<T>(path, body);
}

/**
 * Realiza una consulta directa a Google AI Studio (GenerateContent API).
 */
export async function callGeminiDirect(
  parts: Array<{
    text?: string;
    inlineData?: { mimeType: string; data: string };
    inline_data?: { mime_type: string; data: string };
  }>,
  systemInstruction?: string,
  responseSchema?: object
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new ApiError(
      'NO_GEMINI_KEY',
      'No se ha configurado la clave EXPO_PUBLIC_GEMINI_API_KEY en el archivo .env',
      401
    );
  }

  const url = `${GOOGLE_AI_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  // Normaliza las partes al contrato estándar camelCase de Google Generative Language REST API (inlineData)
  const normalizedParts = parts.map((part) => {
    const raw = part as any;
    if (raw.inline_data) {
      return {
        inlineData: {
          mimeType: raw.inline_data.mime_type || 'image/jpeg',
          data: raw.inline_data.data,
        },
      };
    }
    if (raw.inlineData) {
      return {
        inlineData: {
          mimeType: raw.inlineData.mimeType || raw.inlineData.mime_type || 'image/jpeg',
          data: raw.inlineData.data,
        },
      };
    }
    return part;
  });

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: normalizedParts,
      },
    ],
    generationConfig: {
      temperature: 0.2,
      ...(responseSchema ? { responseMimeType: 'application/json', responseSchema } : {}),
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = json?.error?.message || `HTTP ${response.status} de Google AI Studio`;
      throw new ApiError(`GEMINI_${response.status}`, `Error de Gemini AI: ${errorMsg}`, response.status);
    }

    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== 'string') {
      throw new ApiError('GEMINI_EMPTY', 'Gemini AI no devolvió una respuesta válida.', 502);
    }

    return text;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'La solicitud a Gemini tardó más de 20 segundos y expiró.', 504);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError('NETWORK_ERROR', `Error al conectar con Google Gemini: ${err?.message || 'Error de red'}`, 0);
  }
}

/**
 * Consulta a Gemini (Directo si hay API key, o vía backend proxy si no).
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

  // 1. Si hay clave directa de Gemini en .env, usar Google AI Studio directamente
  if (GEMINI_API_KEY.length > 0) {
    return callGeminiDirect([{ text: promptText.trim() }], systemInstruction);
  }

  // 2. Si no, delegar al proxy de Cloud Functions
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
  // 1. MODO DIRECTO: Consulta multimodal a Gemini 1.5 Flash si hay clave configurada
  if (GEMINI_API_KEY.length > 0) {
    const cleanImages = base64Images.map((img) =>
      img.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
    );

    const promptText = `Actúa como botánico experto y taxónomo de EcoScan.
Analiza detenidamente la(s) imagen(es) provista(s) e identifica la especie vegetal.
Si la imagen NO contiene una planta, flor, fruto, tallo u hoja, responde: {"isPlant": false, "candidates": []}.
Si es una planta, devuelve SIEMPRE un JSON válido con esta estructura exacta:
{
  "isPlant": true,
  "confidence": 95,
  "candidates": [
    {
      "id": "slug-de-la-planta",
      "name": "Nombre Común Principal en español",
      "scientificName": "Nombre científico en latín",
      "family": "Familia botánica",
      "confidence": 95,
      "commonNames": ["Nombre común 1", "Nombre común 2"],
      "wikiDescription": "Descripción botánica detallada de 2 a 3 oraciones sobre su origen, hojas y cuidados.",
      "referenceImages": []
    }
  ],
  "careSheet": {
    "family": "Familia botánica",
    "watering": "Frecuencia de riego clara (ej. Riego cada 5 a 7 días cuando el sustrato seque)",
    "wateringFrequencyDays": 7,
    "light": "Requerimiento de luz (ej. Luz indirecta brillante)",
    "temperature": "18°C - 24°C",
    "humidity": "Media a alta (50%-70%)",
    "difficulty": "Fácil",
    "toxicity": "Información sobre toxicidad para mascotas y niños.",
    "climateTip": "Consejo climático práctico para su cuidado en casa.",
    "habitatSummary": "Resumen de su hábitat nativo y origen.",
    "nativeRegions": ["Región o país de origen"]
  }
}`;

    const parts = [
      { text: promptText },
      ...cleanImages.slice(0, 3).map((data) => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data,
        },
      })),
    ];

    const raw = await callGeminiDirect(parts);
    const parsed = parseGeminiJson<{
      isPlant?: boolean;
      confidence?: number;
      candidates?: IdentificationCandidate[];
      careSheet?: RawGeminiCareSheet;
    }>(raw);

    const isPlant = parsed.isPlant !== false && (parsed.candidates?.length ?? 0) > 0;
    const candidates = (parsed.candidates ?? []).map((c) => ({
      ...c,
      id: slugify(c.scientificName || c.name),
      source: 'ai-real' as const,
      referenceImages: Array.isArray(c.referenceImages) ? c.referenceImages : [],
    }));

    const top = candidates[0];
    let careSheet: BotanicalCareSheet | undefined;
    if (top && parsed.careSheet) {
      careSheet = normalizeGeminiCareSheet(
        parsed.careSheet,
        top.name,
        top.scientificName,
        top.family || 'Familia botánica'
      );
    }

    return {
      candidates,
      isPlant,
      confidence: top?.confidence ?? (isPlant ? 90 : 0),
      imageQuality: {},
      source: 'ai-real',
      careSheet,
    };
  }

  // 2. MODO PROXY: Llamada al endpoint de Cloud Functions
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
      careSheet = (await generateCareSheetWithGemini(top.name, top.scientificName)) ?? undefined;
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
  if (GEMINI_API_KEY.length > 0) {
    const prompt = `Genera la ficha de cuidados de la planta "${commonName}" (${scientificName || 'especie botánica'}).
Responde ÚNICAMENTE un JSON válido con:
{
  "family": "Familia botánica",
  "watering": "Instrucciones de riego detalladas",
  "wateringFrequencyDays": 7,
  "light": "Requerimiento de iluminación",
  "temperature": "18°C - 24°C",
  "humidity": "Humedad recomendada",
  "difficulty": "Fácil",
  "toxicity": "Información preventiva sobre mascotas",
  "climateTip": "Consejo ambiental",
  "habitatSummary": "Breve origen y hábitat",
  "nativeRegions": ["Región de origen"]
}`;

    const raw = await callGeminiDirect([{ text: prompt }]);
    const parsed = parseGeminiJson<RawGeminiCareSheet>(raw);
    return normalizeGeminiCareSheet(parsed, commonName, scientificName, parsed.family || 'Familia botánica');
  }

  const response = await postProxyJson<BotanicalCareSheet>('/careSheet', {
    speciesName: commonName,
    scientificName,
  });
  return response;
}

// ---------------------------------------------------------------------------
// Diagnóstico de Salud y Plagas
// ---------------------------------------------------------------------------

export async function diagnoseHealthWithGemini(
  base64Images: string[],
  plantName?: string
): Promise<HealthDiagnosisResult> {
  if (GEMINI_API_KEY.length > 0) {
    const cleanImages = base64Images.map((img) =>
      img.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
    );

    const promptText = `Actúa como fitopatólogo experto de EcoScan.
Examina la(s) foto(s) de las hojas o tallos de la planta ${plantName ? `("${plantName}")` : ''} para diagnosticar plagas, hongos, deficiencias nutricionales o problemas de riego.
Si la imagen no contiene hojas ni partes de plantas analizables, responde: {"isPlant": false}.
Si está enferma o saludable, responde un JSON válido con esta estructura exacta:
{
  "isPlant": true,
  "issueKey": "clave_corta_en_minusculas",
  "name": "Título del diagnóstico en español (ej. Hojas saludables o Mildiu polvoriento)",
  "scientificName": "Nombre científico del patógeno o condición",
  "category": "Plaga" | "Hongo" | "Riego" | "Luz" | "Nutrientes",
  "severity": "leve" | "moderada" | "alta",
  "confidence": 92,
  "symptoms": ["Síntoma 1 observado en la foto", "Síntoma 2..."],
  "description": "Explicación detallada de lo que presenta la planta en 2 párrafos claros.",
  "treatment": {
    "title": "Tratamiento recomendado",
    "description": "Explicación general de la cura.",
    "intervalDays": 7,
    "actions": ["Paso 1: aislar la planta", "Paso 2: aplicar infusión o producto..."]
  }
}`;

    const parts = [
      { text: promptText },
      ...cleanImages.slice(0, 3).map((data) => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data,
        },
      })),
    ];

    const raw = await callGeminiDirect(parts);
    const parsed = parseGeminiJson<any>(raw);

    if (parsed.isPlant === false) {
      throw new HealthNoPlantError();
    }

    return {
      id: `diag-${slugify(parsed.name || 'problema')}`,
      issueKey: parsed.issueKey || slugify(parsed.name || 'problema'),
      name: parsed.name || t('Diagnóstico botánico'),
      scientificName: parsed.scientificName || t('Condición botánica'),
      category: (parsed.category as HealthCategory) || 'Plaga',
      severity: (parsed.severity as HealthSeverity) || 'moderada',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 90,
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [t('Signos detectados en el follaje')],
      description: parsed.description || t('Evaluación fitosanitaria generada por IA.'),
      referenceImages: [],
      treatment: parsed.treatment,
      disclaimer: HEALTH_DISCLAIMER,
      source: 'ai-real',
    };
  }

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
// Consejo Diario Inteligente
// ---------------------------------------------------------------------------

export async function generateDailyGardenAdviceWithGemini(
  input: {
    city?: string;
    temperatureC?: number;
    humidity?: number;
    weatherCondition?: string;
    plantNames: string[];
    pendingWaterCount: number;
  }
): Promise<string> {
  const plantsText = input.plantNames.length > 0 ? input.plantNames.slice(0, 5).join(', ') : 'tus plantas';
  const weatherText = input.weatherCondition
    ? `Clima en ${input.city || 'tu zona'}: ${input.weatherCondition}, ${input.temperatureC ?? 22}°C, humedad ${input.humidity ?? 50}%.`
    : 'Clima templado habitual.';

  const prompt = `Genera un consejo botánico diario motivador, conciso y práctico de 2 oraciones para el cuidador.
${weatherText}
Plantas en el jardín: ${plantsText}.
Plantas pendientes de riego hoy: ${input.pendingWaterCount}.
Enfócate en la hidratación, luz o ventilación adecuada según el clima. Responde en español directo y sin encabezados.`;

  try {
    const raw = await callGeminiApi([prompt]);
    return raw.trim() || 'Comprueba la humedad del sustrato de tus plantas antes de regar hoy.';
  } catch {
    return 'Revisa la humedad del sustrato y rota tus plantas hacia la luz natural periódicamente.';
  }
}

export async function getDailyGardenAdvice(
  input: {
    city?: string;
    temperatureC?: number;
    humidity?: number;
    weatherCondition?: string;
    plantNames?: string[];
    pendingWaterCount?: number;
    plantsCount?: number;
    plantsNeedingWater?: string[];
    totalPlantsSummary?: string[];
    weather?: {
      city?: string;
      temperatureC?: number;
      weatherDescription?: string;
    } | null;
  },
  force = false
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  if (!force) {
    const cached = await loadJSON<{ dateKey: string; advice: string } | null>(STORAGE_KEYS.dailyAiAdvice, null);
    if (cached && cached.dateKey === today && cached.advice) {
      return cached.advice;
    }
  }

  const plantNames = input.plantNames ?? input.totalPlantsSummary ?? [];
  const pendingWaterCount = input.pendingWaterCount ?? input.plantsNeedingWater?.length ?? 0;
  const city = input.city ?? input.weather?.city;
  const temperatureC = input.temperatureC ?? input.weather?.temperatureC;
  const weatherCondition = input.weatherCondition ?? input.weather?.weatherDescription;

  const advice = await generateDailyGardenAdviceWithGemini({
    city,
    temperatureC,
    humidity: input.humidity,
    weatherCondition,
    plantNames,
    pendingWaterCount,
  });

  try {
    await saveJSON(STORAGE_KEYS.dailyAiAdvice, { dateKey: today, advice });
  } catch {}
  return advice;
}

export const getOrFetchDailyGardenAdvice = getDailyGardenAdvice;

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
