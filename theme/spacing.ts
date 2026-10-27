export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

/**
 * Formas y Radios oficiales de Material Design 3 (M3 Shape Scale)
 */
export const m3Shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
};

export const layout = {
  /** Área táctil mínima accesible estándar (WCAG / Material 3 / Android): 48x48 dp */
  minTouchTarget: 48,
  /** Área táctil mínima en Modo Fácil: 56x56 dp */
  easyMinTouchTarget: 56,
  /** Separación mínima entre botones o controles interactivos contiguos: 8 dp */
  buttonGap: 8,
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16, // Material 3 standard card radius
    xl: 28, // Material 3 standard BottomSheet & Dialog radius
    xxl: 28,
    full: 9999,
    pill: 9999,
  },
  cardPadding: 16,
  screenPadding: 16,
  floatingBottom: 16,
  tabBarHeight: 80, // Altura estándar M3 NavigationBar
  tabBarGap: 8,
  glass: {
    intensity: 0,
    tint: 'default' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    fallbackOpacity: 1.0,
  },
};
