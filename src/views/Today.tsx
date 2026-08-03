import { NotePencil } from '@/components/icons'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { useJournal } from '../store'
import { addDays, prettyDay, todayISO } from '../lib/date'
import { Card, Empty, Segmented } from '../components/ui'
import { Button } from '../components/ui/button'
import { Page, useToday } from '../components/shell/Page'
import { useDevice } from '../components/shell/device'
import { CaptureBar } from '../components/CaptureBar'
import { FastingCard } from '../components/FastingCard'
import { EntryRow } from '../components/EntryRow'
import { PenaltyCard } from '../components/PenaltyCard'
import { TodayPlanCard } from '../components/TodayPlanCard'
import { TodayHabits } from '../components/TodayHabits'
import { CoachCard } from '../components/CoachCard'
import { WellbeingCard } from '../components/today/WellbeingCard'
import { StatusStrip } from '../components/today/StatusStrip'
import { WritingPrompt } from '../components/today/WritingPrompt'
import { CountHabits } from '../components/today/CountHabits'
import { WeeklyGoalRings } from '../components/today/WeeklyGoalRings'
import { isSurface, surfaceForHour, type Surface } from '../lib/daySurface'
import { onThisDay } from '../lib/stats'
import { atRiskHabits } from '../lib/streak'

/**
 * TODAY · one day record, three surfaces.
 *
 * This screen carried ten cards. They are never all wanted at once, and at 6am
 * most are empty, so the page opened by listing everything that could ever be
 * done today instead of answering "what am I here for right now".
 *
 * The split is by time of day, and it is a **filter over the same day record** —
 * no surface owns state, nothing is duplicated, and any card on more than one
 * surface is the same component with a prop, never a copy.
 *
 *   Morning  · the check-in. Four ratings, first meal, start a fast, the plan.
 *              Four taps and it is done.
 *   Day      · the log, full width, as the only thing asking for input. Habits
 *              as a pill row under it, then a read-only status strip.
 *   Evening  · habits closed out as a checklist, and one writing prompt.
 *
 * The clock picks the opening surface; the person overrides it and the override
 * rides in the URL (`?view=evening` on the day route) so a refresh keeps it.
 * Deliberately not persisted across days: which surface you want tomorrow is a
 * question tomorrow's clock answers better than yesterday's choice.
 */
export function Today() {
  const { data, migrateEntry } = useJournal()
  const date = useToday()
  const [params, setParams] = useSearchParams()

  const override = params.get('view')
  const surface: Surface = isSurface(override) ? override : surfaceForHour(new Date().getHours())
  const setSurface = (s: Surface) => {
    const next = new URLSearchParams(params)
    next.set('view', s)
    // `replace` — flipping between surfaces of the same day is a change of
    // lens, not a place you should have to press Back through three times to
    // leave the day.
    setParams(next, { replace: true })
  }

  const isToday = date === todayISO()
  const hidden = data.settings.hideToday ?? []

  return (
    <Page width="wide">
      <div className="mb-4 sm:mb-5">
        <Segmented
          value={surface}
          onChange={setSurface}
          options={[
            { value: 'morning', label: 'Morning' },
            { value: 'day', label: 'Day' },
            { value: 'evening', label: 'Evening' },
          ]}
        />
      </div>

      {surface === 'morning' && <MorningSurface date={date} isToday={isToday} hidden={hidden} />}
      {surface === 'day' && <DaySurface date={date} isToday={isToday} migrate={migrateEntry} />}
      {surface === 'evening' && <EveningSurface date={date} isToday={isToday} />}
    </Page>
  )
}

/** Four ratings, the first meal, a fast to start, and what the day holds. */
function MorningSurface({ date, isToday, hidden }: { date: string; isToday: boolean; hidden: string[] }) {
  return (
    <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:col-span-2">
        <WellbeingCard date={date} />
        {isToday && !hidden.includes('plan') && <TodayPlanCard />}
        {/* Yesterday's make-up work. The spec lists neither Morning nor Day as
            its home, but the feature has to keep working — and it is
            prescriptive ("do this today"), which is the plan's job, not the
            log's. Day is explicitly "the log as the only card", so this is the
            lesser deviation. */}
        {isToday && !hidden.includes('penalty') && <PenaltyCard />}
      </div>
      <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <FastingCard />
      </div>
    </div>
  )
}

/**
 * The log, and almost nothing else. The habit row and the status strip are the
 * two things worth knowing while you are mid-day; everything else has a surface
 * of its own.
 */
