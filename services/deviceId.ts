/**
 * EcoScan Device Identity
 *
 * Hasta la Fase 4 (Firebase Auth) identificamos al usuario por un UUID anónimo
 * persistido en AsyncStorage. El backend lo hashea con SHA-256 y lo usa como
 * clave de cuota diaria. No es sensible: no contiene datos personales.
 */

import { loadJSON, saveJSON, STORAGE_KEYS } from './storage.ts';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

    const generated = generateUUID();
    cached = generated;
    await saveJSON(STORAGE_KEYS.deviceId, generated);
    return generated;
  })();

  return pending.finally(() => {
    pending = null;
  });
}
