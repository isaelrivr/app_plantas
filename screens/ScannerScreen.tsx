import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
  const { colors, spacing, typography, layout } = useAppTheme();
  const { t } = useTranslation();
  const { showToast, confirm } = useFeedback();
  const { addPlant, registerIdentification } = useGarden();
  const limits = usePlanLimits();
  const navigation = useNavigation<any>();

  // Permisos y cámara
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);

  // Estados del escaneo
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>(t('Buscando tu planta...'));
  const [identificationResult, setIdentificationResult] = useState<PlantIdentificationResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<IdentificationCandidate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavedToGarden, setIsSavedToGarden] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [guideVisible, setGuideVisible] = useState<boolean>(false);

  // Animación de línea láser
  const [scanLineAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isIdentifying) {
      scanLineAnim.setValue(0);
      const loop = Animated.loop(
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
      loop.start();

      const timer1 = setTimeout(() => setScanStepText(t('Revisando las hojas...')), 400);
      const timer2 = setTimeout(() => setScanStepText(t('Buscando en la enciclopedia...')), 900);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        loop.stop();
      };
    }
  }, [isIdentifying, scanLineAnim, t]);

  const toggleCameraFacing = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleTorch = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setTorchEnabled((prev) => !prev);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

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

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
        analyzePhoto(photo.uri);
      }
    } catch {
      showToast({
        message: t('No se pudo capturar la imagen. Intenta de nuevo.'),
        type: 'error',
      });
    }
  };

  const handlePickGallery = async () => {
    try {
      Haptics.selectionAsync();
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].uri;
        setCapturedPhoto(uri);
        analyzePhoto(uri);
      }
    } catch {
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

  // CASO: PERMISO DE CÁMARA PENDIENTE O DENEGADO
  if (!permission?.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
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
          {t('EcoScan necesita acceso a tu cámara para identificar plantas y revisar la salud de sus hojas.')}
        </Text>

        <Button
          title={t('Activar cámara')}
          onPress={requestPermission}
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

  // CASO: RESULTADO DE IDENTIFICACIÓN
  if (identificationResult && selectedCandidate) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 44 : 20 }}
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
              speciesId: selectedCandidate.id,
              plantName: selectedCandidate.name,
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
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
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
        enableTorch={torchEnabled}
      >
        {/* BARRA SUPERIOR SOBRE LA CÁMARA */}
        <View style={styles.cameraTopBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel={t('Volver')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {!limits.isPremium ? (
            <Badge
              label={`${Math.max(0, limits.identificationLimit - limits.identificationsToday)}/${limits.identificationLimit} hoy`}
              variant="neutral"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            />
          ) : (
            <Badge label="PRO" variant="premium" />
          )}

          <TouchableOpacity
            onPress={toggleTorch}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel={torchEnabled ? t('Apagar linterna') : t('Encender linterna')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-off'}
              size={24}
              color={torchEnabled ? '#FFD54F' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* ÁREA CENTRAL CON RETÍCULA Y AYUDA CONTEXTUAL */}
        <View style={styles.centerArea}>
          <View style={styles.reticle}>
            <View style={[styles.reticleCorner, styles.cornerTL]} />
            <View style={[styles.reticleCorner, styles.cornerTR]} />
            <View style={[styles.reticleCorner, styles.cornerBL]} />
            <View style={[styles.reticleCorner, styles.cornerBR]} />

            {isIdentifying ? (
              <Animated.View
                style={[
                  styles.laserLine,
                  {
                    transform: [
                      {
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 240],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ) : null}
          </View>

          {/* Ayuda contextual de una sola línea */}
          <TouchableOpacity
            onPress={() => setGuideVisible(true)}
            activeOpacity={0.8}
            style={styles.contextTip}
            accessibilityRole="button"
            accessibilityLabel={t('Acércate a una hoja con buena luz. Ver ejemplo.')}
          >
            <Ionicons name="information-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={[typography.caption1, { color: '#FFFFFF', fontWeight: '600' }]}>
              {t('Acércate a una hoja con buena luz')}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
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
        <View style={styles.cameraBottomBar}>
          {/* LADO IZQUIERDO: GALERÍA */}
          <TouchableOpacity
            onPress={handlePickGallery}
            style={styles.sideControlBtn}
            accessibilityRole="button"
            accessibilityLabel={t('Elegir de la galería')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="images" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* CENTRO: BOTÓN GIGANTE DE CAPTURA */}
          <TouchableOpacity
            onPress={handleCapture}
            activeOpacity={0.85}
            style={styles.shutterButtonOuter}
            accessibilityRole="button"
            accessibilityLabel={t('Capturar foto de la planta')}
          >
            <View style={[styles.shutterButtonInner, { backgroundColor: colors.primary }]} />
          </TouchableOpacity>

          {/* LADO DERECHO: CAMBIAR CÁMARA */}
          <TouchableOpacity
            onPress={toggleCameraFacing}
            style={styles.sideControlBtn}
            accessibilityRole="button"
            accessibilityLabel={t('Cambiar cámara')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </CameraView>

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
  topBarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
  contextTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 20,
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
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 20,
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
  sideControlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
