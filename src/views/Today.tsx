import { Flame } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { isFutureDay, todayISO } from '../lib/date'
import { Card } from '../components/ui'
import { Page, useCursor } from '../components/shell/Page'
import { useNav } from '../components/shell/nav'
import { FastingCard } from '../components/FastingCard'
import { PenaltyCard } from '../components/PenaltyCard'
import { TodayPlanCard } from '../components/TodayPlanCard'
import { TodayHabits } from '../components/TodayHabits'
import { CoachCard } from '../components/CoachCard'
import { habitTarget, habitValueOn, habitDoneOn, onThisDay } from '../lib/stats'
import { isScheduledOn } from '../lib/schedule'
import { atRiskHabits, weeklyGoalProgress } from '../lib/streak'
import { cat, washStyle } from '../lib/colors'
import { DayHeader, DayLogCard, StatusStrip, WellbeingCard, WritingCard } from './today/cards'
import { HabitsSurface } from '../components/today/HabitsSurface'

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

/**
 * WHICH COLUMN EACH SURFACE'S CARDS GO IN.
 *
 * Same rule the classic layout has always used — **you write in the left
 * column; the right rail reports on what you wrote** — applied to the focused
 * layout, which never had a rail at all. Measured at 1920 it was an 820px
 * column with **550px of dead gutter on each side**, and 1.50 screens tall on
 * Morning: the desktop layout was the phone layout, centred.
 *
 * The rail is DOM-ordered *after* main, so a phone stacks them in exactly the
 * order these surfaces already had — that is what fixes the column split for
 * free rather than reshuffling the small screen. It is why `StatusStrip` is at
 * the end of Day's rail and not the end of Day's main: on a phone it has to
 * land last, and it is read-only status, which is rail material anyway.
 */
/**
 * ONE DAY, ONE PAGE — capture first, then what it adds up to.
 *
 * This was four surfaces behind a tab row: morning, day, evening and habits.
 * The split had a real argument, written in this file for a year — at 7am you
 * want to rate your sleep, at 10pm the capture box is the only thing that
 * matters — and it was paid for in duplication the code had already stopped
 * fighting:
 *
 * | Rendered | morning | day | evening | habits |
 * |---|---|---|---|---|
 * | `TodayHabits` | — | as a row | as a checklist | — |
 * | `TodayCountHabits` | — | in the rail | in the main column | — |
 * | the habit grid | — | — | — | the whole page |
 *
 * Habits were on three of the four, and "Habits with a number" rendered
 * verbatim on two. `surfaceUntouched` declines to count habits at all for that
 * exact reason — *"they render on Day and Evening, so attributing them to
 * either would clear the other tab's marker"* — which is a workaround for the
 * duplication, not a design.
 *
 * And the split cost the one thing this page exists for. **Capture was a tab
 * away**: at 7am the rapid log was not on screen, so writing a line began with
 * deciding which surface it lived on. A page you scroll costs a scroll; a page
 * you tab costs a decision.
 *
 * One page now, in the order the day is used:
 *
 * 1. **Orient** — the dateline, nothing else asking for attention.
 * 2. **Capture** — the log, the habits, the ratings, the writing. Everything
 *    that takes input sits above everything that reports.
 * 3. **Review** — what is planned, what is at risk, where you stand.
 *
 * Habits appear ONCE. The checklist variant won because it is the only one
 * that shows every habit with its state — the old Day row and the old Evening
 * checklist were each doing half of that.
 */
function todayColumns(date: string, nav: ReturnType<typeof useNav>) {
  return {
    // ── CAPTURE ─────────────────────────────────────────────────────────
    // Ordered by how often a day needs them rather than by the clock. The log
    // is first because it is what you open this page at 3pm to do.
    main: (
      <>
        <DayLogCard date={date} sticky />
        {/* ONE habit control, not three.
            `TodayStrip` (inside this card) is the only one that takes BOTH
            check and count habits, with steppers — so it does the work the old
            Day row, the old Evening checklist and `TodayCountHabits` were
            splitting between them. `TodayHabits` stays in the codebase for the
            classic layout, which still groups by time of day. */}
        <HabitsSurface slot="capture" />
        <WellbeingCard key={date} date={date} />
        <WritingCard key={`w-${date}`} date={date} />
      </>
    ),
    // ── REVIEW ──────────────────────────────────────────────────────────
    // Everything that reports rather than asks. Fasting leads it: starting the
    // clock is one tap, and reading it is the rest of the day.
    rail: (
      <>
        {!isFutureDay(date) && <FastingCard />}
        <TodayPlanCard date={date} />
        <AtRiskNudge date={date} />
        <StatusStrip date={date} onNavigate={nav} />
      </>
    ),
  }
}

