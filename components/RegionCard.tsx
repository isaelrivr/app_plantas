import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitatRegionDetail } from '../services/habitatService';

interface RegionCardProps {
  plantName: string;
  region: HabitatRegionDetail;
  onClose: () => void;
  colors: { surface: string; border: string; textPrimary: string; textSecondary: string; primary: string };
  labels: { native: string; naturalized: string; cultivated: string; close: string };
}

export const RegionCard: React.FC<RegionCardProps> = ({ plantName, region, onClose, colors, labels }) => {
  const zoneLabel = region.zoneType === 'native' ? labels.native : region.zoneType === 'naturalized' ? labels.naturalized : labels.cultivated;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLiveRegion="polite">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{zoneLabel}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{plantName} · {region.countryName}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel={labels.close}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{region.climate}</Text>
      <Text style={[styles.note, { color: colors.textSecondary }]}>{region.biogeographicZone} · {region.elevationMeters}</Text>
      <Text style={[styles.note, { color: colors.textSecondary }]}>{region.notes}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { margin: 12, padding: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 10 },
  note: { fontSize: 12, lineHeight: 17, marginTop: 5 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
