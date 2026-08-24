import { ArrowCounterClockwise, ArrowLineRight, Pause, Play } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { useJournal } from '../../store'
import { todayISO } from '../../lib/date'
import { cat } from '../../lib/colors'
import { Button } from '../ui/button'
import { Eyebrow } from '../mod'

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
 * Was `components/PomodoroCard.tsx` — a `Card` with exactly one call site, this
 * page. It renders as a band cell now, so it stops being a raised surface
 * floating inside a flat page. Same timer, same auto-log, one less box.
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
  const R = 52
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
    <>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-heading font-medium text-fg-1">Timer</h2>
        <Eyebrow className="tracking-[0.1em]">
          {mode === 'work' ? 'Work' : 'Break'} · {blocks} {blocks === 1 ? 'block' : 'blocks'} done
        </Eyebrow>
      </div>

      <div className="mt-4 flex flex-col items-start">
        <div className="relative grid place-items-center">
          <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
            <circle cx="70" cy="70" r={R} fill="none" stroke={cat('surface1')} strokeWidth="8" />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={accent}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute text-center">
            <p className="num font-display text-display text-fg-1">
              {pad(Math.floor(shown / 60))}:{pad(shown % 60)}
            </p>
            <Eyebrow>{mode}</Eyebrow>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button variant="secondary" onClick={() => setRunning((r) => !r)} className="rounded-none">
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
          <Button variant="secondary" onClick={skip} aria-label="Skip to next" className="rounded-none">
            <Icon as={ArrowLineRight} size="sm" />
          </Button>
          <Button variant="secondary" onClick={reset} aria-label="Reset timer" className="rounded-none">
            <Icon as={ArrowCounterClockwise} size="sm" />
          </Button>
        </div>

        <div className="mt-3 flex gap-4 text-label">
          {PRESETS.map((p) => {
            const active = preset.label === p.label
            return (
              <button
                key={p.label}
                onClick={() => choose(p)}
                aria-pressed={active}
                className={`border-b-2 pb-0.5 ${active ? 'border-brand text-fg-1' : 'border-transparent text-fg-2 hover:text-brand-text'}`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
