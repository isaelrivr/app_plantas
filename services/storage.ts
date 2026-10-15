/**
 * EcoScan Storage Service
 *
 * Capa fina y tipada sobre AsyncStorage. Es el único punto por el que la app
 * lee/escribe datos locales, de modo que:
 *  - Todas las claves comparten prefijo (`plantae:`) y se pueden borrar en bloque.
 *  - Los fallos de lectura/escritura nunca tumban la UI (se degrada a memoria).
 *  - Existe una versión de esquema con migraciones y validación en tiempo de ejecución.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Versión actual del formato persistido. */
export const STORAGE_SCHEMA_VERSION = 3;

const KEY_PREFIX = 'plantae:';

export const STORAGE_KEYS = {
  schemaVersion: `${KEY_PREFIX}schema-version`,
  garden: `${KEY_PREFIX}garden`,
  settings: `${KEY_PREFIX}settings`,
  premium: `${KEY_PREFIX}premium`,
  growthDiary: `${KEY_PREFIX}growth-diary`,
  achievements: `${KEY_PREFIX}achievements`,
  manualCity: `${KEY_PREFIX}manual-city`,
  analyticsConsent: `${KEY_PREFIX}analytics-consent`,
  /** UUID persistente que identifica el dispositivo ante el backend. */
  deviceId: `${KEY_PREFIX}device-id`,
  /** Caché local de fichas de cuidados generadas por el backend. */
  careCache: `${KEY_PREFIX}care-cache`,
  weatherCache: `${KEY_PREFIX}weather-cache`,
  authSession: `${KEY_PREFIX}auth-session`,
  cloudSyncMeta: `${KEY_PREFIX}cloud-sync-meta`,
  widgetSnapshot: `${KEY_PREFIX}widget-snapshot`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ── Validadores de esquema en tiempo de ejecución ────────────────────────────

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateGardenData(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.plants)) return false;
  if (value.stats !== undefined && !isRecord(value.stats)) return false;
  return true;
}

export function validateSettingsData(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const validThemes = ['system', 'light', 'dark'];
  if (typeof value.themePreference === 'string' && !validThemes.includes(value.themePreference)) {
    return false;
  }
  const validLangs = ['es', 'en', 'pt', 'fr'];
  if (typeof value.language === 'string' && !validLangs.includes(value.language)) {
    return false;
  }
  if (value.hasPets !== undefined && typeof value.hasPets !== 'boolean') {
    return false;
  }
  if (value.easyMode !== undefined && typeof value.easyMode !== 'boolean') {
    return false;
  }
  if (value.analyticsConsent !== undefined && typeof value.analyticsConsent !== 'boolean') {
    return false;
  }
  return true;
}

export function validateAchievementsData(value: unknown): boolean {
  if (!isRecord(value)) return false;
  for (const key of Object.keys(value)) {
    const entry = value[key];
    if (typeof entry !== 'string' && (!isRecord(entry) || typeof entry.unlockedAt !== 'string')) {
      return false;
    }
  }
  return true;
}

const memoryFallbackMap = new Map<string, string>();

/**
 * Lee y deserializa un valor con validación de esquema opcional.
 * Devuelve `fallback` si la clave no existe, el JSON está corrupto o no supera la validación.
 */
export async function loadJSON<T>(
  key: StorageKey,
  fallback: T,
  validate?: (value: unknown) => boolean
): Promise<T> {
  try {
    let raw: string | null = null;
    if (typeof AsyncStorage?.getItem === 'function') {
      try {
        raw = await AsyncStorage.getItem(key);
      } catch {}
    }
    if (raw == null) {
      raw = memoryFallbackMap.get(key) ?? null;
    }
    if (raw == null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      console.warn(`[storage] Validación fallida para "${key}". Usando fallback.`);
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** Serializa y guarda un valor. Devuelve true si la escritura tuvo éxito. */
export async function saveJSON<T>(key: StorageKey, value: T): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    memoryFallbackMap.set(key, serialized);
    if (typeof AsyncStorage?.setItem === 'function') {
      try {
        await AsyncStorage.setItem(key, serialized);
      } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

/** Elimina una clave concreta. Devuelve true si la eliminación tuvo éxito. */
export async function removeKey(key: StorageKey): Promise<boolean> {
  try {
    memoryFallbackMap.delete(key);
    if (typeof AsyncStorage?.removeItem === 'function') {
      try {
        await AsyncStorage.removeItem(key);
      } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina TODOS los datos persistidos por EcoScan.
 */
export async function clearAllAppData(): Promise<boolean> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter((key) => key.startsWith(KEY_PREFIX));
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
    }
    return true;
  } catch (error) {
    console.warn('[storage] No se pudieron borrar los datos locales.', error);
    return false;
  }
}

/**
 * Aplica migraciones de esquema.
 */
export async function runStorageMigrations(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.schemaVersion);
    const currentVersion = raw ? Number(raw) : 0;

    if (!Number.isFinite(currentVersion) || currentVersion >= STORAGE_SCHEMA_VERSION) {
      return;
    }

    // v0 -> v1: primer esquema persistido.
    // v1 -> v2: se añade la caché de clima.
    // v2 -> v3: se añade persistencia de fecha para logros, consentimiento analítico y ciudad manual.

    await AsyncStorage.setItem(STORAGE_KEYS.schemaVersion, String(STORAGE_SCHEMA_VERSION));
  } catch (error) {
    console.warn('[storage] No se pudieron aplicar las migraciones.', error);
  }
}
