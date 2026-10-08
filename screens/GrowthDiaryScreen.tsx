import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SkeletonBox } from '../components/SkeletonLoader';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { getPlantById } from '../services/plantApi';
import { useGarden } from '../context/GardenContext';
import {
  getGrowthEntries,
  getGrowthComparison,
  addGrowthEntry,
  formatEntryDate,
  GrowthEntry,
} from '../services/growthDiaryService';

export const GrowthDiaryScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { plants } = useGarden();

  const plantId: string = route.params?.plantId ?? 'monstera';
  const plantDef = getPlantById(plantId);
  const gardenPlant = plants.find((p) => p.id === plantId);
  const plantName = plantDef?.name ?? gardenPlant?.name ?? 'Mi planta';

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [note, setNote] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setEntries(getGrowthEntries(plantId));
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [plantId]);

  const comparison = useMemo(() => getGrowthComparison(plantId), [plantId, entries]);

  const handleAddPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setPendingPhoto(result.assets[0].uri);
      setNote('');
      setModalVisible(true);
    } catch {
      // silencioso
    }
  };

  const handleSaveEntry = () => {
    if (!pendingPhoto) return;
    const created = addGrowthEntry(plantId, {
      date: new Date().toISOString(),
      photoUri: pendingPhoto,
      note: note.trim() || 'Nuevo registro de crecimiento.',
    });
    setEntries((prev) => [created, ...prev]);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    setModalVisible(false);
    setPendingPhoto(null);
  };

  const renderDelta = (label: string, value: number | null, suffix: string) => {
    if (value == null) return null;
    const positive = value >= 0;
    return (
      <View style={[styles.deltaChip, { backgroundColor: positive ? colors.primaryLight : colors.surfaceSecondary }]}>
        <Ionicons
          name={positive ? 'trending-up' : 'trending-down'}
          size={14}
          color={positive ? colors.primary : colors.textSecondary}
        />
        <Text style={[typography.caption1, { color: positive ? colors.primary : colors.textSecondary, marginLeft: 4, fontWeight: '700' }]}>
          {positive ? '+' : ''}{value}{suffix}
        </Text>
        <Text style={[typography.caption2, { color: colors.textTertiary, marginLeft: 4 }]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === 'ios' ? 12 : 16,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>Atrás</Text>
        </TouchableOpacity>
        <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
          Diario de Crecimiento
        </Text>
        <View style={styles.actionHeaderBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}>
        <Text style={[typography.title2, { color: colors.textPrimary }]}>{plantName}</Text>
        <Text style={[typography.subheadline, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          {entries.length} registros · sigue la evolución de tu planta
        </Text>

        {loading ? (
          <>
            <SkeletonBox width="100%" height={240} borderRadius={18} />
            <SkeletonBox width="100%" height={80} borderRadius={14} style={{ marginTop: spacing.md }} />
            <SkeletonBox width="100%" height={80} borderRadius={14} style={{ marginTop: spacing.sm }} />
          </>
        ) : entries.length === 0 ? (
          <Card style={{ alignItems: 'center' }}>
            <Ionicons name="camera-outline" size={40} color={colors.textTertiary} />
            <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.sm }]}>
              Aún no hay registros
            </Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
              Añade tu primera foto para empezar a documentar el crecimiento.
            </Text>
          </Card>
        ) : (
          <>
            {comparison.before && comparison.after && comparison.before.id !== comparison.after.id ? (
              <Card style={{ padding: 0, overflow: 'hidden', marginBottom: spacing.md }}>
                <BeforeAfterSlider
                  beforeUri={comparison.before.photoUri}
                  afterUri={comparison.after.photoUri}
                  height={240}
                />
                <View style={{ padding: spacing.md }}>
                  <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                    {comparison.daysBetween} días de diferencia
                  </Text>
                  <View style={styles.deltaRow}>
                    {renderDelta('altura', comparison.heightDeltaCm, ' cm')}
                    {renderDelta('hojas', comparison.leafDelta, '')}
                  </View>
                </View>
              </Card>
            ) : null}

            <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.sm, marginBottom: spacing.sm }]}>
              Línea de tiempo
            </Text>
            {entries.map((entry) => (
              <Card key={entry.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.entryRow}>
                  <Image
                    source={{ uri: entry.photoUri }}
                    style={[styles.thumb, { borderRadius: layout.borderRadius.md }]}
                    accessible
                    accessibilityLabel={`Foto del ${formatEntryDate(entry.date)}`}
                  />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.footnote, { color: colors.textTertiary }]}>
                      {formatEntryDate(entry.date)}
                    </Text>
                    <Text style={[typography.callout, { color: colors.textPrimary, marginTop: 2 }]}>
                      {entry.note}
                    </Text>
                    <View style={styles.deltaRow}>
                      {entry.heightCm != null ? (
                        <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                          📏 {entry.heightCm} cm
                        </Text>
                      ) : null}
                      {entry.leafCount != null ? (
                        <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 10 }]}>
                          🍃 {entry.leafCount} hojas
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        <Button
          title="Añadir foto al diario"
          onPress={handleAddPhoto}
          variant="primary"
          icon={<Ionicons name="add" size={18} color="#FFFFFF" />}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={{ width: '100%' }} elevated>
            <Text style={[typography.title3, { color: colors.textPrimary }]}>Nueva entrada</Text>
            {pendingPhoto ? (
              <Image source={{ uri: pendingPhoto }} style={[styles.previewImage, { borderRadius: layout.borderRadius.md }]} />
            ) : null}
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="¿Qué observas? (nueva hoja, trasplante...)"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  borderRadius: layout.borderRadius.md,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              accessibilityLabel="Nota de la entrada"
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={() => setModalVisible(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <View style={{ width: spacing.sm }} />
              <Button title="Guardar" onPress={handleSaveEntry} variant="primary" style={{ flex: 1 }} />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  actionHeaderBtn: { width: 60 },
  deltaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  deltaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  entryRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 72, height: 72 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  previewImage: { width: '100%', height: 160, marginTop: 12 },
  input: {
    marginTop: 12,
    minHeight: 72,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  modalActions: { flexDirection: 'row', marginTop: 16 },
});
