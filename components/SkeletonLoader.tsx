import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, DimensionValue, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * SkeletonBox / SkeletonLoader M3:
 * Marcador de posición animado con pulso suave para estados de carga.
 */
export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}) => {
  const { colors, layout, motion } = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    if (motion.isReduced) {
      opacity.setValue(0.6);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [motion.isReduced, opacity]);

  const radius = borderRadius !== undefined ? borderRadius : layout.borderRadius.sm;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceContainerHighest,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonLoader = SkeletonBox;

/**
 * PlantCardSkeleton: Skeleton para tarjetas de planta en listas
 */
export const PlantCardSkeleton: React.FC = () => {
  const { colors, spacing, layout } = useAppTheme();

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderColor: colors.outlineVariant,
          padding: layout.cardPadding,
          marginBottom: spacing.md,
          borderRadius: layout.borderRadius.lg,
        },
      ]}
    >
      <View style={styles.row}>
        <SkeletonBox width={56} height={56} borderRadius={layout.borderRadius.md} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <SkeletonBox width="45%" height={14} borderRadius={4} />
          <SkeletonBox width="80%" height={20} borderRadius={6} style={{ marginTop: 8 }} />
          <SkeletonBox width="60%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={{ marginTop: spacing.md, flexDirection: 'row', gap: 8 }}>
        <SkeletonBox width="48%" height={36} borderRadius={layout.borderRadius.sm} />
        <SkeletonBox width="48%" height={36} borderRadius={layout.borderRadius.sm} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  cardContainer: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
