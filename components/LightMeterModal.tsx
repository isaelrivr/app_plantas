import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from '../i18n';
import { Button } from './Button';
import { Card } from './Card';

export interface LightMeterModalProps {
  visible: boolean;
  onClose: () => void;
  plantName?: string;
  recommendedLight?: string;
}

export type LightLevelCategory = 'low' | 'medium' | 'high';

export const LightMeterModal: React.FC<LightMeterModalProps> = ({
  visible,
  onClose,
  plantName,
  recommendedLight,
}) => {
  const { colors, typography, spacing, layout } = useAppTheme();
  const { t } = useTranslation();
  const { easyMode } = useSettings();

  // Nivel de luz en Lux (por defecto 450 lx: luz indirecta agradable)
  const [luxValue, setLuxValue] = useState<number>(450);

  const getLightCategory = (lux: number): LightLevelCategory => {
    if (lux < 250) return 'low';
    if (lux <= 1000) return 'medium';
    return 'high';
  };

  const currentCategory = getLightCategory(luxValue);

  const categoryMeta: Record<
    LightLevelCategory,
    { label: string; icon: string; color: string; desc: string; advice: string }
  > = {
    low: {
      label: t('Baja luz (Sombra)'),
      icon: 'cloud-outline',
      color: '#5C6BC0',
      desc: '50 - 250 lux. Rincones alejados de ventanas o pasillos.',
      advice: t('Apta solo para plantas muy resistentes como Sansevieria o Zamioculca. Si tu planta necesita luz brillante, acércala a una ventana.'),
    },
    medium: {
      label: t('Luz indirecta brillante'),
      icon: 'partly-sunny-outline',
      color: '#2E7D32',
      desc: '250 - 1000 lux. Cerca de ventana con cortina traslúcida.',
      advice: t('¡El punto dorado para la mayoría de plantas de interior! Monstera, Pothos, Ficus y Helechos prosperan aquí sin riesgo de quemaduras.'),
    },
    high: {
      label: t('Sol directo intenso'),
      icon: 'sunny',
      color: '#E65100',
      desc: '> 1000 lux. Ventana orientada al sur/poniente sin filtrar.',
      advice: t('Ideal para cactus, suculentas, romero y lavanda. Si tu planta es de hojas tiernas, filtra los rayos con una cortina para no quemarla.'),
    },
  };

  const meta = categoryMeta[currentCategory];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: layout.borderRadius.xl,
              borderTopRightRadius: layout.borderRadius.xl,
            },
          ]}
        >
          {/* CABECERA */}
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="sunny" size={24} color="#F57F17" />
              <Text
                style={[
                  typography.headline,
                  {
                    color: colors.textPrimary,
                    marginLeft: 8,
                    fontSize: easyMode ? 20 : 18,
                  },
                ]}
              >
                {t('Medidor de luz')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('Cerrar')}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: spacing.md, paddingBottom: 28 }}
          >
            {plantName ? (
              <Text
                style={[
                  typography.footnote,
                  { color: colors.textSecondary, marginBottom: spacing.sm },
                ]}
              >
                {t('Comprobando ubicación para')}:{' '}
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                  {plantName}
                </Text>
              </Text>
            ) : null}

            {/* MEDIDOR VISUAL / GAUGE */}
            <Card
              elevated
              style={[
                styles.meterCard,
                {
                  backgroundColor: colors.background,
                  borderColor: meta.color,
                  borderWidth: 2,
                },
              ]}
            >
              <View style={styles.gaugeHeader}>
                <Ionicons name={meta.icon as any} size={44} color={meta.color} />
                <View style={{ marginLeft: 16 }}>
                  <Text
                    style={[
                      typography.title1,
                      { color: meta.color, fontWeight: '800' },
                    ]}
                  >
                    {luxValue} <Text style={[typography.subheadline, { color: colors.textSecondary }]}>lux</Text>
                  </Text>
                  <Text
                    style={[
                      typography.headline,
                      { color: colors.textPrimary, marginTop: 2 },
                    ]}
                  >
                    {meta.label}
                  </Text>
                </View>
              </View>

              {/* BARRA DE RANGOS */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.max(8, (luxValue / 1500) * 100))}%`,
                      backgroundColor: meta.color,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  typography.caption1,
                  { color: colors.textSecondary, marginTop: 8 },
                ]}
              >
                {meta.desc}
              </Text>
            </Card>

            {/* SELECTOR RÁPIDO DE AMBIENTES */}
            <Text
              style={[
                typography.subheadline,
                { color: colors.textPrimary, fontWeight: '700', marginTop: spacing.md, marginBottom: 8 },
              ]}
            >
              {t('Probar ambientes de tu hogar')}
            </Text>

            <View style={styles.presetsRow}>
              <TouchableOpacity
                onPress={() => setLuxValue(120)}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: luxValue < 250 ? colors.primaryLight : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Probar sombra de pasillo"
              >
                <Ionicons name="moon-outline" size={18} color={luxValue < 250 ? colors.primary : colors.textSecondary} />
                <Text style={[typography.caption2, { color: colors.textPrimary, marginTop: 4, fontWeight: '600' }]}>
                  {t('Sombra')}
                </Text>
                <Text style={[typography.caption2, { color: colors.textSecondary }]}>~120 lx</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setLuxValue(550)}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: luxValue >= 250 && luxValue <= 1000 ? colors.primaryLight : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Probar ventana con cortina"
              >
                <Ionicons name="partly-sunny-outline" size={18} color={luxValue >= 250 && luxValue <= 1000 ? colors.primary : colors.textSecondary} />
                <Text style={[typography.caption2, { color: colors.textPrimary, marginTop: 4, fontWeight: '600' }]}>
                  {t('Luz filtrada')}
                </Text>
                <Text style={[typography.caption2, { color: colors.textSecondary }]}>~550 lx</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setLuxValue(1400)}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: luxValue > 1000 ? colors.primaryLight : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Probar sol directo"
              >
                <Ionicons name="sunny" size={18} color={luxValue > 1000 ? colors.primary : colors.textSecondary} />
                <Text style={[typography.caption2, { color: colors.textPrimary, marginTop: 4, fontWeight: '600' }]}>
                  {t('Sol directo')}
                </Text>
                <Text style={[typography.caption2, { color: colors.textSecondary }]}>~1400 lx</Text>
              </TouchableOpacity>
            </View>

            {/* DIAGNÓSTICO Y CONSEJO */}
            <Card
              style={[
                styles.adviceCard,
                { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, marginTop: spacing.md },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="bulb-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>
                    {t('Consejo botánico')}
                  </Text>
                  <Text
                    style={[
                      typography.body,
                      { color: colors.textSecondary, marginTop: 4, lineHeight: 22 },
                    ]}
                  >
                    {meta.advice}
                  </Text>
                  {recommendedLight ? (
                    <Text
                      style={[
                        typography.footnote,
                        { color: colors.primary, marginTop: 8, fontWeight: '600' },
                      ]}
                    >
                      {t('Requisito oficial')}: {recommendedLight}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>

            <View style={{ marginTop: spacing.lg }}>
              <Button
                title={t('Entendido')}
                onPress={onClose}
                variant="primary"
                size="lg"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '92%',
    paddingTop: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meterCard: {
    padding: 16,
    borderRadius: 16,
  },
  gaugeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 5,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  adviceCard: {
    padding: 14,
    borderRadius: 12,
  },
});
