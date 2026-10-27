export const BRAND_COLOR = '#2E7D32';

/**
 * Material Design 3 (Material You) Botanical Color System
 * Mapeo completo de tokens M3 con modo claro y modo oscuro tonal real.
 */
export interface ThemeColors {
  // Brand & Primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryLight: string;
  primaryDark: string;
  brand: string;

  // Secondary & Tertiary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  accent: string;

  // Surfaces M3 (5 niveles tonales oficiales)
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceElevated: string;
  surfaceSecondary: string;
  background: string;
  backgroundGradient: readonly [string, string];

  // Content on Surface
  onSurface: string;
  onSurfaceVariant: string;

  // Outlines & Borders
  outline: string;
  outlineVariant: string;
  border: string;
  borderLight: string;

  // Inverse
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  // Typography tokens (compatibilidad y semántica)
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Feedback & Status
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
  successLight: string;

  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;
  warningLight: string;

  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  errorLight: string;

  info: string;
  onInfo: string;
  infoContainer: string;
  onInfoContainer: string;
  infoLight: string;

  // Premium & Badges
  premiumGold: string;
  premiumGoldLight: string;
  badgeBackground: string;

  // Glass tokens transicionales (redirigidos a superficies tonales M3)
  glassFill: string;
  glassFillStrong: string;
  glassBorder: string;
  glassFallback: string;
  glassBackground: string;
  glassFloating: string;
}

export type ColorKey = {
  [K in keyof ThemeColors]: ThemeColors[K] extends string ? K : never;
}[keyof ThemeColors];

