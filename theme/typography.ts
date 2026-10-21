import type { TextStyle } from 'react-native';

/**
 * Familia tipográfica unificada para EcoScan:
 * En Android utiliza 'sans-serif' (Roboto nativo de Material 3).
 * En iOS / Web recurre a la tipografía del sistema para máxima nitidez y rendimiento nativo.
 */
export const FONT_FAMILY = 'sans-serif';

/**
 * Pesos tipográficos estandarizados de Material 3:
 * Reducidos a tres únicos pesos esenciales para consistencia visual:
 * - Regular (400)
 * - Medium (500)
 * - Bold (700)
 */
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  bold: '700' as const,
};

/**
 * Escala tipográfica adaptada a Material 3 con accesibilidad reforzada (WCAG AA).
 * Contenido mínimo de cuerpo >= 17sp; elementos secundarios mínimo >= 14sp.
 */
export const typography = {
  // Display / Large Titles
  largeTitle: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: fontWeights.bold as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  title1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeights.bold as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  title2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: fontWeights.bold as TextStyle['fontWeight'],
    letterSpacing: 0,
  },

  // Titles / Headlines (Material 3 usa Medium 500)
  title3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeights.medium as TextStyle['fontWeight'],
    letterSpacing: 0.15,
  },
  headline: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeights.medium as TextStyle['fontWeight'],
    letterSpacing: 0.15,
  },

  // Body Content (Regular 400)
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: fontWeights.regular as TextStyle['fontWeight'],
    letterSpacing: 0.25,
  },
  callout: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeights.regular as TextStyle['fontWeight'],
    letterSpacing: 0.25,
  },

  // Subheadlines & Labels (Medium 500)
  subheadline: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: fontWeights.medium as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },

  // Footnotes & Captions (Accesible >= 14sp)
  footnote: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular as TextStyle['fontWeight'],
    letterSpacing: 0.25,
  },
  caption1: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },
  caption2: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeights.regular as TextStyle['fontWeight'],
    letterSpacing: 0.4,
  },
};

/**
 * Escala tipográfica para el "Modo fácil" (texto de alto impacto visual y legibilidad senior)
 */
export const easyModeTypography: typeof typography = {
  largeTitle: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: fontWeights.bold as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  title1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: fontWeights.bold as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  title2: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: fontWeights.bold as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  title3: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeights.medium as TextStyle['fontWeight'],
    letterSpacing: 0.15,
  },
  headline: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeights.medium as TextStyle['fontWeight'],
    letterSpacing: 0.15,
  },
  body: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: fontWeights.regular as TextStyle['fontWeight'],
    letterSpacing: 0.25,
  },
  callout: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeights.regular as TextStyle['fontWeight'],
    letterSpacing: 0.25,
  },
  subheadline: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: fontWeights.medium as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },
  footnote: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeights.regular as TextStyle['fontWeight'],
    letterSpacing: 0.25,
  },
  caption1: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: fontWeights.medium as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },
  caption2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular as TextStyle['fontWeight'],
    letterSpacing: 0.4,
  },
};

/**
 * Escala canónica oficial de tokens de Material 3 Design
 */
export const material3Scale = {
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: fontWeights.bold as TextStyle['fontWeight'] },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: fontWeights.bold as TextStyle['fontWeight'] },
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: fontWeights.bold as TextStyle['fontWeight'] },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: fontWeights.bold as TextStyle['fontWeight'] },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: fontWeights.bold as TextStyle['fontWeight'] },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: fontWeights.bold as TextStyle['fontWeight'] },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: fontWeights.medium as TextStyle['fontWeight'] },
  titleMedium: { fontSize: 18, lineHeight: 24, fontWeight: fontWeights.medium as TextStyle['fontWeight'] },
  titleSmall: { fontSize: 15, lineHeight: 22, fontWeight: fontWeights.medium as TextStyle['fontWeight'] },
  bodyLarge: { fontSize: 17, lineHeight: 24, fontWeight: fontWeights.regular as TextStyle['fontWeight'] },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontWeight: fontWeights.regular as TextStyle['fontWeight'] },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: fontWeights.regular as TextStyle['fontWeight'] },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: fontWeights.medium as TextStyle['fontWeight'] },
  labelMedium: { fontSize: 13, lineHeight: 18, fontWeight: fontWeights.medium as TextStyle['fontWeight'] },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: fontWeights.medium as TextStyle['fontWeight'] },
};
