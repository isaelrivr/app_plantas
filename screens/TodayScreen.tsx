import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useGarden, GardenPlant } from '../context/GardenContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { getLocalWeatherAndRecommendations, WeatherData } from '../services/weatherService';
import { useTranslation } from '../i18n';

const DEFAULT_WEATHER: WeatherData = {
  city: 'Tu ubicación',
  temperatureC: 22,
  humidityPercent: 48,
  rainProbability: 15,
  tempMaxC: 26,
  tempMinC: 12,
  weatherCode: 1,
  weatherDescription: 'Agradable',
  weatherIcon: 'sunny',
};

export const TodayScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { plants, rooms, waterPlantToday } = useGarden();
  const { t } = useTranslation();

  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);
  const [justWateredId, setJustWateredId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getLocalWeatherAndRecommendations();
        if (mounted && res?.weather) {
          setWeather(res.weather);
        }
      } catch {
        // Fallback default weather
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Saludo según la hora
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Buenos días ☀️');
    if (hour < 19) return t('Buenas tardes 🌤️');
    return t('Buenas noches 🌙');
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

  // Plantas que necesitan atención hoy
  const plantsNeedingWater = useMemo(() => {
    return plants.filter((p) => !p.isWateredToday);
  }, [plants]);

  const handleWaterSingle = (plant: GardenPlant) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    waterPlantToday(plant.id);
    setJustWateredId(plant.id);
    setTimeout(() => {
      setJustWateredId((prev) => (prev === plant.id ? null : prev));
    }, 2500);
  };

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

      {/* SALUDO Y RESUMEN RÁPIDO */}
      <View style={{ marginBottom: spacing.md, paddingHorizontal: spacing.xxs }}>
        <Text style={[typography.title2, { color: colors.textPrimary, fontWeight: '700' }]}>
          {greeting}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
          {plantsNeedingWater.length > 0
            ? plantsNeedingWater.length === 1
              ? t('{count} planta necesita riego hoy', { count: 1 })
              : t('{count} plantas necesitan riego hoy', { count: plantsNeedingWater.length })
            : t('Todo al día en tu jardín')}
        </Text>
      </View>

      {/* TARJETA DE CONSEJO DEL DÍA / CLIMA */}
      <Card elevated style={{ marginBottom: spacing.lg, backgroundColor: colors.surface }}>
        <View style={styles.weatherRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="partly-sunny" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>
              {t('Consejo del día')}
            </Text>
            <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
              {weather.city ? `${weather.city} · ${Math.round(weather.temperatureC)}°C` : `${Math.round(weather.temperatureC)}°C`}
            </Text>
          </View>
          <Badge label={weather.temperatureC > 25 ? '☀️ Calor' : '🌿 Templado'} variant="neutral" />
        </View>

        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 }]}>
          {weather.temperatureC > 26
            ? t('Hoy hace calor. Riega a primera hora o al atardecer para evitar que el agua se evapore rápidamente.')
            : t('Mantén el riego moderado. Revisa la humedad de la tierra con tu dedo antes de regar.')}
        </Text>
      </Card>

      {/* SECCIÓN DE TAREAS DE HOY */}
      <View style={styles.sectionHeader}>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>
          {t('Cuidados de Hoy')}
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
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {plantsNeedingWater.map((plant) => {
            const wasJustWatered = justWateredId === plant.id;
            const roomName = rooms.find((r) => r.id === plant.roomId)?.name || t('Mi Jardín');
            return (
              <Card key={plant.id} elevated style={styles.taskCard}>
                <View style={styles.taskRow}>
                  <View style={[styles.taskIconCircle, { backgroundColor: '#E1F5FE' }]}>
                    <Ionicons name="water" size={22} color="#0288D1" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
                      {plant.name}
                    </Text>
                    <Text style={[typography.footnote, { color: colors.textTertiary, marginTop: 2 }]}>
                      {roomName} · {t('Riego')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleWaterSingle(plant)}
                    activeOpacity={0.8}
                    style={[
                      styles.waterActionBtn,
                      {
                        backgroundColor: wasJustWatered ? colors.primaryLight : colors.primary,
                        minHeight: layout.minTouchTarget,
                        minWidth: layout.minTouchTarget,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t('Marcar como regada')}
                  >
                    <Ionicons
                      name={wasJustWatered ? 'checkmark' : 'water'}
                      size={18}
                      color={wasJustWatered ? colors.primary : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        typography.subheadline,
                        {
                          color: wasJustWatered ? colors.primary : '#FFFFFF',
                          fontWeight: '700',
                          marginLeft: 6,
                        },
                      ]}
                    >
                      {wasJustWatered ? t('Completado ✓') : t('Regar')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <Card style={[styles.emptyCard, { backgroundColor: colors.surface, marginBottom: spacing.lg }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
          </View>
          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.sm }]}>
            {t('Todo al día en tu jardín')}
          </Text>
          <Text
            style={[
              typography.footnote,
              { color: colors.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: spacing.md },
            ]}
          >
            {t('No tienes riegos pendientes para hoy. ¡Tus plantas están felices!')}
          </Text>
        </Card>
      )}

      {/* ACCIÓN RÁPIDA DE ESCANEO / DIAGNÓSTICO */}
      <View style={styles.sectionHeader}>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>
          {t('Acción Rápida')}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('Scan')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('Identifica una nueva planta o diagnostica una hoja')}
        style={{ marginBottom: spacing.md }}
      >
        <Card
          elevated
          style={[
            styles.ctaCard,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <View style={styles.ctaRow}>
            <View style={styles.ctaIconCircle}>
              <Ionicons name="camera" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.title3, { color: '#FFFFFF', fontWeight: '700' }]}>
                {t('Escanear o Diagnosticar')}
              </Text>
              <Text style={[typography.subheadline, { color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 }]}>
                {t('Identifica una nueva planta o diagnostica una hoja')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
        </Card>
      </TouchableOpacity>

      {/* ACCESO A ASISTENTE */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Assistant')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('Pregúntale a EcoSan')}
      >
        <Card elevated style={{ backgroundColor: colors.surface }}>
          <View style={styles.weatherRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="chatbubbles" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                {t('Pregúntale a EcoSan 🌿')}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                {t('Consulta sobre riego, poda, plagas y toxicidad')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  taskCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCard: {
    padding: 18,
    borderRadius: 16,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
