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

test('W3C WCAG 2.1 algorithm mathematical correctness', () => {
  // 1. Black on white is the absolute maximum contrast ratio (21:1)
  const maxRatio = getContrastRatio('#000000', '#FFFFFF');
  assert.equal(Math.round(maxRatio), 21);

  // 2. Identical colors produce ratio 1:1
  const identityRatio = getContrastRatio('#FFFFFF', '#FFFFFF');
  assert.equal(identityRatio, 1.0);

  // 3. Known WCAG reference pairs
  // #59595E on #FFFFFF produces ~6.96:1 (meets AA >= 4.5:1)
  const refRatio = getContrastRatio('#59595E', '#FFFFFF');
  assert.ok(refRatio >= 6.8 && refRatio <= 7.1, `Expected ~6.96:1, got ${refRatio}`);
  assert.ok(meetsWcagText(refRatio));

  // Relative luminance monotonic ordering: black < dark green < mint < white
  const lBlack = getRelativeLuminance('#000000');
  const lGreen = getRelativeLuminance(colors.light.primary);
  const lMint = getRelativeLuminance(colors.dark.primary);
  const lWhite = getRelativeLuminance('#FFFFFF');

  assert.ok(lBlack < lGreen, 'Black luminance must be < botanical green');
  assert.ok(lGreen < lMint, 'Green luminance must be < dark mode mint');
  assert.ok(lMint < lWhite, 'Mint luminance must be < white');
});

test('Light mode design tokens meet WCAG AA contrast (>= 4.5:1 text, >= 3.0:1 icons)', () => {
  const surfaces = [
    { name: 'surface (#FFFFFF)', hex: colors.light.surface },
    { name: 'background (#F8FAF8)', hex: colors.light.background },
    { name: 'glassFallback (#F4F7F4)', hex: colors.light.glassFallback },
  ];

  for (const s of surfaces) {
    // 1. Text contrast (>= 4.5:1)
    const textPrimaryRatio = getContrastRatio(colors.light.textPrimary, s.hex);
    assert.ok(
      meetsWcagText(textPrimaryRatio),
      `Light textPrimary on ${s.name} ratio ${textPrimaryRatio.toFixed(2)} must be >= ${WCAG_MIN_TEXT_RATIO}:1`
    );
    assert.ok(textPrimaryRatio > 14.0, `Light textPrimary on ${s.name} should have high contrast (>14:1)`);

    const textSecondaryRatio = getContrastRatio(colors.light.textSecondary, s.hex);
    assert.ok(
      meetsWcagText(textSecondaryRatio),
      `Light textSecondary on ${s.name} ratio ${textSecondaryRatio.toFixed(2)} must be >= ${WCAG_MIN_TEXT_RATIO}:1`
    );

    const textTertiaryRatio = getContrastRatio(colors.light.textTertiary, s.hex);
    assert.ok(
      meetsWcagText(textTertiaryRatio),
      `Light textTertiary on ${s.name} ratio ${textTertiaryRatio.toFixed(2)} must be >= ${WCAG_MIN_TEXT_RATIO}:1`
    );

    // 2. Primary / Brand interactive elements and icons (>= 4.5:1)
    const primaryRatio = getContrastRatio(colors.light.primary, s.hex);
    assert.ok(
      meetsWcagText(primaryRatio),
      `Light primary on ${s.name} ratio ${primaryRatio.toFixed(2)} must be >= ${WCAG_MIN_TEXT_RATIO}:1`
    );

    // 3. UI Status icons (>= 3.0:1)
    const successRatio = getContrastRatio(colors.light.success, s.hex);
    assert.ok(
      meetsWcagIcon(successRatio),
      `Light success on ${s.name} ratio ${successRatio.toFixed(2)} must be >= ${WCAG_MIN_UI_ICON_RATIO}:1`
    );

    const errorRatio = getContrastRatio(colors.light.error, s.hex);
    assert.ok(
      meetsWcagIcon(errorRatio),
      `Light error on ${s.name} ratio ${errorRatio.toFixed(2)} must be >= ${WCAG_MIN_UI_ICON_RATIO}:1`
    );

    const warningRatio = getContrastRatio(colors.light.warning, s.hex);
    assert.ok(
      meetsWcagIcon(warningRatio),
      `Light warning on ${s.name} ratio ${warningRatio.toFixed(2)} must be >= ${WCAG_MIN_UI_ICON_RATIO}:1`
    );

    const infoRatio = getContrastRatio(colors.light.info, s.hex);
    assert.ok(
      meetsWcagIcon(infoRatio),
      `Light info on ${s.name} ratio ${infoRatio.toFixed(2)} must be >= ${WCAG_MIN_UI_ICON_RATIO}:1`
    );
  }
});

