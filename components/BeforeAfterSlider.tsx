import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  PanResponder,
  PanResponderInstance,
  Animated,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';

interface BeforeAfterSliderProps {
  beforeUri: string;
  afterUri: string;
  beforeLabel?: string;
  afterLabel?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Comparador interactivo antes/después. Arrastra el divisor para revelar
 * la foto más reciente de la planta (diario de crecimiento, punto 9).
 */
export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeUri,
  afterUri,
  beforeLabel,
  afterLabel,
  height = 240,
  style,
}) => {
  const { colors, layout, typography } = useAppTheme();
  const { t } = useTranslation();
  const beforeText = beforeLabel ?? t('Antes');
  const afterText = afterLabel ?? t('Después');
  const [clipWidth] = useState(() => new Animated.Value(0));
  const clipRef = useRef(clipWidth);
  const widthRef = useRef(0);
  const fractionRef = useRef(0.5);
  const startFractionRef = useRef(0.5);

  const setFraction = useCallback(
    (fraction: number) => {
      const clamped = clamp(fraction, 0, 1);
      fractionRef.current = clamped;
      clipWidth.setValue(clamped * widthRef.current);
    },
    [clipWidth]
  );

  const [panResponder, setPanResponder] = useState<PanResponderInstance | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setPanResponder(
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            startFractionRef.current = fractionRef.current;
          },
          onPanResponderMove: (_evt, gesture) => {
            if (widthRef.current === 0) return;
            const clamped = clamp(startFractionRef.current + gesture.dx / widthRef.current, 0, 1);
            fractionRef.current = clamped;
            clipRef.current.setValue(clamped * widthRef.current);
          },
        })
      );
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== widthRef.current) {
      widthRef.current = w;
      clipWidth.setValue(fractionRef.current * w);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { height, borderRadius: layout.borderRadius.lg, backgroundColor: colors.surfaceSecondary },
        style,
      ]}
      onLayout={onLayout}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t('Comparador de crecimiento. {before} y {after}.', {
        before: beforeText,
        after: afterText,
      })}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') setFraction(fractionRef.current + 0.1);
        if (event.nativeEvent.actionName === 'decrement') setFraction(fractionRef.current - 0.1);
      }}
    >
      <Image source={{ uri: beforeUri }} style={styles.image} resizeMode="cover" />
      <Animated.View style={[styles.afterClip, { width: clipWidth }]}>
        <Image source={{ uri: afterUri }} style={styles.image} resizeMode="cover" />
      </Animated.View>

      <View style={[styles.labelPill, styles.labelLeft, { backgroundColor: colors.surface + 'E6' }]}>
        <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '600' }]}>
          {afterText}
        </Text>
      </View>
      <View style={[styles.labelPill, styles.labelRight, { backgroundColor: colors.surface + 'E6' }]}>
        <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '600' }]}>
          {beforeText}
        </Text>
      </View>

      <Animated.View
        style={[styles.divider, { transform: [{ translateX: clipWidth }], backgroundColor: colors.surface }]}
        {...(panResponder ? panResponder.panHandlers : {})}
      >
        <View
          style={[
            styles.handle,
            { backgroundColor: colors.primary, borderRadius: layout.borderRadius.full },
          ]}
        >
          <Ionicons name="code-outline" size={18} color="#FFFFFF" />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  afterClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelPill: {
    position: 'absolute',
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  labelLeft: {
    left: 10,
  },
  labelRight: {
    right: 10,
  },
});
