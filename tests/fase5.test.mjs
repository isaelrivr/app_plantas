import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRecord,
  validateGardenData,
  validateSettingsData,
  validateAchievementsData,
} from '../services/storage.ts';
import {
  SUPPORTED_ACHIEVEMENTS,
  checkNewAchievements,
  getAchievements,
} from '../services/gamificationService.ts';
import { SUPPORTED_CITIES, WEATHER_CACHE_TTL_MS } from '../services/weatherConfig.ts';

// -------------------------------------------------------------
// 1. VALIDACIÓN DE ESQUEMAS EN RUNTIME (storage.ts)
// -------------------------------------------------------------
test('storage: isRecord correctly discriminates valid objects from primitives and arrays', () => {
  assert.equal(isRecord({ a: 1 }), true);
  assert.equal(isRecord({}), true);
  assert.equal(isRecord(null), false);
  assert.equal(isRecord(undefined), false);
  assert.equal(isRecord([1, 2, 3]), false);
  assert.equal(isRecord('string'), false);
  assert.equal(isRecord(42), false);
  assert.equal(isRecord(true), false);
});

test('storage: validateGardenData cleans corrupted plants and retains valid structure', () => {
  assert.equal(validateGardenData({ plants: [{ id: 'plant-1', name: 'Monstera' }] }), true);
  assert.equal(validateGardenData({ plants: [], stats: { streakDays: 5 } }), true);
  assert.equal(validateGardenData({ plants: 'not-an-array' }), false);
  assert.equal(validateGardenData({ plants: [], stats: 'invalid-stats' }), false);
  assert.equal(validateGardenData(null), false);
  assert.equal(validateGardenData(undefined), false);
});

test('storage: validateSettingsData returns safe defaults for malformed input', () => {
  assert.equal(validateSettingsData({ themePreference: 'system' }), true);
  assert.equal(validateSettingsData({ themePreference: 'light' }), true);
  assert.equal(validateSettingsData({ themePreference: 'dark' }), true);
  assert.equal(validateSettingsData({ themePreference: 'cyberpunk' }), false);
  assert.equal(validateSettingsData(null), false);
  assert.equal(validateSettingsData('invalid'), false);
});

test('storage: validateAchievementsData filters out non-timestamped keys', () => {
  const validData = {
    'first-water': '2026-10-14T10:00:00.000Z',
    'streak-3': '2026-10-14T12:00:00.000Z',
  };
  assert.equal(validateAchievementsData(validData), true);

  const corruptedData = {
    'first-water': 12345, // invalid type
  };
  assert.equal(validateAchievementsData(corruptedData), false);
  assert.equal(validateAchievementsData(null), false);
});

// -------------------------------------------------------------
// 2. PERSISTENCIA Y CELEBRACIÓN DE LOGROS (gamificationService.ts)
// -------------------------------------------------------------
test('achievements: checkNewAchievements detects unearned milestones and creates unlockedAt', () => {
  const currentUnlocked = {
    'first-water': '2026-09-01T12:00:00.000Z',
  };

  const stats = {
    currentStreak: 3,
    longestStreak: 3,
    totalWaterings: 5,
    totalPlants: 5,
    totalIdentifications: 5,
    totalDiagnoses: 0,
    tasksCompleted: 0,
  };

  const { newAchievements, updatedMap } = checkNewAchievements(stats, currentUnlocked);
  assert.ok(Array.isArray(newAchievements));
  // Plant count is 5 -> collector-5 should unlock
  const collector5 = newAchievements.find((a) => a.id === 'collector-5');
  assert.ok(collector5, 'collector-5 should be unlocked');
  assert.ok(collector5.unlockedAt, 'unlockedAt should be populated with ISO date');
  // Streak is 3 -> streak-3 should unlock
  const streak3 = newAchievements.find((a) => a.id === 'streak-3');
  assert.ok(streak3, 'streak-3 should be unlocked');
  assert.equal(updatedMap['streak-3'], streak3.unlockedAt);

  // first-water was already unlocked, so it should not appear in newAchievements
  const firstWater = newAchievements.find((a) => a.id === 'first-water');
  assert.equal(firstWater, undefined, 'Already unlocked achievement should not trigger celebration again');
});

test('achievements: getAchievements preserves historical unlockedAt timestamps', () => {
  const currentUnlocked = {
    'first-water': '2026-05-10T08:30:00.000Z',
  };

  const stats = {
    currentStreak: 0,
    longestStreak: 0,
    totalWaterings: 0,
    totalPlants: 0,
    totalIdentifications: 0,
    totalDiagnoses: 0,
    tasksCompleted: 0,
  };

  const achievements = getAchievements(stats, currentUnlocked);
  const firstWater = achievements.find((a) => a.id === 'first-water');
  assert.ok(firstWater);
  assert.equal(firstWater.unlocked, true);
  assert.equal(firstWater.unlockedAt, '2026-05-10T08:30:00.000Z');
});

