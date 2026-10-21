/**
 * EcoScan Weather & Climate Service
 *
 * Utiliza expo-location para geolocalización o selección manual de ciudad
 * y la API abierta gratuita de Open-Meteo. Ajusta el calendario de riego
 * y genera alertas meteorológicas para tus plantas sin jerga técnica.
 */

import * as Location from 'expo-location';
import { loadJSON, saveJSON, STORAGE_KEYS } from './storage.ts';
import { WEATHER_CACHE_TTL_MS, SUPPORTED_CITIES } from './weatherConfig.ts';
export * from './weatherConfig.ts';

// Helper para textos de clima
const t = (text: string): string => text;

export interface WeatherData {
  city: string;
  temperatureC: number;
  humidityPercent: number;
  rainProbability: number;
  tempMaxC: number;
  tempMinC: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
}

export interface ClimateWateringAdjustment {
  wateringAdvice: string;
  alertType: 'frost' | 'heat' | 'rain' | 'optimal';
  alertTitle: string;
  alertMessage: string;
  wateringFactor: 'increase' | 'delay' | 'normal';
}

export interface WeatherRecommendationResult {
  weather: WeatherData;
  adjustment: ClimateWateringAdjustment;
  isMockFallback: boolean;
}

interface WeatherCacheEntry {
  savedAt: number;
  result: WeatherRecommendationResult;
}

export async function getManualCity(): Promise<string | null> {
  return loadJSON<string | null>(STORAGE_KEYS.manualCity, null);
}

