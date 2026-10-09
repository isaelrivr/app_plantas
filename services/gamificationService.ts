/**
 * Plantae Gamification Service
 *
 * Rachas de riego, logros y resumen semanal. Calcula sobre un objeto de
 * estadísticas (el estado real vive en GardenContext y, en producción, en
 * Firestore). Sin dependencias externas.
 */

import { Ionicons } from '@expo/vector-icons';
import { t } from '../i18n';

export type AchievementMetric =
  | 'streak'
  | 'plants'
  | 'waterings'
  | 'identifications'
  | 'diagnoses'
  | 'tasks';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  metric: AchievementMetric;
  target: number;
  /** Recompensa emocional mostrada al desbloquear */
  reward: string;
}

export interface Achievement extends AchievementDefinition {
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GamificationStats {
  currentStreak: number;
  longestStreak: number;
  totalWaterings: number;
  totalPlants: number;
  totalIdentifications: number;
  totalDiagnoses: number;
  tasksCompleted: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-water',
    title: 'Primer Riego',
    description: 'Registra tu primer riego en Plantae.',
    icon: 'water',
    metric: 'waterings',
    target: 1,
    reward: 'Empieza tu camino verde',
  },
  {
    id: 'streak-3',
    title: 'Racha de 3 días',
    description: 'Mantén una racha de riego de 3 días seguidos.',
    icon: 'flame',
    metric: 'streak',
    target: 3,
    reward: 'Hábito en marcha',
  },
  {
    id: 'streak-7',
    title: 'Semana Perfecta',
    description: 'Racha de riego de 7 días seguidos.',
    icon: 'flame',
    metric: 'streak',
    target: 7,
    reward: 'Maestro del hábito',
  },
  {
    id: 'streak-30',
    title: 'Mes Impecable',
    description: 'Racha de riego de 30 días seguidos.',
    icon: 'trophy',
    metric: 'streak',
    target: 30,
    reward: 'Jardín de élite',
  },
  {
    id: 'collector-5',
    title: 'Coleccionista',
    description: 'Reúne 5 plantas en Mi Jardín.',
    icon: 'albums',
    metric: 'plants',
    target: 5,
    reward: 'Botánico aficionado',
  },
  {
    id: 'collector-10',
    title: 'Invernadero',
    description: 'Reúne 10 plantas en Mi Jardín.',
    icon: 'home',
    metric: 'plants',
    target: 10,
    reward: 'Curador de interiores',
  },
  {
    id: 'spotter-3',
    title: 'Ojo Botánico',
    description: 'Identifica 3 plantas con el escáner.',
    icon: 'search',
    metric: 'identifications',
    target: 3,
    reward: 'Explorador de especies',
  },
  {
    id: 'doctor-3',
    title: 'Doctor de Plantas',
    description: 'Realiza 3 diagnósticos de salud.',
    icon: 'medkit',
    metric: 'diagnoses',
    target: 3,
    reward: 'Guardián del follaje',
  },
  {
    id: 'taskmaster-10',
    title: 'Manos a la Obra',
    description: 'Completa 10 tareas del calendario.',
    icon: 'checkmark-done',
    metric: 'tasks',
    target: 10,
    reward: 'Cuidado impecable',
  },
];

const metricValue = (stats: GamificationStats, metric: AchievementMetric): number => {
  switch (metric) {
    case 'streak':
      return stats.longestStreak;
    case 'plants':
      return stats.totalPlants;
    case 'waterings':
      return stats.totalWaterings;
    case 'identifications':
      return stats.totalIdentifications;
    case 'diagnoses':
      return stats.totalDiagnoses;
    case 'tasks':
      return stats.tasksCompleted;
    default:
      return 0;
  }
};

export function getAchievements(stats: GamificationStats): Achievement[] {
  return ACHIEVEMENTS.map((def) => {
    const progress = Math.min(def.target, metricValue(stats, def.metric));
    return {
      ...def,
      title: t(def.title),
      description: t(def.description),
      reward: t(def.reward),
      progress,
      unlocked: progress >= def.target,
    };
  });
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  waterings: number;
  tasksCompleted: number;
  newPlants: number;
  bestStreak: number;
  grade: 'S' | 'A' | 'B' | 'C';
  title: string;
  message: string;
}

/**
 * Resumen semanal determinista a partir de las estadísticas.
 * En producción calcularía sobre los eventos reales de los últimos 7 días.
 */
export function getWeeklySummary(stats: GamificationStats): WeeklySummary {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);

  const waterings = Math.max(stats.totalWaterings, stats.currentStreak);
  const score = stats.currentStreak * 2 + waterings + stats.tasksCompleted;

  let grade: WeeklySummary['grade'] = 'C';
  let title = t('¡Buen comienzo!');
  let message = t('Sigue registrando riegos y tareas para subir tu calificación semanal.');

  if (score >= 24) {
    grade = 'S';
    title = t('¡Semana de leyenda! 🏆');
    message = t('Cuidado impecable. Tus plantas te lo agradecen con brotes nuevos.');
  } else if (score >= 14) {
    grade = 'A';
    title = t('¡Excelente semana! 🌟');
    message = t('Constancia sobresaliente. Mantén el ritmo para conservar tu racha.');
  } else if (score >= 6) {
    grade = 'B';
    title = t('¡Buen trabajo! 🌿');
    message = t('Vas por buen camino. Un par de riegos más y subes a la A.');
  }

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: now.toISOString(),
    waterings,
    tasksCompleted: stats.tasksCompleted,
    newPlants: 0,
    bestStreak: stats.longestStreak,
    grade,
    title,
    message,
  };
}

export const streakTier = (streak: number): { label: string; color: string } => {
  if (streak >= 30) return { label: t('Élite'), color: '#FF6F00' };
  if (streak >= 14) return { label: t('Experto'), color: '#EF6C00' };
  if (streak >= 7) return { label: t('Constante'), color: '#F9A825' };
  if (streak >= 3) return { label: t('En racha'), color: '#FBC02D' };
  return { label: t('Iniciando'), color: '#8E8E93' };
};
