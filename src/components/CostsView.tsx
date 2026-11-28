import BarList from './BarList';
import DailyChart from './DailyChart';
import MonthsChart from './MonthsChart';
import Footer from './Footer';
import Nav from './Nav';
import s from './costs.module.css';
import shell from './shell.module.css';
import {
  dayLabel, formatPct, formatVnd, groupOf, GROUP_LABEL, GROUPS, monthName, shiftMonth, shortVnd, type Summary,
} from '@/lib/costs/summary';

export type CostsData = { summary: Summary; billingReady: boolean; loadedThrough?: string | null; failedApps: string[]; fetchedAt: number };

const GROUP_COLOR = { gemini: 'var(--c-gemini)', storage: 'var(--c-storage)', other: 'var(--c-other)' };

function ago(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  return `${Math.round(min / 60)} h ago`;
}

export default function CostsView({ data, onRefresh, onSignOut }: { data: CostsData; onRefresh: () => void; onSignOut: () => void }) {
  const { summary: m, failedApps } = data;
  // Billing counts only once it has reached this month; before that it would show a false ₫0.
  const billingReady = data.billingReady && m.lastDay !== null;
  const filling = data.billingReady && m.lastDay === null;
  const prevName = monthName(shiftMonth(m.month, -1));
  const usdOnly = m.apps.length > 0 && m.apps.every((a) => a.vnd === 0);

  return (
    <div className={shell.wrap}>
      <Nav
        current="costs"
        right={
          <>
            {m.lastDay && <span>billing through {dayLabel(m.lastDay)}</span>}
            <span>updated {ago(Date.now() - data.fetchedAt)}</span>
            <button type="button" onClick={onRefresh}>refresh</button>
            <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener">open billing</a>
            <button type="button" onClick={onSignOut}>sign out</button>
          </>
        }
      />
      <main>
      {!data.billingReady && (
        <p className={s.empty}>Billing export has no data yet. It shows up a few hours after export is turned on.</p>
      )}
      {filling && (
        <p className={s.empty}>
          Billing export is still loading old days
          {data.loadedThrough ? `, now at ${dayLabel(data.loadedThrough)}` : ''}. This month shows up when it gets here.
        </p>
      )}

      {billingReady && (
        <>
          <div className={`${s.kpis} num`}>
            <div className={s.kpi}>
              <div className={s.kpiLabel}>This month</div>
              <div className={s.kpiValue}>{formatVnd(m.total)}</div>
              <div className={s.kpiSub}>{m.totalUsd !== null ? `about $${m.totalUsd.toFixed(2)}` : ' '}</div>
            </div>
            <div className={s.kpi}>
              <div className={s.kpiLabel}>Forecast</div>
              <div className={s.kpiValue}>{shortVnd(m.forecast)}</div>
              <div className={s.kpiSub}>at the last 7 days&apos; pace</div>
            </div>
            <div className={s.kpi}>
              <div className={s.kpiLabel}>vs {prevName}</div>
              <div className={s.kpiValue}>{formatPct(m.changePct)}</div>
              <div className={s.kpiSub}>same days: {shortVnd(m.prevSame)}</div>
            </div>
            <div className={s.kpi}>
              <div className={s.kpiLabel}>Budget {shortVnd(m.budget)}</div>
              <div className={`${s.kpiValue} ${m.budgetPct >= 100 ? s.over : ''}`}>
                {Math.round(m.budgetPct)}%{m.budgetPct >= 100 ? ' over' : ''}
              </div>
              <div className={s.track}><div className={s.fill} style={{ width: `${Math.min(m.budgetPct, 100)}%` }} /></div>
            </div>
          </div>

          {m.insights.length > 0 && (
            <>
              <h2 className={s.h}>Worth a look</h2>
              {m.insights.map((i) => (
                <div key={i.text} className={s.insight}>
                  <span className={s.tag}>{i.tag}</span>
                  <span className={i.tag === 'over' ? s.over : ''}>{i.text}</span>
                </div>
              ))}
            </>
          )}

          <h2 className={s.h}>Per day</h2>
          <div className={`${s.legend} num`}>
            {GROUPS.map((g) => (
              <span key={g}><span className={s.sw} style={{ background: GROUP_COLOR[g] }} />{GROUP_LABEL[g]} {shortVnd(m.groupTotals[g])}</span>
            ))}
            <span><span className={s.sw} style={{ background: 'var(--c-forecast)' }} />Forecast</span>
          </div>
          <DailyChart days={m.daily} />
        </>
      )}

      <div className={s.two}>
        {billingReady && (
          <div>
            <h2 className={s.h}>By service</h2>
            <BarList
              items={m.services.map((x) => ({
                name: x.name, value: x.total, label: shortVnd(x.total), side: formatPct(x.changePct), color: GROUP_COLOR[groupOf(x.name)],
              }))}
            />
            {m.topup > 0 && <p className={`${s.note} num`}>AI Studio top-up {shortVnd(m.topup)}, not counted</p>}
          </div>
        )}
        <div>
          <h2 className={s.h}>Gemini by app <span className={s.dim} style={{ fontWeight: 400 }}>estimate</span></h2>
          {m.apps.length === 0 ? (
            <p className={s.empty}>No AI calls logged this month.</p>
          ) : (
            <BarList
              items={m.apps.map((a) => ({
                name: a.app, value: a.usd, label: usdOnly ? `$${a.usd.toFixed(2)}` : shortVnd(a.vnd), side: `${Math.round(a.share)}%`, color: 'var(--c-gemini)',
              }))}
            />
          )}
          {m.gapPct !== null && (
            <p className={`${s.note} num`}>
              estimate {shortVnd(m.aiEstimate)} · billing {shortVnd(m.aiBilled)} · {formatPct(m.gapPct)}
            </p>
          )}
          {failedApps.length > 0 && <p className={s.note}>Could not read: {failedApps.join(', ')}</p>}
        </div>
      </div>

      {billingReady && (
        <>
          {m.models.length > 0 && (
            <>
              <h2 className={s.h}>Gemini by model <span className={s.dim} style={{ fontWeight: 400 }}>all keys</span></h2>
              <BarList
                items={m.models.map((x) => ({
                  name: x.name, value: x.total, label: shortVnd(x.total), side: formatPct(x.changePct), color: 'var(--c-gemini)',
                }))}
              />
            </>
          )}

          <h2 className={s.h}>Last 6 months</h2>
          <MonthsChart months={m.months} />

          <h2 className={s.h}>By project</h2>
          <BarList
            items={m.projects.map((p) => ({
              name: p.name, value: p.total, label: shortVnd(p.total), side: formatPct(p.changePct), color: 'var(--faint)',
            }))}
          />
        </>
      )}
      </main>
      <Footer />
    </div>
  );
}
