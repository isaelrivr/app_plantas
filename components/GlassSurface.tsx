import React, { RefObject } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ViewProps } from 'react-native';
import type { BlurTint } from '../theme/useGlass';
import { useAppTheme } from '../theme';

export interface GlassSurfaceProps extends ViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'standard' | 'strong';
  tone?: 'default' | 'overlay' | 'scrim';
  intensity?: number;
  tint?: BlurTint;
  borderRadius?: number;
  elevated?: boolean;
  borderWidth?: number;
  borderColor?: string;
  blurTarget?: RefObject<View | null>;
  tintOverlayColor?: string;
  forceFallback?: boolean;
  padding?: number;
}

/**
 * GlassSurface M3: Reemplazado internamente por una superficie tonal plana de alto rendimiento.
 * Elimina completamente el uso de BlurView en GPU y provee soporte para:
 * - tone='default': Superficie tonal M3 adaptable al tema (surfaceContainer / surfaceContainerHigh).
 * - tone='overlay' | 'scrim': Scrim oscuro puro rgba(0, 0, 0, 0.55) para controles sobre fotos/cámara.
 */
export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  style,
  variant = 'standard',
  tone = 'default',
  intensity,
  tint,
  borderRadius,
  elevated = true,
  borderWidth = 1,
  borderColor,
  blurTarget,
  tintOverlayColor,
  forceFallback = true,
  padding,
  ...rest
}) => {
  const { colors, layout } = useAppTheme();

  const radius = borderRadius !== undefined ? borderRadius : layout.borderRadius.lg;
  const isOverlay = tone === 'overlay' || tone === 'scrim';

  const backgroundColor = isOverlay
    ? 'rgba(0, 0, 0, 0.55)'
    : variant === 'strong'
    ? colors.surfaceContainerHigh
    : colors.surfaceContainer;

  const resolvedBorderColor = borderColor
    ? borderColor
    : isOverlay
    ? 'rgba(255, 255, 255, 0.20)'
    : colors.outlineVariant;

  return (
    <View
      {...rest}
      style={[
        styles.container,
        {
          borderRadius: radius,
          backgroundColor,
          borderColor: resolvedBorderColor,
          borderWidth,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
