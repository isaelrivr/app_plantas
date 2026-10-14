import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useFeedback } from '../context/FeedbackContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useSettings, ThemePreference, AppLanguage, LANGUAGES } from '../context/SettingsContext';
import { usePremium } from '../context/PremiumContext';
import { useGarden } from '../context/GardenContext';
import { requestNotificationPermissions } from '../services/notificationService';
import { clearAllAppData } from '../services/storage';
import { clearGrowthDiary } from '../services/growthDiaryService';
import { clearPersistedImages } from '../services/mediaService';
import { announce } from '../services/accessibilityService';
import { useTranslation } from '../i18n';
import {
  SUPPORTED_CITIES,
  getManualCity,
  setManualCity,
  ManualCity,
} from '../services/weatherService';

const NOTIFICATION_HOURS = ['08:00', '09:00', '10:00', '18:00', '20:00'];

export const SettingsScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const {
    themePreference,
    setThemePreference,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    easyMode,
    setEasyMode,
    analyticsConsent,
    setAnalyticsConsent,
    resetOnboarding,
    resetSettings,
  } = useSettings();
  const { isPremium, setPremium } = usePremium();
  const { plants, clearGarden } = useGarden();
  const { t } = useTranslation();
  const { showToast, confirm } = useFeedback();

  const [notificationHour, setNotificationHour] = useState('09:00');
  const [currentCityName, setCurrentCityName] = useState<string | null>(null);

  React.useEffect(() => {
    getManualCity().then((city) => setCurrentCityName(city));
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
      const exportPayload = {
        app: 'EcoScan',
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        totalPlants: plants.length,
        plants: plants.map((p) => ({
          name: p.name,
          scientificName: p.scientificName,
          wateringFrequencyDays: p.wateringFrequencyDays,
          healthScore: p.healthScore,
          careTasks: p.careTasks,
        })),
      };

      await Share.share({
        title: t('Copia de seguridad de mi jardín - EcoScan'),
        message: JSON.stringify(exportPayload, null, 2),
      });
    } catch {
      showToast({
        message: t('No se pudo compartir la copia de seguridad'),
        type: 'error',
      });
    }
  };

  const handleDeleteData = async () => {
    const confirmed = await confirm({
      title: t('Eliminar mis datos del dispositivo'),
      message: t('Se borrarán de este dispositivo tu jardín, estadísticas, fotos, diario y ajustes. Esta acción no se puede deshacer.'),
      confirmText: t('Eliminar todo'),
      cancelText: t('Cancelar'),
      isDestructive: true,
    });
    if (!confirmed) return;

    clearGrowthDiary();
    await clearPersistedImages();
    clearGarden();
    setPremium(false);
    resetSettings();
    resetOnboarding();
    await clearAllAppData();
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    showToast({
      message: t('Los datos de este dispositivo se han eliminado'),
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: Platform.OS === 'ios' ? 12 : 16 },
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
        <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Ajustes')}</Text>
        <View style={styles.actionHeaderBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}>
        {/* 1. MODO FÁCIL */}
        {renderSectionTitle(t('Modo fácil'))}
        <Card style={{ marginBottom: spacing.sm }}>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Activar Modo fácil')}</Text>
              <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
                {t('Texto y botones más grandes, navegación directa y explicaciones sencillas pensadas para toda la familia.')}
              </Text>
            </View>
            <Switch
              value={easyMode}
              onValueChange={(val) => {
                Haptics.selectionAsync();
                setEasyMode(val);
                announce(val ? t('Modo fácil activado') : t('Modo fácil desactivado'));
              }}
              accessibilityRole="switch"
              accessibilityLabel={t('Modo fácil')}
              accessibilityHint={t('Texto y botones más grandes, menos animaciones y navegación simplificada')}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={easyMode ? colors.primary : '#FFFFFF'}
            />
          </View>
        </Card>

        {/* 2. APARIENCIA */}
        {renderSectionTitle(t('Apariencia'))}
        <Card>
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
                <TouchableOpacity
                  key={option.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setThemePreference(option.key);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t('Tema {theme}', { theme: option.label })}
                  style={[
                    styles.segment,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primaryLight : colors.surface,
                      borderRadius: layout.borderRadius.md,
                    },
                  ]}
                >
                  <Ionicons name={option.icon} size={18} color={selected ? colors.primary : colors.textSecondary} />
                  <Text style={[typography.footnote, { color: selected ? colors.primary : colors.textSecondary, marginLeft: 6, fontWeight: '600' }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* 3. IDIOMA */}
        {renderSectionTitle(t('Idioma'))}
        <Card>
          {LANGUAGES.map((lang, index) => {
            const selected = language === lang.code;
            return (
              <View key={lang.code}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setLanguage(lang.code as AppLanguage);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t('Idioma {lenguaje}', { lenguaje: lang.label })}
                  style={styles.rowTap}
                >
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{lang.label}</Text>
                  {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                </TouchableOpacity>
                {index < LANGUAGES.length - 1 ? <View style={[styles.separator, { backgroundColor: colors.border }]} /> : null}
              </View>
            );
          })}
        </Card>

        {/* 4. NOTIFICACIONES */}
        {renderSectionTitle(t('Notificaciones'))}
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Recordatorios de riego')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Aviso diario cuando a tus plantas les falte agua')}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: colors.primary, false: colors.border }}
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
                      <TouchableOpacity
                        key={hour}
                        onPress={() => {
                          try { Haptics.selectionAsync(); } catch {}
                          setNotificationHour(hour);
                        }}
                        style={[
                          styles.hourPill,
                          {
                            backgroundColor: active ? colors.primary : colors.surfaceSecondary,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[typography.caption1, { color: active ? '#FFFFFF' : colors.textPrimary, fontWeight: active ? '700' : '500' }]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </Card>

        {/* UBICACIÓN DEL CLIMA */}
        {renderSectionTitle(t('Ubicación para el clima'))}
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Ciudad para el pronóstico')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {currentCityName ? currentCityName : t('Automática (usando tu ubicación)')}
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
            <TouchableOpacity
              onPress={() => {
                try { Haptics.selectionAsync(); } catch {}
                setManualCity(null);
                setCurrentCityName(null);
                showToast({ message: t('Ubicación fijada en automática'), type: 'success' });
              }}
              style={[
                styles.cityPill,
                {
                  backgroundColor: !currentCityName ? colors.primary : colors.surfaceSecondary,
                  borderColor: !currentCityName ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: !currentCityName }}
              accessibilityLabel={t('Ubicación automática por GPS')}
            >
              <Ionicons name="navigate-outline" size={16} color={!currentCityName ? '#FFFFFF' : colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={[typography.caption1, { color: !currentCityName ? '#FFFFFF' : colors.textPrimary, fontWeight: !currentCityName ? '700' : '500' }]}>
                {t('Automática')}
              </Text>
            </TouchableOpacity>
            {SUPPORTED_CITIES.map((c) => {
              const isSelected = currentCityName?.toLowerCase() === c.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => {
                    try { Haptics.selectionAsync(); } catch {}
                    setManualCity(c.name);
                    setCurrentCityName(c.name);
                    showToast({ message: t('Ubicación fijada en {ciudad}', { ciudad: c.name }), type: 'success' });
                  }}
                  style={[
                    styles.cityPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={t('Fijar ciudad en {ciudad}', { ciudad: c.name })}
                >
                  <Text style={[typography.caption1, { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Card>

        {/* 5. PLAN */}
        {renderSectionTitle(t('Plan'))}
        <Card>
          <TouchableOpacity
            onPress={() => navigation.navigate('Paywall')}
            accessibilityRole="button"
            accessibilityLabel={isPremium ? t('Gestionar suscripción') : t('Ver planes Premium')}
            style={styles.rowTap}
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
          </TouchableOpacity>
        </Card>

        {/* 6. PRIVACIDAD Y DATOS */}
        {renderSectionTitle(t('Privacidad y datos'))}
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Compartir datos de uso anónimos')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2, lineHeight: 18 }]}>
                {t('Nos ayuda a mejorar la app y detectar fallos. Nunca enviamos fotos, nombres ni datos personales.')}
              </Text>
            </View>
            <Switch
              value={analyticsConsent}
              onValueChange={(val) => {
                try { Haptics.selectionAsync(); } catch {}
                setAnalyticsConsent(val);
                announce(val ? t('Analítica anónima activada') : t('Analítica anónima desactivada'));
              }}
              trackColor={{ true: colors.primary, false: colors.border }}
              accessibilityLabel={t('Compartir datos de uso anónimos')}
            />
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={handleExportData} accessibilityRole="button" accessibilityLabel={t('Exportar copia de mi jardín')} style={styles.rowTap}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Exportar copia de mi jardín')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Guarda o comparte tu lista de plantas en formato JSON')}
              </Text>
            </View>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} accessibilityRole="button" accessibilityLabel={t('Política de privacidad')} style={styles.rowTap}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Política de privacidad')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} accessibilityRole="button" accessibilityLabel={t('Términos y condiciones')} style={styles.rowTap}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Términos y condiciones')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={resetOnboarding} accessibilityRole="button" accessibilityLabel={t('Ver introducción de nuevo')} style={styles.rowTap}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Ver introducción de nuevo')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={handleDeleteData} accessibilityRole="button" accessibilityLabel={t('Eliminar mis datos del dispositivo')} style={styles.rowTap}>
            <Text style={[typography.body, { color: colors.error }]}>{t('Eliminar mis datos del dispositivo')}</Text>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </Card>

        {/* 7. AYUDA Y CONTACTO */}
        {renderSectionTitle(t('Ayuda y contacto'))}
        <Card>
          <TouchableOpacity onPress={() => navigation.navigate('Help')} accessibilityRole="button" accessibilityLabel={t('Centro de ayuda y preguntas frecuentes')} style={styles.rowTap}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Centro de ayuda')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Preguntas frecuentes, guía y reportar un problema')}
              </Text>
            </View>
            <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={handleContactSupport} accessibilityRole="button" accessibilityLabel={t('Contactar por correo')} style={styles.rowTap}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Contactar con soporte')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                soporte@ecoscan.app
              </Text>
            </View>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* 8. ACERCA DE */}
        {renderSectionTitle(t('Acerca de'))}
        <Card style={{ marginBottom: spacing.xl }}>
          <View style={styles.row}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Versión de EcoScan')}</Text>
            <Text style={[typography.subheadline, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[typography.subheadline, { color: colors.textSecondary, lineHeight: 20 }]}>
              {t('EcoScan · Creado con cariño para ayudarte a cuidar tus plantas de forma fácil y natural.')}
            </Text>
          </View>
        </Card>
      </ScrollView>
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 40,
  },
});
