import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { GardenPlant } from '../../context/GardenContext';
import { StatusPill } from '../StatusPill';
import { Card } from '../Card';
import { useTranslation } from '../../i18n';
import { getPlantById, resolveSpeciesId } from '../../services/plantApi';

export interface GardenPlantCardProps {
  plant: GardenPlant;
  roomName?: string;
  onPress: () => void;
  onWater: () => void;
  onOptionsPress: () => void;
}

export const GardenPlantCard: React.FC<GardenPlantCardProps> = ({
  plant,
  roomName,
  onPress,
  onWater,
  onOptionsPress,
}) => {
  const { colors, layout, typography } = useAppTheme();
  const { t } = useTranslation();

  const speciesId = resolveSpeciesId(plant.name, plant.scientificName) ?? 'monstera';
  const catalogPlant = getPlantById(speciesId);
  const photoUri = plant.imageUri || catalogPlant?.imageUri;

  const isWatered = plant.isWateredToday;

  return (
    <Card elevated style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`${plant.name}, ${roomName ? `${roomName}.` : ''} ${isWatered ? t('Todo bien') : t('Necesita agua')}`}
        style={styles.touchArea}
      >
        <View style={styles.topRow}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={[styles.plantImage, { borderRadius: layout.borderRadius.md }]}
              accessible
              accessibilityLabel={t('Foto de {nombre}', { nombre: plant.name })}
            />
          ) : (
            <View
              style={[
                styles.plantAvatar,
                { backgroundColor: colors.primaryLight, borderRadius: layout.borderRadius.md },
              ]}
            >
              <Text style={{ fontSize: 32 }}>{plant.avatarEmoji || '🌿'}</Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[typography.title3, { color: colors.textPrimary, fontWeight: '800', flex: 1 }]}
                numberOfLines={1}
              >
                {plant.name}
              </Text>
              <TouchableOpacity
                onPress={onOptionsPress}
                accessibilityRole="button"
                accessibilityLabel={t('Opciones de {nombre}', { nombre: plant.name })}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.moreButton}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              style={[typography.caption1, { color: colors.textTertiary, fontStyle: 'italic', marginTop: 1 }]}
              numberOfLines={1}
            >
              {plant.scientificName}
            </Text>

            <View style={styles.statusRow}>
              <StatusPill
                label={isWatered ? t('Todo bien') : t('Necesita agua')}
                variant={isWatered ? 'good' : 'water'}
                size="sm"
              />
              {roomName ? (
                <Text style={[typography.caption2, { color: colors.textSecondary, marginLeft: 8 }]}>
                  {roomName}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Barra de acción rápida de riego */}
        <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={onWater}
            activeOpacity={0.8}
            style={[
              styles.waterButton,
              {
                backgroundColor: isWatered ? colors.primaryLight : colors.primary,
                minHeight: layout.minTouchTarget,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isWatered ? t('Hidratada hoy') : t('Regar hoy')}
          >
            <Ionicons
              name={isWatered ? 'checkmark-circle' : 'water'}
              size={18}
              color={isWatered ? colors.primaryDark : '#FFFFFF'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                typography.subheadline,
                {
                  color: isWatered ? colors.primaryDark : '#FFFFFF',
                  fontWeight: '700',
                },
              ]}
            >
              {isWatered ? t('Hidratada hoy') : t('Regar hoy')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 14,
  },
  touchArea: {
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantImage: {
    width: 80,
    height: 80,
  },
  plantAvatar: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moreButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionRow: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
});
