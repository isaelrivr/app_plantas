import { usePremium } from '../context/PremiumContext';
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
export const LOCKED_FEATURES: PremiumFeature[] = [
  'animatedMap',
  'pestDiagnosis',
  'personalizedClimate',
];

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
  const { isPremium } = usePremium();
  const { plants, stats } = useGarden();

  const identificationsToday = stats.identificationsToday;
  const identificationsRemaining = isPremium
    ? Number.POSITIVE_INFINITY
    : Math.max(0, FREE_IDENTIFICATION_LIMIT - identificationsToday);
  const plantsRemaining = isPremium
    ? Number.POSITIVE_INFINITY
    : Math.max(0, FREE_PLANT_LIMIT - plants.length);

  return {
    isPremium,
    identificationLimit: FREE_IDENTIFICATION_LIMIT,
    identificationsToday,
    identificationsRemaining,
    canIdentify: isPremium || identificationsToday < FREE_IDENTIFICATION_LIMIT,
    plantLimit: FREE_PLANT_LIMIT,
    plantsCount: plants.length,
    plantsRemaining,
    canAddPlant: isPremium || plants.length < FREE_PLANT_LIMIT,
    isFeatureLocked: (feature: PremiumFeature) => !isPremium && LOCKED_FEATURES.includes(feature),
  };
}
