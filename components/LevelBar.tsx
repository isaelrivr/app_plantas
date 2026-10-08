import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

interface LevelBarProps {
  label: string;
  level: number; // 1 a 5
  maxLevel?: number;
  iconName: keyof typeof Ionicons.glyphMap;
  valueDescription?: string;
  tintColor?: string;
}

export const LevelBar: React.FC<LevelBarProps> = ({
  label,
  level,
  maxLevel = 5,
  iconName,
  valueDescription,
  tintColor,
}) => {
  const { colors, isDark, typography, spacing } = useAppTheme();
  const activeColor = tintColor || colors.primary;

  const clampedLevel = Math.min(maxLevel, Math.max(0, level));

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`${label}: nivel ${clampedLevel} de ${maxLevel}. ${valueDescription || ''}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surfaceSecondary },
            ]}
          >
            <Ionicons name={iconName} size={15} color={activeColor} />
          </View>
          <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600', marginLeft: spacing.xs }]}>
            {label}
          </Text>
        </View>

        {valueDescription && (
          <Text style={[typography.caption1, { color: colors.textSecondary }]}>
            {valueDescription}
          </Text>
        )}
      </View>

      {/* Segmentos visuales HIG */}
      <View style={styles.segmentsRow}>
        {Array.from({ length: maxLevel }).map((_, idx) => {
          const isActive = idx < clampedLevel;
          return (
            <View
              key={idx}
              style={[
                styles.segment,
                {
                  backgroundColor: isActive
                    ? activeColor
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentsRow: {
    flexDirection: 'row',
    height: 6,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 3,
  },
});
