/**
 * Punto de entrada de las Cloud Functions HTTP de Plantae.
 *
 * Todas las funciones son `onRequest` (v2) en `us-central1`:
 *   - POST /identifyPlant      → identificación con Plant.id
 *   - POST /careSheet          → ficha de cuidados con Gemini (caché Firestore)
 *   - POST /healthAssessment   → diagnóstico de salud con Plant.id + Gemini
 *
 * Ninguna clave de API vive en el cliente: el móvil solo conoce la URL base.
 * La identidad llega por `X-Device-Id` (Fase 2) o `Authorization: Bearer` (Fase 4+).
 */

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin';

import { getConfig, type AppConfig } from './config';
import { extractIdentity, type Identity } from './guard';
import { serializeErrorBody } from './errors';
import { getCachedResponse, cacheResponse } from './idempotency';
import { runIdentify } from './identify';
import { resolveCareSheet } from './care';
import { runHealthAssessment } from './health';
import { runAssistant } from './assistant';
import type { AssistantRequest, CareRequest, HealthRequest, IdentifyRequest } from './types';

initializeApp();

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

/** Cuerpo mínimo con id de idempotencia opcional. */
type WithRequestId<T> = T & { requestId?: string };

function createEndpoint<TBody>(
  run: (config: AppConfig, identity: Identity, body: TBody) => Promise<unknown>
) {
  return onRequest({ cors: true, timeoutSeconds: 60, memory: '256MiB' }, async (req, res) => {
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

      // Si el cliente reintenta la misma petición, no gastamos cuota ni volvemos
      // a llamar a los proveedores: devolvemos el resultado ya calculado.
      const cached = getCachedResponse(requestId);
      if (cached !== null) {
        res.status(200).json(cached);
        return;
      }

      const config = getConfig();
      const result = await run(config, identity, body);
      cacheResponse(requestId, result);
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
