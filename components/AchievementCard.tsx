import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import { Achievement } from '../services/gamificationService';

interface AchievementCardProps {
  achievement: Achievement;
  style?: StyleProp<ViewStyle>;
}

/**
 * Tarjeta de logro con animación de desbloqueo (punto 13).
 * Los logros desbloqueados hacen un pequeño "pop" al renderizarse.
 */
export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, style }) => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const [scale] = useState(() => new Animated.Value(achievement.unlocked ? 0.85 : 1));
  const [glow] = useState(() => new Animated.Value(achievement.unlocked ? 0 : 1));

  useEffect(() => {
    if (achievement.unlocked) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 12,
          stiffness: 180,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.timing(glow, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [achievement.unlocked, scale, glow]);

  const progressRatio = achievement.target > 0 ? achievement.progress / achievement.target : 0;
  const accent = achievement.unlocked ? colors.premiumGold : colors.textTertiary;
  const accentBg = achievement.unlocked ? colors.premiumGoldLight : colors.surfaceSecondary;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: layout.borderRadius.lg,
          padding: spacing.md,
          transform: [{ scale }],
        },
        style,
      ]}
      accessible
      accessibilityLabel={`${achievement.title}. ${
        achievement.unlocked
          ? t('Desbloqueado')
          : t('Progreso {progress} de {target}', {
              progress: achievement.progress,
              target: achievement.target,
            })
      }. ${achievement.description}`}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: accentBg, borderRadius: layout.borderRadius.full },
          ]}
        >
          <Ionicons
            name={achievement.unlocked ? achievement.icon : 'lock-closed'}
            size={22}
            color={accent}
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
            {achievement.title}
          </Text>
          <Text
            style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}
            numberOfLines={2}
          >
            {achievement.description}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.track,
          { backgroundColor: colors.surfaceSecondary, borderRadius: layout.borderRadius.full },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: accent,
              borderRadius: layout.borderRadius.full,
              width: `${Math.round(progressRatio * 100)}%`,
            },
          ]}
        />
      </View>

      <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: spacing.xs }]}>
        {achievement.unlocked
          ? `✓ ${achievement.reward}`
          : `${achievement.progress} / ${achievement.target}`}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    height: 8,
    marginTop: 12,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
  },
});
