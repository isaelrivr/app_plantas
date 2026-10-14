import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { useTranslation } from '../../i18n';

export interface PhotoGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PhotoGuideModal: React.FC<PhotoGuideModalProps> = ({ visible, onClose }) => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const { t } = useTranslation();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('Cómo tomar una buena foto')}
      subtitle={t('Para una identificación precisa al 95%')}
    >
      <View style={{ paddingBottom: spacing.lg }}>
        {/* BUENA FOTO */}
        <View
          style={[
            styles.exampleBox,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: '#4CAF50',
              borderRadius: layout.borderRadius.lg,
            },
          ]}
        >
          <View style={styles.badgeRow}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={[typography.headline, { color: '#4CAF50', marginLeft: 6 }]}>
              {t('Buena foto')}
            </Text>
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: 4 }]}>
            {t('Acércate a una sola hoja o flor bien iluminada. Enfoca el centro sin sombras fuertes.')}
          </Text>
        </View>

        {/* MALA FOTO */}
        <View
          style={[
            styles.exampleBox,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.error,
              borderRadius: layout.borderRadius.lg,
              marginTop: spacing.md,
            },
          ]}
        >
          <View style={styles.badgeRow}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={[typography.headline, { color: colors.error, marginLeft: 6 }]}>
              {t('Evita estas fotos')}
            </Text>
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: 4 }]}>
            {t('Fotos lejanas de toda la habitación, plantas muy oscuras, a contraluz o desenfocadas.')}
          </Text>
        </View>

        <Button
          title={t('Entendido')}
          onPress={onClose}
          variant="primary"
          size="lg"
          style={{ marginTop: spacing.xl }}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  exampleBox: {
    padding: 16,
    borderWidth: 1.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
