import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, DimensionValue } from 'react-native';
import { useAppTheme } from '../theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { isDark } = useAppTheme();
  const [opacityAnim] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  const baseBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseBg,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const PlantCardSkeleton: React.FC = () => {
  const { colors, spacing } = useAppTheme();

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View style={styles.row}>
        <SkeletonBox width={56} height={56} borderRadius={28} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <SkeletonBox width="45%" height={14} borderRadius={4} />
          <SkeletonBox width="80%" height={20} borderRadius={6} style={{ marginTop: 8 }} />
          <SkeletonBox width="60%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={{ marginTop: spacing.md, flexDirection: 'row', gap: 8 }}>
        <SkeletonBox width="48%" height={36} borderRadius={10} />
        <SkeletonBox width="48%" height={36} borderRadius={10} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
