import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';
import { Button } from './Button';

export interface PrimaryActionBarProps {
  primaryTitle: string;
  onPrimaryPress: () => void;
  primaryIcon?: React.ReactNode;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  primaryVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium';
  secondaryTitle?: string;
  onSecondaryPress?: () => void;
  style?: ViewStyle;
}

export const PrimaryActionBar: React.FC<PrimaryActionBarProps> = ({
  primaryTitle,
  onPrimaryPress,
  primaryIcon,
  primaryLoading = false,
  primaryDisabled = false,
  primaryVariant = 'primary',
  secondaryTitle,
  onSecondaryPress,
  style,
}) => {
  const { colors, typography, layout, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
    >
      <Button
        title={primaryTitle}
        onPress={onPrimaryPress}
        icon={primaryIcon}
        loading={primaryLoading}
        disabled={primaryDisabled}
        variant={primaryVariant}
        size="lg"
        style={styles.primaryButton}
      />

      {secondaryTitle && onSecondaryPress ? (
        <TouchableOpacity
          onPress={onSecondaryPress}
          style={[styles.secondaryButton, { minHeight: layout.minTouchTarget }]}
          accessibilityRole="button"
          accessibilityLabel={secondaryTitle}
          hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
        >
          <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '600' }]}>
            {secondaryTitle}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
