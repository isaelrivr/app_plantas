import React, { createContext, useContext, RefObject } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView, BlurTargetView, BlurViewProps } from 'expo-blur';
import { useAppTheme } from '../theme';

export const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

export const useBlurTarget = (): RefObject<View | null> | undefined => {
  const target = useContext(BlurTargetContext);
  return target ?? undefined;
};

export { BlurTargetView };

export interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: BlurViewProps['tint'];
  borderRadius?: number;
  elevated?: boolean;
  borderWidth?: number;
  blurTarget?: RefObject<View | null>;
  tintOverlayColor?: string;
}

/**
 * Superficie flotante con efecto glassmórfico.
 * Cumple con las reglas técnicas:
 * - blurMethod="dimezisBlurViewSdk31Plus" en Android con blurTarget
 * - Capa de tinte protectora para asegurar contraste WCAG AA en todo texto/ícono
 * - Fallback semitransparente más opaco para Android viejo y dispositivos lentos
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 60,
  tint,
  borderRadius = 24,
  elevated = true,
  borderWidth = 1,
  blurTarget,
  tintOverlayColor,
}) => {
  const { isDark } = useAppTheme();
  const contextTarget = useBlurTarget();
  const resolvedBlurTarget = blurTarget ?? contextTarget ?? undefined;

  const resolvedTint = tint ?? (isDark ? 'dark' : 'light');
  // Fallback semitransparente más opaco para Android < 31 o hardware sin soporte
  const fallbackBg = isDark ? 'rgba(20, 26, 22, 0.90)' : 'rgba(255, 255, 255, 0.90)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.65)';
  const defaultTintOverlay = isDark ? 'rgba(16, 22, 18, 0.35)' : 'rgba(255, 255, 255, 0.35)';

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
        blurMethod="dimezisBlurViewSdk31Plus"
        blurTarget={resolvedBlurTarget}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      {/* Capa de tinte para garantizar contraste WCAG AA detrás del contenido */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: tintOverlayColor || defaultTintOverlay,
            borderRadius,
          },
        ]}
        pointerEvents="none"
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
