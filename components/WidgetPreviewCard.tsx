import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import { Card } from './Card';
import { useGarden } from '../context/GardenContext';
import { useFeedback } from '../context/FeedbackContext';
import {
  calculateWidgetSnapshot,
  updateWidgetData,
} from '../services/widgetService';

export const WidgetPreviewCard: React.FC = () => {
  const { colors, typography, spacing } = useAppTheme();
  const { t } = useTranslation();
  const { plants } = useGarden();
  const { showToast } = useFeedback();

  const snapshot = useMemo(() => calculateWidgetSnapshot(plants), [plants]);

  useEffect(() => {
    void updateWidgetData(plants);
  }, [plants]);

  const handleRefreshWidget = async () => {
    try {
      Haptics.selectionAsync();
      await updateWidgetData(plants);
      showToast({
        message: t('Widget actualizado con el estado actual de tu jardín'),
        type: 'success',
      });
    } catch {
      showToast({ message: t('Error al actualizar el widget'), type: 'error' });
    }
  };

  return (
    <Card style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="apps-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[typography.headline, { color: colors.textPrimary }]}>
            {t('Widget de pantalla de inicio')}
          </Text>
        </View>
        <Pressable
          onPress={handleRefreshWidget}
          android_ripple={{ color: colors.primaryLight, borderless: true, radius: 24 }}
          style={({ pressed }) => [
            styles.refreshBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('Actualizar widget')}
        >
          <Ionicons name="sync" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={[typography.subheadline, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        {t('Muestra directamente en tu pantalla de inicio las plantas que toca regar hoy sin abrir la app.')}
      </Text>

      {/* Maqueta visual del widget en pantalla de inicio */}
      <View style={[styles.widgetMockup, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.widgetHeader}>
          <View style={styles.appBadge}>
            <Ionicons name="leaf" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[typography.caption1, { color: colors.primary, fontWeight: '700' }]}>
              EcoScan
            </Text>
          </View>
          <Text style={[typography.caption2, { color: colors.textSecondary }]}>
            {t('Hoy')}
          </Text>
        </View>

        <View style={styles.widgetBody}>
          <Text style={[typography.headline, { color: colors.textPrimary, fontSize: 16, lineHeight: 22 }]}>
            {snapshot.headline}
          </Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 4, fontSize: 13 }]}>
            {snapshot.subtext}
          </Text>
        </View>

        <View style={styles.widgetFooter}>
          <View style={styles.statsPill}>
            <Ionicons
              name={snapshot.isAllCompleted ? 'checkmark-circle' : 'water'}
              size={13}
              color={snapshot.isAllCompleted ? colors.success : colors.info}
              style={{ marginRight: 4 }}
            />
            <Text style={[typography.caption2, { color: colors.textSecondary }]}>
              {snapshot.isAllCompleted
                ? t('Jardín al día')
                : t('{count} pendientes', { count: snapshot.pendingCount })}
            </Text>
          </View>
          <Text style={[typography.caption2, { color: colors.textSecondary, fontSize: 11 }]}>
            {snapshot.deepLinkUrl}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetMockup: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetBody: {
    paddingVertical: 4,
  },
  widgetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
