import { Platform } from 'react-native';
import type { BlurTint } from 'expo-blur';
import { useAppTheme } from './useTheme';
import { layout } from './spacing';

export interface UseGlassOptions {
  /** Intensidad personalizada del desenfoque */
  intensity?: number;
  /** Tinte del desenfoque */
  tint?: BlurTint;
  /** Forzar el fallback sólido sin montar BlurView */
  forceFallback?: boolean;
}

export interface GlassResult {
  /** Siempre false en la arquitectura M3: elimina el uso de GPU de BlurView */
  canUseBlur: boolean;
  /** Intensidad 0 para evitar cómputo de desenfoque */
  intensity: number;
  /** Método de desenfoque nativo optimizado */
  blurMethod: 'dimezisBlurViewSdk31Plus';
  /** Tinte resuelto */
  tint: BlurTint;
  /** Color de relleno tonal M3 */
  fillColor: string;
  /** Color de relleno tonal fuerte M3 */
  fillStrongColor: string;
  /** Borde sutil M3 outlineVariant */
  borderColor: string;
  /** Ancho de borde estándar */
  borderWidth: number;
  /** Color de fallback tonal de alto rendimiento */
  fallbackColor: string;
  /** Gradiente de fondo del tema actual */
  backgroundGradient: readonly [string, string];
  /** Radio de curvatura estándar M3 */
  borderRadius: number;
  /** Indicador de tema oscuro activo */
  isDark: boolean;
  /** Indicador de modo fácil activo */
  easyMode: boolean;
}

/**
 * Hook de transición M3: Retira completamente el coste de GPU de BlurView
 * y devuelve superficies tonales limpias y de alto contraste.
 */
export function useGlass(options?: UseGlassOptions): GlassResult {
  const { isDark, easyMode, colors } = useAppTheme();

  // En la arquitectura Material 3, BlurView se apaga al 100% para máxima fluidez a 60-120 FPS
  const canUseBlur = false;
  const intensity = 0;

  let resolvedTint: BlurTint = 'default';
  if (options?.tint) {
    resolvedTint = options.tint;
  } else {
    resolvedTint = isDark ? 'dark' : 'light';
  }

  return {
    canUseBlur,
    intensity,
    blurMethod: 'dimezisBlurViewSdk31Plus',
    tint: resolvedTint,
    fillColor: isDark ? colors.surfaceContainer : colors.surfaceContainerLow,
    fillStrongColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerHigh,
    borderColor: colors.outlineVariant,
    borderWidth: 1,
    fallbackColor: isDark ? colors.surfaceContainer : colors.surfaceContainerLow,
    backgroundGradient: colors.backgroundGradient,
    borderRadius: layout.borderRadius.lg,
    isDark,
    easyMode,
  };
}
