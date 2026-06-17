import { CheckSquare, Dumbbell, ListTodo, ArrowUpToLine, Timer } from 'lucide-react'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { cat } from '../lib/colors'
import { todayISO, prettyDay, WEEKDAYS, addDays } from '../lib/date'
import { dayCompletion, habitStreak } from '../lib/stats'
import { weekCoverage } from '../lib/coverage'
import { PROGRAMS } from '../lib/programs'
import { Card } from './ui'

/**
 * "Today's plan" — a compact daily command-centre. It *summarises and links*
 * (habits left · workout status · tasks due · pull-up program day) instead of
 * re-rendering those views, so the day is actionable from one screen without
 * duplicating the dedicated views (see DECISIONS D-34). Tap a chip to jump in.
 */
export function TodayPlanCard() {
  const { data } = useJournal()
  const navigate = useNav()
  const today = todayISO()

  const cov = dayCompletion(data, today)
  const habitsLeft = cov.total - cov.done

  // Streaks at risk today: scheduled, not yet done, with a ≥3-day run going.
  const dow = new Date(today + 'T00:00').getDay()
  const log = data.habitLog[today] ?? []
  const atRisk = data.habits.filter((h) => {
    if (h.archived || (h.type ?? 'check') !== 'check') return false
    const scheduled = !h.activeDays?.length || h.activeDays.includes(dow)
    if (!scheduled || log.includes(h.id)) return false
    return habitStreak(data, h.id, addDays(today, -1)) >= 3
  })
  const tasksDue = data.entries.filter((e) => e.type === 'task' && e.status === 'open' && e.date && e.date <= today).length
  const workedOut = data.workouts.some((w) => w.date === today) || (data.pickleball ?? []).some((p) => p.date === today)
  const focusMin = (data.devSessions ?? []).filter((s) => s.date === today).reduce((a, s) => a + s.durationMin, 0)

  // Pull-up program progress (days fully checked off).
  const done = data.settings.programDone ?? []
  const pullup = PROGRAMS.find((p) => p.id === 'pullup-zero')
  let pullDone = 0
  let pullTotal = 0
  if (pullup) {
    for (const w of pullup.weeks) for (const d of w.days) {
      pullTotal++
      if (d.exercises.length && d.exercises.every((_, i) => done.includes(`${pullup.id}-w${w.week}d${d.day}-e${i}`))) pullDone++
    }
  }

  const chips: { label: string; color: string; icon: typeof CheckSquare; to: Parameters<typeof navigate>[0]; done: boolean }[] = [
    { label: habitsLeft > 0 ? `${habitsLeft} habit${habitsLeft === 1 ? '' : 's'} left` : 'Habits done', color: 'green', icon: CheckSquare, to: 'trackers', done: cov.total > 0 && habitsLeft === 0 },
    { label: workedOut ? 'Workout logged' : 'No workout yet', color: 'teal', icon: Dumbbell, to: 'fitness', done: workedOut },
    { label: tasksDue > 0 ? `${tasksDue} task${tasksDue === 1 ? '' : 's'} due` : 'Tasks clear', color: 'mauve', icon: ListTodo, to: 'plan', done: tasksDue === 0 },
  ]
  if (pullDone > 0 && pullDone < pullTotal) chips.push({ label: `Pull-ups ${pullDone}/${pullTotal}`, color: 'peach', icon: ArrowUpToLine, to: 'pullups', done: false })
  if (focusMin > 0) chips.push({ label: `${focusMin}m focused`, color: 'lavender', icon: Timer, to: 'focus', done: true })

  // Week-at-a-glance (folded in from the old Coverage card to keep Today to one
  // summary card — avoids the "crowded Today" con from DECISIONS D-34).
  const week = weekCoverage(data, today, 7)
  const weekScore = Math.round((week.reduce((a, d) => a + d.score, 0) / week.length) * 100)

  return (
    <Card title="Today’s plan" subtitle="Your whole day at a glance — tap to jump in" right={<span className="text-xs text-overlay0">week {weekScore}%</span>}>
      {atRisk.length > 0 && (
        <button onClick={() => navigate('trackers')} className="mb-3 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm" style={{ borderColor: cat('peach') + '66', background: cat('peach') + '14', color: cat('peach') }}>
          🔥 {atRisk.length === 1 ? `Your ${habitStreak(data, atRisk[0].id, addDays(today, -1))}-day ${atRisk[0].name} streak is at risk today` : `${atRisk.length} streaks at risk today`} — tap to keep them alive
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const Icon = c.icon
          return (
            <button
              key={c.label}
              onClick={() => navigate(c.to)}
              className="press-3d inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
              style={{ borderColor: cat(c.color) + '55', background: cat(c.color) + (c.done ? '14' : '22'), color: c.done ? cat('overlay1') : cat(c.color) }}
            >
              <Icon size={14} /> {c.label}{c.done ? ' ✓' : ''}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex gap-1.5 border-t border-surface0 pt-3">
        {week.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${prettyDay(d.date)}: ${Math.round(d.score * 100)}% covered`}>
            <div className="h-6 w-full rounded" style={{ background: d.score >= 0.99 ? cat('green') : d.score >= 0.5 ? cat('yellow') : d.score > 0 ? cat('peach') : cat('surface1'), outline: d.date === today ? `1px solid ${cat('mauve')}` : 'none' }} />
            <span className="text-[10px] text-overlay0">{WEEKDAYS[new Date(d.date + 'T00:00').getDay()]}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
