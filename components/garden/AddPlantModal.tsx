import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { ListRow } from '../ListRow';
import { Button } from '../Button';
import { useTranslation } from '../../i18n';
import { useSettings } from '../../context/SettingsContext';
import { getToxicity } from '../../services/toxicityService';
import { PotSize } from '../../context/GardenContext';

export interface ManualPlantData {
  name: string;
  nickname?: string;
  potSize?: PotSize;
  imageUri?: string;
}

export interface AddPlantModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: () => void;
  onSearchCatalog: () => void;
  onAddManual: (data: ManualPlantData | string) => void;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  visible,
  onClose,
  onScan,
  onSearchCatalog,
  onAddManual,
}) => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const { t } = useTranslation();
  const { hasPets } = useSettings();

  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedPot, setSelectedPot] = useState<PotSize>('medium');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  // Alerta de toxicidad si el usuario tiene mascotas
  const toxicityInfo = manualName.trim().length >= 3 ? getToxicity(manualName) : null;
  const isToxicAlert = Boolean(hasPets && toxicityInfo && toxicityInfo.pets === 'toxic');

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setImageUri(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Error al seleccionar imagen:', e);
    }
  };

  const handleManualSubmit = () => {
    if (!manualName.trim()) return;
    onAddManual({
      name: manualName.trim(),
      nickname: nickname.trim() || undefined,
      potSize: selectedPot,
      imageUri,
    });
    setManualName('');
    setNickname('');
    setImageUri(undefined);
    setManualMode(false);
    onClose();
  };

  const handleClose = () => {
    setManualMode(false);
    setManualName('');
    setNickname('');
    setImageUri(undefined);
    onClose();
  };

  const potOptions: { key: PotSize; label: string; icon: string; desc: string }[] = [
    { key: 'small', label: t('Pequeña'), icon: 'leaf-outline', desc: '10–15 cm' },
    { key: 'medium', label: t('Mediana'), icon: 'flower-outline', desc: '15–25 cm' },
    { key: 'large', label: t('Grande'), icon: 'planet-outline', desc: '25+ cm' },
    { key: 'planter', label: t('Jardinera'), icon: 'grid-outline', desc: 'Exterior' },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={manualMode ? t('Añadir planta manual') : t('Añadir nueva planta')}
      subtitle={manualMode ? t('Indica el nombre, apodo y maceta') : t('Elige cómo deseas agregarla a tu jardín')}
    >
      {manualMode ? (
        <View style={{ paddingTop: spacing.xs, paddingBottom: spacing.lg }}>
          {/* FOTO OPCIONAL */}
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            {imageUri ? (
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity
                  onPress={() => setImageUri(undefined)}
                  style={[styles.removePhotoButton, { backgroundColor: colors.surface }]}
                  accessibilityRole="button"
                  accessibilityLabel={t('Eliminar foto')}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                style={[
                  styles.addPhotoButton,
                  { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('Agregar foto opcional de tu planta')}
              >
                <Ionicons name="camera-outline" size={26} color={colors.primary} />
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 4 }]}>
                  {t('Foto opcional')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* NOMBRE DE ESPECIE */}
          <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: 4 }]}>
            {t('Nombre común o especie')} *
          </Text>
          <TextInput
            value={manualName}
            onChangeText={setManualName}
            placeholder={t('Ej. Monstera Deliciosa, Pothos...')}
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
            accessibilityLabel={t('Nombre de la planta')}
          />

          {/* APODO OPCIONAL */}
          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 4 }]}>
            {t('Apodo cariñoso (opcional)')}
          </Text>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('Ej. Matilda, La consentida...')}
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
            accessibilityLabel={t('Apodo opcional')}
          />

          {/* ALERTA DE MASCOTAS */}
          {isToxicAlert && (
            <View style={[styles.petAlertBox, { backgroundColor: '#FFF3E0', borderColor: '#FFB74D' }]}>
              <Ionicons name="warning" size={20} color="#E65100" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.caption1, { color: '#E65100', fontWeight: '700' }]}>
                  {t('Precaución para mascotas')}
                </Text>
                <Text style={[typography.caption2, { color: '#BF360C', marginTop: 2, lineHeight: 16 }]}>
                  {t('Esta planta suele ser tóxica para perros o gatos. Te recomendamos ubicarla en alto.')}
                </Text>
              </View>
            </View>
          )}

          {/* TAMAÑO DE MACETA */}
          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 6 }]}>
            {t('Tamaño de maceta')}
          </Text>
          <View style={styles.potRow}>
            {potOptions.map((opt) => {
              const selected = selectedPot === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSelectedPot(opt.key)}
                  style={[
                    styles.potOption,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primaryLight : colors.surfaceSecondary,
                      borderRadius: layout.borderRadius.md,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${opt.label}: ${opt.desc}`}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={20}
                    color={selected ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      typography.caption1,
                      { color: selected ? colors.primary : colors.textPrimary, fontWeight: selected ? '700' : '500', marginTop: 4 },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 2 }]}>
                    {opt.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ACCIONES */}
          <View style={styles.manualActions}>
            <Button
              title={t('Volver')}
              onPress={() => setManualMode(false)}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.sm }} />
            <Button
              title={t('Guardar en mi jardín')}
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
            subtitle={t('Escribe apodo, especie y tamaño de maceta')}
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
    minHeight: 48,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  manualActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  addPhotoButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 12,
  },
  petAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  potRow: {
    flexDirection: 'row',
    gap: 8,
  },
  potOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1.5,
    minHeight: 52,
  },
});
