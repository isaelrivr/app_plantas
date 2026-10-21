import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme, fontWeights } from '../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  rightActions?: React.ReactNode[];
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightAction,
  rightActions,
}) => {
  const { colors, typography, spacing, layout } = useAppTheme();

  const actionsToRender = rightActions ?? (rightAction ? [rightAction] : []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {subtitle ? (
            <Text
              style={[
                typography.subheadline,
                {
                  color: colors.textSecondary,
                  fontWeight: fontWeights.medium,
                  letterSpacing: 0.15,
                  marginBottom: spacing.xxs,
                },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
          <Text
            style={[
              typography.largeTitle,
              {
                color: colors.textPrimary,
                fontWeight: fontWeights.bold,
              },
            ]}
          >
            {title}
          </Text>
        </View>
        {actionsToRender.length > 0 ? (
          <View style={styles.rightActionsRow}>
            {actionsToRender.map((action, i) => (
              <View
                key={i}
                style={[
                  styles.rightAction,
                  { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget },
                ]}
              >
                {action}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
