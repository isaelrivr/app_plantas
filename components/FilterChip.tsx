import React from 'react';
import { Text, StyleSheet, Pressable, StyleProp, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/** Chip seleccionable para filtros de la enciclopedia (punto 12). */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  style,
}) => {
  const { colors, layout, typography } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      android_ripple={{ color: selected ? 'rgba(255,255,255,0.3)' : colors.primary + '20' }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderRadius: layout.borderRadius.full,
          overflow: 'hidden',
          opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? '#FFFFFF' : colors.textSecondary}
          style={{ marginRight: 4 }}
        />
      ) : null}
      <Text
        style={[
          typography.subheadline,
          { color: selected ? '#FFFFFF' : colors.textPrimary, fontWeight: '600' },
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
    borderWidth: 1,
  },
});
