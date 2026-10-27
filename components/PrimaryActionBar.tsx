import React from 'react';
import { StyleSheet, Text, Pressable, View, ViewStyle, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, fontWeights } from '../theme';
import { Button } from './Button';
import { Surface } from './Surface';

export interface PrimaryActionBarProps {
  primaryTitle: string;
  onPrimaryPress: () => void;
  primaryIcon?: React.ReactNode;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  primaryVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium';
  secondaryTitle?: string;
  onSecondaryPress?: () => void;
  style?: ViewStyle;
}

export const PrimaryActionBar: React.FC<PrimaryActionBarProps> = ({
  primaryTitle,
  onPrimaryPress,
  primaryIcon,
  primaryLoading = false,
  primaryDisabled = false,
  primaryVariant = 'primary',
  secondaryTitle,
  onSecondaryPress,
  style,
}) => {
  const { colors, typography, layout, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outerContainer,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
    >
      <Surface
        borderRadius={layout.borderRadius.lg}
        variant="elevated"
        elevation={3}
        style={[styles.glassContainer, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant, borderWidth: 1 }]}
      >
        <View style={[styles.innerContent, { padding: spacing.md }]}>
          <Button
            title={primaryTitle}
            onPress={onPrimaryPress}
            icon={primaryIcon}
            loading={primaryLoading}
            disabled={primaryDisabled}
            variant={primaryVariant}
            size="lg"
            style={styles.primaryButton}
          />

          {secondaryTitle && onSecondaryPress ? (
            <Pressable
              onPress={onSecondaryPress}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  minHeight: Math.max(layout.minTouchTarget, 48),
                  opacity: pressed && Platform.OS === 'ios' ? 0.72 : 1,
                  borderRadius: layout.borderRadius.md,
                },
              ]}
              android_ripple={{
                color: colors.primary + '18',
                borderless: false,
              }}
              accessibilityRole="button"
              accessibilityLabel={secondaryTitle}
              hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
            >
              <Text
                style={[
                  typography.subheadline,
                  { color: colors.primary, fontWeight: fontWeights.medium },
                ]}
              >
                {secondaryTitle}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingTop: 8,
  },
  glassContainer: {
    width: '100%',
  },
  innerContent: {
    width: '100%',
    gap: 4,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
