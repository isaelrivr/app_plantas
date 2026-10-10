/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/set-state-in-effect */
import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, PanResponderGestureState, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import * as topojson from 'topojson-client';
import * as d3Geo from 'd3-geo';
import { MapControls } from './MapControls';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withDecay, withSpring } from 'react-native-reanimated';

const AnimatedView = Animated.View;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const MIN_SCALE = 1;
const MAX_SCALE = 5;

export interface WorldMapCountry {
  id: string;
  name: string;
  path: string;
  centroid: [number, number];
}

interface WorldAtlasTopology {
  type: 'Topology';
  objects: { countries: object };
  arcs: readonly unknown[];
  transform?: object;
}

interface WorldMapProps {
  topology: WorldAtlasTopology;
  highlightedIds: ReadonlySet<string>;
  onCountryPress: (country: WorldMapCountry) => void;
  colors: { ocean: string; land: string; border: string; highlight: string; highlightBorder: string; label: string; surface: string; textPrimary: string; primary: string };
  accessibilitySummary: string;
  resetToken?: number;
  focusIds?: readonly string[];
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const distance = (a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }): number => Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);

const PulseMarker: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => {
  const pulse = useSharedValue(0);
  React.useEffect(() => {
    pulse.value = withDecay({ velocity: 0.35, deceleration: 0.995 });
    const timer = setInterval(() => { pulse.value = 0; pulse.value = withSpring(1, { damping: 12, stiffness: 45 }); }, 1900);
    return () => clearInterval(timer);
  }, [pulse]);
  const animatedProps = useAnimatedProps(() => ({
    r: 5 + pulse.value * 8,
    opacity: 0.85 - pulse.value * 0.55,
  }));
  return <AnimatedCircle cx={x} cy={y} fill={color} animatedProps={animatedProps} />;
};

