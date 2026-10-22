import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('FASE F.1: Theme tokens replacement across screens and modals', () => {
  const root = process.cwd();

  // HealthDiagnosisScreen uses colors.surfaceSecondary & colors.warningLight
  const healthCode = fs.readFileSync(path.join(root, 'screens', 'HealthDiagnosisScreen.tsx'), 'utf-8');
  assert.ok(healthCode.includes('styles.symptomsBox, { backgroundColor: colors.surfaceSecondary }'), 'symptomsBox uses surfaceSecondary');
  assert.ok(healthCode.includes('styles.referenceTile, { backgroundColor: colors.surfaceSecondary }'), 'referenceTile uses surfaceSecondary');
  assert.ok(healthCode.includes('styles.treatmentSelector, { backgroundColor: colors.surfaceSecondary }'), 'treatmentSelector uses surfaceSecondary');
  assert.ok(healthCode.includes('colors.warningLight'), 'safetyCard uses warningLight token');

  // ShareCardModal uses theme tokens
  const shareCode = fs.readFileSync(path.join(root, 'components', 'ShareCardModal.tsx'), 'utf-8');
  assert.ok(shareCode.includes('colors.successLight'), 'ShareCardModal uses successLight');
  assert.ok(shareCode.includes('colors.warningLight'), 'ShareCardModal uses warningLight');
  assert.ok(shareCode.includes('colors.errorLight'), 'ShareCardModal uses errorLight');

  // TodayScreen uses colors.info
  const todayCode = fs.readFileSync(path.join(root, 'screens', 'TodayScreen.tsx'), 'utf-8');
  assert.ok(todayCode.includes('color={colors.info}'), 'TodayScreen uses colors.info for water icon');

  // PlantDetailScreen uses infoLight and warningLight
  const plantDetailCode = fs.readFileSync(path.join(root, 'screens', 'PlantDetailScreen.tsx'), 'utf-8');
  assert.ok(plantDetailCode.includes('backgroundColor: colors.infoLight'), 'PlantDetailScreen uses infoLight');
  assert.ok(plantDetailCode.includes('backgroundColor: colors.warningLight'), 'PlantDetailScreen uses warningLight');

  // ExploreScreen uses successLight and warningLight
  const exploreCode = fs.readFileSync(path.join(root, 'screens', 'ExploreScreen.tsx'), 'utf-8');
  assert.ok(exploreCode.includes('backgroundColor: colors.successLight'), 'ExploreScreen uses successLight');
  assert.ok(exploreCode.includes('backgroundColor: colors.warningLight'), 'ExploreScreen uses warningLight');

  // CareCalendarScreen uses surfaceSecondary
  const calendarCode = fs.readFileSync(path.join(root, 'screens', 'CareCalendarScreen.tsx'), 'utf-8').replace(/\r\n/g, '\n');
  assert.ok(calendarCode.includes('styles.viewToggle, { backgroundColor: colors.surfaceSecondary'), 'CareCalendarScreen viewToggle uses surfaceSecondary');
  assert.ok(calendarCode.includes('backgroundColor: isActive ? colors.primary : colors.surfaceSecondary'), 'filterPill uses surfaceSecondary');
});

test('FASE F.2: Virtualization with FlatList/SectionList and stable keys', () => {
  const root = process.cwd();

  // GrowthDiaryScreen uses FlatList
  const growthCode = fs.readFileSync(path.join(root, 'screens', 'GrowthDiaryScreen.tsx'), 'utf-8');
  assert.ok(growthCode.includes('<FlatList'), 'GrowthDiaryScreen must render virtualized FlatList');
  assert.ok(growthCode.includes('keyExtractor={(item) => item.id}'), 'GrowthDiaryScreen must use stable keyExtractor item.id');
  assert.ok(growthCode.includes('ListHeaderComponent='), 'GrowthDiaryScreen must declare ListHeaderComponent');
  assert.ok(growthCode.includes('ListEmptyComponent='), 'GrowthDiaryScreen must declare ListEmptyComponent');

  // EncyclopediaScreen uses FlatList
  const encCode = fs.readFileSync(path.join(root, 'screens', 'EncyclopediaScreen.tsx'), 'utf-8');
  assert.ok(encCode.includes('<FlatList'), 'EncyclopediaScreen must render FlatList');
  assert.ok(encCode.includes('keyExtractor={(item) => item.id}'), 'EncyclopediaScreen must use item.id');

  // GardenScreen uses SectionList by room
  const gardenCode = fs.readFileSync(path.join(root, 'screens', 'GardenScreen.tsx'), 'utf-8');
  assert.ok(gardenCode.includes('<SectionList'), 'GardenScreen must render SectionList');
  assert.ok(gardenCode.includes('keyExtractor={(item) => item.id}'), 'GardenScreen must use item.id');
});

