import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useGarden, GardenPlant, Room } from '../context/GardenContext';
import { usePremium } from '../context/PremiumContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConfidenceRing } from '../components/ConfidenceRing';
import { EmptyState } from '../components/EmptyState';
import { PlantCardSkeleton, SkeletonBox } from '../components/SkeletonLoader';
import { ErrorBanner } from '../components/ErrorBanner';
import { searchPlants } from '../services/plantApi';
import {
  getLocalWeatherAndRecommendations,
  WeatherRecommendationResult,
} from '../services/weatherService';
import { scheduleWateringReminder } from '../services/notificationService';

// Resuelve el ID de especie del catálogo a partir de un nombre de jardín
const resolveSpeciesId = (gardenPlantName: string): string => {
  const name = gardenPlantName.toLowerCase();
  const tokens = name.split(/[^a-záéíóúñü]+/i).filter((t) => t.length > 3);
  const candidates = searchPlants('');
  const match = candidates.find((p) =>
    tokens.some(
      (t) => p.name.toLowerCase().includes(t) || p.scientificName.toLowerCase().includes(t)
    )
  );
  return match?.id ?? 'monstera';
};

export const GardenScreen: React.FC = () => {
  const { colors, isDark, spacing, typography, layout } = useAppTheme();
  const {
    plants,
    rooms,
    waterPlantToday,
    toggleTaskCompleted,
    resetDefaultPlants,
    assignPlantToRoom,
    createRoom,
    removeRoom,
  } = useGarden();
  const { isPremium, price } = usePremium();
  const navigation = useNavigation<any>();

  // Estado del organizador de zonas
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');

  // Estado meteorológico
  const [weatherData, setWeatherData] = useState<WeatherRecommendationResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<boolean>(false);
  const [weatherRetryKey, setWeatherRetryKey] = useState<number>(0);

  // Estado de carga inicial de la lista de plantas
  const [gardenLoading, setGardenLoading] = useState<boolean>(true);

  // Skeleton inicial del jardín
  useEffect(() => {
    const timer = setTimeout(() => setGardenLoading(false), 850);
    return () => clearTimeout(timer);
  }, []);

  // Carga del clima SOLO para usuarios Premium (bloque exclusivo Pro)
  useEffect(() => {
    let isMounted = true;
    if (!isPremium) {
      setWeatherData(null);
      setWeatherError(false);
      setWeatherLoading(false);
      return;
    }
    (async () => {
      setWeatherLoading(true);
      setWeatherError(false);
      try {
        const res = await getLocalWeatherAndRecommendations();
        if (isMounted) {
          setWeatherData(res);
          // isMockFallback = la API real falló y estamos mostrando datos de respaldo
          setWeatherError(res.isMockFallback);
        }
      } catch {
        if (isMounted) setWeatherError(true);
      } finally {
        if (isMounted) setWeatherLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isPremium, weatherRetryKey]);

  const handleRetryWeather = () => setWeatherRetryKey((k) => k + 1);

  const handleWater = (plant: GardenPlant) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    waterPlantToday(plant.id);
  };

  const handleOpenDiagnosis = (plant: GardenPlant) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    navigation.navigate('HealthDiagnosis', { plantId: resolveSpeciesId(plant.name) });
  };

  const handleOpenDetail = (plant: GardenPlant) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    navigation.navigate('PlantDetail', { plantId: resolveSpeciesId(plant.name) });
  };

  const handleSchedulePlantReminder = async (plant: GardenPlant) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const id = await scheduleWateringReminder(plant.name, plant.wateringFrequencyDays);
    if (id) {
      Alert.alert(
        '🔔 Notificación Programada',
        `Recibirás un recordatorio para regar tu ${plant.name} cada ${plant.wateringFrequencyDays} días.`
      );
    } else {
      Alert.alert('Aviso', 'Activa los permisos de notificaciones para recibir alertas de riego.');
    }
  };

  // Seciones agrupadas por habitación/zona (punto 14)
  const sections = useMemo(() => {
    const groupFor = (roomId: string | undefined, fallback: string): GardenPlant[] =>
      plants.filter((p) => (p.roomId ?? '') === (roomId ?? ''));

    const result: { key: string; room: Room | null; data: GardenPlant[] }[] = rooms.map((room) => ({
      key: room.id,
      room,
      data: groupFor(room.id, room.name),
    }));

    const unassigned = plants.filter((p) => !p.roomId || !rooms.some((r) => r.id === p.roomId));
    if (unassigned.length > 0) {
      result.push({ key: 'sin-zona', room: null, data: unassigned });
    }
    return result.filter((s) => s.data.length > 0);
  }, [plants, rooms]);

  const openRoomModal = () => {
    setRoomModalOpen(true);
    setSelectedPlantId(null);
  };

  const handleAssignPlant = (plantId: string) => {
    try { Haptics.selectionAsync(); } catch {}
    setSelectedPlantId(plantId);
  };

  const handleAssignToRoom = (roomId?: string) => {
    if (!selectedPlantId) return;
    assignPlantToRoom(selectedPlantId, roomId);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    setSelectedPlantId(null);
  };

  const handleCreateRoom = () => {
    const name = newRoomName.trim();
    if (!name) return;
    createRoom(name, 'home');
    setNewRoomName('');
  };

  // RENDER: Bloque de Clima y Recomendaciones (Premium vs Free Teaser)
  const renderWeatherBlock = () => {
    if (!isPremium) {
      // TEASER PARA USUARIOS GRATUITOS
      return (
        <Card
          style={[
            styles.weatherLockedCard,
            {
              backgroundColor: isDark ? '#251D08' : '#FFFDF0',
              borderColor: colors.premiumGold,
              marginBottom: spacing.md,
            },
          ]}
          accessible={true}
          accessibilityLabel="Recomendaciones de clima y ubicación, exclusivo para usuarios Premium"
        >
          <View style={styles.weatherLockedHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="sparkles" size={18} color={colors.premiumGold} />
              <Text
                style={[
                  typography.headline,
                  { color: colors.textPrimary, marginLeft: 6, fontWeight: '700' },
                ]}
              >
                Recomendaciones por Clima y GPS
              </Text>
            </View>
            <Badge label="Exclusivo Pro" variant="premium" />
          </View>

          <Text style={[typography.body, { color: colors.textSecondary, marginTop: 6, lineHeight: 21 }]}>
            Conecta tu ubicación con satélites meteorológicos en tiempo real (Open-Meteo) para ajustar automáticamente el riego según lluvia, frío o calor extremo.
          </Text>

          <View style={{ marginTop: spacing.md }}>
            <Button
              title={`Desbloquear con Plantae Pro (${price})`}
              onPress={() => navigation.navigate('Perfil')}
              variant="premium"
              size="sm"
              icon={<Ionicons name="lock-open" size={16} color="#1C1C1E" />}
            />
          </View>
        </Card>
      );
    }

    // ESTADO DE CARGA (esqueletos)
    if (weatherLoading || !weatherData) {
      return (
        <Card style={{ marginBottom: spacing.md }} accessible={true} accessibilityLabel="Cargando pronóstico del clima">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="cloudy-night" size={16} color={colors.primary} />
            <Text style={[typography.subheadline, { color: colors.textSecondary, marginLeft: 8 }]}>
              Sincronizando pronóstico Open-Meteo para tu ciudad...
            </Text>
          </View>
          <SkeletonBox width="100%" height={16} borderRadius={6} />
          <SkeletonBox width="75%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
          <SkeletonBox width="90%" height={52} borderRadius={10} style={{ marginTop: 10 }} />
        </Card>
      );
    }

    const { weather, adjustment } = weatherData;

    return (
      <View>
        {/* ESTADO DE ERROR: datos de respaldo porque la API falló */}
        {weatherError && (
          <ErrorBanner
            message="No pudimos conectar con tu ubicación. Mostramos datos de respaldo: activa el GPS o revisa tu conexión para obtener recomendaciones reales."
            onRetry={handleRetryWeather}
            style={{ marginBottom: spacing.sm }}
          />
        )}

        <Card
          elevated
          style={[
            styles.weatherActiveCard,
            {
              borderColor: colors.primary,
              borderLeftWidth: 4,
              marginBottom: spacing.md,
            },
          ]}
          accessible={true}
          accessibilityLabel={`Clima en ${weather.city}: ${weather.temperatureC} grados, ${adjustment.alertTitle}`}
        >
          <View style={styles.weatherTopRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 4, fontWeight: '600' }]}>
                  {weather.city}
                </Text>
                {weatherData.isMockFallback && (
                  <Badge label="Datos de respaldo" variant="neutral" />
                )}
              </View>
              <Text style={[typography.title2, { color: colors.textPrimary, fontWeight: '700', marginTop: 2 }]}>
                {weather.temperatureC}°C • {weather.weatherDescription}
              </Text>
            </View>

            <View style={[styles.weatherBadgeBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={weather.weatherIcon as any} size={24} color={colors.primary} />
            </View>
          </View>

          {/* ALERTA Y RECOMENDACIÓN INTELIGENTE */}
          <View
            style={[
              styles.adviceBox,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#F1F8E9',
                marginTop: spacing.sm,
              },
            ]}
          >
            <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700' }]}>
              {adjustment.alertTitle}
            </Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
              {adjustment.alertMessage}
            </Text>
            <View style={[styles.advicePill, { marginTop: 6 }]}>
              <Ionicons name="water" size={13} color={colors.primary} />
              <Text style={[typography.caption2, { color: colors.primary, fontWeight: '600', marginLeft: 4 }]}>
                Consejo de hoy: {adjustment.wateringAdvice}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  // RENDER: Elemento de Planta en Mi Jardín
  const renderPlantItem = ({ item }: { item: GardenPlant }) => {
    return (
      <Card elevated style={{ marginBottom: spacing.md }}>
        <View style={styles.cardHeader}>
          {/* Avatar */}
          <TouchableOpacity
            onPress={() => handleOpenDetail(item)}
            style={[
              styles.avatarContainer,
              {
                backgroundColor: item.isWateredToday ? colors.primaryLight : colors.surfaceSecondary,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalles de ${item.name}`}
          >
            <Text style={styles.avatarEmoji}>{item.avatarEmoji}</Text>
          </TouchableOpacity>

          {/* Información Botánica */}
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View style={styles.badgeRow}>
              <Badge
                label={item.isWateredToday ? 'Hidratada hoy' : `Cada ${item.wateringFrequencyDays} días`}
                variant={item.isWateredToday ? 'success' : 'neutral'}
                icon={
                  <Ionicons
                    name={item.isWateredToday ? 'checkmark-circle' : 'time-outline'}
                    size={13}
                    color={item.isWateredToday ? colors.primary : colors.textSecondary}
                  />
                }
              />
            </View>

            <TouchableOpacity onPress={() => handleOpenDetail(item)}>
              <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 4 }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[typography.footnote, { color: colors.textTertiary, fontStyle: 'italic', marginTop: 1 }]} numberOfLines={1}>
                {item.scientificName}
              </Text>
            </TouchableOpacity>

            <Text style={[typography.caption2, { color: colors.textSecondary, marginTop: 4 }]}>
              {item.lastWatered}
            </Text>
          </View>

          {/* PUNTUACIÓN DE SALUD (0-100) CON ANILLO ANIMADO HIG */}
          <TouchableOpacity
            onPress={() => handleOpenDiagnosis(item)}
            style={styles.healthScoreContainer}
            accessibilityRole="button"
            accessibilityLabel={`Salud de ${item.name}: ${item.healthScore} por ciento. Toca para diagnosticar.`}
          >
            <ConfidenceRing
              score={item.healthScore}
              size={54}
              strokeWidth={5}
              colorVariant="health"
              label="Salud"
            />
          </TouchableOpacity>
        </View>

        {/* TAREAS ACTIVAS DEL PLAN DE CUIDADOS */}
        {item.careTasks && item.careTasks.length > 0 && (
          <View style={[styles.careTasksSection, { borderTopColor: colors.border }]}>
            <Text style={[typography.caption1, { color: colors.textTertiary, marginBottom: 4, fontWeight: '600' }]}>
              Plan de cuidados:
            </Text>
            {item.careTasks.slice(0, 2).map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  toggleTaskCompleted(item.id, task.id);
                }}
                style={styles.taskRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.completed }}
                accessibilityLabel={`${task.title}, ${task.dueDate}, ${task.completed ? 'completada' : 'pendiente'}`}
                accessibilityHint="Toca para marcar o desmarcar esta tarea"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name={task.completed ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={task.completed ? colors.primary : colors.textTertiary}
                />
                <Text
                  style={[
                    typography.footnote,
                    {
                      color: task.completed ? colors.textTertiary : colors.textPrimary,
                      textDecorationLine: task.completed ? 'line-through' : 'none',
                      flex: 1,
                      marginLeft: 8,
                    },
                  ]}
                >
                  {task.title} ({task.dueDate})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* BOTONES DE ACCIÓN HIG (44x44 MÍNIMO) */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: item.isWateredToday ? colors.surfaceSecondary : colors.primary,
                borderColor: item.isWateredToday ? colors.border : colors.primary,
              },
            ]}
            onPress={() => handleWater(item)}
            accessibilityRole="button"
            accessibilityLabel={item.isWateredToday ? 'Volver a regar' : 'Marcar como regada hoy'}
          >
            <Ionicons
              name={item.isWateredToday ? 'checkmark' : 'water'}
              size={18}
              color={item.isWateredToday ? colors.textPrimary : '#FFFFFF'}
            />
            <Text
              style={[
                typography.subheadline,
                {
                  color: item.isWateredToday ? colors.textPrimary : '#FFFFFF',
                  fontWeight: '600',
                  marginLeft: 6,
                },
              ]}
            >
              {item.isWateredToday ? 'Regada' : 'Regar hoy'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => handleOpenDiagnosis(item)}
            accessibilityRole="button"
            accessibilityLabel={`Diagnosticar salud de ${item.name}`}
          >
            <Ionicons name="medkit-outline" size={18} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => handleSchedulePlantReminder(item)}
            accessibilityRole="button"
            accessibilityLabel={`Programar recordatorios para ${item.name}`}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => handleOpenDetail(item)}
            accessibilityRole="button"
            accessibilityLabel={`Ver ficha completa de ${item.name}`}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const quickLinks = [
    { label: 'Enciclopedia', icon: 'book-outline' as const, route: 'Encyclopedia' },
    { label: 'Asistente', icon: 'chatbubbles-outline' as const, route: 'Assistant' },
    { label: 'Logros', icon: 'trophy-outline' as const, route: 'Achievements' },
    { label: 'Calendario', icon: 'calendar-outline' as const, route: 'CareCalendar' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderPlantItem}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { marginTop: section.room ? spacing.lg : spacing.lg }]}>
            <View style={[styles.roomIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons
                name={section.room ? section.room.icon : 'remove-outline'}
                size={16}
                color={colors.primary}
              />
            </View>
            <Text style={[typography.title3, { color: colors.textPrimary, marginLeft: spacing.xs }]}>
              {section.room ? section.room.name : 'Sin zona'}
            </Text>
            <Text style={[typography.caption1, { color: colors.textTertiary, marginLeft: 6 }]}>
              · {section.data.length} {section.data.length === 1 ? 'planta' : 'plantas'}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              title="Mi Jardín"
              subtitle={`${plants.length} plantas bajo tu cuidado`}
              rightAction={
                <TouchableOpacity
                  onPress={() => navigation.navigate('Escáner')}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}
                  accessibilityRole="button"
                  accessibilityLabel="Identificar nueva planta con la cámara"
                >
                  <Ionicons name="camera" size={22} color={colors.primary} />
                </TouchableOpacity>
              }
            />

            {/* BLOQUE DE CLIMA Y UBICACIÓN (PREMIUM RECOMENDACIONES) */}
            {renderWeatherBlock()}

            {/* ACCESO RÁPIDO A NUEVAS SECCIONES (Enciclopedia / Asistente / Logros / Calendario) */}
            <View style={styles.quickLinks}>
              {quickLinks.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => navigation.navigate(link.route)}
                  style={styles.quickLink}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${link.label}`}
                >
                  <View style={[styles.quickIcon, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name={link.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 4, fontWeight: '600' }]}>
                    {link.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {plants.length > 0 && (
              <View style={styles.listSectionHeader}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  Mis Especies Registradas
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    onPress={openRoomModal}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Organizar plantas por zona"
                    style={{ minHeight: 44, justifyContent: 'center' }}
                  >
                    <Text style={[typography.footnote, { color: colors.primary, fontWeight: '600' }]}>
                      Organizar zonas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={resetDefaultPlants}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Restablecer las plantas de ejemplo del jardín"
                    style={{ minHeight: 44, justifyContent: 'center' }}
                  >
                    <Text style={[typography.footnote, { color: colors.textTertiary, fontWeight: '600' }]}>
                      Restablecer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          gardenLoading ? null : (
            <EmptyState
              iconName="leaf-outline"
              title="Tu jardín está esperando"
              description="Escanea o fotografía tu primera planta para comenzar a monitorear su salud, calendario de riego y origen biogeográfico."
              actionTitle="Escanear primera planta"
              onActionPress={() => navigation.navigate('Escáner')}
            />
          )
        }
        ListFooterComponent={
          gardenLoading ? (
            <View accessible={true} accessibilityLabel="Cargando tus plantas">
              <PlantCardSkeleton />
              <PlantCardSkeleton />
              <PlantCardSkeleton />
            </View>
          ) : null
        }
      />

      {/* ORGANIZADOR DE ZONAS */}
      <Modal
        visible={roomModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRoomModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={{ width: '100%' }} elevated>
            <View style={styles.modalHeader}>
              <Text style={[typography.title3, { color: colors.textPrimary }]}>Organizar por zonas</Text>
              <TouchableOpacity
                onPress={() => setRoomModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[typography.caption1, { color: colors.textSecondary }]}>
              1. Elige una planta · 2. Asigna su zona
            </Text>

            <View style={styles.chipWrap}>
              {plants.map((plant) => {
                const selected = selectedPlantId === plant.id;
                return (
                  <TouchableOpacity
                    key={plant.id}
                    onPress={() => handleAssignPlant(plant.id)}
                    style={[styles.selectChip, {
                      backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
                      borderColor: selected ? colors.primary : colors.border,
                      borderRadius: layout.borderRadius.full,
                    }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Planta ${plant.name}`}
                  >
                    {plant.roomId ? <Ionicons name="location" size={12} color={selected ? '#FFFFFF' : colors.textSecondary} /> : null}
                    <Text style={[typography.caption1, { color: selected ? '#FFFFFF' : colors.textPrimary, fontWeight: '600', marginLeft: 4 }]} numberOfLines={1}>
                      {plant.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: spacing.sm }]} />

            <View style={styles.chipWrap}>
              {rooms.map((room) => {
                const count = plants.filter((p) => p.roomId === room.id).length;
                return (
                  <View key={room.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => handleAssignToRoom(room.id)}
                      disabled={!selectedPlantId}
                      style={[styles.selectChip, {
                        backgroundColor: !selectedPlantId ? colors.surfaceSecondary : colors.primaryLight,
                        borderColor: colors.border,
                        borderRadius: layout.borderRadius.full,
                        opacity: selectedPlantId ? 1 : 0.5,
                      }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Asignar a ${room.name}, ${count} plantas`}
                    >
                      <Ionicons name={room.icon} size={13} color={colors.primary} />
                      <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '600', marginLeft: 4 }]}>
                        {room.name} ({count})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeRoom(room.id)}
                      style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar zona ${room.name}`}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <View style={styles.newRoomRow}>
              <TextInput
                value={newRoomName}
                onChangeText={setNewRoomName}
                placeholder="Nueva zona (ej. Baño)..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.newRoomInput, { color: colors.textPrimary, backgroundColor: colors.surfaceSecondary, borderRadius: layout.borderRadius.md }]}
                accessibilityLabel="Nombre de la nueva zona"
              />
              <TouchableOpacity
                onPress={handleCreateRoom}
                disabled={!newRoomName.trim()}
                style={[styles.newRoomButton, { backgroundColor: newRoomName.trim() ? colors.primary : colors.border, borderRadius: layout.borderRadius.md }]}
                accessibilityRole="button"
                accessibilityLabel="Crear zona"
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weatherLockedCard: {
    borderWidth: 1.5,
  },
  weatherLockedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherActiveCard: {
    borderWidth: 1,
  },
  weatherTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherBadgeBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceBox: {
    padding: 10,
    borderRadius: 10,
  },
  advicePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTasksSection: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44, // HIG 44x44
    paddingVertical: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  quickLink: {
    alignItems: 'center',
    width: 72,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  roomIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '78%',
  },
  separator: {
    height: 1,
  },
  newRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  newRoomInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  newRoomButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