test('Dark mode design tokens meet WCAG AA contrast (>= 4.5:1 text, >= 3.0:1 icons)', () => {
  const surfaces = [
    { name: 'surface (#161E1A)', hex: colors.dark.surface },
    { name: 'background (#0E1411)', hex: colors.dark.background },
    { name: 'glassFallback (#161E1A)', hex: colors.dark.glassFallback },
  ];

  for (const s of surfaces) {
    // 1. Text contrast (>= 4.5:1)
    const textPrimaryRatio = getContrastRatio(colors.dark.textPrimary, s.hex);
    assert.ok(
      meetsWcagText(textPrimaryRatio),
      `Dark textPrimary on ${s.name} ratio ${textPrimaryRatio.toFixed(2)} must be >= ${WCAG_MIN_TEXT_RATIO}:1`
    );
    assert.ok(textPrimaryRatio > 14.0, `Dark textPrimary on ${s.name} should have high contrast (>14:1)`);

    const textSecondaryRatio = getContrastRatio(colors.dark.textSecondary, s.hex);
    assert.ok(
      meetsWcagText(textSecondaryRatio),
      `Dark textSecondary on ${s.name} ratio ${textSecondaryRatio.toFixed(2)} must be >= ${WCAG_MIN_TEXT_RATIO}:1`
    );

    const textTertiaryRatio = getContrastRatio(colors.dark.textTertiary, s.hex);
    assert.ok(
      meetsWcagText(textTertiaryRatio),
      `Dark textTertiary on ${s.name} ratio ${textTertiaryRatio.toFixed(2)} must be >= ${WCAG_MIN_TEXT_RATIO}:1`
    );

    // 2. Primary / Brand interactive elements and icons (>= 4.5:1)
    const primaryRatio = getContrastRatio(colors.dark.primary, s.hex);
    assert.ok(
      meetsWcagText(primaryRatio),
      `Dark primary on ${s.name} ratio ${primaryRatio.toFixed(2)} must be >= ${WCAG_MIN_TEXT_RATIO}:1`
    );

    // 3. UI Status icons (>= 3.0:1)
    const successRatio = getContrastRatio(colors.dark.success, s.hex);
    assert.ok(
      meetsWcagIcon(successRatio),
      `Dark success on ${s.name} ratio ${successRatio.toFixed(2)} must be >= ${WCAG_MIN_UI_ICON_RATIO}:1`
    );

    const errorRatio = getContrastRatio(colors.dark.error, s.hex);
    assert.ok(
      meetsWcagIcon(errorRatio),
      `Dark error on ${s.name} ratio ${errorRatio.toFixed(2)} must be >= ${WCAG_MIN_UI_ICON_RATIO}:1`
    );

    const warningRatio = getContrastRatio(colors.dark.warning, s.hex);
    assert.ok(
      meetsWcagIcon(warningRatio),
      `Dark warning on ${s.name} ratio ${warningRatio.toFixed(2)} must be >= ${WCAG_MIN_UI_ICON_RATIO}:1`
    );

    const infoRatio = getContrastRatio(colors.dark.info, s.hex);
    assert.ok(
      meetsWcagIcon(infoRatio),
      `Dark info on ${s.name} ratio ${infoRatio.toFixed(2)} must be >= ${WCAG_MIN_UI_ICON_RATIO}:1`
    );
  }
});

test('tone="overlay" (scrim) guarantees >= 4.5:1 contrast against camera and photo glare', () => {
  // Overlay background is rgba(0, 0, 0, 0.55), inside specified 0.45-0.60 range
  const overlayRgba = parseRgba('rgba(0, 0, 0, 0.55)');
  assert.ok(overlayRgba.a >= 0.45 && overlayRgba.a <= 0.60, 'Overlay alpha must be between 0.45 and 0.60');

  // Test across worst-case camera scenarios:
  // 1. Extreme white glare (direct sunlight, white wall, sky #FFFFFF)
  const blendedWhite = blendRgbaOverHex(overlayRgba, '#FFFFFF');
  const whiteTextOnGlareRatio = getContrastRatio('#FFFFFF', blendedWhite);
  assert.ok(
    meetsWcagText(whiteTextOnGlareRatio),
    `White text over overlay with white background glare must be >= 4.5:1 (got ${whiteTextOnGlareRatio.toFixed(2)}:1)`
  );

  // 2. Outdoor botanical foliage (#2E7D32)
  const blendedFoliage = blendRgbaOverHex(overlayRgba, '#2E7D32');
  const whiteTextOnFoliageRatio = getContrastRatio('#FFFFFF', blendedFoliage);
  assert.ok(
    whiteTextOnFoliageRatio >= 10.0,
    `White text over foliage overlay must be high contrast (got ${whiteTextOnFoliageRatio.toFixed(2)}:1)`
  );

  // 3. Dark interior or night camera (#1A201C)
  const blendedDark = blendRgbaOverHex(overlayRgba, '#1A201C');
  const whiteTextOnDarkRatio = getContrastRatio('#FFFFFF', blendedDark);
  assert.ok(
    whiteTextOnDarkRatio >= 15.0,
    `White text over dark camera overlay must be > 15:1 (got ${whiteTextOnDarkRatio.toFixed(2)}:1)`
  );

  // 4. Torch active yellow icon (#FFD54F) on overlay
  const torchRatioOnGlare = getContrastRatio('#FFD54F', blendedWhite);
  assert.ok(
    meetsWcagIcon(torchRatioOnGlare),
    `Torch icon on overlay must meet UI icon contrast >= 3.0:1 (got ${torchRatioOnGlare.toFixed(2)}:1)`
  );
});

