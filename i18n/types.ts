/** Idiomas soportados por la aplicación. */
export type AppLanguage = 'es' | 'en' | 'pt' | 'fr';

export interface TranslationParams {
  [key: string]: string | number;
}