export const WorldMap: React.FC<WorldMapProps> = ({ topology, highlightedIds, onCountryPress, colors, accessibilitySummary, resetToken = 0, focusIds = [] }) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [scaleState, setScaleState] = useState(MIN_SCALE);
  const scale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScale = useRef(MIN_SCALE);
  const startPan = useRef({ x: 0, y: 0 });
  const pinchDistance = useRef(0);
  const lastTap = useRef(0);

  const countries = useMemo<WorldMapCountry[]>(() => {
    if (size.width <= 0 || size.height <= 0) return [];
    const collection = topojson.feature(topology as never, topology.objects.countries as never) as unknown as { features: { id?: string | number; properties?: { name?: string }; geometry: object }[] };
    const projection = d3Geo.geoNaturalEarth1().fitExtent([[10, 10], [size.width - 10, size.height - 10]], collection as never);
    const pathGenerator = d3Geo.geoPath().projection(projection);
    return collection.features.map((feature) => {
      const centroid = projection(d3Geo.geoCentroid(feature as never)) || [size.width / 2, size.height / 2];
      return { id: String(feature.id || ''), name: feature.properties?.name || 'Unknown', path: pathGenerator(feature as never) || '', centroid: [centroid[0], centroid[1]] as [number, number] };
    }).filter((country) => country.id && country.path);
  }, [size, topology]);

  const highlightedCountries = useMemo(() => countries.filter((country) => highlightedIds.has(country.id)), [countries, highlightedIds]);

  const limits = useMemo(() => ({
    x: Math.max(0, size.width * (MAX_SCALE - 1) / 2),
    y: Math.max(0, size.height * (MAX_SCALE - 1) / 2),
  }), [size]);

  const updateScale = (next: number): void => {
    const value = clamp(next, MIN_SCALE, MAX_SCALE);
    scale.value = withSpring(value, { damping: 18, stiffness: 170 });
    setScaleState(value);
  };

  const reset = React.useCallback((): void => {
    scale.value = withSpring(MIN_SCALE);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    setScaleState(MIN_SCALE);
  }, [scale, translateX, translateY]);

  React.useEffect(() => { if (resetToken > 0) reset(); }, [reset, resetToken]);

  React.useEffect(() => {
    if (!focusIds.length || !countries.length || !size.width || !size.height) return;
    const focused = countries.filter((country) => focusIds.includes(country.id));
    if (!focused.length) return;
    const minX = Math.min(...focused.map((country) => country.centroid[0]));
    const maxX = Math.max(...focused.map((country) => country.centroid[0]));
    const minY = Math.min(...focused.map((country) => country.centroid[1]));
    const maxY = Math.max(...focused.map((country) => country.centroid[1]));
    const width = Math.max(80, maxX - minX);
    const height = Math.max(60, maxY - minY);
    const targetScale = clamp(Math.min(size.width / (width * 1.7), size.height / (height * 1.7)), 1.15, MAX_SCALE);
    scale.value = withSpring(targetScale, { damping: 18, stiffness: 130 });
    translateX.value = withSpring(size.width / 2 - (minX + maxX) / 2 * targetScale, { damping: 18, stiffness: 130 });
    translateY.value = withSpring(size.height / 2 - (minY + maxY) / 2 * targetScale, { damping: 18, stiffness: 130 });
    setScaleState(targetScale);
  }, [countries, focusIds, scale, size, translateX, translateY]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
    onPanResponderGrant: (event) => {
      const touches = event.nativeEvent.touches;
      startScale.current = scale.value;
      startPan.current = { x: translateX.value, y: translateY.value };
      pinchDistance.current = touches.length >= 2 ? distance(touches[0], touches[1]) : 0;
    },
    onPanResponderMove: (event, gesture: PanResponderGestureState) => {
      const touches = event.nativeEvent.touches;
      if (touches.length >= 2 && pinchDistance.current > 0) {
        const nextScale = clamp(startScale.current * distance(touches[0], touches[1]) / pinchDistance.current, MIN_SCALE, MAX_SCALE);
        scale.value = nextScale;
        setScaleState(nextScale);
        translateX.value = clamp(startPan.current.x + gesture.dx, -limits.x * (nextScale / MAX_SCALE), limits.x * (nextScale / MAX_SCALE));
        translateY.value = clamp(startPan.current.y + gesture.dy, -limits.y * (nextScale / MAX_SCALE), limits.y * (nextScale / MAX_SCALE));
      } else if (scale.value > MIN_SCALE) {
        const maxX = size.width * (scale.value - 1) / 2;
        const maxY = size.height * (scale.value - 1) / 2;
        translateX.value = clamp(startPan.current.x + gesture.dx, -maxX, maxX);
        translateY.value = clamp(startPan.current.y + gesture.dy, -maxY, maxY);
      }
    },
    onPanResponderRelease: (_event, gesture) => {
      if (scale.value <= MIN_SCALE) { reset(); return; }
      const maxX = size.width * (scale.value - 1) / 2;
      const maxY = size.height * (scale.value - 1) / 2;
      translateX.value = withDecay({ velocity: gesture.vx, clamp: [-maxX, maxX], deceleration: 0.995 });
      translateY.value = withDecay({ velocity: gesture.vy, clamp: [-maxY, maxY], deceleration: 0.995 });
    },
  }), [limits, reset, scale, size, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }] }));

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  const onTouchEnd = (event: { nativeEvent: { locationX: number; locationY: number } }): void => {
    const now = Date.now();
    if (now - lastTap.current < 280 && size.width > 0) {
      const { locationX, locationY } = event.nativeEvent;
      const factor = scale.value < MAX_SCALE ? 1.65 : 1;
      const next = clamp(scale.value * factor, MIN_SCALE, MAX_SCALE);
      const relativeX = locationX - size.width / 2;
      const relativeY = locationY - size.height / 2;
      translateX.value = clamp(relativeX - (relativeX - translateX.value) * factor, -size.width * (next - 1) / 2, size.width * (next - 1) / 2);
      translateY.value = clamp(relativeY - (relativeY - translateY.value) * factor, -size.height * (next - 1) / 2, size.height * (next - 1) / 2);
      updateScale(next);
    }
    lastTap.current = now;
  };

  const markerLabelsVisible = scaleState >= 1.55;

  return (
    <View style={styles.container} onLayout={onLayout} onTouchEnd={onTouchEnd} {...panResponder.panHandlers} accessibilityRole="image" accessibilityLabel={accessibilitySummary}>
      {size.width > 0 && size.height > 0 ? (
        <AnimatedView style={[StyleSheet.absoluteFill, animatedStyle]}>
          <Svg width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`}>
            <Rect width={size.width} height={size.height} fill={colors.ocean} />
            <G>
              {countries.map((country) => {
                const highlighted = highlightedIds.has(country.id);
                return <Path key={country.id} d={country.path} fill={highlighted ? colors.highlight : colors.land} stroke={highlighted ? colors.highlightBorder : colors.border} strokeWidth={highlighted ? 1.3 : 0.55} onPress={() => onCountryPress(country)} />;
              })}
            </G>
            {highlightedCountries.map((country) => (
              <G key={`marker-${country.id}`}>
                <PulseMarker x={country.centroid[0]} y={country.centroid[1]} color={colors.highlightBorder} />
                {markerLabelsVisible ? <SvgText x={country.centroid[0] + 7} y={country.centroid[1] + 4} fill={colors.label} fontSize={10} fontWeight="600">{country.name}</SvgText> : null}
              </G>
            ))}
          </Svg>
        </AnimatedView>
      ) : null}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill} />
      <MapControls onZoomIn={() => updateScale(scale.value + 0.5)} onZoomOut={() => updateScale(scale.value - 0.5)} onReset={reset} canZoomOut={scaleState > MIN_SCALE} colors={colors} labels={{ zoomIn: 'Acercar mapa', zoomOut: 'Alejar mapa', reset: 'Restablecer vista' }} />
    </View>
  );
};

export { MIN_SCALE, MAX_SCALE };

const styles = StyleSheet.create({ container: { flex: 1, overflow: 'hidden' } });
