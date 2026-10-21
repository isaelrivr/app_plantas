import React from 'react';
import { Modal, StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';
import { Button } from './Button';
import { useTranslation } from '../i18n';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { colors, typography, layout, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const finalConfirmText = confirmText || (isDestructive ? t('Eliminar') : t('Confirmar'));
  const finalCancelText = cancelText === null ? null : (cancelText || t('Cancelar'));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onCancel}
        accessibilityRole="none"
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderRadius: layout.borderRadius.xl,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onStartShouldSetResponder={() => true}
          accessibilityRole="alert"
          accessibilityLabel={`${title}. ${message}`}
        >
          <View style={styles.handle} />

          <Text
            style={[
              typography.title2,
              { color: colors.textPrimary, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
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
                marginTop: spacing.sm,
                marginBottom: spacing.xl,
                lineHeight: 22,
              },
            ]}
          >
            {message}
          </Text>

          <View style={styles.actions}>
            <Button
              title={finalConfirmText}
              onPress={onConfirm}
              variant={isDestructive ? 'primary' : 'primary'}
              size="lg"
              style={[
                styles.button,
                isDestructive ? { backgroundColor: colors.error } : null,
              ]}
            />
            {finalCancelText ? (
              <Button
                title={finalCancelText}
                onPress={onCancel}
                variant="secondary"
                size="lg"
                style={styles.button}
              />
            ) : null}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  actions: {
    gap: 10,
  },
  button: {
    width: '100%',
  },
});
