import { addDays } from '../../lib/date'
import { habitDoneOn, habitTarget, habitValueOn, isNumericHabit, isSteppableHabit, limitStatus, nextHabitValue } from '../../lib/stats'
import { isScheduledOn } from '../../lib/schedule'
import { cat, onAccent, onRaised } from '../../lib/colors'
import { HABIT_KEY } from '../../lib/recordKeys'
import { justCapturedProps, useJustCaptured } from '../CaptureReceipt'
import type { Habit, JournalData } from '../../lib/types'

/** How many days of history ride along with each habit. A week reads as a week. */
const WINDOW = 7

/**
 * ONE ROW PER HABIT · the name once, the last seven days, and today's control.
 *
 * Today used to say every habit name **twice** — as a tappable chip near the
 * top and again as a row of the month grid at the bottom. Measured on
 * `?day=2026-09-22`: Caffeine twice, Sugar twice, Water 2L three times. Both
 * were real features (fast capture, and history), so neither was simply
 * deletable; the duplication was in showing them as two separate lists.
 *
 * A row carries both. The name is the row label, the seven dots are that
 * habit's week, and the control on the right is today — so the thing you tap
 * and the thing you read are the same object, and the name is written once.
 *
 * **Not a replacement for the month grid.** Backfilling a missed Tuesday still
 * wants a month, and that grid moved into the analytics fold rather than being
 * deleted — see `today/HabitsSurface`. This is the daily surface; that is the
 * archive.
 *
 * Every value, target and toggle comes from the same helpers `TodayStrip` uses
 * (`habitValueOn`, `habitTarget`, `nextHabitValue`, `isScheduledOn`). Retyping
 * any of them is how the two copies would drift, and `isScheduledOn` in
 * particular already cost a bug once: an inline weekday test that dropped
 * `startedOn` offered habits that had not begun yet (COD-199).
 */
