import { Check, Drop, Flame, ForkKnife, Play, Square, Timer, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { useJournal } from '../store'
import { Card } from './ui'
import { Stepper } from './fields/Stepper'
import { cat, onRaised } from '../lib/colors'
import { todayISO } from '../lib/date'
import { DEFAULT_FAST_TARGET, elapsedHours, fastHours, fmtDuration, fastingStreak, recentFasts } from '../lib/fasting'
import { Button } from './ui/button'

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })

/**
 * Intermittent-fasting tracker: start/stop a fast, watch the window fill toward
 * your personal target (e.g. 16:8), and verify day-to-day from the recent log.
 */
export function FastingCard({ date = todayISO() }: {
  /** The day whose `fastBreak` this card edits. Defaults to today, but Today
   *  can be walked backwards — without this, editing Monday's page wrote
   *  TUESDAY's record, silently, because the control moved here from a card
   *  that had always been handed the cursor's date. The fast timer itself is
   *  genuinely live-only and still reads `todayISO()`. */
  date?: string
} = {}) {
  const { data, startFast, endFast, removeFast, setSettings, setMetric } = useJournal()
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

  const metric = data.metrics.find((m) => m.date === date)

  return (
    <Card band
      title="Intermittent fasting"
      subtitle={`${target}:${24 - target} window, track it day to day`}
      hideInfo
      right={
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span title={`${streak}-day streak hitting ${target}h`} className="inline-flex items-center gap-0.5 text-label" style={{ color: onRaised('peach') }}>
              <Icon as={Flame} size="sm" />{streak}
            </span>
          )}
          <Stepper aria-label="Target hours" value={target} onChange={(v) => setSettings({ fastTargetHours: v ?? DEFAULT_FAST_TARGET })} min={8} max={23} step={1} suffix="h" />
        </div>
      }
    >
      {active ? (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-display text-fg-1">{fmtDuration(elapsed)}</span>
            <span className="text-body" style={{ color: hitNow ? cat('green') : cat('overlay1') }}>
              {hitNow ? <span className="inline-flex items-center gap-1"><Icon as={Check} size="sm" /> target met</span> : `of ${target}h`}
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-pill bg-ink-2">
            <div className="h-full rounded-pill transition-all" style={{ width: `${pct}%`, background: cat(hitNow ? 'green' : 'mauve') }} />
          </div>
          <p className="mt-2 text-label text-fg-2">Started {timeOf(active)}</p>
          <Button variant="secondary" onClick={endFast} className="press-3d mt-3 inline-flex items-center gap-1.5"><Icon as={Square} size="sm" /> End fast</Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={startFast} className="press-3d inline-flex items-center gap-1.5"><Icon as={Play} size="sm" /> Start fast</Button>
            {last && (
              <span className="text-body text-fg-1">
                Last: <span style={{ color: fastHours(last) >= target ? cat('green') : cat('subtext0') }}>{fmtDuration(fastHours(last))}</span>
              </span>
            )}
          </div>
          <p className="mt-2 inline-flex items-center gap-1 text-label text-fg-2"><Icon as={Timer} size="sm" /> Tap when you stop eating; end it at your first meal.</p>
        </div>
      )}

      {recent.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-line pt-3">
          {recent.map((f) => {
            const h = fastHours(f)
            const hit = h >= target
            return (
              <li key={f.id} className="group flex items-center gap-2 text-body">
                <span className="w-14 shrink-0 text-fg-2">{dayLabel(f.end)}</span>
                <span className="w-20 shrink-0 tabular-nums" style={{ color: hit ? cat('green') : cat('subtext1') }}>{fmtDuration(h)}</span>
                <span className="shrink-0">{hit ? <Icon as={Check} size="sm" style={{ color: onRaised('green') }} /> : <span className="text-fg-2">·</span>}</span>
                <span className="flex-1 truncate text-label text-fg-2">{timeOf(f.start)} → {timeOf(f.end)}</span>
                <button onClick={() => removeFast(f.id)} aria-label="Remove fast" className="shrink-0 text-fg-2 reveal hover:text-red"><Icon as={X} size="sm" /></button>
              </li>
            )
          })}
        </ul>
      )}
      {/* WHAT BROKE THE FAST, moved here from the check-in card.
          It was sitting under Mood / Stress / Energy / Sleep, which made the
          check-in the tallest card on Today (627px, the column that set the
          page height) and asked a fasting question in the middle of a wellbeing
          one. It is the same `metrics.fastBreak` field and the same writer —
          only the card it is asked on changed, so nothing about the record
          moves and Insights reads it exactly as before. */}
      <div className="mt-4 border-t border-line pt-3">
        <p className="mb-2 text-body text-fg-1">What broke your fast</p>
        {/* These record a choice, so the selected one gets the accent wash
            rather than the accent fill — a filled pill here read as the
            screen's primary action, which it never was. */}
        <div className="flex gap-2">
          {([['food', ForkKnife, 'Food'], ['drink', Drop, 'Drink']] as const).map(([kind, glyph, label]) => (
            <Button
              key={kind}
              variant="ghost"
              aria-pressed={metric?.fastBreak === kind}
              onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === kind ? undefined : kind })}
              className={`press-3d inline-flex min-h-11 items-center gap-1.5 rounded-control ${metric?.fastBreak === kind ? 'bg-brand-wash font-medium text-brand-text' : ''}`}
            >
              <Icon as={glyph} size="sm" /> {label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  )
}
