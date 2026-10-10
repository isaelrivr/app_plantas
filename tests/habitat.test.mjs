import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worldData from 'world-atlas/countries-110m.json' with { type: 'json' };
import { feature } from 'topojson-client';

const source = fs.readFileSync(new URL('../services/habitatService.ts', import.meta.url), 'utf8');
const atlas = feature(worldData, worldData.objects.countries);
const atlasIds = new Set(atlas.features.map((country) => String(country.id)));
const expected = {
  angola: '024', bolivia: '068', brazil: '076', cameroon: '120', colombia: '170',
  'costa rica': '188', 'dem. rep. congo': '180', ecuador: '218', 'french polynesia': '250',
  gabon: '266', greece: '300', guatemala: '320', indonesia: '360', italy: '380', mexico: '484',
  nigeria: '566', panama: '591', peru: '604', philippines: '608', spain: '724', taiwan: '158',
  tunisia: '788', turkey: '792', 'united states of america': '840', venezuela: '862',
};

test('habitat country mapping uses ids present in world-atlas', () => {
  for (const [name, id] of Object.entries(expected)) {
    assert.match(source, new RegExp(`'${name}': '${id}'`));
    assert.ok(atlasIds.has(id), `${name} (${id}) is missing from world-atlas`);
  }
});

test('habitat geometry helpers are exported', () => {
  assert.match(source, /export function getNativeCountries/);
  assert.match(source, /export function calculateHabitatCentroid/);
  assert.match(source, /export function calculateHabitatBounds/);
  assert.match(source, /export function validateHabitatCountryIds/);
});