test('Normal glass surfaces (tab bar, PrimaryActionBar, Snackbar, FAB) use theme tokens', () => {
  // 1. GlassSurface.tsx contract
  const glassSurfaceCode = fs.readFileSync(path.join(process.cwd(), 'components', 'GlassSurface.tsx'), 'utf-8');
  assert.ok(glassSurfaceCode.includes("tone?: 'default' | 'overlay' | 'scrim'"), 'GlassSurface must declare tone prop');
  assert.ok(glassSurfaceCode.includes('!isOverlay && glass.canUseBlur'), 'GlassSurface must not render BlurView on overlay');
  assert.ok(glassSurfaceCode.includes('rgba(0, 0, 0, 0.55)'), 'GlassSurface must use dark background for overlay');
  assert.ok(glassSurfaceCode.includes('rgba(255, 255, 255, 0.20)'), 'GlassSurface must use 20% white border for overlay');

  // 2. Snackbar.tsx contract: no hardcoded #FFFFFF for text/icons
  const snackbarCode = fs.readFileSync(path.join(process.cwd(), 'components', 'Snackbar.tsx'), 'utf-8');
  assert.ok(!snackbarCode.includes("color: '#FFFFFF'"), 'Snackbar must not use hardcoded #FFFFFF for text');
  assert.ok(!snackbarCode.includes("color: '#81C784'"), 'Snackbar must not use hardcoded #81C784 for action text');
  assert.ok(snackbarCode.includes('colors.textPrimary'), 'Snackbar must use colors.textPrimary');
  assert.ok(snackbarCode.includes('colors.primary'), 'Snackbar action must use colors.primary');
  assert.ok(snackbarCode.includes('iconColor ='), 'Snackbar must dynamically compute iconColor from theme tokens');

  // 3. ScannerScreen.tsx uses tone="overlay"
  const scannerCode = fs.readFileSync(path.join(process.cwd(), 'screens', 'ScannerScreen.tsx'), 'utf-8');
  assert.ok(scannerCode.includes('tone="overlay"'), 'ScannerScreen must use tone="overlay" for camera controls');
  assert.ok(scannerCode.includes('variant="strong"'), 'ScannerScreen maintains variant="strong"');

  // 4. PlantDetailScreen.tsx uses tone="overlay"
  const detailCode = fs.readFileSync(path.join(process.cwd(), 'screens', 'PlantDetailScreen.tsx'), 'utf-8');
  assert.ok(detailCode.includes('tone="overlay"'), 'PlantDetailScreen must use tone="overlay" for hero photo controls');

  // 5. Normal glass blended contrast check:
  // Light strong glass fill (rgba(255, 255, 255, 0.88)) over background #F8FAF8
  const lightGlassStrongRgba = parseRgba('rgba(255, 255, 255, 0.88)');
  const lightBlendedGlass = blendRgbaOverHex(lightGlassStrongRgba, colors.light.background);
  const lightGlassTextRatio = getContrastRatio(colors.light.textPrimary, lightBlendedGlass);
  const lightGlassBrandRatio = getContrastRatio(colors.light.primary, lightBlendedGlass);
  assert.ok(meetsWcagText(lightGlassTextRatio), `Light glass textPrimary ratio ${lightGlassTextRatio.toFixed(2)} must be >= 4.5:1`);
  assert.ok(meetsWcagText(lightGlassBrandRatio), `Light glass brand primary ratio ${lightGlassBrandRatio.toFixed(2)} must be >= 4.5:1`);

  // Dark strong glass fill (rgba(26, 36, 31, 0.88)) over background #0E1411
  const darkGlassStrongRgba = parseRgba('rgba(26, 36, 31, 0.88)');
  const darkBlendedGlass = blendRgbaOverHex(darkGlassStrongRgba, colors.dark.background);
  const darkGlassTextRatio = getContrastRatio(colors.dark.textPrimary, darkBlendedGlass);
  const darkGlassBrandRatio = getContrastRatio(colors.dark.primary, darkBlendedGlass);
  assert.ok(meetsWcagText(darkGlassTextRatio), `Dark glass textPrimary ratio ${darkGlassTextRatio.toFixed(2)} must be >= 4.5:1`);
  assert.ok(meetsWcagText(darkGlassBrandRatio), `Dark glass brand primary ratio ${darkGlassBrandRatio.toFixed(2)} must be >= 4.5:1`);
});
