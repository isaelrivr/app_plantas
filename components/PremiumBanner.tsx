import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import { usePremium } from '../context/PremiumContext';
import { Button } from './Button';
import { Badge } from './Badge';

interface PremiumBannerProps {
  customTip?: string;
  onUpgradePress?: () => void;
}

export const PremiumBanner: React.FC<PremiumBannerProps> = ({
  customTip,
  onUpgradePress,
}) => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const { isPremium, togglePremium, price } = usePremium();

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      togglePremium();
    }
  };

  if (isPremium) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.premiumGoldLight,
            borderColor: colors.premiumGold,
            borderRadius: layout.borderRadius.lg,
            padding: spacing.md,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Badge
            label={t('Plantae Pro Activo')}
            variant="premium"
            icon={<Ionicons name="sparkles" size={14} color={colors.premiumGold} />}
          />
          <Ionicons name="sunny-outline" size={20} color={colors.premiumGold} />
        </View>

        <Text
          style={[
            typography.headline,
            {
              color: colors.textPrimary,
              marginTop: spacing.xs,
              marginBottom: spacing.xxs,
            },
          ]}
        >
          {t('Consejo personalizado de ubicación y clima')}
        </Text>

        <Text
          style={[
            typography.subheadline,
            {
              color: colors.textSecondary,
              lineHeight: 20,
            },
          ]}
        >
          {customTip ||
            t('En tu zona geográfica actual (clima templado), mantén esta planta lejos de radiadores en invierno y aumenta el riego si la temperatura supera los 26°C.')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.lockedContainer,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: layout.borderRadius.lg,
          padding: spacing.md,
        },
      ]}
    >
      <View style={styles.lockHeader}>
        <View
          style={[
            styles.lockCircle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            style={[
              typography.headline,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            {t('Consejos de Clima y Ubicación')}
          </Text>
          <Text
            style={[
              typography.footnote,
              {
                color: colors.textSecondary,
                marginTop: 2,
              },
            ]}
          >
            {t('Disponible exclusivamente para miembros Pro')}
          </Text>
        </View>
      </View>

      <Text
        style={[
          typography.callout,
          {
            color: colors.textTertiary,
            marginVertical: spacing.sm,
            fontStyle: 'italic',
          },
        ]}
      >
        {t('🔒 «Temperatura óptima calculada en tiempo real según tu código postal, humedad relativa y previsión climática...»')}
      </Text>

      <Button
        title={t('Hazte Premium {price}', { price })}
        onPress={handleUpgrade}
        variant="premium"
        size="md"
        icon={<Ionicons name="sparkles" size={18} color="#1C1C1E" />}
        accessibilityLabel={t('Hazte Premium por {price}', { price })}
        accessibilityHint={t('Desbloquea recomendaciones inteligentes de clima y ubicación para tus plantas')}
        style={{ marginTop: spacing.xs }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    marginVertical: 12,
  },
  lockedContainer: {
    borderWidth: 1,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
