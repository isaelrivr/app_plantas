import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canZoomOut: boolean;
  colors: { surface: string; border: string; textPrimary: string; primary: string };
  labels: { zoomIn: string; zoomOut: string; reset: string };
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn, onZoomOut, onReset, canZoomOut, colors, labels,
}) => (
  <View style={styles.container} accessibilityRole="toolbar" accessibilityLabel="Controles del mapa">
    <TouchableOpacity style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onZoomIn} accessibilityRole="button" accessibilityLabel={labels.zoomIn}>
      <Ionicons name="add" size={24} color={colors.textPrimary} />
    </TouchableOpacity>
    <TouchableOpacity disabled={!canZoomOut} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border, opacity: canZoomOut ? 1 : 0.45 }]} onPress={onZoomOut} accessibilityRole="button" accessibilityLabel={labels.zoomOut}>
      <Ionicons name="remove" size={24} color={colors.textPrimary} />
    </TouchableOpacity>
    <TouchableOpacity style={[styles.reset, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onReset} accessibilityRole="button" accessibilityLabel={labels.reset}>
      <Ionicons name="scan-outline" size={17} color={colors.primary} />
      <Text style={[styles.resetText, { color: colors.primary }]}>{labels.reset}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { position: 'absolute', right: 12, top: 12, gap: 8, alignItems: 'flex-end' },
  button: { width: 46, height: 46, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  reset: { minHeight: 44, paddingHorizontal: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 5 },
  resetText: { fontSize: 12, fontWeight: '700' },
});
