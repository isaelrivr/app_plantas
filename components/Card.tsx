import React, { RefObject } from 'react';
import { StyleSheet, ViewStyle, StyleProp, ViewProps, View } from 'react-native';
import type { BlurTint } from 'expo-blur';
import { useAppTheme } from '../theme';
import { Surface, SurfaceVariant } from './Surface';

export type CardVariant = 'elevated' | 'filled' | 'outlined' | 'flat' | 'glass';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Variante visual M3 de la tarjeta:
   * - 'flat' / 'elevated': Superficie tonal M3 con elevación limpia.
   * - 'filled': Superficie tonal de alto contraste surfaceContainerHighest.
   * - 'outlined': Superficie con borde sutil outlineVariant sin sombra.
   * - 'glass': Redireccionado de forma transparente a superficie tonal M3 de alto rendimiento.
   */
  variant?: CardVariant;
  /** Nivel de elevación si variant="elevated" */
  elevated?: boolean;
  /** Props de compatibilidad retroactiva (ignoradas para cero impacto de GPU) */
  glassIntensity?: number;
  glassTint?: BlurTint;
  blurTarget?: RefObject<View | null>;
  glassVariant?: 'standard' | 'strong';
  forceFallback?: boolean;
}

/**
 * Componente Card oficial de Material Design 3.
 * Elimina totalmente el uso de BlurView y GPU de glassmorphism en favor de
 * superficies tonales Android de alto rendimiento a 60-120 FPS.
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'flat',
  elevated,
  glassIntensity,
  glassTint,
  blurTarget,
  glassVariant,
  forceFallback,
  ...rest
}) => {
  const { colors, layout } = useAppTheme();

  // Mapear variante a SurfaceVariant M3
  let surfaceVariant: SurfaceVariant = 'flat';
  if (variant === 'outlined') {
    surfaceVariant = 'outlined';
  } else if (variant === 'filled') {
    surfaceVariant = 'filled';
  } else if (variant === 'elevated' || elevated) {
    surfaceVariant = 'elevated';
  } else if (variant === 'glass') {
    surfaceVariant = 'tonal';
  } else {
    surfaceVariant = 'flat';
  }

  return (
    <Surface
      {...rest}
      variant={surfaceVariant}
      elevation={elevated ? 1 : 0}
      borderRadius={layout.borderRadius.lg}
      style={[
        styles.cardBase,
        {
          padding: layout.cardPadding,
          backgroundColor:
            surfaceVariant === 'outlined'
              ? colors.surface
              : surfaceVariant === 'filled'
              ? colors.surfaceContainerHighest
              : surfaceVariant === 'tonal'
              ? colors.surfaceContainerHigh
              : colors.surfaceContainerLow,
          borderColor: surfaceVariant === 'outlined' ? colors.outlineVariant : 'transparent',
          borderWidth: surfaceVariant === 'outlined' ? 1 : 0,
        },
        style,
      ]}
    >
      {children}
    </Surface>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    overflow: 'hidden',
  },
});