test('FASE F.3: Translations with t() and accessibility attributes', () => {
  const root = process.cwd();

  // ScannerScreen translations: hoy and PRO
  const scannerCode = fs.readFileSync(path.join(root, 'screens', 'ScannerScreen.tsx'), 'utf-8');
  assert.ok(scannerCode.includes("${t('hoy')}"), 'ScannerScreen counter must translate hoy with t()');
  assert.ok(scannerCode.includes("<Badge label={t('PRO')} variant=\"premium\" />"), 'ScannerScreen PRO badge must translate with t()');

  // SettingsScreen hour pill has accessibilityLabel
  const settingsCode = fs.readFileSync(path.join(root, 'screens', 'SettingsScreen.tsx'), 'utf-8');
  assert.ok(settingsCode.includes("accessibilityLabel={t('Hora de aviso {hora}', { hora: hour })}"), 'SettingsScreen hour pills must declare accessibilityLabel');

  // EditCareTaskModal preset chips have accessibilityLabel
  const editTaskCode = fs.readFileSync(path.join(root, 'components', 'calendar', 'EditCareTaskModal.tsx'), 'utf-8');
  assert.ok(editTaskCode.includes("accessibilityLabel={t('Fecha {fecha}', { fecha: t(preset.label) })}"), 'EditCareTaskModal due preset has accessibilityLabel');
  assert.ok(editTaskCode.includes("accessibilityLabel={t('Frecuencia {frecuencia}', { frecuencia: t(preset.label) })}"), 'EditCareTaskModal repeat preset has accessibilityLabel');
});

test('FASE F.4: Camera laser animation migrated from Animated to Reanimated 4', () => {
  const scannerPath = path.join(process.cwd(), 'screens', 'ScannerScreen.tsx');
  const scannerCode = fs.readFileSync(scannerPath, 'utf-8');

  // Reanimated 4 hooks used
  assert.ok(scannerCode.includes("from 'react-native-reanimated'"), 'ScannerScreen must import from react-native-reanimated');
  assert.ok(scannerCode.includes('useSharedValue(0)'), 'ScannerScreen must declare useSharedValue for laser');
  assert.ok(scannerCode.includes('useAnimatedStyle('), 'ScannerScreen must use useAnimatedStyle');
  assert.ok(scannerCode.includes('withRepeat('), 'ScannerScreen must use withRepeat for continuous scan');

  // Ensure legacy Animated is NOT imported from react-native
  const rnImportMatch = scannerCode.match(/import\s*\{([^}]+)\}\s*from\s*'react-native'/);
  assert.ok(rnImportMatch, 'Must find react-native import block');
  assert.ok(!rnImportMatch[1].includes('Animated'), 'ScannerScreen must NOT import Animated from react-native');
});

test('FASE F.5: Cleanup - GlassView.tsx deleted and .agent unified to .agents', () => {
  const root = process.cwd();

  // GlassView.tsx removed
  const glassViewPath = path.join(root, 'components', 'GlassView.tsx');
  assert.ok(!fs.existsSync(glassViewPath), 'components/GlassView.tsx must be deleted');

  // .agent folder removed, .agents preserved
  const oldAgentDir = path.join(root, '.agent');
  const officialAgentsDir = path.join(root, '.agents');
  assert.ok(!fs.existsSync(oldAgentDir), '.agent directory must be deleted');
  assert.ok(fs.existsSync(officialAgentsDir), '.agents directory must be preserved');
});
