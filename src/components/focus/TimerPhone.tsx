import { useEffect, useState } from 'react'
import { ArrowCounterClockwise, ArrowLineRight, Pause, Play } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Seg } from '../ui/seg'
import { cat } from '../../lib/colors'
import {
  PRESETS, useFocusTimer, secondsLeft, isRunning, phaseSeconds,
  start, pause, resume, reset, setPreset, advance,
} from '../../lib/focusTimer'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * THE TIMER ON A PHONE — one card, not a 240px ring.
 *
 * OWNS: the phone drawing of the shared timer: the countdown and its mode in
 * one row with Start / Skip / Reset, a progress line in the timer's colour,
 * and the work/break length as a segmented row.
 * DOES NOT OWN: any timer state (`lib/focusTimer.ts`), the auto-log of a
 * finished block (`useFocusTimerRunner`, in the shell) or the colour picker —
 * that stays on the desktop's `FocusTimer`, and the tone it sets shows here.
 */
export function TimerPhone() {
  const t = useFocusTimer()
  const running = isRunning(t)
  const total = phaseSeconds(t)
  const shown = secondsLeft(t)
  const [, repaint] = useState(0)
  // Repaint only — the number is derived from the wall clock (see FocusTimer).
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => repaint((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  const pct = total ? ((total - shown) / total) * 100 : 0

  return (
    <section aria-label="Timer" className="cells">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="min-w-0 flex-1">
          <p className="num text-title font-bold text-fg-1 tabular-nums">{pad(Math.floor(shown / 60))}:{pad(shown % 60)}</p>
          <p className="truncate text-label text-fg-2" aria-live="polite">
            {/* The mode and the blocks done today — the week's total was here and
                cut to "1h 40m thi…" beside three buttons. */}
            <span className="capitalize">{t.mode}</span>{t.blocks > 0 && ` · ${t.blocks} done today`}
          </p>
        </div>
        <button type="button" className="cta cta-compact focus-start" onClick={() => (running ? pause() : (shown < total ? resume() : start('work')))}>
          <Icon as={running ? Pause : Play} size="sm" />{running ? 'Pause' : 'Start'}
        </button>
        <button type="button" className="round-btn" onClick={() => advance()} aria-label="Skip to next"><Icon as={ArrowLineRight} size="sm" /></button>
        <button type="button" className="round-btn" onClick={() => reset()} aria-label="Reset timer"><Icon as={ArrowCounterClockwise} size="sm" /></button>
      </div>
      <div className="mx-4 h-1 overflow-hidden rounded-pill bg-ink-2" aria-hidden>
        <div className="h-full rounded-pill transition-[width]" style={{ width: `${pct}%`, background: t.mode === 'work' ? cat(t.tone) : cat('green') }} />
      </div>
      <div className="px-4 pt-2 pb-3">
        {/* Always holds a preset, so no `allowNone` — a tap on the lit one confirms it. */}
        <Seg label="Work and break length" value={t.presetIndex} onChange={(i) => i != null && setPreset(i)}
          options={PRESETS.map((p, i) => ({ value: i, label: p.label }))} />
      </div>
    </section>
  )
}
