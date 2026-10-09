import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import { PremiumFeature, FEATURE_LABELS } from '../hooks/usePlanLimits';

interface LockedPreviewProps {
  locked: boolean;
  feature?: PremiumFeature;
  onUnlock: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Etiqueta corta que aparece junto al candado */
  label?: string;
}

/**
 * Envuelve contenido Premium. Si `locked`, muestra el contenido atenuado
 * (preview) con un candado y un botón para abrir el paywall (punto 16).
 */
export const LockedPreview: React.FC<LockedPreviewProps> = ({
  locked,
  feature,
  onUnlock,
  children,
  style,
  label,
}) => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const meta = feature ? FEATURE_LABELS[feature] : undefined;
  const title = label ?? meta?.title ?? t('Función Premium');

  return (
    <View style={style}>
      <View pointerEvents={locked ? 'none' : 'auto'}>{children}</View>

      {locked ? (
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: colors.surface + 'CC',
              borderRadius: layout.borderRadius.lg,
              padding: spacing.lg,
            },
          ]}
          accessible
          accessibilityLabel={t('{title} bloqueado. Requiere Plantae Pro.', { title })}
        >
          <View
            style={[
              styles.lockCircle,
              { backgroundColor: colors.premiumGoldLight, borderRadius: layout.borderRadius.full },
            ]}
          >
            <Ionicons name="lock-closed" size={22} color={colors.premiumGold} />
          </View>
          <Text
            style={[typography.headline, { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm }]}
          >
            {title}
          </Text>
          {meta?.description ? (
            <Text
              style={[
                typography.footnote,
                { color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
              ]}
            >
              {meta.description}
            </Text>
          ) : null}
          <TouchableOpacity
            onPress={onUnlock}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('Desbloquear con Plantae Pro')}
            style={[
              styles.cta,
              {
                backgroundColor: colors.premiumGold,
                borderRadius: layout.borderRadius.md,
                paddingHorizontal: spacing.lg,
                marginTop: spacing.md,
              },
            ]}
          >
            <Ionicons name="sparkles" size={16} color="#1C1C1E" />
            <Text style={[styles.ctaText, { color: '#1C1C1E', marginLeft: spacing.xs }]}>
              {t('Desbloquear con Pro')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
