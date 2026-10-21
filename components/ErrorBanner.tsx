import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  style?: object;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, style }) => {
  const { colors, typography, spacing } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.errorLight,
          borderColor: colors.error,
          padding: spacing.md,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${t('Error')}: ${message}`}
    >
      <View style={styles.contentRow}>
        <Ionicons name="alert-circle" size={24} color={colors.error} />
        <Text
          style={[
            typography.subheadline,
            {
              color: colors.textPrimary,
              flex: 1,
              marginLeft: spacing.sm,
            },
          ]}
        >
          {message}
        </Text>
      </View>

      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            {
              backgroundColor: colors.error,
              marginTop: spacing.sm,
              minHeight: 48,
              overflow: 'hidden',
              opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
            },
          ]}
          android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
          accessibilityRole="button"
          accessibilityLabel={t('Reintentar operación')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={[typography.subheadline, { color: '#FFFFFF', fontWeight: '600', marginLeft: 6 }]}>
            {t('Reintentar')}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44, // HIG 44x44
  },
});
