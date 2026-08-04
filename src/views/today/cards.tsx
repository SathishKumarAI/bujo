import { Barbell, Drop, ForkKnife, NotePencil, PencilSimple, Timer } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { useJournal } from '../../store'
import { addDays, fromISODay, isFutureDay, todayISO } from '../../lib/date'
import { Card, Empty, Input } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { CaptureBar } from '../../components/CaptureBar'
import { EntryRow } from '../../components/EntryRow'
import { ImageUpload } from '../../components/ImageUpload'
import { Field } from '../../components/fields/Field'
import { Stepper } from '../../components/fields/Stepper'
import { SegmentScale } from '../../components/fields/SegmentScale'
import { currentStreak } from '../../lib/stats'
import { cat } from '../../lib/colors'
import { promptForDay } from '../../lib/prompts'
import { DEFAULT_FAST_TARGET, elapsedHours, fmtDuration } from '../../lib/fasting'

/**
 * The cards Today is made of, extracted so the three time-of-day surfaces can
 * each show a subset **of the same components**. A surface is a filter over the
 * day record, never a second copy of a card — a duplicated Wellbeing card would
 * be two places to fix the next bug in it.
 *
 * Nothing here holds day state: every one takes `date` from the route cursor.
 */

// ─────────────────────────────────────────────────────────────────────────────

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
 */
