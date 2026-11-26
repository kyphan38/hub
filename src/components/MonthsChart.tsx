import { formatVnd, monthName, shortVnd } from '@/lib/costs/summary';
import s from './costs.module.css';

const W = 72;
const H = 110;

/** Six monthly totals; this month in ink, earlier months gray. */
export default function MonthsChart({ months }: { months: { month: string; total: number }[] }) {
  const max = Math.max(...months.map((m) => m.total), 1);
  return (
    <svg className={s.chart} viewBox={`0 0 ${months.length * W} ${H + 36}`} role="img" aria-label="Total cost per month" style={{ maxWidth: 480 }}>
      {months.map((m, i) => {
        const h = Math.max((m.total / max) * H, m.total > 0 ? 1 : 0);
        const last = i === months.length - 1;
        return (
          <g key={m.month}>
            <title>{`${monthName(m.month)} ${formatVnd(m.total)}`}</title>
            <rect x={i * W + 18} y={14 + H - h} width={W - 36} height={h} rx={2} fill={last ? 'var(--ink)' : 'var(--c-forecast)'} />
            <text x={i * W + W / 2} y={10 + H - h} textAnchor="middle">{m.total > 0 ? shortVnd(m.total) : ''}</text>
            <text x={i * W + W / 2} y={H + 30} textAnchor="middle">{monthName(m.month)}</text>
          </g>
        );
      })}
    </svg>
  );
}
