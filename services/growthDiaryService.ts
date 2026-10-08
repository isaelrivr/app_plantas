/**
 * Plantae Growth Diary Service (MOCK)
 *
 * Línea de tiempo de crecimiento por planta con fotos, medidas y comparador
 * antes/después. Almacena en memoria (mock) y está listo para persistir en
 * Firestore (colección `growthEntries`) o en Firebase Storage las fotos.
 *
 * CONEXIÓN REAL:
 *  - Sube cada foto a Firebase Storage y guarda la downloadURL.
 *  - Guarda el documento en Firestore: users/{uid}/plants/{plantId}/growth/{entryId}.
 */

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
 * Genera (de forma determinista) la línea de tiempo mock de una planta.
 * El primer registro es el más antiguo y el último el más reciente.
 */
function generateTimeline(plantId: string): GrowthEntry[] {
  const seed = Array.from(plantId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const count = 4 + (seed % 3); // 4 a 6 entradas
  const entries: GrowthEntry[] = [];
  let height = 12 + (seed % 9);
  let leaves = 4 + (seed % 4);

  for (let i = 0; i < count; i++) {
    const ageDays = Math.round((count - 1 - i) * (7 + (seed % 5)));
    height += 3 + ((seed + i) % 4);
    leaves += 1 + ((seed + i) % 2);

    entries.push({
      id: `${plantId}-entry-${i}`,
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

export function getGrowthEntries(plantId: string): GrowthEntry[] {
  if (!store.has(plantId)) {
    store.set(plantId, generateTimeline(plantId));
  }
  // Más reciente primero para la línea de tiempo
  return [...store.get(plantId)!].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function addGrowthEntry(
  plantId: string,
  entry: Omit<GrowthEntry, 'id' | 'plantId'>
): GrowthEntry {
  const current = store.get(plantId) ?? generateTimeline(plantId);
  const created: GrowthEntry = {
    ...entry,
    id: `${plantId}-entry-${Date.now()}`,
    plantId,
  };
  const next = [...current, created];
  store.set(plantId, next);
  return created;
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
