import { Icon as AppIcon } from '@/components/Icon'
import { ArrowLineUp, Barbell, CheckSquare, ListChecks, Timer, Flame } from '@/components/icons'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { cat } from '../lib/colors'
import { todayISO, prettyDay, WEEKDAYS, addDays } from '../lib/date'
import { dayCompletion, habitStreak } from '../lib/stats'
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

  // Program progress (days fully checked off), for EVERY built-in program.
  //
  // This used to look up `pullup-zero` by id and nothing else, so the 12-week
  // hypertrophy block never reached Today no matter how far through it you
  // were — a gap that only got more obvious once it became a Body tab of its
  // own. `Goals` already loops `PROGRAMS`; this now matches it.
  //
  // Rest days are excluded from the total for the same reason Goals excludes
  // them: a day with no exercises can never be completed, so counting it made
  // 100% unreachable. That bug was fixed on Goals and left here.
  const done = data.settings.programDone ?? []
  const programs = PROGRAMS.map((p) => {
    let dayDone = 0
    let dayTotal = 0
    for (const w of p.weeks) for (const d of w.days) {
      if (!d.exercises.length) continue
      dayTotal++
      if (d.exercises.every((_, i) => done.includes(`${p.id}-w${w.week}d${d.day}-e${i}`))) dayDone++
    }
    return { p, dayDone, dayTotal }
  }).filter(({ dayDone, dayTotal }) => dayDone > 0 && dayDone < dayTotal)

  const chips: { label: string; color: string; icon: typeof CheckSquare; to: Parameters<typeof navigate>[0]; done: boolean }[] = [
    { label: habitsLeft > 0 ? `${habitsLeft} habit${habitsLeft === 1 ? '' : 's'} left` : 'Habits done', color: 'green', icon: CheckSquare, to: 'trackers', done: cov.total > 0 && habitsLeft === 0 },
    { label: workedOut ? 'Workout logged' : 'No workout yet', color: 'teal', icon: Barbell, to: 'fitness', done: workedOut },
    { label: tasksDue > 0 ? `${tasksDue} task${tasksDue === 1 ? '' : 's'} due` : 'Tasks clear', color: 'mauve', icon: ListChecks, to: 'plan', done: tasksDue === 0 },
  ]
  // Short labels and destinations are keyed by program id, the same two-way
  // split `ProgramTracker` and `Goals` use. A third program would need a line
  // here — the chip has room for a word, not for "12-Week Hypertrophy Block".
  for (const { p, dayDone, dayTotal } of programs) {
    const isPullup = p.id === 'pullup-zero'
    chips.push({
      label: `${isPullup ? 'Pull-ups' : 'Hypertrophy'} ${dayDone}/${dayTotal}`,
      color: 'peach',
      icon: isPullup ? ArrowLineUp : Barbell,
      to: isPullup ? 'pullups' : 'program',
      done: false,
    })
  }
  if (focusMin > 0) chips.push({ label: `${focusMin}m focused`, color: 'lavender', icon: Timer, to: 'focus', done: true })

  // Week-at-a-glance (folded in from the old Coverage card to keep Today to one
  // summary card · avoids the "crowded Today" con from DECISIONS D-34).
  const week = weekCoverage(data, today, 7)
  const weekScore = Math.round((week.reduce((a, d) => a + d.score, 0) / week.length) * 100)

  return (
    <Card band title="Today’s plan" hideInfo right={<span className="text-label text-fg-2">week {weekScore}%</span>}>
      {atRisk.length > 0 && (
        <button onClick={() => navigate('trackers')} className="mb-3 flex w-full items-center gap-2 rounded-control border px-3 py-2 text-left text-body" style={{ borderColor: cat('peach') + '66', background: cat('peach') + '14', color: cat('peach') }}>
          <AppIcon as={Flame} size="sm" /> {atRisk.length === 1 ? `Your ${habitStreak(data, atRisk[0].id, addDays(today, -1))}-day ${atRisk[0].name} streak is at risk today` : `${atRisk.length} streaks at risk today`} · tap to keep them alive
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const Icon = c.icon
          return (
            <button
              key={c.label}
              onClick={() => navigate(c.to)}
              className="press-3d inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-body"
              style={{ borderColor: cat(c.color) + '55', background: cat(c.color) + (c.done ? '14' : '22'), color: c.done ? cat('overlay1') : cat(c.color) }}
            >
              <AppIcon as={Icon} size="sm" /> {c.label}{c.done ? ' ✓' : ''}
            </button>
          )
        })}
      </div>
      {/* WEEK STRIP · height carries the score, colour repeats it.

          This was seven fixed-height blocks tinted from a three-bucket scale,
          which reads as "seven identical bars" for any week where the days
          land in one bucket — on a real journal that is most weeks, and it
          took loading demo data to see it. A chart whose marks are all the
          same size is not a chart.

          Height is the primary encoding now (position/length beats colour for
          comparing magnitudes), with a 2px floor so a zero day still shows
          where it sits rather than vanishing into the track. Colour stays as
          the redundant cue, which is what keeps it readable for anyone who
          cannot separate the hues. */}
      <div
        className="mt-3 flex gap-1.5 border-t border-line pt-3"
        role="img"
        aria-label={`Coverage this week: ${week.map((d) => `${WEEKDAYS[new Date(d.date + 'T00:00').getDay()]} ${Math.round(d.score * 100)}%`).join(', ')}`}
      >
        {week.map((d) => {
          const pct = Math.round(d.score * 100)
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${prettyDay(d.date)}: ${pct}% covered`}>
              <div
                className="flex h-10 w-full items-end rounded"
                style={{ background: cat('surface1') + '80', outline: d.date === today ? `1px solid ${cat('mauve')}` : 'none' }}
              >
                <div
                  className="w-full rounded transition-[height] duration-300"
                  style={{
                    height: `max(2px, ${pct}%)`,
                    background: d.score >= 0.99 ? cat('green') : d.score >= 0.5 ? cat('yellow') : d.score > 0 ? cat('peach') : cat('surface1'),
                  }}
                />
              </div>
              {/* The number, because height alone cannot separate a lived-in
                  week. A real journal sits between 70% and 100%, and across a
                  32px track that whole range was 9px — seven bars that looked
                  identical for the second pass running. A taller track buys
                  resolution; printing the value ends the argument. */}
              <span className="text-micro tabular-nums text-fg-2">{pct}</span>
              <span className="text-micro text-fg-2">{WEEKDAYS[new Date(d.date + 'T00:00').getDay()]}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
