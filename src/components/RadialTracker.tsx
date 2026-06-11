import { cat } from '../lib/colors'
import { fromISODay } from '../lib/date'
import type { Habit } from '../lib/types'

// Annular-sector path (a wedge of a ring) on an SVG canvas centred at (cx,cy).
function sector(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number): string {
  const pt = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${pt(rOut, a0)} A ${rOut} ${rOut} 0 ${large} 1 ${pt(rOut, a1)} L ${pt(rIn, a1)} A ${rIn} ${rIn} 0 ${large} 0 ${pt(rIn, a0)} Z`
}

/**
 * A fan/radial habit tracker for a month: each habit is a concentric ring,
 * each day a wedge along a 270° arc. Filled wedge = habit done that day.
 * Inspired by printable radial habit-tracker spreads.
 */
export function RadialTracker({
  habits,
  habitLog,
  habitValues,
  days,
  today,
  size = 380,
}: {
  habits: Habit[]
  habitLog: Record<string, string[]>
  habitValues?: Record<string, Record<string, number>>
  days: string[]
  today: string
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const N = days.length
  const START = -Math.PI * 0.75 // upper-left
  const SWEEP = Math.PI * 1.5 // 270°
  const gap = 0.012 // radian gap between day wedges
  const outerMax = size / 2 - 26
  const R0 = Math.max(46, outerMax - habits.length * 16)
  const bandH = habits.length ? (outerMax - R0) / habits.length : 0

  const angle = (i: number) => START + (i / N) * SWEEP

  function done(h: Habit, d: string): boolean {
    if (h.type === 'count') {
      const v = habitValues?.[d]?.[h.id] ?? 0
      return v >= (h.target && h.target > 0 ? h.target : 1)
    }
    return (habitLog[d] ?? []).includes(h.id)
  }

  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="max-w-full">
        {/* habit rings */}
        {habits.map((h, hi) => {
          const rIn = R0 + hi * bandH + 1.5
          const rOut = R0 + (hi + 1) * bandH - 1.5
          return (
            <g key={h.id}>
              {days.map((d, di) => {
                const a0 = angle(di) + gap
                const a1 = angle(di + 1) - gap
                const on = done(h, d)
                const future = d > today
                return (
                  <path
                    key={d}
                    d={sector(cx, cy, rIn, rOut, a0, a1)}
                    fill={on ? cat(h.color) : cat('surface0')}
                    opacity={on ? 0.95 : future ? 0.25 : 0.5}
                  >
                    <title>{`${h.name} · day ${di + 1}${on ? ' ✓' : ''}`}</title>
                  </path>
                )
              })}
            </g>
          )
        })}

        {/* day numbers around the outer edge */}
        {days.map((d, di) => {
          const a = angle(di + 0.5)
          const r = outerMax + 12
          const x = cx + r * Math.cos(a)
          const y = cy + r * Math.sin(a)
          const isToday = d === today
          return (
            <text
              key={d}
              x={x}
              y={y}
              fontSize={9}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isToday ? cat('mauve') : cat('overlay0')}
              fontWeight={isToday ? 700 : 400}
            >
              {di + 1}
            </text>
          )
        })}

        {/* centre label */}
        <circle cx={cx} cy={cy} r={R0 - 8} fill={cat('mantle')} stroke={cat('surface0')} />
        <text x={cx} y={cy - 4} fontSize={13} textAnchor="middle" fill={cat('subtext0')} className="font-display">
          {fromISODay(days[0]).toLocaleString('en', { month: 'short' })}
        </text>
        <text x={cx} y={cy + 12} fontSize={9} textAnchor="middle" fill={cat('overlay0')}>
          {N} days
        </text>
      </svg>

      {/* legend */}
      <ul className="space-y-1 text-sm">
        {habits.map((h) => (
          <li key={h.id} className="flex items-center gap-2 text-subtext1">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: cat(h.color) }} />
            {h.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
