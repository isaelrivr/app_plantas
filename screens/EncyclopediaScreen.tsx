import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { BottomSheet } from '../components/BottomSheet';
import { FilterChip } from '../components/FilterChip';
import { EmptyState } from '../components/EmptyState';
import { useGarden } from '../context/GardenContext';
import {
  DEFAULT_FILTERS,
  EncyclopediaFilters,
  LightFilter,
  DifficultyFilter,
  EnvironmentFilter,
  lightFilters,
  difficultyFilters,
  environmentFilters,
  searchEncyclopedia,
  getPlantsByIds,
  countActiveFilters,
  normalizeDiacritics,
} from '../services/encyclopediaService';
import { isPetSafe } from '../services/toxicityService';
import { resolveSpeciesId, CatalogPlant, searchOrGeneratePlantWithGemini } from '../services/plantApi';
import { isGeminiDirectAvailable } from '../services/geminiService';
import { getPlantImageSource } from '../services/plantAssets';
import { useTranslation } from '../i18n';
import { useFeedback } from '../context/FeedbackContext';

const PlantThumb: React.FC<{ id?: string; uri?: string; emoji?: string; name: string }> = ({ id, uri, emoji, name }) => {
  const { colors, layout } = useAppTheme();
  const [error, setError] = useState(false);
  const source = getPlantImageSource(uri, id);

  if (source && !error) {
    return (
      <Image
        source={source}
        style={[styles.thumb, { borderRadius: layout.borderRadius.md }]}
        accessible
        accessibilityLabel={name}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.thumb,
        styles.avatarPlaceholder,
        { backgroundColor: colors.primaryLight, borderRadius: layout.borderRadius.md },
      ]}
    >
      <Text style={{ fontSize: 28 }}>{emoji || '🌿'}</Text>
    </View>
  );
};

