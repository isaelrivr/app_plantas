import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';

/**
 * Pantalla de arranque que se muestra mientras se hidrata el estado persistido.
 * Evita el "parpadeo" del onboarding y del estado Free/Pro antes de leer disco.
 */
export const AppLoading: React.FC = () => {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessible
      accessibilityLabel={t('Cargando EcoScan')}
    >
      <Image
        source={require('../assets/logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
        accessible
        accessibilityLabel={t('Logotipo oficial de EcoScan')}
      />
      <Text style={[typography.title2, { color: colors.textPrimary, marginTop: spacing.md }]}>EcoScan</Text>
      <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        {t('Preparando tu jardín…')}
      </Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
});
