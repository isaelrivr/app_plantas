import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { announce } from '../services/accessibilityService';
import { useTranslation } from '../i18n';
import { Achievement } from '../services/gamificationService';

export interface AchievementCelebrationModalProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementCelebrationModal: React.FC<AchievementCelebrationModalProps> = ({
  achievement,
  onDismiss,
}) => {
  const { colors, layout, spacing, typography, isDark } = useAppTheme();
  const { t } = useTranslation();

  const [scaleAnim] = useState(() => new Animated.Value(0.7));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (achievement) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      announce(
        t('¡Enhorabuena! Has desbloqueado el logro: {titulo}. {descripcion}', {
          titulo: achievement.title,
          descripcion: achievement.description,
        })
      );

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [achievement, opacityAnim, scaleAnim, t]);

  if (!achievement) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={Boolean(achievement)}
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surface,
              borderColor: colors.premiumGold,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              borderRadius: layout.borderRadius.xl,
            },
          ]}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={t('¡Nuevo logro desbloqueado! {titulo}', { titulo: achievement.title })}
        >
          {/* MEDALLA ICONO */}
          <View style={[styles.badgeCircle, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.2)' : '#FFF9C4' }]}>
            <Ionicons name={achievement.icon} size={48} color={colors.premiumGold} />
          </View>

          <Text style={[typography.caption1, { color: colors.premiumGold, fontWeight: '800', letterSpacing: 1 }]}>
            {t('¡NUEVO LOGRO DESBLOQUEADO!')}
          </Text>

          <Text style={[typography.title1, { color: colors.textPrimary, fontWeight: '800', marginTop: spacing.xs, textAlign: 'center' }]}>
            {achievement.title}
          </Text>

          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 22 }]}>
            {achievement.description}
          </Text>

          {/* RECOMPENSA */}
          <View style={[styles.rewardChip, { backgroundColor: colors.primaryLight, borderRadius: layout.borderRadius.full, marginTop: spacing.md }]}>
            <Ionicons name="sparkles" size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
            <Text style={[typography.footnote, { color: colors.primaryDark, fontWeight: '700' }]}>
              {achievement.reward}
            </Text>
          </View>

          {/* BOTÓN GENIAL */}
          <Pressable
            onPress={onDismiss}
            android_ripple={{ color: colors.primaryDark }}
            style={({ pressed }) => [
              styles.dismissBtn,
              {
                backgroundColor: colors.primary,
                minHeight: Math.max(layout.minTouchTarget, 48),
                borderRadius: layout.borderRadius.md,
                marginTop: spacing.xl,
                overflow: 'hidden',
              },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('Cerrar celebración de logro')}
          >
            <Text style={[typography.headline, { color: '#FFFFFF', fontWeight: '700' }]}>
              {t('¡Genial!')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  badgeCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dismissBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
