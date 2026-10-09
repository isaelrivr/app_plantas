/**
 * Plantae Health & Pest Diagnosis Service
 *
 * Diagnóstico real de patologías foliares, plagas y deficiencias. Las imágenes
 * se comprimen y se envían al backend (`/healthAssessment`), que orquesta
 * Plant.id + Gemini. El cliente nunca maneja claves de API.
 *
 * En desarrollo, si no hay backend configurado, se usa un catálogo local
 * determinista (sin `Math.random`) marcado como `source: 'mock'`.
 */

import { ApiError, postJson, shouldUseMocks } from './apiClient';
import { compressImages } from './imageCompression';
import { t } from '../i18n';

export type HealthSeverity = 'leve' | 'moderada' | 'grave';
export type HealthCategory = 'Plaga' | 'Hongo' | 'Bacteriosis' | 'Estrés Hídrico' | 'Saludable';
export type HealthSource = 'ai-real' | 'mock';

export interface TreatmentDetails {
  organicOption: {
    title: string;
    products: string;
    dosage: string;
    instructions: string;
  };
  chemicalOption: {
    title: string;
    products: string;
    dosage: string;
    instructions: string;
  };
  frequency: string;
  recoveryDays: string;
  prevention: string;
  safetyAlert: {
    hasPetsWarning: boolean;
    hasChildrenWarning: boolean;
    requireGloves: boolean;
    text: string;
  };
}

export interface HealthDiagnosisResult {
  id: string;
  issueKey: string;
  name: string;
  scientificName: string;
  category: HealthCategory;
  severity: HealthSeverity;
  confidence: number;
  symptoms: string[];
  description: string;
  referenceImages: string[];
  treatment: TreatmentDetails;
  /** Descargo médico que debe mostrarse junto al diagnóstico. */
  disclaimer: string;
  source: HealthSource;
}

/** Entrada del catálogo de demostración, sin metadatos comunes. */
type DemoDiagnosis = Omit<HealthDiagnosisResult, 'disclaimer' | 'source'>;

/** Descargo médico (espejo del servidor) para diagnósticos orientativos. */
export const HEALTH_DISCLAIMER =
  'Este diagnóstico es orientativo y generado por inteligencia artificial; no sustituye la evaluación de un fitopatólogo profesional. Verifica siempre las indicaciones y las etiquetas oficiales de los productos fitosanitarios antes de aplicarlos.';

/** La imagen no contiene una planta analizable. */
export class HealthNoPlantError extends Error {
  constructor(
    message = t('La imagen no parece contener hojas, tallos ni partes de una planta analizables.')
  ) {
    super(message);
    this.name = 'HealthNoPlantError';
  }
}

/** Respuesta cruda del endpoint `/healthAssessment`. */
interface HealthApiResponse {
  isPlant: boolean;
  isHealthy: boolean;
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
  source: HealthSource;
}

