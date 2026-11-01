import { useState } from 'react'
import { CaretDown, Check, SlidersHorizontal, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Cells } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { VideoLink } from '../VideoLink'
import { HOME_ROUTINES } from '../../lib/homeProgramming'
import { exerciseById } from '../../lib/homeExercises'
import type { SessionItem } from './SessionCard'
import { setsIn } from '../../lib/homeSets'


/**
 * TODAY'S HOME SESSION ON A PHONE — Program's shape.
 *
 * OWNS: the phone drawing of the session builder. A routine is one native
 * select, with how to run it under it; each exercise is one row with a
 * tap-per-set counter ("3×12" is three taps), opening in place to change the
 * reps, watch how, or drop it; a dock with minutes and notes (a sheet) and
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
  const [open, setOpen] = useState<string | null>(null)
  const [more, setMore] = useState(false)
  const loaded = HOME_ROUTINES.find((r) => r.id === routine)
  const ticked = items.filter((i) => (taps[i.id] ?? 0) > 0)
  const logging = ticked.length ? ticked : items

  function load(id: string) {
    const r = HOME_ROUTINES.find((x) => x.id === id)
    if (!r) return
    setRoutine(id); setTaps({}); setOpen(null)
    onLoadRoutine(r.items.flatMap((exId) => {
      const ex = exerciseById(exId)
      return ex ? [{ id: ex.id, name: ex.name, reps: ex.reps }] : []
    }))
  }
  const bump = (i: SessionItem) => setTaps((t) => {
    const n = t[i.id] ?? 0
    return { ...t, [i.id]: n >= setsIn(i.reps) ? 0 : n + 1 }
  })

  return (
    <section aria-label="Today’s session" className="flex flex-col gap-3">
      <label className="select-pill">
        <span className="sr-only">Routine</span>
        <select value={routine} onChange={(e) => load(e.target.value)}>
          <option value="" disabled>{items.length ? 'Swap in a routine' : 'Pick a routine'}</option>
          {HOME_ROUTINES.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.needs}</option>)}
        </select>
        <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
      </label>
      {loaded && <p className="px-1 text-label text-fg-2">{loaded.how}</p>}

      {items.length === 0 ? (
        <p className="px-1 text-label text-fg-2">Nothing in today’s session yet — pick a routine, or tap Add on an exercise further down.</p>
      ) : (
        <div className="cells">
          {items.map((i) => {
            const n = taps[i.id] ?? 0
            const total = setsIn(i.reps)
            const all = n >= total
            const isOpen = open === i.id
            return (
              <div key={i.id} className="lift-row" data-done={all || undefined}>
                <div className="flex items-center gap-3 px-3">
                  <button type="button" className="set-count" aria-pressed={all}
                    aria-label={all ? `${i.name}: all ${total} sets done, tap to clear` : `${i.name}: ${n}/${total} sets done, tap after set ${n + 1}`}
                    onClick={() => bump(i)}>
                    {all ? <Icon as={Check} size="md" /> : <span aria-hidden><b>{n}</b>/{total}</span>}
                  </button>
                  <button type="button" className="min-w-0 flex-1 py-2 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i.id)}>
                    <span className={`block truncate text-body font-medium ${all ? 'text-fg-2' : 'text-fg-1'}`}>{i.name}</span>
                    <span className="block text-label text-fg-2">{i.reps}</span>
                  </button>
                  <Icon as={CaretDown} size="sm" className={`shrink-0 text-fg-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                {isOpen && (
                  <div className="ios-form flex items-center gap-2 px-3 pb-3">
                    <input value={i.reps} onChange={(e) => onReps(i.id, e.target.value)} aria-label={`${i.name}, sets and reps`}
                      className="w-32 rounded-[0.625rem] bg-ink-2 px-3 py-2 text-body text-fg-1" />
                    <VideoLink name={i.name} label="Watch how" size="sm" className="min-h-11" />
                    <span className="flex-1" />
                    <button type="button" className="round-btn" aria-label={`Drop ${i.name} from the session`} onClick={() => { onDrop(i.id); setOpen(null) }}>
                      <Icon as={Trash} size="sm" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="log-dock">
          <button type="button" className="round-btn ml-auto" onClick={() => setMore(true)} aria-label={`Minutes and notes${dur || notes.trim() ? ', added' : ''}`}>
            <Icon as={SlidersHorizontal} size="md" />
          </button>
          <button type="button" className="cta cta-compact" onClick={() => { onLog(logging); setTaps({}); setRoutine('') }}>
            <Icon as={Check} size="md" />Log · {logging.length}
          </button>
        </div>
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