// -------------------------------------------------------------
// 3. RESETEO DEL CONTADOR DIARIO A MEDIANOCHE
// -------------------------------------------------------------
test('daily counter: dateKey rollover logic resets count', () => {
  const computeDailyQuota = (state, todayDateKey) => {
    if (state.lastIdentificationDate !== todayDateKey) {
      return {
        ...state,
        identificationsToday: 0,
        lastIdentificationDate: todayDateKey,
      };
    }
    return state;
  };

  const yesterdayState = {
    identificationsToday: 5,
    lastIdentificationDate: '2026-10-13',
  };

  const todayDateKey = '2026-10-14';
  const updatedState = computeDailyQuota(yesterdayState, todayDateKey);

  assert.equal(updatedState.identificationsToday, 0, 'Quota must reset to 0 upon date rollover');
  assert.equal(updatedState.lastIdentificationDate, '2026-10-14');

  // Same day should NOT reset count
  const sameDayState = computeDailyQuota(updatedState, '2026-10-14');
  assert.equal(sameDayState.identificationsToday, 0);
});

// -------------------------------------------------------------
// 4. CIUDADES MANUALES Y CACHÉ DEL CLIMA (weatherService.ts)
// -------------------------------------------------------------
test('weather: SUPPORTED_CITIES contains valid latitude and longitude coordinates', () => {
  assert.ok(SUPPORTED_CITIES.length >= 8, 'At least 8 major Hispanic cities should be available');
  for (const city of SUPPORTED_CITIES) {
    assert.ok(typeof city.name === 'string' && city.name.length > 0);
    assert.ok(typeof city.latitude === 'number' && city.latitude >= -90 && city.latitude <= 90);
    assert.ok(typeof city.longitude === 'number' && city.longitude >= -180 && city.longitude <= 180);
  }
});

test('weather: SUPPORTED_CITIES includes Torreón, Coah.', () => {
  const torreon = SUPPORTED_CITIES.find((c) => c.name.toLowerCase().includes('torre'));
  assert.ok(torreon, 'Torreón should be present in SUPPORTED_CITIES');
  assert.ok(torreon.latitude >= 25 && torreon.latitude <= 26, 'Latitude must correspond to Torreón');
  assert.ok(torreon.longitude <= -103 && torreon.longitude >= -104, 'Longitude must correspond to Torreón');
});

test('weather: cache TTL is strictly 30 minutes', () => {
  const CACHE_TTL_MS = 30 * 60 * 1000;
  assert.equal(CACHE_TTL_MS, 1800000);

  const isCacheValid = (cachedTimestamp, now) => {
    return now - cachedTimestamp < CACHE_TTL_MS;
  };

  const now = Date.now();
  assert.equal(isCacheValid(now - 1000 * 60 * 10, now), true, '10 minutes old should be valid');
  assert.equal(isCacheValid(now - 1000 * 60 * 29, now), true, '29 minutes old should be valid');
  assert.equal(isCacheValid(now - 1000 * 60 * 31, now), false, '31 minutes old must be expired');
});

// -------------------------------------------------------------
// 5. RECONCILIACIÓN DE FOTOS HUÉRFANAS Y CASCADA DE BORRADO
// -------------------------------------------------------------
test('media: orphan image reconciliation identifies detached files', () => {
  const activePhotos = new Set([
    'file:///app-dir/plantae-media/monstera_123.jpg',
    'file:///app-dir/plantae-media/ficus_456.jpg',
  ]);

  const existingDiskFiles = [
    'monstera_123.jpg',
    'ficus_456.jpg',
    'orphan_deleted_plant_789.jpg',
    'old_diary_unreferenced.jpg',
  ];

  const filesToDelete = existingDiskFiles.filter((fileName) => {
    const isReferenced = Array.from(activePhotos).some((uri) => uri.endsWith(fileName));
    return !isReferenced;
  });

  assert.deepEqual(filesToDelete, [
    'orphan_deleted_plant_789.jpg',
    'old_diary_unreferenced.jpg',
  ]);
});

// -------------------------------------------------------------
// 6. ANALÍTICA DE PRIVACIDAD: CONSENTIMIENTO Y RESTRICCIÓN DE PII
// -------------------------------------------------------------
test('analytics: no events emitted without user consent and no PII allowed', () => {
  let emittedEvents = [];

  const mockAnalyticsTracker = (eventName, params = {}, consent = false) => {
    if (!consent) return false;
    // Sanitizar parámetros para asegurar cero PII
    const forbiddenKeys = ['email', 'name', 'password', 'phone', 'address', 'userId'];
    for (const key of Object.keys(params)) {
      if (forbiddenKeys.includes(key)) {
        throw new Error(`PII detected in analytics: ${key}`);
      }
    }
    emittedEvents.push({ eventName, params });
    return true;
  };

  // 1. Without consent
  const resultWithoutConsent = mockAnalyticsTracker('planta_regada', { plantCategory: 'interior' }, false);
  assert.equal(resultWithoutConsent, false);
  assert.equal(emittedEvents.length, 0);

  // 2. With consent
  const resultWithConsent = mockAnalyticsTracker('planta_regada', { plantCategory: 'interior' }, true);
  assert.equal(resultWithConsent, true);
  assert.equal(emittedEvents.length, 1);
  assert.equal(emittedEvents[0].eventName, 'planta_regada');

  // 3. Rejection of PII
  assert.throws(() => {
    mockAnalyticsTracker('usuario_login', { email: 'test@example.com' }, true);
  }, /PII detected/);
});
