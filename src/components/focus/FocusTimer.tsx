import { ArrowCounterClockwise, ArrowLineRight, Pause, Play } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { useJournal } from '../../store'
import { todayISO } from '../../lib/date'
import { cat } from '../../lib/colors'
import { Button } from '../ui/button'

// ADHD-friendly defaults: start gentle, scale up. Work / break in minutes.
const PRESETS = [
  { w: 15, b: 3, label: '15 / 3' },
  { w: 25, b: 5, label: '25 / 5' },
  { w: 50, b: 10, label: '50 / 10' },
]

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * A Pomodoro timer: visual countdown, gentle work/break cycles, and a finished
 * work block auto-logs itself as a focus session.
 *
 * **It is the biggest thing on the page now, and it is on the right.** Those are
 * one decision, not two. `styles/layout.css` puts zone 2 (act) in the RIGHT
 * column and zone 3 (review) in the LEFT on a wide screen, against DOM order and
 * deliberately — so "a big timer on the right" is the same statement as "the
 * timer is what this page is for". Below the split it comes first in DOM order,
 * which is also right: you open Focus to start a block, not to read a chart.
 *
 * The ring went 140px → 240px at its own natural size and scales with the column
 * (`max-w-[17rem]`, `w-full`), so it fills the 450px act column at 1440 and
 * still fits the 358px one a 390px phone gives it. The countdown stays at
 * `--text-display`, the scale's top step: DESIGN.md allows "display or larger"
 * for a page's identity element but bans an eighth type step outright, and a
 * one-off clamp is an eighth step with no name. The ring carries the size.
 *
 * Was `components/PomodoroCard.tsx` — a `Card` with exactly one call site. The
 * timer, the presets and the auto-log are unchanged from that component; only
 * its box and its scale have moved.
 */
export function FocusTimer() {
  const { addDevSession } = useJournal()
  const [preset, setPreset] = useState(PRESETS[1])
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [left, setLeft] = useState(PRESETS[1].w * 60)
  const [running, setRunning] = useState(false)
  const [blocks, setBlocks] = useState(0)

  const total = (mode === 'work' ? preset.w : preset.b) * 60
  const minsFor = (m: 'work' | 'break', p = preset) => (m === 'work' ? p.w : p.b) * 60

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running])

  // At zero, switch work ↔ break and reload. Deferred out of the effect body to
  // avoid a synchronous cascading render.
  useEffect(() => {
    if (left > 0 || !running) return
    queueMicrotask(() => {
      const nextMode = mode === 'work' ? 'break' : 'work'
      if (mode === 'work') {
        setBlocks((b) => b + 1)
        addDevSession({ date: todayISO(), durationMin: preset.w, project: 'Focus timer', focus: 8, stress: 2, tags: ['focus'] })
      }
      setMode(nextMode)
      setLeft(minsFor(nextMode))
    })
  }, [left, running, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const shown = Math.max(0, left)
  const pct = total ? ((total - shown) / total) * 100 : 0
  /* A 240px box at native size. The ring is drawn in viewBox units and scaled by
     CSS, so the stroke and the radius stay in proportion at every column width
     and nothing here is a px value that belongs to type or to a control. */
  const BOX = 240
  const R = 104
  const C = 2 * Math.PI * R
  const accent = mode === 'work' ? cat('mauve') : cat('green')

  function reset() {
    setRunning(false)
    setMode('work')
    setLeft(preset.w * 60)
  }
  function skip() {
    setRunning(false)
    const nm = mode === 'work' ? 'break' : 'work'
    setMode(nm)
    setLeft(minsFor(nm))
  }
  function choose(p: (typeof PRESETS)[number]) {
    setRunning(false)
    setMode('work')
    setPreset(p)
    setLeft(p.w * 60)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid w-full max-w-[17rem] place-items-center">
        <svg viewBox={`0 0 ${BOX} ${BOX}`} className="w-full" aria-hidden>
          <circle cx={BOX / 2} cy={BOX / 2} r={R} fill="none" stroke={cat('surface1')} strokeWidth="12" />
          <circle
            cx={BOX / 2}
            cy={BOX / 2}
            r={R}
            fill="none"
            stroke={accent}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct / 100)}
            transform={`rotate(-90 ${BOX / 2} ${BOX / 2})`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute text-center">
          {/* `aria-live` on the mode and not on the clock. A polite region that
              changes every second is a screen reader talking over itself; what a
              non-sighted user needs announced is the switch from work to break,
              which is the event the ring communicates visually. */}
          <p className="num font-display text-display font-medium text-fg-1">
            {pad(Math.floor(shown / 60))}:{pad(shown % 60)}
          </p>
          <p className="mt-1 text-label capitalize text-fg-2" aria-live="polite">
            {mode}
            <span className="sr-only">
              , {blocks} {blocks === 1 ? 'block' : 'blocks'} done today
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {/* `lg`, and the only `lg` control in zone 2 besides the log form's
            submit. Start is the button this page exists for and the one a phone
            user aims at with a thumb. */}
        <Button variant="secondary" size="lg" onClick={() => setRunning((r) => !r)}>
          {running ? (
            <>
              <Icon as={Pause} size="sm" /> Pause
            </>
          ) : (
            <>
              <Icon as={Play} size="sm" /> Start
            </>
          )}
        </Button>
        <Button variant="secondary" size="lg" onClick={skip} aria-label="Skip to next">
          <Icon as={ArrowLineRight} size="sm" />
        </Button>
        <Button variant="secondary" size="lg" onClick={reset} aria-label="Reset timer">
          <Icon as={ArrowCounterClockwise} size="sm" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-1" role="group" aria-label="Work and break length">
        {PRESETS.map((p) => {
          const active = preset.label === p.label
          return (
            <button
              key={p.label}
              onClick={() => choose(p)}
              aria-pressed={active}
              /* `min-h-11` is the 44px hit floor (COD-96). These were a
                 `border-b-2` text row whose target was the glyph height. */
              className={`min-h-11 rounded-control px-3 text-label transition-colors ${
                active ? 'bg-brand-wash font-medium text-brand-text' : 'text-fg-2 hover:bg-ink-2 hover:text-fg-1'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-label text-fg-2">
        {blocks > 0
          ? `${blocks} ${blocks === 1 ? 'block' : 'blocks'} done today · each one logs itself`
          : 'A finished work block logs itself as a session'}
      </p>
    </div>
  )
}
