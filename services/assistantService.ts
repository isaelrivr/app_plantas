/**
 * Plantae Assistant Service (MOCK)
 *
 * Asistente conversacional de jardinería. En este entorno responde con una
 * heurística local sobre el catálogo botánico.
 *
 * ⚠️ LA IA REAL NUNCA DEBE LLAMARSE DESDE EL CLIENTE.
 * Las API keys de OpenAI / Gemini / Anthropic jamás deben incluirse en el
 * bundle de la app (son extraíbles). El flujo correcto es:
 *
 *   1. La app envía el mensaje a una Cloud Function (callable):
 *        https://us-central1-<proyecto>.cloudfunctions.net/assistantChat
 *   2. La Cloud Function añade la API key desde los secretos del servidor
 *      (firebase functions:secrets:set OPENAI_API_KEY) y llama al modelo.
 *   3. La función devuelve SOLO el texto de la respuesta.
 *
 * Ver ASSISTANT_CHAT_ENDPOINT más abajo. Para activarlo, setea
 * `USE_REMOTE_ASSISTANT = true` una vez desplegada la función.
 */

import { PlantIdentificationResult, searchPlants } from './plantApi';
import { getToxicity } from './toxicityService';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  /** Marca las respuestas generadas por el modelo remoto real */
  source?: 'mock' | 'cloud-function';
}

export const ASSISTANT_CHAT_ENDPOINT =
  'https://us-central1-plantae-app.cloudfunctions.net/assistantChat';

/** Cambia a true cuando la Cloud Function esté desplegada. */
export const USE_REMOTE_ASSISTANT = false;

export const SUGGESTED_QUESTIONS: string[] = [
  '¿Cada cuánto riego mi monstera?',
  '¿Qué planta es segura para mi gato?',
  'Tengo las puntas de las hojas marrones, ¿qué hago?',
  '¿Cuál es una planta fácil para principiantes?',
  '¿Cómo aumento la humedad para mi calathea?',
  '¿Cuándo debo trasplantar mi planta?',
];

