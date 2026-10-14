import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { ListRow } from '../ListRow';
import { GardenPlant } from '../../context/GardenContext';
import { useTranslation } from '../../i18n';

export interface PlantActionSheetProps {
  visible: boolean;
  plant: GardenPlant | null;
  onClose: () => void;
  onWater: () => void;
  onChangeRoom: () => void;
  onViewDetails: () => void;
  onDelete: () => void;
}

export const PlantActionSheet: React.FC<PlantActionSheetProps> = ({
  visible,
  plant,
  onClose,
  onWater,
  onChangeRoom,
  onViewDetails,
  onDelete,
}) => {
  const { colors, spacing } = useAppTheme();
  const { t } = useTranslation();

  if (!plant) return null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={plant.name}
      subtitle={plant.scientificName}
    >
      <View style={{ paddingBottom: spacing.lg }}>
        <ListRow
          leadingIcon="water-outline"
          title={plant.isWateredToday ? t('Volver a regar') : t('Regar hoy')}
          subtitle={t('Registra el riego en tu historial')}
          onPress={() => {
            onClose();
            onWater();
          }}
        />
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <ListRow
          leadingIcon="home-outline"
          title={t('Mover de zona')}
          subtitle={t('Asigna esta planta a una habitación o espacio')}
          onPress={() => {
            onClose();
            onChangeRoom();
          }}
        />
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <ListRow
          leadingIcon="book-outline"
          title={t('Ver ficha de cuidados')}
          subtitle={t('Luz, riego, abono y toxicidad')}
          onPress={() => {
            onClose();
            onViewDetails();
          }}
        />
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <ListRow
          leadingIcon="trash-outline"
          title={t('Eliminar de Mi Jardín')}
          subtitle={t('Se quitará de tus cuidados diarios')}
          isDestructive
          showChevron={false}
          onPress={() => {
            onClose();
            onDelete();
          }}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
});
