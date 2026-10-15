import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateWidgetSnapshot,
  updateWidgetData,
  getSavedWidgetData,
  DEFAULT_WIDGET_SNAPSHOT,
} from '../services/widgetService.ts';

import {
  getCurrentUser,
  isAuthenticated,
  signInWithEmail,
  signUpWithEmail,
  signInAnonymously,
  signOut,
  deleteUserAccount,
  onAuthStateChanged,
} from '../services/authService.ts';

import {
  uploadGardenToCloud,
  downloadGardenFromCloud,
  syncGardenWithCloud,
  deleteRemoteUserData,
  getSyncMetadata,
} from '../services/syncService.ts';

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

test('auth: signInWithEmail and signUpWithEmail create valid session and update state', async () => {
  let observedUser = null;
  const unsubscribe = onAuthStateChanged((user) => {
    observedUser = user;
  });

  const newUser = await signUpWithEmail('jardinera@ecoscan.app', 'secreto123', 'Lucía');
  assert.equal(newUser.email, 'jardinera@ecoscan.app');
  assert.equal(newUser.displayName, 'Lucía');
  assert.equal(newUser.isAnonymous, false);
  assert.equal(isAuthenticated(), true);
  assert.equal(getCurrentUser()?.email, 'jardinera@ecoscan.app');
  assert.equal(observedUser?.email, 'jardinera@ecoscan.app');

  // Sign out
  await signOut();
  assert.equal(isAuthenticated(), false);
  assert.equal(getCurrentUser(), null);

  // Sign in
  const loggedIn = await signInWithEmail('jardinera@ecoscan.app', 'secreto123');
  assert.equal(loggedIn.email, 'jardinera@ecoscan.app');
  assert.equal(isAuthenticated(), true);

  // Account deletion
  const deleted = await deleteUserAccount();
  assert.equal(deleted, true);
  assert.equal(isAuthenticated(), false);

  unsubscribe();
});

test('auth: signInAnonymously establishes temporary guest session', async () => {
  const anonUser = await signInAnonymously();
  assert.equal(anonUser.isAnonymous, true);
  assert.match(anonUser.uid, /^anon_/);
  assert.equal(isAuthenticated(), true);

  await signOut();
  assert.equal(isAuthenticated(), false);
});

test('sync: uploadGardenToCloud and downloadGardenFromCloud persist remote state', async () => {
  const userId = 'usr_test_12345';
  const mockPlants = [
    {
      id: 'p1',
      name: 'Sansevieria',
      scientificName: 'Dracaena trifasciata',
      lastWatered: 'Hace 5 días',
      isWateredToday: false,
      wateringFrequencyDays: 14,
      light: 'Cualquiera',
      avatarEmoji: '🪴',
      healthScore: 99,
    },
  ];
  const mockRooms = [{ id: 'r1', name: 'Sala', icon: 'home-outline' }];

  const uploadRes = await uploadGardenToCloud(userId, mockPlants, mockRooms);
  assert.equal(uploadRes.success, true);
  assert.ok(uploadRes.updatedAt);

  const downloaded = await downloadGardenFromCloud(userId);
  assert.ok(downloaded);
  assert.equal(downloaded.userId, userId);
  assert.equal(downloaded.plants.length, 1);
  assert.equal(downloaded.plants[0].name, 'Sansevieria');

  const meta = await getSyncMetadata();
  assert.equal(meta.status, 'synced');
  assert.equal(meta.syncedPlantsCount, 1);
});

test('sync: syncGardenWithCloud merges remote and local plants without duplicates', async () => {
  const userId = 'usr_merge_67890';
  const remotePlants = [
    {
      id: 'p1',
      name: 'Monstera',
      scientificName: 'Monstera deliciosa',
      lastWatered: 'Ayer',
      isWateredToday: false,
      wateringFrequencyDays: 7,
      light: 'Media',
      avatarEmoji: '🌿',
      healthScore: 90,
    },
  ];
  await uploadGardenToCloud(userId, remotePlants);

  const localPlants = [
    {
      id: 'p2',
      name: 'Suculenta',
      scientificName: 'Echeveria elegans',
      lastWatered: 'Hace 8 días',
      isWateredToday: false,
      wateringFrequencyDays: 12,
      light: 'Sol directo',
      avatarEmoji: '🌵',
      healthScore: 92,
    },
  ];

  const merged = await syncGardenWithCloud(userId, localPlants);
  assert.equal(merged.plants.length, 2);
  const ids = merged.plants.map((p) => p.id).sort();
  assert.deepEqual(ids, ['p1', 'p2']);

  // Remote cleanup
  const deleted = await deleteRemoteUserData(userId);
  assert.equal(deleted, true);
  const afterDelete = await downloadGardenFromCloud(userId);
  assert.equal(afterDelete, null);
});
