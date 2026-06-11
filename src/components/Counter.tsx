import { useEffect, useRef, useState } from 'react'
import { cat } from '../lib/colors'

const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Animate a number from 0 → target with an ease-out curve. */
export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(reduced ? target : 0)
  const ref = useRef(0)
  useEffect(() => {
    if (reduced) {
      setVal(target)
      return
    }
    const from = ref.current
    let raf = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      const v = from + (target - from) * easeOut(t)
      ref.current = v
      setVal(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

/** A number that counts up when it mounts / changes. */
export function CountUp({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const v = useCountUp(value)
  return <>{v.toFixed(decimals)}{suffix}</>
}

/** Animated circular progress ring with a count-up value in the centre. */
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
          <span className="font-display text-xl font-semibold text-text">{center.toFixed(0)}{suffix}</span>
        </div>
      </div>
      {label && <span className="mt-1 text-xs text-subtext0">{label}</span>}
    </div>
  )
}
