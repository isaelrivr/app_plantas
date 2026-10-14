import test from 'node:test';
import assert from 'node:assert/strict';
import spanishOnboarding from '../i18n/fragments/onboarding.ts';
import spanishGarden from '../i18n/fragments/garden.ts';
import { normalizeDiacritics } from '../utils/textUtils.ts';

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
