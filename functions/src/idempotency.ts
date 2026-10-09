/**
 * Caché de idempotencia en memoria por `requestId`. Evita volver a consumir
 * cuota y llamar a proveedores cuando el cliente reintenta una petición que ya
 * se resolvió (timeouts percibidos, reintentos de red, etc.).
 */

interface Entry {
  expiresAt: number;
  value: unknown;
}

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, Entry>();

export function getCachedResponse(requestId: string | undefined): unknown | null {
  if (!requestId) return null;
  const entry = cache.get(requestId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(requestId);
    return null;
  }
  return entry.value;
}

export function cacheResponse(requestId: string | undefined, value: unknown): void {
  if (!requestId) return;
  cache.set(requestId, { expiresAt: Date.now() + TTL_MS, value });
  if (cache.size > MAX_ENTRIES) {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now > entry.expiresAt) cache.delete(key);
    }
  }
}