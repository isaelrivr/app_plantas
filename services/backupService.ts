/**
 * EcoScan Backup & Account Deletion Service
 *
 * Provee exportación e importación de copias de seguridad locales en formato JSON
 * con validación de esquema, más el procedimiento de borrado de cuenta y datos remotos
 * exigido por App Store y Google Play Store.
 */

import { Share } from 'react-native';
import {
  STORAGE_KEYS,
  STORAGE_SCHEMA_VERSION,
  loadJSON,
  saveJSON,
  clearAllAppData,
  validateGardenData,
  validateAchievementsData,
  validateSettingsData,
  isRecord,
} from './storage';
import { clearGrowthDiary } from './growthDiaryService';
import { clearPersistedImages } from './mediaService';

export interface BackupPayload {
  app: 'EcoScan';
  schemaVersion: number;
  exportedAt: string;
  garden: {
    plants: any[];
    stats?: any;
    history?: any[];
  };
  achievements?: Record<string, string>;
  growthDiary?: any[];
  settings?: any;
}

export interface ImportBackupResult {
  success: boolean;
  totalPlants: number;
  message: string;
}

/**
 * Genera el paquete completo de respaldo del usuario y lo comparte mediante la hoja nativa.
 */
export async function exportFullBackup(): Promise<boolean> {
  try {
    const gardenData = await loadJSON(STORAGE_KEYS.garden, { plants: [] });
    const achievementsData = await loadJSON(STORAGE_KEYS.achievements, {});
    const diaryData = await loadJSON(STORAGE_KEYS.growthDiary, []);
    const settingsData = await loadJSON(STORAGE_KEYS.settings, {});

    const payload: BackupPayload = {
      app: 'EcoScan',
      schemaVersion: STORAGE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      garden: gardenData,
      achievements: achievementsData,
      growthDiary: diaryData,
      settings: settingsData,
    };

    const formattedJson = JSON.stringify(payload, null, 2);

    await Share.share({
      title: 'Copia de seguridad - EcoScan',
      message: formattedJson,
    });

    return true;
  } catch (error) {
    console.warn('[backupService] Error al exportar copia de seguridad:', error);
    return false;
  }
}

/**
 * Valida y restaura una copia de seguridad a partir de un texto JSON.
 */
export async function importBackupFromJSON(jsonString: string): Promise<ImportBackupResult> {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, totalPlants: 0, message: 'El archivo está vacío o no es válido.' };
    }

    const parsed: unknown = JSON.parse(jsonString);

    if (!isRecord(parsed)) {
      return { success: false, totalPlants: 0, message: 'Estructura de respaldo inválida.' };
    }

    // 1. Extraer los datos del jardín
    const rawGarden = isRecord(parsed.garden) ? parsed.garden : parsed;
    if (!validateGardenData(rawGarden)) {
      return {
        success: false,
        totalPlants: 0,
        message: 'Los datos del jardín no cumplen el formato requerido o están dañados.',
      };
    }

    // 2. Guardar datos validados
    await saveJSON(STORAGE_KEYS.garden, rawGarden);

    // 3. Restaurar logros si están presentes y válidos
    if (parsed.achievements && validateAchievementsData(parsed.achievements)) {
      await saveJSON(STORAGE_KEYS.achievements, parsed.achievements);
    }

    // 4. Restaurar diario si está presente y es array
    if (Array.isArray(parsed.growthDiary)) {
      await saveJSON(STORAGE_KEYS.growthDiary, parsed.growthDiary);
    }

    // 5. Restaurar ajustes si están presentes
    if (parsed.settings && validateSettingsData(parsed.settings)) {
      await saveJSON(STORAGE_KEYS.settings, parsed.settings);
    }

    const plantCount = Array.isArray(rawGarden.plants) ? rawGarden.plants.length : 0;

    return {
      success: true,
      totalPlants: plantCount,
      message: `Copia restaurada con éxito: ${plantCount} plantas recuperadas.`,
    };
  } catch (error) {
    console.warn('[backupService] Error al importar copia de seguridad:', error);
    return {
      success: false,
      totalPlants: 0,
      message: 'No se pudo leer el archivo JSON. Verifica que el formato sea correcto.',
    };
  }
}

/**
 * Procedimiento integral de eliminación de cuenta y purga de datos.
 * Cumple con Apple App Store Review Guideline 5.1.1(v) y Google Play Data Safety.
 */
export async function performFullAccountDeletion(userId?: string | null): Promise<boolean> {
  try {
    // 1. Si hubiera sesión remota en Firebase Auth / Firestore, se elimina el árbol del usuario
    if (userId) {
      try {
        const { deleteRemoteUserData } = await import('./syncService');
        await deleteRemoteUserData(userId);
      } catch (remoteError) {
        console.warn('[backupService] Advertencia al eliminar datos remotos:', remoteError);
      }
    }

    try {
      const { deleteUserAccount } = await import('./authService');
      await deleteUserAccount();
    } catch {}

    // 2. Purga total local: fotos físicas del sistema de archivos
    await clearPersistedImages();

    // 3. Purga del diario de crecimiento
    clearGrowthDiary();

    // 4. Purga completa de todas las claves locales de EcoScan en AsyncStorage
    await clearAllAppData();

    return true;
  } catch (error) {
    console.warn('[backupService] Error durante el proceso de eliminación de cuenta:', error);
    return false;
  }
}
