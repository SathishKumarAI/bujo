import { cat } from '../../lib/colors'
import { fromISODay, prettyDay, WEEKDAYS } from '../../lib/date'

/**
 * DayGrid — one day per cell, columns are weeks, rows are weekdays.
 *
 * The shared core behind the GitHub-style grids in the app: the read-only
 * activity heatmap on Stats, the interactive per-habit row in Trackers, and the
 * Body cluster's `CalendarHeatmap`. All were rendering the same visual idea
 * from their own markup, with different cell sizes, gaps and intensity ramps,
 * so they drifted.
 *
 * Deliberately NOT folded in here: `TodayHabits`. It looks adjacent on a list
 * of "habit surfaces" but it has no day cells, no calendar and no intensity —
 * it is time-of-day chips with a completion ring. Merging it would have meant
 * inventing a shared abstraction for two things that share nothing.
 *
 * The caller owns *which* days exist and what each level means; this owns the
 * grid, the ramp, the sizing and the accessibility shape.
 *
 * ── Why this is a <table> ────────────────────────────────────────────────────
 *
 * It used to be a `<div role="img">` carrying one summary label, with each
 * cell's value in a `title` attribute. That reads to a screen reader as a
 * single image called "Activity heatmap, 119 days" — the data was conveyed by
 * colour alone, and `title` is not a reliable accessible name (it is skipped
 * outright on touch, and by several screen-reader/browser pairings).
 *
 * It is now a real table: weekday row headers, week-start column headers, and a
 * visually-hidden label inside every cell carrying the day and its actual
 * value. The headers are `sr-only` because the *visual* is a heatmap, not a
 * spreadsheet — sighted users get the grid they had, assistive tech gets the
 * structure it needs, and nothing about the rendering changes.
 *
 * Worth recording why this went unnoticed: both existing grids sit inside
 * collapsed folds, and `npm run a11y` walks the rendered page — so axe never
 * opened them and never saw the violation. Re-run that gate with folds open.
 */

export interface DayCell {
  date: string
  /** 0 = empty, 1–4 = increasing intensity. */
  level: 0 | 1 | 2 | 3 | 4
  /** Rendered as a blank spacer — future days, or days before a habit started. */
  blank?: boolean
  /** Not clickable, but still drawn (e.g. a rating habit you log elsewhere). */
  disabled?: boolean
  title?: string
  srLabel?: string
}

/** Opacity ramp for levels 1–4. Level 0 draws the empty-cell colour at full. */
const RAMP = [1, 0.4, 0.6, 0.8, 1]

const ROWS = 7

/** The accessible sentence for one cell. Never colour alone. */
const cellLabel = (d: DayCell) => d.srLabel ?? d.title ?? `${prettyDay(d.date)}: no activity`