export function HabitRows({
  habits,
  data,
  today,
  onToggle,
  onSetValue,
}: {
  habits: Habit[]
  data: JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
}) {
  const justCaptured = useJustCaptured()
  const todays = habits.filter((h) => isScheduledOn(h, today))
  if (todays.length === 0) return null

  const days = Array.from({ length: WINDOW }, (_, i) => addDays(today, -(WINDOW - 1 - i)))

  return (
    <ul className="divide-y divide-line">
      {todays.map((h) => {
        const type = h.type ?? 'check'
        const numeric = isNumericHabit(h)
        const limit = limitStatus(data, h, today)
        const target = habitTarget(h)
        const val = habitValueOn(data, h, today)
        const on = habitDoneOn(data, h, today)
        const accent = cat(h.color ?? 'mauve')
        const fresh = justCaptured.has(HABIT_KEY(today, h.id))

        return (
          <li
            key={h.id}
            {...justCapturedProps(fresh)}
            className={`flex items-center gap-3 py-2 ${fresh ? 'just-captured' : ''}`}
          >
            <span className="min-w-0 flex-1 truncate text-body text-fg-1">
              <span aria-hidden className="mr-1.5">{h.emoji ?? '●'}</span>
              {h.name}
            </span>

            {/* THE WEEK, as seven cells.
                Read-only on purpose: a tap target here would be a second way to
                mark a day, which is the duplication this component exists to
                end. `aria-hidden` because the row's control already announces
                today and the cells are a summary a screen reader gets from the
                tracker's own table.

                **It was 6px dots, and `hidden sm:flex`.** Two defects in one
                strip: at `size-1.5` with a `surface1` miss, the difference
                between a four-day week and a seven-day one was ~24px of faint
                colour that had to be counted rather than seen — and below
                640px the strip did not render at all, so the phone, which is
                where a habit actually gets ticked, showed no history
                whatsoever. Reported as "it's very very low ... it can be
                smaller on mobile but I want it to show".

                Now 10px on a phone and 14px from `sm` up, as rounded squares
                rather than dots: a square reads as a filled unit of a week
                (the same language as `Heatmap`), and at 14px a glance gives
                you the count. Desktop strip 116px against the old 66px, and
                the row has the width — the name beside it is `truncate`.

                **No `opacity` anywhere in here.** The old strip faded an
                unscheduled day to 0.35, which produces a colour no gate can
                check (the trap in CLAUDE.md) and reads as "dimly done".
                A day this habit is not scheduled for is drawn as an *outline*
                — nothing was asked of you, so nothing is filled — while a
                scheduled miss is a real `surface1` fill. Three states, three
                shapes, every colour a token.

                Today's cell carries a ring so the strip has a right-hand
                anchor: without it "four of the last seven" and "four, ending
                three days ago" draw the same picture. */}
            <span aria-hidden className="flex shrink-0 items-center gap-[2px] sm:gap-[3px]">
              {days.map((d) => {
                const met = habitDoneOn(data, h, d)
                const scheduled = isScheduledOn(h, d)
                const isToday = d === today
                return (
                  <span
                    key={d}
                    title={`${d}${scheduled ? (met ? ' · done' : ' · missed') : ' · not scheduled'}`}
                    className="size-2.5 rounded-[3px] sm:size-3.5"
                    style={{
                      background: met ? accent : scheduled ? cat('surface1') : 'transparent',
                      border: scheduled ? undefined : `1px solid ${cat('surface1')}`,
                      outline: isToday ? `1px solid ${cat('overlay0')}` : undefined,
                      outlineOffset: 1,
                    }}
                  />
                )
              })}
            </span>

            {isSteppableHabit(h) && !h.avoid ? (
              <span className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onSetValue(today, h.id, Math.max(0, val - (type === 'timer' && target >= 20 ? 5 : 1)))}
                  disabled={val <= 0}
                  aria-label={`Decrease ${h.name}`}
                  className="grid size-7 place-items-center rounded-pill bg-ink-2 text-fg-2 transition-colors hover:text-fg-1 disabled:opacity-30"
                >
                  −
                </button>
                {/* A limit reads "3/2 max": the ceiling is the second number
                    either way, but over it is a warning, not a win, and not
                    logged at all is neither. */}
                <span className="num min-w-[3.25rem] text-center text-label tabular-nums" style={{ color: limit === 'over' ? onRaised('peach') : on ? accent : undefined }}>
                  {val}/{target}
                  {type === 'timer' ? 'm' : type === 'limit' ? ' max' : ''}
                </span>
                <button
                  onClick={() => onSetValue(today, h.id, val + (type === 'timer' && target >= 20 ? 5 : 1))}
                  aria-label={`Increase ${h.name}`}
                  className="grid size-7 place-items-center rounded-pill bg-ink-2 text-fg-2 transition-colors hover:text-fg-1"
                >
                  +
                </button>
              </span>
            ) : (
              <button
                onClick={() => (numeric ? onSetValue(today, h.id, nextHabitValue(type, target, val)) : onToggle(today, h.id))}
                aria-pressed={on}
                aria-label={h.avoid ? `${h.name} — mark a slip today` : `${h.name} — mark done today`}
                className="grid size-7 shrink-0 place-items-center rounded-pill border transition-colors"
                style={{
                  borderColor: on ? accent : cat('surface1'),
                  background: on ? (h.avoid ? cat('red') : accent) : 'transparent',
                  // `onAccent`, never `cat('crust')`: crust is the light-on-
                  // SATURATED half of a pair and is near-white in latte and
                  // dawn, so a tick drawn with it vanishes on its own fill in
                  // two themes out of five. The helper picks the better neutral
                  // per theme and pushes it to 4.6 — the trap in CLAUDE.md that
                  // once accounted for seven of sixteen contrast failures.
                  color: on ? onAccent(h.avoid ? cat('red') : accent) : cat('overlay0'),
                }}
                title={h.avoid ? (on ? 'Slipped today · tap to clear' : 'Clean today') : undefined}
              >
                {h.avoid ? (on ? '!' : '✓') : on ? '✓' : ''}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
