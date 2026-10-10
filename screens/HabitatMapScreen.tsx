import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import worldData from 'world-atlas/countries-110m.json';
import { useTranslation } from '../i18n';
import { useAppTheme } from '../theme';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { SkeletonBox } from '../components/SkeletonLoader';
import { LockedPreview } from '../components/LockedPreview';
import { RegionCard } from '../components/RegionCard';
import { WorldMap } from '../components/WorldMap';
import { getPlantById, BOTANICAL_KNOWLEDGE_BASE } from '../services/plantApi';
import { getMappedCountries, getNativeCountries, getPlantHabitat, getRegionTypeColor, HabitatRegionDetail, PlantHabitatInfo } from '../services/habitatService';
import { usePlanLimits } from '../hooks/usePlanLimits';
import type { RootStackParamList } from '../navigation/AppNavigator';

type MapRoute = RouteProp<RootStackParamList, 'HabitatMap'>;
type MapNavigation = NativeStackNavigationProp<RootStackParamList, 'HabitatMap'>;

export const HabitatMapScreen: React.FC = () => {
  const { colors, isDark, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<MapNavigation>();
  const route = useRoute<MapRoute>();
  const limits = usePlanLimits();
  const [plantId, setPlantId] = useState(route.params?.plantId || 'monstera');
  const [habitatData, setHabitatData] = useState<PlantHabitatInfo | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<HabitatRegionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  const plant = getPlantById(plantId);
  const loadHabitat = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getPlantHabitat(plantId);
      setHabitatData(data);
      setSelectedRegion(data.regions.find((region) => region.zoneType === 'native') || data.regions[0] || null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => { void loadHabitat(); }, [loadHabitat]);

  const mappedCountries = useMemo(() => habitatData ? getMappedCountries(habitatData) : [], [habitatData]);
  const nativeCountries = useMemo(() => habitatData ? getNativeCountries(habitatData) : [], [habitatData]);
  const highlightedIds = useMemo(() => new Set(nativeCountries.map((country) => country.id)), [nativeCountries]);
  const focusIds = useMemo(() => nativeCountries.map((country) => country.id), [nativeCountries]);

  const changePlant = (nextPlantId: string): void => {
    if (nextPlantId === plantId) return;
    setPlantId(nextPlantId);
    setResetToken((token) => token + 1);
  };

  const mapColors = {
    ocean: isDark ? '#0B1720' : '#EAF5FA',
    land: isDark ? '#263238' : '#DCE3E6',
    border: isDark ? '#54646B' : '#AAB7BD',
    highlight: getRegionTypeColor('native', isDark),
    highlightBorder: isDark ? '#B8F5C0' : '#145A32',
    label: colors.textPrimary,
    surface: colors.surface,
    textPrimary: colors.textPrimary,
    primary: colors.primary,
  };

  const header = (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: Platform.OS === 'ios' ? 12 : 16 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t('Volver a la pantalla anterior')}>
        <Ionicons name="chevron-back" size={26} color={colors.primary} /><Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
      </TouchableOpacity>
      <View style={styles.titleWrap}><Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>{t('Hábitat Global')}</Text><Text style={[typography.caption1, { color: colors.textSecondary }]} numberOfLines={1}>{plant?.scientificName || t('Distribución biogeográfica')}</Text></View>
      <View style={styles.headerPlaceholder} />
    </View>
  );

  if (limits.isFeatureLocked('animatedMap')) {
    return <View style={[styles.container, { backgroundColor: colors.background }]}>{header}<LockedPreview locked feature="animatedMap" onUnlock={() => navigation.navigate('Paywall')} style={{ flex: 1 }}><View style={{ padding: spacing.md }}><EmptyState iconName="earth-outline" title={t('Mapa de hábitat Pro')} description={t('Explora el origen natural de cada especie con un mapa interactivo por país.')} /></View></LockedPreview></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selector} accessibilityLabel={t('Selector de planta')}>
        {BOTANICAL_KNOWLEDGE_BASE.map((candidate) => {
          const active = candidate.id === plantId;
          return <TouchableOpacity key={candidate.id} onPress={() => changePlant(candidate.id)} style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]} accessibilityRole="button" accessibilityLabel={t('Mostrar hábitat de {especie}', { especie: candidate.name })}><Text style={{ color: active ? '#FFFFFF' : colors.textPrimary, fontWeight: '700', fontSize: 13 }}>{candidate.name}</Text></TouchableOpacity>;
        })}
      </ScrollView>
      <View style={[styles.legend, { backgroundColor: isDark ? '#1C1C1E' : '#F1F3F4' }]}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: getRegionTypeColor('native', isDark) }]} /><Text style={{ color: colors.textPrimary }}>{t('Zona nativa')}</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: isDark ? '#667176' : '#DCE3E6' }]} /><Text style={{ color: colors.textPrimary }}>{t('Resto del mundo')}</Text></View>
      </View>
      <View style={[styles.mapPanel, { backgroundColor: mapColors.ocean }]}>
        {loading ? <View style={styles.state}><SkeletonBox width="92%" height={240} borderRadius={18} /><Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: spacing.md }]}>{t('Generando proyección cartográfica...')}</Text></View>
          : error ? <View style={styles.state}><ErrorBanner message={t('No pudimos cargar el hábitat de esta planta.')} onRetry={loadHabitat} /></View>
            : !habitatData || !mappedCountries.length ? <View style={styles.state}><EmptyState iconName="leaf-outline" title={t('Sin registros de hábitat')} description={t('Aún no tenemos datos biogeográficos para esta especie.')} /></View>
              : <WorldMap topology={worldData as never} highlightedIds={highlightedIds} focusIds={focusIds} onCountryPress={(country) => { const region = mappedCountries.find((item) => item.id === country.id)?.region; if (region) setSelectedRegion(region); }} colors={mapColors} accessibilitySummary={t('Mapa mundial de {especie}. Regiones nativas: {regiones}', { especie: plant?.name || t('esta planta'), regiones: nativeCountries.map((country) => country.name).join(', ') })} resetToken={resetToken} />}
      </View>
      {selectedRegion ? <RegionCard plantName={plant?.name || t('Esta planta')} region={selectedRegion} onClose={() => setSelectedRegion(null)} colors={colors} labels={{ native: t('Zona nativa'), naturalized: t('Naturalizada'), cultivated: t('Cultivada'), close: t('Cerrar detalle de región') }} /> : null}
      <Text style={[styles.hint, { color: colors.textTertiary }]}>{t('Pellizca para acercar, arrastra para explorar y toca dos veces para enfocar.')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  backButton: { minWidth: 78, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2 },
  titleWrap: { flex: 1, alignItems: 'center' },
  headerPlaceholder: { width: 78 },
  selector: { gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  chip: { minHeight: 44, paddingHorizontal: 13, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  legend: { minHeight: 38, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 11, height: 11, borderRadius: 6 },
  mapPanel: { minHeight: 300, flex: 1, margin: 12, borderRadius: 18, overflow: 'hidden' },
  state: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 16 },
  hint: { fontSize: 12, textAlign: 'center', marginHorizontal: 16, marginBottom: 8 },
});

