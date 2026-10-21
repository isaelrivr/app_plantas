import { Platform } from 'react-native';
import type { BlurTint } from 'expo-blur';
import { useAppTheme } from './useTheme';
import { layout } from './spacing';

export interface UseGlassOptions {
  /** Intensidad personalizada del desenfoque (por defecto layout.glass.intensity) */
  intensity?: number;
  /** Tinte del desenfoque (light, dark, default, regular, etc.) */
  tint?: BlurTint;
  /** Forzar el fallback sólido/semitransparente sin montar BlurView */
  forceFallback?: boolean;
}

export interface GlassResult {
  /** Si el dispositivo, versión de SO y configuración permiten desenfoque real por hardware */
  canUseBlur: boolean;
  /** Intensidad numérica recomendada para BlurView */
  intensity: number;
  /** Método de desenfoque nativo optimizado para Android 12+ (SDK 31+) */
  blurMethod: 'dimezisBlurViewSdk31Plus';
  /** Tinte resuelto para BlurView */
  tint: BlurTint;
  /** Color de relleno translúcido estándar para superficies flotantes */
  fillColor: string;
  /** Color de relleno translúcido fuerte para modales o tarjetas prominentes */
  fillStrongColor: string;
  /** Borde blanco sutil 1px (20-30% opacidad) */
  borderColor: string;
  /** Ancho de borde estándar (1px) */
  borderWidth: number;
  /** Color de fallback opaco / semitransparente para Android < 31 o modo ahorro/fácil */
  fallbackColor: string;
  /** Gradiente de fondo del tema actual */
  backgroundGradient: readonly [string, string];
  /** Radio de curvatura estándar para superficies flotantes (24dp) */
  borderRadius: number;
  /** Indicador de tema oscuro activo */
  isDark: boolean;
  /** Indicador de modo fácil activo */
  easyMode: boolean;
}

/**
 * Hook centralizado para superficies con glassmorfismo en EcoScan.
 *
 * Decide de forma determinista si se debe activar el desenfoque en tiempo real
 * por GPU (`canUseBlur: true`) o recurrir al fallback de alto rendimiento (`canUseBlur: false`):
 *
 * 1. Android: Requiere SDK >= 31 (Android 12+) para soporte de RenderEffect nativo.
 *    En versiones anteriores o hardware lento, recurre a colores sólidos/opacos.
 * 2. Accesibilidad: Si el usuario tiene "Reducir movimiento" activo o el "Modo Fácil",
 *    desactiva el desenfoque para garantizar contraste sólido y evitar fatiga visual.
 * 3. Provee tokens exactos de color (fill, border, fallback) según el tema (claro/oscuro).
 */
export function useGlass(options?: UseGlassOptions): GlassResult {
  const { isDark, easyMode, colors, motion } = useAppTheme();

  // Detección segura de versión de Android SDK
  const androidVersion =
    Platform.OS === 'android'
      ? typeof Platform.Version === 'number'
        ? Platform.Version
        : parseInt(String(Platform.Version), 10) || 0
      : 0;

  const isAndroidSdk31Plus = Platform.OS === 'android' && androidVersion >= 31;
  const isIOS = Platform.OS === 'ios';

  // Si reducir movimiento está activo (del sistema o por Modo Fácil)
  const isMotionReduced = Boolean(motion.isReduced || easyMode);

  // Decisión final: desenfoque real por hardware vs fallback
  const canUseBlur =
    !options?.forceFallback &&
    !isMotionReduced &&
    (isIOS || isAndroidSdk31Plus);

  const intensity = options?.intensity ?? layout.glass.intensity;

  // Resolver tinte
  let resolvedTint: BlurTint = 'default';
  if (options?.tint) {
    resolvedTint = options.tint;
  } else if (layout.glass.tint !== 'default') {
    resolvedTint = layout.glass.tint;
  } else {
    resolvedTint = isDark ? 'dark' : 'light';
  }

  return {
    canUseBlur,
    intensity,
    blurMethod: 'dimezisBlurViewSdk31Plus',
    tint: resolvedTint,
    fillColor: colors.glassFill,
    fillStrongColor: colors.glassFillStrong,
    borderColor: colors.glassBorder,
    borderWidth: layout.glass.borderWidth,
    fallbackColor: colors.glassFallback,
    backgroundGradient: colors.backgroundGradient,
    borderRadius: layout.borderRadius.lg,
    isDark,
    easyMode,
  };
}
