import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';
import { useAppTheme } from '../theme';

export interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: BlurViewProps['tint'];
  borderRadius?: number;
  elevated?: boolean;
  borderWidth?: number;
}

/**
 * Superficie flotante con efecto glassmórfico (BlurView + borde translúcido + elevación sutil).
 * Usada exclusivamente en superficies flotantes (tab bar flotante, barras de acción, modales, toasts).
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 60,
  tint,
  borderRadius = 24,
  elevated = true,
  borderWidth = 1,
}) => {
  const { isDark } = useAppTheme();

  const resolvedTint = tint ?? (isDark ? 'dark' : 'light');
  const fallbackBg = isDark ? 'rgba(22, 30, 26, 0.82)' : 'rgba(255, 255, 255, 0.82)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.65)';

  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderRadius,
          borderColor,
          borderWidth,
          backgroundColor: fallbackBg,
        },
        elevated && styles.shadow,
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={resolvedTint}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: 'hidden',
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
});
