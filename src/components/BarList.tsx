import s from './costs.module.css';

export type BarItem = { name: string; value: number; label: string; side: string; color: string };

/** Horizontal bars, biggest first, each with its number and a side note. */
export default function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div>
      {items.map((i) => (
        <div key={i.name} className={`${s.row} num`}>
          <span className={s.name} title={i.name}>{i.name}</span>
          <div className={s.bar}>
            <span style={{ width: `${(i.value / max) * 100}%`, background: i.color }} />
          </div>
          <span className={s.r}>{i.label}</span>
          <span className={`${s.r} ${s.dim}`}>{i.side}</span>
        </div>
      ))}
    </div>
  );
}
