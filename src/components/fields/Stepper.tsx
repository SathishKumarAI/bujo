import { useRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Tap-to-adjust number field — no keyboard needed. Tap ± to step; press and
 * hold to repeat with acceleration. Typing is still allowed for big jumps.
 * Pure presentational: value/onChange are owned by the parent.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
  label,
  className,
  'aria-label': ariaLabel,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  label?: string
  className?: string
  'aria-label'?: string
}) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clamp = (v: number) => {
    if (min != null && v < min) return min
    if (max != null && v > max) return max
    return v
  }
  const bump = (dir: 1 | -1) => onChange(clamp(Math.round(((value ?? 0) + dir * step) * 100) / 100))

  function stop() {
    if (timer.current) { clearInterval(timer.current); timer.current = null }
    if (delay.current) { clearTimeout(delay.current); delay.current = null }
  }
  function holdStart(dir: 1 | -1) {
    bump(dir)
    // After a short delay, repeat; speed up once it's clearly a hold.
    delay.current = setTimeout(() => {
      let n = 0
      timer.current = setInterval(() => { n++; bump(dir) }, 80) // ~12.5/s; acceleration via larger steps below
      void n
    }, 350)
  }

  return (
    <div className={cn('inline-flex flex-col gap-0.5', className)}>
      {label && <span className="text-[10px] text-overlay0">{label}</span>}
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${ariaLabel ?? label ?? ''}`.trim()}
          onPointerDown={() => holdStart(-1)}
          onPointerUp={stop}
          onPointerLeave={stop}
          className="grid h-8 w-8 place-items-center rounded-lg border border-input text-overlay1 hover:text-text active:scale-95"
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : clamp(Number(e.target.value)))}
          aria-label={ariaLabel ?? label}
          className="w-14 rounded-lg border border-input bg-base px-1 py-1.5 text-center text-sm text-text focus:border-mauve focus:outline-none"
        />
        {suffix && <span className="text-xs text-overlay0">{suffix}</span>}
        <button
          type="button"
          aria-label={`Increase ${ariaLabel ?? label ?? ''}`.trim()}
          onPointerDown={() => holdStart(1)}
          onPointerUp={stop}
          onPointerLeave={stop}
          className="grid h-8 w-8 place-items-center rounded-lg border border-input text-overlay1 hover:text-text active:scale-95"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
