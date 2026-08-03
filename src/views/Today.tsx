import { Drop, Flame, ForkKnife, NotePencil } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { addDays, fromISODay, todayISO } from '../lib/date'
import { Card, Empty, Input, Slider } from '../components/ui'
import { Button } from '../components/ui/button'
import { Page, useCursor } from '../components/shell/Page'
import { CaptureBar } from '../components/CaptureBar'
import { FastingCard } from '../components/FastingCard'
import { EntryRow } from '../components/EntryRow'
import { ImageUpload } from '../components/ImageUpload'
import { Field } from '../components/fields/Field'
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

  const isToday = date === todayISO()

  /** The log itself: dateline, capture box, carry-forward, the day's entries. */
  const dayLog = (
    <Card>
      <DayMasthead
        date={date}
        isToday={isToday}
        weather={metric?.weather}
        entryCount={dayEntries.length}
        openTasks={taskCount - doneCount}
        taskCount={taskCount}
      />
      <div className="mb-3">
        <CaptureBar date={date} />
      </div>
      {carryover.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-line bg-background px-3 py-2 text-body">
          <span className="text-fg-1">{carryover.length} unfinished task{carryover.length === 1 ? '' : 's'} from yesterday</span>
          <Button variant="secondary" onClick={() => carryover.forEach((e) => migrateEntry(e.id, date))} className="press-3d rounded-lg">Carry forward</Button>
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
          {/* The task count used to be repeated here as "1/4 tasks done" while
              the masthead said "3 still open" — the same fact in two framings,
              300px apart. The masthead owns it now. */}
        </>
      )}
    </Card>
  )

  /**
   * WHICH SIDE A CARD GOES ON
   *
   * One rule, applied to every card on this page: **the left column is the
   * journal entry you are writing; the right rail is everything that reports
   * on it or sits beside it.** Weights below are how strongly each card earns
   * its place, and they also set the order within each column.
   *
   * | Card                | Weight | Side  | Why |
   * |---------------------|--------|-------|-----|
   * | Day log + capture   | 10     | left  | The page exists for this |
   * | Today's habits      | 9      | left  | The other thing you tick every day |
   * | Wellbeing           | 8      | left  | Four ratings, part of the entry |
   * | Close the day       | 6      | left  | Gratitude, reflection, memory |
   * | Today's plan        | 7      | right | Orientation, but read-only |
   * | Your coach          | 6      | right | Advice derived from your data |
   * | Training penalty    | 4      | right | Status, conditional, read-only |
   * | Intermittent fasting| 4      | right | A timer widget, not a journal entry |
   * | Weekly goals        | 3      | right | Collapsed, derived |
   * | On this day         | 3      | right | Read-only, from past journals |
   * | Stickers            | 1      | right | Decoration |
   *
   * The rail also fills the ~600px of dead gutter this page used to leave at
   * desktop widths, and it now runs to roughly the column's own length instead
   * of stopping a third of the way down.
   *
   * Undefined on any day but today, so Page falls back to its single-column
   * `read` tier rather than rendering an empty rail.
   */
  const rail = isToday ? (
    <>
      {!hidden.includes('plan') && <TodayPlanCard />}
      <CoachCard />
      {!hidden.includes('penalty') && <PenaltyCard />}
      <FastingCard />
      <WeeklyGoalRings date={date} />
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
    </>
  ) : undefined

  return (
    // `asideFirst` stays off: on phones the rail drops *below* the log, so the
    // capture box is the first thing on the screen at every width.
    <Page aside={rail}>
      {/* ── 1) The day: capture first. This is a bullet journal; writing a line
             is the point of the page, so the log leads and everything that
             summarises it follows. ─────────────────────────────────── */}
      {dayLog}

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
          {/* Every other slider carries its anchors; this one did not, so the
              column of hints had a hole in it and "8" had no stated unit. */}
          <Slider label="Sleep" value={metric?.sleep} onChange={(v) => setMetric(date, { sleep: v })} color="blue" hint="hours slept · 0–10" />
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
              className={`press-3d inline-flex items-center gap-1.5 rounded-lg ${metric?.fastBreak === 'food' ? 'bg-brand-wash font-medium text-brand' : ''}`}
            >
              <Icon as={ForkKnife} size="sm" /> Food
            </Button>
            <Button
              variant="ghost"
              aria-pressed={metric?.fastBreak === 'drink'}
              onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === 'drink' ? undefined : 'drink' })}
              className={`press-3d inline-flex items-center gap-1.5 rounded-lg ${metric?.fastBreak === 'drink' ? 'bg-brand-wash font-medium text-brand' : ''}`}
            >
              <Icon as={Drop} size="sm" /> Drink
            </Button>
          </div>
        </div>
      </Card>

      {/* ── 4) Close the day: one card, three fields.
             This was three separate bordered cards — Gratitude, Reflection and
             Daily memory — each holding a single input, laid out in a two-column
             grid that left one cell empty. Three containers for one act, and
             the emptiest 460px on the page. They are one ritual, so they are
             one card, with each field carrying its own label and prompt. ─── */}
      <Card title="Close the day" subtitle="Three lines, then you're done">
        <div className="space-y-5">
          <Field label="Grateful for" hint="One thing, however small">
            <Input
              value={gratitude}
              onChange={(e) => setGratitude(date, e.target.value)}
              placeholder="Today I'm grateful for…"
            />
          </Field>

          {data.settings.reflectionPrompts && (
            <Field label="Reflection" hint={promptForDay(date)}>
              <textarea
                key={`reflect-${date}`}
                defaultValue=""
                placeholder="Write a few honest lines…"
                onBlur={(e) =>
                  e.target.value.trim() &&
                  setMemory(date, { text: `${memory ? memory + ' · ' : ''}${e.target.value.trim()}` })
                }
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              />
              <p className="mt-1 text-label text-fg-2">Saved into today's memory when you click away.</p>
            </Field>
          )}

          <Field label="Memory of the day" hint="One line to remember it by">
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
          </Field>
        </div>
      </Card>

    </Page>
  )
}

