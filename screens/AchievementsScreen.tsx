import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme';
import { Card } from '../components/Card';
import { AchievementCard } from '../components/AchievementCard';
import { SkeletonBox } from '../components/SkeletonLoader';
import { useGarden } from '../context/GardenContext';
import { getAchievements, getWeeklySummary, streakTier } from '../services/gamificationService';

export const AchievementsScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { stats } = useGarden();

  const [loading, setLoading] = useState(true);
  const [flameScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameScale, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(flameScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flameScale]);

  const achievements = getAchievements(stats);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const summary = getWeeklySummary(stats);
  const tier = streakTier(stats.currentStreak);

  const gradeColor =
    summary.grade === 'S' ? colors.premiumGold : summary.grade === 'A' ? colors.primary : colors.accent;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: Platform.OS === 'ios' ? 12 : 16 },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>Atrás</Text>
        </TouchableOpacity>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>Logros</Text>
        <View style={styles.actionHeaderBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}>
        {loading ? (
          <>
            <SkeletonBox width="100%" height={140} borderRadius={18} />
            <SkeletonBox width="100%" height={160} borderRadius={18} style={{ marginTop: spacing.md }} />
          </>
        ) : (
          <>
            {/* RACHA */}
            <Card
              elevated
              style={[styles.streakCard, { borderColor: tier.color + '66' }]}
            >
              <Animated.View style={{ transform: [{ scale: flameScale }] }}>
                <Ionicons name="flame" size={44} color={tier.color} />
              </Animated.View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.title2, { color: colors.textPrimary }]}>
                  {stats.currentStreak} {stats.currentStreak === 1 ? 'día' : 'días'} de racha
                </Text>
                <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                  Nivel {tier.label} · mejor racha: {stats.longestStreak} días
                </Text>
                <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 6 }]}>
                  Riega una planta hoy para mantener tu racha 🔥
                </Text>
              </View>
            </Card>

            {/* RESUMEN SEMANAL */}
            <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
              Tu semana
            </Text>
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={styles.summaryTop}>
                <View style={[styles.gradeCircle, { backgroundColor: gradeColor + '22', borderColor: gradeColor }]}>
                  <Text style={[typography.title2, { color: gradeColor, fontWeight: '800' }]}>{summary.grade}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>{summary.title}</Text>
                  <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                    {summary.message}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Ionicons name="water" size={18} color={colors.info} />
                  <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 4 }]}>{summary.waterings}</Text>
                  <Text style={[typography.caption2, { color: colors.textTertiary }]}>riegos</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Ionicons name="checkmark-done" size={18} color={colors.primary} />
                  <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 4 }]}>{summary.tasksCompleted}</Text>
                  <Text style={[typography.caption2, { color: colors.textTertiary }]}>tareas</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Ionicons name="leaf" size={18} color={colors.primary} />
                  <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 4 }]}>{stats.totalPlants}</Text>
                  <Text style={[typography.caption2, { color: colors.textTertiary }]}>plantas</Text>
                </View>
              </View>
            </Card>

            {/* LOGROS */}
            <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              Logros ({unlockedCount}/{achievements.length})
            </Text>
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} style={{ marginBottom: spacing.sm }} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  actionHeaderBtn: { width: 60 },
  streakCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5 },
  summaryTop: { flexDirection: 'row', alignItems: 'center' },
  gradeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-around',
  },
  summaryStat: { alignItems: 'center' },
});
