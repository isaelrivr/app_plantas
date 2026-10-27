import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ViewProps, Platform } from 'react-native';
import { useAppTheme } from '../theme';

export type SurfaceVariant = 'flat' | 'elevated' | 'filled' | 'outlined' | 'tonal';

export interface SurfaceProps extends ViewProps {
  children?: React.ReactNode;
  variant?: SurfaceVariant;
  /** Nivel de elevación tonal M3 (0 a 5) */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Surface M3: Componente base para todas las superficies en Material Design 3.
 * Utiliza elevación tonal cromática en lugar de costosas capas de desenfoque GPU.
 */
export const Surface: React.FC<SurfaceProps> = ({
  children,
  variant = 'flat',
  elevation = 1,
  borderRadius,
  style,
  ...rest
}) => {
  const { colors, layout } = useAppTheme();

  const radius = borderRadius !== undefined ? borderRadius : layout.borderRadius.lg;

  const getBackgroundColor = () => {
    switch (variant) {
      case 'outlined':
        return colors.surface;
      case 'filled':
        return colors.surfaceContainerHighest;
      case 'tonal':
        return colors.surfaceContainer;
      case 'elevated':
        if (elevation === 1) return colors.surfaceContainerLow;
        if (elevation === 2) return colors.surfaceContainer;
        if (elevation === 3) return colors.surfaceContainerHigh;
        return colors.surfaceContainerHighest;
      case 'flat':
      default:
        return colors.surfaceContainerLow;
    }
  };

  const getBorder = () => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: colors.outlineVariant,
      };
    }
    return {
      borderWidth: 0,
      borderColor: 'transparent',
    };
  };

  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: radius,
          ...getBorder(),
          // Elevación sutil nativa de Android si variant="elevated"
          ...(variant === 'elevated' && Platform.OS === 'android'
            ? { elevation: Math.min(elevation, 2) }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
