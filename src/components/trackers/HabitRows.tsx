import { addDays } from '../../lib/date'
import { habitDoneOn, habitTarget, habitValueOn, nextHabitValue } from '../../lib/stats'
import { isScheduledOn } from '../../lib/schedule'
import { cat, onAccent } from '../../lib/colors'
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
        const numeric = type === 'count' || type === 'timer' || type === 'rating'
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

            {/* THE WEEK, as seven dots.
                Read-only on purpose: a tap target here would be a second way to
                mark a day, which is the duplication this component exists to
                end. `aria-hidden` because the row's control already announces
                today and the dots are a summary a screen reader gets from the
                tracker's own table. */}
            <span aria-hidden className="hidden items-center gap-1 sm:flex">
              {days.map((d) => {
                const met = habitDoneOn(data, h, d)
                const scheduled = isScheduledOn(h, d)
                return (
                  <span
                    key={d}
                    title={d}
                    className="size-1.5 rounded-pill"
                    style={{
                      background: met ? accent : cat('surface1'),
                      opacity: scheduled ? 1 : 0.35,
                    }}
                  />
                )
              })}
            </span>

            {(type === 'count' || type === 'timer') && !h.avoid ? (
              <span className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onSetValue(today, h.id, Math.max(0, val - (type === 'timer' && target >= 20 ? 5 : 1)))}
                  disabled={val <= 0}
                  aria-label={`Decrease ${h.name}`}
                  className="grid size-7 place-items-center rounded-pill bg-ink-2 text-fg-2 transition-colors hover:text-fg-1 disabled:opacity-30"
                >
                  −
                </button>
                <span className="num min-w-[3.25rem] text-center text-label tabular-nums" style={{ color: on ? accent : undefined }}>
                  {val}/{target}
                  {type === 'timer' ? 'm' : ''}
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
