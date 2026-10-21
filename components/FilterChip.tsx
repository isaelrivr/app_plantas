import React from 'react';
import { Text, StyleSheet, Pressable, StyleProp, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, fontWeights } from '../theme';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/** Chip seleccionable con área táctil mínima de 48dp y feedback háptico/ripple. */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  style,
}) => {
  const { colors, layout, typography, spacing } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      android_ripple={{
        color: selected ? 'rgba(255, 255, 255, 0.28)' : colors.primary + '18',
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          minHeight: Math.max(layout.minTouchTarget, 48),
          backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
          borderColor: selected ? colors.primary : colors.borderLight,
          borderRadius: layout.borderRadius.full,
          paddingHorizontal: spacing.md,
          overflow: 'hidden',
          opacity: pressed && Platform.OS === 'ios' ? 0.78 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? '#FFFFFF' : colors.textSecondary}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text
        style={[
          typography.subheadline,
          {
            color: selected ? '#FFFFFF' : colors.textPrimary,
            fontWeight: selected ? fontWeights.medium : fontWeights.regular,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
});
