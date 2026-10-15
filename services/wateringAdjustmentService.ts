/**
 * EcoScan Smart Watering Adjustment Service
 *
 * Calcula el intervalo de riego inteligente y adaptativo considerando:
 * 1. Especie base (días nominales).
 * 2. Tamaño de maceta (pequeña se deseca más rápido; grande retiene humedad).
 * 3. Estación del año (verano requiere más frecuencia; invierno ralentiza la evaporación).
 * 4. Clima en tiempo real (lluvia inminente o calor extremo de Open-Meteo).
 */

export interface WeatherSnapshot {
  temperatureC: number;
  humidityPercent: number;
  rainProbability: number;
  tempMinC?: number;
  tempMaxC?: number;
}

export type PotSize = 'small' | 'medium' | 'large' | 'planter';

export interface SmartWateringParams {
  baseFrequencyDays: number;
  potSize?: PotSize;
  weather?: WeatherSnapshot | null;
  currentDate?: Date;
}

export interface SmartWateringAdvice {
  adjustedFrequencyDays: number;
  reason: string;
  potMultiplier: number;
  seasonMultiplier: number;
  weatherMultiplier: number;
  recommendationBadge: 'delay' | 'increase' | 'optimal';
}

/**
 * Obtiene la estación actual del hemisferio (por defecto Hemisferio Norte).
 */
export function getCurrentSeason(date: Date = new Date()): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = date.getMonth(); // 0 a 11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

/**
 * Calcula el multiplicador de tamaño de maceta.
 */
export function getPotSizeMultiplier(potSize?: PotSize): number {
  switch (potSize) {
    case 'small':
      return 0.8; // Seca más rápido -> regar con mayor frecuencia
    case 'large':
      return 1.3; // Mucho sustrato -> retiene más humedad
    case 'planter':
      return 1.2; // Exterior/jardinera profunda
    case 'medium':
    default:
      return 1.0;
  }
}

/**
 * Calcula el multiplicador estacional.
 */
export function getSeasonMultiplier(season: 'spring' | 'summer' | 'autumn' | 'winter'): number {
  switch (season) {
    case 'summer':
      return 0.85; // Calor -> evapotranspiración acelerada
    case 'winter':
      return 1.4; // Frío/días cortos -> letargo y evaporación lenta
    case 'spring':
      return 0.95; // Crecimiento activo
    case 'autumn':
    default:
      return 1.05;
  }
}

/**
 * Calcula el ajuste global inteligente.
 */
export function calculateSmartWatering(params: SmartWateringParams): SmartWateringAdvice {
  const { baseFrequencyDays, potSize = 'medium', weather, currentDate = new Date() } = params;

  const potMult = getPotSizeMultiplier(potSize);
  const season = getCurrentSeason(currentDate);
  const seasonMult = getSeasonMultiplier(season);

  let weatherMult = 1.0;
  let weatherNote = '';
  let badge: 'delay' | 'increase' | 'optimal' = 'optimal';

  if (weather) {
    if (weather.rainProbability >= 50 || weather.humidityPercent >= 75) {
      weatherMult = 1.3;
      weatherNote = 'La alta humedad ambiente y lluvia reducen la necesidad de riego.';
      badge = 'delay';
    } else if (weather.temperatureC >= 28 || (weather.tempMaxC !== undefined && weather.tempMaxC >= 32)) {
      weatherMult = 0.85;
      weatherNote = 'El calor ambiental acelera el secado de la tierra.';
      badge = 'increase';
    } else if (weather.temperatureC <= 10) {
      weatherMult = 1.35;
      weatherNote = 'Las bajas temperaturas ralentizan la absorción de agua.';
      badge = 'delay';
    }
  }

  const rawAdjusted = baseFrequencyDays * potMult * seasonMult * weatherMult;
  const finalDays = Math.max(1, Math.round(rawAdjusted));

  const potLabels: Record<PotSize, string> = {
    small: 'maceta pequeña (seca rápido)',
    medium: 'maceta estándar',
    large: 'maceta grande (retiene agua)',
    planter: 'jardinera profunda',
  };

  const reasonParts: string[] = [
    `Ajustado por ${potLabels[potSize]}`,
    season === 'summer' ? 'temporada de calor' : season === 'winter' ? 'temporada de frío' : 'clima de la estación',
  ];

  if (weatherNote) {
    reasonParts.push(weatherNote);
  }

  return {
    adjustedFrequencyDays: finalDays,
    reason: reasonParts.join('. '),
    potMultiplier: potMult,
    seasonMultiplier: seasonMult,
    weatherMultiplier: weatherMult,
    recommendationBadge: badge,
  };
}

/**
 * Función de conveniencia para calcular intervalos directamente a partir de opciones.
 */
export function calculateSmartWateringInterval(
  baseFrequencyDays: number,
  options?: {
    potSize?: PotSize;
    season?: 'spring' | 'summer' | 'autumn' | 'winter';
    weatherCondition?: { tempC: number; humidity: number; isRaining: boolean };
  }
) {
  let mockWeather: WeatherSnapshot | null = null;
  if (options?.weatherCondition) {
    mockWeather = {
      temperatureC: options.weatherCondition.tempC,
      humidityPercent: options.weatherCondition.humidity,
      rainProbability: options.weatherCondition.isRaining ? 90 : 0,
      tempMinC: options.weatherCondition.tempC - 4,
      tempMaxC: options.weatherCondition.tempC + 4,
    };
  }

  let date: Date | undefined;
  if (options?.season) {
    const month =
      options.season === 'summer'
        ? 6
        : options.season === 'winter'
        ? 0
        : options.season === 'spring'
        ? 3
        : 9;
    date = new Date(2026, month, 15);
  }

  const advice = calculateSmartWatering({
    baseFrequencyDays,
    potSize: options?.potSize,
    weather: mockWeather,
    currentDate: date,
  });

  return {
    recommendedIntervalDays: advice.adjustedFrequencyDays,
    reasons: [advice.reason],
    badge: advice.recommendationBadge,
  };
}
