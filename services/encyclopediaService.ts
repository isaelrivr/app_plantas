/**
 * Plantae Encyclopedia Service
 *
 * Búsqueda y filtrado del catálogo botánico con criterios de luz, dificultad,
 * seguridad para mascotas e interior/exterior. El catálogo es 100% local
 * (funciona sin conexión). Para "modo sin conexión" la pantalla usa
 * `getPlantsByIds` sobre las especies guardadas en Mi Jardín, que quedan
 * disponibles incluso sin red.
 */

import {
  PlantIdentificationResult,
  BOTANICAL_KNOWLEDGE_BASE,
  getPlantById,
} from './plantApi';
import { isPetSafe } from './toxicityService';

export type LightFilter = 'all' | 'low' | 'medium' | 'bright';
export type DifficultyFilter = 'all' | 'Fácil' | 'Moderado' | 'Avanzado';
export type EnvironmentFilter = 'all' | 'interior' | 'exterior';
export type PetsFilter = 'all' | 'petSafe';

export interface EncyclopediaFilters {
  query: string;
  light: LightFilter;
  difficulty: DifficultyFilter;
  environment: EnvironmentFilter;
  pets: PetsFilter;
}

export const DEFAULT_FILTERS: EncyclopediaFilters = {
  query: '',
  light: 'all',
  difficulty: 'all',
  environment: 'all',
  pets: 'all',
};

/**
 * Entorno recomendado por especie. interior = vive bien en casa;
 * exterior = requiere sol/aire abierto; both = ambas.
 */
const ENVIRONMENT_BY_SPECIES: Record<string, 'interior' | 'exterior' | 'both'> = {
  monstera: 'interior',
  pothos: 'interior',
  'aloe-vera': 'both',
  lavanda: 'exterior',
  succulent: 'both',
  'helecho-boston': 'interior',
  orchid: 'interior',
  'ficus-lyrata': 'interior',
  sansevieria: 'interior',
  calathea: 'interior',
  espatifilo: 'interior',
  romero: 'exterior',
};

export function getEnvironment(speciesId: string): 'interior' | 'exterior' | 'both' {
  return ENVIRONMENT_BY_SPECIES[speciesId] ?? 'interior';
}

export const lightFilters: { key: LightFilter; label: string }[] = [
  { key: 'all', label: 'Toda luz' },
  { key: 'low', label: 'Poca luz' },
  { key: 'medium', label: 'Luz media' },
  { key: 'bright', label: 'Luz intensa' },
];

export const difficultyFilters: { key: DifficultyFilter; label: string }[] = [
  { key: 'all', label: 'Toda dificultad' },
  { key: 'Fácil', label: 'Fácil' },
  { key: 'Moderado', label: 'Moderado' },
  { key: 'Avanzado', label: 'Avanzado' },
];

export const environmentFilters: { key: EnvironmentFilter; label: string }[] = [
  { key: 'all', label: 'Interior y exterior' },
  { key: 'interior', label: 'Interior' },
  { key: 'exterior', label: 'Exterior' },
];

const matchesLight = (plant: PlantIdentificationResult, light: LightFilter): boolean => {
  if (light === 'all') return true;
  const level = plant.careLevels.lightLevel;
  if (light === 'low') return level <= 2;
  if (light === 'medium') return level === 3;
  return level >= 4; // bright
};

const matchesEnvironment = (
  plant: PlantIdentificationResult,
  env: EnvironmentFilter
): boolean => {
  if (env === 'all') return true;
  const value = getEnvironment(plant.id);
  return value === env || value === 'both';
};

export function searchEncyclopedia(filters: EncyclopediaFilters): PlantIdentificationResult[] {
  const q = filters.query.toLowerCase().trim();
  return BOTANICAL_KNOWLEDGE_BASE.filter((plant) => {
    if (q) {
      const haystack = `${plant.name} ${plant.scientificName} ${plant.family}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.difficulty !== 'all' && plant.difficulty !== filters.difficulty) return false;
    if (!matchesLight(plant, filters.light)) return false;
    if (!matchesEnvironment(plant, filters.environment)) return false;
    if (filters.pets === 'petSafe' && !isPetSafe(plant.id)) return false;
    return true;
  });
}

/** Plantas guardadas disponibles sin conexión (offline). */
export function getPlantsByIds(ids: string[]): PlantIdentificationResult[] {
  return ids
    .map((id) => getPlantById(id))
    .filter((p): p is PlantIdentificationResult => Boolean(p));
}

export function countActiveFilters(filters: EncyclopediaFilters): number {
  let count = 0;
  if (filters.light !== 'all') count++;
  if (filters.difficulty !== 'all') count++;
  if (filters.environment !== 'all') count++;
  if (filters.pets !== 'all') count++;
  return count;
}
