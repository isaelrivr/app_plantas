import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConfidenceRing } from '../components/ConfidenceRing';
import { LevelBar } from '../components/LevelBar';
import { EmptyState } from '../components/EmptyState';
import { SkeletonBox } from '../components/SkeletonLoader';
import { resolvePlantForDetail, CatalogPlant } from '../services/plantApi';
import { useGarden } from '../context/GardenContext';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { ToxicityBadge, ToxicityPanel } from '../components/ToxicityBadge';

type TabType = 'resumen' | 'cuidados' | 'habitat' | 'problemas';

// Nivel 1-5 estimado para el rango térmico (12°C a 32°C como escala de referencia)
const tempLevelFor = (tempMinC: number, tempMaxC: number): number => {
  const mid = (tempMinC + tempMaxC) / 2;
  return Math.max(1, Math.min(5, Math.round(((mid - 12) / (32 - 12)) * 5)));
};

export const PlantDetailScreen: React.FC = () => {
  const { colors, isDark, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addPlant, plants } = useGarden();
  const limits = usePlanLimits();

  const plantId = route.params?.plantId || 'monstera';
  const plantNameParam = route.params?.plantName as string | undefined;
  const scientificNameParam = route.params?.scientificName as string | undefined;
  const confidenceParam = route.params?.confidence as number | undefined;

  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [plant, setPlant] = useState<CatalogPlant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Resolución real: catálogo local o ficha generada por IA a partir del nombre.
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      let resolved: CatalogPlant | null = null;
      try {
        resolved = await resolvePlantForDetail(plantId, plantNameParam, scientificNameParam, confidenceParam);
      } catch {
        resolved = null;
      }
      if (!active) return;
      setPlant(resolved);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [plantId, plantNameParam, scientificNameParam, confidenceParam]);

  useEffect(() => {
    if (!plant) return;
    const token = plant.name.toLowerCase().split(' ')[0];
    setIsSaved(plants.some((p) => p.name.toLowerCase().includes(token)));
  }, [plant, plants]);

  const handleTabChange = (tab: TabType) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setActiveTab(tab);
  };

  const handleSaveToGarden = () => {
    if (!plant) return;
    // Límite free: máx. 5 plantas (punto 16)
    if (!limits.isPremium && plants.length >= limits.plantLimit) {
      Alert.alert(
        t('Jardín gratuito lleno'),
        t('El plan gratuito permite {limite} plantas. Con Plantae Pro guardas las que quieras.', { limite: limits.plantLimit }),
        [
          { text: t('Ahora no'), style: 'cancel' },
          { text: t('Ver Pro'), onPress: () => navigation.navigate('Paywall') },
        ]
      );
      return;
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    addPlant({
      name: plant.name,
      scientificName: plant.scientificName,
      wateringFrequencyDays: plant.wateringFrequencyDays,
      light: plant.light,
      avatarEmoji: plant.avatarEmoji,
    });
    setIsSaved(true);
  };

  const handleOpenGrowthDiary = () => {
    if (!plant) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    navigation.navigate('GrowthDiary', { plantId: plant.id });
  };

  const handleOpenHabitatMap = () => {
    if (!plant) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    navigation.navigate('HabitatMap', { plantId: plant.id });
  };

  const handleOpenDiagnosis = () => {
    if (!plant) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    navigation.navigate('HealthDiagnosis', {
      plantId: plant.id,
      plantName: plant.name,
      scientificName: plant.scientificName,
    });
  };

  // Estado de carga con esqueletos
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: Platform.OS === 'ios' ? 12 : 16,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('Volver')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
            <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
          </TouchableOpacity>
          <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
            {t('Ficha Botánica')}
          </Text>
          <View style={styles.actionHeaderBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.md }}
          accessibilityLabel="Cargando ficha botánica"
        >
          <Card elevated style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SkeletonBox width={60} height={60} borderRadius={30} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <SkeletonBox width="30%" height={12} borderRadius={6} />
                <SkeletonBox width="85%" height={20} borderRadius={6} style={{ marginTop: 8 }} />
                <SkeletonBox width="55%" height={13} borderRadius={6} style={{ marginTop: 6 }} />
              </View>
              <SkeletonBox width={54} height={54} borderRadius={27} />
            </View>
            <View style={{ marginTop: spacing.lg, flexDirection: 'row', gap: 8 }}>
              <SkeletonBox width="31%" height={44} borderRadius={10} />
              <SkeletonBox width="31%" height={44} borderRadius={10} />
              <SkeletonBox width="31%" height={44} borderRadius={10} />
            </View>
          </Card>

          <View style={[styles.segmentedControl, { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBox key={i} height={36} borderRadius={8} style={{ flex: 1, marginHorizontal: 2 }} />
            ))}
          </View>

          <Card elevated style={{ marginTop: spacing.md }}>
            <SkeletonBox width="45%" height={16} borderRadius={6} />
            <SkeletonBox width="95%" height={14} borderRadius={6} style={{ marginTop: 12 }} />
            <SkeletonBox width="90%" height={14} borderRadius={6} style={{ marginTop: 6 }} />
            <SkeletonBox width="70%" height={14} borderRadius={6} style={{ marginTop: 6 }} />
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: Platform.OS === 'ios' ? 12 : 16,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('Volver')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
            <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
          </TouchableOpacity>
          <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
            {t('Ficha Botánica')}
          </Text>
          <View style={styles.actionHeaderBtn} />
        </View>
        <EmptyState
          iconName="leaf-outline"
          title={t('Especie no encontrada')}
          description={t('No pudimos recuperar la ficha de esta planta. Vuelve a escanearla o elige otra especie del catálogo.')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER DE NAVEGACIÓN HIG */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === 'ios' ? 12 : 16,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('Volver')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
        </TouchableOpacity>

        <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
          {t('Ficha Botánica')}
        </Text>

        <TouchableOpacity
          onPress={handleSaveToGarden}
          disabled={isSaved}
          style={styles.actionHeaderBtn}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? t('Ya en tu jardín') : t('Guardar en jardín')}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
      >
        {/* TARJETA PRINCIPAL CON AVATAR E INFORMACIÓN BOTÁNICA */}
        <Card elevated style={{ marginBottom: spacing.md }} accessible={true} accessibilityLabel={`Ficha de ${plant.name}, familia ${plant.family}`}>
          <View style={styles.topCardRow}>
            {/* Avatar / Símbolo */}
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.primaryLight },
              ]}
            >
              <Text style={styles.avatarEmoji}>{plant.avatarEmoji}</Text>
            </View>

            {/* Títulos e Identidad */}
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Badge label={t('Familia {familia}', { familia: plant.family })} variant="primary" />
              <Text style={[typography.title2, { color: colors.textPrimary, fontWeight: '700', marginTop: 4 }]}>
                {plant.name}
              </Text>
              <Text style={[typography.footnote, { color: colors.textTertiary, fontStyle: 'italic', marginTop: 2 }]}>
                {plant.scientificName}
              </Text>
            </View>

            {/* Anillo de Confianza / Salud (solo si conocemos la precisión) */}
            {plant.confidence != null ? (
              <View style={{ alignItems: 'center' }}>
                <ConfidenceRing score={plant.confidence} size={54} strokeWidth={5} colorVariant="primary" />
                <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 4 }]}>{t('Precisión')}</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', width: 54 }}>
                <Ionicons name="sparkles" size={22} color={colors.primary} />
                <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 4 }]}>{t('IA')}</Text>
              </View>
            )}
          </View>

          {/* CHIPS RÁPIDOS DE CUIDADO */}
          <View style={[styles.quickInfoRow, { borderTopColor: colors.border }]}>
            <View style={styles.quickInfoItem}>
              <Ionicons name="water" size={16} color={colors.info} />
              <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '600', marginTop: 2 }]}>
                {t('Cada {dias} días', { dias: plant.wateringFrequencyDays })}
              </Text>
              <Text style={[typography.caption2, { color: colors.textTertiary }]}>{t('Riego')}</Text>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

            <View style={styles.quickInfoItem}>
              <Ionicons name="sunny" size={16} color={colors.warning} />
              <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '600', marginTop: 2 }]}>
                {t('Nivel {nivel}/5', { nivel: plant.careLevels.lightLevel })}
              </Text>
              <Text style={[typography.caption2, { color: colors.textTertiary }]}>{t('Luz solar')}</Text>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

            <View style={styles.quickInfoItem}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '600', marginTop: 2 }]}>
                {plant.difficulty}
              </Text>
              <Text style={[typography.caption2, { color: colors.textTertiary }]}>{t('Dificultad')}</Text>
            </View>
          </View>
        </Card>

        {/* SELECTOR SEGMENTADO DE PESTAÑAS (APPLE HIG) */}
        <View style={[styles.segmentedControl, { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}>
          {(['resumen', 'cuidados', 'habitat', 'problemas'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            const labels: Record<TabType, string> = {
              resumen: 'Resumen',
              cuidados: 'Cuidados',
              habitat: 'Hábitat',
              problemas: 'Problemas',
            };

            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.segmentButton,
                  isActive && [styles.segmentActive, { backgroundColor: colors.surface }],
                ]}
                onPress={() => handleTabChange(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={t('Pestaña {pestaña}', { pestaña: t(labels[tab]) })}
              >
                <Text
                  style={[
                    typography.footnote,
                    {
                      color: isActive ? colors.textPrimary : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {t(labels[tab])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}

        {/* 1. RESUMEN */}
        {activeTab === 'resumen' && (
          <View style={{ gap: spacing.md }}>
            <Card elevated>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
                {t('Acerca de la especie')}
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                {plant.habitatSummary}
              </Text>

              <View
                style={[
                  styles.tipBox,
                  {
                    backgroundColor: isDark ? 'rgba(46, 125, 50, 0.15)' : colors.primaryLight,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Ionicons name="sparkles" size={18} color={colors.primary} />
                <Text style={[typography.footnote, { color: colors.textPrimary, flex: 1, marginLeft: 8 }]}>
                  {plant.climateTip}
                </Text>
              </View>
            </Card>

            <Card elevated>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                {t('Clasificación Taxonómica')}
              </Text>
              <View style={styles.taxRow}>
                <Text style={[typography.subheadline, { color: colors.textTertiary }]}>{t('Reino')}</Text>
                <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600' }]}>Plantae</Text>
              </View>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <View style={styles.taxRow}>
                <Text style={[typography.subheadline, { color: colors.textTertiary }]}>{t('Familia')}</Text>
                <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600' }]}>
                  {plant.family}
                </Text>
              </View>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <View style={styles.taxRow}>
                <Text style={[typography.subheadline, { color: colors.textTertiary }]}>{t('Nombre Científico')}</Text>
                <Text style={[typography.subheadline, { color: colors.textPrimary, fontStyle: 'italic', fontWeight: '600' }]}>
                  {plant.scientificName}
                </Text>
              </View>
            </Card>

            {/* TOXICIDAD PARA MASCOTAS Y NIÑOS (punto 10) */}
            <Card elevated>
              <View style={styles.toxicityHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>
                    {t('Toxicidad en el hogar')}
                  </Text>
                  <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                    {t('Información clave si convives con mascotas o niños')}
                  </Text>
                </View>
                <Ionicons name="paw" size={24} color={colors.warning} />
              </View>
              <ToxicityBadge speciesId={plant.id} compact style={{ marginTop: spacing.sm }} />
              <View style={{ marginTop: spacing.md }}>
                <ToxicityPanel speciesId={plant.id} />
              </View>
            </Card>
          </View>
        )}

        {/* 2. CUIDADOS CON BARRAS VISUALES DE NIVEL HIG */}
        {activeTab === 'cuidados' && (
          <View style={{ gap: spacing.md }}>
            <Card elevated>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.md }]}>
                Parámetros Botánicos de Nivel
              </Text>

              {/* Barra de Luz */}
              <LevelBar
                label="Luz solar"
                level={plant.careLevels.lightLevel}
                iconName="sunny"
                valueDescription={plant.light}
                tintColor={colors.warning}
              />

              {/* Barra de Riego */}
              <LevelBar
                label="Frecuencia de Riego"
                level={plant.careLevels.wateringLevel}
                iconName="water"
                valueDescription={`Cada ${plant.wateringFrequencyDays} días`}
                tintColor={colors.info}
              />

              {/* Barra de Humedad */}
              <LevelBar
                label="Humedad Ambiental"
                level={plant.careLevels.humidityLevel}
                iconName="cloud"
                valueDescription={plant.humidity}
                tintColor={colors.accent}
              />

              {/* Rango de Temperatura */}
              <LevelBar
                label="Temperatura Óptima"
                level={tempLevelFor(plant.careLevels.tempMinC, plant.careLevels.tempMaxC)}
                iconName="thermometer"
                valueDescription={`${plant.careLevels.tempMinC}°C a ${plant.careLevels.tempMaxC}°C`}
                tintColor="#E91E63"
              />
            </Card>

            <Card elevated>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
                Pauta Detallada de Riego
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                {plant.watering}
              </Text>
            </Card>
          </View>
        )}

        {/* 3. HÁBITAT CON ENLACE AL MAPA MUNDIAL */}
        {activeTab === 'habitat' && (
          <View style={{ gap: spacing.md }}>
            <Card elevated>
              <View style={styles.habitatCardHeader}>
                <View>
                  <Badge label="Función Estrella" variant="premium" />
                  <Text style={[typography.title2, { color: colors.textPrimary, fontWeight: '700', marginTop: 4 }]}>
                    Distribución y Origen
                  </Text>
                </View>
                <Ionicons name="earth" size={34} color={colors.primary} />
              </View>

              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 22 }]}>
                Descubre en qué regiones del planeta habita esta especie de forma nativa, dónde ha sido naturalizada y sus zonas de cultivo global.
              </Text>

              <View style={[styles.regionsTeaser, { backgroundColor: isDark ? '#2C2C2E' : '#F1F3F4' }]}>
                <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600' }]}>
                  Países de Presencia Principal:
                </Text>
                <View style={styles.regionTagsWrap}>
                  {plant.nativeRegions.map((reg) => (
                    <View key={reg} style={[styles.regionTag, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons name="location" size={12} color={colors.primary} />
                      <Text style={[typography.caption2, { color: colors.primary, fontWeight: '600', marginLeft: 4 }]}>
                        {reg}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <Button
                title="Abrir Mapa Mundial Interactivo 🌍"
                onPress={handleOpenHabitatMap}
                variant="primary"
                size="lg"
                icon={<Ionicons name="map" size={18} color="#FFFFFF" />}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          </View>
        )}

        {/* 4. PROBLEMAS Y ACCESO A DIAGNÓSTICO */}
        {activeTab === 'problemas' && (
          <View style={{ gap: spacing.md }}>
            <Card elevated>
              <View style={styles.problemsHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>
                    Problemas Comunes
                  </Text>
                  <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                    Síntomas frecuentes identificables en sus hojas
                  </Text>
                </View>
                <Ionicons name="warning" size={24} color={colors.warning} />
              </View>

              {plant.commonProblems.map((problem, idx) => (
                <View key={idx} style={styles.problemItem}>
                  <Ionicons name="ellipse" size={8} color={colors.warning} style={{ marginTop: 6 }} />
                  <Text style={[typography.body, { color: colors.textSecondary, flex: 1, marginLeft: 10, lineHeight: 20 }]}>
                    {problem}
                  </Text>
                </View>
              ))}

              <Button
                title="Diagnosticar Salud con IA 🩺"
                onPress={handleOpenDiagnosis}
                variant="secondary"
                size="md"
                icon={<Ionicons name="medkit" size={18} color={colors.primary} />}
                style={{ marginTop: spacing.lg }}
              />
            </Card>
          </View>
        )}

        {/* BOTÓN INFERIOR DE ACCIÓN */}
        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Button
            title="📈 Ver Diario de Crecimiento"
            onPress={handleOpenGrowthDiary}
            variant="secondary"
            size="md"
            icon={<Ionicons name="images" size={18} color={colors.primary} />}
          />
          <Button
            title={isSaved ? 'Guardada en Mi Jardín ✓' : 'Guardar en Mi Jardín'}
            onPress={handleSaveToGarden}
            disabled={isSaved}
            variant={isSaved ? 'secondary' : 'primary'}
            size="lg"
            icon={<Ionicons name={isSaved ? 'checkmark' : 'leaf'} size={18} color={isSaved ? colors.textSecondary : '#FFFFFF'} />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  actionHeaderBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  quickInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 12,
  },
  quickInfoItem: {
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 28,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44, // HIG 44x44
  },
  segmentActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  separator: {
    height: 1,
    width: '100%',
  },
  habitatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  regionsTeaser: {
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  regionTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  regionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
problemsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  toxicityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  problemItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
});