const uid = () => `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export function createMessage(
  role: AssistantMessage['role'],
  text: string,
  extra: Partial<AssistantMessage> = {}
): AssistantMessage {
  return { id: uid(), role, text, timestamp: new Date().toISOString(), ...extra };
}

export function getWelcomeMessage(): AssistantMessage {
  return createMessage(
    'assistant',
    '¡Hola! Soy tu asistente botánico de Plantae 🌿. Pregúntame sobre riego, luz, plagas, toxicidad o cuidados de tus plantas. Puedes empezar con una de las sugerencias de abajo.',
    { quickReplies: SUGGESTED_QUESTIONS.slice(0, 4), source: 'mock' }
  );
}

interface AssistantContext {
  plantName?: string;
  isPremium?: boolean;
}

const findPlantByText = (text: string): PlantIdentificationResult | null => {
  const lower = text.toLowerCase();
  const catalog = searchPlants('');
  return (
    catalog.find(
      (p) =>
        lower.includes(p.name.toLowerCase().split(' ')[0]) ||
        lower.includes(p.scientificName.toLowerCase().split(' ')[0])
    ) ?? null
  );
};

function buildMockReply(prompt: string, context: AssistantContext): AssistantMessage {
  const lower = prompt.toLowerCase();
  const plant = findPlantByText(prompt);

  // Preguntas sobre mascotas / niños / toxicidad
  if (lower.includes('gato') || lower.includes('perro') || lower.includes('mascota') || lower.includes('niño') || lower.includes('tóxic') || lower.includes('toxico')) {
    if (plant) {
      const tox = getToxicity(plant.id);
      return createMessage(
        'assistant',
        `${plant.name}: ${tox.summary}\n\n• Mascotas (${tox.pets}): ${tox.petsNotes}\n• Niños (${tox.children}): ${tox.childrenNotes}\n\nPuedes ver la etiqueta de toxicidad en la ficha de la especie.`,
        { quickReplies: ['¿Qué plantas son 100% seguras?', 'Muéstrame el catálogo seguro'], source: 'mock' }
      );
    }
    return createMessage(
      'assistant',
      'La seguridad depende de cada especie. Aloe Vera, Espatifilo, Ficus y Sansevieria son tóxicas o irritantes para gatos y perros, mientras que Echeverias, Calatheas y Helecho de Boston son seguras. Filtra el catálogo por "Segura para mascotas" para ver la lista completa.',
      { quickReplies: ['¿Qué plantas son 100% segura?', 'Abrir enciclopedia'], source: 'mock' }
    );
  }

  // Riego
  if (lower.includes('riego') || lower.includes('regar') || lower.includes('agua')) {
    if (plant) {
      return createMessage(
        'assistant',
        `Para tu ${plant.name}, riega ${plant.watering.toLowerCase()}\n\nTip: ${plant.climateTip}`,
        { quickReplies: ['Programar recordatorio de riego', '¿Cada cuánto?'], source: 'mock' }
      );
    }
    return createMessage(
      'assistant',
      'La regla de oro: introduce un dedo 3-5 cm en el sustrato y riega solo si está seco. Evita calendarios rígidos; ajusta según temperatura, humedad y estación. Dime el nombre de tu planta y te doy su frecuencia exacta.',
      { quickReplies: ['¿Cómo sé si mi planta tiene sed?', 'Abrir calendario'], source: 'mock' }
    );
  }

  // Luz
  if (lower.includes('luz') || lower.includes('sol') || lower.includes('sombra')) {
    return createMessage(
      'assistant',
      plant
        ? `${plant.name} necesita: ${plant.light}`
        : 'La mayoría de plantas de interior prefieren luz indirecta brillante (cerca de una ventana sin sol directo). El sol directo de mediodía suele quemar las hojas tropicales. ¿Para qué planta quieres la recomendación?',
      { quickReplies: ['¿Qué es luz indirecta?', 'Tengo la ventana al norte'], source: 'mock' }
    );
  }

  // Puntas marrones / problemas
  if (lower.includes('marrón') || lower.includes('marron') || lower.includes('amarill') || lower.includes('puntas') || lower.includes('hojas')) {
    return createMessage(
      'assistant',
      'Las puntas marrones suelen indicar humedad ambiental baja o agua con exceso de sales/cloro. Prueba: 1) usa agua reposada o filtrada, 2) pulveriza el follaje, 3) aleja la planta de radiadores. Si son manchas amarillas con bultos, podría ser una plaga: usa el diagnóstico de salud.',
      { quickReplies: ['Diagnosticar con una foto', '¿Humedad ideal?'], source: 'mock' }
    );
  }

  // Principiantes
  if (lower.includes('principiante') || lower.includes('fácil') || lower.includes('facil') || lower.includes('resistente')) {
    return createMessage(
      'assistant',
      'Para empezar te recomiendo: Sansevieria (casi indestructible), Pothos (crece rápido), Echeveria (suculenta) y Espatifilo (florece con poca luz). Las cuatro toleran olvidos de riego. ¿Quieres que te muestre sus fichas?',
      { quickReplies: ['Comparar las 4', 'Abrir enciclopedia'], source: 'mock' }
    );
  }

  // Humedad
  if (lower.includes('humedad') || lower.includes('humid')) {
    return createMessage(
      'assistant',
      'Para subir la humedad: agrupa plantas, usa un humidificador, coloca la maceta sobre guijarros con agua (sin tocar el fondo) o pulveriza por la mañana. Las calatheas y helechos agradecen 60-80% de humedad.',
      { quickReplies: ['¿Humidificador o nebulizador?', 'Abrir calathea'], source: 'mock' }
    );
  }

  // Trasplante
  if (lower.includes('trasplant') || lower.includes('maceta') || lower.includes('sustrato')) {
    return createMessage(
      'assistant',
      'Trasplanta cuando las raíces asomen por los agujeros o la maceta quede pequeña, idealmente en primavera. Sube solo 2-4 cm de diámetro y usa sustrato con buen drenaje. Evita trasplantar en invierno o en plena floración.',
      { quickReplies: ['¿Qué sustrato uso?', 'Programar trasplante'], source: 'mock' }
    );
  }

  // Toxicidad genérica ya cubierta. Caso por defecto:
  return createMessage(
    'assistant',
    `Entiendo. Sobre "${prompt}"${context.plantName ? ` en relación a tu ${context.plantName}` : ''}: la mejor práctica es observar el sustrato, la luz y el ambiente antes de actuar. Puedo darte detalle si mencionas el nombre de la planta o el síntoma que ves (manchas, puntas secas, hojas caídas...).`,
    { quickReplies: SUGGESTED_QUESTIONS.slice(0, 3), source: 'mock' }
  );
}

/**
 * Envía un mensaje al asistente y devuelve su respuesta.
 * MOCK local por defecto; con USE_REMOTE_ASSISTANT=true llama a la Cloud Function.
 */
export async function sendAssistantMessage(
  prompt: string,
  context: AssistantContext = {}
): Promise<AssistantMessage> {
  if (USE_REMOTE_ASSISTANT) {
    try {
      const res = await fetch(ASSISTANT_CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, context }),
      });
      if (!res.ok) throw new Error('assistant function error');
      const data = (await res.json()) as { reply: string; quickReplies?: string[] };
      return createMessage('assistant', data.reply, {
        quickReplies: data.quickReplies,
        source: 'cloud-function',
      });
    } catch {
      // Fallback silencioso al mock si la función no está disponible
    }
  }

  // Latencia simulada para una sensación realista de "escribiendo…"
  await new Promise((resolve) => setTimeout(resolve, 900));
  return buildMockReply(prompt, context);
}
