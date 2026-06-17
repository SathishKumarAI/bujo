import { useEffect, useState } from 'react'
import { Timer, Play, Square, Check, Flame, X } from 'lucide-react'
import { useJournal } from '../store'
import { Card, Button } from './ui'
import { Stepper } from './fields/Stepper'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import { DEFAULT_FAST_TARGET, elapsedHours, fastHours, fmtDuration, fastingStreak, recentFasts } from '../lib/fasting'

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })

/**
 * Intermittent-fasting tracker: start/stop a fast, watch the window fill toward
 * your personal target (e.g. 16:8), and verify day-to-day from the recent log.
 */
export function FastingCard() {
  const { data, startFast, endFast, removeFast, setSettings } = useJournal()
  const target = data.settings.fastTargetHours ?? DEFAULT_FAST_TARGET
  const active = data.settings.fastActiveStart
  const fasts = data.fasts ?? []

  // Tick while a fast is running so the elapsed time stays live.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [active])

  const elapsed = active ? elapsedHours(active, now) : 0
  const pct = Math.min(100, (elapsed / target) * 100)
  const hitNow = elapsed + 1e-9 >= target
  const streak = fastingStreak(fasts, target, todayISO())
  const recent = recentFasts(fasts, 5)
  const last = recent[0]

  return (
    <Card
      title="Intermittent fasting"
      subtitle={`${target}:${24 - target} window · track it day to day`}
      right={
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span title={`${streak}-day streak hitting ${target}h`} className="inline-flex items-center gap-0.5 text-xs" style={{ color: cat('peach') }}>
              <Flame size={12} />{streak}
            </span>
          )}
          <Stepper aria-label="Target hours" value={target} onChange={(v) => setSettings({ fastTargetHours: v ?? DEFAULT_FAST_TARGET })} min={8} max={23} step={1} suffix="h" />
        </div>
      }
    >
      {active ? (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl text-text">{fmtDuration(elapsed)}</span>
            <span className="text-sm" style={{ color: hitNow ? cat('green') : cat('overlay1') }}>
              {hitNow ? <span className="inline-flex items-center gap-1"><Check size={14} /> target met</span> : `of ${target}h`}
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface0">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cat(hitNow ? 'green' : 'mauve') }} />
          </div>
          <p className="mt-2 text-xs text-overlay0">Started {timeOf(active)}</p>
          <Button variant="primary" onClick={endFast} className="mt-3 inline-flex items-center gap-1.5"><Square size={14} /> End fast</Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <Button variant="primary" onClick={startFast} className="inline-flex items-center gap-1.5"><Play size={14} /> Start fast</Button>
            {last && (
              <span className="text-sm text-subtext1">
                Last: <span style={{ color: fastHours(last) >= target ? cat('green') : cat('subtext0') }}>{fmtDuration(fastHours(last))}</span>
              </span>
            )}
          </div>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-overlay0"><Timer size={12} /> Tap when you stop eating; end it at your first meal.</p>
        </div>
      )}

      {recent.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-surface0 pt-3">
          {recent.map((f) => {
            const h = fastHours(f)
            const hit = h >= target
            return (
              <li key={f.id} className="group flex items-center gap-2 text-sm">
                <span className="w-14 shrink-0 text-overlay0">{dayLabel(f.end)}</span>
                <span className="w-20 shrink-0 tabular-nums" style={{ color: hit ? cat('green') : cat('subtext1') }}>{fmtDuration(h)}</span>
                <span className="shrink-0">{hit ? <Check size={13} style={{ color: cat('green') }} /> : <span className="text-overlay0">·</span>}</span>
                <span className="flex-1 truncate text-xs text-overlay0">{timeOf(f.start)} → {timeOf(f.end)}</span>
                <button onClick={() => removeFast(f.id)} aria-label="Remove fast" className="shrink-0 text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red"><X size={13} /></button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
