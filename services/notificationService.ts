/**
 * Plantae Notification Service
 *
 * Notificaciones locales exclusivas para Expo Go utilizando expo-notifications.
 * No requiere servidores externos ni llaves Push; opera 100% en el dispositivo local.
 *
 * Frecuencias reales: el recordatorio se programa para el próximo vencimiento
 * calculado a partir del intervalo en días de cada planta/tarea.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { t } from '../i18n';

// Configurar cómo se presentan las notificaciones cuando la app está abierta en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DAY_MS = 24 * 60 * 60 * 1000;

// Próxima fecha a una hora hábil (09:00 local) sin caer en el pasado
const nextOccurrence = (daysFromNow: number, hour: number = 9): Date => {
  const date = new Date(Date.now() + Math.max(0, daysFromNow) * DAY_MS);
  date.setHours(hour, 0, 0, 0);
  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
};

/**
 * Solicita permisos locales de notificación
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('plantae_care_channel', {
        name: t('Recordatorios de Cuidado y Jardín'),
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E7D32',
      });
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Cancela una notificación programada por su identificador
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}

/**
 * Programa un recordatorio de riego periódico según el intervalo de la planta
 */
export async function scheduleWateringReminder(
  plantName: string,
  daysInterval: number
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const interval = Math.max(1, Math.round(daysInterval) || 1);
    const fireAt = nextOccurrence(interval, 9);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('💧 Hora de regar tu {plantName}', { plantName }),
        body: t('Tu planta necesita hidratación cada {interval} días. Revisa que el sustrato esté seco antes de regar.', {
          interval,
        }),
        sound: true,
        data: { type: 'watering', plantName, intervalDays: interval },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: 'plantae_care_channel',
      },
    });

    return identifier;
  } catch {
    return null;
  }
}

/**
 * Programa un recordatorio de tratamiento fitosanitario según la frecuencia indicada
 */
export async function scheduleTreatmentReminder(
  plantName: string,
  treatmentTitle: string,
  intervalDays: number
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const interval = Math.max(1, Math.round(intervalDays) || 3);
    const fireAt = nextOccurrence(1, 10);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('🧪 Aplicación de tratamiento: {plantName}', { plantName }),
        body: t(
          'Toca aplicar "{treatmentTitle}" a tu planta. Frecuencia recomendada: cada {interval} días. Usa guantes y mantén alejados a niños y mascotas.',
          { treatmentTitle, interval }
        ),
        sound: true,
        data: { type: 'treatment', plantName, treatmentTitle, intervalDays: interval },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: 'plantae_care_channel',
      },
    });

    return identifier;
  } catch {
    return null;
  }
}

/**
 * Programa un recordatorio genérico del plan de cuidados (riego, fertilizante,
 * poda o trasplante) para el próximo vencimiento de la tarea.
 */
export async function scheduleCareTaskReminder(
  plantName: string,
  taskType: 'riego' | 'fertilizante' | 'poda' | 'trasplante',
  taskTitle: string,
  daysFromNow: number
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const icons: Record<string, string> = {
      riego: '💧',
      fertilizante: '🌿',
      poda: '✂️',
      trasplante: '🪴',
    };

    const taskLabels: Record<typeof taskType, string> = {
      riego: t('Riego'),
      fertilizante: t('Fertilizante'),
      poda: t('Poda'),
      trasplante: t('Trasplante'),
    };

    const fireAt = nextOccurrence(daysFromNow, 8);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('{icon} {taskTitle} — {plantName}', {
          icon: icons[taskType] || '🌱',
          taskTitle,
          plantName,
        }),
        body: t('Tarea de {tipo} programada para {dias} días más.', {
          tipo: taskLabels[taskType],
          dias: Math.max(0, Math.round(daysFromNow)),
        }),
        sound: true,
        data: { type: 'care-task', taskType, plantName, taskTitle },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: 'plantae_care_channel',
      },
    });

    return identifier;
  } catch {
    return null;
  }
}
