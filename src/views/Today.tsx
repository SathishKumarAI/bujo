import { Flame } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { isFutureDay, todayISO } from '../lib/date'
import { Card, Segmented } from '../components/ui'
import { Page, useCursor } from '../components/shell/Page'
import { useNav } from '../components/shell/nav'
import { FastingCard } from '../components/FastingCard'
import { PenaltyCard } from '../components/PenaltyCard'
import { TodayPlanCard } from '../components/TodayPlanCard'
import { TodayHabits } from '../components/TodayHabits'
import { CoachCard } from '../components/CoachCard'
import { habitTarget, habitValueOn, habitDoneOn, onThisDay } from '../lib/stats'
import { isScheduledOn } from '../lib/habitStats'
import { atRiskHabits, weeklyGoalProgress } from '../lib/streak'
import { cat } from '../lib/colors'
import { SURFACE_LABEL } from '../lib/surface'
import type { Surface } from '../lib/deepLink'
import { DayLogCard, StatusStrip, WellbeingCard, WritingCard } from './today/cards'

/**
 * TODAY · two shapes, one set of cards.
 *
 * `settings.layout` picks between them; both are maintained.
 *
 * - **focused** — the day split by time of day into Morning / Day / Evening.
 *   Ten cards were never needed simultaneously: at 6am seven of them are empty,
 *   and at 10pm the capture box is the only one that matters. Each surface is a
 *   *filter over the same day record* — no surface owns state, and a card that
 *   appears on two of them is the same component both times.
 * - **classic** — every card on one page, the way it was.
 *
 * The date comes from the route in both. No card keeps a copy of it: the day is
 * `useCursor().day`, seeded from `?day=` and written back on every change, so a
 * day can be linked, bookmarked and walked with the back button.
 */
export function Today() {
  const { data } = useJournal()
  return (data.settings.layout ?? 'focused') === 'focused' ? <TodayFocused /> : <TodayClassic />
}

const SURFACES: Surface[] = ['morning', 'day', 'evening']

function TodayFocused() {
  const { day: date, surface, setSurface } = useCursor()
  const nav = useNav()

  return (
    <Page>
      {/* Navigation, not a reveal: no transition beyond the page's existing
          220ms entrance. Switching surfaces is switching pages. */}
      <Segmented
        value={surface}
        onChange={setSurface}
        size="touch"
        options={SURFACES.map((s) => ({ value: s, label: SURFACE_LABEL[s] }))}
      />

      {surface === 'morning' && (
        <>
          {/* Four taps and it is done: rate the day, say what broke the fast,
              start the clock, then read what is already planned. */}
          <WellbeingCard key={date} date={date} />
          {!isFutureDay(date) && <FastingCard />}
          <TodayPlanCard />
        </>
      )}

      {surface === 'day' && (
        <>
          {/* One card. Everything that reports on the day is either a pill row
              or the strip at the bottom, because this surface exists so that
              writing a line is the only thing asking for attention. */}
          <DayLogCard date={date} sticky />
          <TodayHabits date={date} variant="row" />
          <TodayCountHabits date={date} />
          <AtRiskNudge date={date} />
          <StatusStrip date={date} onNavigate={nav} />
        </>
      )}

      {surface === 'evening' && (
        <>
          <TodayHabits date={date} variant="checklist" />
          <WritingCard key={date} date={date} />
        </>
      )}
    </Page>
  )
}

function TodayClassic() {
  const { data } = useJournal()
  const { day: date } = useCursor()
  const flashbacks = onThisDay(data, date)
  const hidden = data.settings.hideToday ?? []
  const hasFlash = flashbacks.entries.length + flashbacks.memories.length > 0
  const isToday = date === todayISO()

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
   * | Write one line      | 6      | left  | The day's prompt |
   * | Today's plan        | 7      | right | Orientation, but read-only |
   * | Your coach          | 6      | right | Advice derived from your data |
   * | Make-up work        | 4      | right | Status, conditional, read-only |
   * | Intermittent fasting| 4      | right | A timer widget, not a journal entry |
   * | Weekly goals        | 3      | right | Collapsed, derived |
   * | On this day         | 3      | right | Read-only, from past journals |
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
        <Card title="On this day" subtitle="From earlier in your journal" hideInfo collapsible defaultCollapsed>
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
      {/* Capture first. This is a bullet journal; writing a line is the point
          of the page, so the log leads and everything that summarises it
          follows. */}
      <DayLogCard date={date} />

      {/* Daily actions: one unified habit block — boolean check-offs,
          count/timer steppers, and at-risk streak chips sit together. */}
      <section className="flex flex-col gap-3">
        {!hidden.includes('habits') && <TodayHabits date={date} />}
        {!hidden.includes('habits') && <TodayCountHabits date={date} />}
        <AtRiskNudge date={date} />
      </section>

      <WellbeingCard key={date} date={date} />
      <WritingCard key={date} date={date} />
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
    <Card title="Count habits" subtitle="Tap −/+ to log your tally for today" hideInfo>
      <ul className="space-y-2">
        {habits.map((h) => {
          const target = habitTarget(h)
          const val = habitValueOn(data, h, date)
          const met = habitDoneOn(data, h, date)
          const step = h.type === 'timer' ? (target >= 20 ? 5 : 1) : 1
          return (
            <li key={h.id} className="flex items-center gap-3 rounded-control border border-line bg-ink-0 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-body text-fg-1">
                {h.emoji ? `${h.emoji} ` : ''}{h.name}
                {h.unit && <span className="text-fg-2"> ({h.unit})</span>}
              </span>
              <span className="text-label tabular-nums" style={{ color: met ? cat('green') : cat('overlay1') }}>
                {val}/{target}{h.type === 'timer' ? 'm' : ''}{met ? ' ✓' : ''}
              </span>
              {/* 44px targets (WCAG 2.5.5): the glyph stays small, the box
                  around it does the work. These were 28px. */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHabitValue(date, h.id, Math.max(0, val - step))}
                  disabled={val <= 0}
                  aria-label={`Decrease ${h.name}`}
                  className="grid size-11 place-items-center rounded-pill border border-line-strong text-fg-1 transition-colors hover:text-fg-1 disabled:opacity-30"
                >−</button>
                <button
                  onClick={() => setHabitValue(date, h.id, val + step)}
                  aria-label={`Increase ${h.name}`}
                  className="grid size-11 place-items-center rounded-pill border text-fg-1 transition-colors"
                  style={{ borderColor: cat(h.color), background: cat(h.color) + '22' }}
                >+</button>
                {step > 1 && (
                  <button
                    onClick={() => setHabitValue(date, h.id, val + step)}
                    aria-label={`Add ${step} to ${h.name}`}
                    className="min-h-11 rounded-pill border border-line-strong px-2 text-caption text-fg-1 transition-colors hover:text-fg-1"
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
    <Card title="Keep your streaks" subtitle="Scheduled today, streak alive, not logged yet" hideInfo>
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
    <Card title="Weekly goals" subtitle="This week's completions vs your goal" hideInfo collapsible defaultCollapsed>
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
