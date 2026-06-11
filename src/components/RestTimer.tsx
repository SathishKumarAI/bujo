import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { cat } from '../lib/colors'

const PRESETS = [60, 90, 120, 180]

/** A simple between-sets rest countdown. Local, no audio dependency. */
export function RestTimer() {
  const [total, setTotal] = useState(90)
  const [left, setLeft] = useState(90)
  const [running, setRunning] = useState(false)
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
  }

  const mm = String(Math.floor(left / 60)).padStart(1, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = total ? (left / total) * 100 : 0
  const done = left === 0

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative grid h-16 w-16 shrink-0 place-items-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke={cat('surface0')} strokeWidth="3" />
          <circle cx="18" cy="18" r="16" fill="none" stroke={done ? cat('green') : cat('mauve')} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 100.5} 100.5`} />
        </svg>
        <span className="font-mono text-sm text-text">{mm}:{ss}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => start(s)}
            className="rounded-lg px-2.5 py-1 text-xs"
            style={{ background: total === s ? cat('mauve') : cat('surface0'), color: total === s ? cat('crust') : cat('subtext1') }}
          >
            {s < 120 ? `${s}s` : `${s / 60}m`}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        <button onClick={() => setRunning((r) => !r)} aria-label={running ? 'Pause' : 'Start'} className="grid h-8 w-8 place-items-center rounded-lg bg-surface0 text-text hover:bg-surface1">
          {running ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button onClick={() => { setLeft(total); setRunning(false) }} aria-label="Reset" className="grid h-8 w-8 place-items-center rounded-lg bg-surface0 text-text hover:bg-surface1">
          <RotateCcw size={15} />
        </button>
      </div>

      {done && <span className="inline-flex items-center gap-1 text-sm" style={{ color: cat('green') }}><Timer size={14} /> Rest done — go!</span>}
    </div>
  )
}
