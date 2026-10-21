/**
 * EcoScan Weather Configuration & Supported Cities
 *
 * Configuración pura de ciudades y parámetros de caché para el servicio meteorológico.
 * Libre de dependencias nativas para uso universal en tests, servicios y UI.
 */

export interface SupportedCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export type ManualCity = SupportedCity;

export const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

export const SUPPORTED_CITIES: SupportedCity[] = [
  { name: 'Torreón, Coah.', country: 'México', latitude: 25.5428, longitude: -103.4068 },
  { name: 'Madrid', country: 'España', latitude: 40.4168, longitude: -3.7038 },
  { name: 'Ciudad de México', country: 'México', latitude: 19.4326, longitude: -99.1332 },
  { name: 'Buenos Aires', country: 'Argentina', latitude: -34.6037, longitude: -58.3816 },
  { name: 'Bogotá', country: 'Colombia', latitude: 4.711, longitude: -74.0721 },
  { name: 'Santiago', country: 'Chile', latitude: -33.4489, longitude: -70.6693 },
  { name: 'Lima', country: 'Perú', latitude: -12.0464, longitude: -77.0428 },
  { name: 'Barcelona', country: 'España', latitude: 41.3851, longitude: 2.1734 },
  { name: 'Guadalajara', country: 'México', latitude: 20.6597, longitude: -103.3496 },
  { name: 'Miami', country: 'Estados Unidos', latitude: 25.7617, longitude: -80.1918 },
];
