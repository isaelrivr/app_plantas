/**
 * Configuración del backend leída de variables de entorno (functions/.env o el
 * entorno de Firebase). Ninguna clave viaja al cliente: solo existen aquí.
 */

export interface QuotaRule {
  free: number;
  premium: number;
}

export interface AppConfig {
  plantIdApiKey: string | null;
  geminiApiKey: string | null;
  geminiModel: string;
  plantIdBaseUrl: string;
  upstreamTimeoutMs: number;
  geminiTimeoutMs: number;
  maxImagesPerRequest: number;
  /** Tamaño máximo por imagen base64 (1.5MB ≈ imagen JPEG de ~1MB). */
  maxImageBytes: number;
  quotas: {
    identify: QuotaRule;
    care: QuotaRule;
    health: QuotaRule;
  };
  careCacheDays: number;
  /** Solo para desarrollo local. Nunca en producción. */
  useMockProviders: boolean;
}

const env = process.env;

export function getConfig(): AppConfig {
  const useMockProviders = env.USE_MOCK_PROVIDERS === 'true' && env.NODE_ENV !== 'production';

  return {
    plantIdApiKey: env.PLANT_ID_API_KEY?.trim() || null,
    geminiApiKey: env.GEMINI_API_KEY?.trim() || null,
    geminiModel: env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash',
    plantIdBaseUrl: (env.PLANT_ID_BASE_URL?.trim() || 'https://api.plant.id/v2').replace(/\/+$/, ''),
    upstreamTimeoutMs: 20_000,
    geminiTimeoutMs: 15_000,
    maxImagesPerRequest: 4,
    maxImageBytes: 1_500_000,
    quotas: {
      identify: { free: 3, premium: 200 },
      care: { free: 30, premium: 300 },
      health: { free: 3, premium: 100 },
    },
    careCacheDays: Number(env.CARE_CACHE_DAYS || 30),
    useMockProviders,
  };
}