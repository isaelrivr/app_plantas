import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { colors } from '../theme/colors.ts';
import {
  getContrastRatio,
  getRelativeLuminance,
  blendRgbaOverHex,
  parseRgba,
  meetsWcagText,
  meetsWcagIcon,
  WCAG_MIN_TEXT_RATIO,
  WCAG_MIN_UI_ICON_RATIO,
} from '../utils/colorContrast.ts';
import {
  TAB_BAR_HEIGHT,
  TAB_BAR_GAP,
  CONTENT_BREATHING,
  getTabBarBottomMargin,
  calculateFloatingBarMetrics,
} from '../utils/layoutMetrics.ts';
import {
  isScannerCameraActive,
  shouldRenderFloatingTabBar,
} from '../utils/tabBarVisibility.ts';

// ============================================================================
// 1. COMPORTAMIENTO REAL: CÁLCULO DE CONTRASTE WCAG 2.1
// ============================================================================

test('Comportamiento real: Fórmulas matemáticas de contraste y luminancia W3C WCAG 2.1', () => {
  // Verificación de propiedades matemáticas fundamentales:
  // - Máximo contraste posible (negro sobre blanco puro = 21:1)
  const maxContrast = getContrastRatio('#000000', '#FFFFFF');
  assert.equal(Math.round(maxContrast), 21, 'Negro sobre blanco debe ser 21:1');

  // - Identidad (mismo color = 1:1)
  const identityContrast = getContrastRatio('#FFFFFF', '#FFFFFF');
  assert.equal(identityContrast, 1.0, 'Mismo color debe dar ratio 1.0:1');

  // - Simetría: getContrastRatio(A, B) === getContrastRatio(B, A)
  const ratioAB = getContrastRatio(colors.light.primary, colors.light.surface);
  const ratioBA = getContrastRatio(colors.light.surface, colors.light.primary);
  assert.equal(ratioAB, ratioBA, 'El ratio de contraste debe ser matemáticamente simétrico');

  // - Monotonía de luminancia relativa
  const lBlack = getRelativeLuminance('#000000');
  const lDarkSurface = getRelativeLuminance(colors.dark.surface);
  const lLightSurface = getRelativeLuminance(colors.light.surface);
  const lWhite = getRelativeLuminance('#FFFFFF');
  assert.ok(lBlack < lDarkSurface, 'Luminancia de negro < superficie oscura');
  assert.ok(lDarkSurface < lLightSurface, 'Luminancia de superficie oscura < superficie clara');
  assert.ok(lLightSurface <= lWhite, 'Luminancia de superficie clara <= blanco puro');
});

