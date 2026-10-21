import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme';
import { Card } from '../Card';
import { Button } from '../Button';
import { useTranslation } from '../../i18n';
import { getGrowthEntries } from '../../services/growthDiaryService';

export interface PlantTimelineProps {
  plantId: string;
  plantName: string;
  lastWatered?: string;
  lastDiagnosis?: string;
  lastDiagnosisState?: string;
  onNavigateGrowthDiary?: () => void;
}

export const PlantTimeline: React.FC<PlantTimelineProps> = ({
  plantId,
  plantName,
  lastWatered,
  lastDiagnosis,
  lastDiagnosisState,
  onNavigateGrowthDiary,
}) => {
  const { colors, spacing, typography, layout } = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const entries = useMemo(() => getGrowthEntries(plantId), [plantId]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      {/* TARJETA COMPARADOR ANTES / DESPUÉS */}
      {entries.length >= 2 ? (
        <Card
          variant="flat"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: layout.borderRadius.lg,
          }}
        >
          <View style={styles.headerRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="git-compare" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                {t('Comparador Antes y Después')}
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                {t('Tienes {total} fotos para comparar su progreso', { total: entries.length })}
              </Text>
            </View>
          </View>
          <Button
            title={t('Ver Comparación Visual')}
            onPress={() => navigation.navigate('GrowthDiary', { plantId })}
            variant="primary"
            size="md"
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : null}

      {/* EVENTOS CRONOLÓGICOS */}
      <Card
        variant="flat"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: layout.borderRadius.lg,
        }}
      >
        <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.md }]}>
          {t('Historia de cuidados')}
        </Text>

        <View style={styles.timelineContainer}>
          {/* 1. Diagnóstico reciente */}
          {lastDiagnosis ? (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
              <View style={styles.timelineContent}>
                <Text style={[typography.caption1, { color: colors.accent, fontWeight: '700' }]}>
                  {t('Diagnóstico')}
                </Text>
                <Text style={[typography.body, { color: colors.textPrimary, marginTop: 2 }]}>
                  {lastDiagnosis}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 2. Último Riego */}
          {lastWatered ? (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#0288D1' }]} />
              <View style={styles.timelineContent}>
                <Text style={[typography.caption1, { color: '#0288D1', fontWeight: '700' }]}>
                  {t('Riego')}
                </Text>
                <Text style={[typography.body, { color: colors.textPrimary, marginTop: 2 }]}>
                  {lastWatered}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 3. Fotos y entradas del diario */}
          {entries.map((entry) => (
            <View key={entry.id} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={[typography.caption2, { color: colors.textTertiary }]}>
                  {formatDate(entry.date)}
                </Text>
                <Text style={[typography.body, { color: colors.textPrimary, marginTop: 2 }]}>
                  {entry.note}
                </Text>
                {entry.photoUri ? (
                  <Image source={{ uri: entry.photoUri }} style={[styles.entryThumb, { borderRadius: layout.borderRadius.md }]} />
                ) : null}
              </View>
            </View>
          ))}

          {/* 4. Inicio del registro */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: colors.border }]} />
            <View style={styles.timelineContent}>
              <Text style={[typography.caption1, { color: colors.textSecondary, fontWeight: '600' }]}>
                {t('Inicio del cuidado en EcoScan')}
              </Text>
              <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 2 }]}>
                {plantName}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate('GrowthDiary', { plantId })}
          android_ripple={{ color: colors.primaryLight }}
          style={({ pressed }) => [
            styles.addDiaryButton,
            {
              borderColor: colors.primary,
              borderRadius: layout.borderRadius.md,
              marginTop: spacing.md,
              overflow: 'hidden',
            },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('Agregar foto al diario')}
        >
          <Ionicons name="camera" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>
            {t('Agregar foto al diario')}
          </Text>
        </Pressable>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  entryThumb: {
    width: 100,
    height: 100,
    marginTop: 8,
  },
  addDiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    minHeight: 48,
  },
});
