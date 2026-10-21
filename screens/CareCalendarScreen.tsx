import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useGarden, GardenPlant, CareTask, CareTaskType } from '../context/GardenContext';
import { Card } from '../components/Card';
import { ConfidenceRing } from '../components/ConfidenceRing';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { PlantCardSkeleton } from '../components/SkeletonLoader';
import { scheduleWateringReminder, scheduleCareTaskReminder } from '../services/notificationService';
import { announce } from '../services/accessibilityService';
import { useTranslation } from '../i18n';
import { useFeedback } from '../context/FeedbackContext';
import { EditCareTaskModal } from '../components/calendar/EditCareTaskModal';

type CalendarView = 'semana' | 'mes';
type FilterTaskType = CareTaskType | 'todos';

const TASK_ICONS: Record<CareTaskType, keyof typeof Ionicons.glyphMap> = {
  riego: 'water',
  fertilizante: 'leaf',
  poda: 'cut',
  trasplante: 'flower',
};

const TASK_COLORS: Record<CareTaskType, string> = {
  riego: '#0288D1',
  fertilizante: '#2E7D32',
  poda: '#7B1FA2',
  trasplante: '#EF6C00',
};

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Convierte la fecha relativa en texto ("En 5 días", "hoy"...) a días desde hoy
const parseDueDays = (dueDate: string): number => {
  const lower = dueDate.toLowerCase();
  if (lower.includes('hoy')) return 0;
  if (lower.includes('mañana')) return 1;
  const days = lower.match(/(\d+)\s*d/);
  if (days) return parseInt(days[1], 10);
  if (lower.includes('semana')) {
    const weeks = lower.match(/(\d+)\s*semana/);
    return weeks ? parseInt(weeks[1], 10) * 7 : 7;
  }
  if (lower.includes('mes')) return 30;
  if (lower.includes('primavera')) return 45;
  return 14;
};

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Día de la semana (0 = lunes) para construir la rejilla del calendario
const mondayIndex = (date: Date): number => (date.getDay() + 6) % 7;

