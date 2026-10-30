/**
 * Identidad de la petición en arquitectura Local-First.
 *
 * El cliente envía `X-Device-Id` (UUID persistido en AsyncStorage por `services/deviceId.ts`).
 * El servidor proxy lo hashea con SHA-256 y lo usa como clave anónima para cuota diaria e idempotencia.
 * No se manejan datos personales ni tokens de Firebase.
 */

import * as crypto from 'node:crypto';
import type { Request } from 'firebase-functions/v2/https';
import { unauthorized } from './errors';

export interface Identity {
  kind: 'device';
  /** Hash truncado del deviceId. */
  id: string;
  isPremium: boolean;
}

const DEVICE_HEADER = 'x-device-id';
const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const sha256 = (input: string): string => crypto.createHash('sha256').update(input).digest('hex');

export async function extractIdentity(req: Request): Promise<Identity> {
  // Identidad anónima por dispositivo persistente
  const deviceId = req.headers[DEVICE_HEADER];
  if (typeof deviceId === 'string' && DEVICE_ID_PATTERN.test(deviceId.trim())) {
    return {
      kind: 'device',
      id: `dev_${sha256(deviceId.trim()).slice(0, 32)}`,
      isPremium: false, // El estado Premium se gestiona en cliente vía RevenueCat
    };
  }

  // Header de pruebas en desarrollo local / test suites
  if (process.env.NODE_ENV !== 'production') {
    const testHeader = req.headers['x-test-device'];
    if (typeof testHeader === 'string' && testHeader.length > 0) {
      return {
        kind: 'device',
        id: `dev_test_${sha256(testHeader).slice(0, 16)}`,
        isPremium: testHeader.includes('premium'),
      };
    }
  }

  throw unauthorized(
    'Falta el encabezado X-Device-Id válido. Envía el identificador persistente del dispositivo con cada petición.'
  );
}
