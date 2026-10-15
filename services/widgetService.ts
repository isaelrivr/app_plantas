/**
 * EcoScan Home Screen Widget Service
 *
 * Gestiona el estado y los datos compartidos para los widgets de pantalla de inicio
 * de Android e iOS (AppWidget / WidgetKit):
 * - Calcula qué planta toca regar hoy.
 * - Cuenta las tareas de cuidado pendientes.
 * - Proporciona deep links directos (`ecoscan://hoy` o `ecoscan://planta/:plantId`).
 * - Mantiene sincronizado el almacenamiento persistente para extensiones nativas.
 */

import { loadJSON, saveJSON, STORAGE_KEYS } from './storage.ts';
import type { GardenPlant } from '../context/GardenContext.ts';

export interface WidgetCareSnapshot {
  headline: string;
  subtext: string;
  pendingCount: number;
  totalPlants: number;
  nextPlantName: string | null;
  nextPlantId: string | null;
  nextPlantImage?: string | null;
  deepLinkUrl: string;
  lastUpdated: string;
  isAllCompleted: boolean;
}

export const DEFAULT_WIDGET_SNAPSHOT: WidgetCareSnapshot = {
  headline: 'Escanea tu primera planta',
  subtext: 'Comienza a organizar tu jardín',
  pendingCount: 0,
  totalPlants: 0,
  nextPlantName: null,
  nextPlantId: null,
  deepLinkUrl: 'ecoscan://hoy',
  lastUpdated: new Date().toISOString(),
  isAllCompleted: true,
};

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}|{${k}}`, 'g'), String(v)),
    template
  );
}

/**
 * Calcula la vista de datos optimizada para el widget de pantalla de inicio
 * a partir de la lista de plantas activas en el jardín.
 */
export function calculateWidgetSnapshot(plants: GardenPlant[]): WidgetCareSnapshot {
  const now = new Date().toISOString();
  if (!plants || plants.length === 0) {
    return {
      ...DEFAULT_WIDGET_SNAPSHOT,
      headline: 'Escanea tu primera planta',
      subtext: 'Comienza a organizar tu jardín',
      deepLinkUrl: 'ecoscan://hoy',
      lastUpdated: now,
    };
  }

  const pendingPlants = plants.filter(p => !p.isWateredToday);
  const pendingCount = pendingPlants.length;

  if (pendingCount > 0) {
    const nextPlant = pendingPlants[0];
    const plantDisplayName = nextPlant.nickname || nextPlant.name;
    const headline = pendingCount === 1
      ? formatMessage('Hoy toca regar: {{name}}', { name: plantDisplayName })
      : formatMessage('{{count}} plantas necesitan agua hoy', { count: pendingCount });
    const subtext = pendingCount === 1
      ? 'Toca para marcar como regada'
      : formatMessage('Siguiente: {{name}}', { name: plantDisplayName });

    return {
      headline,
      subtext,
      pendingCount,
      totalPlants: plants.length,
      nextPlantName: plantDisplayName,
      nextPlantId: nextPlant.id,
      nextPlantImage: nextPlant.imageUri || null,
      deepLinkUrl: `ecoscan://planta/${nextPlant.id}`,
      lastUpdated: now,
      isAllCompleted: false,
    };
  }

  // Si todas están regadas
  return {
    headline: '¡Todo al día en tu jardín!',
    subtext: 'Todas tus plantas están regadas y saludables',
    pendingCount: 0,
    totalPlants: plants.length,
    nextPlantName: null,
    nextPlantId: null,
    deepLinkUrl: 'ecoscan://hoy',
    lastUpdated: now,
    isAllCompleted: true,
  };
}

/**
 * Actualiza y persiste el snapshot para el widget en almacenamiento local/compartido.
 */
export async function updateWidgetData(plants: GardenPlant[]): Promise<WidgetCareSnapshot> {
  const snapshot = calculateWidgetSnapshot(plants);
  await saveJSON(STORAGE_KEYS.widgetSnapshot, snapshot);
  return snapshot;
}

/**
 * Recupera el último snapshot guardado para el widget.
 */
export async function getSavedWidgetData(): Promise<WidgetCareSnapshot> {
  return loadJSON<WidgetCareSnapshot>(STORAGE_KEYS.widgetSnapshot, DEFAULT_WIDGET_SNAPSHOT);
}
