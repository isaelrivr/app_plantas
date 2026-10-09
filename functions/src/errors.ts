/**
 * Errores tipados del backend. `ApiError` se serializa como JSON
 * `{ error: { code, message, retryAfterSeconds } }` en la respuesta HTTP.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (message: string): ApiError => new ApiError(400, 'BAD_REQUEST', message);
export const unauthorized = (message: string): ApiError => new ApiError(401, 'UNAUTHORIZED', message);
export const quotaExceeded = (retryAfterSeconds: number): ApiError =>
  new ApiError(429, 'RATE_LIMITED', 'Alcanzaste el límite diario de análisis gratuitos. Vuelve mañana o hazte Pro para seguir sin límites.', retryAfterSeconds);
export const upstreamError = (code: string, message: string, status = 502): ApiError => new ApiError(status, code, message);

/** Serializa cualquier error a la forma HTTP estándar de la API. */
export function serializeErrorBody(err: unknown): { status: number; body: { error: { code: string; message: string; retryAfterSeconds?: number } } } {
  if (err instanceof ApiError) {
    return {
      status: err.status,
      body: {
        error: {
          code: err.code,
          message: err.message,
          ...(err.retryAfterSeconds ? { retryAfterSeconds: err.retryAfterSeconds } : {}),
        },
      },
    };
  }
  console.error('[plantae-functions] Error no controlado:', err);
  return {
    status: 500,
    body: { error: { code: 'INTERNAL', message: 'Error interno del servidor. Inténtalo de nuevo.' } },
  };
}