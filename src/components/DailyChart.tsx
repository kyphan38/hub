import { dayLabel, formatVnd, GROUP_LABEL, GROUPS, shortVnd, type DayBar } from '@/lib/costs/summary';
import s from './costs.module.css';

const W = 24;
const H = 180;
const PAD_L = 44;
const COLOR = { gemini: 'var(--c-gemini)', storage: 'var(--c-storage)', other: 'var(--c-other)' };

/** Stacked bars per day; days after the last billing day show the forecast in gray. */
export default function DailyChart({ days }: { days: DayBar[] }) {
  const totals = days.map((d) => GROUPS.reduce((a, g) => a + Math.max(0, d.values[g]), 0) + d.forecast);
  const max = Math.max(...totals, 1);
  const width = PAD_L + days.length * W;
  const y = (v: number) => (v / max) * H;
  // No gridline labels when every day is zero (they would read ₫1).
  const ticks = Math.max(...totals) > 0 ? [max / 2, max] : [];
  return (
    <svg className={s.chart} viewBox={`0 0 ${width} ${H + 22}`} role="img" aria-label="Cost per day this month">
      {ticks.map((t) => (
        <g key={t}>
          <line className={s.grid} x1={PAD_L} x2={width} y1={H - y(t)} y2={H - y(t)} />
          <text x={PAD_L - 6} y={H - y(t) + 4} textAnchor="end">{shortVnd(t)}</text>
        </g>
      ))}
      {days.map((d, i) => {
        const x = PAD_L + i * W + 4;
        let top = H;
        const parts = [
          ...GROUPS.map((g) => ({ key: g, v: Math.max(0, d.values[g]), color: COLOR[g] })),
          { key: 'forecast', v: d.forecast, color: 'var(--c-forecast)' },
        ].filter((p) => y(p.v) >= 0.5);
        const tip = d.forecast > 0
          ? `${dayLabel(d.day)} forecast ${formatVnd(d.forecast)}`
          : [dayLabel(d.day), ...GROUPS.filter((g) => d.values[g] >= 1).map((g) => `${GROUP_LABEL[g]} ${formatVnd(d.values[g])}`)].join('\n');
        const dom = Number(d.day.slice(8));
        return (
          <g key={d.day} className={s.day}>
            <title>{tip}</title>
            <rect x={x - 4} y={0} width={W} height={H} fill="transparent" />
            {parts.map((p, j) => {
              const h = y(p.v);
              top -= h;
              const gap = j > 0 ? 1 : 0;
              return <rect key={p.key} x={x} y={top + gap} width={W - 8} height={Math.max(h - gap, 0.5)} fill={p.color} rx={j === parts.length - 1 ? 2 : 0} />;
            })}
            {(dom === 1 || dom % 5 === 0) && (
              <text x={x + (W - 8) / 2} y={H + 16} textAnchor="middle">{dom === 1 ? dayLabel(d.day) : dom}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
