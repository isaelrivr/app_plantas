import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, fontWeights } from '../theme';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * ErrorBanner M3: Tarjeta tonal de error accesible (errorContainer / onErrorContainer)
 * con icono vectorial y opción de reintento.
 */
export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  retryLabel = 'Reintentar',
  style,
}) => {
  const { colors, typography, layout, spacing } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.errorContainer,
          borderRadius: layout.borderRadius.md,
          borderColor: colors.error,
          padding: spacing.md,
        },
        style,
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.contentRow}>
        <Ionicons
          name="alert-circle"
          size={22}
          color={colors.error}
          style={{ marginRight: spacing.sm }}
        />
        <Text
          style={[
            typography.body,
            styles.message,
            { color: colors.onErrorContainer, fontWeight: fontWeights.medium },
          ]}
        >
          {message}
        </Text>
      </View>

      {onRetry ? (
        <Pressable
          onPress={onRetry}
          android_ripple={{ color: colors.error + '20', borderless: false }}
          style={({ pressed }) => [
            styles.retryButton,
            {
              backgroundColor: colors.error,
              borderRadius: layout.borderRadius.full,
              minHeight: Math.max(layout.minTouchTarget, 48),
              marginTop: spacing.sm,
            },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text
            style={[
              typography.subheadline,
              { color: colors.onError, fontWeight: fontWeights.bold },
            ]}
          >
            {retryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    flex: 1,
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
