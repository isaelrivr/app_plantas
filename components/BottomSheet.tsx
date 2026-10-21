import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  Pressable,
  View,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  maxHeightRatio?: number;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  showCloseButton = true,
  maxHeightRatio = 0.88,
}) => {
  const { colors, typography, spacing, motion, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [translateY] = useState(() => new Animated.Value(400));
  const [backdropOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      if (motion.isReduced) {
        translateY.setValue(0);
        backdropOpacity.setValue(1);
      } else {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            damping: 22,
            stiffness: 220,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      if (motion.isReduced) {
        translateY.setValue(400);
        backdropOpacity.setValue(0);
      } else {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 400,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [visible, motion.isReduced, translateY, backdropOpacity]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView
            intensity={Platform.OS === 'android' ? 25 : 30}
            tint={isDark ? 'dark' : 'systemMaterialDark'}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('Cerrar')}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              paddingBottom: Math.max(insets.bottom, 16),
              maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
              transform: [{ translateY }],
            },
          ]}
          accessibilityRole="none"
        >
          {/* Barra superior de arrastre */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Cabecera con título y botón de cerrar */}
          {title ? (
            <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {showCloseButton ? (
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    {
                      opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1,
                    },
                  ]}
                  android_ripple={{
                    color: colors.border,
                    borderless: true,
                    radius: 22,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('Cerrar')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={26} color={colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.xs }}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
