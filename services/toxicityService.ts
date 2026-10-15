/**
 * Plantae Pet & Child Toxicity Service
 *
 * Base de datos botánica de seguridad doméstica. Indica si una especie es
 * tóxica para mascotas (perros/gatos) y para niños, con nivel y notas.
 *
 * Los datos son de referencia educativa (inspirados en criterios de la ASPCA).
 * En producción pueden migrarse a Firestore para edición sin recompilar la app.
 */

import { t } from '../i18n';

export type ToxicityLevel = 'safe' | 'caution' | 'toxic';

export interface ToxicityInfo {
  speciesId: string;
  /** Nivel de riesgo para mascotas */
  pets: ToxicityLevel;
  /** Nivel de riesgo para niños */
  children: ToxicityLevel;
  petsNotes: string;
  childrenNotes: string;
  summary: string;
}

const DEFAULT_TOXICITY: Omit<ToxicityInfo, 'speciesId'> = {
  pets: 'caution',
  children: 'caution',
  petsNotes: 'Sin datos específicos: mantén igualmente las mascotas alejadas del follaje.',
  childrenNotes: 'Sin datos específicos: evita que los niños ingieran partes de la planta.',
  summary: 'Seguridad no confirmada, actúa con precaución.',
};

const TOXICITY_BY_SPECIES: Record<string, Omit<ToxicityInfo, 'speciesId'>> = {
  monstera: {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Contiene oxalato de calcio insoluble. Irrita la boca y puede causar vómitos en perros y gatos.',
    childrenNotes: 'Provoca ardor e hinchazón si se mastica. No apta para mesas al alcance de niños pequeños.',
    summary: '🟠 Tóxica para mascotas por oxalatos; precaución con niños.',
  },
  pothos: {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Oxalato de calcio: salivación, vómito y dificultad para tragar si la mascota la mordisquea.',
    childrenNotes: 'Irritante oral. Colócala en colgantes o repisas altas fuera del alcance infantil.',
    summary: '🟠 Tóxica para mascotas; no apta para niños pequeños.',
  },
  'aloe-vera': {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'La saponina y la aloína del gel causan diarrea y letargo en gatos y perros.',
    childrenNotes: 'El látex amarillo de la penca es un potente laxante; usar el gel solo de uso externo.',
    summary: '🟠 Tóxica para mascotas; gel de uso externo en niños.',
  },
  lavanda: {
    pets: 'caution',
    children: 'safe',
    petsNotes: 'El aceite esencial concentrado puede irritar; la planta entera es de riesgo leve.',
    childrenNotes: 'Especie segura al tacto; evita la ingesta de flores en grandes cantidades.',
    summary: '🟢 Prácticamente segura; precaución con aceites esenciales.',
  },
  succulent: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Las echeverias no son tóxicas para perros ni gatos.',
    childrenNotes: 'Planta no tóxica y apta para el hogar con niños.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  'helecho-boston': {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'El helecho de Boston no es tóxico para mascotas domésticas.',
    childrenNotes: 'Especie no tóxica; su textura puede atraer a los niños pero no supone riesgo.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  orchid: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Las phalaenopsis son consideradas no tóxicas para perros y gatos.',
    childrenNotes: 'Planta segura y no tóxica para el hogar.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  'ficus-lyrata': {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'La savia lechosa irrita la piel y la boca; puede causar vómitos en mascotas.',
    childrenNotes: 'El látex irrita ojos y piel. Manipula con guantes y aleja de niños.',
    summary: '🟠 Tóxica para mascotas por savia irritante.',
  },
  sansevieria: {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Saponinas que provocan náuseas, vómito y diarrea en gatos y perros.',
    childrenNotes: 'Irritante digestivo leve si se ingiere; mantén fuera del alcance.',
    summary: '🟠 Tóxica para mascotas; precaución con niños.',
  },
  calathea: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Las calatheas (Goeppertia) no son tóxicas para mascotas.',
    childrenNotes: 'Especie no tóxica y apta para el hogar con niños.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  espatifilo: {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Oxalato de calcio: irrita la boca, salivación y vómito en mascotas.',
    childrenNotes: 'Irritante oral si se mastica; ubícala fuera del alcance de los niños.',
    summary: '🟠 Tóxica para mascotas; no apta para niños pequeños.',
  },
  romero: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Hierba culinaria no tóxica para perros y gatos en pequeñas cantidades.',
    childrenNotes: 'Aroma y textura seguros; ideal incluso para huertos escolares.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  cinta: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'El lazo de amor no es tóxico para perros ni gatos y purifica el aire.',
    childrenNotes: 'Totalmente segura y apta para habitaciones infantiles.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  pachira: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'El árbol del dinero no representa peligro para perros ni gatos.',
    childrenNotes: 'Planta no tóxica para el hogar.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  albahaca: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Hierba aromática comestible y segura para perros y gatos.',
    childrenNotes: 'Apta para el consumo culinario familiar.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  menta: {
    pets: 'caution',
    children: 'safe',
    petsNotes: 'Los aceites esenciales en grandes cantidades pueden causar molestias digestivas.',
    childrenNotes: 'Segura y agradable para infusiones y cocina.',
    summary: '🟡 Precaución leve con mascotas en grandes ingestas.',
  },
  pilea: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'La planta china del dinero es completamente inocua para mascotas.',
    childrenNotes: 'Planta segura y divertida de propagar con niños.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  jade: {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Puede causar vómitos, letargo e incoordinación en perros y gatos.',
    childrenNotes: 'Evita que los niños mastiquen sus hojas carnosas.',
    summary: '🟠 Tóxica para mascotas.',
  },
  'potus-plateado': {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Oxalatos insolubles: salivación excesiva y ardor bucal.',
    childrenNotes: 'Irritante bucal; mantén fuera del alcance.',
    summary: '🟠 Tóxica para mascotas por oxalatos.',
  },
  'ficus-elastica': {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Savia con látex irritante para la piel y el aparato digestivo de mascotas.',
    childrenNotes: 'El látex puede causar dermatitis por contacto.',
    summary: '🟠 Tóxica para mascotas por látex irritante.',
  },
  anturio: {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Cristales de oxalato cálcico que provocan hinchazón lingual y vómitos.',
    childrenNotes: 'Muy vistosa pero irritante al morder; ubicar en alto.',
    summary: '🟠 Tóxica para mascotas y niños pequeños.',
  },
  'dracaena-marginata': {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Saponinas esteroides: debilidad, salivación y pupilas dilatadas en gatos.',
    childrenNotes: 'Malestar estomacal leve si se ingiere.',
    summary: '🟠 Tóxica para perros y gatos.',
  },
  chamaedorea: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'La palmera de salón no es tóxica para perros ni gatos.',
    childrenNotes: 'Excelente opción segura y resistente para cualquier habitación.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  'orquidea-vanda': {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Familia Orchidaceae: no es tóxica para mascotas.',
    childrenNotes: 'Planta ornamental segura y no irritante.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  'filodendro-brasil': {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Oxalatos de calcio que provocan ardor inmediato y vómitos.',
    childrenNotes: 'Colgar en estanterías fuera del alcance de niños.',
    summary: '🟠 Tóxica para mascotas.',
  },
  croton: {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Savia lechosa cáustica que causa ampollas orales y diarrea.',
    childrenNotes: 'Látex muy irritante; lavar manos tras podar.',
    summary: '🟠 Tóxica para mascotas por savia cáustica.',
  },
  'begonia-maculata': {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Oxalatos concentrados en tallos: ardor de garganta y salivación.',
    childrenNotes: 'No comestible; mantener fuera del alcance.',
    summary: '🟠 Tóxica para mascotas.',
  },
  'suculenta-cebra': {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Las haworthias son totalmente seguras para perros y gatos.',
    childrenNotes: 'Puntas duras pero no tóxica ni peligrosa.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  bromelia: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Las guzmanias y bromelias son seguras para mascotas.',
    childrenNotes: 'Planta de floración segura y no tóxica.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  'cactus-navidad': {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Schlumbergera no es tóxica y no tiene espinas punzantes.',
    childrenNotes: 'Muy segura para fiestas familiares decembrinas.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  tomillo: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'Hierba culinaria no tóxica para perros ni gatos.',
    childrenNotes: 'Totalmente inocua y aromática.',
    summary: '🟢 Segura para mascotas y niños.',
  },
  singonio: {
    pets: 'toxic',
    children: 'caution',
    petsNotes: 'Oxalato de calcio en todas sus hojas; irritación orofaríngea.',
    childrenNotes: 'Mantén las guías trepadoras lejos del suelo.',
    summary: '🟠 Tóxica para mascotas.',
  },
  dieffenbachia: {
    pets: 'toxic',
    children: 'toxic',
    petsNotes: 'Savia muy irritante con enzimas proteolíticas: hinchazón de garganta severa.',
    childrenNotes: 'Peligro de atragantamiento por hinchazón bucal si se mastica.',
    summary: '🔴 Altamente irritante para mascotas y niños.',
  },
  maranta: {
    pets: 'safe',
    children: 'safe',
    petsNotes: 'La maranta es totalmente inofensiva para perros y gatos.',
    childrenNotes: 'Hojas fascinantes y seguras para el hogar.',
    summary: '🟢 Segura para mascotas y niños.',
  },
};

