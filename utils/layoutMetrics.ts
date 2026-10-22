export const TAB_BAR_HEIGHT = 60;
export const TAB_BAR_GAP = 14;
export const CONTENT_BREATHING = 16;

/**
 * Margen inferior real que separa la barra flotante del borde inferior de la pantalla.
 * En iOS con Home Indicator (inset 34dp): ~42dp.
 * En Android con botones (inset 0dp): 16dp. Con gestos (inset 24dp): 30dp.
 */
export function getTabBarBottomMargin(bottomInset: number, platform: string = 'android'): number {
  const safeBottom = Math.max(bottomInset, 10);
  return safeBottom + (platform === 'android' ? 6 : 8);
}

export interface FloatingBarMetricsOptions {
  /**
   * Indica si la pantalla actual tiene barra de navegación de pestañas.
   * Por defecto true. En pantallas de stack (Detalle de planta, Ajustes, etc.), debe ser false.
   */
  hasTabBar?: boolean;
}

export interface FloatingBarMetrics {
  /** Altura física de la cápsula de navegación (60dp) */
  tabBarHeight: number;
  /** Margen inferior de la barra flotante respecto al borde inferior de la pantalla */
  tabBarBottomMargin: number;
  /** Altura total que ocupa la barra desde la base de la pantalla (margen + altura) */
  tabBarTotalHeight: number;
  /** Espacio que debe reservar el contenido scrolleable en su paddingBottom */
  tabBarClearance: number;
  /** Posición 'bottom' para el FAB "Añadir planta" u otros botones flotantes */
  fabBottom: number;
  /** Posición 'bottom' para el Snackbar */
  snackbarBottom: number;
}

/**
 * Calcula de forma pura todas las métricas de la barra flotante y márgenes de respiro.
 */
export function calculateFloatingBarMetrics(
  bottomInset: number,
  hasTabBar: boolean = true,
  platform: string = 'android'
): FloatingBarMetrics {
  const tabBarBottomMargin = getTabBarBottomMargin(bottomInset, platform);
  const tabBarTotalHeight = tabBarBottomMargin + TAB_BAR_HEIGHT;

  // En pantallas CON barra: 12-16 dp sobre la barra flotante.
  // En pantallas SIN barra: 16 dp sobre el borde seguro inferior.
  const fabBottom = hasTabBar
    ? tabBarTotalHeight + TAB_BAR_GAP
    : Math.max(bottomInset, 10) + 16;

  const snackbarBottom = fabBottom;

  // Espacio que debe dejar el contenido para que el último elemento sea visible y no quede oculto.
  // En pantallas con barra: altura total de la barra + margen de respiro (16dp).
  // En pantallas sin barra: inset inferior seguro + margen estándar (16dp).
  const tabBarClearance = hasTabBar
    ? tabBarTotalHeight + CONTENT_BREATHING
    : Math.max(bottomInset, 16) + 16;

  return {
    tabBarHeight: TAB_BAR_HEIGHT,
    tabBarBottomMargin,
    tabBarTotalHeight,
    tabBarClearance,
    fabBottom,
    snackbarBottom,
  };
}
