/**
 * Diagnóstico de salud: Plant.id health_assessment + plan de tratamiento con
 * Gemini. Devuelve un resultado estructurado con descargo médico fijo.
 */

import type { AppConfig } from './config';
import type { Identity } from './guard';
import { consumeQuota } from './rateLimit';
import { assessHealthWithPlantId } from './providers/plantId';
import { generateTreatmentJson } from './providers/gemini';
import { slugify } from './identify';
import {
  HEALTH_DISCLAIMER,
  type HealthCategory,
  type HealthRequest,
  type HealthResponse,
  type HealthSeverity,
  type TreatmentDetails,
} from './types';
import { badRequest } from './errors';

const CATEGORIES: HealthCategory[] = ['Plaga', 'Hongo', 'Bacteriosis', 'Estrés Hídrico'];
const SEVERITIES: HealthSeverity[] = ['leve', 'moderada', 'grave'];

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const toText = (value: unknown, fallback: string, maxLength = 800): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
};

const toTextArray = (value: unknown, max: number, fallback: string[]): string[] => {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => (typeof item === 'string' ? item.trim().slice(0, 400) : ''))
    .filter((item) => item.length > 0)
    .slice(0, max);
  return items.length > 0 ? items : fallback;
};

/** Heurística de respaldo cuando el LLM no está disponible. */
function guessCategory(issueName: string): HealthCategory {
  const name = issueName.toLowerCase();
  if (/(mite|ácaro|acaro|aphid|pulg|cochineal|cochinilla|whitefly|mosca|thrip|trips|insect|beetle|oruga|larva|mealybug|scale)/.test(name)) {
    return 'Plaga';
  }
  if (/(bacteri|bacteria|xanthomonas|erwinia|pseudomonas|agrobacterium)/.test(name)) {
    return 'Bacteriosis';
  }
  if (/(virus|virosis|mosaico|mosaic)/.test(name)) {
    return 'Bacteriosis';
  }
  if (/(stress|estrés|estres|dry|drought|nutrient|nutri|chlorosis|clorosis|sunburn|sol|overwater|underwater|riego|abiotic)/.test(name)) {
    return 'Estrés Hídrico';
  }
  return 'Hongo';
}

