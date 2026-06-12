import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO, addDays, prettyDay, WEEKDAYS } from '../lib/date'
import { dayCoverage, weekCoverage } from '../lib/coverage'
import { Card } from './ui'

const dot = (s: number) => (s >= 0.99 ? cat('green') : s >= 0.5 ? cat('yellow') : s > 0 ? cat('peach') : cat('surface1'))

/**
 * Daily coverage summary: how complete yesterday was (and exactly what was
 * missed), plus a 7-day strip so the user sees the week at a glance. Lives on
 * Today. Hidden until there are habits/metrics to cover.
 */
export function CoverageCard() {
  const { data } = useJournal()
  const today = todayISO()
  const yesterday = addDays(today, -1)
  const y = dayCoverage(data, yesterday)
  const week = weekCoverage(data, today, 7)

  // Nothing to summarise yet (no habits and never logged mood).
  if (data.habits.length === 0 && !data.metrics.some((m) => m.mood != null)) return null

  const weekScore = Math.round((week.reduce((a, d) => a + d.score, 0) / week.length) * 100)
  const items: { label: string; ok: boolean }[] = [
    { label: y.habits.total ? `Habits ${y.habits.done}/${y.habits.total}` : 'No habits due', ok: y.habits.total === 0 || y.habits.done === y.habits.total },
    { label: 'Journaled', ok: y.journaled },
    { label: 'Mood check-in', ok: y.moodLogged },
    { label: 'Workout', ok: y.workout },
  ]

  return (
    <Card
      title="Daily coverage"
      subtitle="What you covered yesterday — and the week so far"
      right={<span className="text-xs text-overlay0">week {weekScore}%</span>}
    >
      {/* Yesterday's checklist. */}
      <div className="mb-3 flex flex-wrap gap-2">
        {items.map((it) => (
          <span
            key={it.label}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
            style={{ background: (it.ok ? cat('green') : cat('peach')) + '22', color: it.ok ? cat('green') : cat('peach') }}
          >
            {it.ok ? '✓' : '○'} {it.label}
          </span>
        ))}
      </div>

      {y.habits.missed.length > 0 && (
        <p className="mb-3 text-xs text-subtext0">
          <span className="text-peach">Missed yesterday:</span> {y.habits.missed.join(', ')}
        </p>
      )}

      {/* 7-day coverage strip. */}
      <div className="flex gap-1.5">
        {week.map((d) => {
          const isToday = d.date === today
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${prettyDay(d.date)}: ${Math.round(d.score * 100)}% covered`}>
              <div className="h-8 w-full rounded" style={{ background: dot(d.score), opacity: isToday ? 1 : 0.85, outline: isToday ? `1px solid ${cat('mauve')}` : 'none' }} />
              <span className="text-[10px] text-overlay0">{WEEKDAYS[new Date(d.date + 'T00:00').getDay()]}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
