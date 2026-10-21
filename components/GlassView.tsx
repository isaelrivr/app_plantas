import React, { createContext, useContext, RefObject } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView, BlurTargetView, BlurViewProps } from 'expo-blur';
import { useGlass } from '../theme';

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
  forceFallback?: boolean;
}

/**
 * Superficie flotante con efecto glassmórfico.
 * Cumple con las reglas técnicas:
 * - Decisión automática blur real vs fallback mediante `useGlass()`
 * - blurMethod="dimezisBlurViewSdk31Plus" en Android con blurTarget
 * - Capa de tinte protectora para asegurar contraste WCAG AA en todo texto/ícono
 * - Fallback semitransparente más opaco para Android viejo y dispositivos lentos
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity,
  tint,
  borderRadius,
  elevated = true,
  borderWidth,
  blurTarget,
  tintOverlayColor,
  forceFallback,
}) => {
  const glass = useGlass({ intensity, tint, forceFallback });
  const contextTarget = useBlurTarget();
  const resolvedBlurTarget = blurTarget ?? contextTarget ?? undefined;

  const resolvedRadius = borderRadius ?? glass.borderRadius;
  const resolvedBorderWidth = borderWidth ?? glass.borderWidth;
  const resolvedBorderColor = glass.borderColor;

  // Fallback opaco si no hay soporte de blur o modo accesible/fácil
  const backgroundColor = glass.canUseBlur ? glass.fillColor : glass.fallbackColor;
  const defaultTintOverlay = glass.isDark ? 'rgba(16, 22, 18, 0.35)' : 'rgba(255, 255, 255, 0.35)';

  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderRadius: resolvedRadius,
          borderColor: resolvedBorderColor,
          borderWidth: resolvedBorderWidth,
          backgroundColor,
        },
        elevated && styles.shadow,
        style,
      ]}
    >
      {glass.canUseBlur && (
        <BlurView
          intensity={glass.intensity}
          tint={glass.tint}
          blurMethod={glass.blurMethod}
          blurTarget={resolvedBlurTarget}
          style={[StyleSheet.absoluteFill, { borderRadius: resolvedRadius }]}
        />
      )}
      {/* Capa de tinte para garantizar contraste WCAG AA detrás del contenido */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: tintOverlayColor || defaultTintOverlay,
            borderRadius: resolvedRadius,
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
