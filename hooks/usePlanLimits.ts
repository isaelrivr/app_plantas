import { useGarden } from '../context/GardenContext';

/**
 * Límites del plan Free y desbloqueo de funciones Premium.
 * Punto único de verdad para el gating — así las pantallas no replican reglas.
 */

export const FREE_IDENTIFICATION_LIMIT = 3; // identificaciones por día
export const FREE_PLANT_LIMIT = 5; // plantas en Mi Jardín

export type PremiumFeature =
  | 'animatedMap'
  | 'pestDiagnosis'
  | 'personalizedClimate'
  | 'growthDiary'
  | 'assistant';

/** Funciones que requieren Premium (según spec Free vs Premium). */
export const LOCKED_FEATURES: PremiumFeature[] = [];

export const FEATURE_LABELS: Record<PremiumFeature, { title: string; description: string; icon: string }> = {
  animatedMap: {
    title: 'Mapa de hábitat animado',
    description: 'Explora el origen natural de cada especie con un mapa interactivo.',
    icon: 'map',
  },
  pestDiagnosis: {
    title: 'Diagnóstico de plagas',
    description: 'Detecta plagas y enfermedades con la cámara y recibe un plan de tratamiento.',
    icon: 'bug',
  },
  personalizedClimate: {
    title: 'Clima personalizado',
    description: 'Ajustes de riego según el clima local de tu ciudad.',
    icon: 'partly-sunny',
  },
  growthDiary: {
    title: 'Diario de crecimiento',
    description: 'Registra el crecimiento de tus plantas con fotos y comparador.',
    icon: 'book',
  },
  assistant: {
    title: 'Asistente de plantas',
    description: 'Pregunta lo que necesites sobre el cuidado de tus plantas.',
    icon: 'chatbubbles',
  },
};

export interface PlanLimits {
  isPremium: boolean;
  identificationLimit: number;
  identificationsToday: number;
  identificationsRemaining: number;
  canIdentify: boolean;
  plantLimit: number;
  plantsCount: number;
  plantsRemaining: number;
  canAddPlant: boolean;
  isFeatureLocked: (feature: PremiumFeature) => boolean;
}

export function usePlanLimits(): PlanLimits {
  const { plants, stats } = useGarden();

  const identificationsToday = stats.identificationsToday;
  const identificationsRemaining = Number.POSITIVE_INFINITY;
  const plantsRemaining = Number.POSITIVE_INFINITY;

  return {
    isPremium: true,
    identificationLimit: FREE_IDENTIFICATION_LIMIT,
    identificationsToday,
    identificationsRemaining: Number.POSITIVE_INFINITY,
    canIdentify: true,
    plantLimit: FREE_PLANT_LIMIT,
    plantsCount: plants.length,
    plantsRemaining: Number.POSITIVE_INFINITY,
    canAddPlant: true,
    isFeatureLocked: (_feature: PremiumFeature) => false,
  };
}
