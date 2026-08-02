import { cat } from '../../lib/colors'

/**
 * DayGrid — one day per cell, columns are weeks, rows are weekdays.
 *
 * The shared core behind the two GitHub-style grids in the app: the read-only
 * activity heatmap on Stats, and the interactive per-habit row in Trackers.
 * Both were rendering the same visual idea from their own markup, with
 * different cell sizes, gaps and intensity ramps, so they drifted.
 *
 * Deliberately NOT folded in here: `TodayHabits`. It looks adjacent on a list
 * of "habit surfaces" but it has no day cells, no calendar and no intensity —
 * it is time-of-day chips with a completion ring. Merging it would have meant
 * inventing a shared abstraction for two things that share nothing.
 *
 * The caller owns *which* days exist and what each level means; this owns the
 * grid, the ramp, the sizing and the accessibility shape.
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

export function DayGrid({
  days,
  pad = 0,
  color = 'mauve',
  emptyColor = 'surface0',
  colorFor,
  size = 11,
  gap = 3,
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
  label?: string
  /** Omit for a read-only grid. */
  onDayClick?: (date: string) => void
}) {
  const box = { height: size, width: size }
  // `rounded-[2px]` lived at 13 call sites as an arbitrary value; it is a
  // data-cell radius rather than a control or card one, so it belongs to this
  // primitive and nowhere else.
  const cell = 'rounded-[2px]'

  // `justify-start` matters: grid's default `justify-content: normal` stretches
  // auto-sized tracks to fill the container, so inside a wide `flex-1` parent
  // the 10px cells were spread across a 39.5px column pitch — a heatmap with
  // gaps four times wider than its cells. This predated the extraction and was
  // present in both grids; sharing a primitive means fixing it once.
  return (
    <div
      className="grid grid-flow-col grid-rows-7 justify-start"
      style={{ gap }}
      role="img"
      aria-label={label ?? `Activity grid, ${days.length} days`}
    >
      {Array.from({ length: pad }).map((_, i) => (
        <span key={`pad-${i}`} style={box} />
      ))}
      {days.map((d) => {
        const bg = d.blank
          ? 'transparent'
          : colorFor
            ? colorFor(d)
            : d.level === 0
              ? cat(emptyColor)
              : cat(color)
        const opacity = d.blank || colorFor ? 1 : RAMP[d.level]
        const clickable = !!onDayClick && !d.blank && !d.disabled

        if (!clickable) {
          return <span key={d.date} title={d.title} className={cell} style={{ ...box, background: bg, opacity }} />
        }
        return (
          <button
            key={d.date}
            onClick={() => onDayClick(d.date)}
            title={d.title}
            aria-label={d.srLabel ?? d.title ?? d.date}
            className={`${cell} enabled:hover:ring-1 enabled:hover:ring-overlay0`}
            style={{ ...box, background: bg, opacity }}
          />
        )
      })}
    </div>
  )
}

/** The five-step legend that belongs with a level-ramped grid. */
export function DayGridLegend({ color = 'mauve', emptyColor = 'surface0', size = 11 }: { color?: string; emptyColor?: string; size?: number }) {
  return (
    <div className="mt-2 flex items-center gap-1 text-label text-fg-2">
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