function fallbackTreatment(name: string, category: HealthCategory): TreatmentDetails {
  const base: Record<HealthCategory, TreatmentDetails> = {
    Plaga: {
      organicOption: {
        title: 'Jabón potásico + aceite de neem',
        products: 'Jabón potásico líquido y aceite de neem',
        dosage: '10 ml de jabón + 5 ml de neem por litro de agua tibia.',
        instructions: 'Pulveriza al atardecer incidiendo en el envés de las hojas y los nudos.',
      },
      chemicalOption: {
        title: 'Insecticida específico',
        products: 'Acetamiprid o jabón insecticida de larga duración',
        dosage: 'Según la etiqueta del producto (aprox. 0.5 ml/l).',
        instructions: 'Aplica siguiendo estrictamente las instrucciones del fabricante.',
      },
      frequency: 'Repite cada 4-5 días durante 3 semanas.',
      recoveryDays: '7 a 14 días.',
      prevention: 'Aísla plantas nuevas 14 días e inspecciona el envés de las hojas con frecuencia.',
      safetyAlert: { hasPetsWarning: true, hasChildrenWarning: true, requireGloves: true, text: 'Mantén mascotas y niños alejados hasta que el follaje esté seco. Usa guantes.' },
    },
    Hongo: {
      organicOption: {
        title: 'Bicarbonato de potasio',
        products: 'Bicarbonato potásico + agua',
        dosage: '5 g por litro de agua.',
        instructions: 'Pulveriza sobre el follaje cambiando el pH e impidiendo nuevas esporas.',
      },
      chemicalOption: {
        title: 'Fungicida sistémico',
        products: 'Difenoconazol o azufre mojable',
        dosage: 'Según la etiqueta del producto.',
        instructions: 'Aplica con buena ventilación y respetando el plazo de seguridad.',
      },
      frequency: 'Repite cada 7 días, 3 aplicaciones.',
      recoveryDays: '10 a 15 días (las manchas viejas no sanan).',
      prevention: 'Evita mojar las hojas al regar y mejora la circulación de aire.',
      safetyAlert: { hasPetsWarning: true, hasChildrenWarning: true, requireGloves: true, text: 'Retira las hojas más afectadas en una bolsa cerrada. Usa guantes.' },
    },
    Bacteriosis: {
      organicOption: {
        title: 'Poda de tejido afectado + cobre',
        products: 'Cobre (oxicloruro) preventivo',
        dosage: 'Según la etiqueta del producto.',
        instructions: 'Corta y desecha las zonas afectadas desinfectando las tijeras entre cortes.',
      },
      chemicalOption: {
        title: 'Bactericida a base de cobre',
        products: 'Oxicloruro de cobre',
        dosage: 'Según la etiqueta del producto.',
        instructions: 'Aplica al atardecer evitando sol directo.',
      },
      frequency: 'Cada 10 días según evolución.',
      recoveryDays: '2 a 4 semanas.',
      prevention: 'Desinfecta las herramientas y evita el exceso de humedad foliar.',
      safetyAlert: { hasPetsWarning: true, hasChildrenWarning: true, requireGloves: true, text: 'El cobre es tóxico por ingestión. Usa guantes y evita el contacto con mascotas.' },
    },
    'Estrés Hídrico': {
      organicOption: {
        title: 'Ajuste de riego y aireación',
        products: 'Sustrato drenante o palillo para airear',
        dosage: 'Sin productos químicos.',
        instructions: 'Deja secar el sustrato o riega por inmersión según el caso y mejora el drenaje.',
      },
      chemicalOption: {
        title: 'Bioestimulante antiestrés',
        products: 'Extracto de algas (Ascophyllum nodosum)',
        dosage: '2 ml por litro de agua.',
        instructions: 'Aplícalo en el siguiente riego una vez corregida la causa.',
      },
      frequency: 'Según la evolución del sustrato.',
      recoveryDays: '4 a 10 días.',
      prevention: 'Comprueba la humedad antes de regar y protege del sol directo en verano.',
      safetyAlert: { hasPetsWarning: false, hasChildrenWarning: false, requireGloves: false, text: 'Práctica segura sin sustancias tóxicas.' },
    },
    Saludable: {
      organicOption: { title: 'Mantenimiento', products: 'Agua descalcificada', dosage: 'Limpieza foliar quincenal.', instructions: 'Retira el polvo para mejorar la fotosíntesis.' },
      chemicalOption: { title: 'Abono equilibrado', products: 'Fertilizante NPK equilibrado', dosage: 'Según la etiqueta del producto.', instructions: 'Abona una vez al mes en primavera y verano.' },
      frequency: 'Riego y nutrición regular.',
      recoveryDays: 'N/A (estado saludable).',
      prevention: 'Mantén las pautas de cuidado de la ficha de la especie.',
      safetyAlert: { hasPetsWarning: false, hasChildrenWarning: false, requireGloves: false, text: 'La planta está en buen estado.' },
    },
  };
  return base[category];
}

function healthyResponse(): HealthResponse {
  return {
    isPlant: true,
    isHealthy: true,
    confidence: 96,
    issueKey: 'saludable',
    name: 'Planta vigorosa y saludable',
    scientificName: 'Estado fisiológico óptimo',
    category: 'Saludable',
    severity: 'leve',
    description:
      'El análisis no detecta plagas ni enfermedades relevantes. Tu planta muestra un estado general sano y sin señales de estrés.',
    symptoms: [
      'Color verde homogéneo, sin manchas ni punteados anómalos.',
      'Turgencia adecuada en tallos y hojas.',
      'Sin presencia visible de insectos ni lesiones.',
    ],
    treatment: fallbackTreatment('saludable', 'Saludable'),
    referenceImages: ['health-optima'],
    disclaimer: HEALTH_DISCLAIMER,
    source: 'ai-real',
  };
}

