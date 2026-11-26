import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addDays, buildDaily, dayKey, dayStart, windowStart, type AppDays } from '../src/lib/today/summary.ts';

// Thu 26 Nov 2026, 21:00 in Vietnam
const NOW = Date.UTC(2026, 10, 26, 14);

test('a day starts at 04:00 Vietnam time', () => {
  assert.equal(dayKey(Date.UTC(2026, 10, 26, 20, 59)), '2026-11-26'); // 03:59 on the 27th
  assert.equal(dayKey(Date.UTC(2026, 10, 26, 21, 0)), '2026-11-27'); // 04:00 on the 27th
  assert.equal(dayStart('2026-11-27'), Date.UTC(2026, 10, 26, 21, 0));
  assert.equal(dayKey(dayStart('2026-11-27')), '2026-11-27');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(windowStart(NOW), '2026-10-28');
});

function days(...keys: string[]) {
  return keys;
}

test('status per app, count and next app', () => {
  const input: AppDays[] = [
    { app: 'fina', days: days('2026-11-26') },
    { app: 'hodi', days: days('2026-11-25') },
    { app: 'legi', days: null },
    { app: 'logi', days: days('2026-11-26', '2026-11-20') },
  ];
  const d = buildDaily(input, NOW);
  assert.equal(d.today, '2026-11-26');
  assert.deepEqual(d.apps.map((a) => a.state), ['done', 'todo', 'unknown', 'done']);
  assert.equal(d.done, 2);
  assert.equal(d.next, 'hodi');
  assert.equal(d.heat.length, 30);
  assert.deepEqual(d.heat.at(-1), { day: '2026-11-26', count: 2 });
});

test('streak counts full days and waits for today', () => {
  const all = (...keys: string[]): AppDays[] =>
    (['fina', 'hodi', 'legi', 'logi'] as const).map((app) => ({ app, days: keys }));
  // 24 and 25 full, today not yet: streak 2
  const two = all('2026-11-24', '2026-11-25');
  two[0].days = [...two[0].days!, '2026-11-26'];
  assert.equal(buildDaily(two, NOW).streak, 2);
  // today full too: 3
  assert.equal(buildDaily(all('2026-11-24', '2026-11-25', '2026-11-26'), NOW).streak, 3);
  // a gap on the 25th breaks it
  assert.equal(buildDaily(all('2026-11-23', '2026-11-24'), NOW).streak, 0);
  // all done: no next app
  assert.equal(buildDaily(all('2026-11-26'), NOW).next, null);
});
