import { Flame } from 'lucide-react'
import { Card, Empty, StatTile } from '../ui'
import { addDays, fromISODay, prettyMonth, WEEKDAYS } from '../../lib/date'
import { cat } from '../../lib/colors'
import { habitStreak, dayCompletion, weekdayConsistency, monthlyCompletion } from '../../lib/stats'
import { longestStreakEver } from '../../lib/streak'
import { perfectDayStats } from '../../lib/habitStats'
import type { JournalData } from '../../lib/types'

/** Extra at-a-glance visualisations: completion heatmap, streak board, weekday bars. */
export function TrackerVisuals({ data, today }: { data: JournalData; today: string }) {
  const active = data.habits.filter((h) => !h.archived)
  if (active.length === 0) return null

  // 13-week completion heatmap (overall ratio per day).
  const WEEKS = 13
  const start = addDays(today, -(WEEKS * 7 - 1))
  const startDow = fromISODay(start).getDay()
  const cells: { date: string; ratio: number | null }[] = []
  for (let i = 0; i < WEEKS * 7; i++) {
    const date = addDays(start, i)
    cells.push({ date, ratio: dayCompletion(data, date).ratio })
  }
  const heatColor = (r: number | null) =>
    r == null ? cat('surface0') : r === 0 ? cat('surface1') : `color-mix(in srgb, ${cat('green')} ${Math.round(25 + r * 75)}%, ${cat('surface1')})`

  // Streak leaderboard (current streak per check-habit) + all-time best (#290).
  const streaks = active
    .filter((h) => (h.type ?? 'check') === 'check')
    .map((h) => ({ h, streak: habitStreak(data, h.id, today), best: longestStreakEver(data, h, today) }))
    .sort((a, b) => b.streak - a.streak || b.best - a.best)
    .slice(0, 8)
  const maxStreak = Math.max(1, ...streaks.map((s) => Math.max(s.streak, s.best)))

  // Weekday consistency (avg completion per weekday, 90d).
  const wd = weekdayConsistency(data, 90, today)

  // Perfect-day analytics across all build check habits (90d window).
  const perfect = perfectDayStats(data, today)

  return (
    <div className="grid items-start gap-5 max-xl:order-last lg:grid-cols-2">
      <Card title="Completion heatmap" subtitle="Last 13 weeks · greener = more habits done that day" className="lg:col-span-2" collapsible>
        <div className="overflow-x-auto">
          <div
            className="grid grid-flow-col gap-1"
            style={{ gridTemplateRows: 'repeat(7, 0.7rem)' }}
            role="img"
            aria-label="Heatmap of daily habit-completion ratio over the last 13 weeks"
          >
            {/* Pad the first column so weekday rows line up. */}
            {Array.from({ length: startDow }).map((_, i) => <span key={`pad${i}`} />)}
            {cells.map((c) => (
              <span key={c.date} title={`${c.date}: ${c.ratio == null ? 'none scheduled' : Math.round(c.ratio * 100) + '%'}`} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: heatColor(c.ratio) }} />
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-overlay0">
          less {[0, 0.25, 0.5, 0.75, 1].map((r) => <span key={r} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: heatColor(r) }} />)} more
        </div>
      </Card>

      <Card title="Streak leaderboard" subtitle="Current streak · faint marker = all-time best">
        {streaks.length === 0 ? (
          <Empty>No check habits yet.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {streaks.map(({ h, streak, best }) => (
              <li key={h.id} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 truncate text-subtext1">{h.emoji ? `${h.emoji} ` : ''}{h.name}</span>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface0">
                  <div className="h-full rounded-full" style={{ width: `${(streak / maxStreak) * 100}%`, background: cat(h.color) }} />
                  {/* All-time best marker (#290): a notch at the personal record. */}
                  {best > streak && (
                    <span aria-hidden title={`best ever: ${best} days`} className="absolute top-0 h-full w-0.5" style={{ left: `calc(${(best / maxStreak) * 100}% - 1px)`, background: cat('peach'), opacity: 0.6 }} />
                  )}
                </div>
                <span className="inline-flex w-14 shrink-0 items-center justify-end gap-0.5 tabular-nums" style={{ color: cat('peach') }} title={`current ${streak} · best ever ${best}`}><Flame size={12} />{streak}<span className="text-overlay0">/{best}</span></span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Monthly trend" subtitle="Avg completion per month · is it climbing?">
        {(() => {
          const months = monthlyCompletion(data, 6, today)
          return (
            <div className="flex items-end justify-between gap-2" style={{ height: 120 }} role="img" aria-label="Bar chart of average habit completion per month over the last 6 months">
              {months.map((m) => (
                <div key={m.ym} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] tabular-nums text-subtext0">{Math.round(m.ratio * 100)}%</span>
                  <div className="flex w-full flex-1 items-end">
                    <div className="w-full rounded-t" style={{ height: `${Math.max(3, m.ratio * 100)}%`, background: cat('green'), opacity: 0.55 + m.ratio * 0.45 }} />
                  </div>
                  <span className="text-[10px] text-overlay0">{prettyMonth(m.ym).slice(0, 3)}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </Card>

      <Card title="Best weekdays" subtitle="Avg completion by day (last 90 days)">
        <div className="flex items-end justify-between gap-1.5" style={{ height: 120 }} role="img" aria-label="Bar chart of average habit completion by weekday over 90 days">
          {wd.map((r, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t" style={{ height: `${Math.max(3, r * 100)}%`, background: cat('mauve'), opacity: 0.5 + r * 0.5 }} title={`${Math.round(r * 100)}%`} />
              </div>
              <span className="text-[10px] text-overlay0">{WEEKDAYS[i]}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Perfect days: every scheduled build habit done. Rewards full days, not single habits. */}
      <Card title="Perfect days" subtitle="Days you completed every scheduled habit (90 days)">
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="perfect days" value={perfect.total} color="green" />
          <StatTile label="current streak" value={perfect.streak} color="peach" />
        </div>
        <p className="mt-2 text-xs text-overlay0">
          {perfect.streak > 0
            ? `You're on a ${perfect.streak}-day run of nailing everything scheduled. Keep it rolling.`
            : 'A perfect day = every scheduled habit done. Clear today to start a streak.'}
        </p>
      </Card>
    </div>
  )
}
