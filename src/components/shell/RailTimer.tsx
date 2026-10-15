import { Pause, Play, Timer, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { cat } from '../../lib/colors'
import {
  useFocusTimer, secondsLeft, isRunning, phaseSeconds,
  start, pause, resume, reset, PRESETS,
} from '../../lib/focusTimer'

/**
 * Start a focus block from anywhere, and see it running from anywhere.
 *
 * ── Why this is in the rail and not a page ────────────────────────────────
 *
 * Asked for: a small tab in the sidebar to pull the timer up and start a
 * Pomodoro. The reason it is the right place is sharper than convenience.
 *
 * The timer was a component on the Focus view holding its countdown in
 * `useState`, so it **died the moment you navigated away** — meaning it could
 * only be used by someone sitting on the Focus screen watching it, which is
 * precisely the thing a focus timer exists to stop you doing. And its
 * `setInterval` was throttled to once a minute in a background tab, so the one
 * session it could measure was also the one it measured wrong.
 *
 * `lib/focusTimer.ts` moved the state to a module store keyed on a wall-clock
 * `endsAt`. This is the view that makes the move worth anything: the rail is on
 * every desktop screen and never scrolls away, so a running block is visible
 * from inside whatever you are actually doing.
 *
 * ── The tick is only for repainting ──────────────────────────────────────
 *
 * The interval here does not measure anything — `secondsLeft` subtracts from
 * `Date.now()`. If the browser throttles this to once a minute, or stops it
 * entirely, the displayed number is stale but never *wrong*, and it corrects
 * itself the instant the tab is looked at again. That is the whole reason the
 * store holds a deadline rather than a counter.
 */
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function RailTimer() {
  const t = useFocusTimer()
  const running = isRunning(t)
  const [, repaint] = useState(0)

  // One second while running, nothing while idle. A paused or stopped timer has
  // no changing value, so an interval then would be a wake-up for no reason —
  // which on a laptop is a real cost and on a phone is battery.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => repaint((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const left = secondsLeft(t)
  const total = phaseSeconds(t)
  const pct = total > 0 ? 1 - left / total : 0
  const isBreak = t.mode === 'break'
  // Break is always green: it is the phase whose job is to say stop.
  const tone = isBreak ? 'green' : t.tone

  // Idle: one control, one tap, no decisions. The preset is whatever it was
  // last time — asking "how long?" before you have started is the activation
  // cost that stops a block from happening at all.
  if (!running && left === total) {
    return (
      <button
        type="button"
        onClick={() => start('work')}
        className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-label text-fg-2 transition-colors hover:bg-ink-2 hover:text-fg-1"
        title={`Start a ${PRESETS[t.presetIndex].w}-minute focus block`}
      >
        <Icon as={Timer} size="sm" />
        <span className="truncate">Focus · {PRESETS[t.presetIndex].w}m</span>
        {t.blocks > 0 && (
          <span className="ml-auto tabular-nums text-micro text-fg-3">{t.blocks}✓</span>
        )}
      </button>
    )
  }

  return (
    <div className="flex w-full flex-col gap-1.5 rounded-control bg-ink-2 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <span className="truncate text-micro text-fg-3">{isBreak ? 'Break' : 'Focus'}</span>
        <span className="ml-auto tabular-nums text-label font-medium" style={{ color: cat(tone) }}>
          {mmss(left)}
        </span>
      </div>

      {/* The bar is the glanceable part — the digits need reading, this does
          not. `aria-hidden` because the time beside it is already text. */}
      <div aria-hidden className="h-1 w-full overflow-hidden rounded-pill" style={{ background: cat('surface0') }}>
        <div style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, height: '100%', background: cat(tone) }} />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => (running ? pause() : resume())}
          className="grid size-6 place-items-center rounded-control text-fg-2 hover:bg-ink-1 hover:text-fg-1"
          aria-label={running ? 'Pause the focus block' : 'Resume the focus block'}
        >
          <Icon as={running ? Pause : Play} size="sm" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="grid size-6 place-items-center rounded-control text-fg-2 hover:bg-ink-1 hover:text-fg-1"
          aria-label="Stop the focus block"
        >
          <Icon as={X} size="sm" />
        </button>
        {t.blocks > 0 && (
          <span className="ml-auto pr-1 tabular-nums text-micro text-fg-3">{t.blocks}✓ today</span>
        )}
      </div>
    </div>
  )
}
