import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import spanishOnboarding from '../i18n/fragments/onboarding.ts';
import spanishGarden from '../i18n/fragments/garden.ts';
import { normalizeDiacritics } from '../utils/textUtils.ts';
import { colors, BRAND_COLOR } from '../theme/colors.ts';
import { layout } from '../theme/spacing.ts';
import { typography, fontWeights, FONT_FAMILY, material3Scale } from '../theme/typography.ts';

test('normalizeDiacritics strips accents and lowercases correctly', () => {
  assert.equal(normalizeDiacritics('Árbol'), 'arbol');
  assert.equal(normalizeDiacritics('Cáñamo'), 'canamo');
  assert.equal(normalizeDiacritics('Monstéra Deliciosa'), 'monstera deliciosa');
  assert.equal(normalizeDiacritics('Ficus Elástica'), 'ficus elastica');
  assert.equal(normalizeDiacritics('Cactus'), 'cactus');
  assert.equal(normalizeDiacritics(''), '');
});

test('diacritic-insensitive matching finds plants regardless of user typing accents', () => {
  const catalog = [
    { name: 'Monstera Deliciosa', scientificName: 'Monstera deliciosa', family: 'Araceae' },
    { name: 'Árbol de Jade', scientificName: 'Crassula ovata', family: 'Crassulaceae' },
    { name: 'Ficus Elástica', scientificName: 'Ficus elastica', family: 'Moraceae' },
  ];

  const search = (query) => {
    const q = normalizeDiacritics(query.trim());
    return catalog.filter(
      (p) =>
        normalizeDiacritics(p.name).includes(q) ||
        normalizeDiacritics(p.scientificName).includes(q) ||
        normalizeDiacritics(p.family).includes(q)
    );
  };

  // Searching 'arbol' finds 'Árbol de Jade'
  assert.equal(search('arbol').length, 1);
  assert.equal(search('arbol')[0].name, 'Árbol de Jade');

  // Searching 'ÁRBOL' finds 'Árbol de Jade'
  assert.equal(search('ÁRBOL').length, 1);

  // Searching 'elastica' finds 'Ficus Elástica'
  assert.equal(search('elastica').length, 1);
  assert.equal(search('elástica').length, 1);
});

test('manual plant creation generates valid care structure', () => {
  const createMockPlant = (name, customOptions = {}) => {
    return {
      id: 'custom-' + Date.now(),
      name: name.trim(),
      scientificName: customOptions.scientificName || name.trim(),
      category: 'interior',
      wateringFrequencyDays: customOptions.wateringFrequencyDays ?? 7,
      healthScore: 85,
      avatarEmoji: '🌱',
      notes: '',
      careTasks: [
        {
          id: 'task-1',
          title: 'Regar',
          dueDate: 'Hoy',
          type: 'riego',
          completed: false,
          repeatIntervalDays: customOptions.wateringFrequencyDays ?? 7,
        },
      ],
    };
  };

  const plant = createMockPlant('Pothos dorado', { wateringFrequencyDays: 5 });
  assert.equal(plant.name, 'Pothos dorado');
  assert.equal(plant.wateringFrequencyDays, 5);
  assert.equal(plant.careTasks.length, 1);
  assert.equal(plant.careTasks[0].repeatIntervalDays, 5);
});

test('fase 4 translations for onboarding and garden are complete', () => {
  const onboardingKeys = Object.keys(spanishOnboarding);
  assert.ok(onboardingKeys.includes('Elige tu idioma para comenzar'), 'Language selection title must exist');
  assert.ok(onboardingKeys.includes('¿Qué quieres lograr?'), 'Goal selection title must exist');
  assert.ok(onboardingKeys.includes('Identificar mis plantas'), 'Identify goal must exist');
  assert.ok(onboardingKeys.includes('No olvidar el riego'), 'Watering goal must exist');
  assert.ok(onboardingKeys.includes('Curar una planta enferma'), 'Cure goal must exist');
  assert.ok(onboardingKeys.includes('Omitir'), 'Skip button must exist');

  const gardenKeys = Object.keys(spanishGarden);
  assert.ok(gardenKeys.includes('Añadir planta'), 'Add plant action must exist');
  assert.ok(gardenKeys.includes('Escanea tu primera planta'), 'Empty state CTA must exist');
});