export function DayGrid({
  days,
  pad = 0,
  color = 'mauve',
  emptyColor = 'surface0',
  colorFor,
  size = 11,
  gap = 3,
  fluid = false,
  label,
  onDayClick,
}: {
  days: DayCell[]
  /** Blank cells before the first day, to align the first column to a weekday. */
  pad?: number
  /** Palette name for filled cells. */
  color?: string
  emptyColor?: string
  /** Full override — wins over `color`/`emptyColor`. */
  colorFor?: (c: DayCell) => string
  size?: number
  gap?: number
  /**
   * Cells divide the container's width instead of taking `size` px.
   *
   * A fixed cell is right when the grid shares its column with something else.
   * It is wrong when the grid has a column to itself: twelve weeks at 11px is a
   * **188px** table in Fitness's **708px** review column, so the page's
   * signature visual read as a postage stamp with 520px of dead space beside it
   * and 300px below. `size` already existed for this and its one adopter
   * (Mindset) had to guess a number that only suits one container width — a
   * guess that cannot be right at both 708px and a 358px phone.
   *
   * `table-fixed` with no declared column widths divides the width equally,
   * so the cell size falls out of the container at every width with no
   * measurement, media query or resize observer.
   */
  fluid?: boolean
  label?: string
  /** Omit for a read-only grid. */
  onDayClick?: (date: string) => void
}) {
  // Square either way: fixed px, or a full-width cell whose height follows.
  const box = fluid ? { width: '100%', aspectRatio: '1' } : { height: size, width: size }
  // The sr-only header column is `position: absolute`, so it contributes no
  // width of its own — but under `table-fixed` it would still be handed an
  // equal share of the row. Zero it, or the grid loses a column's worth of
  // width to a cell nobody can see.
  const headCol = fluid ? { width: 0, padding: 0 } : undefined
  // `rounded-[2px]` lived at 13 call sites as an arbitrary value; it is a
  // data-cell radius rather than a control or card one, so it belongs to this
  // primitive and nowhere else.
  const cell = 'rounded-[2px]'

  // Slots run column-major (a column is a week, top to bottom Sun→Sat), which
  // is how the callers build their arrays. A table is row-major, so the grid is
  // transposed here rather than in every caller.
  const total = pad + days.length
  const cols = Math.ceil(total / ROWS)
  const slot = (row: number, col: number): DayCell | null => {
    const i = col * ROWS + row
    if (i < pad || i >= total) return null
    return days[i - pad] ?? null
  }

  // Header text comes from the real dates in the grid, so it stays correct
  // whatever weekday the caller's first column happens to start on.
  const rowHeader = (row: number) => {
    for (let c = 0; c < cols; c++) {
      const d = slot(row, c)
      if (d && !d.blank) return WEEKDAYS[fromISODay(d.date).getDay()]
    }
    return ''
  }
  const colHeader = (col: number) => {
    for (let r = 0; r < ROWS; r++) {
      const d = slot(r, col)
      if (d && !d.blank) return `Week of ${prettyDay(d.date)}`
    }
    return ''
  }

  return (
    // A <caption> rather than an aria-label: it survives table-navigation mode
    // in every screen reader, where a label on <table> sometimes does not.
    <table className={`border-separate${fluid ? ' w-full table-fixed' : ''}`} style={{ borderSpacing: gap }}>
      <caption className="sr-only">{label ?? `Activity grid, ${days.length} days`}</caption>
      <thead>
        <tr>
          <td className="sr-only" style={headCol} />
          {Array.from({ length: cols }).map((_, c) => (
            <th key={c} scope="col" className="sr-only">{colHeader(c)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: ROWS }).map((_, row) => (
          <tr key={row}>
            <th scope="row" className="sr-only" style={headCol}>{rowHeader(row)}</th>
            {Array.from({ length: cols }).map((_, col) => {
              const d = slot(row, col)
              if (!d) return <td key={col} style={box} />
              const bg = d.blank
                ? 'transparent'
                : colorFor
                  ? colorFor(d)
                  : d.level === 0
                    ? cat(emptyColor)
                    : cat(color)
              const opacity = d.blank || colorFor ? 1 : RAMP[d.level]
              const clickable = !!onDayClick && !d.blank && !d.disabled

              return (
                <td key={col} style={{ padding: 0 }}>
                  {clickable ? (
                    <button
                      onClick={() => onDayClick(d.date)}
                      title={d.title}
                      className={`${cell} block enabled:hover:ring-1 enabled:hover:ring-overlay0`}
                      style={{ ...box, background: bg, opacity }}
                    >
                      <span className="sr-only">{cellLabel(d)}</span>
                    </button>
                  ) : (
                    // Deliberately NOT a tab stop. A 12-week grid is 84 cells,
                    // and making each one focusable would put 84 stops between
                    // the heatmap and the next control — the scroll/focus trap
                    // the accessibility floor forbids. Screen readers reach
                    // these through table navigation, which is what the row and
                    // column headers above are for; the hidden label is read on
                    // arrival either way.
                    <span
                      title={d.title}
                      className={`${cell} block`}
                      style={{ ...box, background: bg, opacity }}
                    >
                      {!d.blank && <span className="sr-only">{cellLabel(d)}</span>}
                    </span>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** The five-step legend that belongs with a level-ramped grid. */
export function DayGridLegend({ color = 'mauve', emptyColor = 'surface0', size = 11 }: { color?: string; emptyColor?: string; size?: number }) {
  return (
    <div className="mt-2 flex items-center gap-1 text-label text-fg-2" aria-hidden="true">
      <span>less</span>
      {[0, 1, 2, 3, 4].map((l) => (
        <span
          key={l}
          className="rounded-[2px]"
          style={{ height: size, width: size, background: l === 0 ? cat(emptyColor) : cat(color), opacity: RAMP[l] }}
        />
      ))}
      <span>more</span>
    </div>
  )
}
