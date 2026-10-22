export const BRAND_COLOR = '#2E7D32';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  brand: string;

  background: string;
  backgroundGradient: readonly [string, string];
  surface: string;
  surfaceElevated: string;
  surfaceSecondary: string;

  border: string;
  borderLight: string;

  glassFill: string;
  glassFillStrong: string;
  glassBorder: string;
  glassFallback: string;
  glassBackground: string;
  glassFloating: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  premiumGold: string;
  premiumGoldLight: string;
  badgeBackground: string;
}

export type ColorKey = {
  [K in keyof ThemeColors]: ThemeColors[K] extends string ? K : never;
}[keyof ThemeColors];

export const colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    // Brand & Tint
    primary: BRAND_COLOR, // Verde botánico oficial EcoScan (único color de marca)
    primaryLight: '#E8F5E9',
    primaryDark: '#1B5E20', // Contrast ratio > 9:1 with white / primaryLight
    accent: '#00796B',
    brand: BRAND_COLOR,

    // Surfaces & Backgrounds (Minimalist flat surfaces with generous whitespace)
    background: '#F8FAF8', // Crisp, airy, clean botanical canvas
    backgroundGradient: ['#F8FAF8', '#F1F5F2'] as const,
    surface: '#FFFFFF',    // Pristine flat card surface
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#F0F4F1',

    // Borders & Dividers (Subtle minimal hairlines)
    border: '#E2E7E2',
    borderLight: '#EDF2ED',

    // Glassmorphism tokens (used ONLY on floating surfaces)
    glassFill: 'rgba(255, 255, 255, 0.70)',
    glassFillStrong: 'rgba(255, 255, 255, 0.88)',
    glassBorder: 'rgba(255, 255, 255, 0.25)', // Borde 1px blanco 25% (20-30%)
    glassFallback: '#F4F7F4', // Fallback opaco de alto contraste para Android viejo/lento
    glassBackground: 'rgba(255, 255, 255, 0.80)',
    glassFloating: 'rgba(255, 255, 255, 0.90)',

    // Typography (WCAG AA compliant: all >= 4.5:1 against white/surface)
    textPrimary: '#1A201C',   // Deep organic charcoal
    textSecondary: '#4A554E', // Contrast > 7:1
    textTertiary: '#59595E',  // Contrast 5.9:1 (meets WCAG AA >= 4.5:1)
    textInverse: '#FFFFFF',

    // Status & Feedback
    success: '#1B5E20',
    successLight: '#E8F5E9',
    warning: '#D84315',
    warningLight: '#FBE9E7',
    error: '#C62828',
    errorLight: '#FFEBEE',
    info: '#0277BD',
    infoLight: '#E1F5FE',

    // Premium accents
    premiumGold: '#9A6B00',
    premiumGoldLight: '#FFF8E1',
    badgeBackground: '#E8F5E9',
  },
  dark: {
    // Brand & Tint
    primary: '#4ADE80', // Luminous botanical mint para contraste en dark mode
    primaryLight: '#163824',
    primaryDark: '#86EFAC',
    accent: '#2DD4BF',
    brand: BRAND_COLOR,

    // Surfaces & Backgrounds
    background: '#0E1411', // Deep botanical obsidian
    backgroundGradient: ['#0E1411', '#141D18'] as const,
    surface: '#161E1A',    // Clean slate-forest surface
    surfaceElevated: '#202A24',
    surfaceSecondary: '#1C2520',

    // Borders & Dividers
    border: '#24322A',
    borderLight: '#1B2620',

    // Glassmorphism tokens (used ONLY on floating surfaces)
    glassFill: 'rgba(22, 30, 26, 0.70)',
    glassFillStrong: 'rgba(26, 36, 31, 0.88)',
    glassBorder: 'rgba(255, 255, 255, 0.20)', // Borde blanco 20%
    glassFallback: '#161E1A', // Fallback opaco oscuro
    glassBackground: 'rgba(22, 30, 26, 0.80)',
    glassFloating: 'rgba(26, 36, 31, 0.90)',

    // Typography (WCAG AA compliant)
    textPrimary: '#F2F5F3',
    textSecondary: '#C2CBC4',
    textTertiary: '#8F9E94',
    textInverse: '#101412',

    // Status & Feedback
    success: '#81C784',
    successLight: '#163824',
    warning: '#FFB74D',
    warningLight: '#3E2723',
    error: '#EF5350',
    errorLight: '#3E1D1D',
    info: '#4FC3F7',
    infoLight: '#0D2B3E',

    // Premium accents
    premiumGold: '#FFE082',
    premiumGoldLight: '#3E341B',
    badgeBackground: '#1C3322',
  },
};
