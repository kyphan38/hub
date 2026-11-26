import type { AppItem } from '@/lib/apps';
import s from './home.module.css';

export type TileStatus = 'done' | 'todo' | 'unknown';

const WORD: Record<TileStatus, string> = { done: 'done', todo: 'today', unknown: '?' };

/** One app. Daily apps show their state for today in place of the arrow once it is known. */
export default function AppTile({ app, status }: { app: AppItem; status?: TileStatus }) {
  return (
    <a className={s.tile} href={app.href} target="_blank" rel="noopener">
      <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: app.icon }} />
      <span className={s.name}>{app.name}</span>
      {status ? (
        <span className={`${s.state} ${status === 'todo' ? s.todo : ''}`}>{WORD[status]}</span>
      ) : (
        <span className={s.arrow} aria-hidden="true">→</span>
      )}
    </a>
  );
}
