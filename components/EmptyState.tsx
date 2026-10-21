import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, fontWeights } from '../theme';
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
      style={[styles.container, { paddingHorizontal: spacing.xl, paddingVertical: 52 }]}
      accessible={true}
      accessibilityLabel={`${title}. ${description}`}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.primaryLight,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Ionicons name={iconName} size={42} color={colors.primary} />
      </View>

      <Text
        style={[
          typography.title2,
          {
            color: colors.textPrimary,
            textAlign: 'center',
            fontWeight: fontWeights.bold,
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
            lineHeight: 24,
            marginBottom: actionTitle ? spacing.xl : 0,
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
          icon={<Ionicons name="add" size={20} color="#FFFFFF" />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
