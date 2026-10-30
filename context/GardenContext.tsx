import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadJSON, saveJSON, STORAGE_KEYS, validateGardenData } from '../services/storage';
import { t } from '../i18n';
import { deleteGrowthEntriesForPlant, getAllGrowthPhotoUris } from '../services/growthDiaryService';
import {
  checkNewAchievements,
  loadUnlockedAchievements,
  saveUnlockedAchievements,
  UnlockedAchievementsMap,
  Achievement,
} from '../services/gamificationService';
import { deleteImage, reconcileOrphanImages } from '../services/mediaService';
import { AchievementCelebrationModal } from '../components/AchievementCelebrationModal';
import { updateWidgetData } from '../services/widgetService';
import {
  registerNotificationResponseListener,
  cancelNotificationsForPlant,
  cancelAllNotifications,
  scheduleWateringReminder,
} from '../services/notificationService';

export type CareTaskType = 'riego' | 'fertilizante' | 'poda' | 'trasplante';

export interface CareTask {
  id: string;
  type: CareTaskType;
  title: string;
  dueDate: string;
  completed: boolean;
  repeatIntervalDays?: number;
}

export interface Room {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export type PotSize = 'small' | 'medium' | 'large' | 'planter';

export interface GardenPlant {
  id: string;
  name: string;
  nickname?: string;
  scientificName: string;
  lastWatered: string;
  isWateredToday: boolean;
  wateringFrequencyDays: number;
  potSize?: PotSize;
  light: string;
  avatarEmoji: string;
  imageUri?: string;
  healthScore: number; // 0 a 100
  lastDiagnosis?: string;
  careTasks?: CareTask[];
  /** Habitación / zona a la que pertenece la planta */
  roomId?: string;
}

export interface GardenStats {
  currentStreak: number;
  longestStreak: number;
  totalWaterings: number;
  totalPlants: number;
  totalIdentifications: number;
  totalDiagnoses: number;
  tasksCompleted: number;
  identificationsToday: number;
}

interface StatsState {
  currentStreak: number;
  longestStreak: number;
  totalWaterings: number;
  totalIdentifications: number;
  totalDiagnoses: number;
  tasksCompleted: number;
  identificationsToday: number;
  lastWaterDate: string | null;
  lastIdentificationDate: string | null;
}

const DEFAULT_ROOMS: Room[] = [
  { id: 'room-sala', name: t('Sala'), icon: 'tv' },
  { id: 'room-dormitorio', name: t('Dormitorio'), icon: 'bed' },
  { id: 'room-cocina', name: t('Cocina'), icon: 'restaurant' },
  { id: 'room-balcon', name: t('Balcón'), icon: 'sunny' },
  { id: 'room-oficina', name: t('Oficina'), icon: 'desktop' },
];

const INITIAL_STATS: StatsState = {
  currentStreak: 0,
  longestStreak: 0,
  totalWaterings: 0,
  totalIdentifications: 0,
  totalDiagnoses: 0,
  tasksCompleted: 0,
  identificationsToday: 0,
  lastWaterDate: null,
  lastIdentificationDate: null,
};

const DEMO_PLANT_IDS = new Set(['plant-1', 'plant-2', 'plant-3', 'plant-4']);

const dateKey = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

type NewPlantInput = Omit<GardenPlant, 'id' | 'lastWatered' | 'isWateredToday' | 'healthScore'>;

interface GardenContextType {
  plants: GardenPlant[];
  rooms: Room[];
  stats: GardenStats;
  unlockedAchievements: UnlockedAchievementsMap;
  /** `true` cuando el estado persistido ya se cargó desde disco. */
  isHydrated: boolean;
  waterPlantToday: (id: string) => void;
  undoWaterPlant: (id: string, previousLastWatered: string, previousIsWatered?: boolean) => void;
  addPlant: (plant: NewPlantInput, roomId?: string) => string;
  addPlants: (plants: NewPlantInput[], roomId?: string) => number;
  removePlant: (id: string) => void;
  restorePlant: (plant: GardenPlant) => void;
  updatePlantHealth: (id: string, score: number, diagnosis: string) => void;
  toggleTaskCompleted: (plantId: string, taskId: string) => void;
  setTaskCompletion: (plantId: string, taskId: string, completed: boolean) => void;
  updateCareTask: (plantId: string, taskId: string, updates: Partial<CareTask>) => void;
  addCareTask: (plantId: string, task: Omit<CareTask, 'id' | 'completed'>) => void;
  removeCareTask: (plantId: string, taskId: string) => void;
  addCustomPlant: (
    name: string,
    options?: {
      nickname?: string;
      potSize?: PotSize;
      imageUri?: string;
      wateringFrequencyDays?: number;
      light?: string;
      roomId?: string;
      scientificName?: string;
    }
  ) => string;
  assignPlantToRoom: (plantId: string, roomId?: string) => void;
  createRoom: (name: string, icon?: Room['icon']) => Room;
  removeRoom: (roomId: string) => void;
  registerIdentification: () => void;
  registerDiagnosis: () => void;
  resetDefaultPlants: () => void;
  resetStats: () => void;
  clearGarden: () => void;
  hydrateGarden: () => Promise<void>;
}

const GardenContext = createContext<GardenContextType | undefined>(undefined);

/** Forma persistida del jardín. Cambiar aquí implica migrar (storage.ts). */
interface PersistedGarden {
  plants: GardenPlant[];
  rooms: Room[];
  stats: StatsState;
}

const buildCareTasks = (wateringFrequencyDays: number, stamp: number): CareTask[] => [
  {
    id: `task-${stamp}-1`,
    type: 'riego',
    title: t('Riego regular'),
    dueDate: t('En {dias} días', { dias: wateringFrequencyDays }),
    completed: false,
  },
  { id: `task-${stamp}-2`, type: 'fertilizante', title: t('Nutrición foliar'), dueDate: t('En 20 días'), completed: false },
];

export function GardenProvider({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<GardenPlant[]>([]);
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);
  const [statsState, setStatsState] = useState<StatsState>(INITIAL_STATS);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievementsMap>({});
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hidratación: lee el jardín y logros persistidos una sola vez al iniciar.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadJSON<PersistedGarden | null>(STORAGE_KEYS.garden, null, validateGardenData);
      const storedAchievements = await loadUnlockedAchievements();
      if (!active) return;
      setUnlockedAchievements(storedAchievements);
      if (stored) {
        const cleanPlants = (Array.isArray(stored.plants) ? stored.plants : []).filter(
          (p) => !DEMO_PLANT_IDS.has(p.id)
        );
        setPlants(cleanPlants);
        setRooms(stored.rooms && stored.rooms.length > 0 ? stored.rooms : DEFAULT_ROOMS);
        const persistedStats = { ...INITIAL_STATS, ...(stored.stats ?? {}) };
        const today = dateKey();
        if (persistedStats.lastIdentificationDate !== today) {
          persistedStats.identificationsToday = 0;
          persistedStats.lastIdentificationDate = today;
        }
        setStatsState(persistedStats);
      } else {
        setPlants([]);
      }
      setIsHydrated(true);

      // Reconciliación de fotos huérfanas en segundo plano (incluye plantas y diario de crecimiento)
      try {
        const plantPhotos = (stored?.plants ?? []).map((p) => p.imageUri).filter(Boolean) as string[];
        const diaryPhotos = getAllGrowthPhotoUris();
        const allActiveUris = [...plantPhotos, ...diaryPhotos];
        void reconcileOrphanImages(allActiveUris);
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  const hydrateGarden = async (): Promise<void> => {
    const stored = await loadJSON<PersistedGarden | null>(STORAGE_KEYS.garden, null, validateGardenData);
    const storedAchievements = await loadUnlockedAchievements();
    setUnlockedAchievements(storedAchievements);
    if (stored) {
      setPlants(Array.isArray(stored.plants) ? stored.plants : []);
      setRooms(stored.rooms && stored.rooms.length > 0 ? stored.rooms : DEFAULT_ROOMS);
      const persistedStats = { ...INITIAL_STATS, ...(stored.stats ?? {}) };
      setStatsState(persistedStats);
    }
  };

  // Normalizar el contador de identificaciones al cambiar de día (cuando la app vuelve a primer plano)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const today = dateKey();
        setStatsState((prev) => {
          if (prev.lastIdentificationDate !== today) {
            return { ...prev, identificationsToday: 0, lastIdentificationDate: today };
          }
          return prev;
        });
      }
    });
    return () => sub.remove();
  }, []);

  // Comprobar y celebrar logros al ganar nuevas estadísticas
  useEffect(() => {
    if (!isHydrated) return;
    const { newAchievements, updatedMap } = checkNewAchievements(
      {
        ...statsState,
        totalPlants: plants.length,
      },
      unlockedAchievements
    );
    if (newAchievements.length > 0) {
      setUnlockedAchievements(updatedMap);
      void saveUnlockedAchievements(updatedMap);
      setCelebratingAchievement(newAchievements[0]);
    }
  }, [isHydrated, statsState, plants.length, unlockedAchievements]);

  // Persistencia: guarda en disco tras cada cambio, pero nunca antes de hidratar.
  useEffect(() => {
    if (!isHydrated) return;
    void saveJSON<PersistedGarden>(STORAGE_KEYS.garden, { plants, rooms, stats: statsState });
    void updateWidgetData(plants);
  }, [isHydrated, plants, rooms, statsState]);

  const waterPlantToday = (id: string) => {
    let targetPlantName = '';
    let targetFrequency = 7;

    setPlants((prev) =>
      prev.map((plant) => {
        if (plant.id === id) {
          targetPlantName = plant.name;
          targetFrequency = plant.wateringFrequencyDays || 7;
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const updatedTasks = plant.careTasks?.map((task) => {
            if (task.type === 'riego') {
              return {
                ...task,
                completed: true,
                dueDate: t('En {dias} días', { dias: targetFrequency }),
              };
            }
            return task;
          });
          return {
            ...plant,
            lastWatered: t('Hoy a las {hora}', { hora: timeStr }),
            isWateredToday: true,
            careTasks: updatedTasks ?? plant.careTasks,
          };
        }
        return plant;
      })
    );

    if (targetPlantName) {
      void scheduleWateringReminder(targetPlantName, targetFrequency, id);
    }

    setStatsState((prev) => {
      const today = dateKey();
      let currentStreak = prev.currentStreak;
      if (prev.lastWaterDate !== today) {
        currentStreak = prev.lastWaterDate === dateKey(-1) ? prev.currentStreak + 1 : 1;
      }
      return {
        ...prev,
        currentStreak,
        longestStreak: Math.max(prev.longestStreak, currentStreak),
        totalWaterings: prev.totalWaterings + 1,
        lastWaterDate: today,
      };
    });
  };

  // Listener para la acción interactiva de notificación "Ya la regué"
  useEffect(() => {
    if (!isHydrated) return;
    const unsubscribe = registerNotificationResponseListener((plantId) => {
      waterPlantToday(plantId);
    });
    return () => {
      unsubscribe();
    };
  }, [isHydrated]);

  const undoWaterPlant = (id: string, previousLastWatered: string, previousIsWatered = false) => {
    setPlants((prev) =>
      prev.map((plant) => {
        if (plant.id === id) {
          return { ...plant, lastWatered: previousLastWatered, isWateredToday: previousIsWatered };
        }
        return plant;
      })
    );
    setStatsState((prev) => ({
      ...prev,
      totalWaterings: Math.max(0, prev.totalWaterings - 1),
    }));
  };

  const createPlantRecord = (newPlant: NewPlantInput, roomId: string | undefined, stamp: number): GardenPlant => ({
    ...newPlant,
    id: `plant-${stamp}-${Math.floor(Math.random() * 1000)}`,
    lastWatered: t('Hoy recién agregada'),
    isWateredToday: true,
    healthScore: 92,
    lastDiagnosis: t('Saludable'),
    roomId: roomId ?? newPlant.roomId,
    careTasks: buildCareTasks(newPlant.wateringFrequencyDays, stamp),
  });

  const addPlant = (newPlant: NewPlantInput, roomId?: string): string => {
    const record = createPlantRecord(newPlant, roomId, Date.now());
    setPlants((prev) => [record, ...prev]);
    return record.id;
  };

  const addPlants = (newPlants: NewPlantInput[], roomId?: string): number => {
    const base = Date.now();
    const records = newPlants.map((p, i) => createPlantRecord(p, roomId, base + i));
    setPlants((prev) => [...records, ...prev]);
    return records.length;
  };

  const removePlant = (id: string) => {
    const target = plants.find((p) => p.id === id);
    setPlants((prev) => prev.filter((p) => p.id !== id));
    deleteGrowthEntriesForPlant(id);
    if (target?.imageUri) {
      void deleteImage(target.imageUri);
    }
    void cancelNotificationsForPlant(id);
  };

  const restorePlant = (plant: GardenPlant) => {
    setPlants((prev) => [plant, ...prev.filter((p) => p.id !== plant.id)]);
  };

  const updatePlantHealth = (id: string, score: number, diagnosis: string) => {
    setPlants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, healthScore: score, lastDiagnosis: diagnosis };
        }
        return p;
      })
    );
  };

  const toggleTaskCompleted = (plantId: string, taskId: string) => {
    let becameCompleted = false;
    setPlants((prev) =>
      prev.map((p) => {
        if (p.id !== plantId) return p;
        return {
          ...p,
          careTasks: p.careTasks?.map((task) => {
            if (task.id !== taskId) return task;
            if (!task.completed) becameCompleted = true;
            return { ...task, completed: !task.completed };
          }),
        };
      })
    );
    if (becameCompleted) {
      setStatsState((prev) => ({ ...prev, tasksCompleted: prev.tasksCompleted + 1 }));
    }
  };

  const setTaskCompletion = (plantId: string, taskId: string, completed: boolean) => {
    setPlants((prev) =>
      prev.map((p) => {
        if (p.id !== plantId) return p;
        return {
          ...p,
          careTasks: p.careTasks?.map((task) => {
            if (task.id !== taskId) return task;
            return { ...task, completed };
          }),
        };
      })
    );
  };

  const removeCareTask = (plantId: string, taskId: string) => {
    setPlants((prev) => prev.map((plant) => plant.id === plantId
      ? { ...plant, careTasks: plant.careTasks?.filter((task) => task.id !== taskId) }
      : plant));
  };

  const updateCareTask = (plantId: string, taskId: string, updates: Partial<CareTask>) => {
    setPlants((prev) =>
      prev.map((plant) => {
        if (plant.id !== plantId) return plant;
        return {
          ...plant,
          careTasks: plant.careTasks?.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        };
      })
    );
  };

  const addCareTask = (plantId: string, task: Omit<CareTask, 'id' | 'completed'>) => {
    const newTask: CareTask = {
      ...task,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      completed: false,
    };
    setPlants((prev) =>
      prev.map((plant) => {
        if (plant.id !== plantId) return plant;
        return {
          ...plant,
          careTasks: [...(plant.careTasks ?? []), newTask],
        };
      })
    );
  };

  const addCustomPlant = (
    name: string,
    options?: {
      nickname?: string;
      potSize?: PotSize;
      imageUri?: string;
      wateringFrequencyDays?: number;
      light?: string;
      roomId?: string;
      scientificName?: string;
    }
  ): string => {
    const days = options?.wateringFrequencyDays ?? 7;
    const stamp = Date.now();
    const input: NewPlantInput = {
      name: name.trim(),
      nickname: options?.nickname?.trim(),
      scientificName: options?.scientificName || `${name.trim()} sp.`,
      wateringFrequencyDays: days,
      potSize: options?.potSize ?? 'medium',
      imageUri: options?.imageUri,
      light: options?.light || t('Luz indirecta'),
      avatarEmoji: '🌿',
      roomId: options?.roomId,
      careTasks: [
        {
          id: `task-${stamp}-1`,
          type: 'riego',
          title: t('Riego regular'),
          dueDate: t('En {dias} días', { dias: days }),
          completed: false,
          repeatIntervalDays: days,
        },
      ],
    };
    return addPlant(input, options?.roomId);
  };

  const assignPlantToRoom = (plantId: string, roomId?: string) => {
    setPlants((prev) => prev.map((p) => (p.id === plantId ? { ...p, roomId } : p)));
  };

  const createRoom = (name: string, icon: Room['icon'] = 'home'): Room => {
    const room: Room = { id: `room-${Date.now()}`, name: name.trim() || t('Nueva zona'), icon };
    setRooms((prev) => [...prev, room]);
    return room;
  };

  const removeRoom = (roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setPlants((prev) => prev.map((p) => (p.roomId === roomId ? { ...p, roomId: undefined } : p)));
  };

  const registerIdentification = () => {
    setStatsState((prev) => {
      const today = dateKey();
      const todayCount = prev.lastIdentificationDate === today ? prev.identificationsToday + 1 : 1;
      return {
        ...prev,
        totalIdentifications: prev.totalIdentifications + 1,
        identificationsToday: todayCount,
        lastIdentificationDate: today,
      };
    });
  };

  const registerDiagnosis = () => {
    setStatsState((prev) => ({ ...prev, totalDiagnoses: prev.totalDiagnoses + 1 }));
  };

  const resetDefaultPlants = () => {
    // Limpiar jardín: sin plantas de prueba
    setPlants([]);
    void cancelAllNotifications();
  };

  const resetStats = () => {
    setStatsState(INITIAL_STATS);
  };

  const clearGarden = () => {
    setPlants([]);
    setRooms(DEFAULT_ROOMS);
    setStatsState(INITIAL_STATS);
    void cancelAllNotifications();
  };

  const stats = useMemo<GardenStats>(
    () => ({
      currentStreak: statsState.currentStreak,
      longestStreak: statsState.longestStreak,
      totalWaterings: statsState.totalWaterings,
      totalIdentifications: statsState.totalIdentifications,
      totalDiagnoses: statsState.totalDiagnoses,
      tasksCompleted: statsState.tasksCompleted,
      identificationsToday: statsState.identificationsToday,
      totalPlants: plants.length,
    }),
    [statsState, plants.length]
  );

  return (
    <GardenContext.Provider
      value={{
        plants,
        rooms,
        stats,
        unlockedAchievements,
        isHydrated,
        waterPlantToday,
        undoWaterPlant,
        addPlant,
        addPlants,
        removePlant,
        restorePlant,
        updatePlantHealth,
        toggleTaskCompleted,
        setTaskCompletion,
        updateCareTask,
        addCareTask,
        removeCareTask,
        addCustomPlant,
        assignPlantToRoom,
        createRoom,
        removeRoom,
        registerIdentification,
        registerDiagnosis,
        resetDefaultPlants,
        resetStats,
        clearGarden,
        hydrateGarden,
      }}
    >
      {children}
      <AchievementCelebrationModal
        achievement={celebratingAchievement}
        onDismiss={() => setCelebratingAchievement(null)}
      />
    </GardenContext.Provider>
  );
}

export function useGarden(): GardenContextType {
  const context = useContext(GardenContext);
  if (!context) {
    throw new Error(t('useGarden debe utilizarse dentro de GardenProvider'));
  }
  return context;
}

export { DEFAULT_ROOMS };
