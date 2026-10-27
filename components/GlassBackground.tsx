import React, { createContext, useContext, useRef, RefObject } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ViewProps } from 'react-native';
import { useAppTheme } from '../theme';

export const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

/**
 * Hook retrocompatible para obtener la referencia al BlurTarget.
 */
export const useBlurTarget = (): RefObject<View | null> | undefined => {
  const target = useContext(BlurTargetContext);
  return target ?? undefined;
};

export interface GlassBackgroundProps extends ViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gradientColors?: readonly [string, string] | [string, string];
  targetRef?: RefObject<View | null>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  flat?: boolean;
}

/**
 * GlassBackground M3: Contenedor plano y limpio de fondo.
 * Elimina completamente BlurTargetView y gradientes pesados en favor de la superficie
 * sólida y tonal nativa de Material Design 3.
 */
export const GlassBackground: React.FC<GlassBackgroundProps> = ({
  children,
  style,
  contentContainerStyle,
  ...rest
}) => {
  const { colors } = useAppTheme();
  const internalRef = useRef<View | null>(null);

  return (
    <BlurTargetContext.Provider value={internalRef}>
      <View
        {...rest}
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
          style,
        ]}
      >
        <View ref={internalRef} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={[styles.contentContainer, contentContainerStyle]}>
          {children}
        </View>
      </View>
    </BlurTargetContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
});
