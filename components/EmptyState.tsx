import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName,
  title,
  description,
  actionTitle,
  onActionPress,
}) => {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <View
      style={[styles.container, { padding: spacing.xl }]}
      accessible={true}
      accessibilityLabel={`${title}. ${description}`}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.primaryLight,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Ionicons name={iconName} size={40} color={colors.primary} />
      </View>

      <Text
        style={[
          typography.title2,
          {
            color: colors.textPrimary,
            textAlign: 'center',
            fontWeight: '700',
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          typography.body,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: actionTitle ? spacing.lg : 0,
            maxWidth: 320,
          },
        ]}
      >
        {description}
      </Text>

      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="md"
          icon={<Ionicons name="add" size={18} color="#FFFFFF" />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
