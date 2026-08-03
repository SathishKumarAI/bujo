import { Check, Drop, ForkKnife, NotePencil } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { addDays, prettyDay, todayISO } from '../lib/date'
import { Card, Empty, Input, Pill, Slider } from '../components/ui'
import { Button } from '../components/ui/button'
import { Stepper } from '../components/fields/Stepper'
import { Page, useToday } from '../components/shell/Page'
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
import { weeklyGoalProgress } from '../lib/streak'
import { cat } from '../lib/colors'
import { promptForDay } from '../lib/prompts'

export function Today() {
  const { data, setMetric, setGratitude, setMemory, migrateEntry } = useJournal()
  const date = useToday()

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
     * The first pass at that put plan, coach and penalty in a full-width band
     * above the grid — which measured **917px** on a 1600×1000 viewport, so the
     * log was still below the fold, just for a new reason. Three full-width
     * cards is what `docs/LAYOUT-WEIGHT-ALIGNMENT.md` calls "a screen with three
     * weight-1 cards", i.e. no weight-1 card at all. Only the plan stays up
     * there now: it summarises the whole day, and its week strip is the one
     * thing on this page that genuinely wants the full measure.
     *
     * The layout states the weight instead of implying it:
     *
     *   weight 1 · the band — the day summarised, and what to do about it,
     *              side by side on the SAME 2:1 tracks as everything below
     *   weight 2 · the log FIRST in the wide column: it is where you write, and
     *              a 370px measure is not a writing surface. Penalty sits under
     *              it — guidance is not more urgent than the day it is about.
     *   weight 3 · the rail — logging you tap rather than type, then the quiet
     *              reference cards, at one track
     *
     * The band's 2:1 split is not decoration. Laid out 50/50 it measured 38px
     * shorter, but its divide fell at x=1075 while every column below it split
     * at x=1270 — two competing rhythms on one page, which is the thing
     * `LAYOUT-WEIGHT-ALIGNMENT.md` exists to stop. The tracks now match to the
     * pixel (780 / 380).
     *
     * Known cost, stated rather than hidden: with the coach in the band instead
     * of the wide column, the columns run 952 against 1409. That is worse than
     * the 96px this page reached with the coach below the log, and better than
     * the 756px it started at. Demo data has no count/timer habits; a journal
     * with them narrows the gap, since those cards land in the rail.
     *
     * It collapses to a single column below xl, in the same reading order.
     */
    <Page width="wide">
      {/* ── WEIGHT 1 · the day in brief, and what to do about it, as one band.
             `auto-fit` rather than a fixed two-column track on purpose: both
             cards are conditional — the plan is hideable in settings, and the
             coach returns null when it has nothing to say — and auto-fit
             collapses the empty track so whichever survives spans the full
             width. A fixed `grid-cols-2` would leave a hole. It also drops to
             one column on its own once 34rem per card no longer fits. ────── */}
      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">{date === todayISO() && !hidden.includes('plan') && <TodayPlanCard />}</div>
        <div>{date === todayISO() && <CoachCard />}</div>
      </div>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-3">
        {/* ── WEIGHT 2 · the writing surface, two tracks wide ──────────── */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:col-span-2">
          {/* ── The day: the daily log, first thing on the page ─────── */}
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
                  /* "…logged today", not "…tasks done": the plan card's chip
                     counts every open task dated on or before today, which is a
                     backlog, and two different numbers both labelled "tasks"
                     sat one screen apart. */
                  <p className="mt-2 text-right text-label text-fg-2">{doneCount}/{taskCount} logged today</p>
                )}
              </>
            )}
          </Card>

          {/* ── Penalty for yesterday's skips (only when relevant) ──── */}
          {date === todayISO() && !hidden.includes('penalty') && <PenaltyCard />}

          {/* ── Reflect: the day as you'd describe it — written, or rated ─ */}
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

          {/* ── Memories (collapsed): on this day from earlier journals ─ */}
          {hasFlash && !hidden.includes('onThisDay') && (
            <Card title="On this day" subtitle="From earlier in your journal" collapsible defaultCollapsed>
              <ul className="space-y-2 text-body">
                {flashbacks.memories.map((m) => (
                  /* ▲ is the rapid-logging signifier for a memory (lib/bullets.ts),
                     the same vocabulary as • task and ○ event — notation, not
                     chrome, so it stays a character. */
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
          {/* ── Daily actions: boolean check-offs and count/timer tallies,
                 logged with a tap so they never take you off Today. The
                 at-risk streak nudge used to be a third card here and is
                 now stated once, in the plan card. ─────────────────── */}
          {date === todayISO() && !hidden.includes('habits') && (
            <>
              <TodayHabits />
              <TodayCountHabits date={date} />
            </>
          )}

          {/* ── Wellbeing: four sliders and a two-button choice — tapped and
                 dragged, never typed, which is what the rail is for. ── */}
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
 * Count/timer habits scheduled today, each with a `Stepper` so progress is
 * logged without leaving Today — and, because the stepper keeps a real number
 * input, "8" can be typed in one go instead of tapping `+` eight times.
 *
 * The hand-rolled ± buttons this replaces carried a third `+{step}` button that
 * called `setHabitValue(val + step)` — byte-identical to what `+` beside it
 * already did. It is deleted rather than ported.
 */
function TodayCountHabits({ date }: { date: string }) {
  const { data, setHabitValue } = useJournal()
  const habits = data.habits.filter(
    (h) => !h.archived && !h.avoid && (h.type === 'count' || h.type === 'timer') && isScheduledOn(h, date),
  )
  if (habits.length === 0) return null
  return (
    <Card title="Count habits" subtitle="Tap −/+ or type today's tally">
      <ul className="space-y-2">
        {habits.map((h) => {
          const target = habitTarget(h)
          const val = habitValueOn(data, h, date)
          const met = habitDoneOn(data, h, date)
          const step = h.type === 'timer' ? (target >= 20 ? 5 : 1) : 1
          return (
            <li key={h.id} className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-ink-0 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-body text-fg-1">
                {h.emoji ? `${h.emoji} ` : ''}{h.name}
                {h.unit && <span className="text-fg-2"> ({h.unit})</span>}
              </span>
              <Pill color={met ? 'green' : undefined} tone={met ? 'wash' : 'muted'} className="tabular-nums">
                {met && <Icon as={Check} size="sm" />}
                {val}/{target}{h.type === 'timer' ? 'm' : ''}
              </Pill>
              <Stepper
                value={val}
                onChange={(v) => setHabitValue(date, h.id, Math.max(0, v ?? 0))}
                step={step}
                min={0}
                aria-label={h.name}
              />
            </li>
          )
        })}
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
