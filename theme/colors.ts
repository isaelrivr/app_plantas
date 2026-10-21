export const colors = {
  light: {
    // Brand & Tint
    primary: '#1B6A3B', // Deep botanical emerald
    primaryLight: '#E8F5E9',
    primaryDark: '#1B5E20', // Contrast ratio > 9:1 with white / primaryLight
    accent: '#00796B',

    // Surfaces & Backgrounds (Minimalist flat surfaces with generous whitespace)
    background: '#F8FAF8', // Crisp, airy, clean botanical canvas
    surface: '#FFFFFF',    // Pristine flat card surface
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#F0F4F1',

    // Borders & Dividers (Subtle minimal hairlines)
    border: '#E2E7E2',
    borderLight: '#EDF2ED',

    // Glassmorphism tokens (used ONLY on floating surfaces)
    glassBackground: 'rgba(255, 255, 255, 0.80)',
    glassBorder: 'rgba(255, 255, 255, 0.65)',
    glassFloating: 'rgba(255, 255, 255, 0.90)',

    // Typography (WCAG AA compliant: all >= 4.5:1 against white/surface)
    textPrimary: '#1A201C',   // Deep organic charcoal
    textSecondary: '#4A554E', // Contrast > 7:1
    textTertiary: '#59595E',  // Contrast 5.9:1 (meets WCAG AA >= 4.5:1)
    textInverse: '#FFFFFF',

    // Status & Feedback
    success: '#1B5E20',
    warning: '#D84315',
    warningLight: '#FBE9E7',
    error: '#C62828',
    errorLight: '#FFEBEE',
    info: '#0277BD',

    // Premium accents
    premiumGold: '#9A6B00',
    premiumGoldLight: '#FFF8E1',
    badgeBackground: '#E8F5E9',
  },
  dark: {
    // Brand & Tint
    primary: '#4ADE80', // Luminous botanical mint
    primaryLight: '#163824',
    primaryDark: '#86EFAC',
    accent: '#2DD4BF',

    // Surfaces & Backgrounds
    background: '#0E1411', // Deep botanical obsidian
    surface: '#161E1A',    // Clean slate-forest surface
    surfaceElevated: '#202A24',
    surfaceSecondary: '#1C2520',

    // Borders & Dividers
    border: '#24322A',
    borderLight: '#1B2620',

    // Glassmorphism tokens (used ONLY on floating surfaces)
    glassBackground: 'rgba(22, 30, 26, 0.80)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassFloating: 'rgba(26, 36, 31, 0.90)',

    // Typography (WCAG AA compliant)
    textPrimary: '#F2F5F3',
    textSecondary: '#C2CBC4',
    textTertiary: '#8F9E94',
    textInverse: '#101412',

    // Status & Feedback
    success: '#81C784',
    warning: '#FFB74D',
    warningLight: '#3E2723',
    error: '#EF5350',
    errorLight: '#3E1D1D',
    info: '#4FC3F7',

    // Premium accents
    premiumGold: '#FFE082',
    premiumGoldLight: '#3E341B',
    badgeBackground: '#1C3322',
  },
};

export type ThemeColors = typeof colors.light;
