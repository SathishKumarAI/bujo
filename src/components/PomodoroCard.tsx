import { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import { Card, Button } from './ui'
import { cat } from '../lib/colors'

// ADHD-friendly defaults: start gentle, scale up. Pomodoro work/break in minutes.
const PRESETS = [
  { w: 15, b: 3, label: '15 / 3' },
  { w: 25, b: 5, label: '25 / 5' },
  { w: 50, b: 10, label: '50 / 10' },
]

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * A focus timer (Pomodoro) — a visual countdown with gentle work/break cycles,
 * the ADHD-focus mechanic from habitify.me. Self-contained; counts the focus
 * blocks finished this sitting.
 */
export function PomodoroCard() {
  const [preset, setPreset] = useState(PRESETS[1])
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [left, setLeft] = useState(PRESETS[1].w * 60)
  const [running, setRunning] = useState(false)
  const [blocks, setBlocks] = useState(0)

  const total = (mode === 'work' ? preset.w : preset.b) * 60
  const minsFor = (m: 'work' | 'break', p = preset) => (m === 'work' ? p.w : p.b) * 60

  // Tick down once a second while running.
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running])

  // At zero, switch work ↔ break (counting a finished focus block) and reload.
  // Deferred out of the effect body to avoid a synchronous cascading render.
  useEffect(() => {
    if (left > 0 || !running) return
    queueMicrotask(() => {
      const nextMode = mode === 'work' ? 'break' : 'work'
      if (mode === 'work') setBlocks((b) => b + 1)
      setMode(nextMode)
      setLeft(minsFor(nextMode))
    })
  }, [left, running, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const shown = Math.max(0, left)
  const pct = total ? ((total - shown) / total) * 100 : 0
  const R = 52
  const C = 2 * Math.PI * R
  const accent = mode === 'work' ? cat('mauve') : cat('green')

  function reset() { setRunning(false); setMode('work'); setLeft(preset.w * 60) }
  function skip() {
    setRunning(false)
    const nm = mode === 'work' ? 'break' : 'work'
    setMode(nm); setLeft(minsFor(nm))
  }
  function choose(p: typeof PRESETS[number]) { setRunning(false); setMode('work'); setPreset(p); setLeft(p.w * 60) }

  return (
    <Card title="Focus timer" subtitle={`${mode === 'work' ? 'Work' : 'Break'} · ${blocks} block${blocks === 1 ? '' : 's'} done`}>
      <div className="flex flex-col items-center">
        <div className="relative grid place-items-center">
          <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
            <circle cx="70" cy="70" r={R} fill="none" stroke={cat('surface1')} strokeWidth="8" />
            <circle cx="70" cy="70" r={R} fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute text-center">
            <p className="font-display text-3xl tabular-nums text-text">{pad(Math.floor(shown / 60))}:{pad(shown % 60)}</p>
            <p className="text-xs uppercase tracking-wide text-overlay0">{mode}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button variant="primary" onClick={() => setRunning((r) => !r)} className="inline-flex items-center gap-1.5">
            {running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Start</>}
          </Button>
          <Button onClick={skip} aria-label="Skip" title="Skip to next"><SkipForward size={15} /></Button>
          <Button onClick={reset} aria-label="Reset" title="Reset"><RotateCcw size={15} /></Button>
        </div>

        <div className="mt-3 flex gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p.label} variant={preset.label === p.label ? 'primary' : 'ghost'} onClick={() => choose(p)} className="text-xs">{p.label}</Button>
          ))}
        </div>
      </div>
    </Card>
  )
}
