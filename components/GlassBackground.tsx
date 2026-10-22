import React, { createContext, useContext, useRef, useEffect, RefObject } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurTargetView } from 'expo-blur';
import { useIsFocused } from '@react-navigation/native';
import { useAppTheme } from '../theme';
import { useActiveBlurTarget } from '../context/ActiveBlurTargetContext';

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
  /** Estilos para el contenedor interno de contenido (hermano de BlurTargetView) */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Si debe omitirse el gradiente y usar color de fondo plano */
  flat?: boolean;
}

/**
 * Contenedor de fondo con degradado suave y objetivo de desenfoque (`BlurTargetView`).
 *
 * Arquitectura canónica para Android SDK 31+ y dimezis/BlurView:
 * 1. BlurTargetView y BlurView son HERMANOS, nunca padre/hijo.
 * 2. BlurTargetView contiene ÚNICAMENTE el fondo visible (degradado + formas suaves).
 * 3. Los hijos de la pantalla (ScrollView, tarjetas y superficies de vidrio) se
 *    renderizan FUERA de BlurTargetView, encima de él.
 * 4. Un BlurTargetView por pantalla, registrando dinámicamente la ref de la pantalla
 *    enfocada hacia la FloatingGlassTabBar a través de ActiveBlurTargetContext.
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
  const { colors, isDark } = useAppTheme();
  const internalRef = useRef<View | null>(null);
  const resolvedTargetRef = externalRef ?? internalRef;

  const resolvedColors = gradientColors ?? colors.backgroundGradient;

  const isFocused = useIsFocused();

  const { setActiveBlurTargetRef } = useActiveBlurTarget();

  useEffect(() => {
    if (isFocused) {
      setActiveBlurTargetRef(resolvedTargetRef);
    }
  }, [isFocused, resolvedTargetRef, setActiveBlurTargetRef]);

  return (
    <BlurTargetContext.Provider value={resolvedTargetRef}>
      <View style={[styles.root, style]} {...rest}>
        {/*
          BlurTargetView contiene ÚNICAMENTE el fondo (degradado + formas suaves).
          Es hermano de los hijos para evitar recursión y problemas de GPU en Android.
        */}
        <BlurTargetView
          ref={resolvedTargetRef}
          style={StyleSheet.absoluteFill}
        >
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

          {/* Formas orgánicas suaves para textura y riqueza óptica al desenfocar */}
          <View
            style={[
              styles.softShapeTop,
              {
                backgroundColor: isDark
                  ? 'rgba(74, 222, 128, 0.08)'
                  : 'rgba(46, 125, 50, 0.05)',
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.softShapeBottom,
              {
                backgroundColor: isDark
                  ? 'rgba(45, 212, 191, 0.06)'
                  : 'rgba(0, 121, 107, 0.04)',
              },
            ]}
            pointerEvents="none"
          />
        </BlurTargetView>

        {/* Hijos de la pantalla (incluyendo el vidrio) FUERA de BlurTargetView, encima */}
        <View style={[styles.contentContainer, contentContainerStyle]}>
          {children}
        </View>
      </View>
    </BlurTargetContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
  },
  softShapeTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  softShapeBottom: {
    position: 'absolute',
    bottom: 40,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
});
