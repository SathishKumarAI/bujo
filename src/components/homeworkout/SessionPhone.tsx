import { useState } from 'react'
import { Check, SlidersHorizontal, Timer, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Cells } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { VideoLink } from '../VideoLink'
import { HOME_ROUTINES } from '../../lib/homeProgramming'
import { exerciseById } from '../../lib/homeExercises'
import type { SessionItem } from './SessionCard'
import { setsIn } from '../../lib/homeSets'
import { plain } from '../../lib/plain'
import { HoldTimer } from '../HoldTimer'
import { secondsIn } from '../../lib/holdTime'


/**
 * TODAY'S HOME SESSION ON A PHONE — Program's shape.
 *
 * OWNS: the phone drawing of the session builder. Nothing loaded: every
 * routine as a card listing its exercises, with Start. Loaded: the routine's
 * how-to, then one card per exercise — a pill per set ("3×12" is three),
 * the plan to change, Watch and remove, nothing folded (COD-593); a dock with minutes and notes (a sheet) and
 * Log. The day is the page's `DayStrip`, in the top bar (COD-558). Log writes the exercises you ticked, or the whole plan when
 * you ticked none — the same rule Pull-ups' free session follows.
 * DOES NOT OWN: the session state or the write (`views/HomeWorkout.tsx`), which
 * the desktop's `SessionCard` draws from too.
 *
 * Measured before: six typed "3×12" fields, date chips, minutes, notes and a
 * full-width Log slab — the session alone pushed the page to 2,271px.
 */
