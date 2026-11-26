import { test } from 'node:test';
import assert from 'node:assert/strict';

import { hodiWeek, linkPath, weekLinks } from '../src/lib/links.ts';
import { parseTheme } from '../src/lib/theme.ts';
import { ALL_APPS, GROUPS } from '../src/lib/apps.ts';

test('hodi week is the ISO week in Vietnam time, day starts at 04:00', () => {
  // Thu 26 Nov 2026, 10:00 in Vietnam
  assert.equal(hodiWeek(Date.UTC(2026, 10, 26, 3)), '2026-W48');
  // Mon 30 Nov 2026, 03:00 in Vietnam still counts as Sunday 29 Nov
  assert.equal(hodiWeek(Date.UTC(2026, 10, 29, 20)), '2026-W48');
  // Mon 30 Nov 2026, 05:00 in Vietnam
  assert.equal(hodiWeek(Date.UTC(2026, 10, 29, 22)), '2026-W49');
  // Fri 1 Jan 2027 belongs to the last week of 2026
  assert.equal(hodiWeek(Date.UTC(2027, 0, 1, 5)), '2026-W53');
});

test('week links put the hodi week in the url', () => {
  const hodi = weekLinks(Date.UTC(2026, 10, 26, 3))[0];
  assert.equal(hodi.url, 'https://hodi.kyphan38.com/review/?p=2026-W48');
  assert.equal(linkPath(hodi.url), '/review?p=2026-W48');
  assert.equal(linkPath('https://hodi.kyphan38.com/'), '/');
});

test('theme falls back to system', () => {
  assert.equal(parseTheme('dark'), 'dark');
  assert.equal(parseTheme('blue'), 'system');
  assert.equal(parseTheme(null), 'system');
});

test('home lists every app once, four daily apps first', () => {
  assert.equal(ALL_APPS.length, 11);
  assert.equal(new Set(ALL_APPS.map((a) => a.name)).size, 11);
  assert.deepEqual(GROUPS[0].apps.map((a) => a.name), ['fina', 'hodi', 'legi', 'logi']);
});
