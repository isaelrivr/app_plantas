/**
 * Cliente de Google Gemini (GenerateContent API oficial v1beta).
 *
 * Utiliza modelos estables (`gemini-1.5-flash`) y el contrato estándar `generateContent`.
 * La clave de API reside únicamente en las variables de entorno de este servidor.
 */

import type { AppConfig } from '../config';
import { ApiError, upstreamError } from '../errors';

const GENERATIVE_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

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

async function generateJson(
  config: AppConfig,
  system: string,
  prompt: string,
  schema: object
): Promise<unknown | null> {
  if (config.useMockProviders) return null;

  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw upstreamError('GEMINI_AUTH', 'El servidor no tiene configurada la clave GEMINI_API_KEY.', 502);
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: system }],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.2,
    },
  };

  const attempt = async (): Promise<unknown | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.geminiTimeoutMs);
    try {
      const url = `${GENERATIVE_BASE}/${config.geminiModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
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

  // Reintento único para errores transitorios
  let lastError: Error | null = null;
  for (let attemptNum = 0; attemptNum < 2; attemptNum++) {
    try {
      const result = await attempt();
      if (result !== null) return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 429) {
        throw err;
      }
      if (attemptNum === 1) break;
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  console.warn('[plantae-functions] Gemini falló tras reintentos:', lastError);
  return null;
}

export async function generateAssistantText(
  config: AppConfig,
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) throw upstreamError('GEMINI_AUTH', 'El servidor no tiene configurada la clave GEMINI_API_KEY.', 502);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.geminiTimeoutMs);

  const system =
    systemInstruction ||
    'Eres un asistente botánico experto, riguroso y práctico de EcoScan. Responde en español, en texto claro y breve.\n' +
    'GUARDRAILS ESTRICTOS DE SEGURIDAD Y TAXONOMÍA:\n' +
    '1. NUNCA inventes especies, familias ni taxonomías ficticias ante entradas arbitrarias, jerga, nombres de objetos o cadenas sin sentido. Si el usuario consulta sobre algo que no sea una planta real, aclara amablemente que solo atiendes consultas botánicas y que dicho término no corresponde a una especie vegetal real.\n' +
    '2. Cualquier referencia a toxicidad para mascotas o niños debe ir acompañada de la advertencia de que la información es meramente orientativa y que debe contactarse inmediatamente a un veterinario en caso de ingestión o duda.\n' +
    '3. No inventes diagnósticos definitivos ni instrucciones peligrosas con químicos o fitosanitarios.';

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt.slice(0, 4000) }],
      },
    ],
    systemInstruction: {
      parts: [{ text: system }],
    },
    generationConfig: {
      temperature: 0.3,
    },
  };

  try {
    const url = `${GENERATIVE_BASE}/${config.geminiModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const json = (await response.json().catch(() => null)) as any;
    if (!response.ok) {
      throw upstreamError('GEMINI_ERROR', `El proveedor de IA respondió con error ${response.status}.`, 502);
    }

    const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) throw upstreamError('GEMINI_EMPTY', 'El proveedor de IA no devolvió una respuesta.', 502);
    return reply.slice(0, 5000);
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      throw upstreamError('GEMINI_TIMEOUT', 'El proveedor de IA tardó demasiado en responder.', 504);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Esquemas y Prompts
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
  'Eres un botánico y horticultor experto de EcoScan. Generas fichas de cuidados de plantas de interior y exterior ' +
  'en ESPAÑOL (es-ES), realistas y prácticas para un aficionado. Respondes SIEMPRE con un único objeto JSON ' +
  'válido que cumple el esquema solicitado, sin texto adicional ni bloques de código.\n\n' +
  'GUARDRAILS ESTRICTOS DE TAXONOMÍA:\n' +
  '1. NUNCA inventes especies, familias ni taxonomías ficticias para entradas arbitrarias, nombres de personas, objetos, animales o cadenas sin sentido. Si la entrada no es un vegetal real reconocido, responde con family: "No vegetal / Inválido", scientificName: "Especie no determinada" y describe en habitatSummary que la entrada no corresponde a una especie vegetal reconocida.\n' +
  '2. En el campo toxicity, indica de forma obligatoria que la información sobre toxicidad es meramente orientativa y se debe consultar al veterinario ante cualquier duda o sospecha de ingestión.';

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
