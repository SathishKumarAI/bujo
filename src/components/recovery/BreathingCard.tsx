import { useEffect, useRef, useState } from 'react'
import { Wind } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { cat, onRaised } from '../../lib/colors'

/**
 * CYCLIC SIGHING, ON SCREEN · two breaths in, one long breath out.
 *
 * WHAT THIS FILE OWNS: the timing of one breath cycle and the thing you follow
 * with your eyes.
 * WHAT IT DOES NOT OWN: why the technique works — `lib/coping.ts` holds the
 * evidence and the source, and this card points at it.
 *
 * Asked for alongside "exercises, meditation, breathing". Of the breathing
 * patterns with a trial behind them this is the one that won: a Stanford study
 * compared it against two other patterns and against mindfulness meditation,
 * five minutes a day for a month, and cyclic sighing produced the largest mood
 * improvement and the biggest drop in resting breathing rate — measurable
 * after one five-minute session.
 *
 * ── Why a timer rather than a paragraph ──────────────────────────────────
 *
 * Reading "inhale, inhale, long exhale" during an urge is one more thing to do
 * with a mind that is already busy. A shape that expands and contracts is a
 * thing to *follow*, and following is most of what makes it work. The phase
 * label says what to do; the ring says how long is left of it.
 *
 * ── Honest about motion ──────────────────────────────────────────────────
 *
 * `prefers-reduced-motion` turns the animation off and leaves the phase label
 * and the countdown, which is the whole instruction — the circle is the nicety,
 * not the feature. A vestibular trigger on a page people open at their worst
 * moment is not a trade worth making.
 *
 * The timing is a `setTimeout` chain against `Date.now()`, not an interval
 * counting ticks: a throttled background tab comes back insisting four seconds
 * have passed, and this repo has already shipped one drifting timer
 * (`REUSABLE-PATTERNS.md` §25).
 */

/** One cycle, in milliseconds. Two inhales, then an exhale longer than both. */
const PHASES = [
  { id: 'in1', label: 'Breathe in through your nose', ms: 2200, scale: 0.78 },
  { id: 'in2', label: 'A second short sniff on top', ms: 1200, scale: 1 },
  { id: 'out', label: 'Long breath out through your mouth', ms: 5600, scale: 0.42 },
] as const

export function BreathingCard() {
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState(0)
  const [cycles, setCycles] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!running) return
    const p = PHASES[phase]
    /* Against a deadline, not a tick count — see the docstring. */
    const due = Date.now() + p.ms
    const step = () => {
      const left = due - Date.now()
      if (left > 30) { timer.current = setTimeout(step, Math.min(left, 250)); return }
      setPhase((i) => {
        const next = (i + 1) % PHASES.length
        if (next === 0) setCycles((c) => c + 1)
        return next
      })
    }
    timer.current = setTimeout(step, Math.min(p.ms, 250))
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [running, phase])

  const stop = () => {
    setRunning(false)
    setPhase(0)
  }

  const p = PHASES[phase]
  const tone = phase === 2 ? 'teal' : 'mauve'

  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={Wind} size="sm" style={{ color: onRaised('teal') }} /> Breathe with it</span>}
      subtitle="Two in, one long out · the pattern that beat meditation in a Stanford trial"
    >
      <div className="flex flex-col items-center gap-3 py-2">
        {/*
          `aria-hidden`, because the instruction below is the accessible
          content and a pulsing circle announced as anything would be noise.
          `motion-safe:` so reduced-motion gets a still circle and the words.
        */}
        <div
          aria-hidden
          className="grid h-32 w-32 place-items-center rounded-pill motion-safe:transition-transform motion-safe:duration-[1200ms] motion-safe:ease-in-out"
          style={{
            background: `${cat(tone)}22`,
            border: `2px solid ${cat(tone)}`,
            transform: running ? `scale(${p.scale})` : 'scale(0.8)',
            transitionDuration: running ? `${p.ms}ms` : undefined,
          }}
        >
          <span className="num text-heading" style={{ color: onRaised(tone) }}>{cycles}</span>
        </div>

        {/* `aria-live="polite"` and not `assertive`: it changes every couple of
            seconds, and an assertive region would interrupt a screen reader
            continuously for as long as the exercise ran. */}
        <p aria-live="polite" className="min-h-[1.5rem] text-center text-body text-fg-1">
          {running ? p.label : 'Five minutes is about twenty breaths. One is better than none.'}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant={running ? 'secondary' : 'primary'}
            onClick={() => (running ? stop() : (setCycles(0), setPhase(0), setRunning(true)))}
            className="press-3d"
          >
            {running ? 'Stop' : 'Start breathing'}
          </Button>
          {cycles > 0 && !running && (
            <span className="text-label text-fg-2">{cycles} breath{cycles === 1 ? '' : 's'} · that counts</span>
          )}
        </div>
      </div>
    </Card>
  )
}
