/**
 * Plantae Storage Service
 *
 * Capa fina y tipada sobre AsyncStorage. Es el único punto por el que la app
 * lee/escribe datos locales, de modo que:
 *  - Todas las claves comparten prefijo (`plantae:`) y se pueden borrar en bloque.
 *  - Los fallos de lectura/escritura nunca tumban la UI (se degrada a memoria).
 *  - Existe una versión de esquema con migraciones para no romper datos antiguos.
 *
 * NOTA: AsyncStorage es para datos no sensibles (jardín, ajustes, caché). Los
 * tokens de sesión/billing deben ir en expo-secure-store (Fase 4).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Versión actual del formato persistido. Súbela al cambiar la forma de los datos. */
export const STORAGE_SCHEMA_VERSION = 1;

const KEY_PREFIX = 'plantae:';

export const STORAGE_KEYS = {
  schemaVersion: `${KEY_PREFIX}schema-version`,
  garden: `${KEY_PREFIX}garden`,
  settings: `${KEY_PREFIX}settings`,
  premium: `${KEY_PREFIX}premium`,
  growthDiary: `${KEY_PREFIX}growth-diary`,
  /** UUID persistente que identifica el dispositivo ante el backend (Fase 2). */
  deviceId: `${KEY_PREFIX}device-id`,
  /** Caché local de fichas de cuidados generadas por el backend (Fase 2). */
  careCache: `${KEY_PREFIX}care-cache`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Lee y deserializa un valor. Devuelve `fallback` si la clave no existe o el
 * JSON está corrupto (nunca lanza).
 */
export async function loadJSON<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] No se pudo leer "${key}". Se usará el valor por defecto.`, error);
    return fallback;
  }
}

/** Serializa y guarda un valor. Nunca lanza. */
export async function saveJSON<T>(key: StorageKey, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] No se pudo guardar "${key}".`, error);
  }
}

/** Elimina una clave concreta. */
export async function removeKey(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] No se pudo borrar "${key}".`, error);
  }
}

/**
 * Elimina TODOS los datos persistidos por Plantae (incluso de versiones
 * antiguas). No toca datos de otras apps ni de librerías.
 */
export async function clearAllAppData(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter((key) => key.startsWith(KEY_PREFIX));
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
    }
  } catch (error) {
    console.warn('[storage] No se pudieron borrar los datos locales.', error);
  }
}

/**
 * Aplica migraciones de esquema. Cada migración transforma datos de la versión
 * N a la N+1. Con la primera versión persistida no hay nada que migrar, pero el
 * marco queda listo para el futuro.
 */
export async function runStorageMigrations(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.schemaVersion);
    const currentVersion = raw ? Number(raw) : 0;

    if (!Number.isFinite(currentVersion) || currentVersion >= STORAGE_SCHEMA_VERSION) {
      return;
    }

    // v0 -> v1: primer esquema persistido. Sin transformaciones.
    // if (currentVersion < 1) { ...migrar... }

    await AsyncStorage.setItem(STORAGE_KEYS.schemaVersion, String(STORAGE_SCHEMA_VERSION));
  } catch (error) {
    console.warn('[storage] No se pudieron aplicar las migraciones.', error);
  }
}
