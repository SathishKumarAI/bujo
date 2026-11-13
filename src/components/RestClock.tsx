import { useEffect, useState } from 'react'
import { X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { mmss } from '../lib/holdTime'

/**
 * HOW LONG YOU HAVE RESTED, in the log dock after you tick a set — so the
 * rest between sets needs no second app (owner, 2026-11-13). Counts UP when
 * the plan gives no rest ("rest as long as you need"), and down to `target`
 * when it does (a ladder's "at least 3 minutes"): no invented number.
 *
 * OWNS: the count from when it mounted, and the dismiss. Remount (a new
 * `key`) to restart. DOES NOT OWN: when a rest starts — the caller's tick.
 * Program's prescribed rest is `program/RestTimer`, which has +30s and pause.
 */
export function RestClock({ target, onDismiss }: {
  /** Seconds the plan asks for, or null to count up. */
  target: number | null
  onDismiss: () => void
}) {
  const [since] = useState(() => Date.now())
  const [now, setNow] = useState(since)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])
  const secs = Math.floor((now - since) / 1000)
  const over = target != null && secs >= target
  return (
    <div className="rest-clock" data-over={over || undefined}>
      <span role="timer" aria-live="off" className="text-body font-semibold tabular-nums text-fg-1">
        {target == null ? `Resting ${mmss(secs)}` : over ? `Rested ${mmss(secs)}, go` : `Rest ${mmss(target - secs)} left`}
      </span>
      <span className="sr-only" aria-live="polite">{over ? 'Rest over' : ''}</span>
      <button type="button" className="round-btn ml-auto" aria-label="Stop the rest clock" onClick={onDismiss}>
        <Icon as={X} size="sm" />
      </button>
    </div>
  )
}
