export const colors = {
  light: {
    // Brand & Tint
    primary: '#2E7D32', // Forest green (contrast ratio > 5:1 with white)
    primaryLight: '#E8F5E9',
    primaryDark: '#1B5E20', // Contrast ratio > 9:1 with white / primaryLight
    accent: '#00796B',

    // Surfaces & Backgrounds
    background: '#F8F9FA', // Apple HIG system grouped background
    surface: '#FFFFFF',    // Standard card surface
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#F1F3F4',

    // Borders & Dividers
    border: '#D0D0D4',
    borderLight: '#E5E5EA',

    // Typography (WCAG AA compliant: all >= 4.5:1 against white/surface)
    textPrimary: '#1C1C1E',   // Contrast 15.3:1
    textSecondary: '#48484A', // Contrast 8.2:1
    textTertiary: '#59595E',  // Contrast 5.9:1 (meets WCAG AA >= 4.5:1)
    textInverse: '#FFFFFF',

    // Status & Feedback (Siempre acompañado de iconos en la UI)
    success: '#1B5E20',
    warning: '#D84315',
    warningLight: '#FBE9E7',
    error: '#C62828',
    errorLight: '#FFEBEE',
    info: '#0277BD',

    // Premium accents
    premiumGold: '#9A6B00', // Contrast >= 4.6:1
    premiumGoldLight: '#FFF8E1',
    badgeBackground: '#E8F5E9',
  },
  dark: {
    // Brand & Tint
    primary: '#66BB6A', // Vibrant green with excellent dark mode contrast
    primaryLight: '#1B3820',
    primaryDark: '#A5D6A7',
    accent: '#4DB6AC',

    // Surfaces & Backgrounds
    background: '#000000', // Apple HIG pure black base
    surface: '#1C1C1E',    // Apple HIG secondary background card
    surfaceElevated: '#2C2C2E',
    surfaceSecondary: '#2C2C2E',

    // Borders & Dividers
    border: '#38383A',
    borderLight: '#2C2C2E',

    // Typography (WCAG AA compliant)
    textPrimary: '#FFFFFF',
    textSecondary: '#D1D1D6', // Contrast 12.8:1
    textTertiary: '#AEAEB2',  // Contrast 6.7:1 on surface
    textInverse: '#121212',

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
