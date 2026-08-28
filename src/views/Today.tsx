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
import { SURFACE_LABEL, surfaceUntouched } from '../lib/surface'
import type { Surface } from '../lib/deepLink'
import { DayHeader, DayLogCard, StatusStrip, WellbeingCard, WritingCard } from './today/cards'

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

/**
 * THE SURFACE SWITCHER · navigation that also reports.
 *
 * Three words and nothing else was the whole control, so the row could tell you
 * where you *are* and never where you have not been. Each segment now carries a
 * dot when that surface's own record is still empty for the day
 * (`surfaceUntouched`), which is the only fact a tab row is in a position to
 * state without duplicating the cards beneath it.
 *
 * The mark is a graphic, so the state is also in the accessible name — colour
 * and shape are never the only carrier. It inherits `currentColor`, which means
 * it picks up the accent on the active segment and the muted foreground
 * elsewhere: the page's one accent, not a second one.
 *
 * A **square**, not a round dot, because `--radius-pill` is `0rem` here: radius
 * zero is one of the four rules the whole redesign is built on, and the design
 * gate rejects a full-radius utility for exactly that reason. It also happens to
 * be the right glyph — this is a bullet journal, and its marks are signifiers.
 * (The gate is a line-level regex, so it fired on this paragraph naming the
 * class as readily as on the class itself.)
 */
function SurfaceTabs() {
  const { data } = useJournal()
  const { day: date, surface, setSurface } = useCursor()
  const untouched = surfaceUntouched(data, date)

  return (
    // Navigation, not a reveal: no transition beyond the page's existing 220ms
    // entrance. Switching surfaces is switching pages. It sits *inside* the
    // masthead band rather than under it — a row of its own cost 68px on every
    // surface at every width, for three words.
    <Segmented
      value={surface}
      onChange={setSurface}
      size="touch"
      options={SURFACES.map((s) => ({
        value: s,
        label: (
          <span className="inline-flex items-center gap-1.5">
            {SURFACE_LABEL[s]}
            {untouched[s] && (
              <>
                <span aria-hidden className="size-1.5 bg-current" />
                <span className="sr-only">, nothing recorded yet</span>
              </>
            )}
          </span>
        ),
      }))}
    />
  )
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
function surfaceColumns(date: string, nav: ReturnType<typeof useNav>) {
  return {
    morning: {
      // Four taps and it is done: rate the day, say what broke the fast, start
      // the clock, then read what is already planned.
      main: <WellbeingCard key={date} date={date} />,
      rail: (
        <>
          {!isFutureDay(date) && <FastingCard />}
          <TodayPlanCard date={date} />
        </>
      ),
    },
    day: {
      // The rapid log and the row you tick against it. Everything that merely
      // *reports* moves to the rail, because this surface exists so that
      // writing a line is the only thing asking for attention.
      main: (
        <>
          <DayLogCard date={date} sticky />
          <TodayHabits date={date} variant="row" />
        </>
      ),
      rail: (
        <>
          <TodayCountHabits date={date} />
          <AtRiskNudge date={date} />
          <StatusStrip date={date} onNavigate={nav} />
        </>
      ),
    },
    evening: {
      main: <TodayHabits date={date} variant="checklist" />,
      rail: <WritingCard key={date} date={date} />,
    },
  }
}

function TodayFocused() {
  const { day: date, surface } = useCursor()
  const nav = useNav()
  const { main, rail } = surfaceColumns(date, nav)[surface]

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
          with nothing on screen changing to say so. The surface tabs ride in
          its band; see `DayMasthead`.

          It is a child of `Page` rather than of the grid below, so it spans
          both columns — zone 1 orients the whole page, not just the left of
          it. `Page`'s own `aside` prop cannot do that, which is why the split
          is a grid here instead. */}
      <DayHeader date={date} right={<SurfaceTabs />} />

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex min-w-0 flex-col">{main}</div>
        <aside className="flex flex-col">{rail}</aside>
      </div>
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
    <Card band title="Count habits" subtitle="Tap −/+ to log your tally for today" hideInfo>
      <ul className="space-y-2">
        {habits.map((h) => {
          const target = habitTarget(h)
          const val = habitValueOn(data, h, date)
          const met = habitDoneOn(data, h, date)
          const step = h.type === 'timer' ? (target >= 20 ? 5 : 1) : 1
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
                  className="grid size-11 place-items-center rounded-none border border-line-strong text-fg-1 transition-colors hover:text-fg-1 disabled:opacity-30"
                >−</button>
                <button
                  onClick={() => setHabitValue(date, h.id, val + step)}
                  aria-label={`Increase ${h.name}`}
                  className="grid size-11 place-items-center rounded-none border text-fg-1 transition-colors"
                  style={{ borderColor: cat(h.color), background: cat(h.color) + '22' }}
                >+</button>
                {step > 1 && (
                  <button
                    onClick={() => setHabitValue(date, h.id, val + step)}
                    aria-label={`Add ${step} to ${h.name}`}
                    className="min-h-11 rounded-none border border-line-strong px-2 text-caption text-fg-1 transition-colors hover:text-fg-1"
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
            className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-label"
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