function TodayFocused() {
  const { day: date } = useCursor()
  const nav = useNav()

  const { main, rail } = todayColumns(date, nav)

  return (
    // `wide`, not `read`: with a rail beside it the reading column still lands
    // at ~808px, which is the measure `read` was protecting — the extra width
    // goes to the rail rather than to the prose.
    //
    // `gap-0 sm:gap-0`: the bands are divided by their own 2px rules, and
    // `Page`'s responsive `sm:gap-5` survives a base-only override (see the
    // note in views/Mindset.tsx).
    <Page width="wide" className="gap-0 sm:gap-0">
      {/* The dateline heads the *page*, not the log card. It used to live
          inside `DayLogCard`, which only the Day surface renders — so Morning
          and Evening printed no date at all and the day cursor could be walked
          with nothing on screen changing to say so.

          The surface tabs used to ride at the right-hand end of this band.
          They are the header's second row now — the row that holds every other
          view's tab row and rendered a redundant centred title here. See
          `components/shell/topbar/SurfaceTabs.tsx`.

          It is a child of `Page` rather than of the grid below, so it spans
          both columns — zone 1 orients the whole page, not just the left of
          it. `Page`'s own `aside` prop cannot do that, which is why the split
          is a grid here instead. */}
      <DayHeader date={date} />

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex min-w-0 flex-col">{main}</div>
        <aside className="flex flex-col">{rail}</aside>
      </div>

      {/* VISUALISATIONS, under everything that asks for input.
          Full width rather than in a column: its centrepiece is a 31-column
          month grid wanting ~910px, and the 62/38 split would give it ~730 and
          a horizontal scrollbar over the last week of the month — the part you
          most want to see. This is why the habits surface was a separate page
          shape; below the split it gets the width without the separation. */}
      <HabitsSurface slot="review" />
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
      {!hidden.includes('plan') && <TodayPlanCard date={date} />}
      <CoachCard />
      {!hidden.includes('penalty') && <PenaltyCard />}
      <FastingCard />
      <WeeklyGoalRings date={date} />
      {hasFlash && !hidden.includes('onThisDay') && (
        <Card band title="On this day" subtitle="From earlier in your journal" hideInfo collapsible>
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
    // Only the *columns'* internal gaps go to zero — the bands inside each one
    // are divided by their own rules. The grid keeps its column gutter, or the
    // rail's rules would run straight into the log's.
    <Page aside={rail} className="[&>aside]:gap-0 [&>div]:gap-0">
      {/* Same dateline as the focused layout, and for the same reason: the day
          is the page's subject, so it heads the page rather than titling one
          card on it. The rail's first card therefore starts level with the
          dateline rather than with the log — deliberate, and the alternative
          (a prop on `DayLogCard` toggling its own header) is two shapes of the
          same page. */}
      <DayHeader date={date} />

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
 * The habits Today could not tick: the ones whose answer is a NUMBER.
 *
 * `TodayHabits` renders a checkbox, so it filters to `check` habits — which is
 * correct for a checkbox and meant that count, timer and **rating** habits
 * were not on Today at all unless you happened to be on the Day surface,
 * where this card sat in the rail. The Evening close-out, the one screen whose
 * whole job is "walk the list once", silently omitted them.
 *
 * `rating` was missing from here too, so a 1–5 habit was unreachable from
 * Today on every surface. Included now, stepping 0–5 like the rest.
 *
 * Still excludes `avoid` habits: a tally is not what "did you slip" asks for,
 * and those are ticked in the checklist above.
 */
function TodayCountHabits({ date }: { date: string }) {
  const { data, setHabitValue } = useJournal()
  const habits = data.habits.filter(
    (h) => !h.archived && !h.avoid && (h.type === 'count' || h.type === 'timer' || h.type === 'rating') && isScheduledOn(h, date),
  )
  if (habits.length === 0) return null
  return (
    <Card band title="Habits with a number" subtitle="Tap −/+ to log today's tally" hideInfo>
      <ul className="space-y-2">
        {habits.map((h) => {
          const target = habitTarget(h)
          const val = habitValueOn(data, h, date)
          const met = habitDoneOn(data, h, date)
          const step = h.type === 'timer' ? (target >= 20 ? 5 : 1) : 1
          // A rating is 1–5 and cannot be "more" than 5; a count can.
          const ceiling = h.type === 'rating' ? 5 : Infinity
          return (
            <li key={h.id} className="flex items-center gap-3 border-t border-line py-2">
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
                  className="grid size-11 place-items-center rounded-control bg-ink-2 text-fg-1 shadow-raise transition-colors hover:bg-ink-3 disabled:opacity-30"
                >−</button>
                <button
                  onClick={() => setHabitValue(date, h.id, Math.min(ceiling, val + step))}
                  aria-label={`Increase ${h.name}`}
                  className="grid size-11 place-items-center rounded-control shadow-raise transition-colors"
                  style={washStyle(cat(h.color))}
                >+</button>
                {step > 1 && (
                  <button
                    onClick={() => setHabitValue(date, h.id, Math.min(ceiling, val + step))}
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
    <Card band title="Keep your streaks" subtitle="Scheduled today, streak alive, not logged yet" hideInfo>
      <ul className="flex flex-wrap gap-2">
        {atRisk.map(({ habit, streak }) => (
          <li
            key={habit.id}
            className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-label"
            style={washStyle('peach')}
          >
            <Icon as={Flame} size="sm" />
            {habit.emoji ? `${habit.emoji} ` : ''}{habit.name}
            <span>· keep your {streak}-day streak</span>
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
    <Card band title="Weekly goals" subtitle="This week's completions vs your goal" hideInfo collapsible>
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