export async function setManualCity(cityName: string | null): Promise<void> {
  if (cityName == null) {
    await saveJSON(STORAGE_KEYS.manualCity, null);
  } else {
    await saveJSON(STORAGE_KEYS.manualCity, cityName);
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

const DEFAULT_FALLBACK_WEATHER: WeatherData = {
  city: 'Torreón, Coah.',
  temperatureC: 24,
  humidityPercent: 35,
  rainProbability: 5,
  tempMaxC: 30,
  tempMinC: 15,
  weatherCode: 0,
  weatherDescription: 'Despejado',
  weatherIcon: 'sunny',
};

function computeClimateAdjustment(weather: WeatherData): ClimateWateringAdjustment {
  if (weather.temperatureC <= 12 || weather.tempMinC <= 8) {
    return {
      alertType: 'frost',
      alertTitle: t('Alerta de frío'),
      alertMessage: t(
        'Las bajas temperaturas reducen la evaporación del agua. Resguarda tus plantas en interiores y espacia el riego.'
      ),
      wateringAdvice: t('Pospón el riego 2 a 3 días y usa agua a temperatura templada.'),
      wateringFactor: 'delay',
    };
  }

  if (weather.rainProbability >= 50 || weather.humidityPercent >= 75) {
    return {
      alertType: 'rain',
      alertTitle: t('Lluvia y humedad alta'),
      alertMessage: t(
        'La humedad ambiental mantiene la tierra húmeda. No riegues hoy tus plantas que estén al exterior.'
      ),
      wateringAdvice: t('Suspende el riego hoy; la humedad ambiental nutre las hojas.'),
      wateringFactor: 'delay',
    };
  }

  if (weather.temperatureC >= 28 || weather.tempMaxC >= 32) {
    return {
      alertType: 'heat',
      alertTitle: t('Ola de calor'),
      alertMessage: t(
        'El calor acelera la deshidratación del sustrato. Revisa la tierra y no expongas tus plantas a sol directo en horas centrales.'
      ),
      wateringAdvice: t('Riega a primera hora de la mañana o al atardecer para no evaporar el agua.'),
      wateringFactor: 'increase',
    };
  }

  return {
    alertType: 'optimal',
    alertTitle: t('Clima favorable'),
    alertMessage: t('Temperatura y humedad equilibradas. Sigue la rutina habitual de riego.'),
    wateringAdvice: t('Clima ideal: riega según el calendario normal de cada planta.'),
    wateringFactor: 'normal',
  };
}

export async function getLiveWeatherAdvice(forceRefresh = false): Promise<WeatherRecommendationResult> {
  // 1. Revisar caché local válida (descartar si era la fallback anterior genérica)
  if (!forceRefresh) {
    const cached = await loadJSON<WeatherCacheEntry | null>(STORAGE_KEYS.weatherCache, null);
    if (
      cached &&
      Date.now() - cached.savedAt < WEATHER_CACHE_TTL_MS &&
      !cached.result.weather?.city?.includes('Ciudad de México')
    ) {
      return cached.result;
    }
  }

  try {
    let latitude = 25.5428;
    let longitude = -103.4068;
    let cityName = 'Torreón, Coah.';

    // 2. Comprobar si el usuario configuró una ciudad manual
    const manualCityName = await getManualCity();
    const matchedCity = manualCityName
      ? SUPPORTED_CITIES.find(
          (c) =>
            c.name.toLowerCase() === manualCityName.toLowerCase() ||
            (manualCityName.toLowerCase().includes('torre') && c.name.toLowerCase().includes('torre'))
        )
      : null;

    if (matchedCity) {
      latitude = matchedCity.latitude;
      longitude = matchedCity.longitude;
      cityName = matchedCity.name.includes('Coah') ? matchedCity.name : `${matchedCity.name}, ${matchedCity.country}`;
    } else {
      // 3. Consultar GPS si no hay ciudad manual
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const perm = await Location.requestForegroundPermissionsAsync();
          status = perm.status;
        }
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;

          const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geocode.length > 0) {
            const first = geocode[0];
            const city = first.city || first.subregion || first.district;
            const region = first.region;
            const country = first.country;
            if (city) {
              if (city.toLowerCase().includes('torre') || (region && region.toLowerCase().includes('coahuila'))) {
                cityName = 'Torreón, Coah.';
              } else if (region) {
                cityName = `${city}, ${region}`;
              } else if (country) {
                cityName = `${city}, ${country}`;
              } else {
                cityName = city;
              }
            } else if (region) {
              cityName = region.toLowerCase().includes('coahuila') ? 'Torreón, Coah.' : region;
            }
          }
        }
      } catch {}
    }

    // 4. Consultar Open-Meteo con timeout
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

    const res = await fetchWithTimeout(url, 10_000);
    if (!res.ok) throw new Error('Respuesta no válida de Open-Meteo');

    const data = await res.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const temp = Math.round(current.temperature_2m ?? 22);
    const humidity = Math.round(current.relative_humidity_2m ?? 50);
    const rainProb = Math.round(daily.precipitation_probability_max?.[0] ?? 10);
    const tempMax = Math.round(daily.temperature_2m_max?.[0] ?? temp + 4);
    const tempMin = Math.round(daily.temperature_2m_min?.[0] ?? temp - 6);
    const code = current.weather_code ?? 0;

    let icon = 'sunny';
    let desc = 'Despejado';

    if (code >= 1 && code <= 3) {
      icon = 'partly-sunny';
      desc = 'Parcialmente nublado';
    } else if (code >= 45 && code <= 48) {
      icon = 'cloudy';
      desc = 'Niebla matutina';
    } else if (code >= 51 && code <= 67) {
      icon = 'rainy';
      desc = 'Lluvia ligera';
    } else if (code >= 71) {
      icon = 'snow';
      desc = 'Precipitación fría';
    }

    const weather: WeatherData = {
      city: cityName,
      temperatureC: temp,
      humidityPercent: humidity,
      rainProbability: rainProb,
      tempMaxC: tempMax,
      tempMinC: tempMin,
      weatherCode: code,
      weatherDescription: t(desc),
      weatherIcon: icon,
    };

    const adjustment = computeClimateAdjustment(weather);

    const result: WeatherRecommendationResult = {
      weather,
      adjustment,
      isMockFallback: false,
    };
    await saveJSON<WeatherCacheEntry>(STORAGE_KEYS.weatherCache, { savedAt: Date.now(), result });
    return result;
  } catch {
    const adjustment = computeClimateAdjustment(DEFAULT_FALLBACK_WEATHER);
    return {
      weather: {
        ...DEFAULT_FALLBACK_WEATHER,
        weatherDescription: t(DEFAULT_FALLBACK_WEATHER.weatherDescription),
      },
      adjustment,
      isMockFallback: true,
    };
  }
}

export const getLocalWeatherAndRecommendations = getLiveWeatherAdvice;
