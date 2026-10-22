import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useFeedback } from '../context/FeedbackContext';
import { Card } from '../components/Card';
import { GlassBackground } from '../components/GlassBackground';
import { Badge } from '../components/Badge';
import { MaterialSwitch } from '../components/MaterialSwitch';
import { useSettings, ThemePreference, AppLanguage, LANGUAGES } from '../context/SettingsContext';
import { usePremium } from '../context/PremiumContext';
import { useGarden } from '../context/GardenContext';
import { requestNotificationPermissions } from '../services/notificationService';
import { announce } from '../services/accessibilityService';
import { useTranslation } from '../i18n';
import {
  SUPPORTED_CITIES,
  getManualCity,
  setManualCity,
} from '../services/weatherService';
import {
  exportFullBackup,
  importBackupFromJSON,
  performFullAccountDeletion,
} from '../services/backupService';
import { AuthModal } from '../components/AuthModal';
import { WidgetPreviewCard } from '../components/WidgetPreviewCard';
import { getCurrentUser, onAuthStateChanged, UserProfile } from '../services/authService';

const NOTIFICATION_HOURS = ['08:00', '09:00', '10:00', '18:00', '20:00'];

export const SettingsScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {
    themePreference,
    setThemePreference,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    easyMode,
    setEasyMode,
    hasPets,
    setHasPets,
    analyticsConsent,
    setAnalyticsConsent,
    resetOnboarding,
    resetSettings,
  } = useSettings();
  const { isPremium, setPremium } = usePremium();
  const { plants, clearGarden, hydrateGarden } = useGarden();
  const { t } = useTranslation();
  const { showToast, confirm } = useFeedback();

  const [notificationHour, setNotificationHour] = useState('09:00');
  const [currentCityName, setCurrentCityName] = useState<string | null>(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  React.useEffect(() => {
    getManualCity().then((city) => setCurrentCityName(city));
    const unsubscribe = onAuthStateChanged((usr) => setCurrentUser(usr));
    return unsubscribe;
  }, []);

  const themeOptions: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'system', label: t('Sistema'), icon: 'phone-portrait-outline' },
    { key: 'light', label: t('Claro'), icon: 'sunny-outline' },
    { key: 'dark', label: t('Oscuro'), icon: 'moon-outline' },
  ];

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      try {
        await requestNotificationPermissions();
        showToast({
          message: t('Recordatorios activados para las {hora}', { hora: notificationHour }),
          type: 'success',
        });
      } catch {}
    }
  };

  const handleExportData = async () => {
    try {
      Haptics.selectionAsync();
      const success = await exportFullBackup();
      if (!success) {
        showToast({
          message: t('No se pudo compartir la copia de seguridad'),
          type: 'error',
        });
      }
    } catch {
      showToast({
        message: t('No se pudo compartir la copia de seguridad'),
        type: 'error',
      });
    }
  };

  const handleExecuteImport = async () => {
    if (!importJsonText.trim()) {
      showToast({ message: t('Pega el texto JSON de la copia de seguridad'), type: 'warning' });
      return;
    }

    const result = await importBackupFromJSON(importJsonText.trim());
    if (result.success) {
      setIsImportModalVisible(false);
      setImportJsonText('');
      await hydrateGarden();
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      showToast({
        message: t('Copia restaurada: {total} plantas recuperadas', { total: result.totalPlants }),
        type: 'success',
      });
    } else {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
      showToast({ message: result.message, type: 'error' });
    }
  };

  const handleDeleteData = async () => {
    const confirmed = await confirm({
      title: t('Eliminar cuenta y datos del dispositivo'),
      message: t('Se borrarán de forma definitiva tu jardín, estadísticas, fotos, diario, ajustes y cualquier copia remota. Esta acción no se puede deshacer.'),
      confirmText: t('Eliminar todo'),
      cancelText: t('Cancelar'),
      isDestructive: true,
    });
    if (!confirmed) return;

    clearGarden();
    setPremium(false);
    resetSettings();
    resetOnboarding();
    await performFullAccountDeletion(currentUser?.uid);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    showToast({
      message: t('Tus datos y cuenta se han eliminado por completo'),
      type: 'info',
    });
    navigation.goBack();
  };

  const handlePrivacy = async () => {
    await confirm({
      title: t('Privacidad'),
      message: t('En EcoScan tus fotos solo se usan para reconocer tus plantas y revisar su salud. No guardamos imágenes sin tu permiso ni compartimos tus datos con terceros. Puedes borrar toda tu información en cualquier momento desde esta pantalla.\n\nSitio web: ecoscan.app/privacidad'),
      confirmText: t('Entendido'),
      cancelText: null,
    });
  };

  const handleContactSupport = () => {
    try { Haptics.selectionAsync(); } catch {}
    Linking.openURL('mailto:soporte@ecoscan.app?subject=Ayuda%20con%20EcoScan').catch(() => {
      showToast({
        message: t('Escríbenos a soporte@ecoscan.app'),
        type: 'info',
      });
    });
  };

  const renderSectionTitle = (title: string) => (
    <Text
      style={[
        typography.headline,
        { color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.xxs },
      ]}
    >
      {title}
    </Text>
  );

  return (
    <GlassBackground style={styles.container}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 16),
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
          ]}
          android_ripple={{ color: colors.primary + '20', borderless: true, radius: 24 }}
          accessibilityRole="button"
          accessibilityLabel={t('Volver')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
        </Pressable>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Ajustes')}</Text>
        <View style={styles.actionHeaderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: Math.max(insets.bottom + 24, spacing.xxxl),
        }}
      >
        {/* 1. MODO FÁCIL */}
        {renderSectionTitle(t('Modo fácil'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Activar Modo fácil')}</Text>
              <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
                {t('Texto y botones más grandes, navegación directa y explicaciones sencillas pensadas para toda la familia.')}
              </Text>
            </View>
            <MaterialSwitch
              value={easyMode}
              onValueChange={(val) => {
                setEasyMode(val);
                announce(val ? t('Modo fácil activado') : t('Modo fácil desactivado'));
              }}
              accessibilityLabel={t('Modo fácil')}
              accessibilityHint={t('Texto y botones más grandes, menos animaciones y navegación simplificada')}
            />
          </View>
        </Card>

        {/* MASCOTAS EN EL HOGAR */}
        {renderSectionTitle(t('Mascotas en el hogar'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Tengo perros o gatos en casa')}</Text>
              <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
                {t('Te avisaremos al guardar o cuidar plantas que resulten tóxicas o peligrosas para tus animales.')}
              </Text>
            </View>
            <MaterialSwitch
              value={hasPets}
              onValueChange={(val) => {
                setHasPets(val);
                announce(val ? t('Avisos de mascotas activados') : t('Avisos de mascotas desactivados'));
              }}
              accessibilityLabel={t('Tengo perros o gatos en casa')}
            />
          </View>
        </Card>

        {/* WIDGET DE PANTALLA DE INICIO */}
        {renderSectionTitle(t('Widget'))}
        <WidgetPreviewCard />

        {/* 2. APARIENCIA */}
        {renderSectionTitle(t('Apariencia'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={styles.row}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Tema')}</Text>
            <Text style={[typography.caption1, { color: colors.textTertiary }]}>
              {themeOptions.find((option) => option.key === themePreference)?.label}
            </Text>
          </View>
          <View style={styles.segmentRow}>
            {themeOptions.map((option) => {
              const selected = themePreference === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setThemePreference(option.key);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t('Tema {theme}', { theme: option.label })}
                  android_ripple={{ color: colors.primary + '25' }}
                  style={({ pressed }) => [
                    styles.segment,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primaryLight : colors.surface,
                      borderRadius: layout.borderRadius.lg,
                      overflow: 'hidden',
                      opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons name={option.icon} size={18} color={selected ? colors.primary : colors.textSecondary} />
                  <Text style={[typography.footnote, { color: selected ? colors.primary : colors.textSecondary, marginLeft: 6, fontWeight: '600' }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* 3. IDIOMA */}
        {renderSectionTitle(t('Idioma'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          {LANGUAGES.map((lang, index) => {
            const selected = language === lang.code;
            return (
              <View key={lang.code}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setLanguage(lang.code as AppLanguage);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t('Idioma {lenguaje}', { lenguaje: lang.label })}
                  android_ripple={{ color: colors.primary + '18' }}
                  style={({ pressed }) => [
                    styles.rowTap,
                    {
                      borderRadius: 8,
                      overflow: 'hidden',
                      opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{lang.label}</Text>
                  {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
                {index < LANGUAGES.length - 1 ? <View style={[styles.separator, { backgroundColor: colors.border }]} /> : null}
              </View>
            );
          })}
        </Card>

        {/* 4. NOTIFICACIONES */}
        {renderSectionTitle(t('Notificaciones'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Recordatorios de riego')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Aviso diario cuando a tus plantas les falte agua')}
              </Text>
            </View>
            <MaterialSwitch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              accessibilityLabel={t('Activar recordatorios de riego')}
            />
          </View>

          {notificationsEnabled && (
            <>
              <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: spacing.xs }]} />
              <View style={styles.row}>
                <Text style={[typography.subheadline, { color: colors.textPrimary }]}>{t('Hora habitual de aviso')}</Text>
                <View style={styles.hourPillsRow}>
                  {NOTIFICATION_HOURS.map((hour) => {
                    const active = notificationHour === hour;
                    return (
                      <Pressable
                        key={hour}
                        onPress={() => {
                          try { Haptics.selectionAsync(); } catch {}
                          setNotificationHour(hour);
                        }}
                        style={({ pressed }) => [
                          styles.hourPill,
                          {
                            backgroundColor: active ? colors.primary : colors.surfaceSecondary,
                            borderColor: active ? colors.primary : colors.border,
                            overflow: 'hidden',
                            opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
                          },
                        ]}
                        android_ripple={{ color: active ? 'rgba(255,255,255,0.3)' : colors.primary + '20' }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={t('Hora de aviso {hora}', { hora: hour })}
                      >
                        <Text style={[typography.caption1, { color: active ? '#FFFFFF' : colors.textPrimary, fontWeight: active ? '700' : '500' }]}>
                          {hour}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </Card>

        {/* UBICACIÓN DEL CLIMA */}
        {renderSectionTitle(t('Ubicación para el clima'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Ciudad para el pronóstico')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {currentCityName ? currentCityName : t('Automática (usando tu ubicación)')}
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
            <Pressable
              onPress={() => {
                try { Haptics.selectionAsync(); } catch {}
                setManualCity(null);
                setCurrentCityName(null);
                showToast({ message: t('Ubicación fijada en automática'), type: 'success' });
              }}
              style={({ pressed }) => [
                styles.cityPill,
                {
                  backgroundColor: !currentCityName ? colors.primary : colors.surfaceSecondary,
                  borderColor: !currentCityName ? colors.primary : colors.border,
                  overflow: 'hidden',
                  opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
                },
              ]}
              android_ripple={{ color: !currentCityName ? 'rgba(255,255,255,0.3)' : colors.primary + '20' }}
              accessibilityRole="button"
              accessibilityState={{ selected: !currentCityName }}
              accessibilityLabel={t('Ubicación automática por GPS')}
            >
              <Ionicons name="navigate-outline" size={16} color={!currentCityName ? '#FFFFFF' : colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={[typography.caption1, { color: !currentCityName ? '#FFFFFF' : colors.textPrimary, fontWeight: !currentCityName ? '700' : '500' }]}>
                {t('Automática')}
              </Text>
            </Pressable>
            {SUPPORTED_CITIES.map((c) => {
              const isSelected = currentCityName?.toLowerCase() === c.name.toLowerCase();
              return (
                <Pressable
                  key={c.name}
                  onPress={() => {
                    try { Haptics.selectionAsync(); } catch {}
                    setManualCity(c.name);
                    setCurrentCityName(c.name);
                    showToast({ message: t('Ubicación fijada en {ciudad}', { ciudad: c.name }), type: 'success' });
                  }}
                  style={({ pressed }) => [
                    styles.cityPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                      overflow: 'hidden',
                      opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
                    },
                  ]}
                  android_ripple={{ color: isSelected ? 'rgba(255,255,255,0.3)' : colors.primary + '20' }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={t('Fijar ciudad en {ciudad}', { ciudad: c.name })}
                >
                  <Text style={[typography.caption1, { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>

        {/* 5. PLAN */}
        {renderSectionTitle(t('Plan'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Pressable
            onPress={() => navigation.navigate('Paywall')}
            accessibilityRole="button"
            accessibilityLabel={isPremium ? t('Gestionar suscripción') : t('Ver planes Premium')}
            android_ripple={{ color: colors.primary + '18' }}
            style={({ pressed }) => [
              styles.rowTap,
              {
                borderRadius: 8,
                overflow: 'hidden',
                opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
                {isPremium ? t('EcoScan Pro activo') : t('EcoScan Free (Gratis)')}
              </Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {isPremium ? t('Disfrutas de análisis y diagnósticos ilimitados') : t('Toca para conocer las ventajas de Pro')}
              </Text>
            </View>
            {isPremium ? <Badge label="PRO" variant="premium" /> : <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />}
          </Pressable>
        </Card>

        {/* CUENTA Y NUBE */}
        {renderSectionTitle(t('Cuenta y nube'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Pressable
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              setIsAuthModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={currentUser ? t('Gestionar cuenta y sincronización') : t('Iniciar sesión o registrarse')}
            android_ripple={{ color: colors.primary + '18' }}
            style={({ pressed }) => [
              styles.rowTap,
              {
                borderRadius: 8,
                overflow: 'hidden',
                opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
                  {currentUser ? (currentUser.displayName || currentUser.email || t('Cuenta activa')) : t('Cuenta opcional')}
                </Text>
                {currentUser ? (
                  <Badge label={t('Sincronizado')} variant="success" style={{ marginLeft: 8 }} />
                ) : (
                  <Badge label={t('Modo local')} variant="neutral" style={{ marginLeft: 8 }} />
                )}
              </View>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {currentUser
                  ? t('Jardín respaldado en la nube. Toca para sincronizar.')
                  : t('Crea una cuenta para sincronizar tus plantas entre dispositivos.')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
        </Card>

        {/* 6. PRIVACIDAD Y DATOS */}
        {renderSectionTitle(t('Privacidad y datos'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Compartir datos de uso anónimos')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2, lineHeight: 18 }]}>
                {t('Nos ayuda a mejorar la app y detectar fallos. Nunca enviamos fotos, nombres ni datos personales.')}
              </Text>
            </View>
            <MaterialSwitch
              value={analyticsConsent}
              onValueChange={(val) => {
                setAnalyticsConsent(val);
                announce(val ? t('Analítica anónima activada') : t('Analítica anónima desactivada'));
              }}
              accessibilityLabel={t('Compartir datos de uso anónimos')}
            />
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={handleExportData}
            accessibilityRole="button"
            accessibilityLabel={t('Exportar copia de mi jardín')}
            android_ripple={{ color: colors.primary + '18' }}
            style={({ pressed }) => [
              styles.rowTap,
              { borderRadius: 8, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Exportar copia de mi jardín')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Guarda o comparte tu lista de plantas en formato JSON')}
              </Text>
            </View>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
          </Pressable>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={() => setIsImportModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t('Importar copia de seguridad')}
            android_ripple={{ color: colors.primary + '18' }}
            style={({ pressed }) => [
              styles.rowTap,
              { borderRadius: 8, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Importar copia de seguridad')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Restaura tu jardín a partir de un texto JSON previo')}
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </Pressable>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={() => navigation.navigate('PrivacyPolicy')}
            accessibilityRole="button"
            accessibilityLabel={t('Política de privacidad')}
            android_ripple={{ color: colors.primary + '18' }}
            style={({ pressed }) => [
              styles.rowTap,
              { borderRadius: 8, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
          >
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Política de privacidad')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={() => navigation.navigate('TermsOfService')}
            accessibilityRole="button"
            accessibilityLabel={t('Términos y condiciones')}
            android_ripple={{ color: colors.primary + '18' }}
            style={({ pressed }) => [
              styles.rowTap,
              { borderRadius: 8, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
          >
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Términos y condiciones')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={resetOnboarding}
            accessibilityRole="button"
            accessibilityLabel={t('Ver introducción de nuevo')}
            android_ripple={{ color: colors.primary + '18' }}
            style={({ pressed }) => [
              styles.rowTap,
              { borderRadius: 8, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
          >
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Ver introducción de nuevo')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={handleDeleteData}
            accessibilityRole="button"
            accessibilityLabel={t('Eliminar cuenta y datos del dispositivo')}
            android_ripple={{ color: colors.error + '20' }}
            style={({ pressed }) => [
              styles.rowTap,
              { borderRadius: 8, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
          >
            <Text style={[typography.body, { color: colors.error }]}>{t('Eliminar cuenta y datos del dispositivo')}</Text>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        </Card>

        {/* 7. AYUDA Y CONTACTO */}
        {renderSectionTitle(t('Ayuda y contacto'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.sm,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Pressable
            onPress={() => navigation.navigate('Help')}
            accessibilityRole="button"
            accessibilityLabel={t('Centro de ayuda y preguntas frecuentes')}
            android_ripple={{ color: colors.primary + '18' }}
            style={({ pressed }) => [
              styles.rowTap,
              { borderRadius: 8, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Centro de ayuda')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Preguntas frecuentes, guía y reportar un problema')}
              </Text>
            </View>
            <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
          </Pressable>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={handleContactSupport}
            accessibilityRole="button"
            accessibilityLabel={t('Contactar por correo')}
            android_ripple={{ color: colors.primary + '18' }}
            style={({ pressed }) => [
              styles.rowTap,
              { borderRadius: 8, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Contactar con soporte')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                soporte@ecoscan.app
              </Text>
            </View>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </Pressable>
        </Card>

        {/* 8. ACERCA DE */}
        {renderSectionTitle(t('Acerca de'))}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.xl,
            alignItems: 'center',
            paddingVertical: spacing.lg,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Image
            source={require('../assets/logo.png')}
            style={styles.aboutLogo}
            resizeMode="contain"
            accessible
            accessibilityLabel={t('Logotipo oficial de EcoScan')}
          />
          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.sm }]}>EcoScan</Text>
          <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm }]}>
            {t('Versión {version}', { version: '1.0.0' })}
          </Text>
          <View style={[styles.separator, { backgroundColor: colors.border, width: '100%', marginVertical: spacing.xs }]} />
          <Text style={[typography.subheadline, { color: colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.sm, marginTop: spacing.xs }]}>
            {t('EcoScan · Creado con cariño para ayudarte a cuidar tus plantas de forma fácil y natural.')}
          </Text>
        </Card>
      </ScrollView>

      {/* MODAL DE IMPORTAR COPIA DE SEGURIDAD */}
      <Modal
        visible={isImportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsImportModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, maxHeight: '80%' }}>
            <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 8 }]}>
              {t('Importar copia de seguridad')}
            </Text>
            <Text style={[typography.subheadline, { color: colors.textSecondary, marginBottom: 12 }]}>
              {t('Pega a continuación el contenido JSON de tu copia de seguridad para restaurar tu jardín.')}
            </Text>
            <TextInput
              multiline
              value={importJsonText}
              onChangeText={setImportJsonText}
              placeholder='{"app": "EcoScan", ...}'
              placeholderTextColor={colors.textTertiary}
              style={{
                height: 140,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 10,
                color: colors.textPrimary,
                textAlignVertical: 'top',
                backgroundColor: colors.surfaceSecondary,
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <Pressable
                onPress={() => {
                  setIsImportModalVisible(false);
                  setImportJsonText('');
                }}
                style={({ pressed }) => [
                  { minHeight: 48, minWidth: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 8, overflow: 'hidden' },
                  pressed && Platform.OS === 'ios' && { opacity: 0.7 },
                ]}
                android_ripple={{ color: colors.textSecondary + '20' }}
                accessibilityRole="button"
                accessibilityLabel={t('Cancelar')}
              >
                <Text style={[typography.body, { color: colors.textSecondary }]}>{t('Cancelar')}</Text>
              </Pressable>
              <Pressable
                onPress={handleExecuteImport}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    minHeight: 48,
                    justifyContent: 'center',
                    paddingHorizontal: 20,
                    overflow: 'hidden',
                  },
                  pressed && Platform.OS === 'ios' && { opacity: 0.8 },
                ]}
                android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                accessibilityRole="button"
                accessibilityLabel={t('Restaurar mi jardín')}
              >
                <Text style={[typography.headline, { color: '#FFFFFF' }]}>{t('Restaurar')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <AuthModal
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
      />
    </GlassBackground>
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
  backButton: { flexDirection: 'row', alignItems: 'center', minHeight: 48, minWidth: 48 },
  actionHeaderBtn: { width: 60 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    minHeight: 48,
  },
  rowTap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 48,
  },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 48,
    minWidth: 48,
  },
  separator: { height: 1, width: '100%' },
  hourPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  hourPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 48,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 18,
  },
});
