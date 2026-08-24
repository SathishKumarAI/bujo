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
import { todayISO, dayDiff, prettyDay } from '../lib/date'
import { goalPace } from '../lib/goals'
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

  // Per-habit weekly goals.
  for (const h of data.habits) {
    if (h.archived || !h.weeklyGoal) continue
    goals.push({
      label: `${h.emoji ? h.emoji + ' ' : ''}${h.name}`,
      detail: 'this week',
      value: weeklyHabitCount(data, h.id, today),
      target: h.weeklyGoal,
      color: h.color,
      icon: Target,
      to: 'trackers',
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

  const hit = goals.filter((g) => g.value >= g.target).length
  // Read-only roll-up insight: overall average progress and how many goals are
  // in the "nearly there" band (80–99%) so users see what's worth a final push.
  const avgPct = goals.length
    ? Math.round(goals.reduce((a, g) => a + (g.target > 0 ? Math.min(1, g.value / g.target) : 0), 0) / goals.length * 100)
    : 0
  const nearly = goals.filter((g) => {
    const p = g.target > 0 ? g.value / g.target : 0
    return p >= 0.8 && p < 1
  }).length

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
      <Card band title="Goals" subtitle={goals.length ? `${hit} of ${goals.length} on track` : 'Your active targets, all in one place'}>
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
          </div>
          </>
        )}
        {goals.length === 0 ? null : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {goals.map((g, i) => {
              const pct = g.target > 0 ? Math.min(100, Math.round((g.value / g.target) * 100)) : 0
              const reached = g.value >= g.target
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
                      <div className="h-full rounded-none transition-all" style={{ width: `${pct}%`, background: cat(reached ? 'green' : g.color) }} />
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
