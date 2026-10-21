import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import { Card } from '../components/Card';
import { GlassSurface } from '../components/GlassSurface';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { PrimaryActionBar } from '../components/PrimaryActionBar';
import { EmptyState } from '../components/EmptyState';
import { SkeletonBox } from '../components/SkeletonLoader';
import { PlantToxicityBanner } from '../components/plant/PlantToxicityBanner';
import { PlantTodayActionCard } from '../components/plant/PlantTodayActionCard';
import { PlantTimeline } from '../components/plant/PlantTimeline';
import { ShareCardModal } from '../components/ShareCardModal';
import { LightMeterModal } from '../components/LightMeterModal';
import { resolvePlantForDetail, CatalogPlant } from '../services/plantApi';
import { useGarden, GardenPlant } from '../context/GardenContext';
import { useFeedback } from '../context/FeedbackContext';
import { usePlanLimits } from '../hooks/usePlanLimits';

type TabType = 'cuidados' | 'historia' | 'mas_info';

export const PlantDetailScreen: React.FC = () => {
  const { colors, spacing, typography, layout } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addPlant, plants, removePlant, restorePlant } = useGarden();
  const { confirm, showToast } = useFeedback();
  const limits = usePlanLimits();

  const plantId = route.params?.plantId || 'monstera';
  const plantNameParam = route.params?.plantName as string | undefined;
  const scientificNameParam = route.params?.scientificName as string | undefined;
  const confidenceParam = route.params?.confidence as number | undefined;

  const [activeTab, setActiveTab] = useState<TabType>('cuidados');
  const [plant, setPlant] = useState<CatalogPlant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);
  const [lightMeterVisible, setLightMeterVisible] = useState<boolean>(false);

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

  const matchingGardenPlant: GardenPlant | undefined = plant
    ? plants.find((p) => p.name.toLowerCase().includes(plant.name.toLowerCase().split(' ')[0]))
    : undefined;

  useEffect(() => {
    if (!plant) return;
    setIsSaved(Boolean(matchingGardenPlant));
  }, [plant, matchingGardenPlant]);

  const handleSaveToGarden = async () => {
    if (!plant) return;
    if (!limits.isPremium && plants.length >= limits.plantLimit) {
      const wantPro = await confirm({
        title: t('Jardín lleno'),
        message: t('El plan gratuito permite {limite} plantas. Con EcoScan Pro guardas plantas ilimitadas.', {
          limite: limits.plantLimit,
        }),
        confirmText: t('Ver Pro'),
        cancelText: t('Ahora no'),
      });
      if (wantPro) navigation.navigate('Paywall');
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
    showToast({
      message: t('{nombre} guardada en Mi Jardín', { nombre: plant.name }),
      type: 'success',
    });
  };

  const handleRemoveFromGarden = async () => {
    if (!plant) return;
    const token = plant.name.toLowerCase().split(' ')[0];
    const saved = plants.find((p) => p.name.toLowerCase().includes(token));
    if (!saved) return;

    const confirmed = await confirm({
      title: t('¿Eliminar de Mi Jardín?'),
      message: t('Esta planta se quitará de tus cuidados y recordatorios.'),
      confirmText: t('Eliminar'),
      cancelText: t('Cancelar'),
      isDestructive: true,
    });
    if (!confirmed) return;

    removePlant(saved.id);
    setIsSaved(false);
    showToast({
      message: t('Planta eliminada del jardín'),
      actionLabel: t('Deshacer'),
      durationMs: 5000,
      onAction: () => {
        restorePlant(saved);
        setIsSaved(true);
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.md }]}>
        <SkeletonBox width="100%" height={260} borderRadius={18} style={{ marginTop: 40 }} />
        <SkeletonBox width="70%" height={28} borderRadius={8} style={{ marginTop: 20 }} />
        <SkeletonBox width="50%" height={18} borderRadius={6} style={{ marginTop: 8 }} />
        <SkeletonBox width="100%" height={120} borderRadius={14} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          iconName="alert-circle-outline"
          title={t('Especie no encontrada')}
          description={t('No pudimos recuperar la ficha de esta planta. Vuelve a escanearla o búscala en la enciclopedia.')}
          actionTitle={t('Volver')}
          onActionPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 140, 160) }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CONTAINER CON CONTROLES FLOTANTES DE VIDRIO SOBRE FOTO */}
        <View style={styles.heroContainer}>
          {plant.imageUri ? (
            <Image
              source={{ uri: plant.imageUri }}
              style={styles.heroImage}
              accessible
              accessibilityLabel={plant.name}
            />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ fontSize: 64 }}>{plant.avatarEmoji || '🌿'}</Text>
            </View>
          )}

          {/* CONTROLES FLOTANTES DE VIDRIO SOBRE LA FOTO */}
          <View
            style={[styles.floatingControlsOverlay, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 16) }]}
            pointerEvents="box-none"
          >
            <GlassSurface variant="strong" borderRadius={24} style={styles.floatingGlassBtn}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.glassBtnPressable, pressed && { opacity: 0.7 }]}
                android_ripple={{ color: '#FFFFFF33', borderless: true, radius: 24 }}
                accessibilityRole="button"
                accessibilityLabel={t('Volver')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </Pressable>
            </GlassSurface>

            <View style={styles.floatingRightActions}>
              <GlassSurface variant="strong" borderRadius={24} style={styles.floatingGlassBtn}>
                <Pressable
                  onPress={() => setLightMeterVisible(true)}
                  style={({ pressed }) => [styles.glassBtnPressable, pressed && { opacity: 0.7 }]}
                  android_ripple={{ color: '#FFFFFF33', borderless: true, radius: 24 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('Medidor de luz')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="sunny-outline" size={22} color="#FFFFFF" />
                </Pressable>
              </GlassSurface>

              <GlassSurface variant="strong" borderRadius={24} style={[styles.floatingGlassBtn, { marginLeft: 8 }]}>
                <Pressable
                  onPress={() => navigation.navigate('Assistant', { plantName: plant.name })}
                  style={({ pressed }) => [styles.glassBtnPressable, pressed && { opacity: 0.7 }]}
                  android_ripple={{ color: '#FFFFFF33', borderless: true, radius: 24 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('Pregúntale a EcoScan')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FFFFFF" />
                </Pressable>
              </GlassSurface>

              <GlassSurface variant="strong" borderRadius={24} style={[styles.floatingGlassBtn, { marginLeft: 8 }]}>
                <Pressable
                  onPress={() => setShareModalVisible(true)}
                  style={({ pressed }) => [styles.glassBtnPressable, pressed && { opacity: 0.7 }]}
                  android_ripple={{ color: '#FFFFFF33', borderless: true, radius: 24 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('Compartir')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
                </Pressable>
              </GlassSurface>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
          {/* TÍTULO BOTÁNICO */}
          <Text style={[typography.title1, { color: colors.textPrimary, fontWeight: '800' }]}>
            {plant.name}
          </Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 }]}>
            {plant.scientificName}
          </Text>

          {/* TOXICIDAD ARRIBA (SEGURIDAD PRIORITARIA) */}
          <PlantToxicityBanner speciesId={plant.id} />

          {/* BLOQUE PRINCIPAL: QUÉ HACER HOY */}
          <PlantTodayActionCard plant={plant} />

          {/* PESTAÑAS: CUIDADOS vs HISTORIA vs MÁS INFORMACIÓN */}
          <SegmentedControl<TabType>
            options={[
              { key: 'cuidados', label: t('Cuidados') },
              { key: 'historia', label: t('Historia') },
              { key: 'mas_info', label: t('Más información') },
            ]}
            selectedKey={activeTab}
            onSelect={setActiveTab}
            style={{ marginTop: spacing.lg, marginBottom: spacing.md }}
          />

          {activeTab === 'cuidados' ? (
            <View style={{ gap: spacing.md }}>
              {/* PAUTAS DETALLADAS DE CUIDADO */}
              <Card
                variant="flat"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: layout.borderRadius.lg,
                  padding: spacing.md,
                }}
              >
                <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 8 }]}>
                  {t('Pauta de Riego y Humedad')}
                </Text>
                <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                  {plant.watering}
                </Text>
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 8 }]}>
                  {t('Iluminación Recomendada')}
                </Text>
                <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                  {plant.light}
                </Text>
                <Button
                  title={t('Comprobar luz con la cámara')}
                  onPress={() => setLightMeterVisible(true)}
                  variant="secondary"
                  size="sm"
                  icon={<Ionicons name="sunny-outline" size={16} color={colors.primary} />}
                  style={{ marginTop: spacing.md }}
                />
              </Card>

              {/* BOTÓN AL DIARIO DE CRECIMIENTO */}
              <Card
                variant="flat"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: layout.borderRadius.lg,
                  padding: spacing.md,
                }}
              >
                <View style={styles.actionCardRow}>
                  <View style={[styles.actionIconBox, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="images" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>
                      {t('Diario de Crecimiento')}
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                      {t('Guarda fotos con fecha y compara antes vs. después')}
                    </Text>
                  </View>
                </View>
                <Button
                  title={t('Ver Diario de Crecimiento')}
                  onPress={() => navigation.navigate('GrowthDiary', { plantId: plant.id })}
                  variant="secondary"
                  size="md"
                  style={{ marginTop: spacing.md }}
                />
              </Card>

              {/* PREGÚNTALE A ECOSCAN */}
              <Card
                variant="flat"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: layout.borderRadius.lg,
                  padding: spacing.md,
                }}
              >
                <View style={styles.actionCardRow}>
                  <View style={[styles.actionIconBox, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="chatbubbles" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>
                      {t('Pregúntale a EcoScan')}
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                      {t('Resuelve dudas sobre riego, luz, plagas o abono con tu asistente')}
                    </Text>
                  </View>
                </View>
                <Button
                  title={t('Consultar al Asistente')}
                  onPress={() => navigation.navigate('Assistant', { plantName: plant.name })}
                  variant="secondary"
                  size="md"
                  icon={<Ionicons name="sparkles-outline" size={18} color={colors.primary} />}
                  style={{ marginTop: spacing.md }}
                />
              </Card>
            </View>
          ) : activeTab === 'historia' ? (
            <View style={{ gap: spacing.md }}>
              <PlantTimeline
                plantId={plant.id}
                plantName={plant.name}
                lastWatered={matchingGardenPlant?.lastWatered}
                lastDiagnosis={matchingGardenPlant?.lastDiagnosis}
                onNavigateGrowthDiary={() => navigation.navigate('GrowthDiary', { plantId: plant.id })}
              />
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              {/* HÁBITAT Y ORIGEN */}
              <Card
                variant="flat"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: layout.borderRadius.lg,
                  padding: spacing.md,
                }}
              >
                <View style={styles.actionCardRow}>
                  <View style={[styles.actionIconBox, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="earth" size={24} color="#0D47A1" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>
                      {t('Origen y Hábitat')}
                    </Text>
                    <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4, lineHeight: 22 }]}>
                      {plant.habitatSummary}
                    </Text>
                  </View>
                </View>
                <Button
                  title={t('Abrir Mapa de Hábitat')}
                  onPress={() => navigation.navigate('HabitatMap', { plantId: plant.id, plantName: plant.name })}
                  variant="secondary"
                  size="md"
                  style={{ marginTop: spacing.md }}
                />
              </Card>

              {/* PROBLEMAS FRECUENTES Y DIAGNÓSTICO */}
              <Card
                variant="flat"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: layout.borderRadius.lg,
                  padding: spacing.md,
                }}
              >
                <View style={styles.actionCardRow}>
                  <View style={[styles.actionIconBox, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="medkit" size={24} color="#E65100" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>
                      {t('Problemas Comunes')}
                    </Text>
                    <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4, lineHeight: 22 }]}>
                      {Array.isArray(plant.commonProblems) ? plant.commonProblems.join('\n') : plant.commonProblems}
                    </Text>
                  </View>
                </View>
                <Button
                  title={t('Diagnosticar Salud')}
                  onPress={() => navigation.navigate('HealthDiagnosis', { plantId: plant.id, plantName: plant.name })}
                  variant="secondary"
                  size="md"
                  style={{ marginTop: spacing.md }}
                />
              </Card>

              {/* TAXONOMÍA */}
              <Card
                variant="flat"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: layout.borderRadius.lg,
                  padding: spacing.md,
                }}
              >
                <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 8 }]}>
                  {t('Clasificación Botánica')}
                </Text>
                <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                  {t('Familia')}: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{plant.family}</Text>
                </Text>
                <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 4 }]}>
                  {t('Nombre Científico')}: <Text style={{ color: colors.textPrimary, fontWeight: '600', fontStyle: 'italic' }}>{plant.scientificName}</Text>
                </Text>
              </Card>
            </View>
          )}
        </View>
      </ScrollView>

      {/* BOTÓN FLOTANTE: PREGÚNTALE A ECOSCAN */}
      <View
        style={[styles.floatingAssistantContainer, { bottom: Math.max(insets.bottom + 88, 96) }]}
        pointerEvents="box-none"
      >
        <GlassSurface
          variant="strong"
          borderRadius={layout.borderRadius.full}
          style={styles.floatingAssistantGlass}
        >
          <Pressable
            onPress={() => navigation.navigate('Assistant', { plantName: plant.name })}
            style={({ pressed }) => [
              styles.floatingAssistantInner,
              { opacity: pressed && Platform.OS === 'ios' ? 0.85 : 1 },
            ]}
            android_ripple={{ color: colors.primary + '20' }}
            accessibilityRole="button"
            accessibilityLabel={t('Pregúntale a EcoScan')}
          >
            <Ionicons name="chatbubbles" size={20} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '700' }]}>
              {t('Preguntar')}
            </Text>
          </Pressable>
        </GlassSurface>
      </View>

      {/* BARRA INFERIOR DE ACCIÓN PRINCIPAL */}
      <PrimaryActionBar
        primaryTitle={isSaved ? t('Guardada en Mi Jardín') : t('Guardar en Mi Jardín')}
        onPrimaryPress={handleSaveToGarden}
        primaryDisabled={isSaved}
        primaryIcon={
          <Ionicons
            name={isSaved ? 'checkmark-circle' : 'leaf'}
            size={20}
            color="#FFFFFF"
          />
        }
        secondaryTitle={isSaved ? t('Eliminar de Mi Jardín') : undefined}
        onSecondaryPress={isSaved ? handleRemoveFromGarden : undefined}
      />

      {/* MODAL PARA COMPARTIR FICHA */}
      <ShareCardModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        plant={{
          id: plant.id,
          name: plant.name,
          scientificName: plant.scientificName,
          imageUri: plant.imageUri,
          watering: plant.watering,
          light: plant.light,
          healthScore: plant.healthScore,
        }}
      />

      {/* MODAL PARA MEDIR ILUMINACIÓN */}
      <LightMeterModal
        visible={lightMeterVisible}
        onClose={() => setLightMeterVisible(false)}
        plantName={plant.name}
        recommendedLight={plant.light}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    backgroundColor: '#000000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  floatingGlassBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassBtnPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
  actionCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingAssistantContainer: {
    position: 'absolute',
    right: 18,
    zIndex: 10,
  },
  floatingAssistantGlass: {
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  floatingAssistantInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 48,
  },
});
