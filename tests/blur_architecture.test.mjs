import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('FASE D.1 & D.2: GlassBackground structure and per-screen blur target architecture', () => {
  const bgPath = path.join(process.cwd(), 'components', 'GlassBackground.tsx');
  assert.ok(fs.existsSync(bgPath), 'GlassBackground.tsx must exist');

  const bgCode = fs.readFileSync(bgPath, 'utf-8');
  assert.ok(bgCode.includes('BlurTargetView'), 'GlassBackground must include BlurTargetView');
  assert.ok(bgCode.includes('LinearGradient'), 'GlassBackground must render LinearGradient inside BlurTargetView');
  assert.ok(bgCode.includes('softShapeTop'), 'GlassBackground must render soft organic shape inside BlurTargetView');
  assert.ok(bgCode.includes('softShapeBottom'), 'GlassBackground must render soft organic shape inside BlurTargetView');
  assert.ok(bgCode.includes('contentContainer'), 'GlassBackground must render children in contentContainer outside BlurTargetView');

  // Verify BlurTargetView does NOT wrap children (they must be siblings)
  const targetViewCloseIndex = bgCode.indexOf('</BlurTargetView>');
  const childrenIndex = bgCode.indexOf('{children}');
  assert.ok(targetViewCloseIndex !== -1, 'BlurTargetView must close before contentContainer');
  assert.ok(childrenIndex > targetViewCloseIndex, 'Children must be rendered after and OUTSIDE BlurTargetView');

  // Verify ActiveBlurTargetContext registration
  assert.ok(bgCode.includes('useActiveBlurTarget'), 'GlassBackground must register with useActiveBlurTarget');
  assert.ok(bgCode.includes('setActiveBlurTargetRef'), 'GlassBackground must set active target ref when focused');

  // Verify AppNavigator eliminated shared tabBlurTargetRef
  const navPath = path.join(process.cwd(), 'navigation', 'AppNavigator.tsx');
  const navCode = fs.readFileSync(navPath, 'utf-8');
  assert.ok(!navCode.includes('tabBlurTargetRef'), 'AppNavigator must eliminate shared tabBlurTargetRef');
  assert.ok(!navCode.includes('<BlurTargetContext.Provider value={tabBlurTargetRef}>'), 'AppNavigator must not wrap tabs in static target');
  assert.ok(navCode.includes('useActiveBlurTarget'), 'AppNavigator must import useActiveBlurTarget');
  assert.ok(navCode.includes('blurTarget={activeBlurTargetRef ?? undefined}'), 'FloatingGlassTabBar must bind activeBlurTargetRef');
});

test('FASE D.3: Surfaces without target use scrim / fallback and never mount BlurView', () => {
  // 1. BottomSheet backdrop must not mount BlurView and must use 40-50% scrim
  const sheetPath = path.join(process.cwd(), 'components', 'BottomSheet.tsx');
  const sheetCode = fs.readFileSync(sheetPath, 'utf-8');
  assert.ok(!sheetCode.includes('<BlurView'), 'BottomSheet backdrop must NOT mount BlurView inside Modal window');
  assert.ok(sheetCode.includes("backgroundColor: 'rgba(0, 0, 0, 0.45)'"), 'BottomSheet backdrop must use 45% black scrim');

  // 2. Snackbar must set forceFallback
  const snackbarPath = path.join(process.cwd(), 'components', 'Snackbar.tsx');
  const snackbarCode = fs.readFileSync(snackbarPath, 'utf-8');
  assert.ok(snackbarCode.includes('forceFallback'), 'Snackbar must set forceFallback because it is outside screen target');

  // 3. GlassSurface must guard Android against missing blurTarget
  const surfacePath = path.join(process.cwd(), 'components', 'GlassSurface.tsx');
  const surfaceCode = fs.readFileSync(surfacePath, 'utf-8');
  assert.ok(surfaceCode.includes('hasValidTarget'), 'GlassSurface must check hasValidTarget for Android');
  assert.ok(surfaceCode.includes('canMountBlur'), 'GlassSurface must only mount BlurView when target is valid and not fallback');
});

test('FASE D.4: Real GlassBackground deployed across core and stack screens', () => {
  const screens = [
    'TodayScreen.tsx',
    'GardenScreen.tsx',
    'ExploreScreen.tsx',
    'ProfileScreen.tsx',
    'CareCalendarScreen.tsx',
    'EncyclopediaScreen.tsx',
    'AssistantScreen.tsx',
    'SettingsScreen.tsx',
    'AchievementsScreen.tsx',
  ];

  for (const screenName of screens) {
    const screenPath = path.join(process.cwd(), 'screens', screenName);
    assert.ok(fs.existsSync(screenPath), `${screenName} must exist`);
    const code = fs.readFileSync(screenPath, 'utf-8');
    assert.ok(code.includes('GlassBackground'), `${screenName} must use GlassBackground`);
    assert.ok(code.includes('<GlassBackground'), `${screenName} must render <GlassBackground`);
  }
});

test('FASE D.5 & D.6: GlassSurface single tint layer, calibrated Android reduction, and fallback safety', () => {
  const surfacePath = path.join(process.cwd(), 'components', 'GlassSurface.tsx');
  const surfaceCode = fs.readFileSync(surfacePath, 'utf-8');

  // Single tint layer: outer container is transparent when blurring, no stacked solid fill
  assert.ok(surfaceCode.includes("canMountBlur") && surfaceCode.includes("? 'transparent'") && surfaceCode.includes("glass.fallbackColor"), 'GlassSurface must use transparent base when blurring');
  assert.ok(surfaceCode.includes('defaultTintOverlay'), 'GlassSurface retains single tint overlay for WCAG AA');
  assert.ok(surfaceCode.includes('blurReductionFactor={Platform.OS === \'android\' ? 4 : undefined}'), 'GlassSurface calibrates blurReductionFactor on Android');
  assert.ok(surfaceCode.includes('fallbackColor'), 'GlassSurface maintains fallbackColor for Android < 12 and Easy Mode');

  // useGlass hook enforces M3 zero-blur policy for maximum 60-120 FPS Android performance
  const useGlassPath = path.join(process.cwd(), 'theme', 'useGlass.ts');
  const useGlassCode = fs.readFileSync(useGlassPath, 'utf-8');
  assert.ok(useGlassCode.includes('canUseBlur = false'), 'useGlass disables blur globally for M3 tonal elevation');
  assert.ok(useGlassCode.includes('intensity = 0'), 'useGlass sets intensity to 0');
  assert.ok(useGlassCode.includes('fallbackColor:'), 'useGlass provides M3 tonal fallback');
});