test('fase 1 design tokens satisfy glassmorphism and material 3 requirements', () => {
  // Brand color is strictly #2E7D32
  assert.equal(BRAND_COLOR, '#2E7D32');
  assert.equal(colors.light.primary, '#2E7D32');
  assert.equal(colors.light.brand, '#2E7D32');
  assert.equal(colors.dark.brand, '#2E7D32');

  // Glass tokens in light mode
  assert.ok(colors.light.glassFill, 'colors.light.glassFill must exist');
  assert.ok(colors.light.glassFillStrong, 'colors.light.glassFillStrong must exist');
  assert.ok(colors.light.glassBorder, 'colors.light.glassBorder must exist');
  assert.ok(colors.light.glassFallback, 'colors.light.glassFallback must exist');
  assert.equal(colors.light.backgroundGradient.length, 2);

  // Glass tokens in dark mode
  assert.ok(colors.dark.glassFill, 'colors.dark.glassFill must exist');
  assert.ok(colors.dark.glassFillStrong, 'colors.dark.glassFillStrong must exist');
  assert.ok(colors.dark.glassBorder, 'colors.dark.glassBorder must exist');
  assert.ok(colors.dark.glassFallback, 'colors.dark.glassFallback must exist');
  assert.equal(colors.dark.backgroundGradient.length, 2);

  // M3 Color Tokens: primaryContainer and surfaceContainer levels
  assert.ok(colors.light.primaryContainer, 'colors.light.primaryContainer must exist');
  assert.ok(colors.light.onPrimaryContainer, 'colors.light.onPrimaryContainer must exist');
  assert.ok(colors.light.surfaceContainer, 'colors.light.surfaceContainer must exist');
  assert.ok(colors.light.surfaceContainerHigh, 'colors.light.surfaceContainerHigh must exist');
  assert.ok(colors.light.outlineVariant, 'colors.light.outlineVariant must exist');

  assert.ok(colors.dark.primaryContainer, 'colors.dark.primaryContainer must exist');
  assert.ok(colors.dark.onPrimaryContainer, 'colors.dark.onPrimaryContainer must exist');
  assert.ok(colors.dark.surfaceContainer, 'colors.dark.surfaceContainer must exist');
  assert.ok(colors.dark.surfaceContainerHigh, 'colors.dark.surfaceContainerHigh must exist');
  assert.ok(colors.dark.outlineVariant, 'colors.dark.outlineVariant must exist');

  // Spacing: M3 standard borderRadius tokens (8/12/16/28 dp)
  assert.equal(layout.borderRadius.sm, 8, 'layout.borderRadius.sm must be 8');
  assert.equal(layout.borderRadius.md, 12, 'layout.borderRadius.md must be 12');
  assert.equal(layout.borderRadius.lg, 16, 'layout.borderRadius.lg must be 16 (M3 card)');
  assert.equal(layout.borderRadius.xl, 28, 'layout.borderRadius.xl must be 28 (M3 bottom sheet / dialog)');
  assert.ok(layout.glass, 'layout.glass must exist');
  assert.equal(typeof layout.glass.intensity, 'number');
  assert.equal(layout.glass.borderWidth, 1);
  assert.ok(layout.glass.borderColor.includes('255, 255, 255'));

  // Typography: Material 3 scale, single family, few weights
  assert.equal(FONT_FAMILY, 'sans-serif');
  assert.deepEqual(Object.keys(fontWeights), ['regular', 'medium', 'bold']);
  assert.equal(fontWeights.regular, '400');
  assert.equal(fontWeights.medium, '500');
  assert.equal(fontWeights.bold, '700');

  // Verify typography only uses the 3 weights
  const allowedWeights = new Set(['400', '500', '700']);
  for (const [key, style] of Object.entries(typography)) {
    assert.ok(allowedWeights.has(style.fontWeight), `typography.${key} weight ${style.fontWeight} is not in M3 few weights`);
  }

  // Material 3 scale exported
  assert.ok(material3Scale.headlineLarge);
  assert.ok(material3Scale.bodyLarge);
});

