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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, layout, spacing, isDark } = useAppTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.surfaceSecondary;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      case 'premium':
        return colors.premiumGold;
      default:
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.primary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.textTertiary;
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return colors.textPrimary;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      case 'premium':
        return '#1C1C1E';
      default:
        return '#FFFFFF';
    }
  };

  const getRippleColor = () => {
    switch (variant) {
      case 'primary':
        return 'rgba(255, 255, 255, 0.25)';
      case 'premium':
        return 'rgba(0, 0, 0, 0.15)';
      case 'outline':
      case 'ghost':
        return isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(27, 106, 59, 0.12)';
      case 'secondary':
      default:
        return isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
    }
  };

  const getMinHeight = () => {
    switch (size) {
      case 'sm':
        return Math.max(layout.minTouchTarget, 48);
      case 'lg':
        return Math.max(layout.minTouchTarget, 56);
      case 'md':
      default:
        return Math.max(layout.minTouchTarget, 48);
    }
  };

  return (
    <Pressable
      onPress={() => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
        onPress();
      }}
      disabled={disabled || loading}
      android_ripple={{
        color: getRippleColor(),
        borderless: false,
        foreground: true,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: getMinHeight(),
          minWidth: layout.minTouchTarget,
          paddingVertical: 12,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderRadius: layout.borderRadius.full,
          paddingHorizontal: spacing.xl,
          opacity: pressed && Platform.OS === 'ios' ? 0.78 : disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                marginLeft: icon ? spacing.xs : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
