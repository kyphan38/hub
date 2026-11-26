'use client';

import { useEffect, useState } from 'react';

import { parseTheme, THEME_KEY, THEMES, type Theme } from '@/lib/theme';
import s from './shell.module.css';

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    setTheme(parseTheme(localStorage.getItem(THEME_KEY)));
  }, []);

  function pick(t: Theme) {
    setTheme(t);
    try {
      if (t === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, t);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
    if (t === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }

  return (
    <span className={s.theme} role="group" aria-label="Theme">
      {THEMES.map((t, i) => (
        <span key={t}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <button type="button" onClick={() => pick(t)} aria-pressed={theme === t} className={theme === t ? s.on : ''}>
            {t}
          </button>
        </span>
      ))}
    </span>
  );
}
