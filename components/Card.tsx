import React, { RefObject } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ViewProps } from 'react-native';
import type { BlurTint } from 'expo-blur';
import { useAppTheme } from '../theme';
import { GlassSurface } from './GlassSurface';

export type CardVariant = 'flat' | 'glass';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Variante visual de la tarjeta:
   * - 'flat': Minimalista, plano, bordes sutiles y limpio fondo sólido (por defecto).
   * - 'glass': Superficie flotante glassmórfica con desenfoque condicional por hardware.
   */
  variant?: CardVariant;
  /** Si tiene sombra de elevación (por defecto false en flat, true en glass) */
  elevated?: boolean;
  /** Intensidad de blur si variant="glass" */
  glassIntensity?: number;
  /** Tinte de blur si variant="glass" */
  glassTint?: BlurTint;
  /** Ref opcional al BlurTarget si variant="glass" */
  blurTarget?: RefObject<View | null>;
  /** Variante de vidrio: 'standard' (70% opacidad) o 'strong' (88% opacidad) */
  glassVariant?: 'standard' | 'strong';
  /** Forzar fallback sin desenfoque */
  forceFallback?: boolean;
}

/**
 * Componente de tarjeta unificado con soporte para variantes:
 * - `flat` (por defecto): Minimalismo botánico, plano, limpio y con amplio espacio en blanco.
 * - `glass`: Superficie flotante glassmórfica con desenfoque real por GPU en Android SDK 31+ e iOS.
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'flat',
  elevated,
  glassIntensity,
  glassTint,
  blurTarget,
  glassVariant = 'standard',
  forceFallback,
  ...rest
}) => {
  const { colors, layout } = useAppTheme();

  if (variant === 'glass') {
    const isElevated = elevated !== undefined ? elevated : true;
    return (
      <GlassSurface
        {...rest}
        variant={glassVariant}
        intensity={glassIntensity}
        tint={glassTint}
        blurTarget={blurTarget}
        forceFallback={forceFallback}
        elevated={isElevated}
        borderRadius={layout.borderRadius.lg}
        style={[
          styles.cardBase,
          {
            padding: layout.cardPadding,
          },
          style,
        ]}
      >
        {children}
      </GlassSurface>
    );
  }

  // Variante 'flat' (minimalista plano por defecto)
  const isElevated = elevated !== undefined ? elevated : false;
  return (
    <View
      {...rest}
      style={[
        styles.cardBase,
        styles.flatCard,
        {
          backgroundColor: isElevated ? colors.surfaceElevated : colors.surface,
          borderColor: colors.border,
          borderRadius: layout.borderRadius.lg,
          padding: layout.cardPadding,
        },
        isElevated && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    overflow: 'hidden',
  },
  flatCard: {
    borderWidth: 1,
  },
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
