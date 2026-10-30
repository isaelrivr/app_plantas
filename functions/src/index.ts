/**
 * Punto de entrada de las Cloud Functions HTTP de EcoScan (Backend Proxy de IA).
 *
 * Todas las funciones son `onRequest` (v2) en `us-central1`:
 *   - POST /identifyPlant      → identificación botánica con Plant.id API v3
 *   - POST /careSheet          → ficha de cuidados con Gemini 1.5 Flash (caché en memoria)
 *   - POST /healthAssessment   → diagnóstico de salud con Plant.id v3 + Gemini
 *   - POST /assistantChat      → asistente botánico y utilidades con Gemini 1.5 Flash
 *
 * Ninguna clave de API vive en el cliente. La identidad se basa exclusivamente en
 * el encabezado `X-Device-Id`. Idempotencia ligada a `deviceId + requestId`.
 */

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

import { getConfig, type AppConfig } from './config';
import { extractIdentity, type Identity } from './guard';
import { serializeErrorBody } from './errors';
import { getCachedResponse, cacheResponse } from './idempotency';
import { runIdentify } from './identify';
import { resolveCareSheet } from './care';
import { runHealthAssessment } from './health';
import { runAssistant } from './assistant';
import type { AssistantRequest, CareRequest, HealthRequest, IdentifyRequest } from './types';

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

/** Orígenes permitidos para peticiones CORS de desarrollo y dominio oficial */
const ALLOWED_ORIGINS = [
  /https?:\/\/localhost(:\d+)?$/,
  /https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /https:\/\/ecoscan\.app$/,
  /https:\/\/.*\.ecoscan\.app$/,
];

/** Cuerpo mínimo con id de idempotencia opcional. */
type WithRequestId<T> = T & { requestId?: string };

function createEndpoint<TBody>(
  run: (config: AppConfig, identity: Identity, body: TBody) => Promise<unknown>
) {
  return onRequest({ cors: ALLOWED_ORIGINS, timeoutSeconds: 60, memory: '256MiB' }, async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Este endpoint solo acepta peticiones POST.' },
      });
      return;
    }

    try {
      const identity = await extractIdentity(req);
      const body = (req.body ?? {}) as WithRequestId<TBody>;
      const requestId =
        typeof body?.requestId === 'string' && body.requestId.length > 0
          ? body.requestId.slice(0, 80)
          : undefined;

      // Idempotencia ligada a identity.id + requestId: evita doble consumo si hay reintentos de red
      const idempotencyKey = requestId ? `${identity.id}:${requestId}` : undefined;
      const cached = getCachedResponse(idempotencyKey);
      if (cached !== null) {
        res.status(200).json(cached);
        return;
      }

      const config = getConfig();
      const result = await run(config, identity, body);
      cacheResponse(idempotencyKey, result);
      res.status(200).json(result);
    } catch (error) {
      const { status, body } = serializeErrorBody(error);
      res.status(status).json(body);
    }
  });
}

export const identifyPlant = createEndpoint<IdentifyRequest>((config, identity, body) =>
  runIdentify(config, identity, body)
);

export const careSheet = createEndpoint<CareRequest>((config, identity, body) =>
  resolveCareSheet(config, identity, body)
);

export const healthAssessment = createEndpoint<HealthRequest>((config, identity, body) =>
  runHealthAssessment(config, identity, body)
);

export const assistantChat = createEndpoint<AssistantRequest>((config, identity, body) =>
  runAssistant(config, identity, body)
);
