import { cat } from '../../lib/colors'
import { useCountUp } from '../../lib/countUp'

/** A number that counts up when it mounts / changes. */
export function CountUp({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const v = useCountUp(value)
  return (
    <>
      {v.toFixed(decimals)}
      {suffix}
    </>
  )
}

/**
 * Animated circular progress ring with a count-up value in the centre.
 *
 * Moved here from `components/Counter.tsx` — the redesign audit flagged it as a
 * primitive filed in the wrong place: every other shared primitive lives in
 * `ui`, and Ring was the one the brief expected to have to build from scratch.
 */
export function Ring({
  value,
  max = 100,
  size = 84,
  stroke = 7,
  color = 'mauve',
  label,
  display,
  suffix = '',
}: {
  value: number
  max?: number
  size?: number
  stroke?: number
  color?: string
  label?: string
  display?: number // number to count up in the centre (defaults to value)
  suffix?: string
}) {
  const animated = useCountUp(value)
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, animated / max))
  const center = useCountUp(display ?? value)
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cat('surface0')} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={cat(color)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="num font-display text-title font-medium text-fg-1">
            {center.toFixed(0)}
            {suffix}
          </span>
        </div>
      </div>
      {label && <span className="mt-1 text-label text-fg-2">{label}</span>}
    </div>
  )
}
