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
        return { bg: colors.primaryLight, text: colors.primaryDark };
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
          paddingVertical: spacing.xxs + 2,
          paddingHorizontal: spacing.sm,
          minHeight: 28,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
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
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
});