test('fase 2 glass components satisfy architecture and android constraints', () => {
  const surfacePath = path.join(process.cwd(), 'components', 'Surface.tsx');
  const glassSurfacePath = path.join(process.cwd(), 'components', 'GlassSurface.tsx');
  const glassBackgroundPath = path.join(process.cwd(), 'components', 'GlassBackground.tsx');
  const cardPath = path.join(process.cwd(), 'components', 'Card.tsx');

  assert.ok(fs.existsSync(surfacePath), 'Surface.tsx must exist');
  assert.ok(fs.existsSync(glassSurfacePath), 'GlassSurface.tsx must exist');
  assert.ok(fs.existsSync(glassBackgroundPath), 'GlassBackground.tsx must exist');
  assert.ok(fs.existsSync(cardPath), 'Card.tsx must exist');

  const surfaceCode = fs.readFileSync(glassSurfacePath, 'utf-8');
  assert.ok(!surfaceCode.includes('<BlurView'), 'GlassSurface must not mount <BlurView in M3 architecture');
  assert.ok(surfaceCode.includes('colors.surfaceContainer'), 'GlassSurface must use M3 surfaceContainer');

  const bgCode = fs.readFileSync(glassBackgroundPath, 'utf-8');
  assert.ok(bgCode.includes('BlurTargetContext'), 'GlassBackground must export BlurTargetContext');
  assert.ok(bgCode.includes('useBlurTarget'), 'GlassBackground must export useBlurTarget');
  assert.ok(bgCode.includes('contentContainer'), 'GlassBackground must render contentContainer');

  const cardCode = fs.readFileSync(cardPath, 'utf-8');
  assert.ok(cardCode.includes("CardVariant = 'elevated' | 'filled' | 'outlined' | 'flat' | 'glass'"), 'Card must export M3 and flat/glass variants');
  assert.ok(cardCode.includes("variant = 'flat'"), 'Card default variant must be flat');
  assert.ok(cardCode.includes('Surface'), 'Card must integrate Surface');
  assert.ok(cardCode.includes('colors.surface'), 'Card variant must use colors.surface');
  assert.ok(cardCode.includes('colors.outlineVariant'), 'Card outlined variant must use colors.outlineVariant');
});

