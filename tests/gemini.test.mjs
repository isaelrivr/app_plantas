import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify,
  parseGeminiJson,
  normalizeGeminiCareSheet,
  isGeminiDirectAvailable,
} from '../services/geminiService.ts';

test('geminiService: slugify produces valid slugs', () => {
  assert.equal(slugify('Monstera deliciosa'), 'monstera-deliciosa');
  assert.equal(slugify('Ficus elástica variegata!'), 'ficus-elastica-variegata');
  assert.equal(slugify('¿Planta con acentos? ¡Sí!'), 'planta-con-acentos-si');
});

test('geminiService: parseGeminiJson handles raw JSON and code fences', () => {
  const raw = '{"isPlant": true, "name": "Monstera"}';
  assert.deepEqual(parseGeminiJson(raw), { isPlant: true, name: 'Monstera' });

  const fenced = '```json\n{"isPlant": true, "name": "Ficus"}\n```';
  assert.deepEqual(parseGeminiJson(fenced), { isPlant: true, name: 'Ficus' });

  const withPreamble = 'Aquí tienes el resultado:\n```json\n{"isPlant": false}\n```';
  assert.deepEqual(parseGeminiJson(withPreamble), { isPlant: false });
});

test('geminiService: normalizeGeminiCareSheet normalizes and clamps bounds', () => {
  const sheet = normalizeGeminiCareSheet(
    {
      wateringFrequencyDays: 10,
      careLevels: {
        lightLevel: 9, // should clamp to 5
        wateringLevel: -2, // should clamp to 1
        humidityLevel: 4,
        tempMinC: 16,
        tempMaxC: 28,
      },
      difficulty: 'Moderado',
      watering: 'Riego moderado',
    },
    'Costilla de Adán',
    'Monstera deliciosa',
    'Araceae'
  );

  assert.equal(sheet.commonName, 'Costilla de Adán');
  assert.equal(sheet.scientificName, 'Monstera deliciosa');
  assert.equal(sheet.family, 'Araceae');
  assert.equal(sheet.wateringFrequencyDays, 10);
  assert.equal(sheet.careLevels.lightLevel, 5);
  assert.equal(sheet.careLevels.wateringLevel, 1);
  assert.equal(sheet.careLevels.humidityLevel, 4);
  assert.equal(sheet.careLevels.tempMinC, 16);
  assert.equal(sheet.careLevels.tempMaxC, 28);
  assert.equal(sheet.difficulty, 'Moderado');
});

test('geminiService: isGeminiDirectAvailable returns boolean', () => {
  assert.equal(typeof isGeminiDirectAvailable(), 'boolean');
});

test('geminiService: exports all conversational, daily advice, and growth tools', async () => {
  const mod = await import('../services/geminiService.ts');
  assert.equal(typeof mod.askGeminiAssistant, 'function');
  assert.equal(typeof mod.generateDailyGardenAdviceWithGemini, 'function');
  assert.equal(typeof mod.getOrFetchDailyGardenAdvice, 'function');
  assert.equal(typeof mod.analyzeGrowthWithGemini, 'function');
  assert.equal(typeof mod.callGeminiApi, 'function');
  assert.equal(typeof mod.generateCareSheetWithGemini, 'function');
  assert.equal(typeof mod.generateHabitatWithGemini, 'function');
});
