import { Drop, Flame, ForkKnife, NotePencil } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { addDays, prettyDay, todayISO } from '../lib/date'
import { Card, Empty, Input, Slider } from '../components/ui'
import { Button } from '../components/ui/button'
import { Page, useCursor } from '../components/shell/Page'
import { CaptureBar } from '../components/CaptureBar'
import { FastingCard } from '../components/FastingCard'
import { EntryRow } from '../components/EntryRow'
import { ImageUpload } from '../components/ImageUpload'
import { PenaltyCard } from '../components/PenaltyCard'
import { TodayPlanCard } from '../components/TodayPlanCard'
import { TodayHabits } from '../components/TodayHabits'
import { CoachCard } from '../components/CoachCard'
import { onThisDay, habitTarget, habitValueOn, habitDoneOn } from '../lib/stats'
import { isScheduledOn } from '../lib/habitStats'
import { atRiskHabits, weeklyGoalProgress } from '../lib/streak'
import { cat } from '../lib/colors'
import { promptForDay } from '../lib/prompts'

export function Today() {
  const { data, setMetric, setGratitude, setMemory, migrateEntry } = useJournal()
  const { day: date } = useCursor()

  const dayEntries = data.entries.filter((e) => e.date === date && !e.collection)
  const doneCount = dayEntries.filter((e) => e.type === 'task' && e.status === 'done').length
  const taskCount = dayEntries.filter((e) => e.type === 'task' && e.status !== 'dropped').length
  // Yesterday's unfinished tasks, offered to carry forward onto this day.
  const carryover = data.entries.filter(
    (e) => e.date === addDays(date, -1) && e.type === 'task' && e.status === 'open' && !e.collection,
  )
  const metric = data.metrics.find((m) => m.date === date)
  const gratitude = data.gratitude.find((g) => g.date === date)?.text ?? ''
  const memoryRec = data.memories.find((m) => m.date === date)
  const memory = memoryRec?.text ?? ''
  const flashbacks = onThisDay(data, date)
  const hidden = data.settings.hideToday ?? []
  const hasFlash = flashbacks.entries.length + flashbacks.memories.length > 0

  return (
    /* THREE COLUMNS, WEIGHTED — not three equal columns.
     *
     * Today was one 820px stack, so the log (the reason the page exists) sat
     * below a screenful of cards on a wide display, and every card got the same
     * width whether it was the day's writing surface or a collapsed appendix.
     *
     * The layout now states the weight instead of implying it:
     *
     *   weight 1 · the day's command centre — full width, above everything
     *   weight 2 · the log, at **two** of three tracks: it is where you write,
     *              and a 370px measure is not a writing surface
     *   weight 3 · the rail — logging you tap rather than type, then the quiet
     *              reference cards, at one track
     *
     * It collapses to a single column below xl, in the same reading order.
     */
    <Page width="wide">
      {/* ── WEIGHT 1 · full width. Plan, coach and penalty are the "what should
             I do today" band, and they read across the whole page. ───────── */}
      {/* ── Today's plan: one daily command-centre (chips + week strip) ─ */}
      {date === todayISO() && !hidden.includes('plan') && <TodayPlanCard />}

      {/* ── Coach: proactive "do this next" prompts from your data ── */}
      {date === todayISO() && <CoachCard />}

      {/* ── Penalty for yesterday's skips (only when relevant) ──── */}
      {date === todayISO() && !hidden.includes('penalty') && <PenaltyCard />}

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-3">
        {/* ── WEIGHT 2 · the writing surface, two tracks wide ──────────── */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:col-span-2">
      {/* ── 3) The day: Daily log (primary, above the fold) ─────── */}
          <Card
            title={prettyDay(date)}
            subtitle={
              <span className="flex items-center gap-2">
                {date === todayISO() ? 'Today' : ''}
                {metric?.weather && (
                  <span title={metric.weather.label}>
                    {metric.weather.icon} {metric.weather.tempC}°C
                  </span>
                )}
              </span>
            }
          >
            <div className="mb-3">
              <CaptureBar date={date} />
            </div>
            {carryover.length > 0 && (
              <div className="mb-3 flex items-center justify-between rounded-card border border-line bg-background px-3 py-2 text-body">
                <span className="text-fg-1">{carryover.length} unfinished task{carryover.length === 1 ? '' : 's'} from yesterday</span>
                <Button variant="secondary" onClick={() => carryover.forEach((e) => migrateEntry(e.id, date))} className="press-3d rounded-control">Carry forward</Button>
              </div>
            )}
            {dayEntries.length === 0 ? (
              <Empty
                icon={NotePencil}
                hint="Rapid-log it: • task, ○ event, – note. Type it the way you'd say it — “gym 7am”, “call mum”."
                action={{
                  label: 'Start writing',
                  onClick: () =>
                    document.querySelector<HTMLInputElement>('input[aria-label="Smart capture"]')?.focus(),
                }}
              >
                Nothing logged for this day
              </Empty>
            ) : (
              <>
                <ul>
                  {dayEntries.map((e) => (
                    <EntryRow key={e.id} entry={e} />
                  ))}
                </ul>
                {taskCount > 0 && (
                  <p className="mt-2 text-right text-label text-fg-2">{doneCount}/{taskCount} tasks done</p>
                )}
              </>
            )}
          </Card>

          {/* ── 4) Reflect (2-col): light daily journaling rituals ─── */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Card title="Gratitude" subtitle="One thing you're grateful for today">
              <Input
                value={gratitude}
                onChange={(e) => setGratitude(date, e.target.value)}
                placeholder="Today I'm grateful for…"
              />
            </Card>

            {data.settings.reflectionPrompts && (
              <Card title="Reflection" subtitle={promptForDay(date)}>
                <textarea
                  key={`reflect-${date}`}
                  defaultValue=""
                  placeholder="Write a few honest lines…"
                  onBlur={(e) =>
                    e.target.value.trim() &&
                    setMemory(date, { text: `${memory ? memory + ' · ' : ''}${e.target.value.trim()}` })
                  }
                  rows={3}
                  className="w-full rounded-control border border-input bg-background px-3 py-2 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                />
                <p className="mt-1 text-label text-fg-2">Saved into today's memory on blur.</p>
              </Card>
            )}

            <Card title="Daily memory" subtitle="One line to remember this day by">
              <Input
                value={memory}
                onChange={(e) => setMemory(date, { text: e.target.value })}
                placeholder="A single memorable moment…"
              />
              <div className="mt-3">
                <ImageUpload
                  value={memoryRec?.photo}
                  onChange={(photo) => setMemory(date, { photo })}
                  label="Add a photo of the day"
                  className={memoryRec?.photo ? 'taped' : ''}
                />
              </div>
            </Card>

          </div>
          {/* ── 6) Memories (collapsed): on this day from earlier journals ─ */}
          {hasFlash && !hidden.includes('onThisDay') && (
            <Card title="On this day" subtitle="From earlier in your journal" collapsible defaultCollapsed>
              <ul className="space-y-2 text-body">
                {flashbacks.memories.map((m) => (
                  <li key={m.date} className="text-fg-1">
                    <span className="text-fg-2">{m.date}</span> · ▲ {m.text}
                  </li>
                ))}
                {flashbacks.entries.slice(0, 5).map((e) => (
                  <li key={e.id} className="text-fg-1">
                    <span className="text-fg-2">{e.date}</span> · {e.text}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* ── WEIGHT 3 · the rail: tap-not-type logging, then quiet cards ── */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      {/* ── 2) Daily actions: one unified habit block — boolean check-offs,
             count/timer steppers, and at-risk streak chips sit together,
             then Wellbeing logging and the gated Fasting card. ──────── */}
      {date === todayISO() && (
        <section className="flex flex-col gap-3">
          {/* Quick-check today's check habits without leaving Today */}
          {!hidden.includes('habits') && <TodayHabits />}
          {/* Count/timer habits: +/- quick adjust */}
          {!hidden.includes('habits') && <TodayCountHabits date={date} />}
          {/* At-risk streak nudge: don't break a live streak */}
          <AtRiskNudge date={date} />
        </section>
      )}

      {/* ── Wellbeing: mood/sleep/energy logging is a primary daily action ─ */}
      <Card title="Wellbeing" subtitle="Rate today 0–10">
        <div className="space-y-4">
          <Slider label="Mood" value={metric?.mood} onChange={(v) => setMetric(date, { mood: v })} color="green" hint="0 low · 10 great" />
          <Slider label="Stress" value={metric?.stress} onChange={(v) => setMetric(date, { stress: v })} color="red" hint="0 calm · 10 high" />
          <Slider label="Sleep (hrs)" value={metric?.sleep} onChange={(v) => setMetric(date, { sleep: v })} color="blue" />
          <Slider label="Energy" value={metric?.energy} onChange={(v) => setMetric(date, { energy: v })} color="peach" hint="0 drained · 10 energized" />
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-body text-fg-1">First meal</p>
          {/* These record a choice, so the selected one gets the accent wash
              rather than the accent fill — a filled pill here read as the
              screen's primary action, which it never was. */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              aria-pressed={metric?.fastBreak === 'food'}
              onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === 'food' ? undefined : 'food' })}
              className={`press-3d inline-flex items-center gap-1.5 rounded-control ${metric?.fastBreak === 'food' ? 'bg-brand-wash font-medium text-brand' : ''}`}
            >
              <Icon as={ForkKnife} size="sm" /> Food
            </Button>
            <Button
              variant="ghost"
              aria-pressed={metric?.fastBreak === 'drink'}
              onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === 'drink' ? undefined : 'drink' })}
              className={`press-3d inline-flex items-center gap-1.5 rounded-control ${metric?.fastBreak === 'drink' ? 'bg-brand-wash font-medium text-brand' : ''}`}
            >
              <Icon as={Drop} size="sm" /> Drink
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Fasting: loggable but niche — keep gated to its own card ─ */}
      <FastingCard />

          {/* ── Weekly goal rings: a look back, so it sits under the
                 logging it summarises rather than above it. ─────────── */}
          {date === todayISO() && <WeeklyGoalRings date={date} />}
        </div>
      </div>
    </Page>
  )
}

/**
 * Count/timer habits scheduled today, each with −/+ steppers (and a quick +step)
 * so you can log progress without leaving Today. Reuses the existing
 * setHabitValue store action; values are clamped at 0.
 */
function TodayCountHabits({ date }: { date: string }) {
  const { data, setHabitValue } = useJournal()
  const habits = data.habits.filter(
    (h) => !h.archived && !h.avoid && (h.type === 'count' || h.type === 'timer') && isScheduledOn(h, date),
  )
  if (habits.length === 0) return null
  return (
    <Card title="Count habits" subtitle="Tap −/+ to log your tally for today">
      <ul className="space-y-2">
        {habits.map((h) => {
          const target = habitTarget(h)
          const val = habitValueOn(data, h, date)
          const met = habitDoneOn(data, h, date)
          const step = h.type === 'timer' ? (target >= 20 ? 5 : 1) : 1
          return (
            <li key={h.id} className="flex items-center gap-3 rounded-card border border-line bg-ink-0 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-body text-fg-1">
                {h.emoji ? `${h.emoji} ` : ''}{h.name}
                {h.unit && <span className="text-fg-2"> ({h.unit})</span>}
              </span>
              <span className="text-label tabular-nums" style={{ color: met ? cat('green') : cat('overlay1') }}>
                {val}/{target}{h.type === 'timer' ? 'm' : ''}{met ? ' ✓' : ''}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHabitValue(date, h.id, Math.max(0, val - step))}
                  disabled={val <= 0}
                  aria-label={`Decrease ${h.name}`}
                  className="grid h-7 w-7 place-items-center rounded-pill border border-line-strong text-fg-1 transition-colors hover:text-fg-1 disabled:opacity-30"
                >−</button>
                <button
                  onClick={() => setHabitValue(date, h.id, val + step)}
                  aria-label={`Increase ${h.name}`}
                  className="grid h-7 w-7 place-items-center rounded-pill border text-fg-1 transition-colors"
                  style={{ borderColor: cat(h.color), background: cat(h.color) + '22' }}
                >+</button>
                {step > 1 && (
                  <button
                    onClick={() => setHabitValue(date, h.id, val + step)}
                    aria-label={`Add ${step} to ${h.name}`}
                    className="rounded-pill border border-line-strong px-2 py-0.5 text-caption text-fg-1 transition-colors hover:text-fg-1"
                  >+{step}</button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/** A small "keep your N-day streak — not logged yet" nudge for build habits. */
function AtRiskNudge({ date }: { date: string }) {
  const { data } = useJournal()
  const atRisk = atRiskHabits(data, date)
  if (atRisk.length === 0) return null
  return (
    <Card title="Keep your streaks" subtitle="Scheduled today, streak alive, not logged yet">
      <ul className="flex flex-wrap gap-2">
        {atRisk.map(({ habit, streak }) => (
          <li
            key={habit.id}
            className="inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-label"
            style={{ borderColor: cat('peach') + '66', background: cat('peach') + '12', color: cat('subtext1') }}
          >
            <Icon as={Flame} size="sm" style={{ color: cat('peach') }} />
            {habit.emoji ? `${habit.emoji} ` : ''}{habit.name}
            <span style={{ color: cat('peach') }}>· keep your {streak}-day streak</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Weekly-goal completion rings for habits that set a weeklyGoal. */
function WeeklyGoalRings({ date }: { date: string }) {
  const { data } = useJournal()
  const habits = data.habits.filter((h) => !h.archived && h.weeklyGoal && h.weeklyGoal > 0)
  if (habits.length === 0) return null
  const R = 16
  const C = 2 * Math.PI * R
  return (
    <Card title="Weekly goals" subtitle="This week's completions vs your goal" collapsible defaultCollapsed>
      <div className="flex flex-wrap gap-4">
        {habits.map((h) => {
          const { done, goal, pct } = weeklyGoalProgress(data, h, date, data.settings.weekStart ?? 0)
          const hit = done >= goal
          return (
            <div key={h.id} className="flex flex-col items-center gap-1" style={{ width: 64 }}>
              <span className="relative grid h-12 w-12 place-items-center">
                <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
                  <circle cx="24" cy="24" r={R} fill="none" stroke={cat('surface1')} strokeWidth="4" />
                  <circle
                    cx="24" cy="24" r={R} fill="none"
                    stroke={cat(hit ? 'green' : h.color)} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
                    transform="rotate(-90 24 24)" style={{ transition: 'stroke-dashoffset 0.3s' }}
                  />
                </svg>
                <span className="absolute text-caption font-medium tabular-nums" style={{ color: hit ? cat('green') : cat('subtext1') }}>{done}/{goal}</span>
              </span>
              <span className="max-w-full truncate text-center text-caption text-fg-2" title={h.name}>{h.emoji ? `${h.emoji} ` : ''}{h.name}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
