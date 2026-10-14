/**
 * Utilidades puras de procesamiento de texto.
 */

export const normalizeDiacritics = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
