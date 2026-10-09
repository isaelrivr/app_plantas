import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ConfidenceRing } from '../components/ConfidenceRing';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  identifyPlants,
  fetchCareSheet,
  PlantIdentificationResult,
  IdentificationCandidate,
} from '../services/plantApi';
import { ApiError } from '../services/apiClient';
import { persistImage } from '../services/mediaService';
import { useGarden } from '../context/GardenContext';
import { usePlanLimits, FREE_IDENTIFICATION_LIMIT } from '../hooks/usePlanLimits';
import { SkeletonBox } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { useTranslation } from '../i18n';

const MAX_PHOTOS = 4;
/** Por debajo de este umbral pedimos confirmación manual al usuario. */
const LOW_CONFIDENCE_THRESHOLD = 60;

export const ScannerScreen: React.FC = () => {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const { plants, addPlant, registerIdentification } = useGarden();
  const limits = usePlanLimits();
  const navigation = useNavigation<any>();

  // Permisos y control de cámara
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);

  // Fotos de la MISMA planta (hasta 4 mejoran la precisión)
  const [photos, setPhotos] = useState<string[]>([]);

  // Estados del flujo de escaneo
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>(t('Analizando patrones...'));
  const [identificationResult, setIdentificationResult] = useState<PlantIdentificationResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavedToGarden, setIsSavedToGarden] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const showAnalysisView = isIdentifying || identificationResult !== null || errorMessage !== null;

  // Animación de línea láser de escaneo
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isIdentifying) {
      scanLineAnim.setValue(0);
      scanLoop.current?.stop();
      scanLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      scanLoop.current.start();

      const timer1 = setTimeout(() => {
        setScanStepText(t('Analizando forma y nervadura foliar...'));
      }, 400);

      const timer2 = setTimeout(() => {
        setScanStepText(t('Consultando el proveedor botánico...'));
      }, 900);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        scanLoop.current?.stop();
        scanLoop.current = null;
      };
    } else {
      scanLineAnim.setValue(0);
      scanLoop.current?.stop();
      scanLoop.current = null;
    }
  }, [isIdentifying, scanLineAnim, t]);

  // 1. PANTALLA PREVIA DE PERMISO DE CÁMARA
  if (!permission) {
    return (
      <View
        style={[styles.permissionContainer, { backgroundColor: colors.background, padding: spacing.xl }]}
        accessible={true}
        accessibilityLabel={t('Cargando cámara y reconocimiento botánico')}
      >
        <SkeletonBox width={90} height={90} borderRadius={45} />
        <View style={{ marginTop: spacing.lg, width: '80%' }}>
          <SkeletonBox width="100%" height={22} borderRadius={8} />
        </View>
        <View style={{ marginTop: spacing.md, width: '90%' }}>
          <SkeletonBox width="100%" height={14} borderRadius={6} />
        </View>
        <View style={{ marginTop: spacing.sm, width: '90%' }}>
          <SkeletonBox width="100%" height={14} borderRadius={6} />
        </View>
        <View style={{ marginTop: spacing.sm, width: '70%' }}>
          <SkeletonBox width="100%" height={14} borderRadius={6} />
        </View>
        <View style={{ marginTop: spacing.xl, width: '100%' }}>
          <SkeletonBox width="100%" height={52} borderRadius={14} />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <View
          style={[
            styles.permissionIconCircle,
            { backgroundColor: colors.primaryLight, marginBottom: spacing.lg },
          ]}
        >
          <Ionicons name="camera" size={48} color={colors.primary} />
        </View>

        <Text
          style={[
            typography.title1,
            { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm, fontWeight: '700' },
          ]}
        >
          {t('Reconocimiento Botánico')}
        </Text>

        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 24 },
          ]}
        >
          {t('Apunta la cámara a cualquier hoja o flor para identificar su especie, origen biológico en el mapa mundial y guía de cuidados.')}
        </Text>

        <Button
          title={t('Permitir cámara')}
          onPress={requestPermission}
          variant="primary"
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    );
  }

  // ACCIÓN: Captura con haptics (se añade a la bandeja de fotos)
  const addPhoto = (uri: string) => {
    setPhotos((prev) => {
      if (prev.length >= MAX_PHOTOS) {
        Alert.alert(
          t('Máximo de fotos'),
          t('Puedes analizar hasta {max} fotos de la misma planta. Elimina alguna para añadir otra.', { max: MAX_PHOTOS })
        );
        return prev;
      }
      return [...prev, uri];
    });
  };

  const handleCapture = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        t('Máximo de fotos'),
        t('Puedes analizar hasta {max} fotos de la misma planta. Pulsa "Analizar" o elimina alguna.', { max: MAX_PHOTOS })
      );
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (photo?.uri) addPhoto(photo.uri);
      }
    } catch {
      Alert.alert(t('Error'), t('No se pudo capturar la imagen. Intenta de nuevo.'));
    }
  };

  const handlePickFromGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]?.uri) {
        addPhoto(pickerResult.assets[0].uri);
      }
    } catch {
      Alert.alert(t('Galería'), t('No se pudo acceder a las fotos.'));
    }
  };

  const handleUseMockSample = () => {
    if (!__DEV__) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sampleUri = 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80';
    addPhoto(sampleUri);
  };

  const handleRemovePhoto = (index: number) => {
    Haptics.selectionAsync();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearPhotos = () => {
    Haptics.selectionAsync();
    setPhotos([]);
  };

  const toggleFacing = () => {
    Haptics.selectionAsync();
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleTorch = () => {
    Haptics.selectionAsync();
    setTorchEnabled((prev) => !prev);
  };

  const handleAnalyze = async () => {
    if (photos.length === 0) return;

    // Límite free de UX (el servidor aplica el suyo de 3/día).
    if (!limits.isPremium && limits.identificationsToday >= limits.identificationLimit) {
      Alert.alert(
        t('Límite gratuito alcanzado'),
        t('Usaste tus {limite} identificaciones gratuitas de hoy. Con Plantae Pro escaneas sin límites.', { limite: limits.identificationLimit }),
        [
          { text: t('Ahora no'), style: 'cancel' },
          { text: t('Ver Pro'), onPress: () => navigation.navigate('Paywall') },
        ]
      );
      return;
    }

    setErrorMessage(null);
    setIdentificationResult(null);
    setSelectedIndex(0);
    setIsSavedToGarden(false);
    setIsIdentifying(true);
    setScanStepText(t('Enfocando patrones foliares...'));

    try {
      const result = await identifyPlants(photos);
      setIdentificationResult(result);
      registerIdentification();

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        const retry = err.retryAfterSeconds
          ? t(' Podrás volver a intentarlo en {min} min.', { min: Math.ceil(err.retryAfterSeconds / 60) })
          : '';
        Alert.alert(t('Límite de identificaciones'), `${err.message}${retry}`, [
          { text: t('Entendido'), style: 'cancel' },
          { text: t('Ver Pro'), onPress: () => navigation.navigate('Paywall') },
        ]);
        setErrorMessage(err.message);
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : t('No se pudo identificar la planta. Intenta con mejor iluminación.');
        setErrorMessage(msg);
      }
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos([]);
    setIdentificationResult(null);
    setErrorMessage(null);
    setIsSavedToGarden(false);
    setIsIdentifying(false);
    setSelectedIndex(0);
    setIsSaving(false);
  };

  const selectedCandidate: IdentificationCandidate | undefined =
    identificationResult?.candidates?.[selectedIndex];

  const isLowConfidence =
    !!identificationResult && (!identificationResult.isPlant || identificationResult.confidence < LOW_CONFIDENCE_THRESHOLD);

  const handleSelectCandidate = (index: number) => {
    Haptics.selectionAsync();
    setSelectedIndex(index);
  };

  const handleSaveToGarden = async () => {
    const candidate = selectedCandidate;
    if (!candidate) return;

    // Límite free de plantas en Mi Jardín (máx. 5)
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

    setIsSaving(true);
    try {
      // Ampliamos la ficha con el backend/catálogo antes de guardar.
      const sheet = await fetchCareSheet(candidate.name, candidate.scientificName);
      const persistedUri = await persistImage(photos[0], 'plants');

      addPlant({
        name: candidate.name,
        scientificName: candidate.scientificName,
        wateringFrequencyDays: sheet.wateringFrequencyDays,
        light: sheet.light,
        avatarEmoji: sheet.avatarEmoji,
        imageUri: persistedUri,
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setIsSavedToGarden(true);
      Alert.alert(t('Añadida a Mi Jardín'), t('{nombre} se guardó junto a su ficha de cuidados.', { nombre: candidate.name }));
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 429
          ? err.message
          : t('No se pudo guardar la planta. Revisa tu conexión e inténtalo de nuevo.');
      Alert.alert(t('No se pudo guardar'), msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenHabitatMap = () => {
    if (!selectedCandidate) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    navigation.navigate('HabitatMap', { plantId: selectedCandidate.id });
  };

  const handleOpenPlantDetail = () => {
    if (!selectedCandidate) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    navigation.navigate('PlantDetail', {
      plantId: selectedCandidate.id,
      plantName: selectedCandidate.name,
      scientificName: selectedCandidate.scientificName,
      confidence: selectedCandidate.confidence,
    });
  };

  const handleOpenDiagnosis = () => {
    if (!selectedCandidate) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    navigation.navigate('HealthDiagnosis', {
      plantId: selectedCandidate.id,
      plantName: selectedCandidate.name,
      scientificName: selectedCandidate.scientificName,
    });
  };

  // 2. VISTA DE ANÁLISIS Y RESULTADOS
  if (showAnalysisView) {
    const translateY = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 260],
    });

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={
            isIdentifying
              ? t('Analizando Planta')
              : identificationResult
              ? t('Planta Identificada')
              : t('Vista Previa')
          }
          subtitle={t('Reconocimiento Inteligente')}
        />

        {/* Tarjeta con foto y visor láser animado */}
        <View style={[styles.previewContainer, { borderColor: colors.border }]}>
          <Image
            source={{ uri: photos[0] }}
            style={styles.previewImage}
            resizeMode="cover"
            accessibilityLabel={t('Foto de la planta que estás analizando')}
          />

          {isIdentifying && (
            <View style={styles.scanOverlay}>
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: colors.primary,
                    transform: [{ translateY }],
                  },
                ]}
              />
              <View style={styles.scanLoadingBadge}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.scanLoadingText}>{scanStepText}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Estado de carga: esqueleto de la tarjeta de resultado */}
        {isIdentifying && (
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            <Card elevated>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SkeletonBox width={64} height={64} borderRadius={32} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <SkeletonBox width="40%" height={14} borderRadius={6} />
                  <SkeletonBox width="85%" height={20} borderRadius={6} style={{ marginTop: 8 }} />
                  <SkeletonBox width="60%" height={13} borderRadius={6} style={{ marginTop: 6 }} />
                </View>
              </View>
              <View style={{ marginTop: spacing.lg, flexDirection: 'row', gap: 8 }}>
                <SkeletonBox width="48%" height={40} borderRadius={12} />
                <SkeletonBox width="48%" height={40} borderRadius={12} />
              </View>
              <View style={{ marginTop: spacing.md, flexDirection: 'row', gap: 8 }}>
                <SkeletonBox width="48%" height={40} borderRadius={12} />
                <SkeletonBox width="48%" height={40} borderRadius={12} />
              </View>
            </Card>
          </View>
        )}

        {/* Estado de error */}
        {!isIdentifying && errorMessage && (
          <Card style={{ marginTop: spacing.md, borderColor: colors.error }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Ionicons name="alert-circle" size={24} color={colors.error} />
              <Text style={[typography.headline, { color: colors.error, marginLeft: spacing.xs }]}>
                {t('No pudimos reconocer la planta')}
              </Text>
            </View>
            <Text style={[typography.body, { color: colors.textPrimary, marginBottom: spacing.md }]}>
              {errorMessage}
            </Text>
            <Button
              title={t('Tomar otras fotos')}
              onPress={handleRetake}
              variant="primary"
              icon={<Ionicons name="camera-reverse" size={18} color="#FFFFFF" />}
            />
          </Card>
        )}

        {/* TARJETA CON EL RESULTADO DE LA PLANTA IDENTIFICADA */}
        {!isIdentifying && identificationResult && (
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {/* AVISO DE CALIDAD DE LA IMAGEN */}
            {identificationResult.imageQuality.note && (
              <Card style={{ borderColor: colors.warning }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Ionicons name="information-circle" size={20} color={colors.warning} />
                  <Text style={[typography.footnote, { color: colors.textPrimary, flex: 1, marginLeft: 8, lineHeight: 20 }]}>
                    {identificationResult.imageQuality.note}
                  </Text>
                </View>
              </Card>
            )}

            {/* "NO ESTOY SEGURO": isPlant=false o confianza < 60 */}
            {isLowConfidence && (
              <Card style={{ borderColor: colors.warning, backgroundColor: colors.surface }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="help-circle" size={26} color={colors.warning} />
                  <Text style={[typography.headline, { color: colors.textPrimary, marginLeft: 8 }]}>
                    {t('No estoy seguro')}
                  </Text>
                </View>
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: 6, lineHeight: 21 }]}>
                  {!identificationResult.isPlant
                    ? t('No detectamos una planta en las fotos. Acércate a las hojas o tallos, evita fondos muy cargados y prueba con mejor luz.')
                    : t('La coincidencia es baja ({confianza}%). Revisa las opciones o vuelve a fotografiar la planta desde varios ángulos.', { confianza: identificationResult.confidence })}
                </Text>
              </Card>
            )}

            {identificationResult.candidates.length > 0 && (
              <Card elevated>
                <View style={styles.resultHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <Badge label={t('Familia {familia}', { familia: selectedCandidate?.family ?? '—' })} variant="primary" />
                      {identificationResult.source === 'mock' ? (
                        <Badge label={t('Demo')} variant="neutral" />
                      ) : (
                        <Badge label={t('IA real')} variant="success" />
                      )}
                    </View>

                    <Text style={[typography.title1, { color: colors.textPrimary, fontWeight: '700' }]}>
                      {selectedCandidate?.name}
                    </Text>
                    <Text style={[typography.footnote, { color: colors.textTertiary, fontStyle: 'italic', marginTop: 1 }]}>
                      {selectedCandidate?.scientificName}
                    </Text>
                  </View>

                  <ConfidenceRing
                    score={selectedCandidate?.confidence ?? identificationResult.confidence}
                    size={64}
                    strokeWidth={6}
                    colorVariant="primary"
                    label={t('Certeza')}
                  />
                </View>

                {selectedCandidate?.wikiDescription ? (
                  <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 21 }]}>
                    {selectedCandidate.wikiDescription}
                  </Text>
                ) : null}

                {/* CORRECCIÓN MANUAL DE LA CANDIDATA */}
                {identificationResult.candidates.length > 1 && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={[typography.caption1, { color: colors.textTertiary, fontWeight: '600', marginBottom: 8 }]}>
                      {t('¿Otra opción? Elige la correcta:')}
                    </Text>
                    <View style={styles.candidateWrap}>
                      {identificationResult.candidates.map((candidate, index) => {
                        const active = index === selectedIndex;
                        return (
                          <TouchableOpacity
                            key={`${candidate.id}-${index}`}
                            onPress={() => handleSelectCandidate(index)}
                            style={[
                              styles.candidateChip,
                              {
                                backgroundColor: active ? colors.primaryLight : colors.surfaceSecondary,
                                borderColor: active ? colors.primary : colors.border,
                              },
                            ]}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={t('Elegir {nombre}, {confianza} por ciento de certeza', { nombre: candidate.name, confianza: candidate.confidence })}
                          >
                            <Text
                              style={[
                                typography.caption1,
                                { color: active ? colors.primary : colors.textPrimary, fontWeight: '600' },
                              ]}
                              numberOfLines={1}
                            >
                              {candidate.name} · {candidate.confidence}%
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* FOTOS DE REFERENCIA REALES DEL PROVEEDOR */}
                {(selectedCandidate?.referenceImages?.length ?? 0) > 0 && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={[typography.caption1, { color: colors.textTertiary, fontWeight: '600', marginBottom: 8 }]}>
                      {t('Fotos de referencia:')}
                    </Text>
                    <View style={styles.referenceRow}>
                      {selectedCandidate?.referenceImages.slice(0, 3).map((ref, index) => (
                        <View
                          key={`${ref.small}-${index}`}
                          style={[styles.referenceTile, { backgroundColor: colors.surfaceSecondary }]}
                        >
                          <Image
                            source={{ uri: ref.small || ref.full }}
                            style={styles.referenceImage}
                            resizeMode="cover"
                            accessibilityLabel={t('Foto de referencia {indice} de {nombre}', { indice: index + 1, nombre: selectedCandidate?.name })}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: spacing.md }]} />

                {/* BOTONES PRINCIPALES */}
                <View style={{ gap: 10 }}>
                  <Button
                    title={t('Ver Mapa Mundial de Hábitat 🌍')}
                    onPress={handleOpenHabitatMap}
                    variant="primary"
                    size="lg"
                    icon={<Ionicons name="globe" size={18} color="#FFFFFF" />}
                  />

                  <Button
                    title={t('Ver Ficha Completa de Cuidados')}
                    onPress={handleOpenPlantDetail}
                    variant="secondary"
                    size="md"
                    icon={<Ionicons name="list" size={18} color={colors.primary} />}
                  />

                  <Button
                    title={t('Diagnosticar Salud de esta Hoja 🩺')}
                    onPress={handleOpenDiagnosis}
                    variant="secondary"
                    size="md"
                    icon={<Ionicons name="medkit" size={18} color={colors.primary} />}
                  />
                </View>

                <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: spacing.md }]} />

                {/* ACCIONES INFERIORES */}
                <View style={styles.bottomActionsRow}>
                  <TouchableOpacity
                    style={[styles.outlineBtn, { borderColor: colors.border }]}
                    onPress={handleRetake}
                    accessibilityRole="button"
                    accessibilityLabel={t('Escanear otra planta')}
                  >
                    <Ionicons name="camera-outline" size={18} color={colors.textPrimary} />
                    <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600', marginLeft: 6 }]}>
                      {t('Escanear otra')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      {
                        backgroundColor: isSavedToGarden ? colors.surfaceSecondary : colors.primary,
                        flex: 1,
                        opacity: isSaving ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleSaveToGarden}
                    disabled={isSavedToGarden || isSaving}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isSavedToGarden
                        ? t('Planta guardada en jardín')
                        : t('Guardar {nombre} en Mi Jardín', { nombre: selectedCandidate?.name ?? t('la planta') })
                    }
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons
                          name={isSavedToGarden ? 'checkmark' : 'add'}
                          size={18}
                          color={isSavedToGarden ? colors.textSecondary : '#FFFFFF'}
                        />
                        <Text
                          style={[
                            typography.subheadline,
                            {
                              color: isSavedToGarden ? colors.textSecondary : '#FFFFFF',
                              fontWeight: '600',
                              marginLeft: 6,
                            },
                          ]}
                        >
                          {isSavedToGarden ? t('En Mi Jardín ✓') : t('Guardar en Jardín')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* CONTADOR DE IDENTIFICACIONES GRATUITAS */}
                {!limits.isPremium && (
                  <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md }]}>
                    {t('Te quedan {restantes} de {total} identificaciones gratuitas hoy', {
                      restantes: Math.max(0, FREE_IDENTIFICATION_LIMIT - limits.identificationsToday),
                      total: FREE_IDENTIFICATION_LIMIT,
                    })}
                  </Text>
                )}
              </Card>
            )}

            {/* Sin candidatos y no es planta: ofrecer solo reintento */}
            {identificationResult.candidates.length === 0 && (
              <Card style={{ marginTop: spacing.xs }}>
                <EmptyState
                  iconName="leaf-outline"
                  title={t('Sin coincidencias')}
                  description={t('Prueba a fotografiar la hoja completa con buena iluminación y un fondo sencillo.')}
                  actionTitle={t('Tomar otras fotos')}
                  onActionPress={handleRetake}
                />
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  // 3. VISOR DE CÁMARA ACTIVO
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torchEnabled}
      />

      {/* MARCO GUÍA DE ENFOQUE BOTÁNICO */}
      <View style={styles.overlayFrameContainer} pointerEvents="none">
        <View style={styles.targetReticle}>
          <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
          <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
          <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
          <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
        </View>

        <View style={styles.guidancePill}>
          <Ionicons name="scan" size={16} color="#FFFFFF" />
          <Text style={styles.guidanceText}>
            {photos.length === 0
              ? t('Encuadra la hoja o flor en el centro')
              : photos.length < MAX_PHOTOS
              ? t('Añade otra foto desde otro ángulo (opcional)')
              : t('Listo: pulsa Analizar')}
          </Text>
        </View>
      </View>

      {/* BOTONES SUPERIORES: VOLTEAR CÁMARA Y FLASH */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={[styles.topControlBtn, { backgroundColor: colors.surface }]}
          onPress={toggleFacing}
          accessibilityRole="button"
          accessibilityLabel={t('Cambiar de cámara')}
        >
          <Ionicons name="camera-reverse" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topControlBtn, { backgroundColor: colors.surface }]}
          onPress={toggleTorch}
          accessibilityRole="button"
          accessibilityLabel={torchEnabled ? t('Apagar la linterna') : t('Encender la linterna')}
        >
          <Ionicons name={torchEnabled ? 'flash' : 'flash-off'} size={20} color={torchEnabled ? colors.warning : colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* BOTÓN FLOTANTE DIRECTO PARA "DIAGNOSTICAR SALUD" */}
      <TouchableOpacity
        style={[styles.floatingDiagnosisBtn, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('HealthDiagnosis')}
        accessibilityRole="button"
        accessibilityLabel={t('Diagnosticar salud y plagas')}
      >
        <Ionicons name="medkit" size={20} color={colors.primary} />
        <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '700', marginLeft: 6 }]}>
          {t('Diagnosticar salud')}
        </Text>
      </TouchableOpacity>

      {/* BANDEJA DE FOTOS (FILMSTRIP) Y BOTÓN ANALIZAR */}
      {photos.length > 0 && (
        <View style={[styles.captureTray, { backgroundColor: colors.surface }]}>
          <View style={styles.trayHeader}>
            <Text style={[typography.caption1, { color: colors.textSecondary, fontWeight: '600' }]}>
              {t('{actual}/{total} fotos · misma planta', { actual: photos.length, total: MAX_PHOTOS })}
            </Text>
            <TouchableOpacity
              onPress={handleClearPhotos}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('Eliminar todas las fotos')}
            >
              <Text style={[typography.caption1, { color: colors.error, fontWeight: '600' }]}>{t('Limpiar')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filmstrip}>
            {photos.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.filmstripItem}>
                <Image source={{ uri }} style={styles.filmstripThumb} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeBadge}
                  onPress={() => handleRemovePhoto(index)}
                  accessibilityRole="button"
                  accessibilityLabel={t('Eliminar foto {indice}', { indice: index + 1 })}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.analyzeBtn, { backgroundColor: colors.primary }]}
            onPress={handleAnalyze}
            accessibilityRole="button"
            accessibilityLabel={t('Analizar {cantidad} {unidad}', {
              cantidad: photos.length,
              unidad: photos.length === 1 ? t('foto') : t('fotos'),
            })}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={[typography.subheadline, { color: '#FFFFFF', fontWeight: '700', marginLeft: 6 }]}>
              Analizar {photos.length === 1 ? 'foto' : `${photos.length} fotos`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BARRA INFERIOR DE CONTROLES DE CÁMARA */}
      <View style={styles.cameraControlsBar}>
        <TouchableOpacity
          style={styles.auxControlButton}
          onPress={handlePickFromGallery}
          accessibilityRole="button"
          accessibilityLabel={t('Abrir galería de fotos')}
        >
          <Ionicons name="images" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* BOTÓN OBTURADOR PRINCIPAL */}
        <TouchableOpacity
          style={[styles.shutterButtonOuter, { borderColor: '#FFFFFF' }]}
          onPress={handleCapture}
          accessibilityRole="button"
          accessibilityLabel={t('Capturar foto de la planta')}
        >
          <View style={[styles.shutterButtonInner, { backgroundColor: colors.primary }]} />
        </TouchableOpacity>

        {__DEV__ ? (
          <TouchableOpacity
            style={styles.auxControlButton}
            onPress={handleUseMockSample}
            accessibilityRole="button"
            accessibilityLabel={t('Usar foto de prueba (solo desarrollo)')}
          >
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.auxControlButton} />
        )}
      </View>

      {/* CONTADOR DE IDENTIFICACIONES GRATIS (plan Free) */}
      {!limits.isPremium && photos.length === 0 && (
        <View
          style={styles.freeCounter}
          accessible
          accessibilityLabel={t('Te quedan {restantes} de {total} identificaciones gratuitas hoy', {
            restantes: Math.max(0, FREE_IDENTIFICATION_LIMIT - limits.identificationsToday),
            total: FREE_IDENTIFICATION_LIMIT,
          })}
        >
          <Ionicons name="sparkles-outline" size={13} color="#FFD54F" />
          <Text style={[typography.caption1, { color: '#FFFFFF', fontWeight: '600', marginLeft: 5 }]}>
            {t('{restantes}/{total} gratis hoy', {
              restantes: Math.max(0, FREE_IDENTIFICATION_LIMIT - limits.identificationsToday),
              total: FREE_IDENTIFICATION_LIMIT,
            })}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlayFrameContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetReticle: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 32,
    height: 32,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  guidancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
  },
  guidanceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  topControls: {
    position: 'absolute',
    top: 20,
    left: 16,
    flexDirection: 'row',
    gap: 10,
  },
  topControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  floatingDiagnosisBtn: {
    position: 'absolute',
    top: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  captureTray: {
    position: 'absolute',
    bottom: 118,
    left: 12,
    right: 12,
    borderRadius: 16,
    padding: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  trayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filmstrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filmstripItem: {
    position: 'relative',
  },
  filmstripThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
  },
  cameraControlsBar: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  auxControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  previewContainer: {
    height: 270,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  scanLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  separator: {
    height: 1,
    width: '100%',
  },
  candidateWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  candidateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  referenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  referenceTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  referenceImage: {
    width: '100%',
    height: '100%',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  freeCounter: {
    position: 'absolute',
    bottom: 122,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