test('fase 3 base components meet touch target, ripple, and minimalist criteria', () => {
  const baseComponents = [
    'Button.tsx',
    'BottomSheet.tsx',
    'ConfirmModal.tsx',
    'Snackbar.tsx',
    'FilterChip.tsx',
    'SegmentedControl.tsx',
    'ListRow.tsx',
    'ScreenHeader.tsx',
    'EmptyState.tsx',
    'PrimaryActionBar.tsx',
  ];

  for (const comp of baseComponents) {
    const filePath = path.join(process.cwd(), 'components', comp);
    assert.ok(fs.existsSync(filePath), `${comp} must exist`);
    const code = fs.readFileSync(filePath, 'utf-8');
    assert.ok(!code.includes('TouchableOpacity'), `${comp} must not use TouchableOpacity`);
  }

  // Button touch target >= 48dp and ripple
  const buttonCode = fs.readFileSync(path.join(process.cwd(), 'components', 'Button.tsx'), 'utf-8');
  assert.ok(buttonCode.includes('minHeight: getMinHeight()'));
  assert.ok(buttonCode.includes('android_ripple'));
  assert.ok(buttonCode.includes('Math.max(layout.minTouchTarget, 48)'));

  // BottomSheet close button touch target >= 48dp
  const sheetCode = fs.readFileSync(path.join(process.cwd(), 'components', 'BottomSheet.tsx'), 'utf-8');
  assert.ok(sheetCode.includes('minWidth: Math.max(layout.minTouchTarget, 48)'));
  assert.ok(sheetCode.includes('minHeight: Math.max(layout.minTouchTarget, 48)'));
  assert.ok(sheetCode.includes('android_ripple'));

  // FilterChip touch target >= 48dp
  const chipCode = fs.readFileSync(path.join(process.cwd(), 'components', 'FilterChip.tsx'), 'utf-8');
  assert.ok(chipCode.includes('minHeight: Math.max(layout.minTouchTarget, 48)'));
  assert.ok(chipCode.includes('android_ripple'));

  // SegmentedControl segment touch target >= 48dp
  const segmentCode = fs.readFileSync(path.join(process.cwd(), 'components', 'SegmentedControl.tsx'), 'utf-8');
  assert.ok(segmentCode.includes('minHeight: Math.max(layout.minTouchTarget, 48)'));
  assert.ok(segmentCode.includes('android_ripple'));

  // ListRow touch target >= 48dp
  const listCode = fs.readFileSync(path.join(process.cwd(), 'components', 'ListRow.tsx'), 'utf-8');
  assert.ok(listCode.includes('minHeight: Math.max(layout.minTouchTarget, 52)'));
  assert.ok(listCode.includes('android_ripple'));

  // PrimaryActionBar GlassSurface and secondary button touch target >= 48dp
  const barCode = fs.readFileSync(path.join(process.cwd(), 'components', 'PrimaryActionBar.tsx'), 'utf-8');
  assert.ok(barCode.includes('GlassSurface'));
  assert.ok(barCode.includes('minHeight: Math.max(layout.minTouchTarget, 48)'));
  assert.ok(barCode.includes('android_ripple'));

  // Snackbar GlassSurface
  const snackbarCode = fs.readFileSync(path.join(process.cwd(), 'components', 'Snackbar.tsx'), 'utf-8');
  assert.ok(snackbarCode.includes('GlassSurface'));
  assert.ok(snackbarCode.includes('minHeight: Math.max(layout.minTouchTarget, 48)'));
});

test('fase 4 navigation satisfies floating glass pill, fine icons, and active label contract', () => {
  const navPath = path.join(process.cwd(), 'navigation', 'AppNavigator.tsx');
  assert.ok(fs.existsSync(navPath), 'AppNavigator.tsx must exist');

  const navCode = fs.readFileSync(navPath, 'utf-8');
  assert.ok(!navCode.includes('TouchableOpacity'), 'AppNavigator must not use TouchableOpacity');
  assert.ok(navCode.includes('M3NavigationBar') || navCode.includes('FloatingGlassTabBar'), 'AppNavigator must provide NavigationBar');
  assert.ok(navCode.includes('useSafeAreaInsets'), 'AppNavigator must use useSafeAreaInsets');
  assert.ok(navCode.includes('insets.bottom'), 'AppNavigator must respect insets.bottom');

  // M3 pill indicator and surface container
  assert.ok(navCode.includes('iconPill'), 'AppNavigator must render M3 iconPill');
  assert.ok(navCode.includes('colors.surfaceContainer'), 'AppNavigator must use M3 surfaceContainer');
  assert.ok(navCode.includes('tabLabel'), 'AppNavigator must render M3 tabLabel');

  // Fine line outline icons
  assert.ok(navCode.includes('today-outline'));
  assert.ok(navCode.includes('leaf-outline'));
  assert.ok(navCode.includes('scan-outline'));
  assert.ok(navCode.includes('compass-outline'));
  assert.ok(navCode.includes('person-outline'));

  // Accessibility and touch target >= 48dp
  assert.ok(navCode.includes('minHeight: Math.max(layout.minTouchTarget, 48)'));
  assert.ok(navCode.includes('android_ripple'));
});

