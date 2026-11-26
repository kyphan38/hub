import { test } from 'node:test';
import assert from 'node:assert/strict';

import { appForKey, hotkeyFor, isPlainKey, tabTitle } from '../src/lib/keys.ts';

test('keys 1-9 follow page order', () => {
  assert.equal(hotkeyFor('fina'), '1');
  assert.equal(hotkeyFor('mora'), '9');
  assert.equal(hotkeyFor('moni'), null);
  assert.equal(appForKey('1'), 'fina');
  assert.equal(appForKey('5'), 'arca');
  assert.equal(appForKey('0'), null);
  assert.equal(appForKey('a'), null);
});

test('plain keys only, never while typing', () => {
  const base = { key: '1', metaKey: false, ctrlKey: false, altKey: false, target: null };
  assert.equal(isPlainKey(base), true);
  assert.equal(isPlainKey({ ...base, metaKey: true }), false);
  assert.equal(isPlainKey({ ...base, target: { tagName: 'INPUT' } as unknown as EventTarget }), false);
});

test('tab title shows progress until the day is full', () => {
  assert.equal(tabTitle(2, 4), '(2/4) hub');
  assert.equal(tabTitle(4, 4), 'hub');
});
