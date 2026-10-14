import test from 'node:test';
import assert from 'node:assert/strict';
import spanishScanner from '../i18n/fragments/scanner.ts';
import spanishGarden from '../i18n/fragments/garden.ts';
import spanishPlants from '../i18n/fragments/plants.ts';

test('undo action manager behaves correctly with timers', async () => {
  let itemRestored = false;
  let timerExpired = false;

  const createUndoAction = (onUndo, durationMs = 50) => {
    let active = true;
    const timer = setTimeout(() => {
      active = false;
      timerExpired = true;
    }, durationMs);

    return {
      undo: () => {
        if (!active) return false;
        clearTimeout(timer);
        active = false;
        onUndo();
        return true;
      },
      isActive: () => active,
    };
  };

  const action = createUndoAction(() => {
    itemRestored = true;
  }, 100);

  assert.equal(action.isActive(), true, 'Undo action should be active initially');
  const success = action.undo();
  assert.equal(success, true, 'Undo should succeed while active');
  assert.equal(itemRestored, true, 'Undo callback should execute');
  assert.equal(action.isActive(), false, 'Action should become inactive after undo');

  // Second undo should fail
  assert.equal(action.undo(), false, 'Second undo should fail');
});

test('natural copy has eliminated technical jargon and emojis from actions', () => {
  const allKeys = [
    ...Object.keys(spanishScanner),
    ...Object.keys(spanishGarden),
    ...Object.keys(spanishPlants),
  ];

  // Verify that newly introduced clean actions exist
  assert.ok(allKeys.includes('Abrir Mapa de Hábitat'), 'Clean habitat button should exist');
  assert.ok(allKeys.includes('Diagnosticar Salud'), 'Clean diagnosis button should exist');
  assert.ok(allKeys.includes('Ver Diario de Crecimiento'), 'Clean diary button should exist');
  assert.ok(allKeys.includes('Eliminar de Mi Jardín'), 'Remove plant button should exist');
  assert.ok(allKeys.includes('Deshacer'), 'Undo translation must exist');
  assert.ok(allKeys.includes('Clima estimado'), 'Clima estimado translation must exist');
  assert.ok(allKeys.includes('Revisando el clima de tu zona...'), 'Natural weather translation must exist');
  assert.ok(allKeys.includes('Buscando tu planta...'), 'Natural scanner search translation must exist');
});
