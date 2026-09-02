import { ArrowLineUp, Barbell, BookOpen, CalendarDot, Flame, PersonSimpleRun, Plus, Sparkle, Target, Trash, Trophy } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input, Pill } from '../components/ui'
import { Button } from '../components/ui/button'
import { Stepper } from '../components/fields/Stepper'
import { Page } from '../components/shell/Page'
import { useNav } from '../components/shell/nav'
import { cat } from '../lib/colors'
import { todayISO, dayDiff, prettyDay, weekColumn } from '../lib/date'
import { goalFraction, goalMet, goalOnPace, goalPace } from '../lib/goals'
import { weeklyActiveMinutes } from '../lib/fitness'
import { pickleTotals } from '../lib/pickleball'
import { finishedThisYear } from '../lib/reading'
import { weeklyHabitCount } from '../lib/stats'
import { PROGRAMS } from '../lib/programs'
import type { ViewId } from '../components/shell/viewChrome'

interface Goal {
  label: string
  detail: string
  value: number
  target: number
  color: string
  icon: typeof Target
  to: ViewId
  /**
   * The target is a **cap**, not a finish line — an avoid habit. Being under it
   * is success, and the bar fills toward failure. Nothing recorded this before
   * COD-48, so "Caffeine 2 of 5" counted as a miss.
   */
  avoid?: boolean
  /**
   * How far through this goal's period we are, 0–1 — the bar the goal should
   * have reached by now. `undefined` for goals with no period at all (a
   * training program, streak-vs-best): those cannot be off pace, and saying so
   * is not the same as saying they are on it.
   */
  elapsed?: number
}

/**
 * One cross-view roll-up of every active goal: weekly habit goals, the fitness
 * active-minutes target, running challenges, training-program completion, and
 * the abstinence streak. Whole-number progress; tap any row to jump to its home.
 */
