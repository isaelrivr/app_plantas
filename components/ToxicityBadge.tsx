import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, ThemeColors } from '../theme';
import { useTranslation } from '../i18n';
import { getToxicity, toxicityLevelMeta, ToxicityLevel } from '../services/toxicityService';

interface ToxicityBadgeProps {
  speciesId: string;
  /** Muestra solo los chips, sin el resumen textual */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const levelVariant: Record<ToxicityLevel, { bg: keyof ThemeColors; fg: keyof ThemeColors }> = {
  safe: { bg: 'primaryLight', fg: 'primary' },
  caution: { bg: 'warningLight', fg: 'warning' },
  toxic: { bg: 'errorLight', fg: 'error' },
};

/**
 * Etiqueta de toxicidad para mascotas y niños. Se muestra en cada ficha.
 */
export const ToxicityBadge: React.FC<ToxicityBadgeProps> = ({ speciesId, compact = false, style }) => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const info = getToxicity(speciesId);

  const renderChip = (
    key: string,
    label: string,
    level: ToxicityLevel,
    icon: keyof typeof Ionicons.glyphMap
  ) => {
    const variant = levelVariant[level];
    const bg = colors[variant.bg];
    const fg = colors[variant.fg];
    return (
      <View
        key={key}
        style={[
          styles.chip,
          { backgroundColor: bg, borderRadius: layout.borderRadius.full, paddingHorizontal: spacing.sm },
        ]}
        accessible
        accessibilityLabel={`${label}: ${toxicityLevelMeta[level].label}`}
      >
        <Ionicons name={icon} size={13} color={fg} />
        <Text style={[styles.chipText, { color: fg }]}>
          {label} · {toxicityLevelMeta[level].shortLabel}
        </Text>
      </View>
    );
  };

  return (
    <View style={style} accessible={!compact} accessibilityLabel={info.summary}>
      <View style={styles.row}>
        {renderChip('pets', t('Mascotas'), info.pets, 'paw')}
        {renderChip('children', t('Niños'), info.children, 'happy-outline')}
      </View>
      {!compact ? (
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {info.summary}
        </Text>
      ) : null}
    </View>
  );
};

interface ToxicityPanelProps {
  speciesId: string;
  style?: StyleProp<ViewStyle>;
}

/** Detalle ampliado de toxicidad, para la ficha de la especie. */
export const ToxicityPanel: React.FC<ToxicityPanelProps> = ({ speciesId, style }) => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const info = getToxicity(speciesId);

  const rows: { key: string; label: string; level: ToxicityLevel; note: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'pets', label: t('Mascotas'), level: info.pets, note: info.petsNotes, icon: 'paw' },
    { key: 'children', label: t('Niños'), level: info.children, note: info.childrenNotes, icon: 'happy-outline' },
  ];

  return (
    <View style={[{ gap: spacing.sm }, style]}>
      {rows.map((row) => {
        const variant = levelVariant[row.level];
        const bg = colors[variant.bg];
        const fg = colors[variant.fg];
        return (
          <View
            key={row.key}
            style={[
              styles.panelRow,
              { backgroundColor: bg, borderRadius: layout.borderRadius.md, padding: spacing.sm },
            ]}
          >
            <Ionicons name={row.icon} size={20} color={fg} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.headline, { color: fg }]}>
                {row.label}: {toxicityLevelMeta[row.level].label}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                {row.note}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