/**
 * Localiza los textos visibles de una ficha de toxicidad en el idioma activo.
 * Los niveles (`pets` / `children`) se mantienen intactos por ser valores técnicos.
 */
function localizeToxicity(
  speciesId: string,
  info: Omit<ToxicityInfo, 'speciesId'>
): ToxicityInfo {
  return {
    speciesId,
    pets: info.pets,
    children: info.children,
    petsNotes: t(info.petsNotes),
    childrenNotes: t(info.childrenNotes),
    summary: t(info.summary),
  };
}

/**
 * Devuelve la información de toxicidad para una especie.
 * Es tolerante a IDs desconocidos (devuelve precaución por defecto).
 */
export function getToxicity(speciesId: string): ToxicityInfo {
  const normalized = (speciesId || '').toLowerCase().replace(/[-_]/g, '-');
  const direct = TOXICITY_BY_SPECIES[normalized];
  if (direct) return localizeToxicity(normalized, direct);

  // Coincidencia parcial por nombre de catálogo
  const key = Object.keys(TOXICITY_BY_SPECIES).find((k) => normalized.includes(k));
  if (key) return localizeToxicity(key, TOXICITY_BY_SPECIES[key]);

  return localizeToxicity(normalized, DEFAULT_TOXICITY);
}

/** ¿Es segura para el hogar con mascotas? */
export function isPetSafe(speciesId: string): boolean {
  return getToxicity(speciesId).pets === 'safe';
}

function levelMeta(label: string, shortLabel: string, icon: string) {
  return {
    get label() {
      return t(label);
    },
    get shortLabel() {
      return t(shortLabel);
    },
    icon,
  };
}

export const toxicityLevelMeta: Record<
  ToxicityLevel,
  { label: string; shortLabel: string; icon: string }
> = {
  safe: levelMeta('Segura', 'Segura', 'shield-checkmark'),
  caution: levelMeta('Precaución', 'Precaución', 'warning'),
  toxic: levelMeta('Tóxica', 'Tóxica', 'skull'),
};
