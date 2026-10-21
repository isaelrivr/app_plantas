import React, { createContext, useContext, useRef, RefObject } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurTargetView } from 'expo-blur';
import { useAppTheme } from '../theme';

export const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

/**
 * Hook para obtener la referencia al BlurTarget más cercano provisto por GlassBackground.
 */
export const useBlurTarget = (): RefObject<View | null> | undefined => {
  const target = useContext(BlurTargetContext);
  return target ?? undefined;
};

export interface GlassBackgroundProps extends ViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Colores personalizados para el gradiente botánico suave (por defecto colors.backgroundGradient) */
  gradientColors?: readonly [string, string] | [string, string];
  /** Ref opcional provista externamente para el BlurTargetView */
  targetRef?: RefObject<View | null>;
  /** Estilos para el contenedor interno del BlurTargetView */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Si debe omitirse el gradiente y usar color de fondo plano */
  flat?: boolean;
}

/**
 * Contenedor de fondo con degradado suave y objetivo de desenfoque (`BlurTargetView`).
 *
 * Cumple con las reglas técnicas para Android (SDK 31+):
 * - Envuelve el contenido de fondo en BlurTargetView con una ref automática.
 * - Expone la referencia a través de BlurTargetContext para que cualquier
 *   GlassSurface o Card(variant="glass") descendiente la utilice sin prop drilling.
 * - Provee el degradado botánico continuo definido en los tokens de tema.
 */
export const GlassBackground: React.FC<GlassBackgroundProps> = ({
  children,
  style,
  gradientColors,
  targetRef: externalRef,
  contentContainerStyle,
  flat = false,
  ...rest
}) => {
  const { colors } = useAppTheme();
  const internalRef = useRef<View | null>(null);
  const resolvedTargetRef = externalRef ?? internalRef;

  const resolvedColors = gradientColors ?? colors.backgroundGradient;

  return (
    <BlurTargetContext.Provider value={resolvedTargetRef}>
      <View style={[styles.root, style]} {...rest}>
        {flat ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
        ) : (
          <LinearGradient
            colors={[resolvedColors[0], resolvedColors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <BlurTargetView
          ref={resolvedTargetRef}
          style={[styles.targetContainer, contentContainerStyle]}
        >
          {children}
        </BlurTargetView>
      </View>
    </BlurTargetContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  targetContainer: {
    flex: 1,
  },
});
