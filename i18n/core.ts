/**
 * Núcleo de internacionalización (sin dependencias de React).
 *
 * Usa el español como idioma fuente: `t('Riego')` devuelve 'Riego' en español y
 * 'Watering' en inglés. Admite interpolación con marcadores `{nombre}`.
 */

import type { AppLanguage, TranslationParams } from './types';
import { EN } from './translations';

const DICTIONARIES: Record<AppLanguage, Record<string, string>> = {
  es: {}, // El español es la fuente: no necesita diccionario.
  en: EN,
};

let currentLanguage: AppLanguage = 'es';

/** Actualiza el idioma activo para el traductor global (usado por servicios). */
export function setI18nLanguage(language: AppLanguage): void {
  currentLanguage = language;
}

/** Idioma activo en este momento. */
export function getI18nLanguage(): AppLanguage {
  return currentLanguage;
}

function interpolate(text: string, params?: TranslationParams): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
  );
}

/** Traduce un texto fuente en español al idioma indicado. */
export function translate(source: string, language: AppLanguage, params?: TranslationParams): string {
  const dict = DICTIONARIES[language] ?? {};
  return interpolate(dict[source] ?? source, params);
}

/**
 * Traduce usando el idioma activo. Pensado para código fuera de React
 * (servicios, notificaciones, alertas). Los componentes deben usar
 * `useTranslation()` para re-renderizar al cambiar de idioma.
 */
export function t(source: string, params?: TranslationParams): string {
  return translate(source, currentLanguage, params);
}
