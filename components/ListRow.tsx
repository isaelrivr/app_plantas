import React from 'react';
import { StyleSheet, Text, Pressable, View, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, fontWeights } from '../theme';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  leadingIconColor?: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  isDestructive?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  leadingIcon,
  leadingIconColor,
  trailing,
  showChevron = true,
  onPress,
  isDestructive = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  const { colors, typography, layout, spacing, isDark } = useAppTheme();

  const textColor = isDestructive
    ? colors.error
    : disabled
    ? colors.textTertiary
    : colors.textPrimary;
  const iconColor = leadingIconColor || (isDestructive ? colors.error : colors.primary);

  const content = (
    <View
      style={[
        styles.row,
        {
          minHeight: Math.max(layout.minTouchTarget, 52),
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
        },
        style,
      ]}
    >
      {leadingIcon ? (
        <View style={[styles.iconContainer, { marginRight: spacing.md }]}>
          <Ionicons name={leadingIcon} size={22} color={iconColor} />
        </View>
      ) : null}

      <View style={styles.textContainer}>
        <Text
          style={[
            typography.body,
            { color: textColor, fontWeight: fontWeights.medium },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[typography.caption1, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ? (
        <View style={styles.trailingContainer}>{trailing}</View>
      ) : showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel || `${title}${subtitle ? `. ${subtitle}` : ''}`}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{
        color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        borderless: false,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${title}${subtitle ? `. ${subtitle}` : ''}`}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={({ pressed }) => [
        {
          borderRadius: layout.borderRadius.md,
          overflow: 'hidden',
          opacity: pressed && Platform.OS === 'ios' ? 0.72 : 1,
        },
      ]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  trailingContainer: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
