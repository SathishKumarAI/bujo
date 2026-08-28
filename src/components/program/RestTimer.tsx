import { useEffect, useState } from 'react'
import { cat } from '../../lib/colors'
import { Button } from '../ui/button'

/**
 * The rest the program prescribes, counting down.
 *
 * The hypertrophy block has said "Rest: 12+ reps→30s · 8–10→120s · <8→180s" in
 * its `note` since the day it was encoded and nothing read it, so the number was
 * on screen as prose while you still counted on your phone's clock.
 * `restSeconds` turns a rep target into the seconds; this shows them.
 *
 * **Counts against a deadline, not by adding up ticks.** `setInterval` is not a
 * clock — it drifts, and a background tab throttles it to about once a minute,
 * so a decrement-per-tick timer comes back from a locked screen insisting four
 * seconds have passed. The interval here exists only to force a re-render; the
 * number displayed is always `end - now`.
 *
 * Remount to restart. The call site keys it on the exercise, so ticking the next
 * lift is a new timer rather than a mutation of the old one.
 */
export function RestTimer({ seconds, exercise, onDismiss }: { seconds: number; exercise: string; onDismiss: () => void }) {
  const [end, setEnd] = useState(() => Date.now() + seconds * 1000)
  /** Milliseconds left, frozen, while paused. `null` means running. */
  const [held, setHeld] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const left = held ?? Math.max(0, end - now)
  const over = left === 0

  useEffect(() => {
    if (held !== null || over) return
    // 250ms so the displayed second turns over promptly. It sets a number that
    // changes once a second in the DOM, not a repaint per tick.
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [held, over])

  const mmss = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`
  const pct = seconds === 0 ? 0 : Math.min(100, Math.round((left / (seconds * 1000)) * 100))

  function toggle() {
    if (held === null) setHeld(left)
    else {
      setEnd(Date.now() + held)
      setNow(Date.now())
      setHeld(null)
    }
  }

  function add(ms: number) {
    if (held !== null) setHeld(held + ms)
    // `max(end, now)` so +30s on a finished timer gives thirty more seconds
    // rather than thirty minus however long it has been sitting at zero.
    else setEnd(Math.max(end, Date.now()) + ms)
  }

  return (
    // `bg-ink-0` + `border-line`, the same surface as the program note beside
    // it, rather than a hand-picked `cat('surface0')`. Every foreground below
    // is a pair the app has already solved against this background in all five
    // themes; a bespoke surface would have to be re-solved, and `npm run a11y`
    // cannot check it — the timer is not in the DOM until you tick something.
    <div className="rounded-card border border-line bg-ink-0 p-3" style={over ? { borderColor: cat('green') } : undefined}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-label text-fg-2">{over ? 'Rest over' : 'Resting'}</span>
        <span className="min-w-0 truncate text-label text-fg-2">{exercise}</span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
        {/*
          `role="timer"` with `aria-live="off"`: a countdown that announced
          itself every second would talk over everything else on the page. The
          one moment worth announcing is the end, and that is the polite region
          at the bottom, which only ever holds one sentence.
        */}
        <span role="timer" aria-live="off" className={`num text-h2 ${over ? 'text-green' : 'text-fg-1'}`}>{mmss}</span>
        <div className="flex flex-wrap gap-1.5">
          {!over && (
            <Button variant="secondary" size="sm" onClick={toggle}>{held === null ? 'Pause' : 'Resume'}</Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => add(30_000)}>+30s</Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button>
        </div>
      </div>

      <div aria-hidden className="rounded-pill mt-2 h-1 w-full overflow-hidden" style={{ background: cat('surface0') }}>
        <div className="rounded-pill h-full" style={{ width: `${pct}%`, background: over ? cat('green') : cat('blue') }} />
      </div>

      <span className="sr-only" aria-live="polite">{over ? `Rest over after ${exercise}` : ''}</span>
    </div>
  )
}