export const CareCalendarScreen: React.FC = () => {
  const { colors, isDark, spacing, typography, layout } = useAppTheme();
  const { plants, waterPlantToday, toggleTaskCompleted, removeCareTask, updateCareTask } = useGarden();
  const { showToast } = useFeedback();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [calendarView, setCalendarView] = useState<CalendarView>('semana');
  const [filterType, setFilterType] = useState<FilterTaskType>('todos');
  const [calendarLoading, setCalendarLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [anchorDate, setAnchorDate] = useState<Date>(startOfDay(new Date()));
  const [editingTask, setEditingTask] = useState<(CareTask & { plantId: string; plantName: string }) | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCalendarLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const retryLoad = () => {
    setErrorMessage(null);
    setCalendarLoading(true);
    setTimeout(() => setCalendarLoading(false), 600);
  };

  // Aplanar todas las tareas de todas las plantas (con fecha efectiva)
  let allTasks: (CareTask & {
    plantId: string;
    plantName: string;
    plantEmoji: string;
    dueDateObj: Date;
  })[] = [];

  try {
    allTasks = plants.flatMap((plant) =>
      (plant.careTasks || []).map((task) => ({
        ...task,
        plantId: plant.id,
        plantName: plant.name,
        plantEmoji: plant.avatarEmoji,
        dueDateObj: addDays(startOfDay(new Date()), parseDueDays(task.dueDate)),
      }))
    );
  } catch {
    allTasks = [];
  }

  const filteredTasks = filterType === 'todos'
    ? allTasks
    : allTasks.filter((t) => t.type === filterType);

  const pendingTasks = filteredTasks.filter(
    (t) => !t.completed && (!selectedDay || isSameDay(t.dueDateObj, selectedDay))
  );
  const completedTasks = filteredTasks.filter((t) => t.completed);

  const handleScheduleWatering = async (plantName: string, daysInterval: number) => {
    try { Haptics.selectionAsync(); } catch {}
    const id = await scheduleWateringReminder(plantName, daysInterval);
    if (id) {
      setErrorMessage(null);
      showToast({
        message: t('Recordatorio programado para regar "{planta}".', { planta: plantName }),
        type: 'success',
      });
    } else {
      setErrorMessage(
        t('Activa las notificaciones de EcoScan en los Ajustes de tu dispositivo para recibir recordatorios de riego.')
      );
    }
  };

  const handleScheduleTaskReminder = async (
    task: (typeof allTasks)[number]
  ) => {
    try { Haptics.selectionAsync(); } catch {}
    const daysFromNow = Math.max(0, Math.round((task.dueDateObj.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    const id = await scheduleCareTaskReminder(task.plantName, task.type, task.title, daysFromNow);
    if (id) {
      setErrorMessage(null);
      showToast({
        message: t('Se avisará "{tarea}" para {planta} en {dias} día(s).', {
          tarea: t(task.title),
          planta: task.plantName,
          dias: daysFromNow,
        }),
        type: 'success',
      });
    } else {
      setErrorMessage(t('No se pudo programar el recordatorio. Revisa los permisos de notificación.'));
    }
  };

  const handleCompleteTask = (plantId: string, taskId: string) => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    toggleTaskCompleted(plantId, taskId);
    announce(t('Tarea completada'));
    showToast({
      message: t('Tarea completada'),
      actionLabel: t('Deshacer'),
      durationMs: 5000,
      onAction: () => {
        toggleTaskCompleted(plantId, taskId);
        announce(t('Acción deshecha'));
      },
    });
  };

  const handleUpdateTask = (updates: { title?: string; dueDate?: string; repeatIntervalDays?: number }) => {
    if (!editingTask) return;
    updateCareTask(editingTask.plantId, editingTask.id, updates);
    showToast({
      message: t('Tarea actualizada con éxito'),
      type: 'success',
    });
    setEditingTask(null);
  };

  const handleDeleteTask = () => {
    if (!editingTask) return;
    removeCareTask(editingTask.plantId, editingTask.id);
    showToast({
      message: t('Tarea desactivada'),
      type: 'info',
    });
    setEditingTask(null);
  };

  // Rejilla de días: semana actual o mes del ancla
  const buildCalendarDays = (): Date[] => {
    const anchor = startOfDay(anchorDate);
    if (calendarView === 'semana') {
      const weekStart = addDays(anchor, -mondayIndex(anchor));
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = addDays(monthStart, -mondayIndex(monthStart));
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const cells = Math.ceil((mondayIndex(monthStart) + daysInMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => addDays(gridStart, i));
  };

  const tasksForDay = (day: Date): typeof allTasks =>
    allTasks.filter((t) => isSameDay(t.dueDateObj, day));

  const navigatePeriod = (dir: 1 | -1) => {
    try { Haptics.selectionAsync(); } catch {}
    if (calendarView === 'semana') {
      setAnchorDate((d) => addDays(d, dir * 7));
    } else {
      setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
    }
  };

  const periodLabel = (): string => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    if (calendarView === 'semana') {
      const days = buildCalendarDays();
      const first = days[0];
      const last = days[6];
      if (first.getMonth() === last.getMonth()) {
        return `${first.getDate()} – ${last.getDate()} ${t(monthNames[first.getMonth()])} ${first.getFullYear()}`;
      }
      return `${first.getDate()} ${t(monthNames[first.getMonth()]).slice(0, 3)} – ${last.getDate()} ${t(monthNames[last.getMonth()]).slice(0, 3)} ${last.getFullYear()}`;
    }
    return `${t(monthNames[anchorDate.getMonth()])} ${anchorDate.getFullYear()}`;
  };

  const renderTaskItem = ({ item }: { item: typeof filteredTasks[0] }) => {
    const taskColor = TASK_COLORS[item.type];
    const taskIcon = TASK_ICONS[item.type];

    return (
      <Card elevated style={{ marginBottom: spacing.sm }}>
        <View style={styles.taskRow}>
          {/* Indicador de tipo */}
          <View
            style={[
              styles.taskTypeIndicator,
              { backgroundColor: taskColor + (isDark ? '33' : '22') },
            ]}
          >
            <Ionicons name={taskIcon} size={20} color={taskColor} />
          </View>

          {/* Contenido de la tarea */}
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={styles.taskTitleRow}>
              <Text
                style={[
                  typography.headline,
                  {
                    color: item.completed ? colors.textTertiary : colors.textPrimary,
                    textDecorationLine: item.completed ? 'line-through' : 'none',
                    flex: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {t(item.title)}
              </Text>
            </View>

            <View style={styles.taskMeta}>
              <Text style={styles.plantChip}>
                {item.plantEmoji} {item.plantName}
              </Text>
              <Text style={[typography.caption1, { color: item.completed ? colors.textTertiary : colors.warning }]}>
                {item.completed ? t('Completado ✓') : item.dueDate}
              </Text>
            </View>
          </View>

          {/* Botón checkbox 44x44 HIG */}
          <Pressable
            style={({ pressed }) => [
              styles.checkButton,
              { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
            onPress={() => handleCompleteTask(item.plantId, item.id)}
            android_ripple={{ color: colors.primary + '25', borderless: true, radius: 22 }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.completed }}
            accessibilityLabel={t('Marcar "{tarea}" como {estado}', {
              tarea: t(item.title),
              estado: item.completed ? t('pendiente') : t('completada'),
            })}
          >
            <Ionicons
              name={item.completed ? 'checkmark-circle' : 'radio-button-off'}
              size={24}
              color={item.completed ? colors.primary : colors.textTertiary}
            />
          </Pressable>

          {!item.completed && (
            <Pressable
              style={({ pressed }) => [
                styles.checkButton,
                { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
              ]}
              onPress={() => setEditingTask(item)}
              android_ripple={{ color: colors.primary + '20', borderless: true, radius: 20 }}
              accessibilityRole="button"
              accessibilityLabel={t('Editar tarea "{tarea}"', { tarea: t(item.title) })}
            >
              <Ionicons name="create-outline" size={21} color={colors.primary} />
            </Pressable>
          )}

          {!item.completed && (
            <Pressable
              style={({ pressed }) => [
                styles.checkButton,
                { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
              ]}
              onPress={() => handleScheduleTaskReminder(item)}
              android_ripple={{ color: colors.primary + '20', borderless: true, radius: 20 }}
              accessibilityRole="button"
              accessibilityLabel={t('Programar recordatorio para "{tarea}"', { tarea: t(item.title) })}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.checkButton,
              { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
            onPress={() => removeCareTask(item.plantId, item.id)}
            android_ripple={{ color: colors.error + '25', borderless: true, radius: 20 }}
            accessibilityRole="button"
            accessibilityLabel={t('Eliminar tarea "{tarea}"', { tarea: t(item.title) })}
          >
            <Ionicons name="trash-outline" size={21} color={colors.error} />
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderPlantHealthSummary = ({ item }: { item: GardenPlant }) => (
    <Card
      style={[styles.plantHealthCard, { borderColor: colors.border, overflow: 'hidden' }]}
      elevated
    >
      <Pressable
        onPress={() => navigation.navigate('HealthDiagnosis', { plantId: item.id })}
        style={({ pressed }) => [
          { borderRadius: 12, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1 },
        ]}
        android_ripple={{ color: colors.primary + '18' }}
        accessibilityRole="button"
        accessibilityLabel={t('Ver diagnóstico de salud de {nombre}', { nombre: item.name })}
      >
        <View style={styles.plantHealthRow}>
          <Text style={styles.plantHealthEmoji}>{item.avatarEmoji}</Text>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700' }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[typography.caption2, { color: colors.textTertiary }]}>
              {item.lastDiagnosis || t('Sin diagnóstico reciente')}
            </Text>
          </View>
          <ConfidenceRing
            score={item.healthScore}
            size={44}
            strokeWidth={4}
            colorVariant="health"
            showPercentSymbol={false}
          />
        </View>
      </Pressable>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 40, 60) }}
      >
        {/* HEADER */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 16),
            },
          ]}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
            android_ripple={{ color: colors.primary + '20', borderless: true, radius: 24 }}
            accessibilityRole="button"
            accessibilityLabel={t('Volver')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
            <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
          </Pressable>
          <Text style={[typography.largeTitle, { color: colors.textPrimary, fontWeight: '700', marginTop: 8 }]}>
            {t('Plan de Cuidados')}
          </Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 2 }]}>
            {t('Calendario inteligente de tareas botánicas')}
          </Text>
        </View>

        <View style={{ padding: spacing.md }}>
          {errorMessage && (
            <ErrorBanner
              message={errorMessage}
              onRetry={retryLoad}
              style={{ marginBottom: spacing.md }}
            />
          )}

          {/* RESUMEN DE SALUD POR PLANTA - CARRUSEL HORIZONTAL */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            {t('Puntuación de Salud')}
          </Text>
          {calendarLoading ? (
            <View style={{ marginBottom: spacing.lg }}>
              <PlantCardSkeleton />
            </View>
          ) : (
            <FlatList
              data={plants}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={renderPlantHealthSummary}
              contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }}
              style={{ marginHorizontal: -spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.lg }}
            />
          )}

          {/* CALENDARIO SEMANAL / MENSUAL */}
          <View style={styles.calendarHeaderRow}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>
              {t('Calendario')}
            </Text>
            <View style={[styles.viewToggle, { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA', overflow: 'hidden' }]}>
              {(['semana', 'mes'] as CalendarView[]).map((view) => {
                const active = calendarView === view;
                return (
                  <Pressable
                    key={view}
                    onPress={() => {
                      try { Haptics.selectionAsync(); } catch {}
                      setCalendarView(view);
                    }}
                    style={({ pressed }) => [
                      styles.viewToggleBtn,
                      active && { backgroundColor: colors.surface },
                      { overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1 },
                    ]}
                    android_ripple={{ color: colors.primary + '20' }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t('Ver calendario por {vista}', {
                      vista: view === 'semana' ? t('Semana') : t('Mes'),
                    })}
                  >
                    <Text
                      style={[
                        typography.caption1,
                        {
                          color: active ? colors.textPrimary : colors.textSecondary,
                          fontWeight: active ? '700' : '500',
                          textTransform: 'capitalize',
                        },
                      ]}
                    >
                      {view === 'semana' ? t('Semana') : t('Mes')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.calendarCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.calendarNavRow}>
              <Pressable
                onPress={() => navigatePeriod(-1)}
                style={({ pressed }) => [
                  styles.calendarNavBtn,
                  { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
                ]}
                android_ripple={{ color: colors.primary + '20', borderless: true, radius: 20 }}
                accessibilityRole="button"
                accessibilityLabel={t('Período anterior')}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </Pressable>
              <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700' }]}>
                {periodLabel()}
              </Text>
              <Pressable
                onPress={() => navigatePeriod(1)}
                style={({ pressed }) => [
                  styles.calendarNavBtn,
                  { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
                ]}
                android_ripple={{ color: colors.primary + '20', borderless: true, radius: 20 }}
                accessibilityRole="button"
                accessibilityLabel={t('Período siguiente')}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.weekLabelsRow}>
              {DAY_LABELS.map((label, idx) => (
                <Text key={`${label}-${idx}`} style={[typography.caption2, styles.weekLabel, { color: colors.textTertiary }]}>
                  {t(label)}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {buildCalendarDays().map((day) => {
                const dayTasks = tasksForDay(day);
                const inCurrentMonth = calendarView === 'semana' || day.getMonth() === anchorDate.getMonth();
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                return (
                  <Pressable
                    key={day.toISOString()}
                    style={({ pressed }) => [
                      styles.dayCell,
                      isSelected && { backgroundColor: colors.primaryLight },
                      { overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1 },
                    ]}
                    android_ripple={{ color: colors.primary + '25' }}
                    onPress={() => {
                      try { Haptics.selectionAsync(); } catch {}
                      setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      dayTasks.length
                        ? t('Día {dia}, {n} tareas', { dia: day.getDate(), n: dayTasks.length })
                        : t('Día {dia}', { dia: day.getDate() })
                    }
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        typography.caption1,
                        {
                          color: !inCurrentMonth ? colors.textTertiary : colors.textPrimary,
                          fontWeight: isToday || isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                    <View style={styles.dayDotsRow}>
                      {dayTasks.slice(0, 3).map((t, i) => (
                        <View key={i} style={[styles.dayDot, { backgroundColor: TASK_COLORS[t.type] }]} />
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {selectedDay && (
              <Pressable
                onPress={() => setSelectedDay(null)}
                style={({ pressed }) => [
                  styles.clearDayChip,
                  { overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1 },
                ]}
                android_ripple={{ color: colors.primary + '20' }}
                accessibilityRole="button"
                accessibilityLabel={t('Quitar filtro de día')}
              >
                <Text style={[typography.caption1, { color: colors.primary, fontWeight: '600' }]}>
                  {selectedDay.getDate()}/{selectedDay.getMonth() + 1} · {t('Quitar filtro de día')} ✕
                </Text>
              </Pressable>
            )}
          </View>

          {/* FILTROS DE TIPO DE TAREA - PILLS HIG */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            {t('Tareas Pendientes')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.xs, marginBottom: spacing.md }}
          >
            {(['todos', 'riego', 'fertilizante', 'poda', 'trasplante'] as FilterTaskType[]).map((type) => {
              const isActive = filterType === type;
              const labels: Record<FilterTaskType, string> = {
                todos: t('🌿 Todas'),
                riego: t('💧 Riego'),
                fertilizante: t('🌱 Fertilizante'),
                poda: t('✂️ Poda'),
                trasplante: t('🪴 Trasplante'),
              };

              return (
                <Pressable
                  key={type}
                  onPress={() => {
                    try { Haptics.selectionAsync(); } catch {}
                    setFilterType(type);
                  }}
                  style={({ pressed }) => [
                    styles.filterPill,
                    {
                      backgroundColor: isActive ? colors.primary : isDark ? '#2C2C2E' : '#E5E5EA',
                      minHeight: 44,
                      overflow: 'hidden',
                      opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1,
                    },
                  ]}
                  android_ripple={{ color: isActive ? 'rgba(255,255,255,0.3)' : colors.primary + '20' }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={t('Filtrar por {filtro}', { filtro: labels[type] })}
                >
                  <Text
                    style={[
                      typography.subheadline,
                      {
                        color: isActive ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {labels[type]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* LISTA DE TAREAS PENDIENTES */}
          {calendarLoading ? (
            <View>
              <PlantCardSkeleton />
              <PlantCardSkeleton />
              <PlantCardSkeleton />
            </View>
          ) : pendingTasks.length === 0 ? (
            <EmptyState
              iconName="checkmark-circle-outline"
              title={t('¡Todo al día!')}
              description={
                selectedDay
                  ? t('No hay tareas pendientes para el día seleccionado. Toca de nuevo el día o quita el filtro para ver el resto.')
                  : t('No hay tareas pendientes con el filtro seleccionado. ¡Tu jardín está perfectamente cuidado!')
              }
            />
          ) : (
            <FlatList
              data={pendingTasks}
              keyExtractor={(item) => `${item.plantId}-${item.id}`}
              renderItem={renderTaskItem}
              scrollEnabled={false}
            />
          )}

          {/* TAREAS COMPLETADAS */}
          {completedTasks.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                {t('Completadas Recientemente ✓')}
              </Text>
              <FlatList
                data={completedTasks}
                keyExtractor={(item) => `${item.plantId}-${item.id}-done`}
                renderItem={renderTaskItem}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* RECORDATORIOS RÁPIDOS POR PLANTA */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
            {t('Programar Recordatorios')}
          </Text>

          {plants.slice(0, 4).map((plant) => (
            <Card key={plant.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.reminderRow}>
                <Text style={{ fontSize: 20 }}>{plant.avatarEmoji}</Text>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600' }]}>
                    {plant.name}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                    {t('Riego cada {dias} días', { dias: plant.wateringFrequencyDays })}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.reminderBtn,
                    {
                      backgroundColor: colors.primaryLight,
                      minWidth: 48,
                      minHeight: 48,
                      opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1,
                    },
                  ]}
                  android_ripple={{ color: colors.primary + '25', borderless: true, radius: 24 }}
                  onPress={() => handleScheduleWatering(plant.name, plant.wateringFrequencyDays)}
                  accessibilityRole="button"
                  accessibilityLabel={t('Programar recordatorio de riego para {nombre}', { nombre: plant.name })}
                >
                  <Ionicons name="notifications" size={18} color={colors.primary} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <EditCareTaskModal
        visible={Boolean(editingTask)}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 24,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    minWidth: 48,
    alignSelf: 'flex-start',
  },
  plantHealthCard: {
    width: 180,
    padding: 10,
    borderWidth: 1,
  },
  plantHealthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantHealthEmoji: {
    fontSize: 24,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  plantChip: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  checkButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  viewToggleBtn: {
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarNavBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabelsRow: {
    flexDirection: 'row',
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayDotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 6,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  clearDayChip: {
    alignSelf: 'center',
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
