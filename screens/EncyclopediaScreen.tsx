import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
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
  getEnvironment,
} from '../services/encyclopediaService';
import { isPetSafe } from '../services/toxicityService';
import { resolveSpeciesId } from '../services/plantApi';

const environmentLabel: Record<ReturnType<typeof getEnvironment>, string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  both: 'Interior/Exterior',
};

export const EncyclopediaScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { plants } = useGarden();

  const [filters, setFilters] = useState<EncyclopediaFilters>(DEFAULT_FILTERS);
  const [offlineOnly, setOfflineOnly] = useState(false);

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
    if (offlineOnly) {
      const saved = getPlantsByIds(savedSpeciesIds);
      const q = filters.query.toLowerCase().trim();
      return q
        ? saved.filter((p) => `${p.name} ${p.scientificName}`.toLowerCase().includes(q))
        : saved;
    }
    return searchEncyclopedia(filters);
  }, [filters, offlineOnly, savedSpeciesIds]);

  const activeFilters = countActiveFilters(filters);

  const update = <K extends keyof EncyclopediaFilters>(key: K, value: EncyclopediaFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>Atrás</Text>
        </TouchableOpacity>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>Enciclopedia</Text>
        <View style={styles.actionHeaderBtn} />
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceSecondary, borderRadius: layout.borderRadius.md },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={filters.query}
            onChangeText={(text) => update('query', text)}
            placeholder="Buscar por nombre o familia..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            accessibilityLabel="Buscar plantas"
          />
          {filters.query.length > 0 ? (
            <TouchableOpacity onPress={() => update('query', '')} accessibilityLabel="Borrar búsqueda">
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => setOfflineOnly((v) => !v)}
          activeOpacity={0.7}
          accessibilityRole="switch"
          accessibilityState={{ checked: offlineOnly }}
          accessibilityLabel="Modo sin conexión: solo mis plantas guardadas"
          style={[
            styles.offlineRow,
            {
              backgroundColor: offlineOnly ? colors.primaryLight : colors.surface,
              borderColor: offlineOnly ? colors.primary : colors.border,
              borderRadius: layout.borderRadius.md,
            },
          ]}
        >
          <Ionicons
            name={offlineOnly ? 'cloud-offline' : 'cloud-offline-outline'}
            size={18}
            color={offlineOnly ? colors.primary : colors.textSecondary}
          />
          <Text style={[typography.footnote, { color: offlineOnly ? colors.primary : colors.textSecondary, marginLeft: 8, fontWeight: '600' }]}>
            Sin conexión · mis plantas guardadas ({savedSpeciesIds.length})
          </Text>
        </TouchableOpacity>

        {!offlineOnly ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
            <View style={styles.filterRow}>
              {lightFilters.map((f) => (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  selected={filters.light === f.key}
                  onPress={() => update('light', f.key as LightFilter)}
                />
              ))}
              {difficultyFilters.map((f) => (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  selected={filters.difficulty === f.key}
                  onPress={() => update('difficulty', f.key as DifficultyFilter)}
                />
              ))}
              {environmentFilters.map((f) => (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  selected={filters.environment === f.key}
                  onPress={() => update('environment', f.key as EnvironmentFilter)}
                />
              ))}
              <FilterChip
                label="Segura para mascotas"
                icon="paw"
                selected={filters.pets === 'petSafe'}
                onPress={() => update('pets', filters.pets === 'petSafe' ? 'all' : 'petSafe')}
              />
            </View>
          </ScrollView>
        ) : null}

        <View style={styles.resultsHeader}>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            {results.length} {results.length === 1 ? 'especie' : 'especies'}
          </Text>
          {activeFilters > 0 && !offlineOnly ? (
            <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)} accessibilityRole="button" accessibilityLabel="Limpiar filtros">
              <Text style={[typography.footnote, { color: colors.primary, fontWeight: '600' }]}>
                Limpiar ({activeFilters})
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xxxl }}>
        {results.length === 0 ? (
          <EmptyState
            iconName="search-outline"
            title="Sin resultados"
            description={offlineOnly ? 'Aún no has guardado plantas en Mi Jardín.' : 'Prueba con otros términos o ajusta los filtros.'}
          />
        ) : (
          results.map((plant) => (
            <TouchableOpacity
              key={plant.id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PlantDetail', { plantId: plant.id })}
              accessibilityRole="button"
              accessibilityLabel={`Ver ficha de ${plant.name}`}
            >
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.plantRow}>
                  <View style={[styles.emojiBox, { backgroundColor: colors.primaryLight, borderRadius: layout.borderRadius.md }]}>
                    {plant.imageUri ? (
                      <Image source={{ uri: plant.imageUri }} style={styles.plantImage} />
                    ) : (
                      <Text style={{ fontSize: 26 }}>{plant.avatarEmoji}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
                      {plant.name}
                    </Text>
                    <Text style={[typography.footnote, { color: colors.textSecondary, fontStyle: 'italic' }]} numberOfLines={1}>
                      {plant.scientificName}
                    </Text>
                    <View style={styles.badgeRow}>
                      <Badge label={plant.difficulty} variant="info" />
                      <Badge label={environmentLabel[getEnvironment(plant.id)]} variant="neutral" />
                      {isPetSafe(plant.id) ? <Badge label="Mascotas ✓" variant="success" /> : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  actionHeaderBtn: { width: 60 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, minHeight: 44 },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 44,
    marginTop: 12,
  },
  filterRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  plantRow: { flexDirection: 'row', alignItems: 'center' },
  emojiBox: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  plantImage: { width: 56, height: 56 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
});
