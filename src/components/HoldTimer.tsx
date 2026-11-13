import { useEffect, useRef, useState } from 'react'
import { Sheet } from './ui/sheet'
import { mmss } from '../lib/holdTime'

/**
 * THE BIG TIMER for a timed exercise — a plank, a dead hang, a Tabata round,
 * battle rope, ten minutes on the bike — so a phone needs no second app
 * (owner, 2026-11-13: "a timer, like a stopwatch … very giant … just need to
 * save the seconds").
 *
 * OWNS: a stopwatch that counts UP, the target beside it, one buzz when the
 * target is reached (it keeps counting, so you see how far past you held),
 * the screen kept awake while it runs, and "Save" handing back whole seconds.
 * DOES NOT OWN: what a saved hold means for the card that opened it — each
 * caller ticks its own set (`pullups/ProgramDay`, `program/phone/ProgramPhone`,
 * `homeworkout/SessionPhone`). Which cards get one: `lib/holdTime.ts` `secondsIn`.
 *
 * Counted from `Date.now()`, not by adding ticks, so a busy phone that skips
 * an interval does not lose time. No animation: the digits change, nothing moves.
 */
export function HoldTimer({ name, target, onSave, onClose }: {
  name: string
  /** Seconds the plan asks for; null for a plain stopwatch. */
  target: number | null
  onSave: (seconds: number) => void
  onClose: () => void
}) {
  /** Milliseconds banked from earlier runs, and when the current run started. */
  const [banked, setBanked] = useState(0)
  const [since, setSince] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const buzzed = useRef(false)

  const ms = banked + (since == null ? 0 : now - since)
  const secs = Math.floor(ms / 1000)
  const reached = target != null && secs >= target

  useEffect(() => {
    if (since == null) return
    const id = setInterval(() => setNow(Date.now()), 200)
    // Keep the screen on while it runs; a phone that sleeps mid-plank is a
    // timer that lies. Not every browser has it, and it may be refused.
    let lock: { release: () => Promise<void> } | null = null
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    wl?.request('screen').then((l) => { lock = l }).catch(() => {})
    return () => { clearInterval(id); lock?.release().catch(() => {}) }
  }, [since])

  useEffect(() => {
    if (reached && !buzzed.current) {
      buzzed.current = true
      navigator.vibrate?.(300)
    }
  }, [reached])

  function toggle() {
    if (since == null) { const t = Date.now(); setSince(t); setNow(t) }
    else { setBanked(ms); setSince(null) }
  }
  function reset() { setBanked(0); setSince(null); buzzed.current = false }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }} title={name}
      description={target != null ? `Target ${mmss(target)}` : 'Stopwatch'}>
      <div className="flex flex-col items-center gap-5 py-4">
        <output className="hold-clock" data-reached={reached || undefined} aria-live="off" aria-label={`${secs} seconds`}>
          {mmss(secs)}
        </output>
        <p className="text-body text-fg-2" aria-live="polite">
          {reached ? 'Target reached' : target != null ? `of ${mmss(target)}` : since == null && secs === 0 ? 'Tap start' : ' '}
        </p>
        <button type="button" className="hold-go" aria-pressed={since != null} onClick={toggle}>
          {since != null ? 'Pause' : secs > 0 ? 'Resume' : 'Start'}
        </button>
        <div className="flex w-full gap-3">
          <button type="button" className="hold-sub" onClick={reset} disabled={secs === 0}>Reset</button>
          <button type="button" className="hold-sub hold-save" disabled={secs === 0}
            onClick={() => { onSave(secs); onClose() }}>
            Save {secs} s
          </button>
        </div>
      </div>
    </Sheet>
  )
}
