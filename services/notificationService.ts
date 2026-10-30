/**
 * EcoScan Notification Service
 *
 * Notificaciones locales exclusivas utilizando expo-notifications.
 * No requiere servidores externos ni llaves Push; opera 100% en el dispositivo local.
 *
 * Soporta recordatorios recurrentes de riego y fitosanitarios,
 * categoría interactiva "Ya la regué", y cancelación atómica de notificaciones.
 */

import { Platform } from 'react-native';
import { t } from '../i18n';
import type * as NotificationsType from 'expo-notifications';

export const WATERING_CATEGORY_ID = 'WATERING_REMINDER';
export const ACTION_WATERED = 'ACTION_WATERED';

let notificationsInstance: typeof NotificationsType | null = null;

export async function getNotifications(): Promise<typeof NotificationsType | null> {
  if (notificationsInstance) return notificationsInstance;
  try {
    const mod = await import('expo-notifications');
    notificationsInstance = mod;
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return notificationsInstance;
  } catch {
    return null;
  }
}

// Configuración automática en primer plano para entornos móviles nativos
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  void getNotifications().catch(() => {});
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Próxima fecha a una hora hábil (09:00 local) sin caer en el pasado
const nextOccurrence = (daysFromNow: number, hour = 9): Date => {
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
    const Notifications = await getNotifications();
    if (!Notifications) return false;

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
      await Notifications.setNotificationChannelAsync('ecoscan_care_channel', {
        name: t('Recordatorios de Cuidado y Jardín'),
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E7D32',
      });
    }

    await setupInteractiveNotificationCategories();

    return true;
  } catch {
    return false;
  }
}

/**
 * Registra categorías de acciones rápidas para notificaciones.
 * Permite al usuario marcar "Ya la regué" directamente desde la notificación sin abrir la app.
 */
export async function setupInteractiveNotificationCategories(): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await Notifications.setNotificationCategoryAsync(WATERING_CATEGORY_ID, [
      {
        identifier: ACTION_WATERED,
        buttonTitle: t('Ya la regué'),
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  } catch (e) {
    console.warn('[notifications] Error al registrar categoría interactiva:', e);
  }
}

/**
 * Cancela una notificación programada por su identificador
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}

/**
 * Cancela todas las notificaciones programadas pertenecientes a una planta específica
 */
export async function cancelNotificationsForPlant(plantId: string): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const req of scheduled) {
      if (req.content?.data?.plantId === plantId) {
        await Notifications.cancelScheduledNotificationAsync(req.identifier);
      }
    }
  } catch (e) {
    console.warn('[notifications] Error al cancelar notificaciones de la planta:', e);
  }
}

/**
 * Cancela todas las notificaciones programadas en el sistema (ej. restablecimiento de datos)
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('[notifications] Error al cancelar todas las notificaciones:', e);
  }
}

/**
 * Programa un recordatorio de riego periódico recurrente según el intervalo de la planta.
 * Utiliza triggers de calendario/intervalo en lugar de eventos únicos.
 */
export async function scheduleWateringReminder(
  plantName: string,
  daysInterval: number,
  plantId?: string
): Promise<string | null> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return null;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const interval = Math.max(1, Math.round(daysInterval) || 1);

    // Cancelar recordatorios previos de riego para esta misma planta para no duplicar
    if (plantId) {
      await cancelNotificationsForPlant(plantId);
    }

    let trigger: NotificationsType.NotificationTriggerInput;
    if (interval === 1) {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
        channelId: 'ecoscan_care_channel',
      };
    } else if (interval === 7) {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: (new Date().getDay() % 7) + 1,
        hour: 9,
        minute: 0,
        channelId: 'ecoscan_care_channel',
      };
    } else {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(60, interval * 86400),
        repeats: true,
        channelId: 'ecoscan_care_channel',
      };
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('Hora de regar tu {plantName}', { plantName }),
        body: t('Tu planta necesita hidratación cada {interval} días. Toca "Ya la regué" al terminar.', {
          interval,
        }),
        sound: true,
        categoryIdentifier: WATERING_CATEGORY_ID,
        data: { type: 'watering', plantName, intervalDays: interval, plantId },
      },
      trigger,
    });

    return identifier;
  } catch {
    return null;
  }
}

/**
 * Programa un recordatorio de tratamiento fitosanitario recurrente
 */
export async function scheduleTreatmentReminder(
  plantName: string,
  treatmentTitle: string,
  intervalDays: number,
  plantId?: string
): Promise<string | null> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return null;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const interval = Math.max(1, Math.round(intervalDays) || 3);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('🧪 Aplicación de tratamiento: {plantName}', { plantName }),
        body: t(
          'Toca aplicar "{treatmentTitle}" a tu planta. Frecuencia recomendada: cada {interval} días. Usa guantes y mantén alejados a niños y mascotas.',
          { treatmentTitle, interval }
        ),
        sound: true,
        data: { type: 'treatment', plantName, treatmentTitle, intervalDays: interval, plantId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(60, interval * 86400),
        repeats: true,
        channelId: 'ecoscan_care_channel',
      },
    });

    return identifier;
  } catch {
    return null;
  }
}

/**
 * Programa un recordatorio genérico del plan de cuidados (riego, fertilizante, poda o trasplante)
 */
export async function scheduleCareTaskReminder(
  plantName: string,
  taskType: 'riego' | 'fertilizante' | 'poda' | 'trasplante',
  taskTitle: string,
  daysFromNow: number,
  repeatIntervalDays?: number,
  plantId?: string
): Promise<string | null> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return null;

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

    let trigger: NotificationsType.NotificationTriggerInput;
    if (repeatIntervalDays && repeatIntervalDays > 0) {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(60, repeatIntervalDays * 86400),
        repeats: true,
        channelId: 'ecoscan_care_channel',
      };
    } else {
      const fireAt = nextOccurrence(daysFromNow, 8);
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: 'ecoscan_care_channel',
      };
    }

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
        data: { type: 'care-task', taskType, plantName, taskTitle, plantId },
      },
      trigger,
    });

    return identifier;
  } catch {
    return null;
  }
}

/**
 * Registra el listener para la acción interactiva "Ya la regué" (ACTION_WATERED).
 * Devuelve una función de desuscripción.
 */
export function registerNotificationResponseListener(
  onWatered: (plantId: string) => void
): () => void {
  let sub: { remove: () => void } | null = null;
  let active = true;

  void getNotifications().then((Notifications) => {
    if (!Notifications || !active) return;

    sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification?.request?.content?.data;
      if (
        (actionId === ACTION_WATERED || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) &&
        data?.type === 'watering' &&
        typeof data?.plantId === 'string' &&
        data.plantId.length > 0
      ) {
        onWatered(data.plantId);
      }
    });

    // Procesar si la app fue abierta directamente desde una acción de notificación previa
    void Notifications.getLastNotificationResponseAsync().then((last) => {
      if (!last || !active) return;
      const actionId = last.actionIdentifier;
      const data = last.notification?.request?.content?.data;
      if (
        actionId === ACTION_WATERED &&
        data?.type === 'watering' &&
        typeof data?.plantId === 'string' &&
        data.plantId.length > 0
      ) {
        onWatered(data.plantId);
      }
    });
  });

  return () => {
    active = false;
    if (sub) {
      sub.remove();
      sub = null;
    }
  };
}
