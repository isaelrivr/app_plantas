/**
 * EcoScan Habitat Service
 *
 * PROVEEDOR DE DATOS BIOGEOGRÁFICOS Y HÁBITAT MUNDIAL
 *
 * INTEGRACIÓN CON GBIF (Global Biodiversity Information Facility):
 * Para conectar este servicio a la API pública global en producción:
 *
 * 1. Endpoint oficial de GBIF:
 *    https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(scientificName)}&limit=200
 *
 * 2. Arquitectura recomendada con Firebase Cloud Functions:
 *    No consumas GBIF directamente desde el cliente para evitar rate limits y parseo pesado en el dispositivo.
 *    Implementa una Cloud Function con caché en Firestore:
 *    ```ts
 *    // functions/src/gbifHabitat.ts
 *    export const fetchPlantOccurrences = functions.https.onCall(async (data, context) => {
 *      const { scientificName } = data;
 *      const cached = await db.collection('species_habitats').doc(scientificName).get();
 *      if (cached.exists) return cached.data();
 *      const res = await fetch(`https://api.gbif.org/v1/occurrence/search?scientificName=${scientificName}&limit=150`);
 *      const json = await res.json();
 *      // Agrupar por país (countryCode) y categorizar en native, naturalized, cultivated
 *      return processedHabitat;
 *    });
 *    ```
 */

import { t } from '../i18n';
import { getPlantById } from './plantApi';
import { careSheetKey, getCachedCareSheet } from './plantCareCache';
import { isGeminiDirectAvailable, generateHabitatWithGemini } from './geminiService';
import { HABITAT_DATABASE } from './habitatRegionsData';

export type HabitatZoneType = 'native' | 'naturalized' | 'cultivated';

export interface HabitatRegionDetail {
  countryName: string; // Coincide con properties.name en world-atlas
  /** Numeric ISO-3166-1 identifier used by world-atlas. Filled during normalization. */
  countryId?: string;
  zoneType: HabitatZoneType;
  climate: string;
  floweringSeason: string;
  biogeographicZone: string;
  elevationMeters: string;
  notes: string;
}

export interface PlantHabitatInfo {
  plantId: string;
  scientificName: string;
  originSummary: string;
  globalCoverage: string;
  regions: HabitatRegionDetail[];
  conservationStatus: string;
}

/** Numeric ISO-3166-1 ids used by world-atlas/countries-110m.json. */
export const WORLD_ATLAS_COUNTRY_IDS: Readonly<Record<string, string>> = {
  'angola': '024', 'bolivia': '068', 'brazil': '076', 'cameroon': '120',
  'colombia': '170', 'costa rica': '188', 'dem. rep. congo': '180',
  'ecuador': '218', 'french polynesia': '250', 'gabon': '266',
  'greece': '300', 'guatemala': '320', 'indonesia': '360', 'italy': '380',
  'mexico': '484', 'nigeria': '566', 'panama': '591', 'peru': '604',
  'philippines': '608', 'spain': '724', 'taiwan': '158', 'tunisia': '788',
  'turkey': '792', 'united states of america': '840', 'venezuela': '862',
  'algeria': '012', 'argentina': '032', 'australia': '036', 'belize': '084',
  'china': '156', 'congo': '178', 'cuba': '192', 'egypt': '818',
  'eswatini': '748', 'france': '250', 'india': '356', 'iran': '364',
  'japan': '392', 'kenya': '404', 'korea': '410', 'south korea': '410',
  'madagascar': '450', 'malaysia': '458', 'mauritius': '480', 'morocco': '504',
  'mozambique': '508', 'myanmar': '104', 'namibia': '516', 'nepal': '524',
  'oman': '512', 'pacific islands': '242', 'pakistan': '586', 'portugal': '620',
  'saudi arabia': '682', 'south africa': '710', 'tanzania': '834', 'thailand': '764',
  'united kingdom': '826', 'united states': '840', 'yemen': '887', 'zimbabwe': '716',
  // Aliases en español y normalizados para integración con IA
  'méxico': '484', 'brasil': '076', 'perú': '604', 'panamá': '591',
  'estados unidos': '840', 'españa': '724', 'japón': '392', 'sudáfrica': '710',
  'sudafrica': '710', 'chile': '152', 'uruguay': '858', 'paraguay': '600',
  'honduras': '340', 'el salvador': '222', 'nicaragua': '558', 'vietnam': '704',
  'tailandia': '764', 'filipinas': '608', 'malasia': '458', 'canada': '124', 'canadá': '124',
};

