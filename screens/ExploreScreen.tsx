import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ScreenHeader } from '../components/ScreenHeader';
import { BlurTargetView, useBlurTarget } from '../components/GlassView';
import {
  searchEncyclopedia,
  DEFAULT_FILTERS,
} from '../services/encyclopediaService';
import { isPetSafe } from '../services/toxicityService';
import { useTranslation } from '../i18n';

export const ExploreScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const blurTargetRef = useBlurTarget();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [query, setQuery] = useState('');

  // Búsqueda en catálogo
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchEncyclopedia({ ...DEFAULT_FILTERS, query: query.trim() }).slice(0, 8);
  }, [query]);

  // Especies recomendadas para mostrar al inicio
  const popularPlants = useMemo(() => {
    return searchEncyclopedia(DEFAULT_FILTERS).slice(0, 6);
  }, []);

  const handleOpenPlant = (plantId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    navigation.navigate('PlantDetail', { plantId });
  };

  const handleOpenAssistant = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    navigation.navigate('Assistant');
  };

  const handleOpenEncyclopedia = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    navigation.navigate('Encyclopedia');
  };

  return (
    <BlurTargetView ref={blurTargetRef} style={styles.container}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: Math.max(insets.top, spacing.md),
          paddingBottom: 110 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          title={t('Explorar')}
          subtitle={t('Descubre plantas y consulta tus dudas con IA')}
        />

        {/* BARRA DE BÚSQUEDA DESTACADA */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: layout.borderRadius.md,
              minHeight: layout.minTouchTarget,
            },
          ]}
        >
          <Ionicons name="search" size={22} color={colors.textTertiary} style={{ marginLeft: 12 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('Buscar por nombre o familia...')}
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.searchInput,
              typography.body,
              { color: colors.textPrimary, minHeight: layout.minTouchTarget },
            ]}
            returnKeyType="search"
            accessibilityLabel={t('Buscar por nombre o familia...')}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [
                styles.clearBtn,
                { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
              ]}
              android_ripple={{ color: colors.border, borderless: true, radius: 18 }}
              accessibilityRole="button"
              accessibilityLabel={t('Limpiar')}
            >
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

      {/* RESULTADOS DE BÚSQUEDA SI HAY CONSULTA */}
      {query.trim().length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            {t('Resultados ({total})', { total: searchResults.length })}
          </Text>
          {searchResults.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {searchResults.map((plant) => (
                <Pressable
                  key={plant.id}
                  onPress={() => handleOpenPlant(plant.id)}
                  style={({ pressed }) => [
                    {
                      borderRadius: layout.borderRadius.lg,
                      overflow: 'hidden',
                      opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
                    },
                  ]}
                  android_ripple={{ color: colors.border, borderless: false }}
                  accessibilityRole="button"
                  accessibilityLabel={`${plant.name}. ${plant.scientificName}`}
                >
                  <Card elevated style={styles.plantResultCard}>
                    {plant.imageUri ? (
                      <Image source={{ uri: plant.imageUri }} style={styles.plantThumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.plantThumb, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary }]}>
                        <Text style={{ fontSize: 26 }}>{plant.avatarEmoji || '🌿'}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
                        {plant.name}
                      </Text>
                      <Text style={[typography.caption1, { color: colors.textTertiary, fontStyle: 'italic' }]}>
                        {plant.scientificName}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        <Badge label={plant.difficulty} variant="neutral" />
                        {isPetSafe(plant.id) && <Badge label={t('Segura para mascotas')} variant="success" />}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : (
            <Card style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="leaf-outline" size={32} color={colors.textTertiary} />
              <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 8 }]}>
                {t('No encontramos plantas con ese nombre.')}
              </Text>
            </Card>
          )}
        </View>
      ) : null}

      {/* TARJETA DESTACADA DEL ASISTENTE BOTÁNICO */}
      <Pressable
        onPress={handleOpenAssistant}
        accessibilityRole="button"
        accessibilityLabel={t('Pregúntale a EcoSan 🌿')}
        style={({ pressed }) => [
          {
            marginBottom: spacing.lg,
            borderRadius: 16,
            overflow: 'hidden',
            opacity: pressed && Platform.OS === 'ios' ? 0.88 : 1,
          },
        ]}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: false }}
      >
        <Card
          elevated
          style={[
            styles.assistantCard,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <View style={styles.assistantRow}>
            <View style={[styles.assistantIconBox, { backgroundColor: '#FFFFFF' }]}>
              <Ionicons name="chatbubbles" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Badge label={t('INTELIGENCIA BOTÁNICA')} variant="premium" />
              <Text style={[typography.title3, { color: '#FFFFFF', fontWeight: '700', marginTop: 4 }]}>
                {t('Pregúntale a EcoSan 🌿')}
              </Text>
              <Text style={[typography.footnote, { color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 }]}>
                {t('Consulta sobre riego, poda, plagas y toxicidad')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
        </Card>
      </Pressable>

      {/* ACCESO COMPLETO A LA ENCICLOPEDIA */}
      <View style={styles.sectionRow}>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>
          {t('Enciclopedia Botánica')}
        </Text>
        <Pressable
          onPress={handleOpenEncyclopedia}
          style={({ pressed }) => [
            styles.moreButton,
            { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
          ]}
          android_ripple={{ color: 'rgba(27, 106, 59, 0.12)', borderless: true }}
          accessibilityRole="button"
          accessibilityLabel={t('Ver catálogo completo')}
        >
          <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '600' }]}>
            {t('Ver todo')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      </View>

      {/* COLECCIONES POPULARES */}
      <View style={styles.collectionGrid}>
        <Pressable
          onPress={handleOpenEncyclopedia}
          style={({ pressed }) => [
            styles.collectionCard,
            {
              backgroundColor: colors.surface,
              borderRadius: layout.borderRadius.md,
              overflow: 'hidden',
              opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
            },
          ]}
          android_ripple={{ color: colors.border, borderless: false }}
          accessibilityRole="button"
          accessibilityLabel={t('Fáciles de cuidar')}
        >
          <View style={[styles.collectionIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="happy" size={22} color={colors.primary} />
          </View>
          <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600', marginTop: 8 }]}>
            {t('Fáciles de cuidar')}
          </Text>
          <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 2 }]}>
            {t('Ideales para principiantes')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleOpenEncyclopedia}
          style={({ pressed }) => [
            styles.collectionCard,
            {
              backgroundColor: colors.surface,
              borderRadius: layout.borderRadius.md,
              overflow: 'hidden',
              opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
            },
          ]}
          android_ripple={{ color: colors.border, borderless: false }}
          accessibilityRole="button"
          accessibilityLabel={t('Seguras para mascotas')}
        >
          <View style={[styles.collectionIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="paw" size={22} color="#2E7D32" />
          </View>
          <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600', marginTop: 8 }]}>
            {t('Seguras para mascotas')}
          </Text>
          <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 2 }]}>
            {t('Sin riesgo para perros y gatos')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleOpenEncyclopedia}
          style={({ pressed }) => [
            styles.collectionCard,
            {
              backgroundColor: colors.surface,
              borderRadius: layout.borderRadius.md,
              overflow: 'hidden',
              opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
            },
          ]}
          android_ripple={{ color: colors.border, borderless: false }}
          accessibilityRole="button"
          accessibilityLabel={t('Para interiores con sombra')}
        >
          <View style={[styles.collectionIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="sunny-outline" size={22} color={colors.accent} />
          </View>
          <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600', marginTop: 8 }]}>
            {t('Para interiores con sombra')}
          </Text>
          <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 2 }]}>
            {t('Prosperan con luz indirecta')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleOpenEncyclopedia}
          style={({ pressed }) => [
            styles.collectionCard,
            {
              backgroundColor: colors.surface,
              borderRadius: layout.borderRadius.md,
              overflow: 'hidden',
              opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
            },
          ]}
          android_ripple={{ color: colors.border, borderless: false }}
          accessibilityRole="button"
          accessibilityLabel={t('Resistentes a sequía')}
        >
          <View style={[styles.collectionIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="water-outline" size={22} color="#EF6C00" />
          </View>
          <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600', marginTop: 8 }]}>
            {t('Resistentes a sequía')}
          </Text>
          <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 2 }]}>
            {t('Requieren poco riego')}
          </Text>
        </Pressable>
      </View>

      {/* PLANTAS POPULARES */}
      <View style={[styles.sectionRow, { marginTop: spacing.lg }]}>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>
          {t('Especies Populares')}
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        {popularPlants.map((plant) => (
          <Pressable
            key={plant.id}
            onPress={() => handleOpenPlant(plant.id)}
            style={({ pressed }) => [
              {
                borderRadius: layout.borderRadius.lg,
                overflow: 'hidden',
                opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
              },
            ]}
            android_ripple={{ color: colors.border, borderless: false }}
            accessibilityRole="button"
            accessibilityLabel={`${plant.name}. ${plant.scientificName}`}
          >
            <Card elevated style={styles.plantResultCard}>
              {plant.imageUri ? (
                <Image source={{ uri: plant.imageUri }} style={styles.plantThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.plantThumb, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={{ fontSize: 26 }}>{plant.avatarEmoji || '🌿'}</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
                  {plant.name}
                </Text>
                <Text style={[typography.caption1, { color: colors.textTertiary, fontStyle: 'italic' }]}>
                  {plant.scientificName}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  <Badge label={plant.difficulty} variant="neutral" />
                  {isPetSafe(plant.id) && <Badge label={t('Segura para mascotas')} variant="success" />}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  </BlurTargetView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
  },
  clearBtn: {
    padding: 10,
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  plantThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  assistantCard: {
    padding: 16,
    borderRadius: 16,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assistantIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  collectionCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  collectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
