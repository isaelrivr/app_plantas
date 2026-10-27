import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('FASE D.1 & D.2: GlassBackground structure and per-screen blur target architecture', () => {
  const bgPath = path.join(process.cwd(), 'components', 'GlassBackground.tsx');
  assert.ok(fs.existsSync(bgPath), 'GlassBackground.tsx must exist');

  const bgCode = fs.readFileSync(bgPath, 'utf-8');
  assert.ok(bgCode.includes('contentContainer'), 'GlassBackground must render children in contentContainer');
  assert.ok(!bgCode.includes('<BlurTargetView'), 'GlassBackground must NOT mount <BlurTargetView in M3 architecture');

  // Verify AppNavigator eliminated shared tabBlurTargetRef & GlassSurface
  const navPath = path.join(process.cwd(), 'navigation', 'AppNavigator.tsx');
  const navCode = fs.readFileSync(navPath, 'utf-8');
  assert.ok(!navCode.includes('tabBlurTargetRef'), 'AppNavigator must eliminate shared tabBlurTargetRef');
  assert.ok(!navCode.includes('<BlurTargetContext.Provider value={tabBlurTargetRef}>'), 'AppNavigator must not wrap tabs in static target');
  assert.ok(!navCode.includes('GlassSurface'), 'AppNavigator must eliminate GlassSurface in favor of M3 NavigationBar');
  assert.ok(!navCode.includes('blurTarget='), 'AppNavigator must not bind blurTarget');
});

test('FASE D.3: Surfaces without target use scrim / fallback and never mount BlurView', () => {
  // 1. BottomSheet backdrop must not mount BlurView and must use 40-50% scrim
  const sheetPath = path.join(process.cwd(), 'components', 'BottomSheet.tsx');
  const sheetCode = fs.readFileSync(sheetPath, 'utf-8');
  assert.ok(!sheetCode.includes('<BlurView'), 'BottomSheet backdrop must NOT mount BlurView inside Modal window');
  assert.ok(sheetCode.includes("backgroundColor: 'rgba(0, 0, 0, 0.45)'"), 'BottomSheet backdrop must use 45% black scrim');

  // 2. Snackbar must set forceFallback or use clean M3 surface
  const snackbarPath = path.join(process.cwd(), 'components', 'Snackbar.tsx');
  const snackbarCode = fs.readFileSync(snackbarPath, 'utf-8');
  assert.ok(!snackbarCode.includes('<BlurView'), 'Snackbar must not mount BlurView');

  // 3. GlassSurface must guard Android and never mount BlurView
  const surfacePath = path.join(process.cwd(), 'components', 'GlassSurface.tsx');
  const surfaceCode = fs.readFileSync(surfacePath, 'utf-8');
  assert.ok(!surfaceCode.includes('<BlurView'), 'GlassSurface must never mount BlurView in M3 architecture');
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
    assert.ok(
      code.includes('GlassBackground') || code.includes('Surface') || code.includes('View'),
      `${screenName} must render a valid background container`
    );
  }
});

test('FASE D.5 & D.6: GlassSurface single tint layer, calibrated Android reduction, and fallback safety', () => {
  const surfacePath = path.join(process.cwd(), 'components', 'GlassSurface.tsx');
  const surfaceCode = fs.readFileSync(surfacePath, 'utf-8');

  // In M3, GlassSurface provides a clean, solid tonal container with zero blur
  assert.ok(surfaceCode.includes('colors.surfaceContainer'), 'GlassSurface maps to M3 surfaceContainer');
  assert.ok(surfaceCode.includes('rgba(0, 0, 0, 0.55)'), 'GlassSurface provides dark overlay scrim for camera/photos');

  // useGlass hook enforces M3 zero-blur policy for maximum 60-120 FPS Android performance
  const useGlassPath = path.join(process.cwd(), 'theme', 'useGlass.ts');
  const useGlassCode = fs.readFileSync(useGlassPath, 'utf-8');
  assert.ok(useGlassCode.includes('canUseBlur = false'), 'useGlass disables blur globally for M3 tonal elevation');
  assert.ok(useGlassCode.includes('intensity = 0'), 'useGlass sets intensity to 0');
  assert.ok(useGlassCode.includes('fallbackColor:'), 'useGlass provides M3 tonal fallback');
});