/** Resuelve de forma tolerante el ID de world-atlas a partir del nombre del país */
export function resolveCountryAtlasId(name: string): string | undefined {
  if (!name) return undefined;
  const raw = name.toLowerCase().trim();
  if (WORLD_ATLAS_COUNTRY_IDS[raw]) return WORLD_ATLAS_COUNTRY_IDS[raw];
  const unaccented = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return WORLD_ATLAS_COUNTRY_IDS[unaccented];
}

export interface HabitatCountry {
  id: string;
  name: string;
  region: HabitatRegionDetail;
}

export interface HabitatCoordinate {
  countryId: string;
  longitude: number;
  latitude: number;
}

export interface HabitatBounds {
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
}


function buildHabitatFromRegions(
  plantId: string,
  scientificName: string,
  nativeRegions: string[],
  habitatSummary?: string,
  climateTip?: string
): PlantHabitatInfo {
  return {
    plantId,
    scientificName,
    originSummary: habitatSummary || `Especie originaria de ${nativeRegions.join(', ')}.`,
    globalCoverage: `Nativa en ${nativeRegions.join(', ')}; cultivada y apreciada a nivel mundial.`,
    conservationStatus: 'Preocupación Menor (LC)',
    regions: nativeRegions.map((regionName) => {
      const countryId = resolveCountryAtlasId(regionName);
      return {
        countryName: regionName,
        countryId,
        zoneType: 'native' as HabitatZoneType,
        climate: climateTip || 'Clima favorable para la especie',
        floweringSeason: 'Primavera a Verano',
        biogeographicZone: regionName,
        elevationMeters: '0 - 1,500 m s.n.m.',
        notes: habitatSummary || `Hábitat natural y distribución silvestre en ${regionName}.`,
      };
    }),
  };
}

/**
 * Traduce los textos visibles de una ficha de hábitat al idioma activo.
 * Se ejecuta al construir el resultado para respetar el idioma en uso.
 */
function localizeHabitat(source: PlantHabitatInfo): PlantHabitatInfo {
  return {
    ...source,
    originSummary: t(source.originSummary),
    globalCoverage: t(source.globalCoverage),
    conservationStatus: t(source.conservationStatus),
    regions: source.regions.map((region) => ({
      ...region,
      countryId: region.countryId || resolveCountryAtlasId(region.countryName),
      climate: t(region.climate),
      floweringSeason: t(region.floweringSeason),
      biogeographicZone: t(region.biogeographicZone),
      elevationMeters: t(region.elevationMeters),
      notes: t(region.notes),
    })),
  };
}

/**
 * Obtiene los datos biogeográficos y regiones de hábitat de una especie,
 * integrando la base local, la ficha generada por Gemini y la IA en tiempo real.
 */
export async function getPlantHabitat(
  plantId: string,
  plantName?: string,
  scientificName?: string
): Promise<PlantHabitatInfo> {
  // 1. Base local predefinida
  const localData = HABITAT_DATABASE[plantId];
  if (localData) {
    return localizeHabitat(localData);
  }

  // 2. Catálogo botánico local
  const catalogPlant = getPlantById(plantId);
  if (catalogPlant && catalogPlant.nativeRegions && catalogPlant.nativeRegions.length > 0) {
    const fromCatalog = buildHabitatFromRegions(
      plantId,
      catalogPlant.scientificName,
      catalogPlant.nativeRegions,
      catalogPlant.habitatSummary,
      catalogPlant.climateTip
    );
    return localizeHabitat(fromCatalog);
  }

  // 3. Ficha de cuidados en caché (producida por escaneo con Gemini Vision)
  const lookupName = (plantName || plantId || '').trim();
  const cachedSheet = await getCachedCareSheet(careSheetKey(lookupName, scientificName || ''));
  if (cachedSheet && Array.isArray(cachedSheet.nativeRegions) && cachedSheet.nativeRegions.length > 0) {
    const fromCache = buildHabitatFromRegions(
      plantId,
      cachedSheet.scientificName || scientificName || lookupName,
      cachedSheet.nativeRegions,
      cachedSheet.habitatSummary,
      cachedSheet.climateTip
    );
    return localizeHabitat(fromCache);
  }

  // 4. Si Gemini está disponible y no hay datos previos, generar mapa biogeográfico con Gemini
  if (isGeminiDirectAvailable()) {
    try {
      const geminiData = await generateHabitatWithGemini(lookupName, scientificName);
      if (geminiData && geminiData.regions.length > 0) {
        const fromGemini: PlantHabitatInfo = {
          plantId,
          scientificName: geminiData.scientificName,
          originSummary: geminiData.originSummary,
          globalCoverage: geminiData.globalCoverage,
          conservationStatus: geminiData.conservationStatus,
          regions: geminiData.regions.map((r) => ({
            ...r,
            countryId: resolveCountryAtlasId(r.countryName),
          })),
        };
        return localizeHabitat(fromGemini);
      }
    } catch (e) {
      console.warn('[Gemini Habitat] Error generando mapa de hábitat:', e);
    }
  }

  // Fallback por defecto
  return localizeHabitat({
    plantId,
    scientificName: scientificName || '',
    originSummary: t('Información de hábitat biogeográfico en actualización.'),
    globalCoverage: '',
    conservationStatus: t('No evaluada (NE)'),
    regions: [],
  });
}

