/**
 * Plantae Growth Diary Service
 *
 * Línea de tiempo de crecimiento por planta con fotos, medidas y comparador
 * antes/después. Persiste en AsyncStorage (caché local, offline-first).
 *
 * En Fase 4, cada entrada se sincronizará con Firestore
 * (users/{uid}/plants/{plantId}/growth/{entryId}) y las fotos con Firebase
 * Storage; AsyncStorage queda como caché.
 */

import { loadJSON, saveJSON, STORAGE_KEYS } from './storage';

export interface GrowthEntry {
  id: string;
  plantId: string;
  /** ISO date */
  date: string;
  photoUri: string;
  heightCm?: number;
  leafCount?: number;
  healthScore?: number;
  note: string;
}

export interface GrowthComparison {
  before: GrowthEntry | null;
  after: GrowthEntry | null;
  heightDeltaCm: number | null;
  leafDelta: number | null;
  daysBetween: number | null;
}

const PHOTOS = [
  'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
];

const NOTES = [
  'Primer registro al momento de la compra.',
  'Apareció una hoja nueva bien formada.',
  'Trasplante a maceta un poco más grande.',
  'Crecimiento visible tras el abono líquido.',
  'Aclimatada al nuevo rincón con más luz.',
  'Riego ajustado al clima seco de la semana.',
];

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

/**
 * Genera una línea de tiempo determinista SOLO para desarrollo (`__DEV__`).
 * Nunca se persiste ni se usa en producción, para no mostrar datos falsos.
 */
function generateDevTimeline(plantId: string): GrowthEntry[] {
  const seed = Array.from(plantId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const count = 4 + (seed % 3);
  const entries: GrowthEntry[] = [];
  let height = 12 + (seed % 9);
  let leaves = 4 + (seed % 4);

  for (let i = 0; i < count; i++) {
    const ageDays = Math.round((count - 1 - i) * (7 + (seed % 5)));
    height += 3 + ((seed + i) % 4);
    leaves += 1 + ((seed + i) % 2);

    entries.push({
      id: `${plantId}-dev-${i}`,
      plantId,
      date: daysAgo(ageDays),
      photoUri: PHOTOS[(seed + i) % PHOTOS.length],
      heightCm: height,
      leafCount: leaves,
      healthScore: Math.min(100, 78 + i * 4 + (seed % 5)),
      note: NOTES[i % NOTES.length],
    });
  }
  return entries;
}

const store = new Map<string, GrowthEntry[]>();
let hydrated = false;
let hydrationPromise: Promise<void> | null = null;

function flatten(): GrowthEntry[] {
  const all: GrowthEntry[] = [];
  store.forEach((entries) => all.push(...entries));
  return all;
}

function persist(): void {
  // Fire-and-forget: la UI no debe esperar a disco.
  void saveJSON(STORAGE_KEYS.growthDiary, flatten());
}

/** Carga el diario desde disco una sola vez. Idempotente y seguro de llamar varias veces. */
export function hydrateGrowthDiary(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    const entries = await loadJSON<GrowthEntry[]>(STORAGE_KEYS.growthDiary, []);
    store.clear();
    for (const entry of entries) {
      const current = store.get(entry.plantId) ?? [];
      current.push(entry);
      store.set(entry.plantId, current);
    }
    hydrated = true;
  })();

  return hydrationPromise;
}

export function isGrowthDiaryHydrated(): boolean {
  return hydrated;
}

/** Más reciente primero para la línea de tiempo. */
export function getGrowthEntries(plantId: string): GrowthEntry[] {
  const entries = store.get(plantId);
  if (!entries || entries.length === 0) {
    // Solo en desarrollo mostramos una línea de tiempo de ejemplo (no persistida).
    if (__DEV__) return generateDevTimeline(plantId);
    return [];
  }
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addGrowthEntry(
  plantId: string,
  entry: Omit<GrowthEntry, 'id' | 'plantId'>
): GrowthEntry {
  const current = store.get(plantId) ?? [];
  const created: GrowthEntry = {
    ...entry,
    id: `${plantId}-entry-${Date.now()}`,
    plantId,
  };
  store.set(plantId, [...current, created]);
  persist();
  return created;
}

export function deleteGrowthEntry(plantId: string, entryId: string): void {
  const current = store.get(plantId) ?? [];
  const next = current.filter((entry) => entry.id !== entryId);
  if (next.length === 0) {
    store.delete(plantId);
  } else {
    store.set(plantId, next);
  }
  persist();
}

/** Borra el diario en memoria y en disco (usado por "Eliminar datos"). */
export function clearGrowthDiary(): void {
  store.clear();
  persist();
}

export function getGrowthComparison(plantId: string): GrowthComparison {
  const chronological = [...getGrowthEntries(plantId)].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (chronological.length === 0) {
    return { before: null, after: null, heightDeltaCm: null, leafDelta: null, daysBetween: null };
  }
  const before = chronological[0];
  const after = chronological[chronological.length - 1];
  const daysBetween = Math.max(
    0,
    Math.round((new Date(after.date).getTime() - new Date(before.date).getTime()) / 86400000)
  );
  return {
    before,
    after,
    heightDeltaCm:
      before.heightCm != null && after.heightCm != null ? after.heightCm - before.heightCm : null,
    leafDelta:
      before.leafCount != null && after.leafCount != null ? after.leafCount - before.leafCount : null,
    daysBetween,
  };
}

export function formatEntryDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}
