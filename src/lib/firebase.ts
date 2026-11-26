'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
} from 'firebase/auth';

/** Own domain on https (next.config proxies /__/auth); firebaseapp.com on localhost and previews. */
function authDomain(): string | undefined {
  const fallback = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (typeof window === 'undefined') return fallback;
  const { protocol, host, hostname } = window.location;
  if (protocol !== 'https:' || hostname.endsWith('.vercel.app')) return fallback;
  return host;
}

const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: authDomain(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });

function createAuth(): Auth {
  if (typeof window === 'undefined') return getAuth(app);
  try {
    return initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();

/** Added to the Home Screen: a popup there opens apart and never reports back. */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export async function signIn(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (isStandalone()) {
    // Works because authDomain is our own domain (next.config proxies /__/auth).
    await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
    return;
  }
  try {
    await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  } catch (err) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
      return;
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    throw err;
  }
}

/** Completes a redirect sign-in when the page loads again; onAuthStateChanged then sees the user. */
export function finishRedirect(): void {
  getRedirectResult(auth, browserPopupRedirectResolver).catch(() => {
    // A failed or missing result leaves the sign-in button as it was.
  });
}
