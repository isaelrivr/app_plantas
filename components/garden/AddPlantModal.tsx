import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useAppTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { ListRow } from '../ListRow';
import { Button } from '../Button';
import { useTranslation } from '../../i18n';

export interface AddPlantModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: () => void;
  onSearchCatalog: () => void;
  onAddManual: (plantName: string) => void;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  visible,
  onClose,
  onScan,
  onSearchCatalog,
  onAddManual,
}) => {
  const { colors, layout, spacing } = useAppTheme();
  const { t } = useTranslation();
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');

  const handleManualSubmit = () => {
    if (!manualName.trim()) return;
    onAddManual(manualName.trim());
    setManualName('');
    setManualMode(false);
    onClose();
  };

  const handleClose = () => {
    setManualMode(false);
    setManualName('');
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={manualMode ? t('Añadir planta por nombre') : t('Añadir nueva planta')}
      subtitle={manualMode ? t('Escribe el nombre de tu planta') : t('Elige cómo deseas agregarla a tu jardín')}
    >
      {manualMode ? (
        <View style={{ paddingTop: spacing.xs, paddingBottom: spacing.md }}>
          <TextInput
            value={manualName}
            onChangeText={setManualName}
            placeholder={t('Ej. Monstera, Pothos, Helecho...')}
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                borderColor: colors.border,
                borderRadius: layout.borderRadius.md,
                backgroundColor: colors.surfaceSecondary,
              },
            ]}
            autoFocus
            accessibilityLabel={t('Nombre de la planta')}
          />
          <View style={styles.manualActions}>
            <Button
              title={t('Volver')}
              onPress={() => setManualMode(false)}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.sm }} />
            <Button
              title={t('Guardar')}
              onPress={handleManualSubmit}
              disabled={!manualName.trim()}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <View style={{ paddingBottom: spacing.lg }}>
          <ListRow
            leadingIcon="camera"
            title={t('Escanear con la cámara')}
            subtitle={t('Identifica la especie y crea su ficha de cuidados')}
            onPress={() => {
              onClose();
              onScan();
            }}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <ListRow
            leadingIcon="search"
            title={t('Buscar en el catálogo')}
            subtitle={t('Explora la enciclopedia botánica')}
            onPress={() => {
              onClose();
              onSearchCatalog();
            }}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <ListRow
            leadingIcon="pencil"
            title={t('Añadir por nombre')}
            subtitle={t('Ingresa el nombre manualmente')}
            onPress={() => setManualMode(true)}
          />
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 17,
    marginTop: 8,
  },
  manualActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
});
