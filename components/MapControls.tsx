import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
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
  <View style={styles.container}>
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.border, overflow: 'hidden' },
        pressed && { opacity: 0.75 },
      ]}
      android_ripple={{ color: colors.border, borderless: false }}
      onPress={onZoomIn}
      accessibilityRole="button"
      accessibilityLabel={labels.zoomIn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="add" size={24} color={colors.textPrimary} />
    </Pressable>
    <Pressable
      disabled={!canZoomOut}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: canZoomOut ? (pressed ? 0.75 : 1) : 0.45,
          overflow: 'hidden',
        },
      ]}
      android_ripple={{ color: colors.border, borderless: false }}
      onPress={onZoomOut}
      accessibilityRole="button"
      accessibilityLabel={labels.zoomOut}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="remove" size={24} color={colors.textPrimary} />
    </Pressable>
    <Pressable
      style={({ pressed }) => [
        styles.reset,
        { backgroundColor: colors.surface, borderColor: colors.border, overflow: 'hidden' },
        pressed && { opacity: 0.75 },
      ]}
      android_ripple={{ color: colors.border, borderless: false }}
      onPress={onReset}
      accessibilityRole="button"
      accessibilityLabel={labels.reset}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="scan-outline" size={18} color={colors.primary} />
      <Text style={[styles.resetText, { color: colors.primary }]}>{labels.reset}</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: { position: 'absolute', right: 12, top: 12, gap: 10, alignItems: 'flex-end' },
  button: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  reset: { minHeight: 48, minWidth: 48, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  resetText: { fontSize: 14, fontWeight: '700' },
});
