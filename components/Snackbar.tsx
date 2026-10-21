import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from './GlassView';
import { useAppTheme } from '../theme';
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
  const { typography, motion, layout } = useAppTheme();
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
            damping: 18,
            stiffness: 180,
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
      <GlassView
        intensity={80}
        tint="dark"
        borderRadius={layout.borderRadius.lg}
        elevated
        style={styles.content}
      >
        <View
          style={styles.innerContent}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Ionicons name={iconName} size={22} color={iconColor} style={styles.icon} />
          <Text style={[typography.body, styles.message, { color: '#FFFFFF' }]} numberOfLines={2}>
            {message}
          </Text>
          {actionLabel && onAction ? (
            <TouchableOpacity
              style={[styles.actionButton, { minHeight: layout.minTouchTarget }]}
              onPress={() => {
                onAction();
                onDismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              activeOpacity={0.7}
            >
              <Text style={[typography.headline, styles.actionText, { color: '#81C784' }]}>
                {actionLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </GlassView>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 16,
  },
  actionButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
