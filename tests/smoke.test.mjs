import test from 'node:test';
import assert from 'node:assert/strict';
import packageJson from '../package.json' with { type: 'json' };

test('project exposes verification scripts', () => {
  assert.equal(typeof packageJson.scripts.typecheck, 'string');
  assert.equal(typeof packageJson.scripts.lint, 'string');
  assert.equal(typeof packageJson.scripts.test, 'string');
});
