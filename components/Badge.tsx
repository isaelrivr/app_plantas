import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../theme';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'info' | 'premium' | 'neutral' | 'error' | 'primary';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  style,
}) => {
  const { colors, layout, spacing } = useAppTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
      case 'success':
        return { bg: colors.primaryLight, text: colors.primary };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'error':
        return { bg: colors.errorLight, text: colors.error };
      case 'premium':
        return { bg: colors.premiumGoldLight, text: colors.premiumGold };
      case 'info':
        return { bg: colors.surfaceSecondary, text: colors.info };
      case 'neutral':
      default:
        return { bg: colors.surfaceSecondary, text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: layout.borderRadius.full,
          paddingVertical: spacing.xxs + 1,
          paddingHorizontal: spacing.sm,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginRight: 4 }}>{icon}</View> : null}
      <Text
        style={[
          styles.text,
          {
            color: text,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