/**
 * DAY MASTHEAD · the dateline at the top of the daily log.
 *
 * A paper bullet journal opens every daily log by writing the date at the top
 * of the page. That is the artifact this app is a version of, and it was
 * rendered as a small card title — so the page read as a widget rather than as
 * a dated page you are about to write on.
 *
 * The one flourish is **№ 214**: bullet journals number and index their pages,
 * so the day-of-year is a real page number in the method's own vocabulary. It
 * is set in the mono face, kept small, and appears exactly once.
 *
 * Everything else stays quiet — no new colours, no new motion, nothing that
 * would fight the five themes.
 */
function DayMasthead({
  date, isToday, weather, entryCount, openTasks, taskCount,
}: {
  date: string
  isToday: boolean
  weather?: { icon: string; label: string; tempC: number }
  entryCount: number
  openTasks: number
  taskCount: number
}) {
  const d = fromISODay(date)
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' })
  const dayMonth = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  // Day of the year — the journal's page number for this day. `round`, not
  // `floor`: across a spring-forward boundary the span is 213.96 days, and
  // flooring that printed Aug 2 as № 213 instead of 214.
  const pageNo = Math.round((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000)

  // One sentence about where the day stands. An empty page is an invitation,
  // not a report of nothing.
  let line: string
  if (entryCount === 0) line = 'Blank page. Start with anything.'
  else if (taskCount > 0 && openTasks === 0) line = `${entryCount} ${entryCount === 1 ? 'line' : 'lines'} today, every task closed.`
  else if (openTasks > 0) line = `${entryCount} ${entryCount === 1 ? 'line' : 'lines'} today · ${openTasks} still open.`
  else line = `${entryCount} ${entryCount === 1 ? 'line' : 'lines'} today.`

  return (
    <header className="mb-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-title leading-tight font-medium text-fg-1 sm:text-display">{weekday}</h2>
        <span className="shrink-0 font-mono text-caption tabular-nums text-fg-2" title={`Day ${pageNo} of the year`}>
          № {pageNo}
        </span>
      </div>
      <p className="mt-0.5 flex items-center gap-2 text-body text-fg-2">
        {dayMonth}
        {isToday && <span className="text-fg-2">· today</span>}
        {weather && <span title={weather.label}>· {weather.icon} {weather.tempC}°C</span>}
      </p>
      <hr className="mt-3 mb-2.5 border-line" />
      <p className="text-body text-fg-1">{line}</p>
    </header>
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
            <li key={h.id} className="flex items-center gap-3 rounded-lg border border-line bg-ink-0 px-3 py-2">
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
                  className="grid h-7 w-7 place-items-center rounded-full border border-line-strong text-fg-1 transition-colors hover:text-fg-1 disabled:opacity-30"
                >−</button>
                <button
                  onClick={() => setHabitValue(date, h.id, val + step)}
                  aria-label={`Increase ${h.name}`}
                  className="grid h-7 w-7 place-items-center rounded-full border text-fg-1 transition-colors"
                  style={{ borderColor: cat(h.color), background: cat(h.color) + '22' }}
                >+</button>
                {step > 1 && (
                  <button
                    onClick={() => setHabitValue(date, h.id, val + step)}
                    aria-label={`Add ${step} to ${h.name}`}
                    className="rounded-full border border-line-strong px-2 py-0.5 text-caption text-fg-1 transition-colors hover:text-fg-1"
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
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label"
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
