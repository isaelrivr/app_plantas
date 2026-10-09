/**
 * Plantae Weather & Climate Service
 *
 * Utiliza expo-location para geolocalización precisa y la API abierta gratuita de Open-Meteo.
 * Ajusta dinámicamente el calendario de riego y genera alertas meteorológicas para plantas.
 *
 * NOTA DE SEGURIDAD:
 * Open-Meteo es una API pública que no requiere llaves ni autenticación.
 * Para datos meteorológicos premium en producción con proveedores comerciales (e.g. WeatherAPI / AccuWeather),
 * canaliza las peticiones a través de Firebase Cloud Functions sin exponer llaves en el cliente.
 */

import * as Location from 'expo-location';
import { t } from '../i18n';

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

// Fallback por defecto si no hay conexión o no hay permisos de GPS
const DEFAULT_FALLBACK_WEATHER: WeatherData = {
  city: 'Ciudad de México, MX',
  temperatureC: 22,
  humidityPercent: 48,
  rainProbability: 15,
  tempMaxC: 26,
  tempMinC: 12,
  weatherCode: 1,
  weatherDescription: 'Mayormente soleado',
  weatherIcon: 'sunny',
};

function computeClimateAdjustment(weather: WeatherData): ClimateWateringAdjustment {
  // 1. Alerta de frío y heladas
  if (weather.temperatureC <= 12 || weather.tempMinC <= 8) {
    return {
      alertType: 'frost',
      alertTitle: t('❄️ Alerta de Frío y Heladas'),
      alertMessage: t(
        'Las bajas temperaturas reducen la evaporación del agua. Resguarda tus plantas tropicales en interiores y espacia el riego para evitar pudrición radicular por frío.'
      ),
      wateringAdvice: t('Pospón el riego 2 a 3 días y usa agua a temperatura templada.'),
      wateringFactor: 'delay',
    };
  }

  // 2. Alerta de lluvia o alta humedad
  if (weather.rainProbability >= 50 || weather.humidityPercent >= 75) {
    return {
      alertType: 'rain',
      alertTitle: t('🌧️ Alta Humedad y Lluvia Pronosticada'),
      alertMessage: t(
        'La atmósfera saturada y las precipitaciones mantienen el cepellón húmedo. No apliques agua hoy a las plantas de exterior.'
      ),
      wateringAdvice: t('Suspende el riego hoy; la humedad ambiental nutre el follaje.'),
      wateringFactor: 'delay',
    };
  }

  // 3. Alerta de calor extremo
  if (weather.temperatureC >= 29 || weather.tempMaxC >= 32) {
    return {
      alertType: 'heat',
      alertTitle: t('🔥 Alerta de Ola de Calor'),
      alertMessage: t(
        'Las altas temperaturas evaporan la humedad del sustrato al doble de velocidad. Revisa la maceta y pulveriza follaje en horas tempranas.'
      ),
      wateringAdvice: t('Riega a primera hora de la mañana o al atardecer para evitar choque térmico.'),
      wateringFactor: 'increase',
    };
  }

  // 4. Condiciones óptimas
  return {
    alertType: 'optimal',
    alertTitle: t('🌿 Clima Templado Favorable'),
    alertMessage: t(
      'Temperatura y humedad en niveles de confort biológico. El sustrato se seca de acuerdo al calendario habitual.'
    ),
    wateringAdvice: t('Mantén el calendario de riego estándar según la especie.'),
    wateringFactor: 'normal',
  };
}

/**
 * Obtiene el clima actual del usuario o fallback y calcula recomendaciones para el jardín
 */
export async function getLocalWeatherAndRecommendations(): Promise<WeatherRecommendationResult> {
  try {
    // 1. Solicitar permisos de ubicación en Expo Go
    const { status } = await Location.requestForegroundPermissionsAsync();

    let latitude = 19.4326;
    let longitude = -99.1332;
    let cityName = 'Ciudad de México';

    if (status === 'granted') {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo) {
          cityName = geo.city || geo.subregion || geo.region || 'Tu Ubicación';
        }
      } catch {}
    }

    // 2. Consultar API abierta gratuita de Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

    const res = await fetch(url);
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

    return {
      weather,
      adjustment,
      isMockFallback: false,
    };
  } catch {
    // Retorno seguro en caso de falta de red exterior o permisos
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