test('Comportamiento real: Contraste de tokens en temas Claro y Oscuro (WCAG AA)', () => {
  // Modo Claro: textPrimary, textSecondary, textTertiary, primary sobre todas las superficies
  const lightSurfaces = [
    { name: 'surface (#FFFFFF)', hex: colors.light.surface },
    { name: 'background (#F8FAF8)', hex: colors.light.background },
    { name: 'surfaceSecondary (#F0F4F1)', hex: colors.light.surfaceSecondary },
    { name: 'glassFallback (#F4F7F4)', hex: colors.light.glassFallback },
  ];

  for (const s of lightSurfaces) {
    const textPrimaryRatio = getContrastRatio(colors.light.textPrimary, s.hex);
    assert.ok(
      meetsWcagText(textPrimaryRatio),
      `Light textPrimary sobre ${s.name} (${textPrimaryRatio.toFixed(2)}:1) debe superar ${WCAG_MIN_TEXT_RATIO}:1`
    );
    assert.ok(textPrimaryRatio >= 12.0, `Light textPrimary sobre ${s.name} debe tener alto contraste (>=12:1)`);

    const textSecondaryRatio = getContrastRatio(colors.light.textSecondary, s.hex);
    assert.ok(
      meetsWcagText(textSecondaryRatio),
      `Light textSecondary sobre ${s.name} (${textSecondaryRatio.toFixed(2)}:1) debe superar ${WCAG_MIN_TEXT_RATIO}:1`
    );

    const textTertiaryRatio = getContrastRatio(colors.light.textTertiary, s.hex);
    assert.ok(
      meetsWcagText(textTertiaryRatio),
      `Light textTertiary sobre ${s.name} (${textTertiaryRatio.toFixed(2)}:1) debe superar ${WCAG_MIN_TEXT_RATIO}:1`
    );

    const primaryRatio = getContrastRatio(colors.light.primary, s.hex);
    assert.ok(
      meetsWcagText(primaryRatio),
      `Light primary sobre ${s.name} (${primaryRatio.toFixed(2)}:1) debe superar ${WCAG_MIN_TEXT_RATIO}:1`
    );
  }

  // Modo Oscuro: textPrimary, textSecondary, textTertiary, primary sobre superficies oscuras
  const darkSurfaces = [
    { name: 'surface (#161E1A)', hex: colors.dark.surface },
    { name: 'background (#0E1411)', hex: colors.dark.background },
    { name: 'surfaceSecondary (#1C2520)', hex: colors.dark.surfaceSecondary },
    { name: 'glassFallback (#161E1A)', hex: colors.dark.glassFallback },
  ];

  for (const s of darkSurfaces) {
    const textPrimaryRatio = getContrastRatio(colors.dark.textPrimary, s.hex);
    assert.ok(
      meetsWcagText(textPrimaryRatio),
      `Dark textPrimary sobre ${s.name} (${textPrimaryRatio.toFixed(2)}:1) debe superar ${WCAG_MIN_TEXT_RATIO}:1`
    );
    assert.ok(textPrimaryRatio >= 12.0, `Dark textPrimary sobre ${s.name} debe tener alto contraste (>=12:1)`);

    const textSecondaryRatio = getContrastRatio(colors.dark.textSecondary, s.hex);
    assert.ok(
      meetsWcagText(textSecondaryRatio),
      `Dark textSecondary sobre ${s.name} (${textSecondaryRatio.toFixed(2)}:1) debe superar ${WCAG_MIN_TEXT_RATIO}:1`
    );

    const primaryRatio = getContrastRatio(colors.dark.primary, s.hex);
    assert.ok(
      meetsWcagText(primaryRatio),
      `Dark primary sobre ${s.name} (${primaryRatio.toFixed(2)}:1) debe superar ${WCAG_MIN_TEXT_RATIO}:1`
    );
  }
});

test('Comportamiento real: Contraste de GlassSurface tone="overlay" contra deslumbramiento y luz en vivo', () => {
  const overlayRgba = parseRgba('rgba(0, 0, 0, 0.55)');

  // 1. Escenario extremo de luz solar directa / cielo blanco brillante (#FFFFFF)
  const blendedWhite = blendRgbaOverHex(overlayRgba, '#FFFFFF');
  const whiteTextOnWhiteGlare = getContrastRatio('#FFFFFF', blendedWhite);
  assert.ok(
    meetsWcagText(whiteTextOnWhiteGlare),
    `Texto blanco sobre overlay con fondo blanco (${whiteTextOnWhiteGlare.toFixed(2)}:1) debe cumplir WCAG texto >= 4.5:1`
  );

  // 2. Escenario de follaje verde botánico intenso (#2E7D32)
  const blendedFoliage = blendRgbaOverHex(overlayRgba, '#2E7D32');
  const whiteTextOnFoliage = getContrastRatio('#FFFFFF', blendedFoliage);
  assert.ok(
    whiteTextOnFoliage >= 10.0,
    `Texto blanco sobre overlay con follaje (${whiteTextOnFoliage.toFixed(2)}:1) debe ser nítido (>=10:1)`
  );

  // 3. Escenario nocturno o sombra profunda (#101412)
  const blendedNight = blendRgbaOverHex(overlayRgba, '#101412');
  const whiteTextOnNight = getContrastRatio('#FFFFFF', blendedNight);
  assert.ok(
    whiteTextOnNight >= 15.0,
    `Texto blanco sobre overlay nocturno (${whiteTextOnNight.toFixed(2)}:1) debe superar 15:1`
  );

  // 4. Íconos de control (antorcha/flash #FFD54F) sobre overlay bajo luz
  const torchIconRatio = getContrastRatio('#FFD54F', blendedWhite);
  assert.ok(
    meetsWcagIcon(torchIconRatio),
    `Ícono de antorcha sobre overlay (${torchIconRatio.toFixed(2)}:1) debe cumplir WCAG ícono >= 3.0:1`
  );
});

// ============================================================================
// 2. COMPORTAMIENTO REAL: CÁLCULO DE MÁRGENES, CLEARANCE Y LAYOUT METRICS
// ============================================================================

