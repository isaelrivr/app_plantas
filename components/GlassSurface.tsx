import React, { RefObject } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform, ViewProps } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { useGlass } from '../theme';
import { useBlurTarget } from './GlassBackground';

export interface GlassSurfaceProps extends ViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Variante de opacidad del vidrio: 'standard' o 'strong' */
  variant?: 'standard' | 'strong';
  /**
   * Tono del vidrio:
   * - 'default': Adaptable al tema (claro/oscuro) con desenfoque de fondo.
   * - 'overlay' | 'scrim': Siempre oscuro rgba(0, 0, 0, 0.55) con borde blanco 20%, sin BlurView (para cámara o fotos).
   */
  tone?: 'default' | 'overlay' | 'scrim';
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
 * Superficie flotante con efecto glassmórfico refinado y arquitectura limpia.
 *
 * Directrices técnicas y de accesibilidad para Android SDK 31+ e iOS:
 * - Decisión automática blur vs fallback mediante `useGlass()`
 * - En Android con dimezisBlurViewSdk31Plus, requiere blurTarget válido como hermano
 * - Si no hay blurTarget disponible en Android, activa fallback opaco sin montar BlurView
 * - UNA sola capa de tinte (eliminada la acumulación de 3 capas superpuestas)
 * - blurReductionFactor={4} en Android para calibrar la difusión idéntica a iOS
 * - Fallback opaco sólido para Android < 12 (SDK < 31), Modo Fácil y Reducir Movimiento
 * - Variante overlay/scrim (siempre oscura sin BlurView para cámara/foto)
 */
export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  style,
  variant = 'standard',
  tone = 'default',
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

  const isOverlay = tone === 'overlay' || tone === 'scrim';

  // En Android SDK 31+ dimezis requiere un target para muestrear. Si no existe, usamos fallback seguro
  const hasValidTarget = Platform.OS === 'ios' || Boolean(resolvedBlurTarget);
  const canMountBlur = !isOverlay && glass.canUseBlur && !forceFallback && hasValidTarget;

  const resolvedRadius = borderRadius ?? glass.borderRadius;
  const resolvedBorderWidth = borderWidth ?? glass.borderWidth;
  const resolvedBorderColor =
    borderColor ?? (isOverlay ? 'rgba(255, 255, 255, 0.20)' : glass.borderColor);

  // UNA sola capa de color base:
  // - Si es overlay (cámara/foto): fondo oscuro rgba(0, 0, 0, 0.55)
  // - Si monta BlurView: fondo transparente (para no apilar tintes opacos bajo el desenfoque)
  // - Si es fallback (Android < 12, sin target o ahorro): fallbackColor opaco del tema
  const backgroundColor = isOverlay
    ? 'rgba(0, 0, 0, 0.55)'
    : canMountBlur
    ? 'transparent'
    : glass.fallbackColor;

  const defaultTintOverlay = glass.isDark
    ? 'rgba(16, 22, 18, 0.35)'
    : 'rgba(255, 255, 255, 0.35)';

  // Una sola capa de tinte sobre el desenfoque (o transparente si es fallback/overlay)
  const resolvedTintOverlay = isOverlay
    ? (tintOverlayColor || 'transparent')
    : canMountBlur
    ? (tintOverlayColor || defaultTintOverlay)
    : 'transparent';

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
      {canMountBlur && (
        <BlurView
          intensity={glass.intensity}
          tint={glass.tint}
          blurMethod={glass.blurMethod}
          blurTarget={resolvedBlurTarget}
          blurReductionFactor={Platform.OS === 'android' ? 4 : undefined}
          style={[StyleSheet.absoluteFill, { borderRadius: resolvedRadius }]}
        />
      )}
      {/* Capa única de tinte para garantizar contraste WCAG AA sobre el blur */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: resolvedTintOverlay,
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
