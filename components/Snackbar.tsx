import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, Pressable, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from './GlassSurface';
import { useAppTheme, fontWeights } from '../theme';
import { announce } from '../services/accessibilityService';

export interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  type = 'success',
  actionLabel,
  onAction,
  onDismiss,
  durationMs = 5000,
}) => {
  const { typography, motion, layout, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(20));

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
      ? '#66BB6A'
      : type === 'error'
      ? '#EF5350'
      : type === 'warning'
      ? '#FFA726'
      : '#42A5F5';

  const bottomPosition = Math.max(insets.bottom + 16, 96);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomPosition,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <GlassSurface
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
          <Text style={[typography.body, styles.message, { color: '#FFFFFF' }]} numberOfLines={2}>
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
                color: 'rgba(255, 255, 255, 0.2)',
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
                  { color: '#81C784', fontWeight: fontWeights.bold },
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