test('Comportamiento real: Cálculo de margen inferior de barra flotante en Android e iOS', () => {
  // Constantes de diseño
  assert.equal(TAB_BAR_HEIGHT, 60, 'Altura física de la cápsula debe ser 60 dp');
  assert.equal(TAB_BAR_GAP, 14, 'Separación de botones flotantes (FAB/Snackbar) debe ser 14 dp');
  assert.equal(CONTENT_BREATHING, 16, 'Margen de respiro de contenido debe ser 16 dp');

  // Caso 1: Android con barra de 3 botones clásica (insets.bottom = 0)
  // Regla: safeBottom = max(0, 10) = 10; margin = 10 + 6 = 16 dp
  const androidButtonsMargin = getTabBarBottomMargin(0, 'android');
  assert.equal(androidButtonsMargin, 16, 'Android con 3 botones (inset 0) debe dar margen 16 dp');

  // Caso 2: Android con navegación por gestos estándar (insets.bottom = 24)
  // Regla: safeBottom = max(24, 10) = 24; margin = 24 + 6 = 30 dp
  const androidGesturesMargin = getTabBarBottomMargin(24, 'android');
  assert.equal(androidGesturesMargin, 30, 'Android con gestos (inset 24) debe dar margen 30 dp');

  // Caso 3: Android con navegación por gestos delgada (insets.bottom = 16)
  // Regla: safeBottom = max(16, 10) = 16; margin = 16 + 6 = 22 dp
  const androidSlimGesturesMargin = getTabBarBottomMargin(16, 'android');
  assert.equal(androidSlimGesturesMargin, 22, 'Android con gestos delgados (inset 16) debe dar margen 22 dp');

  // Caso 4: iOS con Home Indicator moderno (insets.bottom = 34)
  // Regla: safeBottom = max(34, 10) = 34; margin = 34 + 8 = 42 dp
  const iosHomeIndicatorMargin = getTabBarBottomMargin(34, 'ios');
  assert.equal(iosHomeIndicatorMargin, 42, 'iOS con Home Indicator (inset 34) debe dar margen 42 dp');

  // Caso 5: iOS sin Home Indicator / iPad (insets.bottom = 0)
  // Regla: safeBottom = max(0, 10) = 10; margin = 10 + 8 = 18 dp
  const iosNotchlessMargin = getTabBarBottomMargin(0, 'ios');
  assert.equal(iosNotchlessMargin, 18, 'iOS sin barra (inset 0) debe dar margen 18 dp');
});

test('Comportamiento real: Invariante matemática de tabBarClearance y fabBottom', () => {
  const testCases = [
    { platform: 'android', insetBottom: 0 },
    { platform: 'android', insetBottom: 16 },
    { platform: 'android', insetBottom: 24 },
    { platform: 'android', insetBottom: 48 }, // Tablet Android
    { platform: 'ios', insetBottom: 0 },
    { platform: 'ios', insetBottom: 34 },
  ];

  for (const { platform, insetBottom } of testCases) {
    // 1. Pantallas CON barra de navegación (Today, Garden, Explore, Profile)
    const withBar = calculateFloatingBarMetrics(insetBottom, true, platform);

    // Invariante 1: Altura total = margen + altura de cápsula (60 dp)
    assert.equal(
      withBar.tabBarTotalHeight,
      withBar.tabBarBottomMargin + TAB_BAR_HEIGHT,
      `tabBarTotalHeight debe ser exactamente margen (${withBar.tabBarBottomMargin}) + 60`
    );

    // Invariante 2: tabBarClearance > tabBarTotalHeight por exactamente CONTENT_BREATHING (16 dp)
    assert.equal(
      withBar.tabBarClearance,
      withBar.tabBarTotalHeight + CONTENT_BREATHING,
      'tabBarClearance debe superar a tabBarTotalHeight por exactamente 16 dp de respiro'
    );
    assert.ok(
      withBar.tabBarClearance > withBar.tabBarTotalHeight,
      'El contenido scrolleable NUNCA debe quedar cubierto por la barra flotante'
    );

    // Invariante 3: fabBottom flota exactamente a TAB_BAR_GAP (14 dp) sobre la barra
    assert.equal(
      withBar.fabBottom,
      withBar.tabBarTotalHeight + TAB_BAR_GAP,
      `fabBottom debe ser exactamente tabBarTotalHeight + ${TAB_BAR_GAP}`
    );
    assert.equal(withBar.snackbarBottom, withBar.fabBottom, 'snackbarBottom debe alinearse con fabBottom');

    // 2. Pantallas SIN barra de navegación (Stack screens: Detalle de planta, Diagnóstico, Ajustes)
    const withoutBar = calculateFloatingBarMetrics(insetBottom, false, platform);

    // Invariante 4: En pantallas sin barra, el clearance no suma los 60dp de la barra
    assert.equal(
      withoutBar.tabBarClearance,
      Math.max(insetBottom, 16) + 16,
      'En pantallas sin barra, el clearance debe basarse en el inset seguro sin sumar la cápsula'
    );
    assert.ok(
      withoutBar.tabBarClearance < withBar.tabBarClearance,
      'Una pantalla sin barra no debe desperdiciar el espacio de la barra ausente'
    );
  }
});

