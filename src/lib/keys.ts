// Keyboard shortcuts on the home page: 1-9 open apps in page order, Space opens
// the next Daily app that is not done yet.

import { ALL_APPS } from './apps.ts';

/** Key label for an app, or null past the ninth app. */
export function hotkeyFor(name: string): string | null {
  const i = ALL_APPS.findIndex((a) => a.name === name);
  return i >= 0 && i < 9 ? String(i + 1) : null;
}

/** App opened by a key press, or null. */
export function appForKey(key: string): string | null {
  if (!/^[1-9]$/.test(key)) return null;
  return ALL_APPS[Number(key) - 1]?.name ?? null;
}

type KeyLike = { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean; target: EventTarget | null };

/** Skip presses with modifiers, and presses while typing in a field. */
export function isPlainKey(e: KeyLike): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  const t = e.target as { tagName?: string; isContentEditable?: boolean } | null;
  const tag = t?.tagName?.toLowerCase();
  return !(tag === 'input' || tag === 'textarea' || tag === 'select' || t?.isContentEditable);
}

/** Tab title: "(2/4) hub" until the day is full. */
export function tabTitle(done: number, total: number): string {
  return done < total ? `(${done}/${total}) hub` : 'hub';
}
