import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
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
    resetOnboarding,
    resetSettings,
  } = useSettings();
  const { isPremium, setPremium } = usePremium();
  const { clearGarden } = useGarden();
  const { t } = useTranslation();
  const { showToast, confirm } = useFeedback();

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
      } catch {}
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

    // Borra también los datos persistidos en disco (no solo la memoria).
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
        {renderSectionTitle(t('Accesibilidad'))}
        <Card style={{ marginBottom: spacing.sm }}>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Modo fácil')}</Text>
              <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
                {t('Texto y botones más grandes, menos animaciones y navegación simplificada')}
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

        {renderSectionTitle(t('Notificaciones'))}
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Recordatorios de cuidado')}</Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Riego, abono y poda según cada planta')}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: colors.primary, false: colors.border }}
              accessibilityLabel={t('Activar recordatorios de cuidado')}
            />
          </View>
        </Card>

        {renderSectionTitle(t('Suscripción'))}
        <Card>
          <TouchableOpacity
            onPress={() => navigation.navigate('Paywall')}
            accessibilityRole="button"
            accessibilityLabel={isPremium ? t('Gestionar suscripción') : t('Ver planes Premium')}
            style={styles.rowTap}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                {isPremium ? t('EcoScan Pro activo') : t('Mejorar a EcoScan Pro')}
              </Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {isPremium ? t('Gestiona tu plan y facturación') : t('Desbloquea todas las funciones')}
              </Text>
            </View>
            {isPremium ? <Badge label="PRO" variant="premium" /> : <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />}
          </TouchableOpacity>
        </Card>

        {renderSectionTitle(t('Privacidad y datos'))}
        <Card>
          <TouchableOpacity onPress={handlePrivacy} accessibilityRole="button" accessibilityLabel={t('Política de privacidad')} style={styles.rowTap}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Política de privacidad')}</Text>
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

        <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xl }]}>
          {t('EcoScan · Versión 1.0.0')}
        </Text>
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
});
