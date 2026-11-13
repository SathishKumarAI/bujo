import { useEffect, useRef, useState } from 'react'
import { Sheet } from './ui/sheet'
import { Minus, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { describeIntervals, mmss, retune, startOf, stepAt, type Intervals, type Tune } from '../lib/holdTime'

/**
 * THE INTERVAL TIMER — Tabata (20 s work, 10 s rest, eight rounds) and a run
 * of holds ("15,30,15 s"). Owner, 2026-11-13: "right after 20 seconds I need
 * a pause of 10 seconds … I need to do it like 8 times".
 *
 * OWNS: counting each step DOWN, saying work or rest in a word big enough to
 * read from the floor, three short beeps before every switch and a long one
 * on it (sound, because an iPhone browser cannot vibrate), stopping between
 * holds when `manual`, and "Save" handing back the work steps finished.
 * DOES NOT OWN: which cards get it (`lib/holdTime.ts` `intervalsIn`, Pull-ups only so far: COD-603) or what a
 * save ticks — each caller decides. A single hold is `HoldTimer`.
 *
 * Timed from `Date.now()`, so a skipped interval tick loses no time. No
 * animation: the numbers and the word change, nothing moves.
 */
export function IntervalTimer({ name, plan, onSave, onClose }: {
  name: string
  plan: Intervals
  /** Seconds of each work step finished, in order. */
  onSave: (worked: number[]) => void
  onClose: () => void
}) {
  // Your numbers, before Start (owner, 2026-11-13: "they can change based
  // upon their needs"): work, rest and rounds, from the plan's.
  const [tune, setTune] = useState<Tune | undefined>(plan.tune)
  const cur = tune ? retune(tune) : plan
  const { steps, manual } = cur
  const [banked, setBanked] = useState(0)
  const [since, setSince] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const audio = useRef<AudioContext | null>(null)
  const beeped = useRef('')
  /** Where this run stops on its own: the end of the hold when `manual`,
   *  the end of every round otherwise. Derived, not set in an effect. */
  const [cap, setCap] = useState(0)

  const ms = Math.min(banked + (since == null ? 0 : now - since), since == null ? Infinity : cap)
  const running = since != null && ms < cap
  const { i, left } = stepAt(steps, ms)
  const step = steps[i]
  const over = i >= steps.length
  const worked = steps.slice(0, i).filter((s) => s.kind === 'work').map((s) => s.secs)
  const works = steps.filter((s) => s.kind === 'work').length
  // Between holds the clock waits for you: that is your rest.
  const phase = over ? 'done' : manual && !running && ms > 0 && left === step.secs ? 'rest' : step.kind

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 100)
    let lock: { release: () => Promise<void> } | null = null
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    wl?.request('screen').then((l) => { lock = l }).catch(() => {})
    return () => { clearInterval(id); lock?.release().catch(() => {}) }
  }, [running])

  // Beep 3-2-1 before a switch, long on it; buzz too where a phone can.
  // Keyed on step + second so a 100 ms tick beeps once, not ten times.
  useEffect(() => {
    if (since == null) return
    const key = `${i}:${left}`
    if (beeped.current === key) return
    const prev = beeped.current
    beeped.current = key
    if (prev && Number(prev.split(':')[0]) !== i) { beep(audio.current, 880, 0.5); navigator.vibrate?.(400) }
    else if (left <= 3 && left >= 1) { beep(audio.current, 660, 0.12); navigator.vibrate?.(80) }
  }, [i, left, since])

  function toggle() {
    if (!running) {
      // Made on a tap, which is what lets an iPhone play it.
      // No Web Audio (an old browser, a test) means no beeps, never no timer.
      const Ctx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctx) { audio.current ??= new Ctx(); void audio.current.resume() }
      const t = Date.now(); setBanked(ms); setSince(t); setNow(t)
      setCap(1000 * (manual ? startOf(steps, i + 1) : startOf(steps, steps.length)))
    } else { setBanked(ms); setSince(null) }
  }
  function reset() { setBanked(0); setSince(null); beeped.current = '' }
  /** Move the clock to the start of step `to`; a hold list waits there. */
  function jump(to: number) {
    setBanked(startOf(steps, Math.max(0, Math.min(steps.length, to))) * 1000)
    if (running && !manual) { const t = Date.now(); setSince(t); setNow(t) } else setSince(null)
  }
  // Back: to the start of this step, or the one before if it only just began.
  function back() { jump(ms / 1000 - startOf(steps, i) > 2 || i === 0 ? i : i - 1) }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }} title={name}
      description={describeIntervals(cur)}>
      <div className="interval flex flex-col items-center gap-4 py-4" data-phase={phase}>
        <p className="interval-word" aria-live="assertive">{phase === 'done' ? 'Done' : phase === 'work' ? 'Work' : 'Rest'}</p>
        <output className="hold-clock" aria-live="off" aria-label={`${left} seconds left`}>{mmss(over ? 0 : left)}</output>
        <p className="text-body text-fg-2">{over ? `${worked.length} of ${works} finished` : step.label}</p>
        {!over && (
          <button type="button" className="hold-go" aria-pressed={running} onClick={toggle}>
            {running ? 'Pause' : ms > 0 ? (manual && left === step.secs ? `Start hold ${worked.length + 1}` : 'Resume') : 'Start'}
          </button>
        )}
        {/* YOUR NUMBERS, only before you start: a run is never retimed
            under you. */}
        {tune && since == null && ms === 0 && (
          <div className="cells w-full" role="group" aria-label="Your timer">
            {tune.reps == null && <TuneRow label="Work" unit="s" value={tune.on} min={5} max={300} step={5} onChange={(on) => setTune({ ...tune, on })} />}
            {tune.reps == null && <TuneRow label="Rest" unit="s" value={tune.off} min={0} max={180} step={5} onChange={(off) => setTune({ ...tune, off })} />}
            <TuneRow label={tune.reps == null ? 'Rounds' : 'Minutes'} unit="" value={tune.rounds} min={1} max={30} step={1} onChange={(rounds) => setTune({ ...tune, rounds })} />
          </div>
        )}
        {ms > 0 && (
          <div className="flex w-full gap-3">
            <button type="button" className="hold-sub" onClick={back}>Back</button>
            {!over && (
              <button type="button" className="hold-sub" onClick={() => jump(i + 1)}>
                {phase === 'rest' && !manual ? 'Skip rest' : manual ? 'Hold done' : 'Round done'}
              </button>
            )}
          </div>
        )}
        <div className="flex w-full gap-3">
          <button type="button" className="hold-sub" onClick={reset} disabled={ms === 0}>Reset</button>
          <button type="button" className="hold-sub hold-save" disabled={worked.length === 0}
            onClick={() => { onSave(worked); onClose() }}>
            Save {worked.length} {manual ? (worked.length === 1 ? 'hold' : 'holds') : (worked.length === 1 ? 'round' : 'rounds')}
          </button>
        </div>
      </div>
    </Sheet>
  )
}

/** One number to change: label, − value +. */
function TuneRow({ label, unit, value, min, max, step, onChange }: {
  label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void
}) {
  const said = `${value}${unit ? ` ${unit}` : ''}`
  return (
    <div className="cell">
      <span className="flex-1 text-body text-fg-1">{label}</span>
      <button type="button" className="round-btn" aria-label={`${label}, less`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}><Icon as={Minus} size="sm" /></button>
      <output aria-live="polite" aria-label={`${label} ${said}`} className="min-w-[3.5rem] text-center text-body font-semibold tabular-nums text-fg-1">{said}</output>
      <button type="button" className="round-btn" aria-label={`${label}, more`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}><Icon as={Plus} size="sm" /></button>
    </div>
  )
}

function beep(ctx: AudioContext | null, hz: number, secs: number) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = hz
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + secs)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + secs)
}
