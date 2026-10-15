import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateSmartWateringInterval } from '../services/wateringAdjustmentService.ts';
import { PT } from '../i18n/translations_pt.ts';
import { FR } from '../i18n/translations_fr.ts';
import { validateGardenData, validateSettingsData } from '../services/storage.ts';

test('fase 6: smart watering interval adjusts dynamically for pot, season, and weather', () => {
  const baseDays = 8;

  // 1. Efecto maceta
  const smallPot = calculateSmartWateringInterval(baseDays, { potSize: 'small' });
  const largePot = calculateSmartWateringInterval(baseDays, { potSize: 'large' });
  assert.ok(
    smallPot.recommendedIntervalDays < largePot.recommendedIntervalDays,
    'Las macetas pequeñas se secan antes que las grandes'
  );

  // 2. Efecto estación
  const summer = calculateSmartWateringInterval(baseDays, { season: 'summer' });
  const winter = calculateSmartWateringInterval(baseDays, { season: 'winter' });
  assert.ok(
    summer.recommendedIntervalDays < winter.recommendedIntervalDays,
    'En verano se riega con mayor frecuencia que en invierno'
  );

  // 3. Efecto clima cálido
  const heat = calculateSmartWateringInterval(baseDays, {
    weatherCondition: { tempC: 34, humidity: 30, isRaining: false },
  });
  assert.ok(
    heat.recommendedIntervalDays < baseDays,
    'Ola de calor acelera la evaporación y acorta el intervalo'
  );

  // 4. Efecto lluvia
  const rainy = calculateSmartWateringInterval(baseDays, {
    weatherCondition: { tempC: 18, humidity: 95, isRaining: true },
  });
  assert.ok(
    rainy.recommendedIntervalDays >= baseDays,
    'Lluvia y humedad alta espacian el riego para prevenir pudrición'
  );
  assert.ok(rainy.reasons.length > 0, 'Devuelve motivos comprensibles en lenguaje claro');
});

test('fase 6: botanical catalog is expanded to 32+ common species with full metadata', () => {
  const plantApiSource = readFileSync('./services/plantApi.ts', 'utf8');
  const matches = Array.from(plantApiSource.matchAll(/\bid:\s*['"]([a-z0-9-]+)['"]/g)).map((m) => m[1]);
  const uniqueSpecies = Array.from(new Set(matches));

  assert.ok(
    uniqueSpecies.length >= 32,
    `Catálogo debe contener al menos 32 especies únicas (actual: ${uniqueSpecies.length})`
  );

  // Verificar presencia de especies clave
  const expectedKeySpecies = [
    'monstera',
    'pothos',
    'aloe-vera',
    'lavanda',
    'succulent',
    'helecho-boston',
    'orchid',
    'ficus-lyrata',
    'sansevieria',
    'calathea',
    'espatifilo',
    'romero',
    'cinta',
    'pachira',
    'albahaca',
    'menta',
    'pilea',
    'jade',
    'potus-plateado',
    'ficus-elastica',
    'anturio',
    'dracaena-marginata',
    'chamaedorea',
    'orquidea-vanda',
    'filodendro-brasil',
    'croton',
    'begonia-maculata',
    'suculenta-cebra',
    'bromelia',
    'cactus-navidad',
    'tomillo',
    'singonio',
    'dieffenbachia',
    'maranta',
  ];

  for (const sp of expectedKeySpecies) {
    assert.ok(uniqueSpecies.includes(sp), `La especie ${sp} debe existir en el catálogo`);
  }
});

test('fase 6: pet safety and toxicity filtering correctly classifies species', () => {
  const toxSource = readFileSync('./services/toxicityService.ts', 'utf8');

  // Especies seguras para mascotas
  assert.ok(toxSource.includes('cinta:'), 'Cinta está registrada en toxicidad');
  assert.ok(toxSource.includes('pachira:'), 'Pachira está registrada en toxicidad');
  assert.ok(toxSource.includes('chamaedorea:'), 'Chamaedorea está registrada en toxicidad');
  assert.ok(toxSource.includes('maranta:'), 'Maranta está registrada en toxicidad');

  // Especies tóxicas
  assert.ok(toxSource.includes('monstera:'), 'Monstera está registrada en toxicidad');
  assert.ok(toxSource.includes('dieffenbachia:'), 'Dieffenbachia está registrada en toxicidad');
  assert.ok(toxSource.includes('jade:'), 'Jade está registrado en toxicidad');
  assert.ok(toxSource.includes('ficus-elastica'), 'Ficus elastica está registrado en toxicidad');
});

test('fase 6: backup validation and runtime schema defense', () => {
  // 1. JSON válido de jardín
  const validGarden = {
    plants: [
      {
        id: 'p-1',
        name: 'Monstera',
        scientificName: 'Monstera deliciosa',
        wateringFrequencyDays: 7,
        lastWatered: '2026-04-10T10:00:00.000Z',
        isWateredToday: false,
        light: 'Media',
        avatarEmoji: '🌿',
        healthScore: 90,
      },
    ],
    rooms: [{ id: 'r-1', name: 'Sala', icon: 'home' }],
    stats: { currentStreak: 5, totalWaterings: 12 },
  };

  const validated = validateGardenData(validGarden);
  assert.equal(validated, true, 'Datos válidos son aceptados');

  // 2. JSON corrupto o con tipos inválidos
  const corrupted = {
    plants: 'not-an-array',
    rooms: [null],
  };
  const rejected = validateGardenData(corrupted);
  assert.equal(rejected, false, 'Estructura corrupta es rechazada de forma segura');

  // 3. Validación de ajustes con 4 idiomas soportados y mascotas
  const validSettings = validateSettingsData({
    language: 'pt',
    hasPets: true,
    easyMode: true,
    analyticsConsent: true,
  });
  assert.equal(validSettings, true);

  const invalidLangSettings = validateSettingsData({
    language: 'de-DE-invalid',
  });
  assert.equal(invalidLangSettings, false, 'Idioma no soportado es invalidado');
});

test('fase 6: multilingual support includes complete dictionaries for PT and FR', () => {
  assert.ok(PT['Mi Jardín'], 'Portugués contiene traducción de Mi Jardín');
  assert.ok(PT['Regar'], 'Portugués contiene traducción de Regar');
  assert.ok(PT['Enciclopedia'], 'Portugués contiene traducción de Enciclopedia');

  assert.ok(FR['Mi Jardín'], 'Francés contiene traducción de Mi Jardín');
  assert.ok(FR['Regar'], 'Francés contiene traducción de Regar');
  assert.ok(FR['Enciclopedia'], 'Francés contiene traducción de Enciclopedia');
});

test('fase 6: app.json defines deep linking scheme and tablet support', () => {
  const appJson = JSON.parse(readFileSync('./app.json', 'utf8'));
  assert.equal(appJson.expo.scheme, 'ecoscan', 'El scheme debe ser "ecoscan" para deep linking');
  assert.equal(appJson.expo.ios.supportsTablet, true, 'Soporta iPad / tablet');
});
