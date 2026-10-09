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
import { habitTarget, habitValueOn, habitDoneOn, isNumericHabit, onThisDay } from '../lib/stats'
import { isScheduledOn } from '../lib/schedule'
import { atRiskHabits, weeklyGoalProgress } from '../lib/streak'
import { cat, washStyle } from '../lib/colors'
import { DayHeader, DayLogCard, StatusStrip, WellbeingCard, WritingCard } from './today/cards'
import { HabitsSurface } from '../components/today/HabitsSurface'
import { CollapsibleSection } from '../components/CollapsibleSection'

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
 * THE DESKTOP SHAPE · three zones, spelled out, so the day fits one screen.
 *
 * This was `CardGrid` auto-packing six cards, and the note it replaced argued
 * for that: *"two columns that fill themselves cannot strand a column, because
 * nothing is promised to either one."* True, and it optimises the wrong thing.
 * A grid that packs decides placement from card HEIGHT, so what you get is
 * whatever tessellates — the capture box and the check-in could land in either
 * column on any given day, and the page had no stable shape to learn. At 1440
 * it ran past the fold with the day's two primary actions in different places
 * from one visit to the next.
 *
 * Three columns, assigned by ROLE instead:
 *
 * | Column | Holds | Why |
 * |---|---|---|
 * | 340px | Capture, then One line | What you write, in the order you write it |
 * | fluid | Habits | The only thing whose width is content-driven |
 * | 380px | Check-in, then Fasting | What you answer, then the timer |
 *
 * The cost is real and accepted: on a future day `FastingCard` is absent, so
 * the right column is short and nothing flows up to fill it. That is the price
 * of a page whose shape does not move, and it is paid in whitespace at the
 * bottom of one column rather than in the reader re-finding the capture box.
 *
 * **DOM order is the phone order** — capture, habits, check-in, one line,
 * fasting — and the desktop columns are `col-start`/`row-start` placements over
 * it. Ordering the DOM by column instead would put "one line" above habits on a
 * phone, which is the wrong thing second on a small screen.
 *
 * The phone column is spelled out (`grid-cols-1`) rather than left implicit:
 * a grid with no `grid-template-columns` gets one implicit `auto` track sized
 * to the widest item's min-content, and a grid track is shared, so one wide
 * card drags every sibling off the right edge. See the trap in CLAUDE.md.
 */
