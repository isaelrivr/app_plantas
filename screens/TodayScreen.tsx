import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useGarden, GardenPlant } from '../context/GardenContext';
import { useFeedback } from '../context/FeedbackContext';
import { useSettings } from '../context/SettingsContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatusPill } from '../components/StatusPill';
import { getLocalWeatherAndRecommendations, WeatherData } from '../services/weatherService';
import { announce } from '../services/accessibilityService';
import { useTranslation } from '../i18n';

export const TodayScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title={t('Hoy')}
        subtitle={formattedDate.toUpperCase()}
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

      {/* CLIMA EN UNA SOLA LÍNEA (solo si hay ubicación y datos reales) */}
      {weather && weather.city ? (
        <View
          style={[
            styles.weatherOneLine,
            { backgroundColor: colors.surfaceSecondary, borderRadius: layout.borderRadius.md },
          ]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${weather.city}, ${Math.round(weather.temperatureC)} grados, ${weather.weatherDescription}`}
        >
          <Ionicons name="sunny-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[typography.footnote, { color: colors.textSecondary }]} numberOfLines={1}>
            {weather.city} · {Math.round(weather.temperatureC)}°C · {weather.weatherDescription}
          </Text>
        </View>
      ) : null}

      {/* RACHA DE CUIDADOS DISCRETA */}
      <View style={[styles.streakRow, { marginBottom: spacing.md }]}>
        <View
          style={[
            styles.streakBadge,
            { backgroundColor: colors.primaryLight, borderRadius: layout.borderRadius.full },
          ]}
          accessible
          accessibilityLabel={t('{dias} días cuidando tus plantas', { dias: Math.max(1, stats.currentStreak) })}
        >
          <Ionicons name="flame" size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[typography.footnote, { color: colors.primaryDark, fontWeight: '700' }]}>
            {t('{dias} días cuidando tus plantas', { dias: Math.max(1, stats.currentStreak) })}
          </Text>
        </View>
      </View>

      {/* ESTADO CON PLANTAS VS. ESTADO VACÍO */}
      {plants.length === 0 ? (
        <Card elevated style={[styles.emptyGardenCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.emptyGardenIcon, { backgroundColor: colors.primaryLight }]}>
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
            variant="primary"
            size="lg"
            icon={<Ionicons name="camera" size={22} color="#FFFFFF" />}
            style={styles.hugeButton}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Encyclopedia')}
            style={styles.searchByNameLink}
            accessibilityRole="button"
            accessibilityLabel={t('o búscala por nombre')}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          >
            <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '700' }]}>
              {t('o búscala por nombre')}
            </Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <>
          {/* LISTA DE TAREAS DEL DÍA EN TARJETAS GRANDES */}
          <View style={styles.sectionHeader}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>
              {t('Tareas de Hoy')}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CareCalendar')}
              accessibilityRole="button"
              accessibilityLabel={t('Ver calendario completo')}
              style={styles.textButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '600' }]}>
                {t('Ver calendario')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {plantsNeedingWater.length > 0 ? (
            <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
              {plantsNeedingWater.map((plant) => {
                const roomName = rooms.find((r) => r.id === plant.roomId)?.name || t('Mi Jardín');
                return (
                  <Card key={plant.id} elevated style={styles.bigTaskCard}>
                    <View style={styles.bigTaskHeader}>
                      <View style={[styles.taskAvatarCircle, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="water" size={26} color="#0288D1" />
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
                      variant="primary"
                      size="lg"
                      icon={<Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                      style={{ marginTop: spacing.md }}
                    />
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card style={[styles.allDoneCard, { backgroundColor: colors.surface, marginBottom: spacing.lg }]}>
              <View style={[styles.allDoneIcon, { backgroundColor: colors.primaryLight }]}>
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
          <TouchableOpacity
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('Identificar o revisar una nueva planta')}
            style={{ marginBottom: spacing.md }}
          >
            <Card elevated style={[styles.ctaCard, { backgroundColor: colors.primary }]}>
              <View style={styles.ctaRow}>
                <View style={styles.ctaIconCircle}>
                  <Ionicons name="camera" size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.headline, { color: '#FFFFFF', fontWeight: '800' }]}>
                    {t('Escanear nueva planta')}
                  </Text>
                  <Text style={[typography.caption1, { color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 }]}>
                    {t('Apunta a una hoja para saber cómo cuidarla')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </View>
            </Card>
          </TouchableOpacity>

          {/* ASISTENTE */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Assistant')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('Pregúntale a EcoScan')}
          >
            <Card elevated style={{ backgroundColor: colors.surface }}>
              <View style={styles.assistantRow}>
                <View style={[styles.assistantIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="chatbubbles" size={22} color={colors.accent} />
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
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  weatherOneLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
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
    minHeight: 44,
  },
  bigTaskCard: {
    padding: 16,
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
    paddingVertical: 28,
    paddingHorizontal: 16,
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
    padding: 16,
    borderRadius: 16,
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
});
