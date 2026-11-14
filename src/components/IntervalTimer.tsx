import { useEffect, useRef, useState } from 'react'
import { Sheet } from './ui/sheet'
import { Minus, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { describeIntervals, mmss, retune, startOf, stepAt, type Intervals, type Step, type Tune } from '../lib/holdTime'

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
 * FORGIVING (owner, 2026-11-14): Pause; Rest +15 s / −15 s on the rest you
 * are in; Undo puts the clock back where a mis-tapped Round done, Hold done
 * or Skip rest found it; Redo runs the round you just missed again (it stops
 * counting, the ones before it stay); Edit plan changes work, rest and rounds
 * for every step AFTER the one you are in. Each edits `steps` or the clock
 * position, so `onSave(worked)` means what it always did.
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
  // Your numbers (owner, 2026-11-13: "they can change based upon their
  // needs"): work, rest and rounds, from the plan's.
  const [tune, setTune] = useState<Tune | undefined>(plan.tune)
  // The session as it stands: retuned, a rest stretched, a round redone.
  const [steps, setSteps] = useState<Step[]>(() => (plan.tune ? retune(plan.tune) : plan).steps)
  const { manual } = plan
  const [banked, setBanked] = useState(0)
  const [since, setSince] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const audio = useRef<AudioContext | null>(null)
  const beeped = useRef('')
  /** The step this run stops at on its own: the end of the hold when
   *  `manual`, null for the end of every round. The cap is derived from it,
   *  so an edit to the steps moves it without an effect. */
  const [stopAt, setStopAt] = useState<number | null>(0)
  const cap = 1000 * startOf(steps, stopAt ?? steps.length)
  /** Where the clock was before the last Round done, for Undo. */
  const [undo, setUndo] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)

  const ms = Math.min(banked + (since == null ? 0 : now - since), since == null ? Infinity : cap)
  const running = since != null && ms < cap
  const started = since != null || ms > 0
  const { i, left } = stepAt(steps, ms)
  const step = steps[i]
  const over = i >= steps.length
  const worked = steps.slice(0, i).filter((s) => s.kind === 'work').map((s) => s.secs)
  const works = steps.filter((s) => s.kind === 'work').length
  // Between holds the clock waits for you: that is your rest.
  const phase = over ? 'done' : manual && !running && ms > 0 && left === step.secs ? 'rest' : step.kind
  /** The last work step finished: what Redo runs again. */
  let last = -1
  for (let k = 0; k < i && k < steps.length; k++) if (steps[k].kind === 'work') last = k
  const unit = manual ? 'hold' : 'round'
  /** Rounds Edit cannot take away: the ones done and the one you are in. */
  const floor = !started ? 1 : Math.max(1, worked.length + (step?.kind === 'work' ? 1 : 0))

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
      setStopAt(manual ? i + 1 : null)
    } else { setBanked(ms); setSince(null) }
  }
  function reset() { setBanked(0); setSince(null); setUndo(null); beeped.current = '' }
  /** Put the clock at `to` ms: a running round list keeps running, a hold list waits. */
  function seek(to: number) {
    setBanked(to)
    if (running && !manual) { const t = Date.now(); setSince(t); setNow(t) } else setSince(null)
  }
  /** Move the clock to the start of step `to`. */
  function jump(to: number) { seek(startOf(steps, Math.max(0, Math.min(steps.length, to))) * 1000) }
  // Back: to the start of this step, or the one before if it only just began.
  function back() { setUndo(null); jump(ms / 1000 - startOf(steps, i) > 2 || i === 0 ? i : i - 1) }
  function done() { setUndo(ms); jump(i + 1) }
  function redo() { setUndo(null); jump(last) }
  /** Rest +15 s / −15 s on the rest you are in; −15 s never ends it before now. */
  function stretch(d: number) {
    const into = ms / 1000 - startOf(steps, i)
    setSteps(steps.map((s, k) => (k === i ? { ...s, secs: Math.max(into, s.secs + d) } : s)))
  }
  /** New numbers for every step after the one you are in (all of them before Start). */
  function edit(t: Tune) {
    setTune(t)
    const head = steps.slice(0, started ? i + 1 : 0)
    const more = t.rounds - head.filter((s) => s.kind === 'work').length
    const tail = more > 0 ? retune({ ...t, rounds: more }).steps : []
    const gap: Step[] = head.at(-1)?.kind === 'work' && tail.length > 0 && t.reps == null && t.off > 0
      ? [{ kind: 'rest', secs: t.off, label: 'Round 1 of 1 next' }] : []
    setSteps(relabel([...head, ...gap, ...tail]))
  }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }} title={name}
      description={describeIntervals(tune ? retune(tune) : { steps, manual })}>
      <div className="interval flex flex-col items-center gap-4 py-4" data-phase={phase}>
        <p className="interval-word" aria-live="assertive">{phase === 'done' ? 'Done' : phase === 'work' ? 'Work' : 'Rest'}</p>
        <output className="hold-clock" aria-live="off" aria-label={`${left} seconds left`}>{mmss(over ? 0 : left)}</output>
        <p className="text-body text-fg-2">{over ? `${worked.length} of ${works} finished` : step.label}</p>
        {!over && (
          <button type="button" className="hold-go" aria-pressed={running} onClick={toggle}>
            {running ? 'Pause' : ms > 0 ? (manual && left === step.secs ? `Start hold ${worked.length + 1}` : 'Resume') : 'Start'}
          </button>
        )}
        {/* Rows of three at most, so Save stays on a 390 x 844 screen while
            you rest (measured: four rows of two pushed it to y 869). */}
        {phase === 'rest' && !manual && (
          <div className="timer-row" role="group" aria-label="This rest">
            <button type="button" className="hold-sub" aria-label="Rest −15 s" onClick={() => stretch(-15)}>−15 s</button>
            <button type="button" className="hold-sub" aria-label="Rest +15 s" onClick={() => stretch(15)}>+15 s</button>
            <button type="button" className="hold-sub" onClick={done}>Skip rest</button>
          </div>
        )}
        {ms > 0 && (
          <div className="timer-row">
            <button type="button" className="hold-sub" onClick={back}>Back</button>
            {!over && !(phase === 'rest' && !manual) && (
              <button type="button" className="hold-sub" onClick={done}>{manual ? 'Hold done' : 'Round done'}</button>
            )}
            {undo != null && <button type="button" className="hold-sub" onClick={() => { seek(undo); setUndo(null) }}>Undo</button>}
            {last >= 0 && phase !== 'work' && <button type="button" className="hold-sub" onClick={redo}>Redo {unit}</button>}
          </div>
        )}
        {/* YOUR NUMBERS: open before Start; after it, behind Edit plan and
            only for the steps still to come, so nothing done is retimed. */}
        {tune && !over && (!started || editing) && (
          <div className="cells w-full" role="group" aria-label={started ? 'Rest of the session' : 'Your timer'}>
            {tune.reps == null && <TuneRow label="Work" unit="s" value={tune.on} min={5} max={300} step={5} onChange={(on) => edit({ ...tune, on })} />}
            {tune.reps == null && <TuneRow label="Rest" unit="s" value={tune.off} min={0} max={180} step={5} onChange={(off) => edit({ ...tune, off })} />}
            <TuneRow label={tune.reps == null ? 'Rounds' : 'Minutes'} unit="" value={tune.rounds} min={floor} max={30} step={1} onChange={(rounds) => edit({ ...tune, rounds })} />
          </div>
        )}
        <div className="timer-row">
          <button type="button" className="hold-sub" onClick={reset} disabled={ms === 0}>Reset</button>
          {tune && started && !over && (
            <button type="button" className="hold-sub" aria-expanded={editing} onClick={() => setEditing(!editing)}>Edit plan</button>
          )}
          <button type="button" className="hold-sub hold-save" disabled={worked.length === 0}
            onClick={() => { onSave(worked); onClose() }}>
            Save {worked.length} {worked.length === 1 ? unit : `${unit}s`}
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

/** "N of M" in every label from where each step now sits, after an edit moved them. */
function relabel(steps: Step[]): Step[] {
  const n = steps.filter((s) => s.kind === 'work').length
  let k = 0
  return steps.map((s) => {
    if (s.kind === 'work') k++
    return { ...s, label: s.label.replace(/\d+ of \d+/, `${s.kind === 'work' ? k : k + 1} of ${n}`) }
  })
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
