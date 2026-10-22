export interface ScannerCameraStateParams {
  isFocused: boolean;
  hasCapturedPhoto?: boolean;
  isIdentifying?: boolean;
  hasIdentificationResult?: boolean;
  hasErrorMessage?: boolean;
  hasMountError?: boolean;
  permissionGranted?: boolean;
}

/**
 * Determina si la cámara del escáner está en modo de captura activa a pantalla completa.
 * Cuando es verdadero, la barra de navegación debe ocultarse para ofrecer visor inmersivo edge-to-edge.
 */
export function isScannerCameraActive(params: ScannerCameraStateParams): boolean {
  return (
    Boolean(params.isFocused) &&
    !params.hasCapturedPhoto &&
    !params.isIdentifying &&
    !params.hasIdentificationResult &&
    !params.hasErrorMessage &&
    !params.hasMountError &&
    Boolean(params.permissionGranted)
  );
}

export interface TabBarVisibilityParams {
  hideOnKeyboard?: boolean;
  isKeyboardVisible?: boolean;
  isTabBarVisible?: boolean;
  tabBarStyle?: { display?: string } | undefined;
  tabBarVisibleOption?: boolean;
}

/**
 * Determina si la barra de pestañas flotante debe renderizarse o devolver null.
 */
export function shouldRenderFloatingTabBar(params: TabBarVisibilityParams): boolean {
  const hideOnKeyboard = params.hideOnKeyboard ?? true;
  const isKeyboardVisible = params.isKeyboardVisible ?? false;
  const isTabBarVisible = params.isTabBarVisible ?? true;
  const tabBarStyle = params.tabBarStyle;
  const tabBarVisibleOption = params.tabBarVisibleOption;

  if (
    (hideOnKeyboard && isKeyboardVisible) ||
    !isTabBarVisible ||
    tabBarStyle?.display === 'none' ||
    tabBarVisibleOption === false
  ) {
    return false;
  }

  return true;
}
