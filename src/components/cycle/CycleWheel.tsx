import { cat, onRaised } from '../../lib/colors'
import type { PhaseBand } from '../../lib/cycleInsights'

/**
 * THE WHEEL · where you are in the cycle, as one shape.
 *
 * A cycle is the one kind of time a line chart is wrong for: it is periodic,
 * and a line redraws the same journey left-to-right every month so that "day
 * 26 of 28" and "day 2 of 28" land at opposite ends of the page despite being
 * four days apart. Every consumer cycle app draws a ring for this reason, and
 * this page had no orientation graphic at all — just the sentence "Cycle day
 * 14", which answers where you are but not how far round.
 *
 * Built as four arcs rather than one gradient, because the phases are the
 * information: their *widths* say how long the follicular half ran this month
 * and the luteal half's stubborn fourteen days did not. The marker is a notch
 * on the ring, not a needle from the centre — a needle reads as a gauge, and a
 * gauge implies a target.
 *
 * Presentation only. It takes the bands and the day and knows nothing about
 * the log, which is what lets `phaseBands` stay the single place the phase
 * arithmetic happens.
 */
export function CycleWheel({ day, length, bands, size = 200 }: {
  /** 1-based cycle day, or null when no period start anchors the count. */
  day: number | null
  length: number
  bands: PhaseBand[]
  size?: number
}) {
  const stroke = 16
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  // Day 1 at twelve o'clock, running clockwise — the direction a calendar and
  // a clock both already run, so nothing has to be explained.
  const angle = (d: number) => (d / length) * 2 * Math.PI - Math.PI / 2
  const point = (d: number, radius = r) => [
    cx + radius * Math.cos(angle(d)),
    cy + radius * Math.sin(angle(d)),
  ]

  const arc = (from: number, to: number) => {
    // `to` is inclusive as a day, so the arc ends at the *end* of that day.
    const [x0, y0] = point(from - 1)
    const [x1, y1] = point(to)
    const large = (to - from + 1) / length > 0.5 ? 1 : 0
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
  }

  const current = day != null ? bands.find((b) => day >= b.from && day <= b.to) : undefined

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={
          day != null
            ? `Cycle wheel: day ${day} of about ${length}, ${current?.label ?? 'unknown'} phase`
            : `Cycle wheel: ${length}-day cycle, no period logged yet to place today on it`
        }
        className="shrink-0"
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={cat('surface0')} strokeWidth={stroke} />
        {bands.map((b) => (
          <path
            key={b.id}
            d={arc(b.from, b.to)}
            fill="none"
            stroke={cat(b.color)}
            strokeWidth={stroke}
            /* Dimmed unless it is the phase you are in. Four full-strength
               arcs is four things competing for the same glance, and the
               question the wheel answers is "which one am I in". */
            opacity={current && current.id !== b.id ? 0.35 : 1}
          />
        ))}
        {day != null && (() => {
          const [mx, my] = point(day - 0.5, r)
          return <circle cx={mx} cy={my} r={stroke / 2 + 3} fill={cat('base')} stroke={cat('text')} strokeWidth={2} />
        })()}
        {day != null ? (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle" className="num" fontSize={30} fontWeight={600} fill={cat('text')}>
              {day}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize={11} fill={cat('subtext0')}>
              of ~{length}
            </text>
          </>
        ) : (
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill={cat('subtext0')}>
            no start yet
          </text>
        )}
      </svg>

      {/* The legend is the phase table, not a colour key: each row carries the
          day range, which is the number the wheel can only show as an angle. */}
      <ul className="min-w-0 space-y-1">
        {bands.map((b) => {
          const here = current?.id === b.id
          return (
            <li key={b.id} className="flex items-baseline gap-2 text-label">
              <span aria-hidden className="mt-1 inline-block h-2 w-2 shrink-0 rounded-[2px]" style={{ background: cat(b.color) }} />
              <span className={here ? 'font-medium text-fg-1' : 'text-fg-2'} style={here ? { color: onRaised(b.color) } : undefined}>
                {b.label}
              </span>
              <span className="num ml-auto shrink-0 text-fg-2">
                {b.from === b.to ? b.from : `${b.from}–${b.to}`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
