import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  PanResponder,
  PanResponderInstance,
} from 'react-native';
import Svg, { Path, G, Circle, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as topojson from 'topojson-client';
import * as d3Geo from 'd3-geo';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import worldData from 'world-atlas/countries-110m.json';
import { useAppTheme } from '../theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { SkeletonBox } from '../components/SkeletonLoader';
import {
  getPlantHabitat,
  PlantHabitatInfo,
  HabitatRegionDetail,
  getRegionTypeColor,
} from '../services/habitatService';
import { getPlantById } from '../services/plantApi';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { LockedPreview } from '../components/LockedPreview';

const MAP_WIDTH = 900;
const MAP_HEIGHT = 500;

// Alias para países cuya topología mundial no los incluye con su nombre natural
const COUNTRY_ALIASES: Record<string, string> = {
  'french polynesia': 'France',
  'dem. rep. congo': 'Dem. Rep. Congo',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const touchDistance = (touches: any[]): number => {
  if (!touches || touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.sqrt(Math.pow(a.pageX - b.pageX, 2) + Math.pow(a.pageY - b.pageY, 2));
};

// Círculos SVG animables (react-native-svg no soporta driver nativo para props de dibujo)
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const HabitatMapScreen: React.FC = () => {
  const { colors, isDark, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const limits = usePlanLimits();

  const plantId = route.params?.plantId || 'monstera';
  const plant = getPlantById(plantId);

  const [habitatData, setHabitatData] = useState<PlantHabitatInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<HabitatRegionDetail | null>(null);

  // Controles de Zoom y Pan (gestos con pinza y arrastre)
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Animación progresiva de pulso y expansión sobre los hábitats
  const [lightUpAnim] = useState(() => new Animated.Value(0));
  const [expandAnim] = useState(() => new Animated.Value(0));
  const [glowAnim] = useState(() => new Animated.Value(0.4));

  const loadHabitat = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getPlantHabitat(plantId);
      setHabitatData(data);
      if (data.regions.length > 0) {
        const defaultReg = data.regions.find((r) => r.zoneType === 'native') || data.regions[0];
        setSelectedRegion(defaultReg);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadHabitat();
    }, 0);
    return () => clearTimeout(t);
  }, [loadHabitat]);

  // Iluminación progresiva de las regiones al cargar el mapa
  useEffect(() => {
    if (!habitatData) return;
    lightUpAnim.setValue(0);
    Animated.timing(lightUpAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, [habitatData, lightUpAnim]);

  // Efecto continuo de expansión + pulso sobre las balizas
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(expandAnim, { toValue: 1, duration: 1900, useNativeDriver: false }),
        Animated.timing(expandAnim, { toValue: 0, duration: 1900, useNativeDriver: false }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 950, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 950, useNativeDriver: false }),
      ])
    );
    pulseLoop.start();
    glowLoop.start();

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [expandAnim, glowAnim]);

  // Generación memoizada del mapa TopoJSON a SVG con d3-geo
  const { countryPaths } = useMemo(() => {
    try {
      const countries = topojson.feature(
        worldData as any,
        (worldData as any).objects.countries
      ) as any;

      const projection = d3Geo.geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], countries);
      const pathGenerator = d3Geo.geoPath().projection(projection);

      const paths = countries.features.map((feature: any) => {
        const d = pathGenerator(feature) || '';
        const name = feature.properties?.name || '';
        const centroid = projection(d3Geo.geoCentroid(feature)) || [0, 0];
        return { id: feature.id, name, d, centroid };
      });

      return { countryPaths: paths };
    } catch {
      return { countryPaths: [] };
    }
  }, []);

  // Mapeo rápido de regiones de la planta con alias de topología mundial
  const plantRegionsMap = useMemo(() => {
    const map = new Map<string, HabitatRegionDetail>();
    if (habitatData) {
      habitatData.regions.forEach((r) => {
        map.set(r.countryName.toLowerCase(), r);
        const alias = COUNTRY_ALIASES[r.countryName.toLowerCase()];
        if (alias) map.set(alias.toLowerCase(), r);
      });
    }
    return map;
  }, [habitatData]);

  // Progreso animado por región (iluminación escalonada)
  const highlightedEntries = useMemo(() => {
    return countryPaths
      .map((c: any, idx: number) => ({ country: c, idx }))
      .filter((entry: any) => plantRegionsMap.has(entry.country.name.toLowerCase()));
  }, [countryPaths, plantRegionsMap]);

  const lightUpFor = (localIdx: number) => {
    const total = Math.max(1, highlightedEntries.length);
    const start = (localIdx / total) * 0.55;
    return lightUpAnim.interpolate({
      inputRange: [start, start + 0.45],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  };

  // ---- Gestos de zoom y pan (pinza + arrastre) ----
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const pinchStartDist = useRef(0);
  const gestureStart = useRef({ scale: 1, pan: { x: 0, y: 0 } });

  const applyTransform = (newScale: number, newPan: { x: number; y: number }) => {
    scaleRef.current = newScale;
    panRef.current = newPan;
    setScale(newScale);
    setPan(newPan);
  };

  const applyScale = (newScale: number) => {
    const s = clamp(newScale, 1, 3.4);
    const maxPanX = MAP_WIDTH * (s - 1) * 0.5;
    const maxPanY = MAP_HEIGHT * (s - 1) * 0.5;
    const p = {
      x: clamp(panRef.current.x, -maxPanX, maxPanX),
      y: clamp(panRef.current.y, -maxPanY, maxPanY),
    };
    applyTransform(s, p);
  };

  const [panResponder, setPanResponder] = useState<PanResponderInstance | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setPanResponder(
        PanResponder.create({
          onStartShouldSetPanResponder: () => false,
          onMoveShouldSetPanResponder: (evt, g) => {
            const touches = evt.nativeEvent.touches || [];
            if (touches.length >= 2) return true;
            return scaleRef.current > 1 && (Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8);
          },
          onMoveShouldSetPanResponderCapture: (evt) => {
            const touches = evt.nativeEvent.touches || [];
            return touches.length >= 2;
          },
          onPanResponderGrant: (evt) => {
            const touches = evt.nativeEvent.touches || [];
            pinchStartDist.current = touches.length >= 2 ? touchDistance(touches) : 0;
            gestureStart.current = { scale: scaleRef.current, pan: { ...panRef.current } };
          },
          onPanResponderMove: (evt, g) => {
            const touches = evt.nativeEvent.touches || [];
            if (touches.length >= 2 && pinchStartDist.current > 0) {
              const dist = touchDistance(touches);
              const nextScale = clamp(
                gestureStart.current.scale * (dist / pinchStartDist.current),
                1,
                3.4
              );
              const maxPanX = MAP_WIDTH * (nextScale - 1) * 0.5;
              const maxPanY = MAP_HEIGHT * (nextScale - 1) * 0.5;
              applyTransform(nextScale, {
                x: clamp(gestureStart.current.pan.x, -maxPanX, maxPanX),
                y: clamp(gestureStart.current.pan.y, -maxPanY, maxPanY),
              });
            } else if (scaleRef.current > 1) {
              const maxPanX = MAP_WIDTH * (scaleRef.current - 1) * 0.5;
              const maxPanY = MAP_HEIGHT * (scaleRef.current - 1) * 0.5;
              applyTransform(gestureStart.current.scale, {
                x: clamp(gestureStart.current.pan.x + g.dx, -maxPanX, maxPanX),
                y: clamp(gestureStart.current.pan.y + g.dy, -maxPanY, maxPanY),
              });
            }
          },
          onPanResponderTerminationRequest: () => false,
        })
      );
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleCountryPress = (countryName: string) => {
    const regionInfo = plantRegionsMap.get(countryName.toLowerCase());
    if (regionInfo) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      setSelectedRegion(regionInfo);
    } else {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      setSelectedRegion({
        countryName,
        zoneType: 'cultivated',
        climate: 'Sin registro endémico oficial',
        floweringSeason: 'Variable según cultivo',
        biogeographicZone: 'Zona no principal',
        elevationMeters: 'N/A',
        notes: `No se registran poblaciones silvestres significativas de ${plant?.name || 'esta especie'} en este territorio.`,
      });
    }
  };

  const handleZoomIn = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    applyScale(scaleRef.current + 0.4);
  };

  const handleZoomOut = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    applyScale(scaleRef.current - 0.4);
  };

  const handleResetZoom = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    applyTransform(1, { x: 0, y: 0 });
  };

  // Punto 16 — mapa animado bloqueado para Free
  if (limits.isFeatureLocked('animatedMap')) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER APPLE HIG CON BOTÓN CERRAR Y TÍTULO */}
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
            accessibilityLabel="Volver a la pantalla anterior"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
            <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>Atrás</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleCenter}>
            <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
              Hábitat Global
            </Text>
            <Text style={[typography.caption1, { color: colors.textSecondary }]} numberOfLines={1}>
              {plant?.scientificName || 'Distribución biogeográfica'}
            </Text>
          </View>

          <View style={styles.headerRightPlaceholder} />
        </View>

        <LockedPreview
          locked
          feature="animatedMap"
          onUnlock={() => navigation.navigate('Paywall')}
          style={{ flex: 1 }}
        >
          <View style={{ padding: spacing.md }}>
            <Card elevated>
              <View style={styles.habitatLockedIcon}>
                <Ionicons name="earth" size={34} color={colors.primary} />
              </View>
              <Text style={[typography.title2, { color: colors.textPrimary, fontWeight: '700', marginTop: spacing.sm }]}>
                {plant?.name || 'Esta planta'}
              </Text>
              <Text style={[typography.subheadline, { color: colors.textTertiary, fontStyle: 'italic' }]}>
                {plant?.scientificName || ''}
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md, lineHeight: 22 }]}>
                El mapa interactivo revela dónde {plant?.name || 'la especie'} crece de forma nativa,
                naturalizada y cultivada: proyección cartográfica en vivo, regiones iluminadas y datos
                biogeográficos por país.
              </Text>
            </Card>
          </View>
        </LockedPreview>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER APPLE HIG CON BOTÓN CERRAR Y TÍTULO */}
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
          accessibilityLabel="Volver a la pantalla anterior"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>Atrás</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
            Hábitat Global
          </Text>
          <Text style={[typography.caption1, { color: colors.textSecondary }]} numberOfLines={1}>
            {plant?.scientificName || 'Distribución biogeográfica'}
          </Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* LEYENDA POR TIPO DE ZONA */}
      <View style={[styles.legendBar, { backgroundColor: isDark ? '#1C1C1E' : '#F1F3F4' }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getRegionTypeColor('native', isDark) }]} />
          <Text style={[typography.caption2, { color: colors.textPrimary, fontWeight: '600' }]}>
            Nativa
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getRegionTypeColor('naturalized', isDark) }]} />
          <Text style={[typography.caption2, { color: colors.textPrimary, fontWeight: '600' }]}>
            Naturalizada
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getRegionTypeColor('cultivated', isDark) }]} />
          <Text style={[typography.caption2, { color: colors.textPrimary, fontWeight: '600' }]}>
            Cultivada
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
            ]}
          />
          <Text style={[typography.caption2, { color: colors.textTertiary }]}>Otras</Text>
        </View>
      </View>

      {/* ÁREA DEL MAPA SVG CON ZOOM */}
      <View style={styles.mapViewport}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={{ width: '100%', paddingHorizontal: 16, alignItems: 'center' }}>
              <SkeletonBox width="100%" height={220} borderRadius={16} />
              <View style={{ marginTop: spacing.md, width: '70%' }}>
                <SkeletonBox width="100%" height={16} borderRadius={6} />
              </View>
              <View style={{ marginTop: spacing.sm, width: '50%' }}>
                <SkeletonBox width="100%" height={14} borderRadius={6} />
              </View>
            </View>
            <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Generando proyección cartográfica...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <ErrorBanner
              message="No pudimos cargar el hábitat de esta planta. Revisa que el catálogo esté disponible e inténtalo de nuevo."
              onRetry={loadHabitat}
            />
          </View>
        ) : countryPaths.length === 0 ? (
          <View style={styles.centerState}>
            <EmptyState
              iconName="map-outline"
              title="No se pudo construir el mapa"
              description="La proyección cartográfica no está disponible en este dispositivo."
            />
          </View>
        ) : !habitatData || habitatData.regions.length === 0 ? (
          <View style={styles.centerState}>
            <EmptyState
              iconName="leaf-outline"
              title="Sin registros de hábitat"
              description="Aún no tenemos datos biogeográficos para esta especie, pero los estaremos agregando pronto."
            />
          </View>
        ) : (
          <View style={styles.mapCanvas} {...(panResponder ? panResponder.panHandlers : {})}>
            <Animated.View
              style={{
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale },
                ],
              }}
            >
              <Svg width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
                <Defs>
                  {/* Fondo oceánico HIG */}
                  <RadialGradient id="oceanGlow" cx="50%" cy="50%" r="60%">
                    <Stop offset="0%" stopColor={isDark ? '#0A121A' : '#E3F2FD'} stopOpacity="1" />
                    <Stop offset="100%" stopColor={isDark ? '#000000' : '#D4E6F1'} stopOpacity="1" />
                  </RadialGradient>
                </Defs>

                {/* Rectángulo de mar */}
                <Rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#oceanGlow)" rx={16} />

                {/* Capa de países base (iluminación progresiva) */}
                <G>
                  {countryPaths.map((c: any) => {
                    const regionInfo = plantRegionsMap.get(c.name.toLowerCase());
                    const isHighlighted = !!regionInfo;
                    const highlightedIdx = highlightedEntries.findIndex(
                      (e: any) => e.country.name === c.name
                    );
                    const fillColor = isHighlighted
                      ? getRegionTypeColor(regionInfo.zoneType, isDark)
                      : isDark
                      ? '#222226'
                      : '#CFD8DC';

                    const strokeColor = isHighlighted
                      ? '#FFFFFF'
                      : isDark
                      ? '#333338'
                      : '#B0BEC5';

                    return (
                      <Path
                        key={c.id || c.name}
                        d={c.d}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 1.4 : 0.6}
                        opacity={isHighlighted ? (lightUpFor(highlightedIdx) as any) : 0.75}
                        onPress={() => handleCountryPress(c.name)}
                        accessible={true}
                        accessibilityLabel={`Obtener información de hábitat en ${c.name}`}
                      />
                    );
                  })}
                </G>

                {/* Capa de balizas luminosas animadas (expansión + pulso) */}
                <G>
                  {countryPaths.map((c: any) => {
                    const regionInfo = plantRegionsMap.get(c.name.toLowerCase());
                    if (!regionInfo || !c.centroid) return null;

                    const highlightedIdx = highlightedEntries.findIndex(
                      (e: any) => e.country.name === c.name
                    );
                    const beaconColor = getRegionTypeColor(regionInfo.zoneType, isDark);
                    const isSelected = selectedRegion?.countryName === regionInfo.countryName;
                    const baseSize = isSelected ? 16 : 10;

                    const ringOpacity = expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.55, 0],
                    });
                    const ringRadius = expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [baseSize, baseSize + 22],
                    });
                    const coreOpacity = glowAnim;
                    const seen = lightUpFor(Math.max(0, highlightedIdx));

                    return (
                      <G
                        key={`beacon-${c.name}`}
                        onPress={() => handleCountryPress(c.name)}
                        accessible={true}
                        accessibilityLabel={`Hábitat de ${plant?.name || 'la planta'} en ${c.name}`}
                      >
                        {/* Anillo de expansión progresiva */}
                        <AnimatedCircle
                          cx={c.centroid[0]}
                          cy={c.centroid[1]}
                          r={ringRadius as any}
                          fill={beaconColor}
                          opacity={Animated.multiply(ringOpacity, seen)}
                        />
                        {/* Halo interior de pulso */}
                        <AnimatedCircle
                          cx={c.centroid[0]}
                          cy={c.centroid[1]}
                          r={baseSize}
                          fill={beaconColor}
                          opacity={Animated.multiply(Animated.multiply(coreOpacity, 0.55), seen)}
                        />
                        {/* Núcleo brillante */}
                        <AnimatedCircle
                          cx={c.centroid[0]}
                          cy={c.centroid[1]}
                          r={isSelected ? 6 : 4}
                          fill="#FFFFFF"
                          stroke={beaconColor}
                          strokeWidth={2}
                          opacity={Animated.multiply(0.95, seen)}
                        />
                      </G>
                    );
                  })}
                </G>
              </Svg>
            </Animated.View>
          </View>
        )}

        {/* CONTROLES FLOTANTES DE ZOOM HIG */}
        {!loading && !error && (
          <View style={styles.floatingControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.surface }]}
              onPress={handleZoomIn}
              accessibilityRole="button"
              accessibilityLabel="Aumentar zoom del mapa"
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.surface }]}
              onPress={handleZoomOut}
              accessibilityRole="button"
              accessibilityLabel="Reducir zoom del mapa"
            >
              <Ionicons name="remove" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.surface }]}
              onPress={handleResetZoom}
              accessibilityRole="button"
              accessibilityLabel="Restablecer zoom del mapa"
            >
              <Ionicons name="locate" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* HINT DE INTERACCIÓN */}
        {!loading && !error && countryPaths.length > 0 && (
          <View style={[styles.hintBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}>
            <Ionicons name="finger-print" size={14} color={colors.primary} />
            <Text style={[typography.caption2, { color: colors.textSecondary, marginLeft: 4 }]}>
              Toca una región iluminada para ver clima y floración
            </Text>
          </View>
        )}
      </View>

      {/* TARJETA DETALLE HIG DE LA REGIÓN SELECCIONADA */}
      <View style={[styles.detailSheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {selectedRegion ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Badge
                    label={
                      selectedRegion.zoneType === 'native'
                        ? 'Zona Nativa de Origen'
                        : selectedRegion.zoneType === 'naturalized'
                        ? 'Población Naturalizada'
                        : 'Zona de Cultivo'
                    }
                    variant={
                      selectedRegion.zoneType === 'native'
                        ? 'success'
                        : selectedRegion.zoneType === 'naturalized'
                        ? 'info'
                        : 'premium'
                    }
                  />
                  <Text style={[typography.caption1, { color: colors.textTertiary, marginLeft: 8 }]}>
                    {habitatData?.conservationStatus || 'LC'}
                  </Text>
                </View>

                <Text style={[typography.title2, { color: colors.textPrimary, fontWeight: '700', marginTop: 4 }]}>
                  {selectedRegion.countryName}
                </Text>
              </View>

              <View
                style={[
                  styles.flagCircle,
                  { backgroundColor: getRegionTypeColor(selectedRegion.zoneType, isDark) },
                ]}
              >
                <Ionicons name="leaf" size={20} color="#FFFFFF" />
              </View>
            </View>

            {/* GRILLA DE METADATOS CLIMÁTICOS Y BOTÁNICOS */}
            <View style={[styles.metaGrid, { backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA' }]}>
              {/* Clima */}
              <View style={styles.metaCell}>
                <View style={styles.metaIconLabel}>
                  <Ionicons name="partly-sunny" size={16} color={colors.primary} />
                  <Text style={[typography.caption2, { color: colors.textTertiary, marginLeft: 4 }]}>
                    Clima predominante
                  </Text>
                </View>
                <Text style={[typography.footnote, { color: colors.textPrimary, fontWeight: '600', marginTop: 2 }]}>
                  {selectedRegion.climate}
                </Text>
              </View>

              {/* Época de Floración */}
              <View style={styles.metaCell}>
                <View style={styles.metaIconLabel}>
                  <Ionicons name="calendar" size={16} color={colors.warning} />
                  <Text style={[typography.caption2, { color: colors.textTertiary, marginLeft: 4 }]}>
                    Época de floración
                  </Text>
                </View>
                <Text style={[typography.footnote, { color: colors.textPrimary, fontWeight: '600', marginTop: 2 }]}>
                  {selectedRegion.floweringSeason}
                </Text>
              </View>

              {/* Rango Altitudinal */}
              <View style={styles.metaCell}>
                <View style={styles.metaIconLabel}>
                  <Ionicons name="trending-up" size={16} color={colors.info} />
                  <Text style={[typography.caption2, { color: colors.textTertiary, marginLeft: 4 }]}>
                    Altitud / Rango
                  </Text>
                </View>
                <Text style={[typography.footnote, { color: colors.textPrimary, fontWeight: '600', marginTop: 2 }]}>
                  {selectedRegion.elevationMeters}
                </Text>
              </View>

              {/* Zona Biogeográfica */}
              <View style={styles.metaCell}>
                <View style={styles.metaIconLabel}>
                  <Ionicons name="map" size={16} color={colors.accent} />
                  <Text style={[typography.caption2, { color: colors.textTertiary, marginLeft: 4 }]}>
                    Ecorregión
                  </Text>
                </View>
                <Text style={[typography.footnote, { color: colors.textPrimary, fontWeight: '600', marginTop: 2 }]}>
                  {selectedRegion.biogeographicZone}
                </Text>
              </View>
            </View>

            {/* NOTAS BOTÁNICAS */}
            {selectedRegion.notes && (
              <View style={[styles.notesBox, { borderLeftColor: colors.primary }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary, fontStyle: 'italic', lineHeight: 18 }]}>
                  &ldquo;{selectedRegion.notes}&rdquo;
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptySheet}>
            <Ionicons name="globe-outline" size={32} color={colors.textTertiary} />
            <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 8 }]}>
              Selecciona una región del mapa para inspeccionar sus condiciones naturales
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerRightPlaceholder: {
    width: 60,
  },
  habitatLockedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  mapViewport: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  floatingControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  hintBadge: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailSheet: {
    height: 250,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaGrid: {
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaCell: {
    width: '48%',
    paddingVertical: 4,
  },
  metaIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesBox: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginTop: 10,
  },
  emptySheet: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});