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

export const layout = {
  /** Área táctil mínima accesible estándar (WCAG / Material 3 / iOS HIG): 48x48 dp */
  minTouchTarget: 48,
  /** Área táctil mínima en Modo Fácil: 56x56 dp */
  easyMinTouchTarget: 56,
  /** Separación mínima entre botones o controles interactivos contiguos: 8 dp */
  buttonGap: 8,
  borderRadius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24, // Radio ampliado a 24dp para estética Material 3 moderna
    xl: 28,
    xxl: 32,
    full: 9999,
    pill: 9999,
  },
  cardPadding: 18,
  screenPadding: 18,
  floatingBottom: 16,
  tabBarHeight: 60,
  tabBarGap: 14,
  glass: {
    intensity: 45,
    tint: 'default' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)', // Borde 1px blanco 25% (20-30%)
    fallbackOpacity: 0.96,
  },
};
