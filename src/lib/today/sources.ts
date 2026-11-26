import 'server-only';

import { getFirestore, type Firestore } from 'firebase-admin/firestore';

import { adminApp } from '@/lib/costs/sources';
import { dayKey, dayStart, windowStart, type AppDays, type DailyApp } from '@/lib/today/summary';

// What counts as "logged today" in each app. If an app changes these
// collections or fields, update this file (see each app's AGENTS.md).

function db(app: DailyApp): Firestore {
  return getFirestore(adminApp(app, `kyphan38-${app}-app`));
}

/** Each app has one user; read every user doc id to stay simple. */
async function uids(store: Firestore): Promise<string[]> {
  const refs = await store.collection('users').listDocuments();
  return refs.map((r) => r.id);
}

type Reader = (store: Firestore, uid: string, from: string, fromMs: number) => Promise<string[]>;

const READERS: Record<DailyApp, Reader> = {
  // A spend or income typed in or imported; not budget moves or opening balances.
  async fina(store, uid, _from, fromMs) {
    const snap = await store.collection(`users/${uid}/transactions`).where('occurredAt', '>=', fromMs).get();
    return snap.docs
      .filter((d) => ['web', 'import'].includes(String(d.get('source'))))
      .map((d) => dayKey(Number(d.get('occurredAt'))));
  },
  // Today's page with words on it (doc id = day).
  async hodi(store, uid, from) {
    const snap = await store.collection(`users/${uid}/entries`).where('date', '>=', from).get();
    return snap.docs.filter((d) => Number(d.get('words')) > 0).map((d) => String(d.get('date')));
  },
  // A quote or thought saved, not in Trash.
  async legi(store, uid, _from, fromMs) {
    const snap = await store.collection(`users/${uid}/quotes`).where('createdAt', '>=', fromMs).get();
    return snap.docs
      .filter((d) => d.get('deletedAt') == null && ['quote', 'thought'].includes(String(d.get('kind'))))
      .map((d) => dayKey(Number(d.get('createdAt'))));
  },
  // A logged activity, not only planned, not the retired sleep category.
  async logi(store, uid, from) {
    const snap = await store.collection(`users/${uid}/activities`).where('logicalDate', '>=', from).get();
    return snap.docs
      .filter((d) => d.get('status') !== 'scheduled' && d.get('category') !== 'sleep')
      .map((d) => String(d.get('logicalDate')));
  },
};

export async function readDays(app: DailyApp, now: number): Promise<AppDays> {
  try {
    const store = db(app);
    const from = windowStart(now);
    const fromMs = dayStart(from);
    const all = await Promise.all((await uids(store)).map((uid) => READERS[app](store, uid, from, fromMs)));
    return { app, days: [...new Set(all.flat())] };
  } catch (err) {
    console.warn(`[today] ${app} read failed`, err instanceof Error ? err.message : err);
    return { app, days: null };
  }
}
