import { useState } from 'react'
import { Target, Dumbbell, Activity, Flame, ArrowUpToLine, Trophy, BookOpen, Plus, Trash2, Sparkles } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input } from '../components/ui'
import { Stepper } from '../components/fields/Stepper'
import { Page } from '../components/shell/Page'
import { useNav } from '../components/shell/nav'
import { cat } from '../lib/colors'
import { todayISO, dayDiff } from '../lib/date'
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
    icon: Activity,
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
    const totalDays = p.weeks.reduce((a, w) => a + w.days.length, 0)
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
      icon: p.id === 'pullup-zero' ? ArrowUpToLine : Dumbbell,
      to: p.id === 'pullup-zero' ? 'pullups' : 'gym',
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

  // Abstinence streak vs personal best.
  if (data.settings.nofapEnabled && data.nofap.best > 0) {
    const cur = Math.max(0, dayDiff(data.nofap.startedOn, today))
    goals.push({
      label: 'Streak vs. best',
      detail: `${cur} of ${data.nofap.best} days`,
      value: cur,
      target: data.nofap.best,
      color: 'peach',
      icon: Flame,
      to: 'nofap',
    })
  }

  const hit = goals.filter((g) => g.value >= g.target).length

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
    <Page>
      <Card title="Goals" subtitle={goals.length ? `${hit} of ${goals.length} on track` : 'Your active targets, all in one place'}>
        {goals.length === 0 ? (
          <Empty>No goals yet — set a habit weekly goal, start a challenge, or follow a program.</Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {goals.map((g, i) => {
              const pct = Math.min(100, Math.round((g.value / g.target) * 100))
              const reached = g.value >= g.target
              const Icon = g.icon
              return (
                <li key={i}>
                  <button onClick={() => navigate(g.to)} className="press-3d w-full text-left">
                    <div className="mb-1 flex items-center gap-2 text-sm">
                      <Icon size={15} style={{ color: cat(g.color) }} />
                      <span className="font-medium text-text">{g.label}</span>
                      <span className="text-xs text-overlay0">{g.detail}</span>
                      <span className="ml-auto tabular-nums" style={{ color: reached ? cat('green') : cat('subtext1') }}>
                        {g.value}/{g.target}{reached ? ' ✓' : ''}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface0">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cat(reached ? 'green' : g.color) }} />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card title={<span className="inline-flex items-center gap-2"><Sparkles size={18} className="text-mauve" /> Custom goals</span>} subtitle="Your own targets — track anything with manual progress" help="Goals not derived from another view (e.g. ‘Save $500’, ‘Drink 8 glasses’). Use the stepper to update progress; they roll up here.">
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-surface0 bg-base p-3">
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Goal (e.g. Save $500)" className="min-w-[10rem] flex-1" aria-label="Goal" />
          <Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Target" className="w-24" aria-label="Target" />
          <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unit" className="w-24" aria-label="Unit" />
          <Button variant="primary" onClick={add} className="inline-flex items-center gap-1.5"><Plus size={15} /> Add</Button>
        </div>
        {customGoals.length === 0 ? (
          <Empty>No custom goals yet — add one above to track anything.</Empty>
        ) : (
          <ul className="space-y-3">
            {customGoals.map((g) => {
              const pct = Math.min(100, Math.round((g.value / g.target) * 100))
              const reached = g.value >= g.target
              return (
                <li key={g.id} className="group rounded-lg border border-surface0 bg-base p-3">
                  <div className="mb-1.5 flex items-center gap-2 text-sm">
                    <span className="font-medium text-text">{g.label}</span>
                    <span className="ml-auto tabular-nums" style={{ color: reached ? cat('green') : cat('subtext1') }}>{g.value}/{g.target}{g.unit ? ` ${g.unit}` : ''}{reached ? ' ✓' : ''}</span>
                    <button onClick={() => removeCustomGoal(g.id)} aria-label="Remove goal" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red"><Trash2 size={14} /></button>
                  </div>
                  <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-surface0"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cat(reached ? 'green' : 'mauve') }} /></div>
                  <Stepper value={g.value} onChange={(v) => updateCustomGoal(g.id, { value: Math.max(0, v ?? 0) })} step={1} min={0} aria-label={`${g.label} progress`} />
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </Page>
  )
}
