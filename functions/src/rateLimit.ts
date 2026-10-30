/**
 * Límite de uso diario por dispositivo en arquitectura Local-First.
 *
 * Opera de forma atómica en memoria del servidor proxy, con capacidad de
 * reversión (refundQuota) si el proveedor aguas arriba (Gemini / Plant.id) falla.
 */

import type { Identity } from './guard';
import { quotaExceeded } from './errors';
import type { QuotaRule } from './config';

export type QuotaKind = 'identify' | 'care' | 'health' | 'assistant';

const memCounters = new Map<string, number>();

const dayKey = (): string => new Date().toISOString().slice(0, 10);

export function secondsUntilMidnight(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((end.getTime() - now.getTime()) / 1000));
}

/**
 * Consume una unidad de cuota de forma atómica. Lanza `ApiError` 429 si se agotó el cupo.
 */
export async function consumeQuota(
  identity: Identity,
  kind: QuotaKind,
  rule: QuotaRule
): Promise<{ remaining: number }> {
  const limit = identity.isPremium ? rule.premium : rule.free;
  const date = dayKey();
  const memKey = `${date}|${kind}|${identity.id}`;

  const used = memCounters.get(memKey) ?? 0;
  if (used >= limit) {
    throw quotaExceeded(secondsUntilMidnight());
  }

  memCounters.set(memKey, used + 1);

  // Limpieza periódica de memoria para fechas pasadas
  if (memCounters.size > 10_000) {
    for (const key of memCounters.keys()) {
      if (!key.startsWith(date)) {
        memCounters.delete(key);
      }
    }
  }

  return { remaining: limit - used - 1 };
}

/**
 * Reembolsa una unidad de cuota de forma atómica si la llamada aguas arriba falló.
 */
export async function refundQuota(identity: Identity, kind: QuotaKind): Promise<void> {
  const date = dayKey();
  const memKey = `${date}|${kind}|${identity.id}`;
  const used = memCounters.get(memKey) ?? 0;
  if (used > 0) {
    memCounters.set(memKey, used - 1);
  }
}
