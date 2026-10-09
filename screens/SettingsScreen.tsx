import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useSettings, ThemePreference, AppLanguage, LANGUAGES } from '../context/SettingsContext';
import { usePremium } from '../context/PremiumContext';
import { useGarden } from '../context/GardenContext';
import { requestNotificationPermissions } from '../services/notificationService';
import { clearAllAppData } from '../services/storage';
import { clearGrowthDiary } from '../services/growthDiaryService';
import { clearPersistedImages } from '../services/mediaService';
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
    resetOnboarding,
    resetSettings,
  } = useSettings();
  const { isPremium, cancel } = usePremium();
  const { clearGarden, resetStats } = useGarden();
  const { t } = useTranslation();

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

  const handleDeleteData = () => {
    Alert.alert(
      t('Eliminar cuenta y datos'),
      t('Se borrarán tu jardín, estadísticas, ajustes y suscripción local de forma permanente. Esta acción no se puede deshacer.'),
      [
        { text: t('Cancelar'), style: 'cancel' },
        {
          text: t('Eliminar todo'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel();
            } catch {}
            // Borra también los datos persistidos en disco (no solo la memoria).
            clearGrowthDiary();
            await clearPersistedImages();
            await clearAllAppData();
            clearGarden();
            resetStats();
            resetSettings();
            resetOnboarding();
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
            Alert.alert(t('Datos eliminados'), t('Tu cuenta y datos locales han sido eliminados.'));
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      t('Privacidad'),
      t('En Plantae las fotos se procesan para identificar plantas. En producción, la identificación se realiza mediante Cloud Functions y no se almacenan imágenes sin tu consentimiento. Puedes eliminar todos tus datos en cualquier momento desde esta pantalla.\n\nPolítica completa: plantae.app/privacidad'),
      [{ text: t('Entendido') }]
    );
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
                {isPremium ? t('Plantae Pro activo') : t('Mejorar a Plantae Pro')}
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
          <TouchableOpacity onPress={handleDeleteData} accessibilityRole="button" accessibilityLabel={t('Eliminar cuenta y datos')} style={styles.rowTap}>
            <Text style={[typography.body, { color: colors.error }]}>{t('Eliminar cuenta y datos')}</Text>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </Card>

        <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xl }]}>
          {t('Plantae · Versión 1.0.0 (Expo SDK 57)')}
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
  backButton: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  actionHeaderBtn: { width: 60 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    minHeight: 44,
  },
  rowTap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 44,
  },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 44,
  },
  separator: { height: 1, width: '100%' },
});