function DaySurface({
  date,
  isToday,
  migrate,
}: {
  date: string
  isToday: boolean
  migrate: (id: string, to: string) => void
}) {
  const { data } = useJournal()
  const isMobile = useDevice() === 'mobile'
  const dayEntries = data.entries.filter((e) => e.date === date && !e.collection)
  const doneCount = dayEntries.filter((e) => e.type === 'task' && e.status === 'done').length
  const taskCount = dayEntries.filter((e) => e.type === 'task' && e.status !== 'dropped').length
  const metric = data.metrics.find((m) => m.date === date)
  // Yesterday's unfinished tasks, offered to carry forward onto this day.
  const carryover = data.entries.filter(
    (e) => e.date === addDays(date, -1) && e.type === 'task' && e.status === 'open' && !e.collection,
  )

  // What an empty day leads with. A streak worth protecting is the strongest
  // reason to write the first line; failing that, an invitation — never the
  // "you have logged nothing" status report this used to be.
  const topStreak = atRiskHabits(data, date)[0]
  const emptyLead = topStreak
    ? `Your ${topStreak.streak}-day ${topStreak.habit.name} streak is still live`
    : carryover.length > 0
      ? 'Start with what yesterday left open'
      : 'This day is yours to write'

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card
        title={prettyDay(date)}
        subtitle={
          <span className="flex items-center gap-2">
            {isToday ? 'Today' : ''}
            {metric?.weather && (
              <span title={metric.weather.label}>
                {metric.weather.icon} {metric.weather.tempC}°C
              </span>
            )}
          </span>
        }
      >
        {/* Desktop: the capture bar sits at the top of the card, as it always
            has. Mobile: see the portal at the end of this component. Exactly
            one of the two renders — two `CaptureBar`s would be two input
            drafts. */}
        {!isMobile && (
          <div className="mb-3">
            <CaptureBar date={date} />
          </div>
        )}
        {carryover.length > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-card border border-line bg-background px-3 py-2 text-body">
            <span className="text-fg-1">{carryover.length} unfinished task{carryover.length === 1 ? '' : 's'} from yesterday</span>
            <Button variant="secondary" onClick={() => carryover.forEach((e) => migrate(e.id, date))} className="press-3d rounded-control">Carry forward</Button>
          </div>
        )}
        {dayEntries.length === 0 ? (
          /* An empty day used to read "Nothing logged for this day" over five
             blank inputs and a 0/6 — a status report telling you that you had
             not done anything yet, which you knew. It carries something
             actionable now: yesterday's unfinished tasks (rendered above, with
             a one-tap carry-forward), the streak you are protecting, and a
             focused input. */
          <Empty
            icon={NotePencil}
            hint="Rapid-log it: • task, ○ event, – note. Type it the way you'd say it — “gym 7am”, “call mum”."
            action={{
              label: 'Start writing',
              onClick: () =>
                document.querySelector<HTMLInputElement>('input[aria-label="Smart capture"]')?.focus(),
            }}
          >
            {emptyLead}
          </Empty>
        ) : (
          <>
            <ul>
              {dayEntries.map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </ul>
            {taskCount > 0 && (
              /* "…logged today", not "…tasks done": the plan card's chip counts
                 every open task dated on or before today, which is a backlog,
                 and two different numbers both labelled "tasks" sat one screen
                 apart. */
              <p className="mt-2 text-right text-label text-fg-2">{doneCount}/{taskCount} logged today</p>
            )}
          </>
        )}
      </Card>

      {/* Habits as one pill row, then the count/timer tallies that are also
          habits and have no other home. Everything else on this surface is
          read-only: the log is the only thing asking for input. */}
      {isToday && <TodayHabits date={date} variant="pills" />}
      {isToday && <CountHabits date={date} />}
      <StatusStrip date={date} />

      {/* On a phone, capture is always one tap away however far down the day
          you have scrolled — a journal's job is catching the thought before it
          goes, and a capture bar you have to scroll back up to is a capture bar
          you stop using.

          Portalled to <body>, and `fixed` rather than `sticky`, because neither
          works in place here: `main` computes `overflow-y: auto` and
          `.book-inner` carries a transform, so a sticky element is positioned
          against a scrollport that is not the one the page scrolls, and a fixed
          one would take the transformed ancestor as its containing block. The
          enlarge modal in `ui.tsx` escapes to <body> for exactly this reason.

          `--bottom-nav` is published by `BottomNav` from its own measured
          height; hard-coding 48px would drift the moment that bar changed. */}
      {isMobile && createPortal(
        <div
          className="fixed inset-x-0 z-30 border-t border-line bg-card px-4 py-3 shadow-2xl"
          style={{ bottom: 'var(--bottom-nav, 3.5rem)' }}
        >
          <CaptureBar date={date} />
        </div>,
        document.body,
      )}
      {/* Clearance so the last log row is not sitting under that bar. */}
      {isMobile && <div aria-hidden className="h-24" />}
    </div>
  )
}

/** Close the day out: tick what happened, then write one line about it. */
function EveningSurface({ date, isToday }: { date: string; isToday: boolean }) {
  const { data } = useJournal()
  const flashbacks = onThisDay(data, date)
  const hidden = data.settings.hideToday ?? []
  const hasFlash = flashbacks.entries.length + flashbacks.memories.length > 0

  return (
    <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:col-span-2">
        <WritingPrompt date={date} />
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
      <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
        {isToday && <TodayHabits date={date} variant="checklist" />}
        {isToday && <WeeklyGoalRings date={date} />}
        {isToday && <CoachCard />}
      </div>
    </div>
  )
}
