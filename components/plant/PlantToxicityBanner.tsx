import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { getToxicity, ToxicityInfo } from '../../services/toxicityService';
import { useTranslation } from '../../i18n';

export interface PlantToxicityBannerProps {
  speciesId: string;
}

export const PlantToxicityBanner: React.FC<PlantToxicityBannerProps> = ({ speciesId }) => {
  const { layout, spacing, typography, isDark } = useAppTheme();
  const { t } = useTranslation();

  const toxicity: ToxicityInfo = getToxicity(speciesId);
  const isToxic = toxicity.pets === 'toxic' || toxicity.children === 'toxic';
  const isCaution = !isToxic && (toxicity.pets === 'caution' || toxicity.children === 'caution');

  const bg = isToxic
    ? isDark ? 'rgba(239, 83, 80, 0.18)' : '#FFEBEE'
    : isCaution
    ? isDark ? 'rgba(255, 167, 38, 0.18)' : '#FFF8E1'
    : isDark ? 'rgba(102, 187, 106, 0.18)' : '#E8F5E9';

  const textColor = isToxic
    ? isDark ? '#EF9A9A' : '#C62828'
    : isCaution
    ? isDark ? '#FFE082' : '#E65100'
    : isDark ? '#A5D6A7' : '#2E7D32';

  const iconName = isToxic ? 'warning' : isCaution ? 'alert-circle' : 'shield-checkmark';

  const label = isToxic
    ? t('Precaución: Tóxica para mascotas o niños si se ingiere')
    : isCaution
    ? t('Precaución leve: Mantén fuera del alcance de mascotas')
    : t('Segura: No tóxica para mascotas ni niños');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderColor: textColor,
          borderRadius: layout.borderRadius.md,
          padding: spacing.sm,
          marginTop: spacing.sm,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Ionicons name={iconName} size={20} color={textColor} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.caption1, { color: textColor, fontWeight: '700' }]}>
          {label}
        </Text>
        <Text style={[typography.caption2, { color: textColor, opacity: 0.85, marginTop: 2, fontSize: 11 }]}>
          {t('Aviso orientativo: no sustituye la valoración de un profesional veterinario o botánico.')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
