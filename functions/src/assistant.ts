import type { AppConfig } from './config';
import type { Identity } from './guard';
import { consumeQuota, refundQuota } from './rateLimit';
import { badRequest } from './errors';
import { generateAssistantText } from './providers/gemini';
import type { AssistantRequest, AssistantResponse } from './types';

export async function runAssistant(
  config: AppConfig,
  identity: Identity,
  req: AssistantRequest
): Promise<AssistantResponse> {
  if (typeof req?.message !== 'string' || req.message.trim().length < 2) {
    throw badRequest('Escribe una pregunta válida para el asistente.');
  }

  const message = req.message.trim().slice(0, 4000);
  const userInstruction =
    typeof req?.systemInstruction === 'string' ? req.systemInstruction.slice(0, 2000) : '';

  const guardrails =
    'GUARDRAIL OBLIGATORIO: Si el usuario pregunta por un término que no corresponde a una planta real, aclara que no es una especie vegetal reconocida y no inventes taxonomías. Las indicaciones de toxicidad son meramente orientativas (se debe consultar al veterinario).';

  const systemInstruction = userInstruction ? `${userInstruction}\n\n${guardrails}` : undefined;

  await consumeQuota(identity, 'assistant', config.quotas.assistant);

  try {
    const context = req.context?.plantName
      ? ` Planta relacionada: ${String(req.context.plantName).slice(0, 100)}.`
      : '';
    const reply = await generateAssistantText(config, `${message}${context}`, systemInstruction);
    return { reply, source: 'ai-real' };
  } catch (err) {
    await refundQuota(identity, 'assistant');
    throw err;
  }
}
