import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme, fontWeights, FONT_FAMILY } from '../theme';

export type ButtonVariant =
  | 'filled'
  | 'tonal'
  | 'outlined'
  | 'text'
  | 'elevated'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'premium';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Botón oficial Material Design 3 (Material You)
 * Cumple con áreas táctiles mínimas >= 48dp, feedback táctil con android_ripple
 * y soporte completo para estados (default, pressed, disabled, loading).
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'filled',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, layout, spacing, easyMode } = useAppTheme();

  const isFilled = variant === 'filled' || variant === 'primary';
  const isTonal = variant === 'tonal' || variant === 'secondary';
  const isOutlined = variant === 'outlined' || variant === 'outline';
  const isText = variant === 'text' || variant === 'ghost';
  const isElevated = variant === 'elevated';
  const isPremium = variant === 'premium';

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceContainerHighest;
    if (isFilled) return colors.primary;
    if (isTonal) return colors.secondaryContainer;
    if (isOutlined || isText) return 'transparent';
    if (isElevated) return colors.surfaceContainerLow;
    if (isPremium) return colors.premiumGold;
    return colors.primary;
  };

  const getBorderColor = () => {
    if (disabled) return 'transparent';
    if (isOutlined) return colors.outline;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.textTertiary;
    if (isFilled) return colors.onPrimary;
    if (isTonal) return colors.onSecondaryContainer;
    if (isOutlined || isText || isElevated) return colors.primary;
    if (isPremium) return '#1C1C1E';
    return colors.onPrimary;
  };

  const getRippleColor = () => {
    if (isFilled) return 'rgba(255, 255, 255, 0.24)';
    return colors.primary + '18';
  };

  const getMinHeight = () => {
    const baseTarget = easyMode ? layout.easyMinTouchTarget : Math.max(layout.minTouchTarget, 48);
    switch (size) {
      case 'sm':
        return Math.max(baseTarget, 48);
      case 'lg':
        return Math.max(baseTarget + 8, 56);
      case 'md':
      default:
        return Math.max(baseTarget, 48);
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      android_ripple={{
        color: getRippleColor(),
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: getMinHeight(),
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: isOutlined ? 1 : 0,
          borderRadius: layout.borderRadius.full,
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
          opacity: disabled ? 0.6 : pressed && Platform.OS === 'ios' ? 0.8 : 1,
          elevation: isElevated && !disabled ? 1 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" style={{ marginRight: icon || title ? 8 : 0 }} />
      ) : icon ? (
        <View style={{ marginRight: 8 }}>{icon}</View>
      ) : null}

      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: size === 'sm' ? 14 : size === 'lg' ? 17 : 15,
            fontWeight: isFilled || isPremium ? fontWeights.bold : fontWeights.medium,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
