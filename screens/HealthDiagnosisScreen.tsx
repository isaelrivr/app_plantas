import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConfidenceRing } from '../components/ConfidenceRing';
import { ErrorBanner } from '../components/ErrorBanner';
import { SkeletonBox } from '../components/SkeletonLoader';
import {
  diagnosePlantHealth,
  HealthDiagnosisResult,
  getDiagnosisByKey,
  HealthNoPlantError,
} from '../services/healthService';
import { ApiError } from '../services/apiClient';
import { scheduleTreatmentReminder } from '../services/notificationService';
import { getPlantById } from '../services/plantApi';
import { useGarden } from '../context/GardenContext';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useTranslation } from '../i18n';
import { announce } from '../services/accessibilityService';
import { useFeedback } from '../context/FeedbackContext';

export const HealthDiagnosisScreen: React.FC = () => {
  const { colors, isDark, spacing, typography, layout } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { showToast, confirm } = useFeedback();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { plants, updatePlantHealth, registerDiagnosis } = useGarden();
  const limits = usePlanLimits();
  const { t } = useTranslation();

  const plantId = route.params?.plantId;
  const plantDef = plantId ? getPlantById(plantId) : undefined;
  // El parámetro puede ser un id de jardín ("plant-1") o un slug de especie
  const gardenPlant = plantId
    ? plants.find(
        (p) =>
          p.id === plantId ||
          p.name.toLowerCase().includes(plantId.replace(/[-_]/g, ' ').toLowerCase())
      )
    : undefined;
  // El nombre puede venir explícito (plantas identificadas por IA no están en el catálogo).
  const plantName: string | undefined =
    route.params?.plantName ?? plantDef?.name ?? gardenPlant?.name;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosisStepText, setDiagnosisStepText] = useState<string>(t('Revisando las hojas...'));
  const [diagnosisResult, setDiagnosisResult] = useState<HealthDiagnosisResult | null>(null);
  const [treatmentMode, setTreatmentMode] = useState<'organic' | 'chemical'>('organic');
  const [treatmentScheduled, setTreatmentScheduled] = useState<boolean>(false);

  // Animación láser médica
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDiagnosing) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();

      const t1 = setTimeout(() => setDiagnosisStepText(t('Revisando posibles plagas...')), 500);
      const t2 = setTimeout(() => setDiagnosisStepText(t('Buscando tratamientos adecuados...')), 1000);

      return () => {
        anim.stop();
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      laserAnim.setValue(0);
    }
  }, [isDiagnosing, laserAnim, t]);

  const handleTakePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        if (!perm.canAskAgain) {
          const openSettings = await confirm({
            title: t('Permiso de cámara necesario'),
            message: t('Para diagnosticar plantas con la cámara, activa el permiso en los ajustes de tu teléfono.'),
            confirmText: t('Abrir ajustes'),
            cancelText: t('Ahora no'),
          });
          if (openSettings) {
            await Linking.openSettings();
          }
          return;
        }
        showToast({
          message: t('Necesitas permiso de cámara para diagnosticar la planta.'),
          type: 'warning',
        });
        return;
      }
      const shot = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!shot.canceled && shot.assets?.[0]?.uri) {
        processImage(shot.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error al abrir la cámara:', err);
      setErrorMessage(t('No se pudo abrir la cámara. Puedes elegir una foto de la galería.'));
    }
  };

  const handlePickFromGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets?.[0]?.uri) {
        processImage(pickerResult.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error al abrir la galería:', err);
      setErrorMessage(t('No se pudo abrir la galería de imágenes.'));
    }
  };

  const handleUseSample = async (issueKey?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sampleUri = 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?auto=format&fit=crop&w=600&q=80';
    if (issueKey) {
      const specific = getDiagnosisByKey(issueKey);
      if (specific) {
        if (await guardPestResult(specific)) {
          return;
        }
        setPhotoUri(sampleUri);
        setDiagnosisResult(specific);
        setTreatmentScheduled(false);
        setErrorMessage(null);
        if (plantId) {
          const score = specific.severity === 'grave' ? 45 : specific.severity === 'moderada' ? 68 : 95;
          updatePlantHealth(plantId, score, specific.name);
        }
        return;
      }
    }
    processImage(sampleUri);
  };

  const guardPestResult = async (result: HealthDiagnosisResult): Promise<boolean> => {
    if (result.category === 'Plaga' && limits.isFeatureLocked('pestDiagnosis')) {
      const seePro = await confirm({
        title: t('Diagnóstico de plagas Pro'),
        message: t('Detectamos {nombre}. Identificar plagas con detalle y su tratamiento es exclusivo de EcoScan Pro.', { nombre: result.name }),
        confirmText: t('Ver Pro'),
        cancelText: t('Ahora no'),
      });
      if (seePro) {
        navigation.navigate('Paywall');
      }
      return true;
    }
    return false;
  };

  const processImage = async (uri: string) => {
    if (limits.isFeatureLocked('pestDiagnosis')) {
      const seePro = await confirm({
        title: t('Diagnóstico fitosanitario Pro'),
        message: t(
          'El análisis fitosanitario de hojas, plagas y hongos con IA es exclusivo de EcoScan Pro. Desbloquea diagnósticos ilimitados y planes de tratamiento.'
        ),
        confirmText: t('Desbloquear Pro'),
        cancelText: t('Ahora no'),
      });
      if (seePro) {
        navigation.navigate('Paywall');
      }
      return;
    }

    setPhotoUri(uri);
    setLastAnalyzed(uri);
    setDiagnosisResult(null);
    setTreatmentScheduled(false);
    setErrorMessage(null);
    setIsDiagnosing(true);

    try {
      const result = await diagnosePlantHealth([uri], plantName);
      if (await guardPestResult(result)) {
        setDiagnosisResult(null);
        return;
      }
      setDiagnosisResult(result);
      registerDiagnosis();
      announce(t('Diagnóstico completado: {nombre}', { nombre: result.name }));

      // Pulso háptico de detección
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}

      // Si se vinculó una planta del jardín, actualizar su puntuación de salud
      if (plantId) {
        const score = result.severity === 'grave' ? 45 : result.severity === 'moderada' ? 68 : 95;
        updatePlantHealth(plantId, score, result.name);
      }
    } catch (err) {
      if (err instanceof HealthNoPlantError) {
        setErrorMessage(
          t('No detectamos una planta en la imagen. Enfoca de cerca las hojas o el tallo y vuelve a intentarlo.')
        );
      } else if (err instanceof ApiError && err.status === 429) {
        const retry = err.retryAfterSeconds
          ? t(' Podrás volver a intentarlo en {min} min.', { min: Math.ceil(err.retryAfterSeconds / 60) })
          : '';
        const wantPro = await confirm({
          title: t('Límite de diagnósticos'),
          message: `${err.message}${retry}`,
          confirmText: t('Ver Pro'),
          cancelText: t('Entendido'),
        });
        if (wantPro) navigation.navigate('Paywall');
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t('No se pudo completar el análisis fitosanitario. Revisa tu conexión y vuelve a intentarlo.'));
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  const incomingPhoto = route.params?.photoUri || route.params?.initialPhotoUri;
  useEffect(() => {
    if (incomingPhoto && !photoUri && !diagnosisResult && !isDiagnosing) {
      processImage(incomingPhoto);
    }
  }, [incomingPhoto]);

  const handleRetryDiagnosis = () => {
    if (lastAnalyzed) {
      processImage(lastAnalyzed);
    }
  };

  const handleScheduleTreatment = async () => {
    if (!diagnosisResult) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const reminderPlantName = plantName || t('tu planta');
    const activeOption =
      treatmentMode === 'organic'
        ? diagnosisResult.treatment.organicOption.title
        : diagnosisResult.treatment.chemicalOption.title;

    const identifier = await scheduleTreatmentReminder(reminderPlantName, activeOption, 4, plantId);
    if (!identifier) {
      setErrorMessage(t('No se pudo programar el recordatorio. Revisa los permisos de notificación.'));
      return;
    }
    setTreatmentScheduled(true);
    setErrorMessage(null);
    announce(t('Tratamiento programado'));

    showToast({
      message: t('Recordatorio programado para "{tratamiento}" cada {frecuencia}', {
        tratamiento: activeOption,
        frecuencia: diagnosisResult.treatment.frequency,
      }),
      type: 'success',
    });
  };

  const getSeverityBadgeVariant = (severity: string): 'error' | 'warning' | 'success' => {
    if (severity === 'grave') return 'error';
    if (severity === 'moderada') return 'warning';
    return 'success';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER HIG */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
        </Pressable>

        <View style={styles.headerTitleCenter}>
          <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
            {t('Diagnóstico de Salud')}
          </Text>
          <Text style={[typography.caption1, { color: colors.textSecondary }]} numberOfLines={1}>
            {plantName || t('Evaluación de plagas y hongos')}
          </Text>
        </View>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 60 }}
      >
        {/* BOTÓN O FOTO DE ANÁLISIS */}
        {!photoUri ? (
          <Card
            variant="flat"
            style={{
              alignItems: 'center',
              paddingVertical: 28,
              paddingHorizontal: spacing.md,
              borderRadius: layout.borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <View style={[styles.cameraIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="medkit" size={40} color={colors.primary} />
            </View>

            <Text style={[typography.title2, { color: colors.textPrimary, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' }]}>
              {t('Diagnosticar hoja o tallo')}
            </Text>

            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 22 }]}>
              {t('Toma una foto de cerca a las hojas manchadas, descoloridas o con presencia de insectos para identificar la causa exacta y su cura.')}
            </Text>

            {errorMessage && (
              <ErrorBanner
                message={errorMessage}
                onRetry={lastAnalyzed ? handleRetryDiagnosis : undefined}
                style={{ marginBottom: spacing.md, alignSelf: 'stretch' }}
              />
            )}

            <View style={{ width: '100%', gap: 10 }}>
              <Button
                title={t('Tomar foto con la cámara')}
                onPress={handleTakePhoto}
                variant="primary"
                size="lg"
                icon={<Ionicons name="camera" size={20} color="#FFFFFF" />}
              />

              <Button
                title={t('Seleccionar foto de la galería')}
                onPress={handlePickFromGallery}
                variant="secondary"
                size="lg"
                icon={<Ionicons name="images" size={20} color={colors.primary} />}
              />

              {__DEV__ ? (
                <>
                  <Button
                    title={t('Analizar muestra con Cochinilla (Demo)')}
                    onPress={() => handleUseSample('cochinilla')}
                    variant="secondary"
                    size="md"
                    icon={<Ionicons name="bug" size={18} color={colors.primary} />}
                  />

                  <Button
                    title={t('Analizar muestra con Hongos (Demo)')}
                    onPress={() => handleUseSample('hongos')}
                    variant="secondary"
                    size="md"
                    icon={<Ionicons name="shield-outline" size={18} color={colors.primary} />}
                  />
                </>
              ) : null}
            </View>
          </Card>
        ) : (
          <View>
            {/* VISTA PREVIA CON ANIMACIÓN LÁSER */}
            <View style={[styles.previewBox, { borderColor: colors.border }]}>
              <Image
                source={{ uri: photoUri }}
                style={styles.previewImage}
                resizeMode="cover"
                accessible={true}
                accessibilityLabel={t('Foto capturada de la planta para diagnóstico')}
              />

              {isDiagnosing && (
                <View style={styles.laserOverlay}>
                  <Animated.View
                    style={[
                      styles.laserLine,
                      {
                        backgroundColor: colors.error,
                        transform: [
                          {
                            translateY: laserAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 220],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <View style={styles.loadingPill}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[typography.footnote, { color: '#FFFFFF', marginLeft: 8, fontWeight: '600' }]}>
                      {diagnosisStepText}
                    </Text>
                  </View>
                </View>
              )}

              <Pressable
                onPress={() => {
                  setPhotoUri(null);
                  setDiagnosisResult(null);
                  setErrorMessage(null);
                }}
                android_ripple={{ color: '#FFFFFF44', borderless: true, radius: 24 }}
                style={({ pressed }) => [styles.retakeFloatingBtn, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel={t('Analizar otra foto')}
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {errorMessage && (
              <ErrorBanner
                message={errorMessage}
                onRetry={lastAnalyzed ? handleRetryDiagnosis : undefined}
                style={{ marginTop: spacing.sm }}
              />
            )}

            {/* SKELETON DEL RESULTADO MIENTRAS SE ANALIZA */}
            {isDiagnosing && (
              <Card
                variant="flat"
                style={{
                  marginTop: spacing.md,
                  borderRadius: layout.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
                accessible={true}
                accessibilityLabel={t('Analizando la muestra')}
              >
                <SkeletonBox width="60%" height={22} borderRadius={6} />
                <SkeletonBox width="100%" height={14} borderRadius={6} style={{ marginTop: 12 }} />
                <SkeletonBox width="85%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
                <SkeletonBox width="100%" height={90} borderRadius={12} style={{ marginTop: 16 }} />
              </Card>
            )}

            {/* RESULTADO DEL DIAGNÓSTICO */}
            {diagnosisResult && (
              <View style={{ marginTop: spacing.md, gap: spacing.md }}>
                {/* TARJETA CABECERA DEL PROBLEMA */}
                <Card
                  variant="flat"
                  style={{
                    borderRadius: layout.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <View style={styles.resultHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Badge label={t(diagnosisResult.category)} variant="neutral" />
                        <Badge
                          label={t('Severidad {nivel}', { nivel: t(diagnosisResult.severity).toUpperCase() })}
                          variant={getSeverityBadgeVariant(diagnosisResult.severity)}
                        />
                      </View>

                      <Text style={[typography.title1, { color: colors.textPrimary, fontWeight: '700' }]}>
                        {diagnosisResult.name}
                      </Text>
                      <Text style={[typography.footnote, { color: colors.textTertiary, fontStyle: 'italic', marginTop: 1 }]}>
                        {diagnosisResult.scientificName}
                      </Text>
                    </View>

                    <ConfidenceRing
                      score={diagnosisResult.confidence}
                      size={64}
                      strokeWidth={6}
                      colorVariant="health"
                    />
                  </View>

                  <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 }]}>
                    {diagnosisResult.description}
                  </Text>

                  {diagnosisResult.confidence < 60 && diagnosisResult.source !== 'mock' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm }}>
                      <Ionicons name="help-circle" size={18} color={colors.warning} />
                      <Text style={[typography.footnote, { color: colors.textSecondary, flex: 1, marginLeft: 8, lineHeight: 19 }]}>
                        {t('La confianza del diagnóstico es baja ({confianza}%). Toma una foto más nítida de las zonas afectadas para confirmarlo.', { confianza: diagnosisResult.confidence })}
                      </Text>
                    </View>
                  ) : null}

                  {/* SÍNTOMAS IDENTIFICADOS */}
                  <View style={[styles.symptomsBox, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600', marginBottom: 6 }]}>
                      {t('Síntomas visuales detectados:')}
                    </Text>
                    {diagnosisResult.symptoms.map((s, idx) => (
                      <View key={idx} style={styles.symptomItem}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.warning} style={{ marginTop: 2 }} />
                        <Text style={[typography.footnote, { color: colors.textSecondary, flex: 1, marginLeft: 8 }]}>
                          {s}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* FOTOS DE REFERENCIA DEL PROBLEMA */}
                  {diagnosisResult.referenceImages.length > 0 && (
                    <View style={{ marginTop: spacing.md }}>
                      <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600', marginBottom: 8 }]}>
                        {t('Fotos de referencia:')}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {diagnosisResult.referenceImages.map((refKey, idx) => (
                          <View
                            key={`${refKey}-${idx}`}
                            accessible={true}
                            accessibilityLabel={t('Foto de referencia {indice}: {nombre}', { indice: idx + 1, nombre: refKey.replace(/_/g, ' ') })}
                            style={[styles.referenceTile, { backgroundColor: colors.surfaceSecondary }]}
                          >
                            <Ionicons name="image-outline" size={26} color={colors.textTertiary} />
                            <Text
                              style={[typography.caption2, { color: colors.textTertiary, textAlign: 'center', marginTop: 4 }]}
                              numberOfLines={2}
                            >
                              {refKey.replace(/_/g, ' ')}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </Card>

                {/* SELECTOR HIG: TRATAMIENTO ORGÁNICO VS QUÍMICO */}
                <View style={[styles.treatmentSelector, { backgroundColor: colors.surfaceSecondary }]}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.treatmentTabBtn,
                      treatmentMode === 'organic' && [styles.treatmentTabActive, { backgroundColor: colors.surface }],
                      { overflow: 'hidden' },
                      pressed && { opacity: 0.8 },
                    ]}
                    android_ripple={{ color: colors.primaryLight }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTreatmentMode('organic');
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: treatmentMode === 'organic' }}
                    accessibilityLabel={t('Tratamiento orgánico ecológico')}
                  >
                    <Ionicons
                      name="leaf"
                      size={16}
                      color={treatmentMode === 'organic' ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        typography.subheadline,
                        {
                          color: treatmentMode === 'organic' ? colors.textPrimary : colors.textSecondary,
                          fontWeight: treatmentMode === 'organic' ? '700' : '500',
                          marginLeft: 6,
                        },
                      ]}
                    >
                      {t('Opción Orgánica (Eco)')}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.treatmentTabBtn,
                      treatmentMode === 'chemical' && [styles.treatmentTabActive, { backgroundColor: colors.surface }],
                      { overflow: 'hidden' },
                      pressed && { opacity: 0.8 },
                    ]}
                    android_ripple={{ color: colors.primaryLight }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTreatmentMode('chemical');
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: treatmentMode === 'chemical' }}
                    accessibilityLabel={t('Tratamiento químico de acción rápida')}
                  >
                    <Ionicons
                      name="flask"
                      size={16}
                      color={treatmentMode === 'chemical' ? colors.info : colors.textSecondary}
                    />
                    <Text
                      style={[
                        typography.subheadline,
                        {
                          color: treatmentMode === 'chemical' ? colors.textPrimary : colors.textSecondary,
                          fontWeight: treatmentMode === 'chemical' ? '700' : '500',
                          marginLeft: 6,
                        },
                      ]}
                    >
                      {t('Opción Química (Rápida)')}
                    </Text>
                  </Pressable>
                </View>

                {/* DETALLE DEL TRATAMIENTO SELECCIONADO */}
                <Card
                  variant="flat"
                  style={{
                    borderRadius: layout.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <View style={styles.optionHeader}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>
                      {treatmentMode === 'organic'
                        ? diagnosisResult.treatment.organicOption.title
                        : diagnosisResult.treatment.chemicalOption.title}
                    </Text>
                  </View>

                  {/* Productos y Dosis */}
                  <View style={styles.recipeRow}>
                    <Ionicons name="basket" size={18} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[typography.caption1, { color: colors.textTertiary }]}>{t('Productos de referencia:')}</Text>
                      <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600' }]}>
                        {treatmentMode === 'organic'
                          ? diagnosisResult.treatment.organicOption.products
                          : diagnosisResult.treatment.chemicalOption.products}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.recipeRow, { marginTop: 8 }]}>
                    <Ionicons name="color-filter" size={18} color={colors.accent} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[typography.caption1, { color: colors.textTertiary }]}>{t('Dosis exacta recomendada:')}</Text>
                      <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600' }]}>
                        {treatmentMode === 'organic'
                          ? diagnosisResult.treatment.organicOption.dosage
                          : diagnosisResult.treatment.chemicalOption.dosage}
                      </Text>
                    </View>
                  </View>

                  <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md, lineHeight: 22 }]}>
                    {treatmentMode === 'organic'
                      ? diagnosisResult.treatment.organicOption.instructions
                      : diagnosisResult.treatment.chemicalOption.instructions}
                  </Text>

                  <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: spacing.md }]} />

                  {/* CRONOGRAMA Y RECUPERACIÓN */}
                  <View style={styles.timelineRow}>
                    <View style={styles.timelineItem}>
                      <Ionicons name="repeat" size={18} color={colors.info} />
                      <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 2 }]}>{t('Frecuencia')}</Text>
                      <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '600' }]}>
                        {diagnosisResult.treatment.frequency}
                      </Text>
                    </View>

                    <View style={styles.timelineItem}>
                      <Ionicons name="time" size={18} color={colors.warning} />
                      <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 2 }]}>{t('Tiempo de mejora')}</Text>
                      <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '600' }]}>
                        {diagnosisResult.treatment.recoveryDays}
                      </Text>
                    </View>
                  </View>
                </Card>

                {/* ADVERTENCIA DE SEGURIDAD (APPLE HIG ALERT CARD) */}
                <Card
                  variant="flat"
                  style={[
                    styles.safetyCard,
                    {
                      borderRadius: layout.borderRadius.lg,
                      borderWidth: 1,
                      borderColor: colors.warning,
                      backgroundColor: isDark ? 'rgba(255, 183, 77, 0.12)' : colors.warningLight,
                    },
                  ]}
                >
                  <View style={styles.safetyHeader}>
                    <Ionicons name="warning" size={22} color={colors.warning} />
                    <Text style={[typography.headline, { color: colors.textPrimary, marginLeft: 8 }]}>
                      {t('Advertencia de Seguridad')}
                    </Text>
                  </View>

                  <View style={styles.safetyChipsRow}>
                    {diagnosisResult.treatment.safetyAlert.hasPetsWarning && (
                      <View style={[styles.safetyChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.warningLight }]}>
                        <Ionicons name="paw-outline" size={14} color={colors.warning} style={{ marginRight: 4 }} />
                        <Text style={[typography.caption2, { color: colors.textPrimary, fontWeight: '600' }]}>
                          {t('Proteger mascotas')}
                        </Text>
                      </View>
                    )}
                    {diagnosisResult.treatment.safetyAlert.hasChildrenWarning && (
                      <View style={[styles.safetyChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.warningLight }]}>
                        <Ionicons name="happy-outline" size={14} color={colors.warning} style={{ marginRight: 4 }} />
                        <Text style={[typography.caption2, { color: colors.textPrimary, fontWeight: '600' }]}>
                          {t('Fuera de alcance infantil')}
                        </Text>
                      </View>
                    )}
                    {diagnosisResult.treatment.safetyAlert.requireGloves && (
                      <View style={[styles.safetyChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.warningLight }]}>
                        <Ionicons name="hand-left-outline" size={14} color={colors.warning} style={{ marginRight: 4 }} />
                        <Text style={[typography.caption2, { color: colors.textPrimary, fontWeight: '600' }]}>
                          {t('Usar guantes')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 8, lineHeight: 20 }]}>
                    {diagnosisResult.treatment.safetyAlert.text}
                  </Text>
                </Card>

                {/* PREVENCIÓN */}
                <Card
                  variant="flat"
                  style={{
                    borderRadius: layout.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 4 }]}>
                    {t('Cómo prevenirlo a futuro')}
                  </Text>
                  <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                    {diagnosisResult.treatment.prevention}
                  </Text>
                </Card>

                {/* DESCARGO MÉDICO (obligatorio en diagnósticos por IA) */}
                <Card
                  variant="flat"
                  style={{
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: layout.borderRadius.lg,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
                    <Text style={[typography.caption1, { color: colors.textSecondary, flex: 1, marginLeft: 8, lineHeight: 18 }]}>
                      {diagnosisResult.disclaimer}
                    </Text>
                  </View>
                </Card>

                {/* BOTÓN: PROGRAMAR TRATAMIENTO CON RECORDATORIOS */}
                <Button
                  title={treatmentScheduled ? t('Tratamiento programado') : t('Programar recordatorio')}
                  onPress={handleScheduleTreatment}
                  disabled={treatmentScheduled}
                  variant={treatmentScheduled ? 'secondary' : 'primary'}
                  size="lg"
                  icon={<Ionicons name={treatmentScheduled ? 'checkmark-circle' : 'notifications'} size={20} color={treatmentScheduled ? colors.primary : '#FFFFFF'} />}
                />
              </View>
            )}
          </View>
        )}
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
    minWidth: 48,
    minHeight: 48,
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  cameraIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    height: 230,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  laserOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeFloatingBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceTile: {
    width: 96,
    height: 88,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  symptomsBox: {
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
  },
  treatmentSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  treatmentTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 48,
  },
  treatmentTabActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  optionHeader: {
    marginBottom: 12,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    width: '100%',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timelineItem: {
    alignItems: 'center',
  },
  safetyCard: {
    borderWidth: 1.5,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  safetyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
});
