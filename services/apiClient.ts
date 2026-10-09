/**
 * Plantae API Client
 *
 * Cliente HTTP único contra las Cloud Functions de Plantae. Reglas:
 *  - Ninguna clave de API vive aquí: el móvil solo conoce la URL base.
 *  - Timeout de 15 s con un reintento para fallos transitorios.
 *  - Idempotencia: cada petición lleva un `requestId` estable, de modo que un
 *    reintento de red NO vuelve a consumir cuota en el servidor.
 *  - Los errores se normalizan a `ApiError` con `code` / `status` legibles.
 *
 * En desarrollo, si no hay endpoint configurado, los servicios caen a datos
 * simulados (`shouldUseMocks`). En producción NUNCA se usan mocks.
 */

import * as Crypto from 'expo-crypto';
import { getDeviceId } from './deviceId';

/** URL base de las Cloud Functions, sin barra final. */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_PLANT_AI_ENDPOINT ?? '').trim().replace(/\/+$/, '');

const USE_MOCKS_FROM_ENV = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 1;
const DEVICE_HEADER = 'X-Device-Id';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    retryAfterSeconds?: number;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 0,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** ¿Hay un backend configurado? */
export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

/**
 * ¿Debemos usar datos simulados? Solo en desarrollo: bien porque el
 * desarrollador lo pide con `EXPO_PUBLIC_USE_MOCKS`, bien porque todavía no ha
 * configurado un endpoint. En producción jamás.
 */
export function shouldUseMocks(): boolean {
  return __DEV__ && (USE_MOCKS_FROM_ENV || !isApiConfigured());
}

interface PostOptions {
  timeoutMs?: number;
  retries?: number;
  /** Permite reutilizar un requestId propio (p. ej. reintento manual del usuario). */
  requestId?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    const text = await response.text();
    body = text ? (JSON.parse(text) as ApiErrorBody) : null;
  } catch {
    body = null;
  }
  const code = body?.error?.code ?? `HTTP_${response.status}`;
  const message =
    body?.error?.message ??
    (response.status >= 500
      ? 'El servidor de Plantae no está disponible en este momento. Inténtalo de nuevo.'
      : 'La petición no se pudo completar. Revisa los datos e inténtalo de nuevo.');
  return new ApiError(code, message, response.status, body?.error?.retryAfterSeconds);
}

/**
 * Envía una petición POST JSON a una función de Plantae.
 * @param path Ruta relativa, p. ej. `/identifyPlant`.
 */
export async function postJson<T>(path: string, body: unknown, options: PostOptions = {}): Promise<T> {
  if (!isApiConfigured()) {
    throw new ApiError(
      'NOT_CONFIGURED',
      'La app no tiene configurado el servidor de reconocimiento (EXPO_PUBLIC_PLANT_AI_ENDPOINT).',
      0
    );
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = (options.retries ?? MAX_RETRIES) + 1;
  const requestId = options.requestId ?? Crypto.randomUUID();
  const payload = {
    ...(body && typeof body === 'object' ? body : {}),
    requestId,
  };

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const deviceId = await getDeviceId();
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [DEVICE_HEADER]: deviceId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const error = await parseError(response);
        // No reintentamos errores de cliente (4xx): son deterministas.
        if (response.status < 500) throw error;
        lastError = error;
        if (attempt < maxAttempts - 1) {
          await sleep(600 * (attempt + 1));
          continue;
        }
        throw error;
      }

      return (await response.json()) as T;
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof ApiError) {
        // Los 4xx ya se lanzaron arriba; aquí solo quedan 5xx agotados.
        if (err.status < 500 || attempt >= maxAttempts - 1) throw err;
        lastError = err;
      } else if ((err as Error)?.name === 'AbortError') {
        lastError = new ApiError('TIMEOUT', 'El análisis tardó demasiado. Comprueba tu conexión e inténtalo de nuevo.', 0);
      } else {
        lastError = new ApiError('NETWORK', 'No se pudo conectar con el servidor de Plantae. Revisa tu conexión.', 0);
      }

      if (attempt < maxAttempts - 1) {
        await sleep(600 * (attempt + 1));
      }
    }
  }

  throw lastError ?? new ApiError('NETWORK', 'No se pudo conectar con el servidor de Plantae.', 0);
}