export const colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    // 1. Primary (Verde botánico EcoScan)
    primary: BRAND_COLOR,
    onPrimary: '#FFFFFF',
    primaryContainer: '#C8E6C9', // Contenedor verde claro botánico
    onPrimaryContainer: '#002107', // Contraste > 15:1 con primaryContainer
    primaryLight: '#E8F5E9',
    primaryDark: '#1B5E20',
    brand: BRAND_COLOR,

    // 2. Secondary & Tertiary
    secondary: '#386A20',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D8E8CB',
    onSecondaryContainer: '#0B2003',
    tertiary: '#006874',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#B2DFDB',
    onTertiaryContainer: '#002022',
    accent: '#00796B',

    // 3. Surfaces M3 (Tonal elevation, sin sombras duras)
    surface: '#FDFDF5',
    surfaceDim: '#D8DCD3',
    surfaceBright: '#FDFDF5',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F6FAF4',
    surfaceContainer: '#F0F5EE', // Barra de navegación inferior y AppBars
    surfaceContainerHigh: '#EAEFE8', // BottomSheets y diálogos
    surfaceContainerHighest: '#E4EAE2', // Divisores y chips inactivos
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#F0F5EE',
    background: '#F8FAF8',
    backgroundGradient: ['#F8FAF8', '#F0F5EE'] as const,

    // 4. Content on Surface
    onSurface: '#191C19',
    onSurfaceVariant: '#414941',

    // 5. Borders & Outlines
    outline: '#727971',
    outlineVariant: '#C1C9BF',
    border: '#E2E7E2',
    borderLight: '#EDF2ED',

    // 6. Inverse
    inverseSurface: '#2E312E',
    inverseOnSurface: '#F0F2EC',
    inversePrimary: '#81C784',

    // 7. Typography (WCAG AA compliant)
    textPrimary: '#191C19',
    textSecondary: '#414941',
    textTertiary: '#59595E',
    textInverse: '#FFFFFF',

    // 8. Status & Feedback
    success: '#1B5E20',
    onSuccess: '#FFFFFF',
    successContainer: '#C8E6C9',
    onSuccessContainer: '#002107',
    successLight: '#E8F5E9',

    warning: '#D84315',
    onWarning: '#FFFFFF',
    warningContainer: '#FBE9E7',
    onWarningContainer: '#3E0A00',
    warningLight: '#FBE9E7',

    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    errorLight: '#FFEBEE',

    info: '#0277BD',
    onInfo: '#FFFFFF',
    infoContainer: '#E1F5FE',
    onInfoContainer: '#001F33',
    infoLight: '#E1F5FE',

    // 9. Premium & Badges
    premiumGold: '#9A6B00',
    premiumGoldLight: '#FFF8E1',
    badgeBackground: '#E8F5E9',

    // 10. Glass transicional (redireccionado a superficies M3)
    glassFill: 'rgba(255, 255, 255, 0.90)',
    glassFillStrong: 'rgba(255, 255, 255, 0.96)',
    glassBorder: 'rgba(255, 255, 255, 0.25)',
    glassFallback: '#F4F7F4',
    glassBackground: '#F0F5EE',
    glassFloating: '#EAEFE8',
  },
  dark: {
    // 1. Primary (Menta botánico luminoso para modo oscuro)
    primary: '#4ADE80',
    onPrimary: '#003915',
    primaryContainer: '#1B5E20',
    onPrimaryContainer: '#C8E6C9',
    primaryLight: '#163824',
    primaryDark: '#86EFAC',
    brand: BRAND_COLOR,

    // 2. Secondary & Tertiary
    secondary: '#9CD67D',
    onSecondary: '#113800',
    secondaryContainer: '#205107',
    onSecondaryContainer: '#D8E8CB',
    tertiary: '#4DD0E1',
    onTertiary: '#00363D',
    tertiaryContainer: '#004F58',
    onTertiaryContainer: '#B2DFDB',
    accent: '#2DD4BF',

    // 3. Surfaces M3 (Modo oscuro tonal real, no negro #000 puro)
    surface: '#111411',
    surfaceDim: '#111411',
    surfaceBright: '#373A36',
    surfaceContainerLowest: '#0C0F0C',
    surfaceContainerLow: '#171C17',
    surfaceContainer: '#1B201B',
    surfaceContainerHigh: '#252B25',
    surfaceContainerHighest: '#303630',
    surfaceElevated: '#202A24',
    surfaceSecondary: '#1C2520',
    background: '#0E1411',
    backgroundGradient: ['#0E1411', '#1B201B'] as const,

    // 4. Content on Surface
    onSurface: '#F2F5F3',
    onSurfaceVariant: '#C2CBC4',

    // 5. Borders & Outlines
    outline: '#8B938A',
    outlineVariant: '#414941',
    border: '#24322A',
    borderLight: '#1B2620',

    // 6. Inverse
    inverseSurface: '#F2F5F3',
    inverseOnSurface: '#191C19',
    inversePrimary: '#2E7D32',

    // 7. Typography (WCAG AA compliant)
    textPrimary: '#F2F5F3',
    textSecondary: '#C2CBC4',
    textTertiary: '#8F9E94',
    textInverse: '#101412',

    // 8. Status & Feedback
    success: '#81C784',
    onSuccess: '#003912',
    successContainer: '#1B5E20',
    onSuccessContainer: '#C8E6C9',
    successLight: '#163824',

    warning: '#FFB74D',
    onWarning: '#4A2800',
    warningContainer: '#3E2723',
    onWarningContainer: '#FFE0B2',
    warningLight: '#3E2723',

    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    errorLight: '#3E1D1D',

    info: '#4FC3F7',
    onInfo: '#00344F',
    infoContainer: '#0D2B3E',
    onInfoContainer: '#B3E5FC',
    infoLight: '#0D2B3E',

    // 9. Premium & Badges
    premiumGold: '#FFE082',
    premiumGoldLight: '#3E341B',
    badgeBackground: '#1C3322',

    // 10. Glass transicional (redireccionado a superficies M3)
    glassFill: 'rgba(27, 32, 27, 0.90)',
    glassFillStrong: 'rgba(37, 43, 37, 0.96)',
    glassBorder: 'rgba(255, 255, 255, 0.20)',
    glassFallback: '#161E1A',
    glassBackground: '#1B201B',
    glassFloating: '#252B25',
  },
};
