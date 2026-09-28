import { ArrowCounterClockwise, Pause, Play, Timer } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useRef, useState } from 'react'
import { cat, onRaised } from '../lib/colors'
import { Button } from './ui/button'

const PRESETS = [60, 90, 120, 180]
/** What "a bit longer" means. One tap, because you decide this mid-set. */
const BUMP = 30

/**
 * REST TIMER · the one control on this page you use with a bar in your hands.
 *
 * It moved to the **top** of zone 2 and it was redesigned, and the two are the
 * same decision. Its old home was the bottom of the act column, under the
 * logger and the last-session card, which meant the control you reach for
 * *between sets* was the one furthest from where you had just typed. The file
 * history records it being moved out of the review column for this exact
 * reason; this is the same fix one step further.
 *
 * What changed beyond the position:
 *
 * | Was | Is |
 * |---|---|
 * | A 64px ring with the time inside at `text-body` (15px) | `text-display` (32px) mono, legible at arm's length |
 * | A ring restating the number beside it | A full-width track — the one reading you take without focusing |
 * | Four presets filled with the page accent | Neutral. The accent is the running track, and the page's is `Finish session` |
 * | Nothing between 90s and 120s | `+30s`, because you decide that mid-rest |
 * | One layout, idle or running | Compact row when idle; the time takes over when it is counting |
 *
 * **The ring had to go rather than grow.** A progress ring is an accent
 * appearance even in neutral, and this one encoded nothing the digits did not
 * — `docs/PAGE-SHAPE.md` calls that out by name. A horizontal track earns its
 * place differently: it is readable at a glance from further away than a
 * number is, which is the whole job here.
 *
 * **Not auto-started when a set is logged.** That is the obvious next move and
 * it is a behaviour change, not a layout one — it needs a decision about what
 * happens when you edit a set you logged ten minutes ago. Left deliberately.
 */
export function RestTimer() {
  const [total, setTotal] = useState(90)
  const [left, setLeft] = useState(90)
  const [running, setRunning] = useState(false)
  /** Idle until the first start — that is what keeps the compact row compact. */
  const [armed, setArmed] = useState(false)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setLeft((l) => {
          if (l <= 1) {
            setRunning(false)
            return 0
          }
          return l - 1
        })
      }, 1000)
    }
    return () => {
      if (ref.current) clearInterval(ref.current)
    }
  }, [running])

  function start(sec: number) {
    setTotal(sec)
    setLeft(sec)
    setRunning(true)
    setArmed(true)
  }

  const mm = String(Math.floor(left / 60))
  const ss = String(left % 60).padStart(2, '0')
  const done = armed && left === 0
  // Elapsed, not remaining: a track that empties reads as something draining
  // away, and the thing you are waiting for is the fill reaching the end.
  const pct = total ? ((total - left) / total) * 100 : 0
  const label = (s: number) => (s < 120 ? `${s}s` : `${s / 60}m`)

  return (
    <section
      aria-label="Rest timer"
      className="rounded-card px-3 py-2.5"
      style={{ background: cat('surface0') }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-label text-fg-2">
          <Icon as={Timer} size="sm" /> Rest
        </span>

        {/* The countdown. `aria-live` is off on purpose — a value that changes
            every second under an assertive region reads the whole timer aloud
            sixty times a minute and makes the page unusable with a screen
            reader on. The single moment worth announcing is the end, and that
            is the region below. */}
        {armed && (
          <output
            aria-live="off"
            className="num font-medium tabular-nums"
            style={{
              fontSize: 'var(--text-display)',
              lineHeight: 'var(--text-display--line-height)',
              color: done ? onRaised('green') : 'var(--color-fg-1)',
            }}
          >
            {mm}:{ss}
          </output>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-1">
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => start(s)}
              aria-pressed={armed && total === s}
              /* Neutral fill, outlined when selected. These were accent-filled,
                 which made four accent controls on a page whose single accent
                 belongs to `Finish session`. The selected one is distinguished
                 by its ground and its border, not by the accent. */
              className="min-h-11 rounded-control px-2.5 text-label sm:min-h-0 sm:py-1"
              style={{
                background: armed && total === s ? cat('surface1') : 'transparent',
                color: armed && total === s ? 'var(--color-fg-1)' : cat('subtext1'),
                border: `1px solid ${armed && total === s ? cat('overlay0') : 'transparent'}`,
              }}
            >
              {label(s)}
            </button>
          ))}
          {armed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLeft((l) => l + BUMP)}
              className="min-h-11 rounded-control sm:min-h-0"
            >
              +{BUMP}s
            </Button>
          )}
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={() => { if (!armed) { start(total); return } setRunning((r) => !r) }}
            aria-label={running ? 'Pause rest timer' : 'Start rest timer'}
            className="h-11 w-11 rounded-control sm:h-8 sm:w-8"
          >
            {running ? <Icon as={Pause} size="sm" /> : <Icon as={Play} size="sm" />}
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={() => { setLeft(total); setRunning(false); setArmed(false) }}
            aria-label="Reset rest timer"
            className="h-11 w-11 rounded-control sm:h-8 sm:w-8"
          >
            <Icon as={ArrowCounterClockwise} size="sm" />
          </Button>
        </div>
      </div>

      {/* The track. Full width, 6px, and only drawn once the timer is armed —
          an empty track above an idle row is chrome pretending to be data.
          `motion-reduce:transition-none` because a width that animates is
          motion, and the two moves this design world licenses are value
          transitions and hover. */}
      {armed && (
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-pill"
          style={{ background: cat('surface1') }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={total - left}
          aria-valuetext={`${mm}:${ss} left of ${label(total)}`}
        >
          <div
            className="h-full rounded-pill transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
            style={{ width: `${pct}%`, background: done ? cat('green') : cat('mauve') }}
          />
        </div>
      )}

      {/* The one thing worth interrupting a screen reader for. */}
      <p aria-live="assertive" className="sr-only">{done ? 'Rest done' : ''}</p>
      {done && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-label" style={{ color: onRaised('green') }}>
          <Icon as={Timer} size="sm" /> Rest done — next set
        </p>
      )}
    </section>
  )
}
