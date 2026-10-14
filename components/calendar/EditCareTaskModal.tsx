import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../theme';
import { useTranslation } from '../../i18n';
import { BottomSheet } from '../BottomSheet';
import { CareTask } from '../../context/GardenContext';

interface EditCareTaskModalProps {
  visible: boolean;
  task: (CareTask & { plantId: string; plantName: string }) | null;
  onClose: () => void;
  onSave: (updates: { title?: string; dueDate?: string; repeatIntervalDays?: number }) => void;
  onDelete: () => void;
}

const DUE_PRESETS = [
  { label: 'Hoy', value: 'Hoy' },
  { label: 'Mañana', value: 'Mañana' },
  { label: 'En 3 días', value: 'En 3 días' },
  { label: 'En 7 días', value: 'En 7 días' },
  { label: 'En 14 días', value: 'En 14 días' },
  { label: 'En 1 mes', value: 'En 1 mes' },
];

const REPEAT_PRESETS = [
  { label: 'Sin repetición', value: 0 },
  { label: 'Cada 3 días', value: 3 },
  { label: 'Cada 7 días (semanal)', value: 7 },
  { label: 'Cada 14 días (quincenal)', value: 14 },
  { label: 'Cada 30 días (mensual)', value: 30 },
];

interface FormProps {
  task: CareTask & { plantId: string; plantName: string };
  onClose: () => void;
  onSave: (updates: { title?: string; dueDate?: string; repeatIntervalDays?: number }) => void;
  onDelete: () => void;
}

const EditCareTaskForm: React.FC<FormProps> = ({ task, onClose, onSave, onDelete }) => {
  const { colors, typography, spacing } = useAppTheme();
  const { t } = useTranslation();

  const [title, setTitle] = useState(task.title || '');
  const [dueDate, setDueDate] = useState(task.dueDate || 'Hoy');
  const [repeatInterval, setRepeatInterval] = useState<number>(task.repeatIntervalDays ?? 7);

  const handleSave = () => {
    try { Haptics.selectionAsync(); } catch {}
    onSave({
      title: title.trim() || task.title,
      dueDate,
      repeatIntervalDays: repeatInterval,
    });
    onClose();
  };

  const handleDelete = () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    onDelete();
    onClose();
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
        {t('Planta')}: {task.plantName}
      </Text>

      {/* TÍTULO DE LA TAREA */}
      <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700', marginTop: spacing.sm }]}>
        {t('Nombre de la tarea')}
      </Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('Ej. Regar')}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary,
          },
        ]}
        accessibilityLabel={t('Nombre de la tarea')}
      />

      {/* PRÓXIMA FECHA */}
      <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs }]}>
        {t('Próxima fecha')}
      </Text>
      <View style={styles.presetsWrap}>
        {DUE_PRESETS.map((preset) => {
          const isSelected = dueDate.toLowerCase() === preset.value.toLowerCase();
          return (
            <TouchableOpacity
              key={preset.value}
              onPress={() => {
                try { Haptics.selectionAsync(); } catch {}
                setDueDate(preset.value);
              }}
              style={[
                styles.presetChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  typography.subheadline,
                  { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontWeight: isSelected ? '700' : '500' },
                ]}
              >
                {t(preset.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* FRECUENCIA / REPETICIÓN */}
      <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs }]}>
        {t('Frecuencia')}
      </Text>
      <View style={styles.presetsWrap}>
        {REPEAT_PRESETS.map((preset) => {
          const isSelected = repeatInterval === preset.value;
          return (
            <TouchableOpacity
              key={preset.value}
              onPress={() => {
                try { Haptics.selectionAsync(); } catch {}
                setRepeatInterval(preset.value);
              }}
              style={[
                styles.presetChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  typography.subheadline,
                  { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontWeight: isSelected ? '700' : '500' },
                ]}
              >
                {t(preset.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* BOTÓN GUARDAR */}
      <TouchableOpacity
        onPress={handleSave}
        style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: spacing.xl }]}
        accessibilityRole="button"
        accessibilityLabel={t('Guardar cambios')}
      >
        <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={[typography.headline, { color: '#FFFFFF', fontWeight: '700' }]}>
          {t('Guardar cambios')}
        </Text>
      </TouchableOpacity>

      {/* BOTÓN DESACTIVAR / ELIMINAR */}
      <TouchableOpacity
        onPress={handleDelete}
        style={[styles.deleteBtn, { borderColor: colors.error, marginTop: spacing.sm }]}
        accessibilityRole="button"
        accessibilityLabel={t('Desactivar esta tarea')}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} style={{ marginRight: 6 }} />
        <Text style={[typography.subheadline, { color: colors.error, fontWeight: '600' }]}>
          {t('Desactivar tarea')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export const EditCareTaskModal: React.FC<EditCareTaskModalProps> = ({
  visible,
  task,
  onClose,
  onSave,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('Editar tarea de cuidado')}>
      {task ? (
        <EditCareTaskForm
          key={task.id}
          task={task}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      ) : null}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    marginTop: 6,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
