import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Card } from '../Card';
import { CatalogPlant } from '../../services/plantApi';
import { useTranslation } from '../../i18n';

export interface PlantTodayActionCardProps {
  plant: CatalogPlant;
}

export const PlantTodayActionCard: React.FC<PlantTodayActionCardProps> = ({ plant }) => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card
      variant="flat"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: layout.borderRadius.lg,
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons name="sparkles" size={20} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={[typography.headline, { color: colors.textPrimary, fontWeight: '800' }]}>
          {t('Qué hacer hoy')}
        </Text>
      </View>

      <View style={styles.grid}>
        {/* RIEGO */}
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="water" size={18} color="#0D47A1" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>
              {t('Riego')}
            </Text>
            <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700' }]}>
              {t('Cada {dias} días', { dias: plant.wateringFrequencyDays })}
            </Text>
          </View>
        </View>

        {/* LUZ */}
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF9C4' }]}>
            <Ionicons name="sunny" size={18} color="#F57F17" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>
              {t('Luz')}
            </Text>
            <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700' }]}>
              {plant.light}
            </Text>
          </View>
        </View>

        {/* TEMPERATURA */}
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="thermometer" size={18} color="#6A1B9A" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>
              {t('Temperatura')}
            </Text>
            <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700' }]}>
              {plant.temperature}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