function TodayFocused() {
  const { day: date } = useCursor()
  const nav = useNav()
  const future = isFutureDay(date)

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
          with nothing on screen to say so. It spans all three columns because
          zone 1 orients the whole page, not the left of it. */}
      <DayHeader date={date} />

      <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-[340px_minmax(0,1fr)_380px]">
        <div className="lg:col-start-1 lg:row-start-1 flex flex-col gap-4 sm:gap-5">
          <DayLogCard date={date} />
          {/* THE WEEK, IN THE HOLE THE GRID LEAVES.

              Measured at 1512x950 on `?demo=1`: the log ends at y 254 and
              "Write one line" starts at y 532, because the middle column spans
              both rows and is 636px tall while the log is 218. That is
              **278 x 340px of nothing** in the first screen of the page — and
              the one card that answers "how is this week going" was rendering
              only in `TodayClassic`, a layout this one replaced. So the
              question had no answer on the default Today at any width, and the
              space to answer it in was already paid for. */}
          <WeeklyGoalRings date={date} />
        </div>

        {/* Habits spans both rows: it is the tallest card and the one whose
            width the month grid below actually cares about. */}
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <HabitsSurface slot="capture" />
        </div>

        <div className="lg:col-start-3 lg:row-start-1">
          <WellbeingCard key={`w-${date}`} date={date} />
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <WritingCard key={`x-${date}`} date={date} />
        </div>

        {/* A future day has no fast to run, and the column simply ends. */}
        <div className="lg:col-start-3 lg:row-start-2">
          {!future && <FastingCard date={date} />}
          <StatusStrip date={date} onNavigate={nav} />
        </div>
      </div>

      {/* EVERYTHING THAT REPORTS, behind one fold.
          The four charts and the plan card are not capture — they are what the
          capture adds up to, and they were the difference between a Today that
          fits a 1440 viewport and one that does not.

          `CollapsibleSection`, specifically, and not a `SectionRail`: a rail is
          a nav of single-select buttons with no `aria-expanded`, so
          `openFolds()` in the a11y gate cannot find it and would quietly scan
          one group of these instead of all of them (COD-237). A section folds a
          whole titled region and announces itself, so the gate reaches inside.

          `defaultOpen={false}` with a `stickyKey`: shut on a first visit, and
          remembered for anyone who wants it open. */}
      <CollapsibleSection
        title="How the day adds up"
        subtitle="plan, trends and the month — none of it needs answering"
        defaultOpen={false}
        stickyKey="today.review"
        className="mt-4 sm:mt-5"
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <TodayPlanCard date={date} />
          <HabitsSurface slot="review" />
        </div>
      </CollapsibleSection>
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
      <FastingCard date={date} />
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
    (h) => !h.archived && !h.avoid && isNumericHabit(h) && isScheduledOn(h, date),
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
          // A limit can be exceeded — that is the state the card exists to show.
          const ceiling = h.type === 'rating' ? 5 : Infinity
          return (
            <li key={h.id} className="flex items-center gap-3 border-t border-line py-2">
              <span className="min-w-0 flex-1 truncate text-body text-fg-1">
                {h.emoji ? `${h.emoji} ` : ''}{h.name}
                {h.unit && <span className="text-fg-2"> ({h.unit})</span>}
              </span>
              <span className="text-label tabular-nums" style={{ color: met ? cat('green') : cat('overlay1') }}>
                {val}/{target}{h.type === 'timer' ? 'm' : h.type === 'limit' ? ' max' : ''}{met ? ' ✓' : ''}
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
  // A GOAL HERE IS A FLOOR, SO ONLY HABITS WITH A FLOOR BELONG.
  //
  // `weeklyGoal` is offered on every habit, including the ones you are trying
  // NOT to do — the demo sets it on Caffeine (5) and Sugar (2), both `avoid`.
  // An arc filling toward a target says "keep going": Caffeine drew **4/5 in
  // peach, 80% full**, which is the picture of a good week when it is in fact
  // the fourth coffee against a cap of five. A limit needs the opposite
  // reading and a different mark; until there is one, a ring is the wrong
  // instrument and this card does not draw it.
  const habits = data.habits.filter((h) => !h.archived && !h.avoid && h.type !== 'limit' && h.weeklyGoal && h.weeklyGoal > 0)
  if (habits.length === 0) return null
  // 64px of ring, against 48 before. The old size was set when this card lived
  // in `TodayClassic`'s 380px rail among nine others; it now leads a 340px
  // column of its own, and a 16px radius under a 10px label read as decoration
  // rather than as the week's score — reported as "very very low". The arc is
  // the number here, so it gets the size: 26px radius at 6px stroke, which is
  // also what lets the done/goal pair inside it be `text-label` instead of
  // `text-caption`.
  const R = 26
  const C = 2 * Math.PI * R
  return (
    <Card band title="Weekly goals" subtitle="This week's completions vs your goal" hideInfo collapsible>
      <div className="flex flex-wrap gap-x-2 gap-y-4">
        {habits.map((h) => {
          const { done, goal, pct } = weeklyGoalProgress(data, h, date, data.settings.weekStart ?? 0)
          const hit = done >= goal
          return (
            <div key={h.id} className="flex min-w-0 max-w-28 flex-1 basis-20 flex-col items-center gap-1.5">
              <span className="relative grid h-16 w-16 place-items-center">
                <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
                  {/* `surface0`, not `surface1`: the track is the part of the
                      week you have not done yet, and at 6px it is a wide band.
                      One step quieter keeps the arc the thing you see first. */}
                  <circle cx="32" cy="32" r={R} fill="none" stroke={cat('surface0')} strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r={R} fill="none"
                    stroke={cat(hit ? 'green' : h.color)} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
                    transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 0.3s' }}
                  />
                </svg>
                <span className="absolute text-label font-medium tabular-nums" style={{ color: hit ? cat('green') : cat('subtext1') }}>{done}/{goal}</span>
              </span>
              <span className="max-w-full truncate text-center text-caption text-fg-2" title={h.name}>{h.emoji ? `${h.emoji} ` : ''}{h.name}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
