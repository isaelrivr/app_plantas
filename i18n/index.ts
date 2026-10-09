/**
 * API pública de internacionalización.
 *
 * Uso en componentes:
 *   const { t } = useTranslation();
 *   <Text>{t('Mi Jardín')}</Text>
 *
 * Uso en servicios / código no React:
 *   import { t } from '../i18n';
 *   Alert.alert(t('Atención'), t('Algo salió mal'));
 */

import { useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { translate, type TranslationParams } from './core';
import type { AppLanguage } from './types';

export { t, translate, setI18nLanguage, getI18nLanguage } from './core';
export type { AppLanguage, TranslationParams } from './types';

export interface TranslationApi {
  language: AppLanguage;
  t: (source: string, params?: TranslationParams) => string;
}

/**
 * Hook de traducción. Se suscribe a las preferencias de idioma, por lo que el
 * componente se vuelve a renderizar cuando el usuario cambia de idioma.
 */
export function useTranslation(): TranslationApi {
  const { language } = useSettings();
  const translateFn = useCallback(
    (source: string, params?: TranslationParams) => translate(source, language, params),
    [language]
  );
  return { language, t: translateFn };
}
