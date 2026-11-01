import { useState } from 'react'
import { ArrowCounterClockwise, CalendarDot, CaretDown, Check, Minus, Plus, SlidersHorizontal } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Seg } from '../ui/seg'
import { Cells, ControlCell } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { addDays, prettyDay, todayISO } from '../../lib/date'
import { onRaised } from '../../lib/colors'
import { PULLUP_METHODS, repScheme, type PullupMethod } from '../../lib/pullups'

const DURATIONS = [10, 20, 30, 45] as const
const ROUND_CHOICES = Array.from({ length: 12 }, (_, i) => i + 1)

/**
 * PULL-UPS' FREE-SESSION LOG, phone — opened from a row under the program
 * (`PullupProgramDay` is the page's main log). Program's shape: choose at the top, read what to do,
 * tick it off, log from a dock.
 *
 * OWNS: the phone layout — Method as a segmented row and Rounds as a native select, a
 * card saying what the method means and how much to do (training set, today's
 * and this week's target), one row per round with Program's tap counter, and
 * a dock with the date, the optional fields (a `Sheet`) and Log.
 * DOES NOT OWN: the draft or the save. Both stay in `views/Pullups.tsx`
 * `LogSessionCard`, which renders this on a phone; Log hands back the reps to
 * store — the ticked rounds, or the whole plan when nothing is ticked.
 *
 * Owner ask, 2026-10-30: "how will I know what is straight and ladder and how
 * many I need to do … get that information to the top … log at the bottom …
 * just like we did in program."
 */
