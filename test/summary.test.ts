import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  changePct,
  daysInMonth,
  formatPct,
  formatVnd,
  groupOf,
  modelOf,
  shiftMonth,
  shortVnd,
  summarize,
  vnDay,
  type BillRow,
} from '../src/lib/costs/summary.ts';

const row = (day: string, service: string, net: number, extra: Partial<BillRow> = {}): BillRow => ({
  day,
  service,
  project: 'p1',
  sku: 'sku',
  net,
  rate: 26000,
  ...extra,
});

// 2026-11-26 10:00 in Vietnam
const NOW = Date.UTC(2026, 10, 26, 3);

test('groups services into gemini, storage and other', () => {
  assert.equal(groupOf('Gemini API'), 'gemini');
  assert.equal(groupOf('Generative Language API'), 'gemini');
  assert.equal(groupOf('Cloud Storage'), 'storage');
  assert.equal(groupOf('Secret Manager'), 'other');
});

test('month helpers', () => {
  assert.equal(vnDay(Date.UTC(2026, 10, 30, 18)), '2026-12-01');
  assert.equal(daysInMonth('2026-02'), 28);
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(changePct(200, 100), 100);
  assert.equal(changePct(5, 0), null);
});

test('formats money and percent', () => {
  assert.equal(formatVnd(245589.4), '₫245,589');
  assert.equal(shortVnd(245589), '₫246k');
  assert.equal(shortVnd(5549), '₫5.5k');
  assert.equal(shortVnd(1_250_000), '₫1.3M');
  assert.equal(formatPct(532.2), '+532%');
  assert.equal(formatPct(-10), '-10%');
  assert.equal(formatPct(null), 'new');
});

test('totals, same-period change and forecast', () => {
  const rows = [
    row('2026-10-01', 'Gemini API', 1000),
    row('2026-10-25', 'Gemini API', 1000),
    row('2026-10-31', 'Gemini API', 9999), // after the last data day, not compared
    row('2026-11-24', 'Gemini API', 3000),
    row('2026-11-25', 'Cloud Storage', 1000),
  ];
  const s = summarize({ rows, usage: [], now: NOW, budget: 10000 });
  assert.equal(s.month, '2026-11');
  assert.equal(s.lastDay, '2026-11-25');
  assert.equal(s.total, 4000);
  assert.equal(s.prevSame, 2000);
  assert.equal(s.changePct, 100);
  // pace = 4000 / 7 days, 5 days left
  assert.equal(Math.round(s.forecast), Math.round(4000 + (4000 / 7) * 5));
  assert.equal(s.daily.length, 30);
  assert.equal(s.daily[24].values.storage, 1000);
  assert.ok(s.daily[29].forecast > 0);
  assert.equal(s.daily[0].forecast, 0);
  assert.equal(s.budgetPct, 40);
  assert.equal(s.services[0].name, 'Gemini API');
  assert.equal(s.months.at(-1)?.total, 4000);
  assert.equal(s.months.length, 6);
});

test('splits Gemini by app and compares with billing', () => {
  const rows = [row('2026-11-10', 'Gemini API', 260000)];
  const usage = [
    { app: 'cogi', month: '2026-11', usd: 3, calls: 30 },
    { app: 'navi', month: '2026-11', usd: 1, calls: 10 },
    { app: 'fina', month: '2026-10', usd: 9, calls: 90 },
  ];
  const s = summarize({ rows, usage, now: NOW, budget: 0 });
  assert.deepEqual(s.apps.map((a) => a.app), ['cogi', 'navi']);
  assert.equal(s.apps[0].share, 75);
  assert.equal(s.aiEstimate, 104000);
  assert.equal(Math.round(s.gapPct ?? 0), -60);
  assert.ok(s.insights.some((i) => i.tag === 'check' && i.text.includes('60% under')));
  assert.ok(s.insights.some((i) => i.tag === 'app' && i.text.startsWith('cogi is 75%')));
});