test('fase 5 screens satisfy flat minimalism and floating glass controls contract', () => {
  const screens = [
    'TodayScreen.tsx',
    'GardenScreen.tsx',
    'ScannerScreen.tsx',
    'PlantDetailScreen.tsx',
    'OnboardingScreen.tsx',
    'PaywallScreen.tsx',
    'ProfileScreen.tsx',
    'CareCalendarScreen.tsx',
    'EncyclopediaScreen.tsx',
    'ExploreScreen.tsx',
    'GrowthDiaryScreen.tsx',
    'HealthDiagnosisScreen.tsx',
    'AssistantScreen.tsx',
    'AchievementsScreen.tsx',
    'SettingsScreen.tsx',
    'HelpScreen.tsx',
  ];

  for (const screen of screens) {
    const screenPath = path.join(process.cwd(), 'screens', screen);
    assert.ok(fs.existsSync(screenPath), `${screen} must exist`);
    const code = fs.readFileSync(screenPath, 'utf-8');
    assert.ok(!code.includes('TouchableOpacity'), `${screen} must not use TouchableOpacity`);
  }

  // ScannerScreen & PlantDetailScreen: floating glass controls over camera/photo
  const scannerCode = fs.readFileSync(path.join(process.cwd(), 'screens', 'ScannerScreen.tsx'), 'utf-8');
  assert.ok(scannerCode.includes('GlassSurface'), 'ScannerScreen must use GlassSurface for camera controls');
  assert.ok(scannerCode.includes('variant="strong"'), 'ScannerScreen must use strong glass variant');

  const detailCode = fs.readFileSync(path.join(process.cwd(), 'screens', 'PlantDetailScreen.tsx'), 'utf-8');
  assert.ok(detailCode.includes('GlassSurface'), 'PlantDetailScreen must use GlassSurface for floating controls');

  // GardenScreen: floating glass add button
  const gardenCode = fs.readFileSync(path.join(process.cwd(), 'screens', 'GardenScreen.tsx'), 'utf-8');
  assert.ok(gardenCode.includes('GlassSurface'), 'GardenScreen must use GlassSurface for floating add button');

  // TodayScreen: flat cards with 24dp radii
  const todayCode = fs.readFileSync(path.join(process.cwd(), 'screens', 'TodayScreen.tsx'), 'utf-8');
  assert.ok(todayCode.includes('variant="flat"'), 'TodayScreen must use Card variant="flat"');
});

test('fase 6 polish: light/dark themes, contrast over glass, easy mode, and list performance', () => {
  // 1. Contrast & Tokens
  assert.equal(colors.light.brand, '#2E7D32');
  assert.equal(colors.dark.brand, '#2E7D32');
  assert.ok(colors.light.glassBorder.includes('255, 255, 255'));
  assert.ok(colors.dark.glassBorder.includes('255, 255, 255'));
  assert.ok(colors.light.glassFallback);
  assert.ok(colors.dark.glassFallback);

  // 2. Easy Mode
  assert.ok(layout.easyMinTouchTarget >= 56);
  assert.ok(layout.minTouchTarget >= 48);

  // 3. Contrast over M3 surfaces
  const glassCode = fs.readFileSync(path.join(process.cwd(), 'components', 'GlassSurface.tsx'), 'utf-8');
  assert.ok(glassCode.includes('colors.surfaceContainer'), 'GlassSurface must use M3 surfaceContainer');
  assert.ok(!glassCode.includes('<BlurView'), 'GlassSurface must eliminate BlurView in M3');

  // 4. List performance: no BlurView inside FlatList item cards
  const gardenCardCode = fs.readFileSync(path.join(process.cwd(), 'components', 'garden', 'GardenPlantCard.tsx'), 'utf-8');
  assert.ok(!gardenCardCode.includes('BlurView'), 'GardenPlantCard must not use BlurView');
  assert.ok(gardenCardCode.includes('variant="flat"'), 'GardenPlantCard must be flat for list performance');

  const encCardCode = fs.readFileSync(path.join(process.cwd(), 'screens', 'EncyclopediaScreen.tsx'), 'utf-8');
  assert.ok(encCardCode.includes('variant="flat"'), 'EncyclopediaScreen items must use flat variant');
});
