/**
 * EcoScan Privacy-First Analytics Service
 *
 * Módulo de analítica de producto respetuoso con la privacidad.
 * PRINCIPIOS OBLIGATORIOS:
 *  1. SOLO funciona si el usuario ha otorgado consentimiento explícito en Ajustes.
 *  2. Cero PII: no recopila nombres, fotos, ubicaciones GPS, ni identificadores de hardware.
 *  3. Eventos agregados orientados a la usabilidad (ej. escaneo completado, riego realizado).
 */

import { loadJSON, saveJSON, STORAGE_KEYS } from './storage';

let hasConsent = false;

export async function initAnalytics(): Promise<boolean> {
  hasConsent = await loadJSON<boolean>(STORAGE_KEYS.analyticsConsent, false);
  return hasConsent;
}

export function getAnalyticsConsent(): boolean {
  return hasConsent;
}

export async function setAnalyticsConsent(consent: boolean): Promise<void> {
  hasConsent = consent;
  await saveJSON(STORAGE_KEYS.analyticsConsent, consent);
}

export type AnalyticsEventName =
  | 'app_opened'
  | 'onboarding_completed'
  | 'plant_scanned'
  | 'plant_saved'
  | 'plant_watered'
  | 'task_completed'
  | 'diagnosis_run'
  | 'screen_view'
  | 'paywall_viewed'
  | 'pro_trial_started';

export function trackEvent(
  eventName: AnalyticsEventName,
  params?: Record<string, string | number | boolean>
): boolean {
  if (!hasConsent) {
    // Si no hay consentimiento explícito, no se registra nada.
    return false;
  }

  if (__DEV__) {
    console.log(`[analytics:${eventName}]`, params ?? {});
  }

  // En producción, se despacha a la plataforma de telemetría respetuosa (ej. PostHog sin tracking de IP o Plausible)
  return true;
}
