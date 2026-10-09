/**
 * Tipos compartidos del backend de Plantae.
 * Son el espejo de los tipos del cliente (services/plantApi.ts, healthService.ts).
 */

export type IdentificationSource = 'ai-real' | 'mock';

export interface ReferenceImage {
  small: string;
  full: string;
}

export interface IdentificationCandidate {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  genus?: string;
  /** 0 a 100 */
  confidence: number;
  commonNames: string[];
  wikiDescription?: string;
  referenceImages: ReferenceImage[];
  source: IdentificationSource;
}

export interface ImageQualityFlags {
  /** La imagen comprimida parece demasiado pequeña / borrosa para analizar bien. */
  lowResolution?: boolean;
  lowConfidence?: boolean;
  note?: string;
}

export interface IdentifyRequest {
  /** Imágenes comprimidas a ~1024px JPEG (base64). Máx. 4. */
  images: string[];
  /** Idempotencia: si se reenvía el mismo requestId no se vuelve a consumir cuota. */
  requestId?: string;
}

export interface IdentifyResponse {
  candidates: IdentificationCandidate[];
  isPlant: boolean;
  imageQuality: ImageQualityFlags;
  requestId?: string;
}

export interface CareRequest {
  speciesName: string;
  scientificName?: string;
}

export interface CareLevels {
  lightLevel: number; // 1 a 5
  wateringLevel: number; // 1 a 5
  humidityLevel: number; // 1 a 5
  tempMinC: number;
  tempMaxC: number;
}

export interface CareSheet {
  commonName: string;
  scientificName: string;
  family: string;
  watering: string;
  wateringFrequencyDays: number; // 1 a 45
  light: string;
  temperature: string;
  humidity: string;
  careLevels: CareLevels;
  difficulty: 'Fácil' | 'Moderado' | 'Avanzado';
  commonProblems: string[];
  climateTip: string;
  habitatSummary: string;
  nativeRegions: string[];
  avatarEmoji: string;
  /** Nota de toxicidad para mascotas/niños (opcional, informativa). */
  toxicity?: string;
}

export type HealthCategory = 'Plaga' | 'Hongo' | 'Bacteriosis' | 'Estrés Hídrico' | 'Saludable';
export type HealthSeverity = 'leve' | 'moderada' | 'grave';

export interface TreatmentSafetyAlert {
  hasPetsWarning: boolean;
  hasChildrenWarning: boolean;
  requireGloves: boolean;
  text: string;
}

export interface TreatmentOption {
  title: string;
  products: string;
  dosage: string;
  instructions: string;
}

export interface TreatmentDetails {
  organicOption: TreatmentOption;
  chemicalOption: TreatmentOption;
  frequency: string;
  recoveryDays: string;
  prevention: string;
  safetyAlert: TreatmentSafetyAlert;
}

export interface HealthRequest {
  images: string[];
  plantName?: string;
  requestId?: string;
}

/** Descargo médico fijo que acompaña a todo diagnóstico. */
export const HEALTH_DISCLAIMER =
  'Este diagnóstico es orientativo y generado por inteligencia artificial; no sustituye la evaluación de un fitopatólogo profesional. Verifica siempre las indicaciones y las etiquetas oficiales de los productos fitosanitarios antes de aplicarlos.';

export interface HealthResponse {
  isPlant: boolean;
  isHealthy: boolean;
  /** 0 a 100: probabilidad de la sugerencia principal. */
  confidence: number;
  issueKey: string;
  name: string;
  scientificName: string;
  category: HealthCategory;
  severity: HealthSeverity;
  description: string;
  symptoms: string[];
  treatment: TreatmentDetails;
  referenceImages: string[];
  disclaimer: string;
  source: IdentificationSource;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    retryAfterSeconds?: number;
  };
}