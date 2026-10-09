/**
 * Plantae Device Identity
 *
 * Hasta la Fase 4 (Firebase Auth) identificamos al usuario por un UUID anónimo
 * persistido en AsyncStorage. El backend lo hashea con SHA-256 y lo usa como
 * clave de cuota diaria. No es sensible: no contiene datos personales.
 */

import * as Crypto from 'expo-crypto';
import { loadJSON, saveJSON, STORAGE_KEYS } from './storage';

let cached: string | null = null;
let pending: Promise<string> | null = null;

const UUID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Devuelve el identificador persistente del dispositivo, creándolo la primera
 * vez. Es seguro llamarlo en paralelo: comparte la misma promesa en vuelo.
 */
export function getDeviceId(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;

  pending = (async () => {
    try {
      const stored = await loadJSON<string | null>(STORAGE_KEYS.deviceId, null);
      if (typeof stored === 'string' && UUID_PATTERN.test(stored)) {
        cached = stored;
        return stored;
      }
    } catch {
      // si falla la lectura, generamos uno nuevo
    }

    const generated = Crypto.randomUUID();
    cached = generated;
    await saveJSON(STORAGE_KEYS.deviceId, generated);
    return generated;
  })();

  return pending.finally(() => {
    pending = null;
  });
}
