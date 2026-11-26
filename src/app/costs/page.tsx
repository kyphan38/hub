'use client';

import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';

import CostsView, { type CostsData } from '@/components/CostsView';
import Nav from '@/components/Nav';
import s from '@/components/costs.module.css';
import shell from '@/components/shell.module.css';
import { auth, finishRedirect, signIn } from '@/lib/firebase';

export default function CostsPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [data, setData] = useState<CostsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    finishRedirect();
    return onAuthStateChanged(auth, setUser);
  }, []);

  const load = useCallback(async (fresh = false) => {
    if (!auth.currentUser) return;
    setError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/costs${fresh ? '?fresh=1' : ''}`, { headers: { authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        setError('This account cannot see costs.');
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
    } catch {
      setError('Could not load costs. Try again.');
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  if (user === undefined) return null;

  if (!user) {
    return (
      <main className={s.login}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
          <img src="/branding/hub-icon.svg" alt="" width={40} height={40} />
          <h1 className={s.title} style={{ marginTop: 14 }}>costs</h1>
        </div>
        <button
          type="button"
          className={s.loginBtn}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await signIn();
            } catch {
              setError('Sign-in failed. Try again.');
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>
        {error && <p role="alert" className={s.note}>{error}</p>}
      </main>
    );
  }

  if (!data) {
    return (
      <div className={shell.wrap}>
        <Nav current="costs" right={error ? <button type="button" onClick={() => void signOut(auth)}>sign out</button> : undefined} />
        <p className={s.empty}>{error ?? 'Loading…'}</p>
      </div>
    );
  }

  return (
    <>
      {error && <p role="alert" className={s.note} style={{ textAlign: 'center' }}>{error}</p>}
      <CostsView data={data} onRefresh={() => void load(true)} onSignOut={() => void signOut(auth)} />
    </>
  );
}