function notPlantResponse(): HealthResponse {
  return {
    isPlant: false,
    isHealthy: false,
    confidence: 0,
    issueKey: 'no-planta',
    name: 'No se detectó una planta',
    scientificName: '',
    category: 'Saludable',
    severity: 'leve',
    description: 'La imagen no parece contener hojas, tallos ni partes de una planta analizables.',
    symptoms: [],
    treatment: fallbackTreatment('no-planta', 'Saludable'),
    referenceImages: [],
    disclaimer: HEALTH_DISCLAIMER,
    source: 'ai-real',
  };
}

function referenceTokensFor(category: HealthCategory): string[] {
  switch (category) {
    case 'Plaga':
      return ['pest_leaf', 'pest_zoom'];
    case 'Hongo':
      return ['fungus_leaf', 'fungus_spots'];
    case 'Bacteriosis':
      return ['bacteria_leaf', 'bacteria_spot'];
    case 'Estrés Hídrico':
      return ['stress_leaf', 'stress_soil'];
    default:
      return ['health_leaf'];
  }
}

function buildTreatment(raw: unknown, issueName: string): { category: HealthCategory; severity: HealthSeverity; description: string; symptoms: string[]; treatment: TreatmentDetails } {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const guessed = guessCategory(issueName);
  const categoryRaw = toText(data.category, guessed, 30) as HealthCategory;
  const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : guessed;
  const severityRaw = toText(data.severity, 'moderada', 20) as HealthSeverity;
  const severity = SEVERITIES.includes(severityRaw) ? severityRaw : 'moderada';
  const fallback = fallbackTreatment(issueName, category);

  const option = (value: unknown, template: TreatmentDetails['organicOption']): TreatmentDetails['organicOption'] => {
    const opt = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
    return {
      title: toText(opt.title, template.title, 120),
      products: toText(opt.products, template.products, 200),
      dosage: toText(opt.dosage, template.dosage, 200),
      instructions: toText(opt.instructions, template.instructions, 600),
    };
  };

  return {
    category,
    severity,
    description: toText(data.description, `Se ha detectado ${issueName}. Sigue el plan de tratamiento para controlarlo.`, 800),
    symptoms: toTextArray(data.symptoms, 4, fallback.safetyAlert.text ? ['Síntomas visibles en el follaje.', 'Revisa el envés y los brotes nuevos.'] : []),
    treatment: {
      organicOption: option(data.organicOption, fallback.organicOption),
      chemicalOption: option(data.chemicalOption, fallback.chemicalOption),
      frequency: toText(data.frequency, fallback.frequency, 200),
      recoveryDays: toText(data.recoveryDays, fallback.recoveryDays, 200),
      prevention: toText(data.prevention, fallback.prevention, 600),
      safetyAlert: {
        hasPetsWarning: data.petsWarning === true,
        hasChildrenWarning: data.childrenWarning === true,
        requireGloves: data.gloves === true,
        text: toText(data.safetyText, fallback.safetyAlert.text, 400),
      },
    },
  };
}

export async function runHealthAssessment(config: AppConfig, identity: Identity, req: HealthRequest): Promise<HealthResponse> {
  const images = Array.isArray(req.images) ? req.images : [];
  if (images.length === 0) throw badRequest('Envía al menos una imagen base64 en el campo "images".');

  await consumeQuota(identity, 'health', config.quotas.health);

  const result = await assessHealthWithPlantId(config, images);
  if (!result.isPlant) return notPlantResponse();
  if (result.isHealthy || result.suggestions.length === 0) return healthyResponse();

  const top = result.suggestions[0];
  const probability = clamp01(top.probability);
  const raw = await generateTreatmentJson(config, top.name, probability, req.plantName, top.description);
  const built = buildTreatment(raw, top.name);

  return {
    isPlant: true,
    isHealthy: false,
    confidence: Math.round(probability * 100),
    issueKey: slugify(top.name) || 'problema',
    name: top.name.slice(0, 160),
    scientificName: top.commonNames[0]?.slice(0, 160) || 'Agente causal no confirmado',
    category: built.category,
    severity: built.severity,
    description: built.description,
    symptoms: built.symptoms,
    treatment: built.treatment,
    referenceImages: referenceTokensFor(built.category),
    disclaimer: HEALTH_DISCLAIMER,
    source: 'ai-real',
  };
}