export function PullupQuickLog({
  date, setDate, method, setMethod, top, defaultTop, setTop, rounds, setRounds, duration, setDuration,
  rpe, setRpe, notes, setNotes, effort, guide, last, onRepeat, onLog, justLogged,
}: {
  date: string
  setDate: (d: string) => void
  method: PullupMethod
  setMethod: (m: PullupMethod) => void
  /** The top set in use — the typed one or the training set. */
  top: number
  defaultTop: number
  setTop: (n: number) => void
  rounds: number | undefined
  setRounds: (n: number) => void
  duration: number | undefined
  setDuration: (n: number | undefined) => void
  rpe: number | undefined
  setRpe: (n: number | undefined) => void
  notes: string
  setNotes: (s: string) => void
  effort: readonly { value: number; label: string; name: string }[]
  /** What the ability table says to do, and how far into the week you are. */
  guide: { group: string; daily: string; weekly: string; weekReps: number }
  /** The previous session, for Repeat. Absent on a fresh journal. */
  last?: { reps: number; date: string }
  onRepeat: () => void
  onLog: (sets: number[]) => void
  justLogged: string | null
}) {
  const [more, setMore] = useState(false)
  const [ticked, setTicked] = useState<number[]>([])
  const today = todayISO()
  const yesterday = addDays(today, -1)
  const dayLabel = date === today ? 'Today' : date === yesterday ? 'Yesterday' : prettyDay(date)
  const emom = method === 'emom'
  const r = rounds ?? 0
  const one = repScheme(method, top, 1)
  const perRound = one.reduce((a, n) => a + n, 0)
  const done = ticked.filter((i) => i < r)
  // What Log writes: the rounds you ticked, or the whole plan if you ticked none.
  const sets = done.length ? done.flatMap(() => one) : repScheme(method, top, r)
  const total = sets.reduce((a, n) => a + n, 0)
  const unit = emom ? 'Minute' : 'Round'
  const added = [rpe, duration, notes.trim() || undefined].filter((x) => x !== undefined).length
  const toggle = (i: number) => setTicked((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]))
  const choices = ROUND_CHOICES.includes(r) || r === 0 ? ROUND_CHOICES : [...ROUND_CHOICES, r]

  return (
    <section aria-label="Log a session" className="flex flex-col gap-3">
      {/* Method is four short words, so it is one tap: a segmented row, not a
          native wheel. It always holds a method, so no `allowNone` — a tap on
          the lit one confirms it. Rounds stays a select: twelve options. */}
      <div className="flex flex-col gap-2" role="group" aria-label="Choose the session">
        <Seg label="Method" value={method} onChange={(v) => v && setMethod(v)}
          options={PULLUP_METHODS.map((m) => ({ value: m.value, label: m.label }))} />
        <label className="select-pill">
          <span className="sr-only">{emom ? 'Minutes' : 'Rounds'}</span>
          <select value={r} onChange={(e) => { setRounds(Number(e.target.value)); setTicked([]) }}>
            {choices.map((n) => <option key={n} value={n}>{emom ? `${n} min` : `${n} round${n === 1 ? '' : 's'}`}</option>)}
          </select>
          <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
        </label>
      </div>

      {/* WHAT TO DO, before the list of it: the method in a sentence, the set
          size the ability table gives you, and the day's and week's volume. */}
      <div className="cells">
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            {/* The segmented row above already shows the name; said for a screen reader. */}
            <p className="sr-only">{PULLUP_METHODS.find((m) => m.value === method)?.label}</p>
            <p className="text-body text-fg-1">{PULLUP_METHODS.find((m) => m.value === method)?.hint}</p>
          </div>
          {last && (
            <button type="button" onClick={onRepeat} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill bg-ink-2 px-3 text-label font-semibold text-fg-1">
              <Icon as={ArrowCounterClockwise} size="sm" className="text-fg-2" />
              Repeat {last.reps}<span className="sr-only"> reps from {prettyDay(last.date)}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 shadow-[inset_0_1px_0_var(--color-line)]">
          <span className="min-w-0 flex-1">
            <span className="block text-body text-fg-1">Top set</span>
            <span className="block text-label text-fg-2">{top === defaultTop ? `Your training set · ${guide.group}` : `Training set is ${defaultTop}`}</span>
          </span>
          <button type="button" className="round-btn" onClick={() => setTop(Math.max(1, top - 1))} aria-label="Top set, one fewer"><Icon as={Minus} size="sm" /></button>
          <output aria-live="polite" aria-label="Top set" className="min-w-[2.5rem] text-center text-heading font-bold tabular-nums text-fg-1">{top}</output>
          <button type="button" className="round-btn" onClick={() => setTop(Math.min(50, top + 1))} aria-label="Top set, one more"><Icon as={Plus} size="sm" /></button>
        </div>
        <p className="px-4 py-2.5 text-label text-fg-2 shadow-[inset_0_1px_0_var(--color-line)]">
          Today <b className="text-fg-1">{guide.daily}</b> · this week <b className="text-fg-1">{guide.weekReps}</b> of {guide.weekly}
        </p>
      </div>

      {/* ONE ROW PER ROUND, ticked after you do it — Program's counter. */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-1 flex-1 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label={`${unit}s ticked`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={r ? Math.round((done.length / r) * 100) : 0}>
          <div className="h-full rounded-pill bg-green transition-[width]" style={{ width: `${r ? (done.length / r) * 100 : 0}%` }} />
        </div>
        <span className="shrink-0 text-label text-fg-2">{done.length}/{r} {unit.toLowerCase()}s</span>
      </div>
      <div className="cells">
        {Array.from({ length: r }, (_, i) => {
          const on = done.includes(i)
          return (
            <div key={i} className="lift-row" data-done={on || undefined}>
              <div className="flex min-h-[3.25rem] items-center gap-3 px-3">
                <button type="button" className="set-count" aria-pressed={on} aria-label={`${unit} ${i + 1}, ${on ? 'done, tap to clear' : 'tap when done'}`} onClick={() => toggle(i)}>
                  {on ? <Icon as={Check} size="md" /> : <span aria-hidden>{i + 1}</span>}
                </button>
                <span className="min-w-0 flex-1">
                  <span className={`block text-body font-medium ${on ? 'text-fg-2' : 'text-fg-1'}`}>{one.join(' · ')}{one.length > 1 && <span className="font-normal text-fg-2"> = {perRound}</span>} reps</span>
                  <span className="block text-label text-fg-2">{unit} {i + 1}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* The dock: date, the optional fields, and Log. This log lives in a
          sheet, so it pins to the sheet's bottom, not above the nav. */}
      <div className="log-dock" style={{ bottom: 0 }}>
        <label className="dock-chip mr-auto">
          <Icon as={CalendarDot} size="sm" className="text-fg-2" />
          {dayLabel}
          <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label={`Log on ${dayLabel}`} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <button type="button" className="round-btn" onClick={() => setMore(true)} aria-label={`Effort, duration, notes${added ? `, ${added} added` : ''}`}>
          <Icon as={SlidersHorizontal} size="md" />
        </button>
        <button type="button" className="cta cta-compact" disabled={total === 0} onClick={() => { onLog(sets); setTicked([]) }}>
          <Icon as={Check} size="md" />Log · {total} reps
        </button>
      </div>
      <p aria-live="polite" className="-mt-1 px-1 text-center text-label" style={{ color: onRaised('green') }}>
        {justLogged ? `Logged · ${justLogged}` : ''}
      </p>

      <Sheet open={more} onOpenChange={setMore} title="How it went" description="All optional">
        <div className="ios-form flex flex-col gap-4">
          {/* Starts empty — "no answer" and "Easy" are different facts — so a
              second tap clearing it is safe (`allowNone`). */}
          <Cells>
            <ControlCell label="Effort">
              <Seg label="Effort" allowNone value={rpe ?? null} onChange={(v) => setRpe(v ?? undefined)}
                options={effort.map((e) => ({ value: e.value, label: e.label, name: e.name }))} />
            </ControlCell>
            <ControlCell label="Duration">
              <Seg label="Duration" allowNone value={DURATIONS.find((d) => d === duration) ?? null} onChange={(v) => setDuration(v ?? undefined)}
                options={DURATIONS.map((d) => ({ value: d, label: `${d}m`, name: `${d} minutes` }))} />
            </ControlCell>
          </Cells>
          <Cells title="Other length">
            <label className="cell">
              <span className="flex-1 text-body text-fg-1">Minutes</span>
              <input type="number" min={1} max={300} inputMode="numeric" value={duration ?? ''}
                onChange={(e) => setDuration(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-20 bg-transparent text-right text-body text-fg-1 tabular-nums" />
            </label>
          </Cells>
          <Cells title="Notes">
            <div className="cell"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Grip, how the last set felt…" rows={3} aria-label="Notes" className="cell-textarea" /></div>
          </Cells>
        </div>
      </Sheet>
    </section>
  )
}
