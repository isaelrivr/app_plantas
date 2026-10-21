import React, { RefObject } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform, ViewProps } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { useGlass } from '../theme';
import { useBlurTarget } from './GlassBackground';

export interface GlassSurfaceProps extends ViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Variante de opacidad del vidrio: 'standard' (70% fill) o 'strong' (88% fill para modales/prominente) */
  variant?: 'standard' | 'strong';
  /** Intensidad del desenfoque (por defecto layout.glass.intensity = 45) */
  intensity?: number;
  /** Tinte del desenfoque ('light', 'dark', 'default', etc.) */
  tint?: BlurTint;
  /** Radio de curvatura (por defecto layout.borderRadius.lg = 24) */
  borderRadius?: number;
  /** Si la superficie tiene sombra elevada */
  elevated?: boolean;
  /** Ancho del borde (por defecto 1px) */
  borderWidth?: number;
  /** Color personalizado del borde (por defecto colors.glassBorder blanco 20-30%) */
  borderColor?: string;
  /** Ref directa al BlurTarget (si no se usa a través de GlassBackground) */
  blurTarget?: RefObject<View | null>;
  /** Color de tinte overlay para WCAG AA sobre el blur */
  tintOverlayColor?: string;
  /** Forzar fallback opaco sin montar BlurView (útil en listas largas o animaciones) */
  forceFallback?: boolean;
  /** Espaciado interno de la superficie */
  padding?: number;
}

/**
 * Superficie flotante con efecto glassmórfico refinado.
 *
 * Cumple con todas las directrices técnicas y de accesibilidad:
 * - Decisión automática blur vs fallback mediante `useGlass()`
 * - blurMethod="dimezisBlurViewSdk31Plus" en Android con blurTarget
 * - Capa de tinte protectora para asegurar contraste WCAG AA en todo texto/ícono
 * - Fallback semitransparente más opaco para Android viejo (< 31), modo fácil o dispositivos lentos
 * - Borde sutil blanco de 1px (20-30% opacidad)
 */
export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  style,
  variant = 'standard',
  intensity,
  tint,
  borderRadius,
  elevated = true,
  borderWidth,
  borderColor,
  blurTarget,
  tintOverlayColor,
  forceFallback,
  padding,
  ...rest
}) => {
  const glass = useGlass({ intensity, tint, forceFallback });
  const contextTarget = useBlurTarget();
  const resolvedBlurTarget = blurTarget ?? contextTarget ?? undefined;

  const resolvedRadius = borderRadius ?? glass.borderRadius;
  const resolvedBorderWidth = borderWidth ?? glass.borderWidth;
  const resolvedBorderColor = borderColor ?? glass.borderColor;

  // Fill translúcido según variante (standard vs strong) o fallback opaco
  const resolvedFill = variant === 'strong' ? glass.fillStrongColor : glass.fillColor;
  const backgroundColor = glass.canUseBlur ? resolvedFill : glass.fallbackColor;

  const defaultTintOverlay = glass.isDark
    ? 'rgba(16, 22, 18, 0.35)'
    : 'rgba(255, 255, 255, 0.35)';

  return (
    <View
      {...rest}
      style={[
        styles.outerContainer,
        {
          borderRadius: resolvedRadius,
          borderColor: resolvedBorderColor,
          borderWidth: resolvedBorderWidth,
          backgroundColor,
          padding,
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
    position: 'relative',
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
        elevation: 8,
      },
      default: {},
    }),
  },
});
