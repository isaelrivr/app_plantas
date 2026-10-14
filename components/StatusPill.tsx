import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

export type StatusVariant = 'good' | 'warning' | 'water' | 'info' | 'neutral';

export interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
  style,
}) => {
  const { colors, typography, layout, isDark } = useAppTheme();

  const getVariantStyles = (): { bg: string; text: string; defaultIcon: keyof typeof Ionicons.glyphMap } => {
    switch (variant) {
      case 'good':
        return {
          bg: isDark ? 'rgba(76, 175, 80, 0.22)' : '#E8F5E9',
          text: isDark ? '#81C784' : '#1B5E20',
          defaultIcon: 'checkmark-circle',
        };
      case 'warning':
        return {
          bg: isDark ? 'rgba(255, 152, 0, 0.22)' : '#FFF3E0',
          text: isDark ? '#FFB74D' : '#E65100',
          defaultIcon: 'alert-circle',
        };
      case 'water':
        return {
          bg: isDark ? 'rgba(33, 150, 243, 0.22)' : '#E3F2FD',
          text: isDark ? '#64B5F6' : '#0D47A1',
          defaultIcon: 'water',
        };
      case 'info':
        return {
          bg: isDark ? 'rgba(100, 181, 246, 0.18)' : '#EDE7F6',
          text: isDark ? '#90CAF9' : '#311B92',
          defaultIcon: 'information-circle',
        };
      case 'neutral':
      default:
        return {
          bg: colors.surfaceSecondary,
          text: colors.textSecondary,
          defaultIcon: 'ellipse',
        };
    }
  };

  const { bg, text, defaultIcon } = getVariantStyles();
  const iconName = icon || defaultIcon;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderRadius: layout.borderRadius.full,
          paddingVertical: isSmall ? 4 : 6,
          paddingHorizontal: isSmall ? 8 : 12,
        },
        style,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Ionicons
        name={iconName}
        size={isSmall ? 13 : 15}
        color={text}
        style={{ marginRight: 5 }}
      />
      <Text
        style={[
          isSmall ? typography.caption1 : typography.footnote,
          { color: text, fontWeight: '700' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
