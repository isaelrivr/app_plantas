import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../services/storage';
import { t } from '../i18n';
import { deleteGrowthEntriesForPlant } from '../services/growthDiaryService';

export type CareTaskType = 'riego' | 'fertilizante' | 'poda' | 'trasplante';

export interface CareTask {
  id: string;
  type: CareTaskType;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Room {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface GardenPlant {
  id: string;
  name: string;
  scientificName: string;
  lastWatered: string;
  isWateredToday: boolean;
  wateringFrequencyDays: number;
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

const INITIAL_PLANTS: GardenPlant[] = [
  {
    id: 'plant-1',
    name: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa Liebm.',
    lastWatered: t('Hace 3 días'),
    isWateredToday: false,
    wateringFrequencyDays: 8,
    light: t('Luz indirecta brillante'),
    avatarEmoji: '🌿',
    healthScore: 94,
    lastDiagnosis: t('Estado óptimo y vigoroso'),
    roomId: 'room-sala',
    careTasks: [
      { id: 't1', type: 'riego', title: t('Riego profundo de sustrato'), dueDate: t('En 5 días'), completed: false },
      { id: 't2', type: 'fertilizante', title: t('Abono líquido equilibrado'), dueDate: t('En 12 días'), completed: false },
      { id: 't3', type: 'poda', title: t('Limpieza de hojas basales'), dueDate: t('Próximo mes'), completed: false },
    ],
  },
  {
    id: 'plant-2',
    name: 'Ficus Lyrata',
    scientificName: 'Ficus lyrata Warb.',
    lastWatered: t('Hace 6 días'),
    isWateredToday: false,
    wateringFrequencyDays: 10,
    light: t('Luz filtrada intensa'),
    avatarEmoji: '🪴',
    healthScore: 78,
    lastDiagnosis: t('Leve clorosis por luz baja'),
    roomId: 'room-dormitorio',
    careTasks: [
      { id: 't4', type: 'riego', title: t('Riego de recuperación'), dueDate: t('En 4 días'), completed: false },
      { id: 't5', type: 'poda', title: t('Poda de brote apical'), dueDate: t('En 2 semanas'), completed: false },
    ],
  },
  {
    id: 'plant-3',
    name: 'Sansevieria Trifasciata',
    scientificName: 'Dracaena trifasciata',
    lastWatered: t('Hace 12 días'),
    isWateredToday: false,
    wateringFrequencyDays: 18,
    light: t('Cualquier iluminación'),
    avatarEmoji: '🌱',
    healthScore: 99,
    lastDiagnosis: t('Excelente resistencia'),
    roomId: 'room-oficina',
    careTasks: [
      { id: 't6', type: 'riego', title: t('Riego mensual ligero'), dueDate: t('En 6 días'), completed: false },
      { id: 't7', type: 'trasplante', title: t('Cambio a maceta de barro'), dueDate: t('En primavera'), completed: false },
    ],
  },
  {
    id: 'plant-4',
    name: 'Pothos Dorado',
    scientificName: 'Epipremnum aureum',
    lastWatered: t('Ayer'),
    isWateredToday: false,
    wateringFrequencyDays: 6,
    light: t('Luz indirecta'),
    avatarEmoji: '🍃',
    healthScore: 88,
    lastDiagnosis: t('Crecimiento activo'),
    roomId: 'room-cocina',
    careTasks: [
      { id: 't8', type: 'riego', title: t('Riego regular de superficie'), dueDate: t('En 5 días'), completed: false },
      { id: 't9', type: 'fertilizante', title: t('Humus de lombriz'), dueDate: t('En 15 días'), completed: false },
    ],
  },
];

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
  /** `true` cuando el estado persistido ya se cargó desde disco. */
  isHydrated: boolean;
  waterPlantToday: (id: string) => void;
  addPlant: (plant: NewPlantInput, roomId?: string) => string;
  addPlants: (plants: NewPlantInput[], roomId?: string) => number;
  removePlant: (id: string) => void;
  updatePlantHealth: (id: string, score: number, diagnosis: string) => void;
  toggleTaskCompleted: (plantId: string, taskId: string) => void;
  removeCareTask: (plantId: string, taskId: string) => void;
  assignPlantToRoom: (plantId: string, roomId?: string) => void;
  createRoom: (name: string, icon?: Room['icon']) => Room;
  removeRoom: (roomId: string) => void;
  registerIdentification: () => void;
  registerDiagnosis: () => void;
  resetDefaultPlants: () => void;
  resetStats: () => void;
  clearGarden: () => void;
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
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hidratación: lee el jardín persistido una sola vez al iniciar.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadJSON<PersistedGarden | null>(STORAGE_KEYS.garden, null);
      if (!active) return;
      if (stored) {
        setPlants(Array.isArray(stored.plants) ? stored.plants : []);
        setRooms(stored.rooms && stored.rooms.length > 0 ? stored.rooms : DEFAULT_ROOMS);
        const persistedStats = { ...INITIAL_STATS, ...(stored.stats ?? {}) };
        if (persistedStats.lastIdentificationDate !== dateKey()) {
          persistedStats.identificationsToday = 0;
        }
        setStatsState(persistedStats);
      } else if (__DEV__) {
        // Solo en desarrollo sembramos el jardín con datos de ejemplo.
        setPlants(INITIAL_PLANTS);
      }
      setIsHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persistencia: guarda en disco tras cada cambio, pero nunca antes de hidratar.
  useEffect(() => {
    if (!isHydrated) return;
    void saveJSON<PersistedGarden>(STORAGE_KEYS.garden, { plants, rooms, stats: statsState });
  }, [isHydrated, plants, rooms, statsState]);

  const waterPlantToday = (id: string) => {
    setPlants((prev) =>
      prev.map((plant) => {
        if (plant.id === id) {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          return { ...plant, lastWatered: t('Hoy a las {hora}', { hora: timeStr }), isWateredToday: true };
        }
        return plant;
      })
    );

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
    setPlants((prev) => prev.filter((p) => p.id !== id));
    deleteGrowthEntriesForPlant(id);
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

  const removeCareTask = (plantId: string, taskId: string) => {
    setPlants((prev) => prev.map((plant) => plant.id === plantId
      ? { ...plant, careTasks: plant.careTasks?.filter((task) => task.id !== taskId) }
      : plant));
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
    // Solo en desarrollo: restaurar el catálogo de ejemplo. En producción no
    // debe reaparecer información ficticia en el jardín del usuario.
    if (!__DEV__) return;
    setPlants(INITIAL_PLANTS);
  };

  const resetStats = () => {
    setStatsState(INITIAL_STATS);
  };

  const clearGarden = () => {
    setPlants([]);
    setRooms(DEFAULT_ROOMS);
    setStatsState(INITIAL_STATS);
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
        isHydrated,
        waterPlantToday,
        addPlant,
        addPlants,
        removePlant,
        updatePlantHealth,
        toggleTaskCompleted,
        removeCareTask,
        assignPlantToRoom,
        createRoom,
        removeRoom,
        registerIdentification,
        registerDiagnosis,
        resetDefaultPlants,
        resetStats,
        clearGarden,
      }}
    >
      {children}
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
