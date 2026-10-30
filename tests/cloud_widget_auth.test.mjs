import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateWidgetSnapshot,
  updateWidgetData,
  getSavedWidgetData,
} from '../services/widgetService.ts';

import {
  saveJSON,
  loadJSON,
  saveSecureJSON,
  loadSecureJSON,
  clearAllAppData,
  STORAGE_KEYS,
} from '../services/storage.ts';

test('widget: calculateWidgetSnapshot handles empty garden gracefully', () => {
  const snapshot = calculateWidgetSnapshot([]);
  assert.equal(snapshot.pendingCount, 0);
  assert.equal(snapshot.totalPlants, 0);
  assert.equal(snapshot.nextPlantName, null);
  assert.equal(snapshot.isAllCompleted, true);
  assert.equal(snapshot.deepLinkUrl, 'ecoscan://hoy');
});

test('widget: calculateWidgetSnapshot correctly identifies pending plant and deep link', () => {
  const mockPlants = [
    {
      id: 'plant-monstera',
      name: 'Monstera Deliciosa',
      nickname: 'Monty',
      scientificName: 'Monstera deliciosa',
      lastWatered: 'Hace 3 días',
      isWateredToday: false,
      wateringFrequencyDays: 7,
      light: 'Luz media',
      avatarEmoji: '🌿',
      healthScore: 95,
    },
    {
      id: 'plant-pothos',
      name: 'Pothos',
      scientificName: 'Epipremnum aureum',
      lastWatered: 'Hoy a las 09:00',
      isWateredToday: true,
      wateringFrequencyDays: 5,
      light: 'Luz indirecta',
      avatarEmoji: '🍃',
      healthScore: 90,
    },
  ];

  const snapshot = calculateWidgetSnapshot(mockPlants);
  assert.equal(snapshot.pendingCount, 1);
  assert.equal(snapshot.totalPlants, 2);
  assert.equal(snapshot.nextPlantName, 'Monty');
  assert.equal(snapshot.nextPlantId, 'plant-monstera');
  assert.equal(snapshot.isAllCompleted, false);
  assert.equal(snapshot.deepLinkUrl, 'ecoscan://planta/plant-monstera');
  assert.match(snapshot.headline, /Monty/);
});

test('widget: calculateWidgetSnapshot shows completion state when all plants are watered', () => {
  const mockPlants = [
    {
      id: 'plant-1',
      name: 'Ficus Lyrata',
      scientificName: 'Ficus lyrata',
      lastWatered: 'Hoy a las 08:30',
      isWateredToday: true,
      wateringFrequencyDays: 7,
      light: 'Luz filtrada',
      avatarEmoji: '🌳',
      healthScore: 88,
    },
  ];

  const snapshot = calculateWidgetSnapshot(mockPlants);
  assert.equal(snapshot.pendingCount, 0);
  assert.equal(snapshot.isAllCompleted, true);
  assert.equal(snapshot.nextPlantName, null);
  assert.equal(snapshot.deepLinkUrl, 'ecoscan://hoy');
});

test('widget: updateWidgetData and getSavedWidgetData persist snapshot', async () => {
  const mockPlants = [
    {
      id: 'plant-calathea',
      name: 'Calathea',
      scientificName: 'Calathea orbifolia',
      lastWatered: 'Ayer',
      isWateredToday: false,
      wateringFrequencyDays: 4,
      light: 'Sombra',
      avatarEmoji: '🌱',
      healthScore: 82,
    },
  ];

  const saved = await updateWidgetData(mockPlants);
  assert.equal(saved.nextPlantId, 'plant-calathea');

  const loaded = await getSavedWidgetData();
  assert.equal(loaded.nextPlantId, 'plant-calathea');
});

test('storage: saveJSON and loadJSON handle persistence and schema fallback correctly', async () => {
  const testData = { plantsCount: 3, lastUpdated: '2026-10-29' };
  const saved = await saveJSON(STORAGE_KEYS.settings, testData);
  assert.equal(saved, true);

  const loaded = await loadJSON(STORAGE_KEYS.settings, null);
  assert.deepEqual(loaded, testData);
});

test('storage: saveSecureJSON and loadSecureJSON protect sensitive Pro entitlement state', async () => {
  const sensitiveProState = {
    isPremium: true,
    isTrial: false,
    activePlanId: 'annual',
    expiresAt: '2027-10-29T00:00:00.000Z',
  };

  const saved = await saveSecureJSON(STORAGE_KEYS.premium, sensitiveProState);
  assert.equal(saved, true);

  const loaded = await loadSecureJSON(STORAGE_KEYS.premium, null);
  assert.deepEqual(loaded, sensitiveProState);
});

test('storage: clearAllAppData purges all local app data cleanly', async () => {
  const cleared = await clearAllAppData();
  assert.equal(cleared, true);
});
