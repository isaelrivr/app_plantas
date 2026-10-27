import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { announce } from '../services/accessibilityService';
import type { RootStackParamList } from '../navigation/AppNavigator';

type MapRoute = RouteProp<RootStackParamList, 'HabitatMap'>;
type MapNavigation = NativeStackNavigationProp<RootStackParamList, 'HabitatMap'>;

export const HabitatMapScreen: React.FC = () => {
  const { colors, isDark, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MapNavigation>();
  const route = useRoute<MapRoute>();
  const limits = usePlanLimits();
  const [plantId, setPlantId] = useState(
    route.params?.plantId || (route.params as any)?.speciesId || 'monstera'
  );
  const [habitatData, setHabitatData] = useState<PlantHabitatInfo | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<HabitatRegionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [topologyData, setTopologyData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    import('world-atlas/countries-110m.json')
      .then((module) => {
        if (isMounted) setTopologyData(module.default || module);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const incoming = route.params?.plantId || (route.params as any)?.speciesId;
    if (incoming && incoming !== plantId) {
      setPlantId(incoming);
      setResetToken((token) => token + 1);
    }
  }, [route.params?.plantId, (route.params as any)?.speciesId, plantId]);

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
    const target = BOTANICAL_KNOWLEDGE_BASE.find((p) => p.id === nextPlantId);
    if (target) announce(t('Mostrando hábitat de {especie}', { especie: target.name }));
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
        accessibilityLabel={t('Volver a la pantalla anterior')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={26} color={colors.primary} />
        <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
      </Pressable>
      <View style={styles.titleWrap}>
        <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>{t('Origen en el Mundo')}</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary }]} numberOfLines={1}>{plant?.scientificName || t('Lugar de origen')}</Text>
      </View>
      <View style={styles.headerPlaceholder} />
    </View>
  );

  if (limits.isFeatureLocked('animatedMap')) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <LockedPreview locked feature="animatedMap" onUnlock={() => navigation.navigate('Paywall')} style={{ flex: 1 }}>
          <View style={{ padding: spacing.md }}>
            <EmptyState iconName="earth-outline" title={t('Mapa de origen Pro')} description={t('Descubre de qué parte del mundo proviene cada especie con un mapa interactivo.')} />
          </View>
        </LockedPreview>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selector} accessibilityLabel={t('Selector de planta')}>
        {BOTANICAL_KNOWLEDGE_BASE.map((candidate) => {
          const active = candidate.id === plantId;
          return (
            <Pressable
              key={candidate.id}
              onPress={() => changePlant(candidate.id)}
              android_ripple={{ color: active ? '#FFFFFF33' : colors.primaryLight, borderless: false }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                  overflow: 'hidden',
                },
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('Mostrar hábitat de {especie}', { especie: candidate.name })}
            >
              <Text style={{ color: active ? '#FFFFFF' : colors.textPrimary, fontWeight: '700', fontSize: 14 }}>
                {candidate.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={[styles.legend, { backgroundColor: isDark ? '#1C1C1E' : '#F1F3F4' }]}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: getRegionTypeColor('native', isDark) }]} /><Text style={{ color: colors.textPrimary, fontSize: 14 }}>{t('Zona nativa')}</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: isDark ? '#667176' : '#DCE3E6' }]} /><Text style={{ color: colors.textPrimary, fontSize: 14 }}>{t('Resto del mundo')}</Text></View>
      </View>
      <View style={[styles.mapPanel, { backgroundColor: mapColors.ocean }]}>
        {loading || !topologyData ? <View style={styles.state}><SkeletonBox width="92%" height={240} borderRadius={18} /><Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: spacing.md }]}>{t('Cargando mapa...')}</Text></View>
          : error ? <View style={styles.state}><ErrorBanner message={t('No pudimos cargar el mapa de esta planta.')} onRetry={loadHabitat} /></View>
            : !habitatData || !mappedCountries.length ? <View style={styles.state}><EmptyState iconName="leaf-outline" title={t('Sin registros de origen')} description={t('Aún no tenemos datos sobre el origen de esta especie.')} /></View>
              : <WorldMap topology={topologyData as never} highlightedIds={highlightedIds} focusIds={focusIds} onCountryPress={(country) => { const region = mappedCountries.find((item) => item.id === country.id)?.region; if (region) setSelectedRegion(region); }} colors={mapColors} accessibilitySummary={t('Mapa mundial de {especie}. Regiones nativas: {regiones}', { especie: plant?.name || t('esta planta'), regiones: nativeCountries.map((country) => country.name).join(', ') })} resetToken={resetToken} />}
      </View>
      {selectedRegion ? <RegionCard plantName={plant?.name || t('Esta planta')} region={selectedRegion} onClose={() => setSelectedRegion(null)} colors={colors} labels={{ native: t('Zona nativa'), naturalized: t('Naturalizada'), cultivated: t('Cultivada'), close: t('Cerrar detalle de región') }} /> : null}
      <Text style={[styles.hint, { color: colors.textTertiary, marginBottom: Math.max(insets.bottom, 12) }]}>
        {t('Pellizca para acercar, arrastra para explorar y toca dos veces para enfocar.')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  backButton: { minWidth: 78, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 2 },
  titleWrap: { flex: 1, alignItems: 'center' },
  headerPlaceholder: { width: 78 },
  selector: { gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  chip: { minHeight: 48, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  legend: { minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  mapPanel: { minHeight: 300, flex: 1, margin: 12, borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  state: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 16 },
  hint: { fontSize: 14, textAlign: 'center', marginHorizontal: 16, marginBottom: 8 },
});

