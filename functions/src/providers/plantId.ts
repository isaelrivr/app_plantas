/**
 * Cliente de Plant.id API v2 (síncrona).
 *
 * - Identificación:  POST {base}/identify
 * - Salud/enfermedad: POST {base}/health_assessment
 *
 * La API v2 es síncrona: devuelve el resultado en la misma respuesta, por lo
 * que cabe dentro del presupuesto de tiempo de la app (~15s). La clave viaja
 * solo en este servidor (header `Api-Key`), nunca al cliente.
 */

import type { AppConfig } from '../config';
import { upstreamError } from '../errors';

export interface PlantIdSuggestion {
  name: string;
  probability: number; // 0 a 1
  commonNames: string[];
  wikiDescription?: string;
  family?: string;
  genus?: string;
  similarImages: { url: string; urlSmall: string }[];
}

export interface PlantIdIdentifyResult {
  isPlant: boolean;
  plantProbability: number;
  suggestions: PlantIdSuggestion[];
}

export interface PlantIdHealthSuggestion {
  name: string;
  probability: number;
  description?: string;
  commonNames: string[];
  similarImages: { url: string; urlSmall: string }[];
}

export interface PlantIdHealthResult {
  isPlant: boolean;
  isHealthy: boolean;
  healthProbability: number;
  suggestions: PlantIdHealthSuggestion[];
}

async function postJson(url: string, apiKey: string, body: unknown, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = (err as Error)?.name === 'AbortError';
    if (aborted) throw upstreamError('UPSTREAM_TIMEOUT', 'El proveedor de visión tardó demasiado en responder.', 504);
    throw upstreamError('UPSTREAM_NETWORK', 'No se pudo contactar con el proveedor de visión botánica.');
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text().catch(() => '');
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* respuesta no JSON */
  }

  if (!response.ok) {
    const message =
      (typeof json?.message === 'string' && json.message) ||
      (typeof json?.error === 'string' && json.error) ||
      `El proveedor de visión respondió con error ${response.status}.`;
    if (response.status === 401 || response.status === 403) {
      throw upstreamError('PLANT_ID_AUTH', 'La clave de API del proveedor de visión es inválida o sin permisos.', 502);
    }
    if (response.status === 429) {
      throw upstreamError('PLANT_ID_RATE_LIMITED', 'El proveedor de visión está saturado; intenta de nuevo en unos minutos.', 503);
    }
    throw upstreamError(
      response.status >= 500 ? 'UPSTREAM_ERROR' : 'UPSTREAM_BAD_RESPONSE',
      message,
      response.status >= 500 ? 502 : 422
    );
  }

  return json;
}

const asCommonNames = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)).filter((item) => item.length > 0) : [];

const asSimilarImages = (value: unknown): { url: string; urlSmall: string }[] =>
  Array.isArray(value)
    ? value
        .slice(0, 3)
        .map((item: any) => ({ url: String(item?.url ?? ''), urlSmall: String(item?.url_small ?? item?.url ?? '') }))
        .filter((image) => image.url.length > 0 || image.urlSmall.length > 0)
    : [];

export async function identifyWithPlantId(config: AppConfig, images: string[]): Promise<PlantIdIdentifyResult> {
  if (config.useMockProviders) return mockIdentify();

  if (!config.plantIdApiKey) {
    throw upstreamError('PLANT_ID_AUTH', 'El servidor no tiene configurada la clave PLANT_ID_API_KEY.', 502);
  }

  const json: any = await postJson(
    `${config.plantIdBaseUrl}/identify`,
    config.plantIdApiKey,
    {
      images,
      modifiers: ['similar_images'],
      plant_language: 'es',
      plant_details: ['common_names', 'wiki_description', 'taxonomy', 'url'],
      identification_timeout: 20,
    },
    config.upstreamTimeoutMs
  );

  const isPlantBox = json?.is_plant;
  const suggestions = Array.isArray(json?.suggestions) ? json.suggestions : [];

  return {
    isPlant: isPlantBox?.probable === true || Number(isPlantBox?.probability ?? 0) >= 0.6,
    plantProbability: Number(isPlantBox?.probability ?? 0),
    suggestions: suggestions
      .filter((s: any) => typeof s?.plant_name === 'string' && s.plant_name.trim().length > 0)
      .slice(0, 6)
      .map((s: any): PlantIdSuggestion => {
        const details = s?.plant_details ?? {};
        const taxonomy = details?.taxonomy ?? {};
        const wiki = details?.wiki_description?.value;
        return {
          name: String(s.plant_name),
          probability: Number(s?.probability ?? 0),
          commonNames: asCommonNames(details?.common_names),
          wikiDescription: typeof wiki === 'string' && wiki.length > 0 ? wiki : undefined,
          family: taxonomy?.family ? String(taxonomy.family) : undefined,
          genus: taxonomy?.genus ? String(taxonomy.genus) : undefined,
          similarImages: asSimilarImages(s?.similar_images),
        };
      }),
  };
}

export async function assessHealthWithPlantId(config: AppConfig, images: string[]): Promise<PlantIdHealthResult> {
  if (config.useMockProviders) return mockHealth();

  if (!config.plantIdApiKey) {
    throw upstreamError('PLANT_ID_AUTH', 'El servidor no tiene configurada la clave PLANT_ID_API_KEY.', 502);
  }

  const json: any = await postJson(
    `${config.plantIdBaseUrl}/health_assessment`,
    config.plantIdApiKey,
    {
      images,
      modifiers: ['similar_images'],
      disease_details: ['common_names', 'description', 'treatment'],
      language: 'es',
    },
    config.upstreamTimeoutMs
  );

  const isHealthyBox = json?.is_healthy;
  const isPlantBox = json?.is_plant;
  const suggestions = Array.isArray(json?.disease?.suggestions) ? json.disease.suggestions : [];

  return {
    isPlant: isPlantBox?.probable === true || Number(isPlantBox?.probability ?? 0) >= 0.6,
    isHealthy: isHealthyBox?.probable === true || Number(isHealthyBox?.probability ?? 0) >= 0.6,
    healthProbability: Number(isHealthyBox?.probability ?? 0),
    suggestions: suggestions.slice(0, 5).map((s: any): PlantIdHealthSuggestion => {
      const details = s?.details ?? {};
      const description = details?.description?.value;
      return {
        name: String(s?.name ?? 'Sin nombre'),
        probability: Number(s?.probability ?? 0),
        description: typeof description === 'string' && description.length > 0 ? description : undefined,
        commonNames: asCommonNames(details?.common_names),
        similarImages: asSimilarImages(s?.similar_images),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Proveedores simulados (solo desarrollo local con USE_MOCK_PROVIDERS=true)
// ---------------------------------------------------------------------------

function mockIdentify(): PlantIdIdentifyResult {
  return {
    isPlant: true,
    plantProbability: 0.97,
    suggestions: [
      { name: 'Monstera deliciosa', probability: 0.91, commonNames: ['Costilla de Adán'], family: 'Araceae', genus: 'Monstera', similarImages: [] },
      { name: 'Epipremnum aureum', probability: 0.05, commonNames: ['Pothos dorado'], family: 'Araceae', genus: 'Epipremnum', similarImages: [] },
    ],
  };
}

function mockHealth(): PlantIdHealthResult {
  return {
    isPlant: true,
    isHealthy: false,
    healthProbability: 0.2,
    suggestions: [{ name: 'Powdery mildew', probability: 0.72, commonNames: ['Oídio'], similarImages: [] }],
  };
}