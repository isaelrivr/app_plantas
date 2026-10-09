/**
 * Límite de uso diario por identidad. Free y Premium tienen cupos distintos.
 *
 * Usa Firestore (`quota/{fecha}_{kind}_{id}`). Si Firestore no está
 * disponible (p. ej. el emulador no está arrancado), cae a contadores en
 * memoria del proceso para no bloquear el desarrollo local.
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { Identity } from './guard';
import { ApiError, quotaExceeded } from './errors';
import type { QuotaRule } from './config';

export type QuotaKind = 'identify' | 'care' | 'health';

const memCounters = new Map<string, number>();

const dayKey = (): string => new Date().toISOString().slice(0, 10);

export function secondsUntilMidnight(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((end.getTime() - now.getTime()) / 1000));
}

/**
 * Consume una unidad de cuota. Lanza `ApiError` 429 si se agotó el cupo.
 * Devuelve cuántas unidades quedan (informativo).
 */
export async function consumeQuota(identity: Identity, kind: QuotaKind, rule: QuotaRule): Promise<{ remaining: number }> {
  const limit = identity.isPremium ? rule.premium : rule.free;
  const date = dayKey();
  const docId = `quota_${date}_${kind}_${identity.id.replace(/[^A-Za-z0-9_-]/g, '_')}`;

  let used = 0;
  try {
    const ref = getFirestore().collection('quota').doc(docId);
    const snap = await ref.get();
    used = snap.exists ? Number(snap.data()?.count ?? 0) : 0;
    if (used >= limit) throw quotaExceeded(secondsUntilMidnight());
    await ref.set({ count: used + 1, updatedAt: Date.now(), kind, identityKind: identity.kind }, { merge: true });
    return { remaining: limit - used - 1 };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Firestore no disponible: degradar a contador en memoria.
    console.warn('[plantae-functions] Firestore no disponible para cuota; uso contador en memoria.', err);
  }

  const memKey = `${date}|${kind}|${identity.id}`;
  used = memCounters.get(memKey) ?? 0;
  if (used >= limit) throw quotaExceeded(secondsUntilMidnight());
  memCounters.set(memKey, used + 1);
  return { remaining: limit - used - 1 };
}