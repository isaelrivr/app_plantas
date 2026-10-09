/**
 * Cliente de Google Gemini (Interactions API) para generar JSON estructurado:
 * ficha de cuidados y planes de tratamiento. La clave solo existe aquí.
 *
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/interactions
 * Respuesta: { steps: [{ type: 'model_output', content: [{ type: 'text', text: '<json>' }] }] }
 */

import type { AppConfig } from '../config';
import { ApiError, upstreamError } from '../errors';

const GENERATIVE_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface InteractionStep {
  type?: string;
  content?: { type?: string; text?: string }[];
}

/** Extrae y parsea el JSON del texto devuelto por Gemini (defensivo). */
export function parseJsonLoose(text: string): unknown | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    /* intenta recortar al primer objeto */
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

async function generateJson(config: AppConfig, system: string, prompt: string, schema: object): Promise<unknown | null> {
  if (config.useMockProviders) return null; // los servicios usan plantillas locales si es null

  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw upstreamError('GEMINI_AUTH', 'El servidor no tiene configurada la clave GEMINI_API_KEY.', 502);
  }

  const body = {
    model: config.geminiModel,
    input: prompt,
    system_instruction: { parts: [{ text: system }] },
    response_format: { type: 'text', mime_type: 'application/json', schema },
  };

  const attempt = async (): Promise<unknown | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.geminiTimeoutMs);
    try {
      const response = await fetch(`${GENERATIVE_BASE}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await response.text().catch(() => '');
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        /* respuesta no JSON */
      }

      if (!response.ok) {
        const message =
          (typeof json?.error?.message === 'string' && json.error.message) ||
          `El proveedor de IA respondió con error ${response.status}.`;
        if (response.status === 401 || response.status === 403) {
          throw upstreamError('GEMINI_AUTH', 'La clave de API de Gemini es inválida o sin permisos.', 502);
        }
        if (response.status === 429) {
          throw upstreamError('GEMINI_RATE_LIMITED', 'El proveedor de IA está saturado; intenta de nuevo en unos minutos.', 503);
        }
        throw upstreamError('GEMINI_ERROR', message, 502);
      }

      const steps: InteractionStep[] = Array.isArray(json?.steps) ? json.steps : [];
      const modelStep = steps.find((step) => step?.type === 'model_output');
      const textPart = modelStep?.content?.find((part) => part?.type === 'text' && typeof part.text === 'string');
      const rawText = textPart?.text;
      if (typeof rawText !== 'string' || rawText.trim().length === 0) return null;
      return parseJsonLoose(rawText);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        throw upstreamError('GEMINI_TIMEOUT', 'El proveedor de IA tardó demasiado en responder.', 504);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  // Un reintento para errores transitorios (red / 5xx / timeout).
  let lastError: Error | null = null;
  for (let attemptNum = 0; attemptNum < 2; attemptNum++) {
    try {
      const result = await attempt();
      if (result !== null) return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // No reintentamos errores de autenticación / cliente (4xx salvo 429).
      if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 429) {
        throw err;
      }
      // Si es el último intento, salimos del bucle para manejar el error abajo.
      if (attemptNum === 1) break;
      // Pequeña espera antes de reintentar.
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // Agotados los reintentos: si es ApiError la propagamos; si no, devolvemos null (fallback local).
  if (lastError instanceof ApiError) throw lastError;
  console.warn('[plantae-functions] Gemini falló tras reintentos:', lastError);
  return null;
}

// ---------------------------------------------------------------------------
// Ficha de cuidados
// ---------------------------------------------------------------------------

const CARE_SHEET_SCHEMA = {
  type: 'object',
  properties: {
    commonName: { type: 'string' },
    scientificName: { type: 'string' },
    family: { type: 'string' },
    watering: { type: 'string' },
    wateringFrequencyDays: { type: 'integer', minimum: 1, maximum: 45 },
    light: { type: 'string' },
    temperature: { type: 'string' },
    humidity: { type: 'string' },
    careLevels: {
      type: 'object',
      properties: {
        lightLevel: { type: 'integer', minimum: 1, maximum: 5 },
        wateringLevel: { type: 'integer', minimum: 1, maximum: 5 },
        humidityLevel: { type: 'integer', minimum: 1, maximum: 5 },
        tempMinC: { type: 'number' },
        tempMaxC: { type: 'number' },
      },
      required: ['lightLevel', 'wateringLevel', 'humidityLevel', 'tempMinC', 'tempMaxC'],
      additionalProperties: false,
    },
    difficulty: { type: 'string', enum: ['Fácil', 'Moderado', 'Avanzado'] },
    commonProblems: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 },
    climateTip: { type: 'string' },
    habitatSummary: { type: 'string' },
    nativeRegions: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    avatarEmoji: { type: 'string' },
    toxicity: { type: 'string' },
  },
  required: [
    'commonName',
    'scientificName',
    'family',
    'watering',
    'wateringFrequencyDays',
    'light',
    'temperature',
    'humidity',
    'careLevels',
    'difficulty',
    'commonProblems',
    'climateTip',
    'habitatSummary',
    'nativeRegions',
    'avatarEmoji',
    'toxicity',
  ],
  additionalProperties: false,
};

const CARE_SYSTEM_PROMPT =
  'Eres un botánico y horticultor experto. Generas fichas de cuidados de plantas de interior y exterior ' +
  'en ESPAÑOL (es-ES), realistas y prácticas para un aficionado. Respondes SIEMPRE con un único objeto JSON ' +
  'válido que cumple el esquema solicitado, sin texto adicional ni bloques de código.';

export async function generateCareSheetJson(
  config: AppConfig,
  commonName: string,
  scientificName: string
): Promise<unknown | null> {
  const prompt =
    `Genera la ficha de cuidados de la especie "${commonName}"` +
    (scientificName ? ` (nombre científico: ${scientificName})` : '') +
    '. Rellena todos los campos del esquema. ' +
    'watering: pauta de riego concreta (frecuencia y cómo comprobar la humedad). ' +
    'wateringFrequencyDays: cada cuántos días regar de media (1-45). ' +
    'careLevels: niveles 1-5 de luz, riego y humedad ambiental, y rango de temperatura en °C (tempMinC/tempMaxC). ' +
    'commonProblems: 2 a 4 problemas frecuentes con su causa. ' +
    'climateTip: un consejo climático práctico. ' +
    'habitatSummary: origen y hábitat natural en 1-2 frases. ' +
    'nativeRegions: países o regiones nativas (nombres). ' +
    'avatarEmoji: un único emoji representativo. ' +
    'toxicity: nota breve sobre toxicidad para mascotas y niños (o "Sin toxicidad conocida relevante").';
  return generateJson(config, CARE_SYSTEM_PROMPT, prompt, CARE_SHEET_SCHEMA);
}

// ---------------------------------------------------------------------------
// Tratamiento de plagas / enfermedades
// ---------------------------------------------------------------------------

const TREATMENT_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ['Plaga', 'Hongo', 'Bacteriosis', 'Estrés Hídrico'] },
    severity: { type: 'string', enum: ['leve', 'moderada', 'grave'] },
    description: { type: 'string' },
    symptoms: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 },
    organicOption: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        products: { type: 'string' },
        dosage: { type: 'string' },
        instructions: { type: 'string' },
      },
      required: ['title', 'products', 'dosage', 'instructions'],
      additionalProperties: false,
    },
    chemicalOption: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        products: { type: 'string' },
        dosage: { type: 'string' },
        instructions: { type: 'string' },
      },
      required: ['title', 'products', 'dosage', 'instructions'],
      additionalProperties: false,
    },
    frequency: { type: 'string' },
    recoveryDays: { type: 'string' },
    prevention: { type: 'string' },
    petsWarning: { type: 'boolean' },
    childrenWarning: { type: 'boolean' },
    gloves: { type: 'boolean' },
    safetyText: { type: 'string' },
  },
  required: [
    'category',
    'severity',
    'description',
    'symptoms',
    'organicOption',
    'chemicalOption',
    'frequency',
    'recoveryDays',
    'prevention',
    'petsWarning',
    'childrenWarning',
    'gloves',
    'safetyText',
  ],
  additionalProperties: false,
};

const TREATMENT_SYSTEM_PROMPT =
  'Eres un fitopatólogo experto. Explicas problemas de salud de las plantas en ESPAÑOL (es-ES) y propones ' +
  'tratamientos orgánicos y químicos realistas para aficionados. Respondes SIEMPRE con un único objeto JSON ' +
  'válido que cumple el esquema, sin texto adicional ni bloques de código. No inventes marcas comerciales; ' +
  'usa principios activos genéricos.';

export async function generateTreatmentJson(
  config: AppConfig,
  issueName: string,
  probability: number,
  plantName: string | undefined,
  upstreamDescription: string | undefined
): Promise<unknown | null> {
  const prompt =
    `Diagnóstico del proveedor de visión: "${issueName}" con probabilidad ${(probability * 100).toFixed(0)}%.` +
    (plantName ? ` La planta analizada podría ser "${plantName}".` : '') +
    (upstreamDescription ? ` Descripción del proveedor: ${upstreamDescription}.` : '') +
    ' Genera el plan. ' +
    'category: elige entre "Plaga", "Hongo", "Bacteriosis" o "Estrés Hídrico" según la naturaleza del problema ' +
    '(los daños abióticos, de riego, luz o nutrición van en "Estrés Hídrico"). ' +
    'severity: "leve", "moderada" o "grave". ' +
    'symptoms: 2 a 4 síntomas visuales concretos que ayudan a confirmarlo. ' +
    'organicOption y chemicalOption: título, productos de referencia (principios activos genéricos), dosis y ' +
    'modo de aplicación. frequency y recoveryDays: cronograma. prevention: cómo evitarlo. ' +
    'petsWarning/childrenWarning/gloves: marca true solo si procede. safetyText: advertencia breve.';
  return generateJson(config, TREATMENT_SYSTEM_PROMPT, prompt, TREATMENT_SCHEMA);
}