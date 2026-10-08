import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';

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
  const { colors, typography, spacing } = useAppTheme();

  const actionsToRender = rightActions ?? (rightAction ? [rightAction] : []);

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          {subtitle ? (
            <Text
              style={[
                typography.subheadline,
                {
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  letterSpacing: 0.5,
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
              },
            ]}
          >
            {title}
          </Text>
        </View>
        {actionsToRender.length > 0 ? (
          <View style={styles.rightActionsRow}>
            {actionsToRender.map((action, i) => (
              <View key={i} style={styles.rightAction}>
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
    marginLeft: 0,
  },
});