export function SessionPhone({ items, onReps, onDrop, onLoadRoutine, dur, onDur, notes, onNotes, onLog }: {
  items: SessionItem[]
  onReps: (id: string, reps: string) => void
  onDrop: (id: string) => void
  onLoadRoutine: (items: SessionItem[]) => void
  dur: string
  onDur: (v: string) => void
  notes: string
  onNotes: (v: string) => void
  /** Logs these items (a subset when some were ticked). */
  onLog: (items: SessionItem[]) => void
}) {
  const [routine, setRoutine] = useState('')
  const [taps, setTaps] = useState<Record<string, number>>({})
  const [more, setMore] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const edited = items.find((i) => i.id === editing)
  const [timing, setTiming] = useState<string | null>(null)
  const timed = items.find((i) => i.id === timing)
  const loaded = HOME_ROUTINES.find((r) => r.id === routine)
  const ticked = items.filter((i) => (taps[i.id] ?? 0) > 0)
  const logging = ticked.length ? ticked : items

  function load(id: string) {
    const r = HOME_ROUTINES.find((x) => x.id === id)
    if (!r) return
    setRoutine(id); setTaps({})
    onLoadRoutine(r.items.flatMap((exId) => {
      const ex = exerciseById(exId)
      return ex ? [{ id: ex.id, name: ex.name, reps: ex.reps }] : []
    }))
  }

  const pills = (i: SessionItem) => {
    const n = taps[i.id] ?? 0
    return Array.from({ length: setsIn(i.reps) }, (_, j) => (
      <button key={j} type="button" className="set-pill" aria-pressed={j < n}
        onClick={() => setTaps((t) => ({ ...t, [i.id]: j < n ? j : j + 1 }))}>
        {j < n && <Icon as={Check} size="sm" />}Set {j + 1}
      </button>
    ))
  }

  return (
    <section aria-label="Today’s session" className="flex flex-col gap-3">
      {items.length === 0 ? (
        /* NOTHING LOADED: every routine as a card with all its exercises, so
           the plan is read before it is started (owner, 2026-11-13: "cards
           with all the exercises planned", no symbols). */
        <>
          <h2 className="px-1 text-heading font-semibold text-fg-1">Pick today’s routine</h2>
          <ol className="flex flex-col gap-3">
            {HOME_ROUTINES.map((r) => (
              <li key={r.id} className="ex-card">
                <h3 className="text-body font-semibold text-fg-1">{plain(r.name)}</h3>
                <p className="text-label text-fg-2">{plain(r.focus)}. Needs: {r.needs.toLowerCase()}</p>
                <p className="mt-1 text-label text-fg-1">{plain(r.how)}</p>
                <ul className="mt-2 space-y-0.5 text-label text-fg-2">
                  {r.items.map((id) => exerciseById(id)).filter((e) => e != null).map((e) => (
                    <li key={e.id}><span className="text-fg-1">{e.name}</span>, {plain(e.reps)}</li>
                  ))}
                </ul>
                <button type="button" className="cta cta-compact mt-3 ml-auto flex" onClick={() => load(r.id)}>
                  Start this routine<span className="sr-only">: {plain(r.name)}</span>
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <div className="ex-card">
            <h2 className="text-body font-semibold text-fg-1">{loaded ? plain(loaded.name) : 'Today’s session'}</h2>
            {loaded && <p className="mt-1 text-label text-fg-1">{plain(loaded.how)}</p>}
            <button type="button" className="mt-1 min-h-11 text-label font-semibold text-brand-text"
              onClick={() => { onLoadRoutine([]); setRoutine(''); setTaps({}) }}>Change routine</button>
          </div>
          {/* ONE CARD PER EXERCISE, nothing folded: the plan, a pill per set,
              the reps to change, how to do it, and remove. */}
          <ol className="flex flex-col gap-3">
            {items.map((i) => {
              const all = (taps[i.id] ?? 0) >= setsIn(i.reps)
              return (
                <li key={i.id} className="ex-card" data-done={all || undefined}>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-body font-semibold ${all ? 'text-fg-2' : 'text-fg-1'}`}>{i.name}</h3>
                      <p className="text-label text-fg-2">
                        {plain(i.reps)}{' '}
                        <button type="button" className="min-h-11 px-1 font-semibold text-brand-text" aria-haspopup="dialog" onClick={() => setEditing(i.id)}>
                          Change<span className="sr-only"> {i.name}</span>
                        </button>
                      </p>
                    </div>
                    <VideoLink name={i.name} label="Watch" size="sm" className="min-h-11 shrink-0" />
                    <button type="button" className="round-btn shrink-0" aria-label={`Remove ${i.name} from the session`} onClick={() => onDrop(i.id)}>
                      <Icon as={Trash} size="sm" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`${i.name} sets`}>
                    {pills(i)}
                    {secondsIn(i.reps) != null && (
                      <button type="button" className="timer-btn ml-auto" aria-haspopup="dialog" onClick={() => setTiming(i.id)}>
                        <Icon as={Timer} size="sm" />Timer<span className="sr-only"> for {i.name}</span>
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      )}

      {items.length > 0 && (
        <div className="log-dock">
          <button type="button" className="round-btn ml-auto" onClick={() => setMore(true)} aria-label={`Minutes and notes${dur || notes.trim() ? ', added' : ''}`}>
            <Icon as={SlidersHorizontal} size="md" />
          </button>
          <button type="button" className="cta cta-compact" onClick={() => { onLog(logging); setTaps({}); setRoutine('') }}>
            <Icon as={Check} size="md" />Log {logging.length} {logging.length === 1 ? 'exercise' : 'exercises'}
          </button>
        </div>
      )}

      {timed && (
        /* A saved hold ticks the next set; the session line keeps its plan. */
        <HoldTimer name={timed.name} target={secondsIn(timed.reps)} onClose={() => setTiming(null)}
          onSave={() => setTaps((t) => ({ ...t, [timed.id]: Math.min(setsIn(timed.reps), (t[timed.id] ?? 0) + 1) }))} />
      )}
      {edited && (
        <Sheet open onOpenChange={(o) => { if (!o) setEditing(null) }} title={edited.name} description="Sets and reps, for example 3x12">
          <Cells>
            <label className="cell">
              <span className="flex-1 text-body text-fg-1">Plan</span>
              <input value={edited.reps} onChange={(e) => onReps(edited.id, e.target.value)} aria-label={`${edited.name}, sets and reps`} className="cell-input w-36" />
            </label>
          </Cells>
        </Sheet>
      )}
      <Sheet open={more} onOpenChange={setMore} title="How it went" description="Both optional">
        <Cells>
          <label className="cell">
            <span className="flex-1 text-body text-fg-1">Minutes</span>
            <input type="number" inputMode="numeric" min={1} value={dur} onChange={(e) => onDur(e.target.value)} className="cell-input w-24" />
          </label>
          <div className="cell">
            <textarea value={notes} onChange={(e) => onNotes(e.target.value)} placeholder="How did it go?" rows={3} aria-label="Notes" className="cell-textarea" />
          </div>
        </Cells>
      </Sheet>
    </section>
  )
}
