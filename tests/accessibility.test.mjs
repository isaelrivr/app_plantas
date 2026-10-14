import test from 'node:test';
import assert from 'node:assert/strict';
import { layout } from '../theme/spacing.ts';
import { typography, easyModeTypography } from '../theme/typography.ts';
import { colors } from '../theme/colors.ts';

test('touch target tokens meet accessibility standards', () => {
  assert.ok(layout.minTouchTarget >= 48, 'minTouchTarget must be at least 48dp');
  assert.ok(layout.easyMinTouchTarget >= 56, 'easyMinTouchTarget must be at least 56dp');
  assert.ok(layout.buttonGap >= 8, 'buttonGap must be at least 8dp');
});

test('typography scale meets readable criteria for all ages', () => {
  assert.ok(typography.body.fontSize >= 17, 'Standard body font size must be >= 17sp');
  assert.ok(typography.subheadline.fontSize >= 15, 'Standard subheadline font size must be >= 15sp');
  assert.ok(typography.footnote.fontSize >= 14, 'Standard footnote font size must be >= 14sp');
  assert.ok(typography.caption1.fontSize >= 14, 'Standard caption1 font size must be >= 14sp');

  // Easy mode typography
  assert.ok(easyModeTypography.body.fontSize >= 19, 'Easy mode body font size must be >= 19sp');
  assert.ok(easyModeTypography.headline.fontSize >= 20, 'Easy mode headline font size must be >= 20sp');
});

test('contrast compliance tokens', () => {
  // #59595E against #FFFFFF yields 5.9:1 contrast ratio, which is >= 4.5:1 (WCAG AA)
  assert.equal(colors.light.textTertiary, '#59595E');
  assert.equal(colors.light.primaryDark, '#1B5E20');
});
