import Link from 'next/link';

import s from './shell.module.css';

export type Place = 'apps' | 'links' | 'costs';

const PLACES: { id: Place; href: string }[] = [
  { id: 'apps', href: '/' },
  { id: 'links', href: '/links' },
  { id: 'costs', href: '/costs' },
];

/** hub's nav (DESIGN.md table): top left, sans 13px lowercase, current place in ink. */
export default function Nav({ current, right }: { current: Place; right?: React.ReactNode }) {
  return (
    <header className={s.bar}>
      <nav className={s.nav} aria-label="hub">
        <Link href="/" className={s.brand}>hub</Link>
        <span className={s.places}>
          {PLACES.map((p, i) => (
            <span key={p.id}>
              {i > 0 && <span className={s.sep} aria-hidden="true">·</span>}
              <Link href={p.href} aria-current={p.id === current ? 'page' : undefined} className={p.id === current ? s.here : s.place}>
                {p.id}
              </Link>
            </span>
          ))}
        </span>
      </nav>
      {right && <div className={s.right}>{right}</div>}
    </header>
  );
}
