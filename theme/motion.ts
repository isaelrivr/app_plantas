/**
 * Sistema de diseño · Tokens de movimiento y estilo
 *
 * Centraliza duraciones, easings y comportamiento con respeto al ajuste del sistema "Reducir movimiento".
 */

import { Easing } from 'react-native';

export const standardMotion = {
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
  isReduced: false,
};

export const reducedMotion: typeof standardMotion = {
  duration: {
    instant: 0,
    fast: 0,
    normal: 0,
    slow: 0,
    slower: 0,
  },
  easing: {
    standard: Easing.linear,
    decelerate: Easing.linear,
    accelerate: Easing.linear,
    emphasized: Easing.linear,
  },
  spring: {
    gentle: { damping: 50, stiffness: 300, mass: 1 },
    bouncy: { damping: 50, stiffness: 300, mass: 1 },
  },
  translateYOffset: 0,
  isReduced: true,
};

export const motion = standardMotion;
