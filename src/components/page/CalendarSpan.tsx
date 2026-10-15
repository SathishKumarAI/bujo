import { cat } from '../../lib/colors'
import { prettyDay, fromISODay } from '../../lib/date'
import type { DayCell } from '../ui/day-grid'

/**
 * A week or a month of days, laid out the way a week or a month is shaped.
 *
 * ── The mistake this exists to correct ────────────────────────────────────
 *
 * `DayGrid` is column-major: a column is a week, rows are weekdays. That is
 * the right shape for a YEAR — 53 narrow columns make a strip you read
 * left-to-right, which is exactly what GitHub's contribution graph is.
 *
 * It is the wrong shape for anything short, and shortening it does not help.
 * A month became six columns of seven cells: a small square sitting in the
 * middle of a 980px review column with ~750px of nothing either side, which is
 * how it was reported — *"why are you not scaling it to the sides? there is a
 * lot of empty space."* Capping the cell size kept the squares sane and left
 * the emptiness; removing the cap filled the width with 190px tiles. Neither is
 * a fix, because both were still drawing a year's layout with fewer columns.
 *
 * ── What the shapes actually are ──────────────────────────────────────────
 *
 *   week    seven cells in a ROW, left to right, each labelled with its
 *           weekday and date. A week is a row — that is what a week looks
 *           like on every calendar anyone has ever used, and it uses the full
 *           width instead of stacking seven cells into a column.
 *
 *   month   a calendar: seven columns of weekdays, a row per week. Also what
 *           a month looks like everywhere else, and it fills the width
 *           because the columns divide it.
 *
 *   year    unchanged — `DayGrid`, columns as weeks. The strip is right there
 *           and nothing else fits 365 cells on a line.
 *
 * So the layout follows the range rather than one layout being truncated. The
 * colours, levels and ramp are `DayGrid`'s, imported rather than re-chosen, so
 * all three views of the same data agree.
 */

/** `DayGrid`'s ramp for levels 1–4. Level 0 draws the empty colour at full. */
const RAMP = [1, 0.4, 0.6, 0.8, 1]

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function CalendarSpan({
  days,
  mode,
  color = 'mauve',
  emptyColor = 'surface0',
  label,
}: {
  /** Days in ascending order, already levelled by the caller. */
  days: DayCell[]
  mode: 'week' | 'month'
  color?: string
  emptyColor?: string
  label?: string
}) {
  const week = mode === 'week'

  return (
    <div
      role="group"
      aria-label={label ?? (week ? 'This week' : 'This month')}
      className="w-full"
    >
      {/* Weekday headers only in month mode. In a week the date sits on the
          cell itself, where there is room for it — repeating the letters above
          seven labelled cells is a header that says what the row already
          says. */}
      {!week && (
        <div aria-hidden className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY.map((d, i) => (
            <span key={i} className="text-center text-micro text-fg-3">{d}</span>
          ))}
        </div>
      )}

      <div className={`grid gap-1 ${week ? 'grid-cols-7' : 'grid-cols-7'}`}>
        {days.map((d, i) => {
          const bg = d.blank ? 'transparent' : d.level === 0 ? cat(emptyColor) : cat(color)
          const opacity = d.blank ? 1 : RAMP[d.level]
          return (
            <div
              key={d.date || `blank-${i}`}
              title={d.blank ? undefined : d.title}
              // A week's cells are taller than they are wide at full width, so
              // they are given a fixed-ish ratio; a month's rows stack, so the
              // cells stay close to square and the whole grid still fits.
              // Both proportions are measured rather than chosen.
              //
              // A week is seven cells across the full width, so an aspect ratio
              // gives each one ~175px of height — a week should read as a
              // strip, not as seven posters. A fixed 64px band holds whatever
              // the column width.
              //
              // A month is five rows, so square cells came out 117x117 and the
              // grid 585px tall — taller than the form beside it, for thirty
              // data points. 4:3 keeps the calendar shape, fills the same
              // width, and costs ~145px less height.
              className={`relative flex flex-col items-center justify-center rounded-control ${week ? 'h-16' : 'aspect-[4/3]'}`}
              style={{ background: bg, opacity }}
            >
              {week && !d.blank && (
                <>
                  {/* From the DATE, not from the index. Week mode no longer
                      starts on a Sunday — it is the last seven days — so an
                      index-based letter would mislabel every cell. */}
                  <span className="text-micro text-fg-2">{WEEKDAY[fromISODay(d.date).getDay()]}</span>
                  <span className="text-label font-medium tabular-nums text-fg-1">
                    {Number(d.date.slice(8, 10))}
                  </span>
                </>
              )}
              {/* The value is text for a screen reader on every cell, because
                  colour alone never carries the data — the same rule `DayGrid`
                  follows by being a table. */}
              {!d.blank && <span className="sr-only">{d.srLabel ?? prettyDay(d.date)}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