export function Goals() {
  const { data } = useJournal()
  const navigate = useNav()
  const today = todayISO()
  const goals: Goal[] = []
  // How far through the current week and year we are. A "this week" goal at 2 of
  // 7 on a Wednesday is not behind — it is Wednesday. Without this the page can
  // only say "met", and "1 of 7 met" mid-week reads as a failure that has not
  // happened. `weekColumn` is 0-based, so day 1 of the week is 1/7 elapsed.
  const weekStart = data.settings.weekStart ?? 0
  const weekElapsed = (weekColumn(today, weekStart) + 1) / 7
  const yearElapsed = (dayDiff(`${today.slice(0, 4)}-01-01`, today) + 1) / 365

  // Per-habit weekly goals.
  for (const h of data.habits) {
    if (h.archived || !h.weeklyGoal) continue
    goals.push({
      label: `${h.emoji ? h.emoji + ' ' : ''}${h.name}`,
      detail: h.avoid ? 'this week, at most' : 'this week',
      value: weeklyHabitCount(data, h.id, today),
      target: h.weeklyGoal,
      color: h.color,
      icon: Target,
      to: 'trackers',
      avoid: h.avoid,
      elapsed: weekElapsed,
    })
  }

  // Fitness weekly active minutes.
  const fitGoal = data.settings.fitnessGoalMin ?? 150
  goals.push({
    label: 'Active minutes',
    detail: 'this week',
    value: weeklyActiveMinutes(data, today),
    target: fitGoal,
    color: 'teal',
    icon: PersonSimpleRun,
    to: 'fitness',
    elapsed: weekElapsed,
  })

  // Weekly pickleball games.
  if (data.settings.pickleballGoalGames) {
    goals.push({
      label: 'Pickleball games',
      detail: 'this week',
      value: pickleTotals(data, 7, today).games,
      target: data.settings.pickleballGoalGames,
      color: 'teal',
      icon: Trophy,
      to: 'pickleball',
      elapsed: weekElapsed,
    })
  }

  // Active challenges.
  for (const c of data.challenges ?? []) {
    if (c.archived) continue
    const elapsed = Math.min(c.durationDays, dayDiff(c.startDate, today) + 1)
    if (elapsed < 1) continue
    const completed = Object.entries(data.challengeLog?.[c.id] ?? {}).filter(
      ([, idx]) => idx.length >= c.rules.length,
    ).length
    goals.push({
      label: c.name,
      detail: `${c.durationDays}-day challenge`,
      value: completed,
      target: c.durationDays,
      color: 'mauve',
      icon: Flame,
      to: 'challenges',
      elapsed: elapsed / c.durationDays,
    })
  }

  // Training-program completion.
  const done = data.settings.programDone ?? []
  for (const p of PROGRAMS) {
    // Only count days that actually have exercises · rest/empty days can never
    // be "done", so including them in the target made 100% unreachable.
    const totalDays = p.weeks.reduce((a, w) => a + w.days.filter((d) => d.exercises.length > 0).length, 0)
    const dayDone = p.weeks.reduce(
      (a, w) => a + w.days.filter((d) => d.exercises.length > 0 && d.exercises.every((_, i) => done.includes(`${p.id}-w${w.week}d${d.day}-e${i}`))).length,
      0,
    )
    if (dayDone === 0) continue
    goals.push({
      label: p.name,
      detail: 'program days',
      value: dayDone,
      target: totalDays,
      color: 'green',
      // `home` lives on the program record. It used to be derived here from the
      // id, which is how this row kept pointing at Strength after the
      // hypertrophy block moved to its own Body tab.
      icon: p.home === 'pullups' ? ArrowLineUp : Barbell,
      to: p.home,
    })
  }

  // Yearly reading goal (books finished this year).
  if (data.settings.readingGoalBooks) {
    goals.push({
      label: 'Books read',
      detail: 'this year',
      value: finishedThisYear(data.books ?? [], today),
      target: data.settings.readingGoalBooks,
      color: 'sky',
      icon: BookOpen,
      to: 'reading',
      elapsed: yearElapsed,
    })
  }

  // Abstinence streak vs personal best. On a first streak best may be 0, so
  // treat the effective best as max(best, cur) — the current run becomes the bar.
  if (data.settings.nofapEnabled) {
    const cur = Math.max(0, dayDiff(data.nofap.startedOn, today))
    const best = Math.max(data.nofap.best, cur)
    goals.push({
      label: 'Streak vs. best',
      detail: `${cur} of ${best} days`,
      value: cur,
      target: best,
      color: 'peach',
      icon: Flame,
      to: 'nofap',
    })
  }

  // Three different facts, and two of them used to share the word "on track"
  // (COD-48). Each one now says which question it answers.
  const met = goals.filter((g) => goalMet(g.value, g.target, g.avoid)).length
  // Mean progress across the *reach-a-number* goals only. An avoid goal's
  // fraction is allowance spent, so averaging it in makes a clean week look
  // like a low score — the same inversion the headline had.
  const pacing = goals.filter((g) => !g.avoid)
  const avgPct = pacing.length
    ? Math.round(pacing.reduce((a, g) => a + goalFraction(g.value, g.target), 0) / pacing.length * 100)
    : 0
  // 80–99% means two opposite things. On a reach goal it is "worth a final
  // push"; on a cap it is "you are about to blow it". Counted separately, and
  // labelled as what it is.
  const inBand = (g: Goal) => { const p = goalFraction(g.value, g.target); return p >= 0.8 && p < 1 }
  const nearly = pacing.filter(inBand).length
  const closeToCap = goals.filter((g) => g.avoid && inBand(g)).length
  // On pace: keeping up with the clock, which is a different question from met
  // and the one the reader actually wants mid-week. Only goals with a period
  // can answer it — a training program has no deadline, so it is excluded
  // rather than counted as behind.
  const timed = goals.filter((g) => g.elapsed != null)
  const onPace = timed.filter((g) => goalOnPace(goalFraction(g.value, g.target), g.elapsed!, g.avoid)).length

  const { addCustomGoal, updateCustomGoal, removeCustomGoal } = useJournal()
  const customGoals = data.customGoals ?? []
  const [form, setForm] = useState({ label: '', target: '', unit: '' })
  function add() {
    const label = form.label.trim(); const target = Number(form.target)
    if (!label || !target || target <= 0) return
    addCustomGoal({ label, target, value: 0, unit: form.unit.trim() || undefined, color: 'mauve' })
    setForm({ label: '', target: '', unit: '' })
  }

  return (
    <Page className="gap-0 sm:gap-0">
      {/* "met", not "on track" — see `goalMet`. The list mixes goals you reach
          and caps you stay under, and neither "complete" nor "on track" is true
          for both. "On track" now appears in exactly one place on this page:
          the custom-goal pace pill, where it means a rate. */}
      <Card
        band
        title="Goals"
        subtitle={
          goals.length
            ? `${met} of ${goals.length} met${timed.length ? ` · ${onPace} of ${timed.length} on pace` : ''}`
            : 'Your active targets, all in one place'
        }
      >
        {goals.length === 0 ? (
          <Empty>No goals yet · set a habit weekly goal, start a challenge, or follow a program.</Empty>
        ) : (
          <>
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-none border border-line bg-ink-0 px-3 py-2 text-body">
            <span className="inline-flex items-center gap-1.5 text-fg-1">
              <AppIcon as={Target} size="sm" style={{ color: cat('mauve') }} /> Overall progress
              <span className="font-medium tabular-nums text-fg-1">{avgPct}%</span>
            </span>
            {nearly > 0 && (
              <span className="text-fg-2">{nearly} nearly there <span className="text-fg-2">(80–99%)</span></span>
            )}
            {closeToCap > 0 && (
              <span style={{ color: cat('peach') }}>{closeToCap} close to the cap</span>
            )}
          </div>
          </>
        )}
        {goals.length === 0 ? null : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {goals.map((g, i) => {
              const pct = Math.round(goalFraction(g.value, g.target) * 100)
              // On a cap the bar is allowance *spent*, so a full one is the bad
              // end and green would be a lie. `ok` is the state worth colouring;
              // `reached` is only the tick, which a cap never earns mid-week.
              const ok = goalMet(g.value, g.target, g.avoid)
              const reached = !g.avoid && ok
              const barColor = g.avoid ? (ok ? g.color : 'red') : ok ? 'green' : g.color
              const Icon = g.icon
              return (
                <li key={i}>
                  {/* `h-full` + `mt-auto` so the bars share a baseline across the
                      row. Without it a label that wraps to two lines ("Active
                      minutes") pushed its own bar ~23px below its row-mates and
                      the row read as two rows. Grid stretches the `li`; the
                      button has to take that height for it to mean anything. */}
                  <button onClick={() => navigate(g.to)} className="press-3d flex h-full w-full flex-col text-left">
                    <div className="mb-1 flex items-center gap-2 text-body">
                      <AppIcon as={Icon} size="sm" className="shrink-0" style={{ color: cat(g.color) }} />
                      <span className="min-w-0 font-medium text-fg-1">{g.label}</span>
                      {/* Wraps rather than truncating: `mt-auto` on the bar
                          already holds the baseline, so a second line here
                          costs nothing and "this w…" reads as a bug. */}
                      <span className="min-w-0 text-label text-fg-2">{g.detail}</span>
                      <span className="ml-auto shrink-0 tabular-nums" style={{ color: reached ? cat('green') : cat('subtext1') }}>
                        {g.value}/{g.target}{reached ? ' ✓' : ''}
                      </span>
                    </div>
                    <div className="mt-auto h-2.5 overflow-hidden rounded-none bg-ink-2">
                      <div className="h-full rounded-none transition-all" style={{ width: `${pct}%`, background: cat(barColor) }} />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card band title={<span className="inline-flex items-center gap-2"><AppIcon as={Sparkle} size="md" className="text-mauve" /> Custom goals</span>} subtitle="Your own targets, track anything with manual progress" help="Goals not derived from another view (e.g. ‘Save $500’, ‘Drink 8 glasses’). Use the stepper to update progress; they roll up here.">
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-none border border-line bg-ink-0 p-3">
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Goal (e.g. Save $500)" className="min-w-[10rem] flex-1" aria-label="Goal" />
          <Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Target" className="w-24" aria-label="Target" />
          <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unit" className="w-24" aria-label="Unit" />
          <Button variant="secondary" onClick={add} className="press-3d inline-flex items-center gap-1.5"><AppIcon as={Plus} size="sm" /> Add</Button>
        </div>
        {customGoals.length === 0 ? (
          <Empty>No custom goals yet · add one above to track anything.</Empty>
        ) : (
          <ul className="space-y-3">
            {customGoals.map((g) => {
              const pct = Math.min(100, Math.round((g.value / g.target) * 100))
              const reached = g.value >= g.target
              const shown = Math.min(g.value, g.target)
              // #95/#261: deadline pace + ahead/behind indicator (null when no due).
              const pace = goalPace(g.value, g.target, g.createdAt, g.due, today)
              return (
                <li key={g.id} className="group rounded-none border border-line bg-ink-0 p-3">
                  <div className="mb-1.5 flex items-center gap-2 text-body">
                    <span className="font-medium text-fg-1">{g.label}</span>
                    <span className="ml-auto tabular-nums" style={{ color: reached ? cat('green') : cat('subtext1') }}>{shown}/{g.target}{g.unit ? ` ${g.unit}` : ''}{reached ? ' ✓' : ''}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeCustomGoal(g.id)} aria-label="Remove goal" className="text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red"><AppIcon as={Trash} size="sm" /></Button>
                  </div>
                  <div className="mb-2 h-2.5 overflow-hidden rounded-none bg-ink-2"><div className="h-full rounded-none transition-all" style={{ width: `${pct}%`, background: cat(reached ? 'green' : 'mauve') }} /></div>
                  <Stepper value={g.value} onChange={(v) => updateCustomGoal(g.id, { value: Math.max(0, v ?? 0) })} step={1} min={0} aria-label={`${g.label} progress`} />
                  {/* Deadline + pace (#95/#261) */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-label">
                    <label className="inline-flex items-center gap-1.5 text-fg-2">
                      <AppIcon as={CalendarDot} size="sm" /> Deadline
                      <input
                        type="date"
                        value={g.due ?? ''}
                        onChange={(e) => updateCustomGoal(g.id, { due: e.target.value || undefined })}
                        className="rounded-none border border-line-strong bg-card px-2 py-1 text-foreground"
                        aria-label={`Deadline for ${g.label}`}
                      />
                    </label>
                    {pace && !reached && (
                      pace.pastDue ? (
                        <span className="inline-flex items-center gap-1" style={{ color: cat('red') }}>
                          Past due ({prettyDay(g.due!)}) · {pace.remaining}{g.unit ? ` ${g.unit}` : ''} short
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-fg-1">{pace.perDayNeeded}{g.unit ? ` ${g.unit}` : ''}/day to finish by {prettyDay(g.due!)}</span>
                          <Pill color={pace.onTrack ? 'green' : 'peach'} className="px-1.5 font-medium">
                            {pace.onTrack ? 'on track' : 'behind'}
                          </Pill>
                        </span>
                      )
                    )}
                    {pace && reached && g.due && (
                      <span className="inline-flex items-center gap-1" style={{ color: cat('green') }}>Done ✓ (due {prettyDay(g.due)})</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </Page>
  )
}