const HEALTH_CATALOG: DemoDiagnosis[] = [
  {
    id: 'pest-cochinilla',
    issueKey: 'cochinilla',
    name: 'Cochinilla Algodonosa',
    scientificName: 'Planococcus citri',
    category: 'Plaga',
    severity: 'moderada',
    confidence: 96,
    symptoms: [
      'Masas blancas pegajosas con aspecto de algodón en axilas y envés de las hojas.',
      'Melaza brillante segregada sobre el follaje que atrae hormigas.',
      'Hojas amarillentas que pierden vigor por succión de savia.',
    ],
    description: 'Insecto chupador protegido por una secreción cerosa blanca que debilita progresivamente la planta y fomenta el hongo negrilla.',
    referenceImages: ['cochinilla_foliar', 'cochinilla_stem'],
    treatment: {
      organicOption: {
        title: 'Jabón Potásico con Aceite de Neem',
        products: 'Jabón potásico líquido + Extracto puro de Neem',
        dosage: '10 ml de jabón potásico + 5 ml de aceite de neem por cada litro de agua tibia.',
        instructions: 'Emulsionar bien en pulverizador y rociar toda la planta al atardecer, incidiendo especialmente en el envés y nudos.',
      },
      chemicalOption: {
        title: 'Insecticida Sistémico de Amplio Espectro',
        products: 'Acetamiprid al 20% o Imidacloprid',
        dosage: '0.5 ml por litro de agua para pulverización o riego al sustrato.',
        instructions: 'Aplicar al sustrato para que la planta absorba el principio activo hacia la savia.',
      },
      frequency: 'Cada 4 a 5 días durante 3 semanas consecutivas.',
      recoveryDays: '7 a 12 días para erradicación y reanudación de brotes nuevos.',
      prevention: 'Evita el ambiente excesivamente seco y caliente; aísla plantas nuevas durante 14 días.',
      safetyAlert: {
        hasPetsWarning: true,
        hasChildrenWarning: true,
        requireGloves: true,
        text: 'Mantén a mascotas y niños alejados durante la pulverización y hasta que el follaje esté 100% seco. Usa guantes protectores.',
      },
    },
  },
  {
    id: 'pest-arana-roja',
    issueKey: 'arana_roja',
    name: 'Araña Roja (Ácaros Tetraníquidos)',
    scientificName: 'Tetranychus urticae',
    category: 'Plaga',
    severity: 'grave',
    confidence: 94,
    symptoms: [
      'Micropunteado amarillo o plateado denso en la superficie superior de la hoja.',
      'Telarañas muy finas entre peciolos y brotes tiernos.',
      'Desecación y caída masiva de hojas en condiciones de calor seco.',
    ],
    description: 'Ácaros microscópicos que proliferan con velocidad exponencial en climas cálidos y secos, decolorando el tejido celular.',
    referenceImages: ['spider_mite_web', 'mite_damage_leaf'],
    treatment: {
      organicOption: {
        title: 'Azufre Elemental o Infusión de Ajo y Jabón',
        products: 'Azufre mojable micronizado o Jabón potásico',
        dosage: '3 g de azufre por litro de agua.',
        instructions: 'Lavar primero la planta con abundante agua para retirar telarañas y aplicar azufre con buena ventilación.',
      },
      chemicalOption: {
        title: 'Acaricida Específico Ovilarvicida',
        products: 'Abamectina o Tebufenpirad',
        dosage: '1 ml por litro de agua.',
        instructions: 'Pulverizar abundantemente empapando haz y envés. No mezclar con aceites minerales.',
      },
      frequency: 'Cada 3 días por 4 aplicaciones seguidas.',
      recoveryDays: '5 a 8 días para detener el avance de telarañas.',
      prevention: 'Aumenta la humedad ambiental por encima del 60%; los ácaros no toleran la humedad.',
      safetyAlert: {
        hasPetsWarning: true,
        hasChildrenWarning: true,
        requireGloves: true,
        text: 'El azufre irrita ojos y vías respiratorias. Aplica en exteriores con mascarilla y guantes.',
      },
    },
  },
  {
    id: 'pest-pulgon',
    issueKey: 'pulgon',
    name: 'Pulgón Verde / Negro',
    scientificName: 'Aphis gossypii',
    category: 'Plaga',
    severity: 'moderada',
    confidence: 97,
    symptoms: [
      'Colonias densas de pequeños insectos verdes, negros o pardos en brotes nuevos y capullos.',
      'Hojas jóvenes arrugadas, retorcidas y deformadas.',
      'Sustancia pegajosa brillante en las hojas y suelo.',
    ],
    description: 'Insectos chupadores muy prolíficos que transmiten virus vegetales y deforman los brotes tiernos en crecimiento.',
    referenceImages: ['aphid_cluster', 'aphid_curled_leaf'],
    treatment: {
      organicOption: {
        title: 'Solución de Jabón Negro o Infusión de Ortiga',
        products: 'Jabón blando de potasa + Vinagre de manzana diluido',
        dosage: '15 ml de jabón + 5 ml de vinagre por litro de agua.',
        instructions: 'Rociar a presión directa sobre las colonias visibles para disolver su cutícula protectora.',
      },
      chemicalOption: {
        title: 'Piretrinas Naturales o Deltametrina',
        products: 'Insecticida polivalente a base de deltametrina',
        dosage: '0.8 ml por litro de agua.',
        instructions: 'Pulverización fina uniforme al caer la tarde.',
      },
      frequency: 'Cada 4 días hasta la desaparición total (2 a 3 aplicaciones).',
      recoveryDays: '4 a 6 días; los brotes afectados se limpian rápidamente.',
      prevention: 'Inspecciona periódicamente el envés de las hojas tiernas y controla poblaciones de hormigas.',
      safetyAlert: {
        hasPetsWarning: true,
        hasChildrenWarning: false,
        requireGloves: true,
        text: 'Usa guantes. Las piretrinas sintéticas son tóxicas para gatos y peces de acuario.',
      },
    },
  },
  {
    id: 'pest-mosca-blanca',
    issueKey: 'mosca_blanca',
    name: 'Mosca Blanca',
    scientificName: 'Bemisia tabaci',
    category: 'Plaga',
    severity: 'moderada',
    confidence: 93,
    symptoms: [
      'Nube de diminutas moscas blancas que levantan el vuelo al mover la maceta.',
      'Puntos amarillentos cloróticos en el haz de las hojas.',
      'Presencia de ninfas y huevos ovalados en el envés foliar.',
    ],
    description: 'Hemípteros diminutos que succionan savia y segregan melaza, debilitando la fotosíntesis foliar.',
    referenceImages: ['whitefly_swarm', 'whitefly_underside'],
    treatment: {
      organicOption: {
        title: 'Trampas Cromáticas Amarillas + Aceite de Neem',
        products: 'Trampas adhesivas amarillas + Aceite de neem',
        dosage: 'Colocar 2 trampas adhesivas a nivel de copa + 5 ml/L de neem.',
        instructions: 'Las trampas atrapan adultos voladores; el neem esteriliza larvas y huevos.',
      },
      chemicalOption: {
        title: 'Insecticida Específico IGR (Regulador de Crecimiento)',
        products: 'Piriproxifeno al 10%',
        dosage: '0.75 ml por litro de agua.',
        instructions: 'Interrumpe el ciclo biológico impidiendo que las ninfas lleguen a estado adulto.',
      },
      frequency: 'Cada 5 días durante 3 semanas.',
      recoveryDays: '10 a 14 días.',
      prevention: 'Ventilación adecuada e instalación de trampas amarillas preventivas.',
      safetyAlert: {
        hasPetsWarning: false,
        hasChildrenWarning: false,
        requireGloves: true,
        text: 'Usa guantes para manipular trampas adhesivas y no salpicar soluciones foliares.',
      },
    },
  },
  {
    id: 'fungus-oidio',
    issueKey: 'hongos',
    name: 'Hongos Foliares (Oídio / Roya)',
    scientificName: 'Erysiphe spp. / Puccinia spp.',
    category: 'Hongo',
    severity: 'grave',
    confidence: 95,
    symptoms: [
      'Polvillo blanquecino o cenizo semejante a harina en la superficie de las hojas (Oídio).',
      'Pústulas anaranjadas o marrones circulares en el envés (Roya).',
      'Hojas que se abarquillan, secan y caen prematuramente.',
    ],
    description: 'Esporas fúngicas que colonizan el tejido fotosintético promovidas por exceso de humedad estancada y escasa ventilación.',
    referenceImages: ['powdery_mildew', 'rust_spots'],
    treatment: {
      organicOption: {
        title: 'Bicarbonato de Potasio y Leche Desnatada',
        products: 'Bicarbonato potásico + Leche desnatada en agua',
        dosage: '5 g de bicarbonato + 100 ml de leche por litro de agua.',
        instructions: 'Cambia el pH de la superficie foliar e impide la germinación de nuevas esporas.',
      },
      chemicalOption: {
        title: 'Fungicida Polivalente (Difenoconazol)',
        products: 'Difenoconazol al 25% o Oxicloruro de cobre',
        dosage: '0.5 ml por litro de agua.',
        instructions: 'Fungicida curativo y preventivo sistémico de rápida penetración foliar.',
      },
      frequency: 'Cada 7 días por 3 aplicaciones.',
      recoveryDays: '10 a 15 días (las manchas viejas no sanan, pero no aparecen nuevas).',
      prevention: 'Nunca mojes las hojas al regar y mejora la circulación de aire entre macetas.',
      safetyAlert: {
        hasPetsWarning: true,
        hasChildrenWarning: true,
        requireGloves: true,
        text: 'Corta las hojas más invadidas y deséchalas en bolsa cerrada. No las compostes.',
      },
    },
  },
  {
    id: 'disease-pudricion-raiz',
    issueKey: 'pudricion_raiz',
    name: 'Pudrición Radicular (Phytophthora)',
    scientificName: 'Phytophthora cactorum',
    category: 'Hongo',
    severity: 'grave',
    confidence: 92,
    symptoms: [
      'Tallo blando y oscuro a ras del sustrato.',
      'Hojas amarillentas que se desprenden al menor roce con suelo húmedo.',
      'Olor a descomposición o humedad rancia proveniente del tiesto.',
    ],
    description: 'Oomiceto destructivo que asfixia el sistema vascular radicular por encharcamiento continuo de la maceta.',
    referenceImages: ['root_rot_black', 'stem_collar_rot'],
    treatment: {
      organicOption: {
        title: 'Poda Radicular + Canela en Polvo + Sustrato Nuevo',
        products: 'Canela molida (antifúngico natural) + Perlita mineral',
        dosage: 'Espolvorear canela generosamente sobre los cortes de raíz limpia.',
        instructions: 'Desenterrar la planta, lavar raíces, cortar las negras o blandas, desinfectar y trasplantar a tierra seca.',
      },
      chemicalOption: {
        title: 'Fosetil-Aluminio Sistémico Radicular',
        products: 'Fosetil-Al 80%',
        dosage: '2.5 g por litro de agua de riego.',
        instructions: 'Estimula las defensas naturales y detiene el micelio dentro de los vasos vasculares.',
      },
      frequency: 'Una aplicación al trasplante y repetir a los 15 días si reanuda crecimiento.',
      recoveryDays: '20 a 30 días para emisión de nuevas raíces secundarias.',
      prevention: 'Asegúrate de que la maceta tenga orificios de drenaje y vacía el agua del plato tras 15 minutos.',
      safetyAlert: {
        hasPetsWarning: false,
        hasChildrenWarning: false,
        requireGloves: true,
        text: 'Desinfecta tijeras con alcohol al 70% antes y después de podar para no contagiar otras plantas.',
      },
    },
  },
  {
    id: 'stress-exceso-riego',
    issueKey: 'exceso_riego',
    name: 'Clorosis por Exceso de Riego',
    scientificName: 'Asfixia Radicular No Patógena',
    category: 'Estrés Hídrico',
    severity: 'leve',
    confidence: 96,
    symptoms: [
      'Hojas inferiores uniformemente amarillas pero blandas (no crujientes).',
      'Puntas marrones húmedas rodeadas de un halo amarillo translúcido.',
      'Sustrato empapado que tarda más de 12 días en secar.',
    ],
    description: 'Asfixia celular provocada por falta de oxígeno en los poros del suelo debido al riego excesivamente frecuente.',
    referenceImages: ['yellow_overwater_leaf', 'soggy_soil'],
    treatment: {
      organicOption: {
        title: 'Espaciado de Riego y Aireación del Sustrato',
        products: 'Palillo de madera o varilla para oxigenar',
        dosage: 'Sin productos químicos requeridos.',
        instructions: 'Pinchazos suaves en el sustrato para crear canales de aireación y suspender el riego de inmediato.',
      },
      chemicalOption: {
        title: 'Bioestimulante Antiestrés con Aminoácidos',
        products: 'Extracto de algas marinas (Ascophyllum nodosum)',
        dosage: '2 ml por litro de agua en el próximo riego.',
        instructions: 'Ayuda a la planta a recuperar la actividad radicular una vez el sustrato haya secado.',
      },
      frequency: 'Esperar a que los primeros 4 cm de tierra estén secos antes del siguiente riego.',
      recoveryDays: '7 a 10 días.',
      prevention: 'Comprueba siempre la humedad con el dedo o un higrómetro antes de regar.',
      safetyAlert: {
        hasPetsWarning: false,
        hasChildrenWarning: false,
        requireGloves: false,
        text: 'Práctica 100% segura; no se requieren sustancias tóxicas.',
      },
    },
  },
  {
    id: 'stress-falta-riego',
    issueKey: 'falta_riego',
    name: 'Estrés Hídrico por Falta de Riego',
    scientificName: 'Deshidratación Celular',
    category: 'Estrés Hídrico',
    severity: 'leve',
    confidence: 98,
    symptoms: [
      'Follaje flácido y decaído hacia abajo.',
      'Bordes de hojas secos, crujientes y quebradizos.',
      'La tierra se ha separado de los bordes de la maceta.',
    ],
    description: 'Pérdida de turgencia celular por deshidratación temporal. Muy fácil de corregir si las raíces aún están vivas.',
    referenceImages: ['dry_crispy_leaves', 'drooping_plant'],
    treatment: {
      organicOption: {
        title: 'Riego por Inmersión Profunda',
        products: 'Agua tibia reposada',
        dosage: 'Sumergir maceta 15 a 20 minutos.',
        instructions: 'Sumergir la maceta hasta la mitad en un recipiente con agua hasta que el sustrato absorba por capilaridad.',
      },
      chemicalOption: {
        title: 'Humectante Orgánico de Sustrato',
        products: 'Extracto de saponinas vegetales',
        dosage: '1 ml por litro.',
        instructions: 'Restaura la capacidad de retención de agua de sustratos de turba muy deshidratados.',
      },
      frequency: 'Riego único de emergencia; luego retomar calendario normal según la especie.',
      recoveryDays: '4 a 8 horas tras el riego por inmersión.',
      prevention: 'Configura alarmas de riego personalizadas en Plantae Pro.',
      safetyAlert: {
        hasPetsWarning: false,
        hasChildrenWarning: false,
        requireGloves: false,
        text: 'Procedimiento seguro y natural sin riesgos para el hogar.',
      },
    },
  },
  {
    id: 'health-optima',
    issueKey: 'saludable',
    name: 'Planta Vigorosa y Saludable',
    scientificName: 'Excelente Estado Fisiológico',
    category: 'Saludable',
    severity: 'leve',
    confidence: 99,
    symptoms: [
      'Color verde homogéneo y brillante sin manchas ni punteados.',
      'Turgencia óptima en tallos y hojas.',
      'Brotes nuevos en desarrollo activo.',
    ],
    description: 'No se detectan plagas ni anomalías fisiológicas. Tu planta recibe las dosis ideales de luz, agua y nutrientes.',
    referenceImages: ['healthy_monstera_leaf'],
    treatment: {
      organicOption: {
        title: 'Mantenimiento Preventivo',
        products: 'Agua descalcificada para limpieza foliar',
        dosage: 'Paño húmedo suave cada 15 días.',
        instructions: 'Limpia el polvo para maximizar la absorción de luz y fotosíntesis.',
      },
      chemicalOption: {
        title: 'Fertilizante Equilibrado NPK',
        products: 'Abono líquido equilibrado 7-7-7 con micronutrientes',
        dosage: 'Medio tapón por cada 2 litros de agua.',
        instructions: 'Aplicar una vez al mes durante primavera y verano.',
      },
      frequency: 'Riego y nutrición regular.',
      recoveryDays: 'N/A (Estado de salud óptimo).',
      prevention: 'Mantén las pautas recomendadas en la pestaña Cuidados de la app.',
      safetyAlert: {
        hasPetsWarning: false,
        hasChildrenWarning: false,
        requireGloves: false,
        text: 'Tu planta está en perfectas condiciones.',
      },
    },
  },
];

