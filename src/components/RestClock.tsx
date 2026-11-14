import { useEffect, useState } from 'react'
import { mmss } from '../lib/holdTime'

/**
 * HOW LONG YOU HAVE RESTED, in the log dock after you tick a set — so the
 * rest between sets needs no second app (owner, 2026-11-13). Counts UP when
 * the plan gives no rest ("rest as long as you need"), and down to `target`
 * when it does (a ladder's "at least 3 minutes"): no invented number.
 *
 * OWNS: the count from when it mounted, Pause / Resume (paused time does not
 * count), Rest +15 s / −15 s on a countdown (never below nothing left), and
 * Stop. Remount (a new `key`) to restart. DOES NOT OWN: when a rest starts —
 * the caller's tick. Looks: `styles/phone-timer.css`.
 * Program's prescribed rest is `program/RestTimer`, which has +30s and pause.
 */
export function RestClock({ target, onDismiss }: {
  /** Seconds the plan asks for, or null to count up. */
  target: number | null
  onDismiss: () => void
}) {
  /** Milliseconds banked before the current run, and when it started (null: paused). */
  const [banked, setBanked] = useState(0)
  const [since, setSince] = useState<number | null>(() => Date.now())
  const [now, setNow] = useState(() => since ?? 0)
  /** Seconds added to or taken off the plan's rest. */
  const [extra, setExtra] = useState(0)
  useEffect(() => {
    if (since == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [since])
  const ms = banked + (since == null ? 0 : now - since)
  const secs = Math.floor(ms / 1000)
  const goal = target == null ? null : target + extra
  const over = goal != null && secs >= goal
  function toggle() {
    if (since == null) { const t = Date.now(); setSince(t); setNow(t) }
    else { setBanked(ms); setSince(null) }
  }
  return (
    <div className="rest-clock rest-clock-wrap" data-over={over || undefined}>
      <span role="timer" aria-live="off" className="text-body font-semibold tabular-nums text-fg-1">
        {goal == null ? `Resting ${mmss(secs)}` : over ? `Rested ${mmss(secs)}, go` : `Rest ${mmss(goal - secs)} left`}
        {since == null ? ', paused' : ''}
      </span>
      <span className="sr-only" aria-live="polite">{over ? 'Rest over' : ''}</span>
      <div className="rest-clock-controls">
        {goal != null && !over && (
          <>
            <button type="button" className="rest-btn" aria-label="Rest −15 s" onClick={() => setExtra(Math.max(secs - (target ?? 0), extra - 15))}>−15 s</button>
            <button type="button" className="rest-btn" aria-label="Rest +15 s" onClick={() => setExtra(extra + 15)}>+15 s</button>
          </>
        )}
        <button type="button" className="rest-btn" onClick={toggle}>
          {since == null ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className="rest-btn" aria-label="Stop the rest clock" onClick={onDismiss}>
          Stop
        </button>
      </div>
    </div>
  )
}