export function DayMasthead({
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
  if (isFutureDay(date)) line = 'Not here yet. Plan it if you like.'
  else if (entryCount === 0) line = 'Blank page. Start with anything.'
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

// ─────────────────────────────────────────────────────────────────────────────

/**
 * THE DAY LOG · dateline, capture box, carry-forward, the day's entries.
 *
 * The empty state is the one that mattered most. It used to read "Nothing
 * logged for this day" above five empty inputs and a 0/6 counter — a status
 * report on a person who has done nothing yet, which is the least useful thing
 * to hand someone at 6am. It now offers the two things that are *real* on an
 * empty day: yesterday's unfinished tasks, and the streak you are keeping.
 */
export function DayLogCard({ date, sticky = false }: { date: string; sticky?: boolean }) {
  const { data, migrateEntry } = useJournal()
  const dayEntries = data.entries.filter((e) => e.date === date && !e.collection)
  const doneCount = dayEntries.filter((e) => e.type === 'task' && e.status === 'done').length
  const taskCount = dayEntries.filter((e) => e.type === 'task' && e.status !== 'dropped').length
  const carryover = data.entries.filter(
    (e) => e.date === addDays(date, -1) && e.type === 'task' && e.status === 'open' && !e.collection,
  )
  const metric = data.metrics.find((m) => m.date === date)
  const streak = currentStreak(data)
  const future = isFutureDay(date)

  return (
    <Card hideInfo>
      <DayMasthead
        date={date}
        isToday={date === todayISO()}
        weather={metric?.weather}
        entryCount={dayEntries.length}
        openTasks={taskCount - doneCount}
        taskCount={taskCount}
      />
      {/* Future days keep the input in place and disabled rather than hiding
          it. Hiding moves everything below it up, so stepping forward a day
          makes the page jump — and the disabled field explains itself, which
          an absent one cannot. */}
      {future ? (
        <div className="mb-3 rounded-control border border-dashed border-line px-3 py-3 text-body text-fg-2">
          Nothing to log yet
        </div>
      ) : (
        <div className={sticky ? 'sticky top-[var(--header-h,3.25rem)] z-10 -mx-4 mb-3 bg-card px-4 py-2 md:static md:mx-0 md:px-0 md:py-0' : 'mb-3'}>
          <CaptureBar date={date} />
        </div>
      )}
      {carryover.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-control border border-line bg-background px-3 py-2 text-body">
          <span className="text-fg-1">{carryover.length} unfinished task{carryover.length === 1 ? '' : 's'} from yesterday</span>
          <Button variant="secondary" onClick={() => carryover.forEach((e) => migrateEntry(e.id, date))} className="press-3d shrink-0 rounded-control">Carry forward</Button>
        </div>
      )}
      {dayEntries.length === 0 ? (
        <Empty
          icon={NotePencil}
          hint={
            streak > 0
              ? `${streak}-day streak. Rapid-log it: • task, ○ event, – note — “gym 7am”, “call mum”.`
              : 'Rapid-log it: • task, ○ event, – note. Type it the way you’d say it — “gym 7am”, “call mum”.'
          }
          action={
            future
              ? undefined
              : {
                  label: 'Start writing',
                  onClick: () =>
                    document.querySelector<HTMLInputElement>('input[aria-label="Smart capture"]')?.focus(),
                }
          }
        >
          {future ? 'This day has not happened yet' : 'A blank page'}
        </Empty>
      ) : (
        <ul>
          {dayEntries.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </ul>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * WELLBEING · four ratings, sleep, and what broke the fast.
 *
 * Sliders are gone. A range input cannot represent "not answered": unset and 0
 * are the same pixel, and this is a field that is unanswered most of the time.
 * `SegmentScale` renders eleven dots and shows `—` until one is tapped.
 *
 * Sleep is a stepper in half-hours, not a 0–10 scale. Hours are a quantity, not
 * a rating; "8" on a 0–10 sleep slider meant either "eight hours" or "pretty
 * good" depending on who was reading it, and the hint had to say which.
 *
 * When the day is already rated, this collapses to a read-only line with an
 * Edit affordance — the morning check-in should not hand you the same empty
 * boxes again at 10am.
 */
export function WellbeingCard({ date }: { date: string }) {
  const { data, setMetric } = useJournal()
  const metric = data.metrics.find((m) => m.date === date)
  const answered = [metric?.mood, metric?.stress, metric?.energy, metric?.sleep].filter((v) => v != null).length
  const complete = answered === 4
  // Reset-on-day-change is a `key={date}` at the call site, not an effect —
  // editing yesterday must not leave tomorrow's summary expanded, and a
  // setState-in-effect to do that costs a second render every day change.
  const [editing, setEditing] = useState(false)

  if (complete && !editing) {
    return (
      <Card
        title="How today went"
        hideInfo
        right={
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-auto p-0 text-label text-mauve">
            Edit
          </Button>
        }
      >
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-body">
          {([
            ['Mood', metric?.mood, 'green'],
            ['Stress', metric?.stress, 'red'],
            ['Energy', metric?.energy, 'peach'],
          ] as const).map(([label, v, color]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <dt className="text-fg-2">{label}</dt>
              <dd className="font-mono tabular-nums" style={{ color: cat(color) }}>{v}</dd>
            </div>
          ))}
          <div className="flex items-baseline gap-1.5">
            <dt className="text-fg-2">Slept</dt>
            <dd className="font-mono tabular-nums" style={{ color: cat('blue') }}>{metric?.sleep}h</dd>
          </div>
          {metric?.fastBreak && (
            <div className="flex items-baseline gap-1.5">
              <dt className="text-fg-2">Broke the fast on</dt>
              <dd className="text-fg-1">{metric.fastBreak}</dd>
            </div>
          )}
        </dl>
      </Card>
    )
  }

  return (
    <Card title="How is today going?" hideInfo>
      <div className="space-y-4">
        <SegmentScale label="Mood" value={metric?.mood} onChange={(v) => setMetric(date, { mood: v })} color="green" hint="0 low · 10 great" />
        <SegmentScale label="Stress" value={metric?.stress} onChange={(v) => setMetric(date, { stress: v })} color="red" hint="0 calm · 10 high" />
        <SegmentScale label="Energy" value={metric?.energy} onChange={(v) => setMetric(date, { energy: v })} color="peach" hint="0 drained · 10 energized" />
        <div>
          <p className="mb-1 text-body text-fg-1">Hours slept</p>
          <Stepper
            value={metric?.sleep}
            onChange={(v) => setMetric(date, { sleep: v })}
            step={0.5}
            min={0}
            max={24}
            suffix="h"
            aria-label="Hours slept"
          />
        </div>
      </div>
      <div className="mt-4 border-t border-line pt-3">
        <p className="mb-2 text-body text-fg-1">What broke your fast</p>
        {/* These record a choice, so the selected one gets the accent wash
            rather than the accent fill — a filled pill here read as the
            screen's primary action, which it never was. */}
        <div className="flex gap-2">
          {([['food', ForkKnife, 'Food'], ['drink', Drop, 'Drink']] as const).map(([kind, glyph, label]) => (
            <Button
              key={kind}
              variant="ghost"
              aria-pressed={metric?.fastBreak === kind}
              onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === kind ? undefined : kind })}
              className={`press-3d inline-flex min-h-11 items-center gap-1.5 rounded-control ${metric?.fastBreak === kind ? 'bg-brand-wash font-medium text-brand' : ''}`}
            >
              <Icon as={glyph} size="sm" /> {label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * ONE WRITING PROMPT, not three.
 *
 * Gratitude, Reflection and Daily memory were three blank textareas asking
 * variations of the same question, stacked. Three blank boxes read as homework
 * and get skipped — all three, not one of them. This shows the day's rotating
 * prompt and puts the other two behind an expander, so the default ask is one
 * line and the full ritual is still one tap away for whoever wants it.
 */
export function WritingCard({ date }: { date: string }) {
  const { data, setGratitude, setMemory } = useJournal()
  const gratitude = data.gratitude.find((g) => g.date === date)?.text ?? ''
  const memoryRec = data.memories.find((m) => m.date === date)
  const memory = memoryRec?.text ?? ''
  // Collapsed again on a new day — via `key={date}`, see WellbeingCard.
  const [expanded, setExpanded] = useState(false)

  return (
    <Card title="Write one line" hideInfo>
      <Field label={promptForDay(date)}>
        <textarea
          key={`reflect-${date}`}
          defaultValue=""
          placeholder="A few honest lines…"
          onBlur={(e) =>
            e.target.value.trim() &&
            setMemory(date, { text: `${memory ? memory + ' · ' : ''}${e.target.value.trim()}` })
          }
          rows={3}
          className="w-full rounded-control border border-input bg-background px-3 py-2 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
        <p className="mt-1 text-label text-fg-2">Saved into today’s memory when you click away.</p>
      </Field>

      <Button
        variant="ghost"
        size="sm"
        aria-expanded={expanded}
        onClick={() => setExpanded((o) => !o)}
        className="mt-3 h-auto p-0 text-label text-mauve"
      >
        <Icon as={PencilSimple} size="sm" /> {expanded ? 'Just the one' : 'Gratitude and a memory too'}
      </Button>

      {expanded && (
        <div className="collapse-in mt-3 space-y-5 border-t border-line pt-4">
          <Field label="Grateful for" hint="One thing, however small">
            <Input
              value={gratitude}
              onChange={(e) => setGratitude(date, e.target.value)}
              placeholder="Today I’m grateful for…"
            />
          </Field>
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
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * STATUS STRIP · the three derived facts the Day surface still needs.
 *
 * Not cards. The Day surface is "the rapid log, and nothing competing with it",
 * so what used to be the Fasting card, the habit ring and the workout state
 * become one row of read-only text at the bottom. Each is a link into the card
 * that owns it — the strip reports, it does not edit.
 */
export function StatusStrip({ date, onNavigate }: { date: string; onNavigate?: (view: 'fitness') => void }) {
  const { data } = useJournal()
  const active = data.settings.fastActiveStart
  const target = data.settings.fastTargetHours ?? DEFAULT_FAST_TARGET

  // Tick only while a fast is running, and only once a minute — this is a
  // status line, not a stopwatch.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [active])

  const log = data.habitLog[date] ?? []
  const habits = data.habits.filter((h) => !h.archived && !h.avoid && (h.type ?? 'check') === 'check')
  const done = habits.filter((h) => log.includes(h.id)).length
  const workouts = data.workouts.filter((w) => w.date === date)

  const items: { icon: typeof Timer; label: string; tone?: string }[] = [
    active
      ? { icon: Timer, label: `Fasting ${fmtDuration(elapsedHours(active, now))} of ${target}h`, tone: 'mauve' }
      : { icon: Timer, label: 'No fast running' },
    { icon: NotePencil, label: `Habits ${done}/${habits.length}`, tone: habits.length > 0 && done === habits.length ? 'green' : undefined },
    workouts.length > 0
      ? { icon: Barbell, label: `${workouts.length} session${workouts.length === 1 ? '' : 's'} logged`, tone: 'green' }
      : { icon: Barbell, label: 'No training logged' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-control border border-line bg-ink-0 px-3 py-2 text-label">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5" style={{ color: it.tone ? cat(it.tone) : undefined }}>
          <Icon as={it.icon} size="sm" className={it.tone ? undefined : 'text-fg-2'} />
          <span className={it.tone ? undefined : 'text-fg-2'}>{it.label}</span>
        </span>
      ))}
      {onNavigate && (
        <Button variant="ghost" size="sm" onClick={() => onNavigate('fitness')} className="ml-auto h-auto p-0 text-label text-mauve">
          Open Body
        </Button>
      )}
    </div>
  )
}
