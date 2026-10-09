import { useState } from 'react'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { ShowMore } from '../ShowMore'
import { useCappedList } from '../../lib/useCappedList'
import {
  COACH_SESSIONS, COACH_TAGS, loadableMoves, splitOf, setsOf, isSuperset,
  type CoachSession, type Move,
} from '../../lib/coachSessions'
import type { Split } from '../../lib/types'

/**
 * The coach's 29 sessions, loadable into today's logger.
 *
 * ── Why it lives here, in "Look up & tools" ────────────────────────────────
 *
 * Its sibling in this fold is **Saved routines — "Load one into today's
 * session"**, which is the same verb on the same object, so this sits beside
 * it rather than inventing a home.
 *
 * The alternatives were each wrong for a reason worth writing down. `Program`
 * is the 12-week hypertrophy block and has one job; dropping 29 unrelated
 * sessions into it makes a page about one commitment into a page about
 * thirty. A tab of its own is worse: COD-298 measured Body carrying **12 tabs
 * where Plan has 3**, and the rail only just stopped hiding Cycle. And this
 * fold is `defaultOpen={false}`, so a 29-row library costs the page nothing
 * until someone asks for it.
 *
 * ── What "load" actually does, and what it drops ───────────────────────────
 *
 * `loadRoutine` takes exercise names and replaces today's rows. So the
 * **warm-ups and the cardio finishers are dropped** — "Legs warmup cheyu" and
 * "Treadmill 30 minutes" are not set rows, and a logger asking for reps and a
 * weight is the wrong shape for both. They stay visible in the expanded
 * session so the prescription is not quietly rewritten; they are simply not
 * loaded.
 *
 * The button says "Load N" with the real count for that reason: it is the
 * honest number, and it is smaller than the number of lines above it.
 */
export function CoachSessions({ onLoad }: { onLoad: (exercises: string[], split: Split) => void }) {
  const [tag, setTag] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const matching = tag ? COACH_SESSIONS.filter((s) => s.tags.includes(tag)) : COACH_SESSIONS
  const list = useCappedList(matching, 6)

  return (
    <Card
      band
      title="Coach sessions"
      subtitle="29 sessions from your coach — load one into today's session"
    >
      {/* The filter is a filter: it changes which sessions render, not which
          one is highlighted. A mode switch that only moves a highlight is the
          defect the page contract names outright. */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip label="All" active={tag === null} onClick={() => setTag(null)} />
        {COACH_TAGS.map((t) => (
          <FilterChip key={t} label={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)} />
        ))}
      </div>

      <ul className="space-y-1">
        {list.shown.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            open={open === s.id}
            onToggle={() => setOpen(open === s.id ? null : s.id)}
            onLoad={onLoad}
          />
        ))}
      </ul>
      <ShowMore list={list} className="mt-2" />
    </Card>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-pill px-2.5 py-1 text-label transition-colors ${
        active ? 'bg-ink-2 font-medium text-fg-1' : 'text-fg-2 hover:bg-ink-2 hover:text-fg-1'
      }`}
    >
      {label}
    </button>
  )
}

function SessionRow({ session, open, onToggle, onLoad }: {
  session: CoachSession
  open: boolean
  onToggle: () => void
  onLoad: (exercises: string[], split: Split) => void
}) {
  const moves = loadableMoves(session)
  const split = splitOf(session)
  return (
    <li className="border-b border-line py-2 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <button onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="font-medium text-fg-1">{session.title}</span>{' '}
          <span className="text-label text-fg-2">
            {split} · {moves.length} movements · {setsOf(session)} sets
          </span>
        </button>
        {/* The count is the LOADABLE count, not the line count above it. */}
        <Button variant="secondary" size="sm" onClick={() => onLoad(moves, split)}>
          Load {moves.length}
        </Button>
      </div>

      {open && (
        <div className="mt-2 space-y-2 text-label">
          {session.warmup.length > 0 && (
            <Prescription label="Warm-up" moves={session.warmup} note="not loaded" />
          )}
          <ul className="space-y-0.5">
            {session.main.map((b, i) => (
              isSuperset(b) ? (
                <li key={i} className="text-fg-2">
                  <span className="text-fg-1">{b.sets} × superset</span>{' '}
                  {b.moves.map((mv) => mv.name).join(' + ')}
                  {b.note ? <span className="block text-fg-3">{b.note}</span> : null}
                </li>
              ) : (
                <li key={i} className="text-fg-2">
                  <span className="text-fg-1">{b.name}</span> {prescriptionOf(b)}
                  {b.note ? <span className="block text-fg-3">{b.note}</span> : null}
                </li>
              )
            ))}
          </ul>
          {session.finisher.length > 0 && (
            <Prescription label="Finish" moves={session.finisher} note="not loaded" />
          )}
        </div>
      )}
    </li>
  )
}

function Prescription({ label, moves, note }: { label: string; moves: Move[]; note: string }) {
  return (
    <p className="text-fg-2">
      <span className="text-fg-1">{label}</span>{' '}
      {moves.map((mv) => `${mv.name} ${prescriptionOf(mv)}`.trim()).join(' · ')}
      <span className="text-fg-3"> — {note}</span>
    </p>
  )
}

/**
 * How a move reads on screen.
 *
 * Falls back to `raw`, the coach's own words, rather than printing nothing —
 * the two `noCount` lines and the pyramid have no numbers to format, and a
 * blank there would read as a movement with no prescription rather than as a
 * prescription with no numbers.
 */
function prescriptionOf(m: Move): string {
  if (m.minutes) return `${m.minutes} min`
  if (m.toFailure) return `to failure${m.minReps ? `, at least ${m.minReps}` : ''}`
  if (m.seconds) return `${m.seconds}s${m.sets ? ` × ${m.sets}` : ''}`
  if (m.reps && m.sets) return `${m.reps} × ${m.sets}`
  if (m.sets && m.minReps) return `${m.sets} sets, at least ${m.minReps} reps`
  if (m.sets) return `${m.sets} sets`
  return m.raw
}