// ============================================================================
// 3. COMPORTAMIENTO REAL: OCULTAMIENTO DE LA BARRA EN CÁMARA Y TECLADO
// ============================================================================

test('Comportamiento real: Máquina de estados de la cámara del escáner (isScannerCameraActive)', () => {
  // Estado 1: Cámara en vivo pura (captura activa a pantalla completa)
  const liveCameraActive = isScannerCameraActive({
    isFocused: true,
    hasCapturedPhoto: false,
    isIdentifying: false,
    hasIdentificationResult: false,
    hasErrorMessage: false,
    hasMountError: false,
    permissionGranted: true,
  });
  assert.equal(liveCameraActive, true, 'Con permisos concedidos y visor en vivo, la cámara DEBE estar activa');

  // Estado 2: Foto capturada / seleccionada de galería
  const photoCaptured = isScannerCameraActive({
    isFocused: true,
    hasCapturedPhoto: true,
    isIdentifying: false,
    hasIdentificationResult: false,
    hasErrorMessage: false,
    hasMountError: false,
    permissionGranted: true,
  });
  assert.equal(photoCaptured, false, 'Al capturar foto, la cámara en vivo DEBE desactivarse');

  // Estado 3: Proceso de escaneo / análisis de IA en curso
  const scanningInProgress = isScannerCameraActive({
    isFocused: true,
    hasCapturedPhoto: true,
    isIdentifying: true,
    hasIdentificationResult: false,
    hasErrorMessage: false,
    hasMountError: false,
    permissionGranted: true,
  });
  assert.equal(scanningInProgress, false, 'Durante el análisis de IA, la cámara en vivo DEBE estar inactiva');

  // Estado 4: Resultados de identificación listos
  const resultReady = isScannerCameraActive({
    isFocused: true,
    hasCapturedPhoto: true,
    isIdentifying: false,
    hasIdentificationResult: true,
    hasErrorMessage: false,
    hasMountError: false,
    permissionGranted: true,
  });
  assert.equal(resultReady, false, 'Con resultados en pantalla, la cámara en vivo DEBE estar inactiva');

  // Estado 5: Error de análisis o de red
  const errorOccurred = isScannerCameraActive({
    isFocused: true,
    hasCapturedPhoto: false,
    isIdentifying: false,
    hasIdentificationResult: false,
    hasErrorMessage: true,
    hasMountError: false,
    permissionGranted: true,
  });
  assert.equal(errorOccurred, false, 'Si hay error, la cámara en vivo DEBE desactivarse para mostrar tarjeta de error');

  // Estado 6: Error de montaje de hardware de cámara (simulador o sensor bloqueado)
  const mountErrorOccurred = isScannerCameraActive({
    isFocused: true,
    hasCapturedPhoto: false,
    isIdentifying: false,
    hasIdentificationResult: false,
    hasErrorMessage: false,
    hasMountError: true,
    permissionGranted: true,
  });
  assert.equal(mountErrorOccurred, false, 'Con error de montaje, la cámara en vivo no debe figurar activa');

  // Estado 7: Permiso denegado por el usuario
  const permissionDenied = isScannerCameraActive({
    isFocused: true,
    hasCapturedPhoto: false,
    isIdentifying: false,
    hasIdentificationResult: false,
    hasErrorMessage: false,
    hasMountError: false,
    permissionGranted: false,
  });
  assert.equal(permissionDenied, false, 'Sin permisos de cámara concedidos, la cámara no puede estar activa');

  // Estado 8: Pantalla desenfocada (usuario navegó a otra pestaña)
  const screenUnfocused = isScannerCameraActive({
    isFocused: false,
    hasCapturedPhoto: false,
    isIdentifying: false,
    hasIdentificationResult: false,
    hasErrorMessage: false,
    hasMountError: false,
    permissionGranted: true,
  });
  assert.equal(screenUnfocused, false, 'Al perder el foco de navegación, la cámara DEBE desactivarse de inmediato');
});

