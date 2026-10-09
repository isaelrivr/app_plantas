import type { AppConfig } from './config';
import type { Identity } from './guard';
import { consumeQuota } from './rateLimit';
import { badRequest } from './errors';
import { generateAssistantText } from './providers/gemini';
import type { AssistantRequest, AssistantResponse } from './types';

export async function runAssistant(config: AppConfig, identity: Identity, req: AssistantRequest): Promise<AssistantResponse> {
  if (typeof req?.message !== 'string' || req.message.trim().length < 2) {
    throw badRequest('Escribe una pregunta válida para el asistente.');
  }
  const message = req.message.trim().slice(0, 4000);
  await consumeQuota(identity, 'assistant', config.quotas.assistant);
  const context = req.context?.plantName ? ` Planta relacionada: ${String(req.context.plantName).slice(0, 120)}.` : '';
  const reply = await generateAssistantText(config, `${message}${context}`);
  return { reply, source: 'ai-real' };
}
