import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';

export interface SegmentOption<T extends string = string> {
  key: T;
  label: string;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  selectedKey: T;
  onSelect: (key: T) => void;
  style?: ViewStyle;
}

export const SegmentedControl = <T extends string>({
  options,
  selectedKey,
  onSelect,
  style,
}: SegmentedControlProps<T>): React.ReactElement => {
  const { colors, typography, layout } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: layout.borderRadius.md,
          padding: 4,
        },
        style,
      ]}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const isSelected = option.key === selectedKey;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => {
              if (!isSelected) {
                try {
                  Haptics.selectionAsync();
                } catch {}
                onSelect(option.key);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            style={[
              styles.segment,
              {
                borderRadius: layout.borderRadius.sm,
                backgroundColor: isSelected ? colors.surface : 'transparent',
                shadowColor: isSelected ? '#000' : 'transparent',
                shadowOpacity: isSelected ? 0.08 : 0,
                shadowOffset: { width: 0, height: 1 },
                shadowRadius: 2,
                elevation: isSelected ? 2 : 0,
                minHeight: Math.max(layout.minTouchTarget - 8, 40),
              },
            ]}
          >
            <Text
              style={[
                typography.subheadline,
                {
                  color: isSelected ? colors.primary : colors.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
            {option.badge != null ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption2,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {option.badge}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
