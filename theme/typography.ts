import type { TextStyle } from 'react-native';

// Human Interface Guidelines Typography Scale con accesibilidad reforzada
// Contenido mínimo 16-17 sp; etiquetas secundarias mínimo 14 sp
export const typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.07,
  },
};

// Escala tipográfica para el "Modo fácil" (texto de alto impacto visual)
export const easyModeTypography: typeof typography = {
  largeTitle: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0.4,
  },
  title1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0.38,
  },
  title2: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0.36,
  },
  title3: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.07,
  },
};
