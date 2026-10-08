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
  Platform,
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
import { identifyPlant, PlantIdentificationResult } from '../services/plantApi';
import { useGarden } from '../context/GardenContext';
import { usePlanLimits, FREE_IDENTIFICATION_LIMIT } from '../hooks/usePlanLimits';
import { SkeletonBox } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { LinearGradient } from 'expo-linear-gradient';

// Mapa de fichas de referencia visuales (offline, sin imágenes pesadas)
const REFERENCE_VISUALS: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  leaf: { icon: 'leaf', label: 'Follaje' },
  foliage: { icon: 'leaf', label: 'Hojas' },
  fronds: { icon: 'leaf', label: 'Frondas' },
  stem: { icon: 'git-branch', label: 'Tallo' },
  root: { icon: 'trail-sign', label: 'Raíces' },
  flower: { icon: 'flower', label: 'Flor' },
  bloom: { icon: 'flower', label: 'Floración' },
  spike: { icon: 'flower', label: 'Vara floral' },
  spathe: { icon: 'flower', label: 'Espata' },
  variegated: { icon: 'color-palette', label: 'Variegación' },
  pattern: { icon: 'color-palette', label: 'Patrón foliar' },
  gel: { icon: 'water', label: 'Gel' },
  cut: { icon: 'water', label: 'Corte' },
  spore: { icon: 'ellipsis-horizontal', label: 'Esporas' },
  basket: { icon: 'basket', label: 'Maceta colgante' },
  growth: { icon: 'trending-up', label: 'Crecimiento' },
  margin: { icon: 'albums', label: 'Borde foliar' },
  needle: { icon: 'remove', label: 'Aguja' },
  blue_flower: { icon: 'flower', label: 'Flor azul' },
  aerial: { icon: 'git-branch', label: 'Raíces aéreas' },
  new_leaf: { icon: 'cart', label: 'Crecimiento' },
  underview: { icon: 'layers', label: 'Envés foliar' },
  spear: { icon: 'triangle', label: 'Hojas lanceoladas' },
  rosette: { icon: 'radio-button-on', label: 'Roseta' },
};

const referenceVisualFor = (token: string, fallbackIndex: number) => {
  for (const key of Object.keys(REFERENCE_VISUALS)) {
    if (token.includes(key)) return REFERENCE_VISUALS[key];
  }
  return { icon: 'leaf' as const, label: `Referencia ${fallbackIndex + 1}` };
};

