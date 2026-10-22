import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, Pressable, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from './GlassSurface';
import { useAppTheme, fontWeights } from '../theme';
import { useFloatingBarMetrics } from '../hooks/useFloatingBarMetrics';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { navigationRef, isCurrentRouteInTabs } from '../navigation/navigationRef';
import { announce } from '../services/accessibilityService';

export interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
  hasTabBar?: boolean;
  bottomPosition?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  type = 'success',
  actionLabel,
  onAction,
  onDismiss,
  durationMs = 5000,
  hasTabBar,
  bottomPosition: customBottomPosition,
}) => {
  const { colors, typography, motion, layout, spacing, isDark } = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(20));
  const { isTabBarVisible } = useTabBarVisibility();
  const [inTabs, setInTabs] = useState<boolean>(() => isCurrentRouteInTabs());

  useEffect(() => {
    if (!navigationRef.isReady()) return;
    const unsubscribe = navigationRef.addListener('state', () => {
      setInTabs(isCurrentRouteInTabs());
    });
    return unsubscribe;
  }, []);

  const activeHasTabBar = hasTabBar ?? (inTabs && isTabBarVisible);
  const { snackbarBottom } = useFloatingBarMetrics({ hasTabBar: activeHasTabBar });
  const finalBottomPosition = customBottomPosition ?? snackbarBottom;

  useEffect(() => {
    if (visible) {
      announce(message);
      if (motion.isReduced) {
        opacity.setValue(1);
        translateY.setValue(0);
      } else {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }

      const timer = setTimeout(() => {
        onDismiss();
      }, durationMs);

      return () => clearTimeout(timer);
    } else {
      if (motion.isReduced) {
        opacity.setValue(0);
      } else {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, message, durationMs, onDismiss, motion.isReduced, opacity, translateY]);

  if (!visible) return null;

  const iconName =
    type === 'success'
      ? 'checkmark-circle'
      : type === 'error'
      ? 'alert-circle'
      : type === 'warning'
      ? 'warning'
      : 'information-circle';

  const iconColor =
    type === 'success'
      ? colors.success
      : type === 'error'
      ? colors.error
      : type === 'warning'
      ? colors.warning
      : colors.info;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: finalBottomPosition,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <GlassSurface
        forceFallback
        variant="strong"
        intensity={60}
        borderRadius={layout.borderRadius.lg}
        elevated
        style={styles.content}
      >
        <View
          style={[styles.innerContent, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Ionicons name={iconName} size={22} color={iconColor} style={styles.icon} />
          <Text style={[typography.body, styles.message, { color: colors.textPrimary }]} numberOfLines={2}>
            {message}
          </Text>
          {actionLabel && onAction ? (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                {
                  minHeight: Math.max(layout.minTouchTarget, 48),
                  minWidth: 48,
                  opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1,
                  borderRadius: layout.borderRadius.full,
                },
              ]}
              android_ripple={{
                color: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)',
                borderless: true,
                radius: 24,
              }}
              onPress={() => {
                onAction();
                onDismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
            >
              <Text
                style={[
                  typography.subheadline,
                  styles.actionText,
                  { color: colors.primary, fontWeight: fontWeights.bold },
                ]}
              >
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </GlassSurface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  content: {
    width: '100%',
  },
  innerContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  actionButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionText: {
    letterSpacing: 0.1,
  },
});
