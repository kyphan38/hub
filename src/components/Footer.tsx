import ThemeSwitch from './ThemeSwitch';
import s from './shell.module.css';

export default function Footer() {
  return (
    <footer className={s.footer}>
      <span>built for one · 2026 · <a href="https://github.com/kyphan38" target="_blank" rel="noopener">github ↗</a></span>
      <ThemeSwitch />
    </footer>
  );
}