test('finds a two-day spike and names its cause', () => {
  const rows: BillRow[] = [];
  for (let d = 1; d <= 20; d++) {
    const day = `2026-11-${String(d).padStart(2, '0')}`;
    // Gemini is busy every day; the quiet Storage jump must still stand out.
    rows.push(row(day, 'Gemini API', d % 3 ? 20000 : 3000));
    rows.push(row(day, 'Cloud Storage', 100, { project: 'kyphan38-mora-app', sku: 'Standard' }));
  }
  rows.push(row('2026-11-12', 'Cloud Storage', 9000, { project: 'kyphan38-mora-app', sku: 'Egress' }));
  rows.push(row('2026-11-13', 'Cloud Storage', 8500, { project: 'kyphan38-mora-app', sku: 'Egress' }));
  const s = summarize({ rows, usage: [], now: NOW, budget: 0 });
  const spike = s.insights.find((i) => i.tag === 'spike');
  assert.ok(spike, 'spike found');
  assert.match(spike.text, /^Storage Nov 12-13: .* in 2 days \(kyphan38-mora-app, Egress\)\.$/);
});

test('warns when the forecast is over budget', () => {
  const rows = [row('2026-11-25', 'Gemini API', 100000)];
  const s = summarize({ rows, usage: [], now: NOW, budget: 50000 });
  assert.equal(s.insights[0].tag, 'over');
});

test('empty data gives zeros, not errors', () => {
  const s = summarize({ rows: [], usage: [], now: NOW, budget: 500000 });
  assert.equal(s.total, 0);
  assert.equal(s.lastDay, null);
  assert.equal(s.forecast, 0);
  assert.deepEqual(s.insights, []);
});

test('names the Gemini model from the billing SKU', () => {
  assert.equal(modelOf('Generate content output token count gemini 3.8 flash text'), 'gemini 3.8 flash');
  assert.equal(modelOf('Generate content input token count Gemini 3.5 Flash Lite audio'), 'gemini 3.5 flash lite');
  assert.equal(modelOf('Generate content input token count gemini 4 hydrogen'), 'gemini 4 hydrogen');
  assert.equal(modelOf('Embed content input token count gemini-embedding-2'), 'gemini embedding 2');
  assert.equal(modelOf('Search grounding requests'), 'search grounding');
  assert.equal(modelOf('Something else'), 'other');
});

test('Gemini cost per model, biggest first', () => {
  const rows = [
    row('2026-11-10', 'Gemini API', 3000, { sku: 'Generate content output token count gemini 4 argon text' }),
    row('2026-11-11', 'Gemini API', 5000, { sku: 'Generate content output token count gemini 3.8 flash text' }),
    row('2026-11-11', 'Gemini API', 1000, { sku: 'Generate content input token count gemini 3.8 flash text' }),
    row('2026-11-11', 'Cloud Storage', 9000, { sku: 'Standard' }),
  ];
  const s = summarize({ rows, usage: [], now: NOW, budget: 0 });
  assert.deepEqual(s.models.map((m) => [m.name, m.total]), [['gemini 3.8 flash', 6000], ['gemini 4 argon', 3000]]);
});

test('wallet top-ups are shown apart and left out of every total', () => {
  const s = summarize({
    rows: [
      row('2026-11-01', 'Invoice', 200000, { project: 'no project', sku: 'Billing Adjustment (Standalone)', topup: true }),
      row('2026-11-08', 'Gemini API', 18000),
      row('2026-10-01', 'Invoice', 18000, { project: 'no project', sku: 'Tax' }),
    ],
    usage: [],
    now: NOW,
    budget: 0,
  });
  assert.equal(s.topup, 200000);
  assert.equal(s.total, 18000);
  assert.deepEqual(s.services.map((l) => l.name), ['Gemini API']);
  assert.equal(s.daily[0].values.other, 0);
  assert.equal(s.months.at(-1)!.total, 18000);
  assert.equal(s.months.at(-2)!.total, 18000);
});
