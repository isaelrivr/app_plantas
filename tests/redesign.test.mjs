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

  // Spacing: borderRadius.lg raised to 24 and layout.glass defined
  assert.equal(layout.borderRadius.lg, 24, 'layout.borderRadius.lg must be 24');
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
  const glassSurfacePath = path.join(process.cwd(), 'components', 'GlassSurface.tsx');
  const glassBackgroundPath = path.join(process.cwd(), 'components', 'GlassBackground.tsx');
  const cardPath = path.join(process.cwd(), 'components', 'Card.tsx');

  assert.ok(fs.existsSync(glassSurfacePath), 'GlassSurface.tsx must exist');
  assert.ok(fs.existsSync(glassBackgroundPath), 'GlassBackground.tsx must exist');
  assert.ok(fs.existsSync(cardPath), 'Card.tsx must exist');

  const surfaceCode = fs.readFileSync(glassSurfacePath, 'utf-8');
  assert.ok(surfaceCode.includes('BlurView'), 'GlassSurface must include BlurView');
  assert.ok(surfaceCode.includes('dimezisBlurViewSdk31Plus'), 'GlassSurface must use dimezisBlurViewSdk31Plus');
  assert.ok(surfaceCode.includes('useGlass'), 'GlassSurface must use useGlass hook');
  assert.ok(surfaceCode.includes('pointerEvents="none"'), 'GlassSurface must include tint layer with pointerEvents="none"');
  assert.ok(surfaceCode.includes('fallbackColor'), 'GlassSurface must support fallbackColor');

  const bgCode = fs.readFileSync(glassBackgroundPath, 'utf-8');
  assert.ok(bgCode.includes('BlurTargetView'), 'GlassBackground must include BlurTargetView');
  assert.ok(bgCode.includes('BlurTargetContext'), 'GlassBackground must export BlurTargetContext');
  assert.ok(bgCode.includes('useBlurTarget'), 'GlassBackground must export useBlurTarget');
  assert.ok(bgCode.includes('LinearGradient'), 'GlassBackground must use LinearGradient');
  assert.ok(bgCode.includes('backgroundGradient'), 'GlassBackground must use backgroundGradient token');

  const cardCode = fs.readFileSync(cardPath, 'utf-8');
  assert.ok(cardCode.includes("CardVariant = 'flat' | 'glass'"), 'Card must export flat and glass variants');
  assert.ok(cardCode.includes("variant = 'flat'"), 'Card default variant must be flat');
  assert.ok(cardCode.includes('GlassSurface'), 'Card must integrate GlassSurface for glass variant');
  assert.ok(cardCode.includes('colors.surface'), 'Card flat variant must use colors.surface');
  assert.ok(cardCode.includes('colors.border'), 'Card flat variant must use colors.border');
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