/** Returns all regions whose distribution is native, keyed by world-atlas id. */
export function getNativeCountries(info: PlantHabitatInfo): HabitatCountry[] {
  const result: HabitatCountry[] = [];
  for (const region of info.regions) {
    if (region.zoneType !== 'native') continue;
    const id = region.countryId || resolveCountryAtlasId(region.countryName);
    if (id) {
      result.push({ id, name: region.countryName, region: { ...region, countryId: id } });
    }
  }
  return result;
}

/** Returns every mapped country, including naturalized and cultivated regions. */
export function getMappedCountries(info: PlantHabitatInfo): HabitatCountry[] {
  const result: HabitatCountry[] = [];
  for (const region of info.regions) {
    const id = region.countryId || resolveCountryAtlasId(region.countryName);
    if (id) {
      result.push({ id, name: region.countryName, region: { ...region, countryId: id } });
    }
  }
  return result;
}

export function calculateHabitatCentroid(points: readonly HabitatCoordinate[]): [number, number] | null {
  if (points.length === 0) return null;
  const total = points.reduce(
    (sum, point) => ({ longitude: sum.longitude + point.longitude, latitude: sum.latitude + point.latitude }),
    { longitude: 0, latitude: 0 },
  );
  return [total.longitude / points.length, total.latitude / points.length];
}

export function calculateHabitatBounds(points: readonly HabitatCoordinate[]): HabitatBounds | null {
  if (points.length === 0) return null;
  return points.reduce<HabitatBounds>(
    (bounds, point) => ({
      minLongitude: Math.min(bounds.minLongitude, point.longitude),
      minLatitude: Math.min(bounds.minLatitude, point.latitude),
      maxLongitude: Math.max(bounds.maxLongitude, point.longitude),
      maxLatitude: Math.max(bounds.maxLatitude, point.latitude),
    }),
    {
      minLongitude: points[0].longitude,
      minLatitude: points[0].latitude,
      maxLongitude: points[0].longitude,
      maxLatitude: points[0].latitude,
    },
  );
}

/** Validates that every mapped habitat country exists in the supplied atlas ids. */
export function validateHabitatCountryIds(
  info: PlantHabitatInfo,
  atlasIds: ReadonlySet<string>,
): string[] {
  return getMappedCountries(info)
    .map((country) => country.id)
    .filter((id, index, ids) => !atlasIds.has(id) && ids.indexOf(id) === index);
}

/**
 * Retorna todos los países únicos donde habita la planta clasificados por tipo de zona
 */
export function getRegionTypeColor(zoneType: HabitatZoneType, isDark: boolean): string {
  switch (zoneType) {
    case 'native':
      return isDark ? '#4CAF50' : '#2E7D32'; // Verde esmeralda intenso
    case 'naturalized':
      return isDark ? '#26C6DA' : '#00838F'; // Cian / azul cielo
    case 'cultivated':
      return isDark ? '#FFCA28' : '#D4A017'; // Ámbar dorado
    default:
      return '#8E8E93';
  }
}
