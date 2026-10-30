import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useFloatingBarMetrics } from '../hooks/useFloatingBarMetrics';
import { useGarden, GardenPlant } from '../context/GardenContext';
import { useFeedback } from '../context/FeedbackContext';
import { useSettings } from '../context/SettingsContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatusPill } from '../components/StatusPill';
import { getLocalWeatherAndRecommendations, WeatherData } from '../services/weatherService';
import { isGeminiDirectAvailable, getOrFetchDailyGardenAdvice } from '../services/geminiService';
import { announce } from '../services/accessibilityService';
import { useTranslation } from '../i18n';

export const TodayScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { plants, rooms, stats, waterPlantToday, undoWaterPlant } = useGarden();
  const { userGoal } = useSettings();
  const { showToast } = useFeedback();
  const { t } = useTranslation();

  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getLocalWeatherAndRecommendations();
        if (mounted && res?.weather) {
          setWeather(res.weather);
        }
      } catch {
        // Fallback silencioso
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Saludo según la hora
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Buenos días');
    if (hour < 19) return t('Buenas tardes');
    return t('Buenas noches');
  }, [t]);

  // Fecha legible
  const formattedDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  // Plantas que necesitan riego hoy
  const plantsNeedingWater = useMemo(() => {
    return plants.filter((p) => !p.isWateredToday);
  }, [plants]);

  // Consejo diario agronómico con IA (Gemini)
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAiAdvice, setLoadingAiAdvice] = useState<boolean>(false);

  const loadAiAdvice = async (force = false) => {
    if (!isGeminiDirectAvailable()) return;
    setLoadingAiAdvice(true);
    try {
      const advice = await getOrFetchDailyGardenAdvice(
        {
          plantsCount: plants.length,
          plantsNeedingWater: plantsNeedingWater.map((p) => p.name),
          totalPlantsSummary: plants.slice(0, 4).map((p) => p.name),
          weather: weather
            ? {
                city: weather.city,
                temperatureC: weather.temperatureC,
                weatherDescription: weather.weatherDescription,
              }
            : null,
        },
        force
      );
      setAiAdvice(advice);
    } catch {
      // Fallback
    } finally {
      setLoadingAiAdvice(false);
    }
  };

  useEffect(() => {
    void loadAiAdvice();
  }, [plants.length, weather?.city]);

  const handleWaterSingle = (plant: GardenPlant) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const prevWatered = plant.lastWatered;
    const prevIsWatered = plant.isWateredToday;
    waterPlantToday(plant.id);
    announce(t('Planta {nombre} regada correctamente', { nombre: plant.name }));
    showToast({
      message: t('Regaste {nombre}', { nombre: plant.name }),
      actionLabel: t('Deshacer'),
      durationMs: 5000,
      onAction: () => {
        undoWaterPlant(plant.id, prevWatered, prevIsWatered);
        announce(t('Riego deshecho'));
      },
    });
  };

  // Frase de motivación según objetivo de Onboarding
  const goalMotivation = useMemo(() => {
    if (userGoal === 'cure') {
      return t('Revisa la salud de tus hojas para prevenir plagas');
    }
    if (userGoal === 'identify') {
      return t('Sigue ampliando tu jardín con nuevas especies');
    }
    return t('Tus plantas agradecen el riego a tiempo');
  }, [userGoal, t]);

  const { tabBarClearance } = useFloatingBarMetrics();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: Math.max(insets.top, spacing.md),
          paddingBottom: tabBarClearance,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={t('Hoy')}
          subtitle={formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
          rightAction={
            <Pressable
              onPress={() => navigation.navigate('CareCalendar')}
              accessibilityRole="button"
              accessibilityLabel={t('Abrir calendario de cuidados')}
              style={({ pressed }) => [
                styles.calendarHeaderBtn,
                {
                  borderRadius: layout.borderRadius.full,
                  overflow: 'hidden',
                  opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1,
                },
              ]}
              android_ripple={{ color: colors.primaryContainer, borderless: true, radius: 22 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            </Pressable>
          }
        />

        {/* SALUDO Y MOTIVACIÓN */}
        <View style={{ marginBottom: spacing.sm, paddingHorizontal: spacing.xxs }}>
          <Text style={[typography.title2, { color: colors.textPrimary, fontWeight: '800' }]}>
            {greeting}
          </Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 4 }]}>
            {goalMotivation}
          </Text>
        </View>

        {/* CLIMA EN UNA SOLA LÍNEA CON UBICACIÓN */}
        {weather && weather.city ? (
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={({ pressed }) => [
              styles.weatherOneLine,
              {
                backgroundColor: colors.surfaceContainer,
                borderRadius: layout.borderRadius.full,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                overflow: 'hidden',
                opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1,
              },
            ]}
            android_ripple={{ color: colors.outlineVariant, borderless: false }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('Ubicación: {ciudad}. Clima: {temp} grados, {desc}. Toca para ver ajustes de clima.', {
              ciudad: weather.city,
              temp: Math.round(weather.temperatureC),
              desc: weather.weatherDescription,
            })}
          >
            <Ionicons name="location-sharp" size={15} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[typography.footnote, { color: colors.textPrimary, fontWeight: '700' }]} numberOfLines={1}>
              {weather.city}
            </Text>
            <Text style={[typography.footnote, { color: colors.textTertiary, marginHorizontal: 6 }]}>
              ·
            </Text>
            <Ionicons
              name={
                weather.weatherIcon === 'rainy'
                  ? 'rainy-outline'
                  : weather.weatherIcon === 'cloudy'
                  ? 'cloudy-outline'
                  : weather.weatherIcon === 'partly-sunny'
                  ? 'partly-sunny-outline'
                  : 'sunny-outline'
              }
              size={15}
              color={colors.accent}
              style={{ marginRight: 4 }}
            />
            <Text style={[typography.footnote, { color: colors.textSecondary }]} numberOfLines={1}>
              {Math.round(weather.temperatureC)}°C · {weather.weatherDescription}
            </Text>
          </Pressable>
        ) : null}

      {/* RACHA DE CUIDADOS DISCRETA */}
      <View style={[styles.streakRow, { marginBottom: spacing.md }]}>
        <View
          style={[
            styles.streakBadge,
            { backgroundColor: colors.secondaryContainer, borderRadius: layout.borderRadius.full },
          ]}
          accessible
          accessibilityLabel={t('{dias} días cuidando tus plantas', { dias: Math.max(1, stats.currentStreak) })}
        >
          <Ionicons name="flame" size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[typography.footnote, { color: colors.onSecondaryContainer, fontWeight: '700' }]}>
            {t('{dias} días cuidando tus plantas', { dias: Math.max(1, stats.currentStreak) })}
          </Text>
        </View>
      </View>

      {/* ASESOR BOTÁNICO INTELIGENTE IA (GEMINI) */}
      {aiAdvice ? (
        <Card
          variant="flat"
          style={{
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
            borderWidth: 1,
            borderRadius: layout.borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[typography.caption1, { color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }]}>
                {t('Asesor Botánico IA')}
              </Text>
            </View>
            <Pressable
              onPress={() => loadAiAdvice(true)}
              disabled={loadingAiAdvice}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={t('Actualizar consejo de IA')}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={loadingAiAdvice ? colors.primary : colors.textTertiary}
              />
            </Pressable>
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, lineHeight: 22 }]}>
            {aiAdvice}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Assistant')}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: spacing.sm,
                alignSelf: 'flex-start',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('Preguntar al asistente IA')}
          >
            <Text style={[typography.caption1, { color: colors.primary, fontWeight: '700', marginRight: 4 }]}>
              {t('Consultar a la IA')}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </Pressable>
        </Card>
      ) : null}

      {/* ESTADO CON PLANTAS VS. ESTADO VACÍO */}
      {plants.length === 0 ? (
        <Card
          variant="filled"
          style={[
            styles.emptyGardenCard,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
              borderWidth: 1,
              borderRadius: layout.borderRadius.lg,
            },
          ]}
        >
          <View style={[styles.emptyGardenIcon, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="leaf" size={48} color={colors.primary} />
          </View>
          <Text style={[typography.title2, { color: colors.textPrimary, fontWeight: '800', textAlign: 'center' }]}>
            {t('Tu jardín está esperando')}
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: spacing.xl, lineHeight: 22 },
            ]}
          >
            {t('Añade tu primera planta para comenzar a programar recordatorios de riego y monitorear su salud.')}
          </Text>

          <Button
            title={t('Escanea tu primera planta')}
            onPress={() => navigation.navigate('Scan')}
            variant="filled"
            size="lg"
            icon={<Ionicons name="camera" size={22} color={colors.onPrimary} />}
            style={styles.hugeButton}
          />

          <Pressable
            onPress={() => navigation.navigate('Encyclopedia')}
            style={({ pressed }) => [
              styles.searchByNameLink,
              { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
            android_ripple={{ color: colors.primaryContainer, borderless: true }}
            accessibilityRole="button"
            accessibilityLabel={t('o búscala por nombre')}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          >
            <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '700' }]}>
              {t('o búscala por nombre')}
            </Text>
          </Pressable>
        </Card>
      ) : (
        <>
          {/* LISTA DE TAREAS DEL DÍA EN TARJETAS GRANDES */}
          <View style={styles.sectionHeader}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>
              {t('Tareas de Hoy')}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('CareCalendar')}
              accessibilityRole="button"
              accessibilityLabel={t('Ver calendario completo')}
              style={({ pressed }) => [
                styles.textButton,
                { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
              ]}
              android_ripple={{ color: colors.primaryContainer, borderless: true }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '600' }]}>
                {t('Ver calendario')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginLeft: 2 }} />
            </Pressable>
          </View>

          {plantsNeedingWater.length > 0 ? (
            <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
              {plantsNeedingWater.map((plant) => {
                const roomName = rooms.find((r) => r.id === plant.roomId)?.name || t('Mi Jardín');
                return (
                  <Card
                    key={plant.id}
                    variant="filled"
                    style={[
                      styles.bigTaskCard,
                      {
                        backgroundColor: colors.surfaceContainerLow,
                        borderColor: colors.outlineVariant,
                        borderWidth: 1,
                        borderRadius: layout.borderRadius.lg,
                      },
                    ]}
                  >
                    <View style={styles.bigTaskHeader}>
                      <View style={[styles.taskAvatarCircle, { backgroundColor: colors.primaryContainer }]}>
                        <Ionicons name="water" size={26} color={colors.info} />
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[typography.title3, { color: colors.textPrimary, fontWeight: '800' }]} numberOfLines={1}>
                          {t('Regar {nombre}', { nombre: plant.name })}
                        </Text>
                        <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                          {roomName} · {t('Cada {dias} días', { dias: plant.wateringFrequencyDays })}
                        </Text>
                      </View>
                      <StatusPill label={t('Necesita agua')} variant="water" size="sm" />
                    </View>

                    <Button
                      title={t('Ya la regué')}
                      onPress={() => handleWaterSingle(plant)}
                      variant="filled"
                      size="lg"
                      icon={<Ionicons name="checkmark-circle" size={20} color={colors.onPrimary} />}
                      style={{ marginTop: spacing.md }}
                    />
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card
              variant="filled"
              style={[
                styles.allDoneCard,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant,
                  borderWidth: 1,
                  borderRadius: layout.borderRadius.lg,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              <View style={[styles.allDoneIcon, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="checkmark-circle" size={36} color={colors.primary} />
              </View>
              <Text style={[typography.title3, { color: colors.textPrimary, fontWeight: '700', marginTop: spacing.sm }]}>
                {t('Todo al día en tu jardín')}
              </Text>
              <Text style={[typography.subheadline, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
                {t('Has completado todos los riegos de hoy. Tus plantas están felices.')}
              </Text>
            </Card>
          )}

          {/* ACCIÓN RÁPIDA: ESCANEAR */}
          <Pressable
            onPress={() => navigation.navigate('Scan')}
            accessibilityRole="button"
            accessibilityLabel={t('Identificar o revisar una nueva planta')}
            style={({ pressed }) => [
              {
                marginBottom: spacing.md,
                borderRadius: layout.borderRadius.lg,
                overflow: 'hidden',
                opacity: pressed && Platform.OS === 'ios' ? 0.85 : 1,
              },
            ]}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: false }}
          >
            <Card
              variant="filled"
              style={[
                styles.ctaCard,
                {
                  backgroundColor: colors.primary,
                  borderRadius: layout.borderRadius.lg,
                },
              ]}
            >
              <View style={styles.ctaRow}>
                <View style={[styles.ctaIconCircle, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name="camera" size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.headline, { color: colors.onPrimary, fontWeight: '800' }]}>
                    {t('Escanear nueva planta')}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.onPrimary, opacity: 0.9, marginTop: 2 }]}>
                    {t('Apunta a una hoja para saber cómo cuidarla')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.onPrimary} />
              </View>
            </Card>
          </Pressable>

          {/* ASISTENTE */}
          <Pressable
            onPress={() => navigation.navigate('Assistant')}
            accessibilityRole="button"
            accessibilityLabel={t('Pregúntale a EcoScan')}
            style={({ pressed }) => [
              {
                borderRadius: layout.borderRadius.lg,
                overflow: 'hidden',
                opacity: pressed && Platform.OS === 'ios' ? 0.85 : 1,
              },
            ]}
            android_ripple={{ color: colors.outlineVariant, borderless: false }}
          >
            <Card
              variant="filled"
              style={{
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.outlineVariant,
                borderWidth: 1,
                borderRadius: layout.borderRadius.lg,
              }}
            >
              <View style={styles.assistantRow}>
                <View style={[styles.assistantIconCircle, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name="chatbubbles" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>
                    {t('Pregúntale a EcoScan')}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                    {t('Consulta sobre riego, poda, plagas y toxicidad')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </Card>
          </Pressable>
        </>
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  weatherOneLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  emptyGardenCard: {
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyGardenIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  hugeButton: {
    width: '100%',
  },
  searchByNameLink: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  bigTaskCard: {
    padding: 18,
  },
  bigTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allDoneCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  allDoneIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ctaCard: {
    padding: 18,
    borderRadius: 24,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assistantIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHeaderBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
