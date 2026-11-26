import { dayLabel } from '@/lib/costs/summary';
import type { HeatDay } from '@/lib/today/summary';
import s from './home.module.css';

/** Last 30 days: full days in ink, partial days gray, empty days hollow. */
export default function Heat({ days, total }: { days: HeatDay[]; total: number }) {
  return (
    <span className={s.heat} role="img" aria-label={`Last ${days.length} days, ${days.filter((d) => d.count === total).length} full`}>
      {days.map((d) => (
        <span
          key={d.day}
          title={`${dayLabel(d.day)}: ${d.count}/${total}`}
          className={d.count === total ? s.full : d.count > 0 ? s.part : s.none}
        />
      ))}
    </span>
  );
}
