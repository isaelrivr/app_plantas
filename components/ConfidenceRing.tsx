import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../theme';

interface ConfidenceRingProps {
  score: number; // 0 a 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentSymbol?: boolean;
  colorVariant?: 'auto' | 'primary' | 'gold' | 'health';
  animate?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  score,
  size = 80,
  strokeWidth = 7,
  label,
  showPercentSymbol = true,
  colorVariant = 'auto',
  animate = true,
}) => {
  const { colors, isDark, typography } = useAppTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));

  // Animación suave de entrada (0 -> score) para el arco y el contador
  const [animatedValue] = useState(() => new Animated.Value(0));
  const [displayScore, setDisplayScore] = useState(clampedScore);

  useEffect(() => {
    animatedValue.stopAnimation();
    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayScore(value);
    });

    if (animate) {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: clampedScore,
        duration: 900,
        // react-native-svg no soporta driver nativo para strokeDashoffset
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(clampedScore);
    }

    return () => animatedValue.removeListener(listenerId);
  }, [clampedScore, animate, animatedValue]);

  // offset del arco derivado del valor animado (0 -> circumference completo vacío)
  const animatedOffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  // Selección de color semáforo según puntuación o variante
  let strokeColor = colors.primary;
  let gradientId = `ring-grad-${Math.floor(score)}`;

  if (colorVariant === 'gold') {
    strokeColor = colors.premiumGold;
  } else if (colorVariant === 'primary') {
    strokeColor = colors.primary;
  } else {
    // Modo semáforo (salud o confianza)
    if (score >= 80) {
      strokeColor = isDark ? '#4CAF50' : '#2E7D32';
    } else if (score >= 50) {
      strokeColor = isDark ? '#FFA726' : '#EF6C00';
    } else {
      strokeColor = isDark ? '#EF5350' : '#D32F2F';
    }
  }

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Nivel de confianza o salud: ${clampedScore} por ciento`}
      accessibilityValue={{ min: 0, max: 100, now: clampedScore }}
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={isDark ? strokeColor : strokeColor} stopOpacity="0.75" />
          </LinearGradient>
        </Defs>

        {/* Círculo de fondo inactivo */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Círculo activo de progreso */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Texto de valor central */}
      <View style={styles.innerLabel}>
        <View style={styles.valueRow}>
          <Text
            style={[
              typography.headline,
              {
                color: colors.textPrimary,
                fontSize: size * 0.28,
                fontWeight: '700',
              },
            ]}
          >
            {Math.round(displayScore)}
          </Text>
          {showPercentSymbol && (
            <Text
              style={[
                typography.caption2,
                {
                  color: colors.textSecondary,
                  fontSize: size * 0.16,
                  fontWeight: '600',
                  marginTop: 2,
                },
              ]}
            >
              %
            </Text>
          )}
        </View>

        {label && (
          <Text
            style={[
              typography.caption2,
              {
                color: colors.textTertiary,
                fontSize: size * 0.13,
                textAlign: 'center',
                marginTop: -1,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  innerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});
