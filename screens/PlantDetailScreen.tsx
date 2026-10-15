import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import { Card } from '../components/Card';
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
      {/* HEADER NAVEGACIÓN */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === 'ios' ? 44 : 16,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('Volver')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>
            {t('Atrás')}
          </Text>
        </TouchableOpacity>

        <Text style={[typography.headline, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]} numberOfLines={1}>
          {plant.name}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setLightMeterVisible(true)}
            style={styles.headerIconButton}
            accessibilityRole="button"
            accessibilityLabel={t('Medidor de luz')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="sunny-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Assistant', { plantName: plant.name })}
            style={[styles.headerIconButton, { marginLeft: 4 }]}
            accessibilityRole="button"
            accessibilityLabel={t('Pregúntale a EcoScan')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShareModalVisible(true)}
            style={[styles.headerIconButton, { marginLeft: 6 }]}
            accessibilityRole="button"
            accessibilityLabel={t('Compartir')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }}>
        {/* FOTO HERO */}
        {plant.imageUri ? (
          <Image
            source={{ uri: plant.imageUri }}
            style={[styles.heroImage, { borderRadius: layout.borderRadius.xl }]}
            accessible
            accessibilityLabel={plant.name}
          />
        ) : null}

        {/* TÍTULO BOTÁNICO */}
        <Text style={[typography.title1, { color: colors.textPrimary, fontWeight: '800', marginTop: spacing.sm }]}>
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
            <Card elevated style={{ backgroundColor: colors.surface }}>
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
            <Card style={{ backgroundColor: colors.surface }}>
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
            <Card style={{ backgroundColor: colors.surface }}>
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
            <Card elevated style={{ backgroundColor: colors.surface }}>
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
                onPress={() => navigation.navigate('HabitatMap', { speciesId: plant.id, plantName: plant.name })}
                variant="secondary"
                size="md"
                style={{ marginTop: spacing.md }}
              />
            </Card>

            {/* PROBLEMAS FRECUENTES Y DIAGNÓSTICO */}
            <Card elevated style={{ backgroundColor: colors.surface }}>
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
            <Card style={{ backgroundColor: colors.surface }}>
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
      </ScrollView>

      {/* BOTÓN FLOTANTE: PREGÚNTALE A ECOSCAN */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Assistant', { plantName: plant.name })}
        style={[
          styles.floatingAssistantBtn,
          { backgroundColor: colors.primary },
        ]}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('Pregúntale a EcoScan')}
      >
        <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={[typography.subheadline, { color: '#FFFFFF', fontWeight: '700' }]}>
          {t('Preguntar')}
        </Text>
      </TouchableOpacity>

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
    minHeight: 44,
    minWidth: 44,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 240,
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
  floatingAssistantBtn: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
  },
});
