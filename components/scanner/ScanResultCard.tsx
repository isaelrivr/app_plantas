import React from 'react';
import { StyleSheet, Text, Pressable, View, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Card } from '../Card';
import { Button } from '../Button';
import { StatusPill } from '../StatusPill';
import { ConfidenceRing } from '../ConfidenceRing';
import { PlantIdentificationResult, IdentificationCandidate } from '../../services/plantApi';
import { useTranslation } from '../../i18n';

export interface ScanResultCardProps {
  result: PlantIdentificationResult;
  candidate: IdentificationCandidate;
  photoUri?: string;
  isSaved: boolean;
  isSaving: boolean;
  onSaveToGarden: () => void;
  onViewCareSheet: () => void;
  onDiagnoseHealth: () => void;
  onViewHabitatMap: () => void;
  onScanAnother: () => void;
  onSelectCandidate: (candidate: IdentificationCandidate, index: number) => void;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({
  result,
  candidate,
  photoUri,
  isSaved,
  isSaving,
  onSaveToGarden,
  onViewCareSheet,
  onDiagnoseHealth,
  onViewHabitatMap,
  onScanAnother,
  onSelectCandidate,
}) => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const { t } = useTranslation();

  const confidence = Math.round(candidate.confidence);
  const certaintyWord =
    confidence >= 80 ? t('Muy seguro') : confidence >= 60 ? t('Probable') : t('No estoy seguro');
  const certaintyVariant =
    confidence >= 80 ? 'good' : confidence >= 60 ? 'warning' : 'neutral';

  const previewImage =
    candidate.referenceImages?.[0]?.full || candidate.referenceImages?.[0]?.small || photoUri;

  return (
    <View style={styles.container}>
      <Card
        variant="flat"
        style={[
          styles.mainCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: layout.borderRadius.lg,
          },
        ]}
      >
        {previewImage ? (
          <Image
            source={{ uri: previewImage }}
            style={[styles.heroImage, { borderRadius: layout.borderRadius.md }]}
            accessible
            accessibilityLabel={candidate.name}
          />
        ) : null}

        <View style={styles.headerInfo}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={[typography.title1, { color: colors.textPrimary, fontWeight: '800' }]}>
              {candidate.name}
            </Text>
            <Text
              style={[typography.subheadline, { color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 }]}
            >
              {candidate.scientificName}
            </Text>
            {candidate.family ? (
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Familia {familia}', { familia: candidate.family })}
              </Text>
            ) : null}
          </View>

          <ConfidenceRing score={confidence} size={64} strokeWidth={6} />
        </View>

        {/* Certeza explicada en palabras */}
        <View style={styles.certaintyRow}>
          <StatusPill
            label={`${certaintyWord} (${confidence}%)`}
            variant={certaintyVariant}
            size="md"
          />
        </View>

        {/* DOS ACCIONES PRINCIPALES */}
        <View style={styles.primaryActions}>
          <Button
            title={isSaved ? t('Guardada en Mi Jardín') : t('Guardar en mi jardín')}
            onPress={onSaveToGarden}
            disabled={isSaved || isSaving}
            loading={isSaving}
            variant="primary"
            size="lg"
            icon={
              isSaved ? (
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              ) : (
                <Ionicons name="leaf" size={20} color="#FFFFFF" />
              )
            }
          />

          <Button
            title={t('Ver cómo cuidarla')}
            onPress={onViewCareSheet}
            variant="secondary"
            size="lg"
            icon={<Ionicons name="book-outline" size={20} color={colors.primary} />}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        {/* ACCIONES SECUNDARIAS */}
        <View style={[styles.secondaryRow, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={onDiagnoseHealth}
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
            android_ripple={{ color: colors.primary + '18' }}
            accessibilityRole="button"
            accessibilityLabel={t('Diagnosticar salud')}
          >
            <Ionicons name="medkit-outline" size={18} color={colors.textSecondary} />
            <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 6, fontWeight: '600' }]}>
              {t('Revisar salud')}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            onPress={onViewHabitatMap}
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
            android_ripple={{ color: colors.primary + '18' }}
            accessibilityRole="button"
            accessibilityLabel={t('Ver origen en el mapa')}
          >
            <Ionicons name="earth-outline" size={18} color={colors.textSecondary} />
            <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 6, fontWeight: '600' }]}>
              {t('Mapa de origen')}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            onPress={onScanAnother}
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
            android_ripple={{ color: colors.primary + '20' }}
            accessibilityRole="button"
            accessibilityLabel={t('Escanear otra')}
          >
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
            <Text style={[typography.caption1, { color: colors.primary, marginLeft: 6, fontWeight: '700' }]}>
              {t('Escanear otra')}
            </Text>
          </Pressable>
        </View>
      </Card>

      {/* CANDIDATOS ALTERNATIVOS SI EXISTEN */}
      {result.candidates.length > 1 ? (
        <Card
          variant="flat"
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: layout.borderRadius.lg,
          }}
        >
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            {t('¿Otra opción? Elige la correcta:')}
          </Text>
          {result.candidates.slice(0, 4).map((alt, idx) => (
            <Pressable
              key={alt.id}
              onPress={() => onSelectCandidate(alt, idx)}
              style={({ pressed }) => [
                styles.candidateRow,
                {
                  borderColor: alt.id === candidate.id ? colors.primary : colors.border,
                  backgroundColor: alt.id === candidate.id ? colors.primaryLight : 'transparent',
                  borderRadius: layout.borderRadius.md,
                  overflow: 'hidden',
                  opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1,
                },
              ]}
              android_ripple={{ color: colors.primary + '20' }}
              accessibilityRole="radio"
              accessibilityState={{ selected: alt.id === candidate.id }}
              accessibilityLabel={t('Elegir opción: {nombre}', { nombre: alt.name })}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
                  {alt.name}
                </Text>
                <Text style={[typography.caption1, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                  {alt.scientificName}
                </Text>
              </View>
              <Text style={[typography.footnote, { color: colors.textTertiary, fontWeight: '700' }]}>
                {Math.round(alt.confidence)}%
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    padding: 16,
  },
  heroImage: {
    width: '100%',
    height: 220,
    marginBottom: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certaintyRow: {
    marginTop: 10,
    marginBottom: 16,
  },
  primaryActions: {
    marginTop: 4,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  divider: {
    width: 1,
    height: 20,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: 52,
  },
});
