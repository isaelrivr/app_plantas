/**
 * Sistema de diseño · Tokens de movimiento y estilo
 *
 * Centraliza duraciones, easings y sombras para micro-animaciones y
 * transiciones coherentes en toda la app (Parte del punto 18 de pulido).
 */

import { Easing } from 'react-native';

export const motion = {
  duration: {
    instant: 120,
    fast: 200,
    normal: 300,
    slow: 450,
    slower: 700,
  },
  easing: {
    standard: Easing.bezier(0.4, 0.0, 0.2, 1),
    decelerate: Easing.out(Easing.cubic),
    accelerate: Easing.in(Easing.cubic),
    emphasized: Easing.bezier(0.2, 0.0, 0.0, 1),
  },
  spring: {
    gentle: { damping: 18, stiffness: 140, mass: 1 },
    bouncy: { damping: 12, stiffness: 180, mass: 1 },
  },
  /** Desplazamiento estándar de entrada en pantallas */
  translateYOffset: 16,
};
