/**
 * Identidad de la petición.
 *
 * - Fase 2: el cliente envía `X-Device-Id` (UUID persistido en AsyncStorage).
 *   El servidor lo hashea con SHA-256 y lo usa como clave de cuota diaria.
 * - Preparado para Fase 4+: si llega `Authorization: Bearer <token>`, se
 *   verifica con Firebase Admin y se lee `users/{uid}.premium.active`.
 */

import * as crypto from 'node:crypto';
import type { Request } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { unauthorized } from './errors';

export interface Identity {
  kind: 'user' | 'device';
  /** uid (usuario) o hash truncado del deviceId. */
  id: string;
  isPremium: boolean;
}

const DEVICE_HEADER = 'x-device-id';
const AUTH_HEADER = 'authorization';
const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const sha256 = (input: string): string => crypto.createHash('sha256').update(input).digest('hex');

export async function extractIdentity(req: Request): Promise<Identity> {
  // 1) Identidad de usuario (token de Firebase). Gana sobre el deviceId.
  const authHeader = req.headers[AUTH_HEADER];
  if (typeof authHeader === 'string' && authHeader.trim().startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) throw unauthorized('Token de autenticación vacío.');

    // Tokens de prueba para el emulador local (solo emulación).
    if (process.env.FUNCTIONS_EMULATOR === 'true' && (token === 'test-premium' || token === 'test-free')) {
      return { kind: 'user', id: `test-${token}`, isPremium: token === 'test-premium' };
    }

    const decoded = await getAuth()
      .verifyIdToken(token)
      .catch(() => null);
    if (!decoded?.uid) throw unauthorized('Token de autenticación inválido o expirado.');

    let isPremium = false;
    try {
      const doc = await getFirestore().collection('users').doc(decoded.uid).get();
      isPremium = doc.exists && doc.data()?.premium?.active === true;
    } catch {
      // Sin Firestore accesible se asume Free; no se rompe el flujo.
    }
    return { kind: 'user', id: decoded.uid, isPremium };
  }

  // 2) Identidad por dispositivo persistente.
  const deviceId = req.headers[DEVICE_HEADER];
  if (typeof deviceId === 'string' && DEVICE_ID_PATTERN.test(deviceId.trim())) {
    return { kind: 'device', id: `dev_${sha256(deviceId.trim()).slice(0, 32)}`, isPremium: false };
  }

  throw unauthorized(
    'Falta el encabezado X-Device-Id (o un token de usuario válido). Envía el identificador persistente del dispositivo con cada petición.'
  );
}