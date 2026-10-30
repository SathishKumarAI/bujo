import { useState } from 'react'
import { ArrowCounterClockwise, CalendarDot, CaretDown, Check, Minus, Plus, SlidersHorizontal } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Seg } from '../ui/seg'
import { Cell, Cells } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { addDays, prettyDay, todayISO } from '../../lib/date'
import { onRaised } from '../../lib/colors'
import { PULLUP_METHODS, type PullupMethod } from '../../lib/pullups'

const DURATIONS = [10, 20, 30, 45] as const

/**
 * PULL-UPS' PHONE LOG — Pickleball's `QuickLog` shape, one screen, nothing to
 * scroll to log a session.
 *
 * OWNS: the phone layout — date and repeat in one bar, the method as a
 * segmented control, a scoreboard of top set × rounds, effort as words, and
 * duration and notes behind one row in a `Sheet`.
 * DOES NOT OWN: the draft, the scheme arithmetic or the save. Those stay in
 * `views/Pullups.tsx` `LogSessionCard`, which renders this on a phone, so
 * there is still one form state and one `save()`.
 *
 * Before (390×844, demo): a card header, a last-session card, a "What you did"
 * rule, a date chip row and three labelled rows put Log session at y≈890 —
 * under the bottom nav.
 */
export function PullupQuickLog({
  date, setDate, method, setMethod, top, setTop, rounds, setRounds, duration, setDuration,
  rpe, setRpe, notes, setNotes, reps, total, effort, lastReps, onRepeat, onLog, justLogged,
}: {
  date: string
  setDate: (d: string) => void
  method: PullupMethod
  setMethod: (m: PullupMethod) => void
  /** The top set in use — the typed one or the training set. */
  top: number
  setTop: (n: number) => void
  rounds: number | undefined
  setRounds: (n: number) => void
  duration: number | undefined
  setDuration: (n: number | undefined) => void
  rpe: number | undefined
  setRpe: (n: number | undefined) => void
  notes: string
  setNotes: (s: string) => void
  reps: number[]
  total: number
  effort: readonly { value: number; label: string; name: string }[]
  /** Reps in the last session, for Repeat. Absent on a fresh journal. */
  lastReps?: number
  onRepeat: () => void
  onLog: () => void
  justLogged: string | null
}) {
  const [more, setMore] = useState(false)
  const today = todayISO()
  const yesterday = addDays(today, -1)
  const dayLabel = date === today ? 'Today' : date === yesterday ? 'Yesterday' : prettyDay(date)
  const added = [duration, notes.trim() || undefined].filter((x) => x !== undefined).length
  const emom = method === 'emom'
  const r = rounds ?? 0
  const counters = [
    { key: 'top', name: 'Top set', v: top, bump: (d: number) => setTop(Math.max(1, Math.min(50, top + d))) },
    { key: 'rounds', name: emom ? 'Minutes' : 'Rounds', v: r, bump: (d: number) => setRounds(Math.max(1, Math.min(60, r + d))) },
  ]

  return (
    <section aria-label="Log a session" className="ios-form flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        {/* Same date pill as Pickleball: a real date input under it, so a tap
            opens the phone's own wheel. */}
        <label className="relative inline-flex h-[2.75rem] shrink-0 items-center gap-1.5 rounded-[0.75rem] bg-ink-2 px-3 text-body font-medium text-fg-1">
          <Icon as={CalendarDot} size="sm" className="text-fg-2" />
          {dayLabel}
          <Icon as={CaretDown} size="sm" className="text-fg-2" />
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label={`Date, ${dayLabel}`}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        {/* The most common log is "the same as last time" — one tap, beside
            the date it is written on. */}
        {lastReps !== undefined && (
          <button type="button" onClick={onRepeat} className="ml-auto inline-flex h-[2.75rem] items-center gap-1.5 rounded-[0.75rem] bg-ink-2 px-3 text-body font-medium text-fg-1">
            <Icon as={ArrowCounterClockwise} size="sm" className="text-fg-2" />
            Repeat {lastReps}<span className="sr-only"> reps from your last session</span>
          </button>
        )}
      </div>

      <Seg
        label="Method"
        value={method}
        onChange={(v) => v && setMethod(v)}
        options={PULLUP_METHODS.map((m) => ({ value: m.value, label: m.label }))}
      />

      {/* THE SCOREBOARD: the two numbers that make the session, − N + each. */}
      <div className="scoreboard" role="group" aria-label="Sets">
        {counters.map((c, i) => [
          i === 1 && <hr key="rule" />,
          <div key={c.key} className="flex flex-col items-center gap-1 px-2 py-2.5">
            <span className="text-label font-semibold tracking-wider text-fg-2 uppercase">{c.name}</span>
            <div className="flex w-full items-center justify-between">
              <button type="button" className="round-btn" onClick={() => c.bump(-1)} aria-label={`${c.name}, one fewer`}><Icon as={Minus} size="md" /></button>
              <output aria-live="polite" aria-label={c.name} className="score-num">{c.v}</output>
              <button type="button" className="round-btn round-btn-primary" onClick={() => c.bump(1)} aria-label={`${c.name}, one more`}><Icon as={Plus} size="md" /></button>
            </div>
          </div>,
        ])}
      </div>

      {/* What pressing Log writes — a ladder to 4 and a straight 4×4 both read
          "4" above, and this line is what tells them apart. */}
      <p aria-live="polite" className="text-center text-body text-fg-2">
        {reps.length === 0 ? 'Pick a top set and rounds' : <><span className="num font-medium text-fg-1">{reps.join(' · ')}</span> = {total} reps</>}
      </p>

      {/* Effort starts empty — "no answer" and "Easy" are different facts — so
          a second tap clearing it is safe here (`allowNone`). */}
      <Seg
        label="Effort"
        allowNone
        value={rpe ?? null}
        onChange={(v) => setRpe(v ?? undefined)}
        options={effort.map((e) => ({ value: e.value, label: e.label, name: e.name }))}
      />

      <Cells>
        <Cell icon={SlidersHorizontal} tone="mauve" title="Duration, notes" subtitle={added ? `${added} added` : 'Optional'} onPress={() => setMore(true)} />
      </Cells>

      <button type="button" className="cta" onClick={onLog} disabled={reps.length === 0}><Icon as={Check} size="md" />Log session</button>
      <p aria-live="polite" className="-mt-2 min-h-5 text-center text-label" style={{ color: onRaised('green') }}>
        {justLogged ? `Logged · ${justLogged}` : ''}
      </p>

      <Sheet open={more} onOpenChange={setMore} title="How it went" description="All optional">
        <div className="flex flex-col gap-4">
          <Seg
            label="Duration"
            allowNone
            value={DURATIONS.find((d) => d === duration) ?? null}
            onChange={(v) => setDuration(v ?? undefined)}
            options={DURATIONS.map((d) => ({ value: d, label: `${d}m`, name: `${d} minutes` }))}
          />
          <Cells title="Other length">
            <label className="cell">
              <span className="flex-1 text-body text-fg-1">Minutes</span>
              <input
                type="number"
                min={1}
                max={300}
                inputMode="numeric"
                value={duration ?? ''}
                onChange={(e) => setDuration(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-20 bg-transparent text-right text-body text-fg-1 tabular-nums"
              />
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
