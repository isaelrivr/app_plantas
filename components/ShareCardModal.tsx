import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from '../i18n';
import { Button } from './Button';
import { Card } from './Card';
import { getToxicity, toxicityLevelMeta } from '../services/toxicityService';
import { getPlantImageSource } from '../services/plantAssets';

export interface ShareCardProps {
  visible: boolean;
  onClose: () => void;
  plant: {
    id: string;
    name: string;
    scientificName?: string;
    imageUri?: string;
    watering?: string;
    light?: string;
    healthScore?: number;
  };
}

export const ShareCardModal: React.FC<ShareCardProps> = ({
  visible,
  onClose,
  plant,
}) => {
  const { colors, typography, spacing, layout } = useAppTheme();
  const { t } = useTranslation();
  const { easyMode } = useSettings();

  const toxicity = getToxicity(plant.id);
  const toxMeta = toxicityLevelMeta[toxicity.pets];

  const handleShare = async () => {
    try {
      const message = [
        `🌿 ${plant.name}`,
        plant.scientificName ? `(${plant.scientificName})` : '',
        '',
        `💧 Riego: ${plant.watering || 'Moderado'}`,
        `☀️ Luz: ${plant.light || 'Indirecta'}`,
        `🐾 Seguridad mascotas: ${toxMeta.label}`,
        plant.healthScore ? `✨ Puntuación de salud: ${plant.healthScore}/100` : '',
        '',
        'Cuidada con EcoScan 🌱',
      ]
        .filter(Boolean)
        .join('\n');

      await Share.share({
        title: plant.name,
        message,
      });
    } catch {
      // Ignorar si el usuario cancela la hoja de compartir
    }
  };

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
          {/* BARRA SUPERIOR CON CERRAR */}
          <View style={styles.sheetHeader}>
            <Text
              style={[
                typography.headline,
                { color: colors.textPrimary, fontSize: easyMode ? 20 : 18 },
              ]}
            >
              {t('Compartir ficha de planta')}
            </Text>
            <Pressable
              onPress={onClose}
              android_ripple={{ color: colors.border, borderless: true, radius: 24 }}
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={t('Cerrar')}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: spacing.md, paddingBottom: 24 }}
          >
            {/* VISTA PREVIA DE LA TARJETA COMPARTIBLE */}
            <Card
              elevated
              style={[
                styles.previewCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: layout.borderRadius.lg,
                },
              ]}
            >
              {(() => {
                const source = getPlantImageSource(plant.imageUri, plant.id);
                return source ? (
                  <Image
                    source={source}
                    style={[
                      styles.previewImage,
                      { borderRadius: layout.borderRadius.md },
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.previewImageFallback,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Ionicons name="leaf" size={48} color={colors.primary} />
                  </View>
                );
              })()}

              <View style={{ marginTop: spacing.md }}>
                <Text
                  style={[
                    typography.title2,
                    { color: colors.textPrimary, fontWeight: '700' },
                  ]}
                >
                  {plant.name}
                </Text>
                {plant.scientificName ? (
                  <Text
                    style={[
                      typography.footnote,
                      { color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
                    ]}
                  >
                    {plant.scientificName}
                  </Text>
                ) : null}

                <View style={styles.badgesRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          toxicity.pets === 'safe'
                            ? colors.successLight
                            : toxicity.pets === 'caution'
                            ? colors.warningLight
                            : colors.errorLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={toxMeta.icon as any}
                      size={14}
                      color={
                        toxicity.pets === 'safe'
                          ? colors.success
                          : toxicity.pets === 'caution'
                          ? colors.warning
                          : colors.error
                      }
                    />
                    <Text
                      style={[
                        typography.caption2,
                        {
                          color:
                            toxicity.pets === 'safe'
                              ? colors.success
                              : toxicity.pets === 'caution'
                              ? colors.warning
                              : colors.error,
                          marginLeft: 4,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {toxMeta.label}
                    </Text>
                  </View>

                  {plant.healthScore ? (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.primaryLight, marginLeft: 8 },
                      ]}
                    >
                      <Ionicons name="sparkles" size={14} color={colors.primary} />
                      <Text
                        style={[
                          typography.caption2,
                          { color: colors.primary, marginLeft: 4, fontWeight: '600' },
                        ]}
                      >
                        {plant.healthScore}/100
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.infoRow, { marginTop: spacing.md }]}>
                  <Ionicons name="water-outline" size={18} color={colors.primary} />
                  <Text
                    style={[
                      typography.caption1,
                      { color: colors.textSecondary, marginLeft: 8, flex: 1 },
                    ]}
                    numberOfLines={2}
                  >
                    {plant.watering || t('Riego periódico')}
                  </Text>
                </View>

                <View style={[styles.infoRow, { marginTop: 6 }]}>
                  <Ionicons name="sunny-outline" size={18} color={colors.warning} />
                  <Text
                    style={[
                      typography.caption1,
                      { color: colors.textSecondary, marginLeft: 8, flex: 1 },
                    ]}
                    numberOfLines={2}
                  >
                    {plant.light || t('Luz indirecta')}
                  </Text>
                </View>
              </View>
            </Card>

            <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
              <Button
                title={t('Compartir con amigos')}
                onPress={handleShare}
                variant="primary"
                size="lg"
                icon={<Ionicons name="share-social" size={20} color="#FFFFFF" />}
              />
              <Button
                title={t('Cancelar')}
                onPress={onClose}
                variant="ghost"
                size="md"
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
    maxHeight: '90%',
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
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: 180,
  },
  previewImageFallback: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
