/** Idiomas soportados por la aplicación. */
export type AppLanguage = 'es' | 'en';

export interface TranslationParams {
  [key: string]: string | number;
}