/** Hash determinista simple (sin `Math.random`). */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Localiza (traduce al idioma activo) los textos visibles de un diagnóstico en
 * el momento de construir el resultado. No traduce los campos usados por la
 * lógica interna (`category`, `severity`).
 */
function localizeDiagnosis(
  diagnosis: Omit<HealthDiagnosisResult, 'source'>,
  source: HealthSource
): HealthDiagnosisResult {
  return {
    ...diagnosis,
    name: t(diagnosis.name),
    scientificName: t(diagnosis.scientificName),
    symptoms: diagnosis.symptoms.map((symptom) => t(symptom)),
    description: t(diagnosis.description),
    treatment: {
      organicOption: {
        title: t(diagnosis.treatment.organicOption.title),
        products: t(diagnosis.treatment.organicOption.products),
        dosage: t(diagnosis.treatment.organicOption.dosage),
        instructions: t(diagnosis.treatment.organicOption.instructions),
      },
      chemicalOption: {
        title: t(diagnosis.treatment.chemicalOption.title),
        products: t(diagnosis.treatment.chemicalOption.products),
        dosage: t(diagnosis.treatment.chemicalOption.dosage),
        instructions: t(diagnosis.treatment.chemicalOption.instructions),
      },
      frequency: t(diagnosis.treatment.frequency),
      recoveryDays: t(diagnosis.treatment.recoveryDays),
      prevention: t(diagnosis.treatment.prevention),
      safetyAlert: {
        ...diagnosis.treatment.safetyAlert,
        text: t(diagnosis.treatment.safetyAlert.text),
      },
    },
    disclaimer: t(diagnosis.disclaimer),
    source,
  };
}

