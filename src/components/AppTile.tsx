import type { AppItem } from '@/lib/apps';
import s from './home.module.css';

export default function AppTile({ app }: { app: AppItem }) {
  return (
    <a className={s.tile} href={app.href} target="_blank" rel="noopener">
      <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: app.icon }} />
      <span className={s.body}>
        <span className={s.name}>{app.name}</span>
        <span className={s.desc}>{app.desc}</span>
        <span className={s.domain}>{app.domain}</span>
      </span>
      <span className={s.arrow} aria-hidden="true">→</span>
    </a>
  );
}
