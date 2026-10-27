import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useFloatingBarMetrics } from '../hooks/useFloatingBarMetrics';
import { useGarden, GardenPlant, Room } from '../context/GardenContext';
import { usePremium } from '../context/PremiumContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { SkeletonBox } from '../components/SkeletonLoader';
import { ErrorBanner } from '../components/ErrorBanner';
import { BottomSheet } from '../components/BottomSheet';
import { ListRow } from '../components/ListRow';
import { Surface } from '../components/Surface';
import { GardenPlantCard } from '../components/garden/GardenPlantCard';
import { AddPlantModal, ManualPlantData } from '../components/garden/AddPlantModal';
import { PlantActionSheet } from '../components/garden/PlantActionSheet';
import { resolveSpeciesId } from '../services/plantApi';
import {
  getLocalWeatherAndRecommendations,
  WeatherRecommendationResult,
} from '../services/weatherService';
import { announce } from '../services/accessibilityService';
import { useTranslation } from '../i18n';
import { useFeedback } from '../context/FeedbackContext';

const speciesIdFor = (name: string, scientificName?: string): string =>
  resolveSpeciesId(name, scientificName) ?? 'monstera';

export const GardenScreen: React.FC = () => {
  const { colors, isDark, spacing, typography, layout } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { showToast, confirm } = useFeedback();
  const {
    plants,
    rooms,
    waterPlantToday,
    undoWaterPlant,
    removePlant,
    restorePlant,
    addCustomPlant,
    assignPlantToRoom,
    createRoom,
    removeRoom,
  } = useGarden();
  const { isPremium, price } = usePremium();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  // Modales
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedPlantForMenu, setSelectedPlantForMenu] = useState<GardenPlant | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [plantToMove, setPlantToMove] = useState<GardenPlant | null>(null);
  const [newRoomName, setNewRoomName] = useState('');

  // Clima
  const [weatherData, setWeatherData] = useState<WeatherRecommendationResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<boolean>(false);
  const [weatherRetryKey, setWeatherRetryKey] = useState<number>(0);

  // Carga inicial
  const [gardenLoading, setGardenLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => setGardenLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

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

  // Secciones agrupadas por zona
  const sections = useMemo(() => {
    const groupFor = (roomId: string | undefined): GardenPlant[] =>
      plants.filter((p) => (p.roomId ?? '') === (roomId ?? ''));

    const result: { key: string; room: Room | null; data: GardenPlant[] }[] = rooms.map((room) => ({
      key: room.id,
      room,
      data: groupFor(room.id),
    }));

    const unassigned = plants.filter((p) => !p.roomId || !rooms.some((r) => r.id === p.roomId));
    if (unassigned.length > 0) {
      result.push({ key: 'sin-zona', room: null, data: unassigned });
    }
    return result.filter((s) => s.data.length > 0);
  }, [plants, rooms]);

  const handleWaterSingle = (plant: GardenPlant) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const prevWatered = plant.lastWatered;
    const prevIsWatered = plant.isWateredToday;
    waterPlantToday(plant.id);
    announce(t('Planta {nombre} regada correctamente', { nombre: plant.name }));
    showToast({
      message: t('Regaste a {nombre}', { nombre: plant.name }),
      actionLabel: t('Deshacer'),
      durationMs: 5000,
      onAction: () => {
        undoWaterPlant(plant.id, prevWatered, prevIsWatered);
        announce(t('Riego deshecho'));
      },
    });
  };

  const handleDeletePlant = async (plant: GardenPlant) => {
    const confirmed = await confirm({
      title: t('¿Eliminar {nombre} del jardín?', { nombre: plant.name }),
      message: t('Se borrarán sus recordatorios y registros de cuidado.'),
      confirmText: t('Eliminar planta'),
      cancelText: t('Conservar'),
      isDestructive: true,
    });
    if (!confirmed) return;

    removePlant(plant.id);
    announce(t('Planta {nombre} eliminada del jardín', { nombre: plant.name }));
    showToast({
      message: t('Planta eliminada'),
      actionLabel: t('Deshacer'),
      durationMs: 5000,
      onAction: () => {
        restorePlant(plant);
        announce(t('Planta {nombre} restaurada', { nombre: plant.name }));
      },
    });
  };

  const handleOpenDetail = (plant: GardenPlant) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    navigation.navigate('PlantDetail', {
      plantId: speciesIdFor(plant.name, plant.scientificName),
      plantName: plant.name,
      scientificName: plant.scientificName,
    });
  };

  const handleCreateRoom = () => {
    const name = newRoomName.trim();
    if (!name) return;
    createRoom(name, 'home');
    setNewRoomName('');
    showToast({ message: t('Zona creada') });
  };

  const handleRemoveRoom = async (room: Room) => {
    const confirmed = await confirm({
      title: t('¿Eliminar zona "{zona}"?', { zona: room.name }),
      message: t('Las plantas asignadas quedarán sin zona.'),
      confirmText: t('Eliminar zona'),
      cancelText: t('Conservar'),
      isDestructive: true,
    });
    if (confirmed) {
      removeRoom(room.id);
      showToast({ message: t('Zona eliminada') });
    }
  };

  const handleAddManualPlant = (data: ManualPlantData | string) => {
    const name = typeof data === 'string' ? data : data.name;
    const nickname = typeof data === 'string' ? undefined : data.nickname;
    const potSize = typeof data === 'string' ? undefined : data.potSize;
    const imageUri = typeof data === 'string' ? undefined : data.imageUri;

    addCustomPlant(name, { nickname, potSize, imageUri });
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    showToast({
      message: nickname
        ? t('Añadida {nombre} ("{apodo}") a tu jardín', { nombre: name, apodo: nickname })
        : t('Añadida {nombre} a tu jardín', { nombre: name }),
      type: 'success',
    });
  };

  // HEADER DE ACCESOS RÁPIDOS
  const renderQuickShortcuts = () => (
    <View style={styles.shortcutsRow}>
      {[
        { title: t('Enciclopedia'), icon: 'book', route: 'Encyclopedia', color: colors.primary },
        { title: t('Asistente'), icon: 'chatbubbles', route: 'Assistant', color: colors.accent },
        { title: t('Logros'), icon: 'trophy', route: 'Achievements', color: colors.premiumGold },
        { title: t('Calendario'), icon: 'calendar', route: 'CareCalendar', color: colors.primary },
      ].map((item) => (
        <Pressable
          key={item.route}
          onPress={() => navigation.navigate(item.route)}
          style={({ pressed }) => [
            styles.shortcutItem,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
              borderWidth: 1,
              borderRadius: layout.borderRadius.lg,
              overflow: 'hidden',
              opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1,
            },
          ]}
          android_ripple={{ color: colors.outlineVariant, borderless: false }}
          accessibilityRole="button"
          accessibilityLabel={t('Abrir {seccion}', { seccion: item.title })}
        >
          <View style={[styles.shortcutIconCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name={item.icon as any} size={20} color={item.color} />
          </View>
          <Text style={[typography.caption1, { color: colors.textPrimary, marginTop: 4, fontWeight: '600' }]}>
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // CLIMA RESUMEN (para Pro)
  const renderWeatherBanner = () => {
    if (!isPremium) {
      return (
        <Card
          variant="flat"
          style={[
            styles.weatherCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: layout.borderRadius.lg,
            },
          ]}
        >
          <View style={styles.weatherTeaserRow}>
            <View style={[styles.weatherIconCircle, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="sunny-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                {t('Recomendaciones por Clima')}
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                {t('Ajusta el riego automáticamente según lluvia y calor')}
              </Text>
            </View>
            <Badge label="PRO" variant="premium" />
          </View>
        </Card>
      );
    }

    if (weatherLoading) {
      return <SkeletonBox width="100%" height={74} borderRadius={24} style={{ marginBottom: spacing.md }} />;
    }

    if (weatherData && weatherData.weather) {
      const w = weatherData.weather;
      return (
        <Card
          variant="flat"
          style={[
            styles.weatherCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: layout.borderRadius.lg,
            },
          ]}
        >
          <View style={styles.weatherTeaserRow}>
            <Ionicons name="partly-sunny" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-sharp" size={15} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  {w.city} · {Math.round(w.temperatureC)}°C
                </Text>
              </View>
              <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                {weatherData.adjustment.wateringAdvice}
              </Text>
            </View>
          </View>
        </Card>
      );
    }

    return null;
  };

  const { fabBottom } = useFloatingBarMetrics();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: Math.max(insets.top, spacing.md),
          paddingBottom: fabBottom + 68,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ScreenHeader
              title={t('Mi Jardín')}
              subtitle={
                plants.length === 1
                  ? t('1 planta bajo tu cuidado')
                  : t('{n} plantas bajo tu cuidado', { n: plants.length })
              }
            />

            {renderWeatherBanner()}
            {renderQuickShortcuts()}

            {/* BARRA DE GESTIÓN DE ZONAS */}
            {plants.length > 0 ? (
              <View style={styles.zonesBar}>
                <Text style={[typography.title3, { color: colors.textPrimary, fontWeight: '800' }]}>
                  {t('Tus Plantas')}
                </Text>
                <Pressable
                  onPress={() => setRoomModalOpen(true)}
                  style={({ pressed }) => [
                    styles.manageZonesButton,
                    {
                      borderRadius: layout.borderRadius.md,
                      overflow: 'hidden',
                      opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1,
                    },
                  ]}
                  android_ripple={{ color: 'rgba(27, 106, 59, 0.12)', borderless: false }}
                  accessibilityRole="button"
                  accessibilityLabel={t('Organizar por zonas')}
                >
                  <Ionicons name="grid-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '700' }]}>
                    {t('Zonas')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Ionicons
              name={(section.room?.icon as any) || 'leaf-outline'}
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[typography.headline, { color: colors.textPrimary }]}>
              {section.room?.name || t('Sin zona')}
            </Text>
            <Text style={[typography.caption1, { color: colors.textTertiary, marginLeft: 8 }]}>
              ({section.data.length})
            </Text>
          </View>
        )}
        renderItem={({ item, section }) => (
          <GardenPlantCard
            plant={item}
            roomName={section.room?.name}
            onPress={() => handleOpenDetail(item)}
            onWater={() => handleWaterSingle(item)}
            onOptionsPress={() => setSelectedPlantForMenu(item)}
          />
        )}
        ListEmptyComponent={
          gardenLoading ? (
            <View style={{ gap: 12, marginTop: 12 }}>
              <SkeletonBox width="100%" height={120} borderRadius={16} />
              <SkeletonBox width="100%" height={120} borderRadius={16} />
            </View>
          ) : (
            <EmptyState
              iconName="leaf-outline"
              title={t('Tu jardín está esperando')}
              description={t('Escanea o busca tu primera planta para comenzar a cuidarla.')}
              actionTitle={t('Escanear primera planta')}
              onActionPress={() => navigation.navigate('Scan')}
            />
          )
        }
      />

      {/* BOTÓN FLOTANTE: + AÑADIR PLANTA (Material 3 Extended FAB) */}
      <View
        style={[styles.fabContainer, { bottom: fabBottom }]}
        pointerEvents="box-none"
      >
        <Surface
          variant="elevated"
          elevation={3}
          borderRadius={16}
          style={[styles.fabSurface, { backgroundColor: colors.primaryContainer }]}
        >
          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              setAddModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.fabInner,
              { opacity: pressed && Platform.OS === 'ios' ? 0.85 : 1 },
            ]}
            android_ripple={{ color: colors.onPrimaryContainer + '25', borderless: false }}
            accessibilityRole="button"
            accessibilityLabel={t('Añadir planta')}
          >
            <Ionicons name="add" size={24} color={colors.onPrimaryContainer} style={{ marginRight: 6 }} />
            <Text style={[typography.headline, { color: colors.onPrimaryContainer, fontWeight: '700' }]}>
              {t('Añadir planta')}
            </Text>
          </Pressable>
        </Surface>
      </View>

      {/* MODAL: AÑADIR PLANTA (Escanear / Catálogo / Manual) */}
      <AddPlantModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onScan={() => navigation.navigate('Scan')}
        onSearchCatalog={() => navigation.navigate('Encyclopedia')}
        onAddManual={handleAddManualPlant}
      />

      {/* MENÚ CONTEXTUAL "⋯" DE PLANTA */}
      <PlantActionSheet
        visible={Boolean(selectedPlantForMenu)}
        plant={selectedPlantForMenu}
        onClose={() => setSelectedPlantForMenu(null)}
        onWater={() => {
          if (selectedPlantForMenu) handleWaterSingle(selectedPlantForMenu);
        }}
        onChangeRoom={() => {
          if (selectedPlantForMenu) {
            setPlantToMove(selectedPlantForMenu);
            setRoomModalOpen(true);
          }
        }}
        onViewDetails={() => {
          if (selectedPlantForMenu) handleOpenDetail(selectedPlantForMenu);
        }}
        onDelete={() => {
          if (selectedPlantForMenu) handleDeletePlant(selectedPlantForMenu);
        }}
      />

      {/* MODAL: GESTIÓN DE ZONAS */}
      <BottomSheet
        visible={roomModalOpen}
        onClose={() => {
          setRoomModalOpen(false);
          setPlantToMove(null);
        }}
        title={plantToMove ? t('Mover {nombre}', { nombre: plantToMove.name }) : t('Zonas del jardín')}
        subtitle={
          plantToMove
            ? t('Elige la zona para esta planta')
            : t('Organiza tus plantas por habitaciones o espacios')
        }
      >
        <View style={{ paddingBottom: spacing.lg }}>
          {plantToMove ? (
            <View style={{ marginBottom: spacing.md }}>
              <ListRow
                leadingIcon="remove-circle-outline"
                title={t('Sin zona')}
                onPress={() => {
                  assignPlantToRoom(plantToMove.id, undefined);
                  showToast({ message: t('Planta desasignada de zona') });
                  setPlantToMove(null);
                  setRoomModalOpen(false);
                }}
              />
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              {rooms.map((r) => (
                <View key={r.id}>
                  <ListRow
                    leadingIcon={r.icon}
                    title={r.name}
                    onPress={() => {
                      assignPlantToRoom(plantToMove.id, r.id);
                      showToast({ message: t('Movida a {zona}', { zona: r.name }) });
                      setPlantToMove(null);
                      setRoomModalOpen(false);
                    }}
                  />
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                </View>
              ))}
            </View>
          ) : (
            <>
              {rooms.map((r) => (
                <View key={r.id}>
                  <ListRow
                    leadingIcon={r.icon}
                    title={r.name}
                    subtitle={t('{n} plantas', { n: plants.filter((p) => p.roomId === r.id).length })}
                    trailing={
                      <Pressable
                        onPress={() => handleRemoveRoom(r)}
                        accessibilityRole="button"
                        accessibilityLabel={t('Eliminar zona {zona}', { zona: r.name })}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        android_ripple={{ color: colors.error + '25', borderless: true, radius: 22 }}
                        style={({ pressed }) => [
                          { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
                          pressed && Platform.OS === 'ios' && { opacity: 0.6 },
                        ]}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                      </Pressable>
                    }
                  />
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                </View>
              ))}

              <View style={styles.newRoomRow}>
                <TextInput
                  value={newRoomName}
                  onChangeText={setNewRoomName}
                  placeholder={t('Nueva zona (ej. Terraza)...')}
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.roomInput,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      borderRadius: layout.borderRadius.md,
                      backgroundColor: colors.surfaceSecondary,
                    },
                  ]}
                />
                <Button
                  title={t('Crear')}
                  onPress={handleCreateRoom}
                  disabled={!newRoomName.trim()}
                  variant="primary"
                  style={{ marginLeft: spacing.sm }}
                />
              </View>
            </>
          )}
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  weatherCard: {
    padding: 14,
    marginBottom: 14,
    borderRadius: 16,
  },
  weatherTeaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  shortcutItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 64,
  },
  shortcutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  manageZonesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabSurface: {
    overflow: 'hidden',
    elevation: 3,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    minHeight: 48,
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  newRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  roomInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