export const ScannerScreen: React.FC = () => {
  const { colors, spacing, typography } = useAppTheme();
  const { plants, addPlants, registerIdentification } = useGarden();
  const limits = usePlanLimits();
  const navigation = useNavigation<any>();

  // Permisos y control de cámara
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);

  // Estados del flujo de escaneo
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>('Analizando patrones...');
  const [identificationResult, setIdentificationResult] = useState<PlantIdentificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavedToGarden, setIsSavedToGarden] = useState<boolean>(false);
  // Lote de plantas identificadas pendientes de guardar (escáner multi-plantas)
  const [pendingBatch, setPendingBatch] = useState<PlantIdentificationResult[]>([]);

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
        setScanStepText('Analizando forma y nervadura foliar...');
      }, 400);

      const timer2 = setTimeout(() => {
        setScanStepText('Buscando coincidencia en el catálogo botánico...');
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
  }, [isIdentifying, scanLineAnim]);

  // 1. PANTALLA PREVIA DE PERMISO DE CÁMARA
  if (!permission) {
    return (
      <View
        style={[styles.permissionContainer, { backgroundColor: colors.background, padding: spacing.xl }]}
        accessible={true}
        accessibilityLabel="Cargando cámara y reconocimiento botánico"
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
          Reconocimiento Botánico
        </Text>

        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 24 },
          ]}
        >
          Apunta la cámara a cualquier hoja o flor para identificar su especie, origen biológico en el mapa mundial y guía de cuidados.
        </Text>

        <Button
          title="Permitir cámara"
          onPress={requestPermission}
          variant="primary"
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    );
  }

  // ACCIÓN PRINCIPAL: Captura con haptics
  const handleCaptureAndIdentify = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        if (photo?.uri) {
          processImage(photo.uri, photo.base64);
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo capturar la imagen. Intenta de nuevo.');
    }
  };

  // ACCIÓN: Galería
  const handlePickFromGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]?.uri) {
        processImage(pickerResult.assets[0].uri, pickerResult.assets[0].base64);
      }
    } catch {
      Alert.alert('Galería', 'No se pudo acceder a las fotos.');
    }
  };

  // ACCIÓN: Foto de muestra
  const handleUseMockSample = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sampleUri = 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80';
    processImage(sampleUri);
  };

  const processImage = async (uri: string, base64?: string | null) => {
    // Límite free: 3 identificaciones al día (punto 16)
    if (!limits.isPremium && limits.identificationsToday >= limits.identificationLimit) {
      Alert.alert(
        'Límite gratuito alcanzado',
        `Usaste tus ${limits.identificationLimit} identificaciones gratuitas de hoy. Con Plantae Pro escaneas sin límites.`,
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Ver Pro', onPress: () => navigation.navigate('Paywall') },
        ]
      );
      return;
    }

    setPhotoUri(uri);
    setErrorMessage(null);
    setIdentificationResult(null);
    setIsSavedToGarden(false);
    setIsIdentifying(true);
    setScanStepText('Enfocando patrones foliares...');

    try {
      const result = await identifyPlant(uri, base64);
      setIdentificationResult(result);
      setPendingBatch((prev) => [...prev, result]);
      registerIdentification();

      // Pulso háptico de confirmación al detectar
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo identificar la planta. Intenta con mejor iluminación.';
      setErrorMessage(msg);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoUri(null);
    setIdentificationResult(null);
    setErrorMessage(null);
    setIsSavedToGarden(false);
    setIsIdentifying(false);
  };

  const handleSaveAllToGarden = () => {
    const batch = pendingBatch.length > 0 ? pendingBatch : identificationResult ? [identificationResult] : [];
    if (batch.length === 0) return;

    // Límite free de plantas en Mi Jardín (máx. 5)
    if (!limits.isPremium && plants.length + batch.length > limits.plantLimit) {
      Alert.alert(
        'Jardín gratuito lleno',
        `El plan gratuito permite ${limits.plantLimit} plantas. Con Plantae Pro guardas las que quieras.`,
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Ver Pro', onPress: () => navigation.navigate('Paywall') },
        ]
      );
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    addPlants(
      batch.map((result) => ({
        name: result.name,
        scientificName: result.scientificName,
        wateringFrequencyDays: result.wateringFrequencyDays,
        light: result.light,
        avatarEmoji: result.avatarEmoji,
        imageUri: photoUri || undefined,
      }))
    );
    setPendingBatch([]);
    setIsSavedToGarden(true);
    Alert.alert(
      '¡Plantas Registradas!',
      batch.length > 1
        ? `Guardamos ${batch.length} plantas en tu jardín.`
        : `${batch[0].name} ha sido añadida a tu jardín.`
    );
  };

  const handleOpenHabitatMap = () => {
    if (!identificationResult) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    navigation.navigate('HabitatMap', { plantId: identificationResult.id });
  };

  const handleOpenPlantDetail = () => {
    if (!identificationResult) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    navigation.navigate('PlantDetail', { plantId: identificationResult.id });
  };

  const handleOpenDiagnosis = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    navigation.navigate('HealthDiagnosis', { plantId: identificationResult?.id });
  };

  // 2. VISTA DE ANÁLISIS Y RESULTADOS
  if (photoUri) {
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
          title={isIdentifying ? 'Analizando Planta' : (identificationResult ? 'Planta Identificada' : 'Vista Previa')}
          subtitle="Reconocimiento Inteligente"
        />

        {/* Tarjeta con foto y visor láser animado */}
        <View style={[styles.previewContainer, { borderColor: colors.border }]}>
          <Image
            source={{ uri: photoUri }}
            style={styles.previewImage}
            resizeMode="cover"
            accessibilityLabel="Foto de la planta que estás analizando"
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

        {/* Estado vacío: foto tomada pero sin resultado aún */}
        {!isIdentifying && !identificationResult && !errorMessage && (
          <Card style={{ marginTop: spacing.md }}>
            <EmptyState
              iconName="leaf-outline"
              title="Sin coincidencias aún"
              description="Prueba a tomar la foto con mejor iluminación o reencuadrando la hoja completa."
            />
          </Card>
        )}

        {/* Estado de error */}
        {errorMessage && (
          <Card style={{ marginTop: spacing.md, borderColor: colors.error }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Ionicons name="alert-circle" size={24} color={colors.error} />
              <Text style={[typography.headline, { color: colors.error, marginLeft: spacing.xs }]}>
                No pudimos reconocer la planta
              </Text>
            </View>
            <Text style={[typography.body, { color: colors.textPrimary, marginBottom: spacing.md }]}>
              {errorMessage}
            </Text>
            <Button
              title="Tomar otra foto"
              onPress={handleRetake}
              variant="primary"
              icon={<Ionicons name="camera-reverse" size={18} color="#FFFFFF" />}
            />
          </Card>
        )}

        {/* TARJETA CON EL RESULTADO DE LA PLANTA IDENTIFICADA */}
        {identificationResult && (
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            <Card elevated>
              <View style={styles.resultHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Badge label={`Familia ${identificationResult.family}`} variant="primary" />
                    <Badge label="Identificada" variant="success" />
                  </View>

                  <Text style={[typography.title1, { color: colors.textPrimary, fontWeight: '700' }]}>
                    {identificationResult.name}
                  </Text>
                  <Text style={[typography.footnote, { color: colors.textTertiary, fontStyle: 'italic', marginTop: 1 }]}>
                    {identificationResult.scientificName}
                  </Text>
                </View>

                {/* ANILLO ANIMADO DE % DE CONFIANZA HIG */}
                <ConfidenceRing
                  score={identificationResult.confidence}
                  size={64}
                  strokeWidth={6}
                  colorVariant="primary"
                  label="Certeza"
                />
              </View>

              <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: spacing.md }]} />

              {/* FOTOS DE REFERENCIA BOTÁNICA (tiles con gradiente + ícono, sin bytecode pesado) */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[typography.caption1, { color: colors.textTertiary, fontWeight: '600', marginBottom: 8 }]}>
                  Fotos de referencia botánica:
                </Text>
                <View style={styles.referenceRow}>
                  {(identificationResult.referenceImages || []).slice(0, 3).map((token, index) => {
                    const visual = referenceVisualFor(token, index);
                    const colorA = index === 0 ? '#2E7D32' : index === 1 ? '#00838F' : '#D4A017';
                    const colorB = index === 0 ? '#66BB6A' : index === 1 ? '#4DD0E1' : '#FFCA28';
                    return (
                      <View
                        key={token}
                        style={[styles.referenceTile, { backgroundColor: colors.surfaceSecondary }]}
                        accessible={true}
                        accessibilityLabel={`Foto de referencia: ${visual.label}`}
                      >
                        <LinearGradient
                          colors={[colorA, colorB]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.referenceTileGradient}
                        >
                          <Ionicons name={visual.icon} size={26} color="#FFFFFF" />
                          <Text style={styles.referenceTileLabel}>{visual.label}</Text>
                        </LinearGradient>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* BOTONES PRINCIPALES: MAPA MUNDIAL (FUNCIÓN ESTRELLA) Y FICHA */}
              <View style={{ gap: 10 }}>
                <Button
                  title="Ver Mapa Mundial de Hábitat 🌍"
                  onPress={handleOpenHabitatMap}
                  variant="primary"
                  size="lg"
                  icon={<Ionicons name="globe" size={18} color="#FFFFFF" />}
                />

                <Button
                  title="Ver Ficha Completa de Cuidados"
                  onPress={handleOpenPlantDetail}
                  variant="secondary"
                  size="md"
                  icon={<Ionicons name="list" size={18} color={colors.primary} />}
                />

                <Button
                  title="Diagnosticar Salud de esta Hoja 🩺"
                  onPress={handleOpenDiagnosis}
                  variant="secondary"
                  size="md"
                  icon={<Ionicons name="medkit" size={18} color={colors.primary} />}
                />
              </View>

              <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: spacing.md }]} />

              {/* LOTE MULTI-PLANTAS (punto 14) */}
              {pendingBatch.length > 1 && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={[typography.caption1, { color: colors.textTertiary, fontWeight: '600', marginBottom: 6 }]}>
                    Lote de {pendingBatch.length} plantas identificadas:
                  </Text>
                  <View style={styles.batchRow}>
                    {pendingBatch.map((p) => (
                      <View key={p.id} style={[styles.batchChip, { backgroundColor: colors.primaryLight, borderRadius: 999 }]}>
                        <Text style={[typography.caption2, { color: colors.primary, fontWeight: '600' }]}>{p.avatarEmoji} {p.name.split(' ').slice(0, 2).join(' ')}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 6 }]}>
                    Pulsa guardar para añadirlas todas a Mi Jardín.
                  </Text>
                </View>
              )}

              {/* ACCIONES INFERIORES */}
              <View style={styles.bottomActionsRow}>
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: colors.border }]}
                  onPress={handleRetake}
                  accessibilityRole="button"
                  accessibilityLabel="Escanear otra planta"
                >
                  <Ionicons name="camera-outline" size={18} color={colors.textPrimary} />
                  <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600', marginLeft: 6 }]}>
                    Escanear otra
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: isSavedToGarden ? colors.surfaceSecondary : colors.primary,
                      flex: 1,
                    },
                  ]}
                  onPress={handleSaveAllToGarden}
                  disabled={isSavedToGarden}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isSavedToGarden
                      ? 'Plantas guardadas en jardín'
                      : pendingBatch.length > 1
                      ? `Guardar lote de ${pendingBatch.length} plantas en Mi Jardín`
                      : 'Guardar en Mi Jardín'
                  }
                >
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
                    {isSavedToGarden
                      ? 'En Mi Jardín ✓'
                      : pendingBatch.length > 1
                      ? `Guardar lote (${pendingBatch.length})`
                      : 'Guardar en Jardín'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* CONTADOR DE IDENTIFICACIONES GRATUITAS */}
              {!limits.isPremium && (
                <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md }]}>
                  Te quedan {Math.max(0, FREE_IDENTIFICATION_LIMIT - limits.identificationsToday)} de {FREE_IDENTIFICATION_LIMIT} identificaciones gratuitas hoy
                </Text>
              )}
            </Card>
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
      <View style={styles.overlayFrameContainer}>
        <View style={styles.targetReticle}>
          <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
          <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
          <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
          <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
        </View>

        <View style={styles.guidancePill}>
          <Ionicons name="scan" size={16} color="#FFFFFF" />
          <Text style={styles.guidanceText}>Encuadra la hoja o flor en el centro</Text>
        </View>
      </View>

      {/* BOTÓN FLOTANTE DIRECTO PARA "DIAGNOSTICAR SALUD" */}
      <TouchableOpacity
        style={[styles.floatingDiagnosisBtn, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('HealthDiagnosis')}
        accessibilityRole="button"
        accessibilityLabel="Diagnosticar salud y plagas"
      >
        <Ionicons name="medkit" size={20} color={colors.primary} />
        <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '700', marginLeft: 6 }]}>
          Diagnosticar salud
        </Text>
      </TouchableOpacity>

      {/* BARRA INFERIOR DE CONTROLES DE CÁMARA */}
      <View style={styles.cameraControlsBar}>
        <TouchableOpacity
          style={styles.auxControlButton}
          onPress={handlePickFromGallery}
          accessibilityRole="button"
          accessibilityLabel="Abrir galería de fotos"
        >
          <Ionicons name="images" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* BOTÓN OBTURADOR PRINCIPAL */}
        <TouchableOpacity
          style={[styles.shutterButtonOuter, { borderColor: '#FFFFFF' }]}
          onPress={handleCaptureAndIdentify}
          accessibilityRole="button"
          accessibilityLabel="Capturar y escanear planta"
        >
          <View style={[styles.shutterButtonInner, { backgroundColor: colors.primary }]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.auxControlButton}
          onPress={handleUseMockSample}
          accessibilityRole="button"
          accessibilityLabel="Usar foto de prueba"
        >
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* CONTADOR DE IDENTIFICACIONES GRATIS (plan Free) */}
      {!limits.isPremium && (
        <View style={styles.freeCounter} accessible accessibilityLabel={`Te quedan ${Math.max(0, FREE_IDENTIFICATION_LIMIT - limits.identificationsToday)} de ${FREE_IDENTIFICATION_LIMIT} identificaciones gratuitas hoy`}>
          <Ionicons name="sparkles-outline" size={13} color="#FFD54F" />
          <Text style={[typography.caption1, { color: '#FFFFFF', fontWeight: '600', marginLeft: 5 }]}>
            {Math.max(0, FREE_IDENTIFICATION_LIMIT - limits.identificationsToday)}/{FREE_IDENTIFICATION_LIMIT} gratis hoy
          </Text>
        </View>
      )}

      {/* LOTE PENDIENTE DE GUARDADO EN LA VISTA DE CÁMARA */}
      {pendingBatch.length > 0 && (
        <TouchableOpacity
          style={[styles.cameraBatchBanner, { backgroundColor: colors.surface }]}
          onPress={handleSaveAllToGarden}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Guardar lote de ${pendingBatch.length} plantas en Mi Jardín`}
        >
          <View style={[styles.cameraBatchIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="leaf" size={16} color={colors.primary} />
          </View>
          <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700', flex: 1, marginLeft: 10 }]}>
            {pendingBatch.length} {pendingBatch.length === 1 ? 'planta lista' : 'plantas listas'}
          </Text>
          <Text style={[typography.footnote, { color: colors.primary, fontWeight: '700' }]}>Guardar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  floatingDiagnosisBtn: {
    position: 'absolute',
    top: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // HIG 44x44
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  referenceTileGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  referenceTileLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
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
  batchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  batchChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  cameraBatchBanner: {
    position: 'absolute',
    bottom: 118,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cameraBatchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
