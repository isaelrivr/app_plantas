import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing as ReanimatedEasing,
  cancelAnimation,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';
import { useFloatingBarMetrics } from '../hooks/useFloatingBarMetrics';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { isScannerCameraActive } from '../utils/tabBarVisibility';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { PhotoGuideModal } from '../components/scanner/PhotoGuideModal';
import { ScanResultCard } from '../components/scanner/ScanResultCard';
import {
  identifyPlants,
  fetchCareSheet,
  PlantIdentificationResult,
  IdentificationCandidate,
} from '../services/plantApi';
import { ApiError } from '../services/apiClient';
import { persistImage } from '../services/mediaService';
import { useGarden } from '../context/GardenContext';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { announce } from '../services/accessibilityService';
import { useTranslation } from '../i18n';
import { useFeedback } from '../context/FeedbackContext';

export const ScannerScreen: React.FC = () => {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { tabBarClearance } = useFloatingBarMetrics();
  const { showToast, confirm } = useFeedback();
  const { addPlant, registerIdentification } = useGarden();
  const limits = usePlanLimits();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { setTabBarVisible } = useTabBarVisibility();
  const { height: windowHeight } = useWindowDimensions();
  const isShortScreen = windowHeight < 700;
  const reticleSize = isShortScreen ? 220 : 260;

  // Permisos y cámara
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [mountError, setMountError] = useState<string | null>(null);

  // Estados del escaneo
  const [scanMode, setScanMode] = useState<'identify' | 'diagnose'>('identify');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>(t('Buscando tu planta...'));
  const [identificationResult, setIdentificationResult] = useState<PlantIdentificationResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<IdentificationCandidate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavedToGarden, setIsSavedToGarden] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [guideVisible, setGuideVisible] = useState<boolean>(false);

  // Animación de línea láser con Reanimated 4
  const scanProgress = useSharedValue(0);

  useEffect(() => {
    if (isIdentifying) {
      scanProgress.value = 0;
      scanProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: ReanimatedEasing.inOut(ReanimatedEasing.ease) }),
          withTiming(0, { duration: 1100, easing: ReanimatedEasing.inOut(ReanimatedEasing.ease) })
        ),
        -1,
        false
      );

      const timer1 = setTimeout(() => setScanStepText(t('Revisando las hojas...')), 400);
      const timer2 = setTimeout(() => setScanStepText(t('Buscando en la enciclopedia...')), 900);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        cancelAnimation(scanProgress);
      };
    } else {
      cancelAnimation(scanProgress);
      scanProgress.value = 0;
    }
  }, [isIdentifying, scanProgress, t]);

  const laserAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanProgress.value * (reticleSize - 20) }],
  }));

  // La cámara está activa exclusivamente durante la captura en vivo
  const isCameraActive = isScannerCameraActive({
    isFocused,
    hasCapturedPhoto: !!capturedPhoto,
    isIdentifying,
    hasIdentificationResult: !!identificationResult,
    hasErrorMessage: !!errorMessage,
    hasMountError: !!mountError,
    permissionGranted: !!permission?.granted,
  });

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: isCameraActive ? { display: 'none' } : undefined,
    });
    setTabBarVisible(!isCameraActive);

    return () => {
      navigation.setOptions({ tabBarStyle: undefined });
      setTabBarVisible(true);
    };
  }, [isCameraActive, navigation, setTabBarVisible]);

  const toggleCameraFacing = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setIsCameraReady(false);
    setFacing((prev) => {
      const next = prev === 'back' ? 'front' : 'back';
      if (next === 'front') {
        setTorchEnabled(false);
      }
      return next;
    });
  };

  const toggleTorch = () => {
    if (facing === 'front') {
      showToast({
        message: t('La linterna solo está disponible en la cámara trasera.'),
        type: 'info',
      });
      return;
    }
    try {
      Haptics.selectionAsync();
    } catch {}
    setTorchEnabled((prev) => !prev);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    if (!isCameraReady) {
      showToast({
        message: t('Preparando la cámara... Intenta en un segundo.'),
        type: 'info',
      });
      return;
    }

    if (isCapturing) return;

    // Verificar límite gratuito
    if (!limits.isPremium && limits.identificationsToday >= limits.identificationLimit) {
      const seePro = await confirm({
        title: t('Límite gratuito alcanzado'),
        message: t(
          'Usaste tus {limite} identificaciones gratuitas de hoy. Con EcoScan Pro escaneas sin límites.',
          { limite: limits.identificationLimit }
        ),
        confirmText: t('Ver Pro'),
        cancelText: t('Ahora no'),
      });
      if (seePro) {
        navigation.navigate('Paywall');
      }
      return;
    }

    setIsCapturing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        if (scanMode === 'diagnose') {
          if (limits.isFeatureLocked('pestDiagnosis')) {
            navigation.navigate('Paywall');
            return;
          }
          navigation.navigate('HealthDiagnosis', { photoUri: photo.uri });
          return;
        }
        setCapturedPhoto(photo.uri);
        analyzePhoto(photo.uri);
      }
    } catch (err) {
      console.warn('Error capturando foto con la cámara:', err);
      showToast({
        message: t('No se pudo capturar la imagen. Intenta de nuevo o elige una foto de la galería.'),
        type: 'error',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickGallery = async () => {
    try {
      Haptics.selectionAsync();
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].uri;
        if (scanMode === 'diagnose') {
          if (limits.isFeatureLocked('pestDiagnosis')) {
            navigation.navigate('Paywall');
            return;
          }
          navigation.navigate('HealthDiagnosis', { photoUri: uri });
          return;
        }
        setCapturedPhoto(uri);
        analyzePhoto(uri);
      }
    } catch (err) {
      console.warn('Error al acceder a la galería:', err);
      showToast({
        message: t('No se pudo acceder a las fotos.'),
        type: 'error',
      });
    }
  };

  const analyzePhoto = async (uri: string) => {
    setIsIdentifying(true);
    setErrorMessage(null);
    setIdentificationResult(null);
    setSelectedCandidate(null);
    setIsSavedToGarden(false);

    try {
      const result = await identifyPlants([uri]);
      const best = result.candidates[0];
      setIsIdentifying(false);
      setIdentificationResult(result);
      setSelectedCandidate(best ?? null);
      registerIdentification();

      if (best) {
        announce(
          t('Planta identificada: {nombre}, {confianza} por ciento de certeza', {
            nombre: best.name,
            confianza: Math.round(best.confidence),
          })
        );
      }
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (err) {
      setIsIdentifying(false);
      if (err instanceof ApiError) {
        setErrorMessage(
          err.status === 408
            ? t('La identificación tardó demasiado. Puedes volver a intentarlo o buscar directamente en la enciclopedia.')
            : t('Error de conexión. Revisa tu internet e inténtalo de nuevo.')
        );
      } else {
        setErrorMessage(
          t('No pudimos identificar la planta. Intenta con otra foto o busca en la enciclopedia.')
        );
      }
    }
  };

  const handleSaveToGarden = async () => {
    if (!selectedCandidate) return;
    setIsSaving(true);
    try {
      const careSheet = await fetchCareSheet(
        selectedCandidate.name,
        selectedCandidate.scientificName
      );
      const persistedUri = capturedPhoto
        ? (await persistImage(capturedPhoto, 'garden')) ?? capturedPhoto
        : undefined;

      addPlant({
        name: selectedCandidate.name,
        scientificName: selectedCandidate.scientificName,
        wateringFrequencyDays: careSheet.wateringFrequencyDays,
        light: careSheet.light,
        avatarEmoji: '🌿',
        imageUri: persistedUri,
        careTasks: [
          {
            id: `task-${Date.now()}-1`,
            type: 'riego',
            title: t('Riego regular'),
            dueDate: t('En {dias} días', { dias: careSheet.wateringFrequencyDays }),
            completed: false,
            repeatIntervalDays: careSheet.wateringFrequencyDays,
          },
        ],
      });

      setIsSavedToGarden(true);
      setIsSaving(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      showToast({
        message: t('{nombre} se guardó en tu jardín', { nombre: selectedCandidate.name }),
        type: 'success',
      });
    } catch {
      setIsSaving(false);
      showToast({
        message: t('No se pudo guardar la planta. Revisa tu conexión e inténtalo de nuevo.'),
        type: 'error',
      });
    }
  };

  const handleResetScanner = () => {
    setCapturedPhoto(null);
    setIdentificationResult(null);
    setSelectedCandidate(null);
    setErrorMessage(null);
    setIsIdentifying(false);
  };

  // CASO 1: CARGANDO PERMISOS ASÍNCRONOS
  if (!permission) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // CASO 2: ERROR DE MONTAJE DE CÁMARA (SIMULADOR O HARDWARE NO DISPONIBLE)
  if (mountError) {
    return (
      <View
        style={[
          styles.permissionContainer,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 16,
            paddingBottom: tabBarClearance,
          },
        ]}
      >
        <View style={[styles.permissionIconCircle, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="camera-outline" size={54} color={colors.textSecondary} />
        </View>
        <Text style={[typography.title1, styles.permissionTitle, { color: colors.textPrimary }]}>
          {t('Cámara no disponible')}
        </Text>
        <Text
          style={[
            typography.body,
            styles.permissionSubtitle,
            { color: colors.textSecondary, marginBottom: spacing.xl },
          ]}
        >
          {t('No se pudo iniciar la cámara en este dispositivo. Puedes seleccionar fotos de tu galería o reintentar.')}
        </Text>

        <Button
          title={t('Elegir de la galería')}
          onPress={handlePickGallery}
          variant="primary"
          size="lg"
          style={{ width: '100%', marginBottom: spacing.md }}
        />

        <Button
          title={t('Reintentar')}
          onPress={() => setMountError(null)}
          variant="secondary"
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    );
  }

  // CASO 3: PERMISO DE CÁMARA NO OTORGADO
  if (!permission.granted) {
    const isPermanentlyDenied = !permission.canAskAgain && permission.status === 'denied';

    return (
      <View
        style={[
          styles.permissionContainer,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 16,
            paddingBottom: tabBarClearance,
          },
        ]}
      >
        <View style={[styles.permissionIconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="camera" size={54} color={colors.primary} />
        </View>
        <Text style={[typography.title1, styles.permissionTitle, { color: colors.textPrimary }]}>
          {t('Identifica con tu cámara')}
        </Text>
        <Text
          style={[
            typography.body,
            styles.permissionSubtitle,
            { color: colors.textSecondary, marginBottom: spacing.xl },
          ]}
        >
          {isPermanentlyDenied
            ? t('El permiso de cámara fue denegado. Para identificar plantas con la cámara, actívalo en los ajustes de tu teléfono.')
            : t('EcoScan necesita acceso a tu cámara para identificar plantas y revisar la salud de sus hojas.')}
        </Text>

        <Button
          title={isPermanentlyDenied ? t('Abrir ajustes del dispositivo') : t('Activar cámara')}
          onPress={async () => {
            if (isPermanentlyDenied) {
              await Linking.openSettings();
            } else {
              await requestPermission();
            }
          }}
          variant="primary"
          size="lg"
          style={{ width: '100%', marginBottom: spacing.md }}
        />

        <Button
          title={t('Elegir de la galería')}
          onPress={handlePickGallery}
          variant="secondary"
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    );
  }

  // CASO 4: PANTALLA NO ENFOCADA (liberar hardware de cámara cuando se navega a otra pestaña)
  if (!isFocused) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  // CASO: RESULTADO DE IDENTIFICACIÓN
  if (identificationResult && selectedCandidate) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, spacing.md),
          paddingBottom: tabBarClearance,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScanResultCard
          result={identificationResult}
          candidate={selectedCandidate}
          photoUri={capturedPhoto || undefined}
          isSaved={isSavedToGarden}
          isSaving={isSaving}
          onSaveToGarden={handleSaveToGarden}
          onViewCareSheet={() =>
            navigation.navigate('PlantDetail', {
              plantId: selectedCandidate.id,
              plantName: selectedCandidate.name,
              scientificName: selectedCandidate.scientificName,
            })
          }
          onDiagnoseHealth={() =>
            navigation.navigate('HealthDiagnosis', {
              plantId: selectedCandidate.id,
              plantName: selectedCandidate.name,
              scientificName: selectedCandidate.scientificName,
            })
          }
          onViewHabitatMap={() =>
            navigation.navigate('HabitatMap', {
              plantId: selectedCandidate.id,
              plantName: selectedCandidate.name,
              speciesId: selectedCandidate.id,
              scientificName: selectedCandidate.scientificName,
            })
          }
          onScanAnother={handleResetScanner}
          onSelectCandidate={(cand) => setSelectedCandidate(cand)}
        />
      </ScrollView>
    );
  }

  // CASO: ESTADO DE ERROR TRAS ANALIZAR
  if (errorMessage) {
    return (
      <View
        style={[
          styles.errorContainer,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 16,
            paddingBottom: tabBarClearance,
          },
        ]}
      >
        <EmptyState
          iconName="alert-circle-outline"
          title={t('No pudimos reconocer la planta')}
          description={errorMessage}
          actionTitle={t('Tomar otra foto')}
          onActionPress={handleResetScanner}
        />
      </View>
    );
  }

  // CASO: PANTALLA PRINCIPAL DE CÁMARA / CAPTURA
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={facing === 'back' && torchEnabled}
        active={isFocused}
        onCameraReady={() => setIsCameraReady(true)}
        onMountError={(e) => {
          console.warn('Camera preview mount error:', e);
          setMountError(e.message || t('No se pudo iniciar la cámara en este dispositivo.'));
        }}
      />

      {/* CONTROLES Y ELEMENTOS SUPERPUESTOS EN POSICIÓN ABSOLUTA (CameraView en SDK 57 no admite children) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* BARRA SUPERIOR SOBRE LA CÁMARA */}
        <View style={[styles.cameraTopBar, { paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 12) }]}>
          <View style={[styles.topBarGlassBtn, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 24, overflow: 'hidden' }]}>
            <Pressable
              onPress={() => navigation.goBack()}
              android_ripple={{ color: '#FFFFFF33', borderless: true, radius: 24 }}
              style={({ pressed }) => [styles.iconPressable, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={t('Volver')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </Pressable>
          </View>

          {!limits.isPremium ? (
            <Badge
              label={`${Math.max(0, limits.identificationLimit - limits.identificationsToday)}/${limits.identificationLimit} ${t('hoy')}`}
              variant="neutral"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            />
          ) : (
            <Badge label={t('PRO')} variant="premium" />
          )}

          <View style={[styles.topBarGlassBtn, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 24, overflow: 'hidden' }]}>
            <Pressable
              onPress={toggleTorch}
              android_ripple={{ color: '#FFFFFF33', borderless: true, radius: 24 }}
              style={({ pressed }) => [styles.iconPressable, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={torchEnabled ? t('Apagar linterna') : t('Encender linterna')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={torchEnabled ? 'flash' : 'flash-off'}
                size={22}
                color={torchEnabled ? '#FFD54F' : '#FFFFFF'}
              />
            </Pressable>
          </View>
        </View>

        {/* SELECTOR DE MODO: IDENTIFICAR vs ENFERMEDADES */}
        <View
          style={[
            styles.modeSelectorGlass,
            { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 28, overflow: 'hidden', marginTop: isShortScreen ? 6 : 12 },
          ]}
        >
          <View style={styles.modeSelectorInner}>
            <Pressable
              style={({ pressed }) => [
                styles.modeSegment,
                scanMode === 'identify' && styles.modeSegmentActive,
                { overflow: 'hidden' },
                pressed && { opacity: 0.8 },
              ]}
              android_ripple={{ color: '#FFFFFF33' }}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setScanMode('identify');
              }}
              accessibilityRole="button"
              accessibilityLabel={t('Identificar planta')}
              accessibilityState={{ selected: scanMode === 'identify' }}
            >
              <Ionicons
                name="leaf"
                size={15}
                color={scanMode === 'identify' ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  typography.footnote,
                  {
                    color: scanMode === 'identify' ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                    fontWeight: scanMode === 'identify' ? '700' : '500',
                  },
                ]}
              >
                {t('Identificar planta')}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.modeSegment,
                scanMode === 'diagnose' && styles.modeSegmentActive,
                { overflow: 'hidden' },
                pressed && { opacity: 0.8 },
              ]}
              android_ripple={{ color: '#FFFFFF33' }}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setScanMode('diagnose');
              }}
              accessibilityRole="button"
              accessibilityLabel={t('Mi planta está enferma')}
              accessibilityState={{ selected: scanMode === 'diagnose' }}
            >
              <Ionicons
                name={limits.isFeatureLocked('pestDiagnosis') ? 'lock-closed' : 'medkit'}
                size={14}
                color={scanMode === 'diagnose' ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  typography.footnote,
                  {
                    color: scanMode === 'diagnose' ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                    fontWeight: scanMode === 'diagnose' ? '700' : '500',
                  },
                ]}
              >
                {t('Mi planta está enferma')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ÁREA CENTRAL CON RETÍCULA Y AYUDA CONTEXTUAL */}
        <View style={styles.centerArea}>
          <View style={[styles.reticle, { width: reticleSize, height: reticleSize }]}>
            <View style={[styles.reticleCorner, styles.cornerTL]} />
            <View style={[styles.reticleCorner, styles.cornerTR]} />
            <View style={[styles.reticleCorner, styles.cornerBL]} />
            <View style={[styles.reticleCorner, styles.cornerBR]} />

            {isIdentifying ? (
              <Animated.View style={[styles.laserLine, laserAnimatedStyle]} />
            ) : null}
          </View>

          {/* Ayuda contextual de una sola línea */}
          <View
            style={[
              styles.contextTipGlass,
              { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 24, overflow: 'hidden', marginTop: isShortScreen ? 12 : 20 },
            ]}
          >
            <Pressable
              onPress={() => setGuideVisible(true)}
              android_ripple={{ color: '#FFFFFF33' }}
              style={({ pressed }) => [styles.contextTipInner, { overflow: 'hidden' }, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel={
                scanMode === 'diagnose'
                  ? t('Acércate a la hoja con manchas, plagas o daño visible')
                  : t('Acércate a una hoja con buena luz')
              }
            >
              <Ionicons
                name={scanMode === 'diagnose' ? 'medkit' : 'information-circle'}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={[typography.caption1, { color: '#FFFFFF', fontWeight: '600' }]}>
                {scanMode === 'diagnose'
                  ? t('Acércate a la hoja con manchas, plagas o daño visible')
                  : t('Acércate a una hoja con buena luz')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
        </View>

        {/* ESTADO DE ANÁLISIS EN CURSO */}
        {isIdentifying ? (
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={[typography.headline, { color: '#FFFFFF', marginTop: 14 }]}>
              {scanStepText}
            </Text>
          </View>
        ) : null}

        {/* BARRA INFERIOR: UNA SOLA COSA GRANDE (BOTÓN DE CAPTURA) */}
        <View
          style={[
            styles.cameraBottomBar,
            { paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 16 : 24) },
          ]}
        >
          {/* LADO IZQUIERDO: GALERÍA */}
          <View style={[styles.glassSideBtn, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 25, overflow: 'hidden' }]}>
            <Pressable
              onPress={handlePickGallery}
              android_ripple={{ color: '#FFFFFF33', borderless: true, radius: 25 }}
              style={({ pressed }) => [styles.iconPressable, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={t('Elegir de la galería')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="images" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* CENTRO: BOTÓN GIGANTE DE CAPTURA */}
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing || isIdentifying}
            android_ripple={{ color: '#FFFFFF44', borderless: true, radius: 41 }}
            style={({ pressed }) => [
              styles.shutterButtonOuter,
              (isCapturing || isIdentifying) && { opacity: 0.6 },
              pressed && !(isCapturing || isIdentifying) && { transform: [{ scale: 0.94 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              scanMode === 'diagnose'
                ? t('Diagnosticar hoja enferma')
                : t('Capturar foto de la planta')
            }
          >
            <View
              style={[
                styles.shutterButtonInner,
                {
                  backgroundColor: scanMode === 'diagnose' ? colors.warning : colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={scanMode === 'diagnose' ? 'medkit' : 'camera'}
                  size={26}
                  color="#FFFFFF"
                />
              )}
            </View>
          </Pressable>

          {/* LADO DERECHO: CAMBIAR CÁMARA */}
          <View style={[styles.glassSideBtn, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 25, overflow: 'hidden' }]}>
            <Pressable
              onPress={toggleCameraFacing}
              android_ripple={{ color: '#FFFFFF33', borderless: true, radius: 25 }}
              style={({ pressed }) => [styles.iconPressable, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={t('Cambiar cámara')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* MODAL GUÍA VISUAL */}
      <PhotoGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    textAlign: 'center',
    fontWeight: '800',
  },
  permissionSubtitle: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cameraTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
  },
  topBarGlassBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  iconPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 260,
    height: 260,
    position: 'relative',
    overflow: 'hidden',
  },
  reticleCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  laserLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#00E676',
    shadowColor: '#00E676',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  contextTipGlass: {
    borderRadius: 24,
    marginTop: 20,
    overflow: 'hidden',
  },
  contextTipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  cameraBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    gap: 16,
  },
  shutterButtonOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  shutterButtonInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  glassSideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  modeSelectorGlass: {
    alignSelf: 'center',
    borderRadius: 28,
    marginTop: 12,
    overflow: 'hidden',
  },
  modeSelectorInner: {
    flexDirection: 'row',
    padding: 3,
  },
  modeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minHeight: 48,
  },
  modeSegmentActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
