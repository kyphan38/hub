import 'server-only';

import { BigQuery } from '@google-cloud/bigquery';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { shiftMonth, vnDay, type AppUsage, type BillRow } from '@/lib/costs/summary';

/** Apps that write aiUsage/{YYYY-MM}. Project id = kyphan38-<app>-app. */
export const AI_APPS = ['fina', 'logi', 'hodi', 'legi', 'navi', 'noda', 'cogi'];

type Key = { client_email: string; private_key: string; project_id: string };

function readKey(): Key {
  const raw = process.env.HUB_COSTS_SA;
  if (!raw) throw new Error('HUB_COSTS_SA is not set');
  return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as Key;
}

export function adminApp(name: string, projectId: string): App {
  if (getApps().some((a) => a.name === name)) return getApp(name);
  const key = readKey();
  return initializeApp(
    { credential: cert({ projectId, clientEmail: key.client_email, privateKey: key.private_key }), projectId },
    name,
  );
}

/** Checks the Firebase ID token and the one allowed email. */
export async function verifyOwner(authHeader: string | null): Promise<boolean> {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const allowed = process.env.ALLOWED_USER_EMAIL?.toLowerCase();
  if (!token || !allowed) return false;
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const decoded = await getAuth(adminApp('hub', projectId)).verifyIdToken(token, true);
    return decoded.email?.toLowerCase() === allowed && decoded.email_verified === true;
  } catch (err) {
    // checkRevoked reads the user, so the reader account needs Firebase Auth Viewer on the hub project.
    console.warn('[costs] token check failed', (err as { code?: string }).code ?? (err instanceof Error ? err.message : err));
    return false;
  }
}

export type BillResult = { rows: BillRow[]; ready: boolean };

/** Daily net cost for the last 6 months. ready = false until the export table exists. */
export async function readBilling(now: number): Promise<BillResult> {
  const table = process.env.BILLING_TABLE;
  if (!table) return { rows: [], ready: false };
  const key = readKey();
  const bq = new BigQuery({
    projectId: key.project_id,
    credentials: { client_email: key.client_email, private_key: key.private_key },
  });
  const from = `${shiftMonth(vnDay(now).slice(0, 7), -5)}-01`;
  const query = `
    SELECT
      FORMAT_DATE('%Y-%m-%d', DATE(usage_start_time, 'Asia/Ho_Chi_Minh')) AS day,
      service.description AS service,
      IFNULL(project.id, 'no project') AS project,
      sku.description AS sku,
      SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS net,
      AVG(currency_conversion_rate) AS rate
    FROM \`${table}\`
    WHERE usage_start_time >= TIMESTAMP(@from, 'Asia/Ho_Chi_Minh')
    GROUP BY day, service, project, sku`;
  try {
    const [rows] = await bq.query({ query, params: { from }, location: 'US' });
    return {
      ready: true,
      rows: rows.map((r: Record<string, unknown>) => ({
        day: String(r.day),
        service: String(r.service),
        project: String(r.project),
        sku: String(r.sku),
        net: Number(r.net) || 0,
        rate: Number(r.rate) || 0,
      })),
    };
  } catch (err) {
    // The export table appears a few hours after export is turned on.
    if (err instanceof Error && /not found/i.test(err.message)) return { rows: [], ready: false };
    throw err;
  }
}

/** aiUsage/{YYYY-MM} from every app. One failing app does not hide the others. */
export async function readAiUsage(): Promise<{ usage: AppUsage[]; failed: string[] }> {
  const usage: AppUsage[] = [];
  const failed: string[] = [];
  await Promise.all(
    AI_APPS.map(async (app) => {
      try {
        const db = getFirestore(adminApp(app, `kyphan38-${app}-app`));
        const snap = await db.collection('aiUsage').get();
        for (const doc of snap.docs) {
          const d = doc.data();
          usage.push({ app, month: doc.id, usd: Number(d.usd) || 0, calls: Number(d.calls) || 0 });
        }
      } catch {
        failed.push(app);
      }
    }),
  );
  return { usage, failed: failed.sort() };
}
