'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import s from './home.module.css';
import type { CostsData } from './CostsView';
import { monthName, shortVnd } from '@/lib/costs/summary';
import { auth } from '@/lib/firebase';

/** One line with this month's bill, for the owner only. Hidden until billing has this month. */
export default function CostLine() {
  const [data, setData] = useState<CostsData | null>(null);

  useEffect(() => {
    let live = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setData(null);
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/costs', { headers: { authorization: `Bearer ${token}` } });
        if (res.ok && live) setData(await res.json());
      } catch {
        // No line is better than a wrong one.
      }
    });
    return () => {
      live = false;
      unsub();
    };
  }, []);

  const m = data?.summary;
  if (!m || !data.billingReady || m.lastDay === null) return null;
  const over = m.budget > 0 && m.total > m.budget;
  return (
    <p className={`${s.costLine} num`}>
      <Link href="/costs">
        {monthName(m.month)} {shortVnd(m.total)}
        {m.budget > 0 && ` · ${Math.round(m.budgetPct)}% of budget`}
        {over && ' · over'}
      </Link>
    </p>
  );
}