export const EncyclopediaScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { plants } = useGarden();
  const { t } = useTranslation();
  const { showToast } = useFeedback();

  const [filters, setFilters] = useState<EncyclopediaFilters>(DEFAULT_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [petSafeOnly, setPetSafeOnly] = useState(false);
  const [generatingWithAi, setGeneratingWithAi] = useState(false);

  const handleGenerateWithAi = async () => {
    const q = filters.query.trim();
    if (!q || generatingWithAi) return;
    try {
      Haptics.selectionAsync();
    } catch {}
    setGeneratingWithAi(true);
    try {
      const generated = await searchOrGeneratePlantWithGemini(q);
      if (generated) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        navigation.navigate('PlantDetail', {
          plantId: generated.id,
          plantName: generated.name,
          scientificName: generated.scientificName,
        });
      } else {
        showToast({
          message: t('No pudimos generar la información. Intenta con otro nombre.'),
          type: 'error',
        });
      }
    } catch {
      showToast({
        message: t('Error al conectar con Gemini. Revisa tu conexión.'),
        type: 'error',
      });
    } finally {
      setGeneratingWithAi(false);
    }
  };

  const savedSpeciesIds = useMemo(
    () =>
      Array.from(
        new Set(
          plants
            .map((p) => resolveSpeciesId(p.name, p.scientificName))
            .filter((id): id is string => Boolean(id))
        )
      ),
    [plants]
  );

  const results = useMemo(() => {
    let list: CatalogPlant[] = [];
    if (offlineOnly) {
      const saved = getPlantsByIds(savedSpeciesIds);
      const q = normalizeDiacritics(filters.query);
      list = q
        ? saved.filter((p) =>
            normalizeDiacritics(`${p.name} ${p.scientificName} ${p.family}`).includes(q)
          )
        : saved;
    } else {
      list = searchEncyclopedia(filters);
    }
    if (petSafeOnly) {
      list = list.filter((p) => isPetSafe(p.id));
    }
    return list;
  }, [filters, offlineOnly, petSafeOnly, savedSpeciesIds]);

  const activeFilters = countActiveFilters(filters);

  const update = <K extends keyof EncyclopediaFilters>(key: K, value: EncyclopediaFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleOpenDetail = (plant: CatalogPlant) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    navigation.navigate('PlantDetail', {
      plantId: plant.id,
      plantName: plant.name,
      scientificName: plant.scientificName,
    });
  };

  const renderPlantItem = ({ item }: { item: CatalogPlant }) => {
    const petSafe = isPetSafe(item.id);
    return (
      <Card
        variant="flat"
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.surface,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          },
        ]}
      >
        <Pressable
          onPress={() => handleOpenDetail(item)}
          android_ripple={{ color: colors.primaryLight }}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.scientificName}. ${t('Dificultad')} ${item.difficulty}`}
          style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.85 }]}
        >
          <PlantThumb id={item.id} uri={item.imageUri} emoji={item.avatarEmoji} name={item.name} />

          <View style={styles.itemInfo}>
            <View style={styles.titleRow}>
              <Text
                style={[typography.headline, { color: colors.textPrimary, flex: 1, fontWeight: '800' }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {petSafe ? (
                <View style={styles.petSafeBadge}>
                  <Ionicons name="paw" size={13} color="#2E7D32" />
                </View>
              ) : null}
            </View>

            <Text
              style={[typography.caption1, { color: colors.textSecondary, fontStyle: 'italic', marginTop: 1 }]}
              numberOfLines={1}
            >
              {item.scientificName}
            </Text>

            <View style={styles.badgesRow}>
              <Badge label={item.difficulty} variant="neutral" />
              <View style={{ width: 6 }} />
              <Badge label={item.light} variant="neutral" />
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} style={{ marginLeft: 8 }} />
        </Pressable>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER NAVEGACIÓN */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surfaceContainer,
            borderBottomColor: colors.outlineVariant,
            paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 12),
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          android_ripple={{ color: colors.primaryLight, borderless: true, radius: 24 }}
          accessibilityRole="button"
          accessibilityLabel={t('Volver')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>
            {t('Atrás')}
          </Text>
        </Pressable>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>
          {t('Enciclopedia')}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* BUSCADOR GRANDE SIEMPRE VISIBLE + BOTÓN DE FILTROS */}
      <View style={[styles.searchSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: layout.borderRadius.md,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.textTertiary} style={{ marginRight: 8 }} />
            <TextInput
              value={filters.query}
              onChangeText={(text) => update('query', text)}
              placeholder={t('Buscar por nombre o familia...')}
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              accessibilityLabel={t('Buscar plantas')}
            />
            {filters.query.length > 0 ? (
              <Pressable
                onPress={() => update('query', '')}
                android_ripple={{ color: colors.border, borderless: true, radius: 18 }}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={t('Borrar búsqueda')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          {/* BOTÓN DE FILTROS CON CONTADOR */}
          <Pressable
            onPress={() => setFilterSheetOpen(true)}
            android_ripple={{ color: colors.primaryLight }}
            style={({ pressed }) => [
              styles.filterButton,
              {
                backgroundColor: activeFilters > 0 ? colors.primaryLight : colors.surfaceSecondary,
                borderColor: activeFilters > 0 ? colors.primary : colors.border,
                borderRadius: layout.borderRadius.md,
                overflow: 'hidden',
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              activeFilters > 0
                ? t('Filtros ({total})', { total: activeFilters })
                : t('Filtros')
            }
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilters > 0 ? colors.primary : colors.textSecondary}
            />
            {activeFilters > 0 ? (
              <View style={[styles.filterBadgeCount, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                  {activeFilters}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* TOGGLES RÁPIDOS: MODO SIN CONEXIÓN Y SEGURAS PARA MASCOTAS */}
        <View style={styles.togglesRow}>
          <Pressable
            onPress={() => setOfflineOnly((v) => !v)}
            android_ripple={{ color: colors.primaryLight }}
            accessibilityRole="switch"
            accessibilityState={{ checked: offlineOnly }}
            accessibilityLabel={t('Modo sin conexión: solo mis plantas guardadas')}
            style={({ pressed }) => [
              styles.toggleChip,
              {
                backgroundColor: offlineOnly ? colors.primaryLight : colors.surfaceSecondary,
                borderColor: offlineOnly ? colors.primary : 'transparent',
                borderRadius: layout.borderRadius.full,
                overflow: 'hidden',
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons
              name={offlineOnly ? 'cloud-offline' : 'cloud-offline-outline'}
              size={15}
              color={offlineOnly ? colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                typography.caption1,
                { color: offlineOnly ? colors.primaryDark : colors.textSecondary, fontWeight: '600' },
              ]}
            >
              {t('Mis plantas ({total})', { total: savedSpeciesIds.length })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setPetSafeOnly((v) => !v)}
            android_ripple={{ color: '#C8E6C9' }}
            accessibilityRole="switch"
            accessibilityState={{ checked: petSafeOnly }}
            accessibilityLabel={t('Filtrar plantas seguras para mascotas')}
            style={({ pressed }) => [
              styles.toggleChip,
              {
                backgroundColor: petSafeOnly ? '#E8F5E9' : colors.surfaceSecondary,
                borderColor: petSafeOnly ? '#2E7D32' : 'transparent',
                borderRadius: layout.borderRadius.full,
                overflow: 'hidden',
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons
              name="paw"
              size={15}
              color={petSafeOnly ? '#2E7D32' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                typography.caption1,
                { color: petSafeOnly ? '#1B5E20' : colors.textSecondary, fontWeight: '600' },
              ]}
            >
              {t('Seguras para mascotas')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* LISTA VIRTUALIZADA CON FLATLIST */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderPlantItem}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.resultsCountBar}>
            <Text style={[typography.footnote, { color: colors.textSecondary, fontWeight: '600' }]}>
              {results.length === 1
                ? t('{total} especie encontrada', { total: 1 })
                : t('{total} especies encontradas', { total: results.length })}
            </Text>
            {activeFilters > 0 && !offlineOnly ? (
              <Pressable
                onPress={() => setFilters(DEFAULT_FILTERS)}
                android_ripple={{ color: colors.primaryLight, borderless: true, radius: 20 }}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={t('Limpiar filtros')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[typography.footnote, { color: colors.primary, fontWeight: '700' }]}>
                  {t('Limpiar filtros')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListFooterComponent={
          results.length > 0 && filters.query.trim().length > 0 && isGeminiDirectAvailable() ? (
            <Pressable
              onPress={handleGenerateWithAi}
              disabled={generatingWithAi}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.md,
                  marginHorizontal: spacing.md,
                  marginBottom: spacing.md,
                  opacity: pressed || generatingWithAi ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('Buscar con Gemini AI')}
            >
              <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[typography.footnote, { color: colors.primary, fontWeight: '700' }]}>
                {generatingWithAi
                  ? t('Consultando a Gemini...')
                  : t('¿Buscas otra especie? Generar ficha de "{nombre}" con Gemini AI', {
                      nombre: filters.query.trim(),
                    })}
              </Text>
            </Pressable>
          ) : undefined
        }
        ListEmptyComponent={
          filters.query.trim().length > 0 && isGeminiDirectAvailable() ? (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Ionicons name="sparkles" size={40} color={colors.primary} />
              <Text
                style={[
                  typography.title3,
                  { color: colors.textPrimary, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
                ]}
              >
                {t('¿No encuentras "{nombre}"?', { nombre: filters.query.trim() })}
              </Text>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 6,
                    marginBottom: spacing.lg,
                    lineHeight: 22,
                  },
                ]}
              >
                {t(
                  'Gemini AI puede buscar y generar la ficha botánica completa, cuidados y mapa biogeográfico al instante.'
                )}
              </Text>
              <Button
                title={generatingWithAi ? t('Generando con IA...') : t('Generar especie con Gemini AI')}
                onPress={handleGenerateWithAi}
                disabled={generatingWithAi}
                variant="primary"
                size="md"
                icon={<Ionicons name="sparkles" size={18} color="#FFFFFF" />}
              />
            </View>
          ) : (
            <EmptyState
              iconName="leaf-outline"
              title={t('Sin resultados')}
              description={
                offlineOnly
                  ? t('Aún no has guardado plantas en Mi Jardín.')
                  : t('Prueba con otros términos o ajusta los filtros.')
              }
              actionTitle={activeFilters > 0 ? t('Limpiar filtros') : undefined}
              onActionPress={activeFilters > 0 ? () => setFilters(DEFAULT_FILTERS) : undefined}
            />
          )
        }
      />

      {/* BOTTOM SHEET DE FILTROS */}
      <BottomSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title={t('Filtros')}
        subtitle={
          activeFilters > 0
            ? t('{total} activos', { total: activeFilters })
            : t('Encuentra la planta ideal para tu hogar')
        }
      >
        <View style={{ paddingBottom: spacing.lg }}>
          {/* LUZ */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 8 }]}>
            {t('Luz solar')}
          </Text>
          <View style={styles.chipRow}>
            {lightFilters.map((f) => (
              <FilterChip
                key={f.key}
                label={t(f.label)}
                selected={filters.light === f.key}
                onPress={() => update('light', f.key as LightFilter)}
              />
            ))}
          </View>

          {/* DIFICULTAD */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 16, marginBottom: 8 }]}>
            {t('Dificultad')}
          </Text>
          <View style={styles.chipRow}>
            {difficultyFilters.map((f) => (
              <FilterChip
                key={f.key}
                label={t(f.label)}
                selected={filters.difficulty === f.key}
                onPress={() => update('difficulty', f.key as DifficultyFilter)}
              />
            ))}
          </View>

          {/* ENTORNO */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 16, marginBottom: 8 }]}>
            {t('Entorno')}
          </Text>
          <View style={styles.chipRow}>
            {environmentFilters.map((f) => (
              <FilterChip
                key={f.key}
                label={t(f.label)}
                selected={filters.environment === f.key}
                onPress={() => update('environment', f.key as EnvironmentFilter)}
              />
            ))}
          </View>

          {/* SEGURIDAD MASCOTAS */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 16, marginBottom: 8 }]}>
            {t('Seguridad')}
          </Text>
          <View style={styles.chipRow}>
            <FilterChip
              label={t('Segura para mascotas')}
              icon="paw"
              selected={filters.pets === 'petSafe'}
              onPress={() => update('pets', filters.pets === 'petSafe' ? 'all' : 'petSafe')}
            />
          </View>

          {/* BOTONES ACCIÓN FILTRO */}
          <View style={styles.filterModalActions}>
            <Button
              title={t('Limpiar')}
              onPress={() => setFilters(DEFAULT_FILTERS)}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.sm }} />
            <Button
              title={t('Ver {total} especies', { total: results.length })}
              onPress={() => setFilterSheetOpen(false)}
              variant="primary"
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 16,
    position: 'relative',
  },
  filterBadgeCount: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 48,
    borderWidth: 1,
  },
  resultsCountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  itemCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    minHeight: 88,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petSafeBadge: {
    backgroundColor: '#E8F5E9',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterModalActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
});
