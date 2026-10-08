export const colors = {
  light: {
    // Brand & Tint
    primary: '#2E7D32', // Rich forest green (contrast ratio > 4.5:1 with white)
    primaryLight: '#E8F5E9',
    primaryDark: '#1B5E20',
    accent: '#00897B',

    // Surfaces & Backgrounds
    background: '#F8F9FA', // Apple HIG system grouped background
    surface: '#FFFFFF',    // Standard card surface
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#F1F3F4',

    // Borders & Dividers
    border: '#E0E0E0',
    borderLight: '#EEEEEE',

    // Typography (WCAG AA compliant)
    textPrimary: '#1C1C1E',   // High contrast label
    textSecondary: '#636366', // Secondary label
    textTertiary: '#8E8E93',  // Tertiary hint
    textInverse: '#FFFFFF',

    // Status & Feedback
    success: '#2E7D32',
    warning: '#ED6C02',
    warningLight: '#FFF4E5',
    error: '#D32F2F',
    errorLight: '#FFEBEE',
    info: '#0288D1',

    // Premium accents
    premiumGold: '#B8860B',
    premiumGoldLight: '#FFF8E1',
    badgeBackground: '#E8F5E9',
  },
  dark: {
    // Brand & Tint
    primary: '#4CAF50', // Vibrant green with excellent dark mode contrast
    primaryLight: '#1B3820',
    primaryDark: '#81C784',
    accent: '#26A69A',

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
    textSecondary: '#AEAEB2',
    textTertiary: '#8E8E93',
    textInverse: '#121212',

    // Status & Feedback
    success: '#66BB6A',
    warning: '#FFA726',
    warningLight: '#3E2723',
    error: '#EF5350',
    errorLight: '#3E1D1D',
    info: '#29B6F6',

    // Premium accents
    premiumGold: '#FFD54F',
    premiumGoldLight: '#3E341B',
    badgeBackground: '#1C3322',
  },
};

export type ThemeColors = typeof colors.light;
