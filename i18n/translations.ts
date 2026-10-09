/**
 * Diccionario de traducciones al inglés.
 *
 * El idioma base de la app es el español: los textos en el código son la fuente
 * de verdad. Este diccionario mapea cada texto fuente en español a su versión en
 * inglés. Si una clave no existe aquí, `t()` devuelve el texto original, de modo
 * que nunca se muestra una traducción vacía.
 *
 * Fragmenta por dominio para que varias personas puedan trabajar en paralelo.
 */

import onboarding from './fragments/onboarding';
import scanner from './fragments/scanner';
import health from './fragments/health';
import garden from './fragments/garden';
import plants from './fragments/plants';
import growth from './fragments/growth';
import habitat from './fragments/habitat';
import achievements from './fragments/achievements';
import account from './fragments/account';
import components from './fragments/components';
import misc from './fragments/misc';
import core from './fragments/core';

export const EN: Record<string, string> = {
  ...onboarding,
  ...scanner,
  ...health,
  ...garden,
  ...plants,
  ...growth,
  ...habitat,
  ...achievements,
  ...account,
  ...components,
  ...misc,
  ...core,
};
