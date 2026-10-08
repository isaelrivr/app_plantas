import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  style?: object;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, style }) => {
  const { colors, typography, spacing } = useAppTheme();

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
      accessibilityLabel={`Error: ${message}`}
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
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryButton, { backgroundColor: colors.error, marginTop: spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel="Reintentar operación"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={[typography.subheadline, { color: '#FFFFFF', fontWeight: '600', marginLeft: 6 }]}>
            Reintentar
          </Text>
        </TouchableOpacity>
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