/** Diagnóstico simulado determinista, a partir del contenido de la imagen. */
function mockDiagnosis(seedKey: string): HealthDiagnosisResult {
  // Excluimos "saludable" del muestreo para que la demo siempre muestre un plan.
  const pool = HEALTH_CATALOG.length > 1 ? HEALTH_CATALOG.slice(0, -1) : HEALTH_CATALOG;
  const chosen = pool[hashString(seedKey) % pool.length];
  return localizeDiagnosis({ ...chosen, disclaimer: HEALTH_DISCLAIMER }, 'mock');
}

/**
 * Diagnostica la salud de una planta a partir de 1 a 4 fotos. Envía las
 * imágenes comprimidas al backend real salvo en desarrollo sin endpoint.
 *
 * @throws {HealthNoPlantError} si la imagen no contiene una planta.
 * @throws {ApiError} para errores de red, cuota (`RATE_LIMITED`) o servidor.
 */
export async function diagnosePlantHealth(
  imageUris: string[],
  plantName?: string
): Promise<HealthDiagnosisResult> {
  const compressed = await compressImages(imageUris, { max: 4 });
  if (compressed.length === 0) {
    throw new ApiError(
      'NO_IMAGE',
      t('No se pudo procesar la imagen. Vuelve a tomar la foto con buena iluminación.'),
      0
    );
  }

  if (shouldUseMocks()) {
    const seedKey = `${plantName ?? ''}|${compressed.map((c) => c.base64.slice(0, 128)).join('|')}`;
    return mockDiagnosis(seedKey);
  }

  const response = await postJson<HealthApiResponse>('/healthAssessment', {
    images: compressed.map((c) => c.base64),
    plantName,
  });

  if (response.isPlant === false) {
    throw new HealthNoPlantError();
  }

  const issueKey = response.issueKey || 'problema';
  return localizeDiagnosis(
    {
      id: issueKey,
      issueKey,
      name: response.name || 'Problema detectado',
      scientificName: response.scientificName || 'Agente causal no confirmado',
      category: response.category ?? 'Saludable',
      severity: response.severity ?? 'leve',
      confidence: typeof response.confidence === 'number' ? response.confidence : 0,
      symptoms: Array.isArray(response.symptoms) ? response.symptoms : [],
      description: response.description || '',
      referenceImages: Array.isArray(response.referenceImages) ? response.referenceImages : [],
      treatment: response.treatment,
      disclaimer: response.disclaimer || HEALTH_DISCLAIMER,
    },
    response.source ?? 'ai-real'
  );
}

/** Obtiene un diagnóstico de demostración por clave (solo para `__DEV__`). */
export function getDiagnosisByKey(key: string): HealthDiagnosisResult | undefined {
  const found = HEALTH_CATALOG.find((d) => d.issueKey === key);
  return found ? localizeDiagnosis({ ...found, disclaimer: HEALTH_DISCLAIMER }, 'mock') : undefined;
}
