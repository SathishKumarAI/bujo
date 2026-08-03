import { Icon as AppIcon } from '@/components/Icon'
import { ArrowLineUp, Barbell, Check, CheckSquare, ListChecks, Timer, Flame } from '@/components/icons'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { cat, catA } from '../lib/colors'
import { todayISO, prettyDay, WEEKDAYS } from '../lib/date'
import { dayCompletion } from '../lib/stats'
import { atRiskHabits } from '../lib/streak'
import { weekCoverage } from '../lib/coverage'
import { PROGRAMS } from '../lib/programs'
import { Card } from './ui'

/**
 * "Today's plan" · a compact daily command-centre. It *summarises and links*
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

  // Streaks at risk today. This used to be a private filter here (check-type
  // habits only, streak ≥ 3) *and* a separate "Keep your streaks" card in
  // Today's rail driven by `atRiskHabits` — the same fact, stated twice, a
  // thousand pixels apart, from two rules that disagreed. The shared helper is
  // the wider of the two (any scheduled non-avoid habit, streak ≥ 2) and it is
  // the tested one, so it wins and the rail card is gone.
  const atRisk = atRiskHabits(data, today)
  // Every open task dated today or earlier: the standing backlog, which is a
  // different number from the log's "n/m logged today" further down the page.
  const openTasks = data.entries.filter((e) => e.type === 'task' && e.status === 'open' && e.date && e.date <= today).length
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
    { label: workedOut ? 'Workout logged' : 'No workout yet', color: 'teal', icon: Barbell, to: 'fitness', done: workedOut },
    { label: openTasks > 0 ? `${openTasks} task${openTasks === 1 ? '' : 's'} open` : 'Tasks clear', color: 'mauve', icon: ListChecks, to: 'plan', done: openTasks === 0 },
  ]
  if (pullDone > 0 && pullDone < pullTotal) chips.push({ label: `Pull-ups ${pullDone}/${pullTotal}`, color: 'peach', icon: ArrowLineUp, to: 'pullups', done: false })
  if (focusMin > 0) chips.push({ label: `${focusMin}m focused`, color: 'lavender', icon: Timer, to: 'focus', done: true })

  // Week-at-a-glance (folded in from the old Coverage card to keep Today to one
  // summary card · avoids the "crowded Today" con from DECISIONS D-34).
  const week = weekCoverage(data, today, 7)
  const weekScore = Math.round((week.reduce((a, d) => a + d.score, 0) / week.length) * 100)

  return (
    <Card title="Today’s plan" subtitle="Your whole day at a glance, tap to jump in" right={<span className="text-label text-fg-2">week {weekScore}%</span>}>
      {atRisk.length > 0 && (
        <button onClick={() => navigate('trackers')} className="mb-3 flex w-full items-center gap-2 rounded-control border px-3 py-2 text-left text-body" style={{ borderColor: catA('peach', 'edge'), background: catA('peach', 'quiet'), color: cat('peach') }}>
          <AppIcon as={Flame} size="sm" /> {atRisk.length === 1 ? `Your ${atRisk[0].streak}-day ${atRisk[0].habit.name} streak is at risk today` : `${atRisk.length} streaks at risk today`} · tap to keep them alive
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const Icon = c.icon
          return (
            <button
              key={c.label}
              onClick={() => navigate(c.to)}
              className="press-3d inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-body max-md:min-h-[44px]"
              style={{ borderColor: catA(c.color, 'edge'), background: catA(c.color, c.done ? 'quiet' : 'wash'), color: c.done ? cat('overlay1') : cat(c.color) }}
            >
              <AppIcon as={Icon} size="sm" /> {c.label}{c.done && <AppIcon as={Check} size="sm" />}
            </button>
          )
        })}
      </div>
      {/* Week at a glance — and it now encodes something.
          Every bar used to be the same height, with only a colour band varying,
          so seven identical pastel blocks read as a loading skeleton rather
          than as data. Height is the day's habit coverage now, off a 28px
          track, with a floor of 3px so a zero day is still a visible tick
          rather than nothing at all. Colour stays as the second channel.

          Today used to be marked with `outline: 1px solid mauve`, invisible
          against a filled bar. It gets a 2px outline held off the bar, *and* a
          bold accented weekday label, so the marker is not carried by colour
          alone. Each day carries its own accessible name; `title` alone reaches
          no screen reader and no touch device. */}
      <div className="mt-3 flex items-end gap-2 border-t border-line pt-3">
        {week.map((d) => {
          const isToday = d.date === today
          const pct = Math.round(d.score * 100)
          return (
            <div
              key={d.date}
              role="img"
              aria-label={`${prettyDay(d.date)}${isToday ? ' (today)' : ''}: ${pct}% covered`}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${prettyDay(d.date)}: ${pct}% covered`}
            >
              <div className="flex h-7 w-full items-end">
                <div
                  className="w-full rounded"
                  style={{
                    height: `${Math.max(3, Math.round(d.score * 28))}px`,
                    background: d.score >= 0.99 ? cat('green') : d.score >= 0.5 ? cat('yellow') : d.score > 0 ? cat('peach') : cat('surface1'),
                    outline: isToday ? `2px solid ${cat('mauve')}` : 'none',
                    outlineOffset: isToday ? '2px' : undefined,
                  }}
                />
              </div>
              <span
                className={`text-micro ${isToday ? 'font-semibold' : 'text-fg-2'}`}
                style={isToday ? { color: cat('mauve') } : undefined}
              >
                {WEEKDAYS[new Date(d.date + 'T00:00').getDay()]}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