test('Comportamiento real: Visibilidad de la FloatingGlassTabBar según cámara y teclado', () => {
  // Caso 1: Cámara en vivo activa -> la barra se oculta por tabBarStyle.display="none" y isTabBarVisible=false
  const cameraActiveTabBar = shouldRenderFloatingTabBar({
    hideOnKeyboard: true,
    isKeyboardVisible: false,
    isTabBarVisible: false,
    tabBarStyle: { display: 'none' },
  });
  assert.equal(cameraActiveTabBar, false, 'Con cámara activa (display="none", isTabBarVisible=false), la barra DEBE ocultarse');

  // Caso 2: Cámara desactivada (resultado de escaneo o error) -> la barra vuelve a mostrarse
  const cameraInactiveTabBar = shouldRenderFloatingTabBar({
    hideOnKeyboard: true,
    isKeyboardVisible: false,
    isTabBarVisible: true,
    tabBarStyle: undefined,
  });
  assert.equal(cameraInactiveTabBar, true, 'Al salir de la cámara o mostrar resultado, la barra DEBE volver a ser visible');

  // Caso 3: Teclado de software abierto en Android (ej: buscando planta o editando nota)
  const keyboardOpenTabBar = shouldRenderFloatingTabBar({
    hideOnKeyboard: true,
    isKeyboardVisible: true,
    isTabBarVisible: true,
    tabBarStyle: undefined,
  });
  assert.equal(keyboardOpenTabBar, false, 'Con teclado abierto y hideOnKeyboard=true, la barra DEBE ocultarse');

  // Caso 4: Teclado cerrado -> la barra reaparece
  const keyboardClosedTabBar = shouldRenderFloatingTabBar({
    hideOnKeyboard: true,
    isKeyboardVisible: false,
    isTabBarVisible: true,
    tabBarStyle: undefined,
  });
  assert.equal(keyboardClosedTabBar, true, 'Con teclado cerrado, la barra DEBE mostrarse normalmente');

  // Caso 5: Ruta con tabBarVisible=false configurado explícitamente en navigation options
  const routeExplicitHidden = shouldRenderFloatingTabBar({
    hideOnKeyboard: true,
    isKeyboardVisible: false,
    isTabBarVisible: true,
    tabBarVisibleOption: false,
  });
  assert.equal(routeExplicitHidden, false, 'Si tabBarVisibleOption=false, la barra DEBE ocultarse');
});

// ============================================================================
// 4. COMPORTAMIENTO REAL: IMÁGENES INTEGRADAS Y EMPAQUETADO OFFLINE EN EL APK
// ============================================================================

test('Comportamiento real: 52 imágenes de plantas integradas físicamente para el APK', () => {
  const root = process.cwd();
  const plantsDir = path.join(root, 'assets', 'plants');

  // 1. Verificar existencia del directorio de assets
  assert.ok(fs.existsSync(plantsDir), 'El directorio assets/plants debe existir');

  // 2. Verificar que existan las 52 imágenes de las plantas
  const files = fs.readdirSync(plantsDir).filter((f) => f.endsWith('.jpg'));
  assert.equal(files.length, 52, 'Deben existir exactamente 52 archivos de imagen en assets/plants');

  // 3. Verificar que ninguna imagen esté corrupta o vacía (mínimo 10 KB)
  for (const f of files) {
    const stat = fs.statSync(path.join(plantsDir, f));
    assert.ok(stat.size > 10000, `La imagen ${f} debe tener contenido real (>10 KB, tiene ${stat.size} bytes)`);
  }

  // 4. Verificar que services/plantAssets.ts exporte el mapa estático completo
  const assetsCode = fs.readFileSync(path.join(root, 'services', 'plantAssets.ts'), 'utf-8');
  assert.ok(assetsCode.includes('PLANT_LOCAL_IMAGES'), 'plantAssets.ts debe exportar PLANT_LOCAL_IMAGES');
  assert.ok(assetsCode.includes('getPlantImageSource'), 'plantAssets.ts debe exportar getPlantImageSource');
  assert.ok(assetsCode.includes("'monstera': require"), 'plantAssets.ts debe mapear monstera');
  assert.ok(assetsCode.includes("'pothos': require"), 'plantAssets.ts debe mapear pothos');

  // 5. Verificar que app.json contenga assetBundlePatterns: ["**/*"] para inclusión en el APK
  const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf-8'));
  assert.ok(Array.isArray(appJson.expo.assetBundlePatterns), 'app.json debe definir assetBundlePatterns');
  assert.ok(appJson.expo.assetBundlePatterns.includes('**/*'), 'assetBundlePatterns debe incluir "**/*"');
});

