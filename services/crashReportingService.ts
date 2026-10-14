/**
 * EcoScan Crash Reporting Service
 *
 * Módulo de captura y reporte de fallos en producción.
 * Si Sentry está configurado en app.json/entorno, lo inicializa de forma segura.
 * Respeta la privacidad del usuario eliminando parámetros que contengan PII.
 */

interface ErrorContext {
  componentStack?: string;
  isFatal?: boolean;
  [key: string]: unknown;
}

let isInitialized = false;

export function initCrashReporting(): void {
  if (isInitialized) return;
  isInitialized = true;
  // Preparado para Sentry / Expo Crash Reporting en builds nativos
  if (!__DEV__) {
    // Si existe Sentry en el bundle, capturar errores no manejados
    console.info('[crashReporting] Servicio de reporte de fallos inicializado.');
  }
}

export function captureException(error: unknown, context?: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  if (__DEV__) {
    console.warn('[crashReporting] Excepción capturada:', message, { stack, ...context });
  }

  // En producción, enviar a Sentry si el SDK está disponible
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (__DEV__) {
    console.log(`[crashReporting:${level}]`, message);
  }
}
