import { useState } from 'react'
import { Band, Eyebrow } from '../mod'
import { Button } from '../ui/button'
import { SegmentScale } from '../fields/SegmentScale'
import { formatMinutes } from '../../lib/focus'
import { prettyDay } from '../../lib/date'
import type { DevSession } from '../../lib/types'

/**
 * Every logged deep-work session, newest first, editable in place.
 *
 * Editing matters more than it looks: deleting and re-logging a mistyped
 * duration also re-dates the session and skews the duration-weighted focus
 * average, so a mistake used to cost two numbers rather than one.
 */
export function SessionHistory({
  sessions,
  onSave,
  onDelete,
}: {
  sessions: DevSession[]
  onSave: (id: string, patch: Partial<DevSession>) => void
  onDelete: (id: string) => void
}) {
  return (
    <Band className="border-b-0 py-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-heading font-medium text-fg-1">History</h2>
        <Eyebrow className="tracking-[0.1em]">
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </Eyebrow>
      </div>
      {sessions.length === 0 ? (
        <p className="mt-3 text-label text-fg-2">No sessions yet. Log your first block above.</p>
      ) : (
        <ul className="mt-3">
          {sessions.map((s) => (
            <SessionRow key={s.id} s={s} onSave={(p) => onSave(s.id, p)} onDelete={() => onDelete(s.id)} />
          ))}
        </ul>
      )}
    </Band>
  )
}

function SessionRow({ s, onSave, onDelete }: { s: DevSession; onSave: (patch: Partial<DevSession>) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [d, setD] = useState({
    durationMin: String(s.durationMin),
    project: s.project ?? '',
    focus: s.focus,
    stress: s.stress,
    notes: s.notes ?? '',
  })

  const field = 'w-full border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 focus-visible:border-brand focus-visible:outline-none'

  function save() {
    const mins = Number(d.durationMin)
    if (!mins || mins <= 0) return
    onSave({
      durationMin: mins,
      project: d.project.trim() || undefined,
      focus: d.focus,
      stress: d.stress,
      notes: d.notes.trim() || undefined,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="border-t border-line py-3">
        <div className="grid max-w-[26rem] gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="text-label text-fg-2">
              Minutes
              <input
                type="number"
                value={d.durationMin}
                onChange={(e) => setD((c) => ({ ...c, durationMin: e.target.value }))}
                className={field}
              />
            </label>
            <label className="text-label text-fg-2">
              Project
              <input value={d.project} onChange={(e) => setD((c) => ({ ...c, project: e.target.value }))} className={field} />
            </label>
          </div>
          <SegmentScale label="Focus / flow" value={d.focus} onChange={(v) => setD((c) => ({ ...c, focus: v }))} color="mauve" />
          <SegmentScale label="Stress" value={d.stress} onChange={(v) => setD((c) => ({ ...c, stress: v }))} color="red" />
          <label className="text-label text-fg-2">
            Notes
            <input value={d.notes} onChange={(e) => setD((c) => ({ ...c, notes: e.target.value }))} className={field} />
          </label>
          <div className="flex gap-3">
            <Button variant="primary" onClick={save} className="flex-1 rounded-none">
              Save
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1 rounded-none">
              Cancel
            </Button>
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="group border-t border-line py-2.5">
      <div className="flex items-baseline gap-3">
        <span className="text-label text-fg-1">{s.project || 'Session'}</span>
        <span className="text-label text-fg-3">{prettyDay(s.date)}</span>
        <div className="ml-auto flex items-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => {
              setD({ durationMin: String(s.durationMin), project: s.project ?? '', focus: s.focus, stress: s.stress, notes: s.notes ?? '' })
              setEditing(true)
            }}
            className="text-label text-fg-2 hover:text-brand-text"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            aria-label={`Delete session on ${prettyDay(s.date)}`}
            className="text-label text-fg-2 hover:text-danger-text"
          >
            ×
          </button>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-label text-fg-2">
        <span className="num">{formatMinutes(s.durationMin)}</span>
        <span className="num">focus {s.focus}</span>
        <span className="num">stress {s.stress}</span>
        {s.interruptions != null && <span className="num">{s.interruptions} interruptions</span>}
        {(s.tags ?? []).map((t) => (
          <span key={t} className="text-fg-3">#{t}</span>
        ))}
      </div>
      {s.notes && <p className="mt-1 text-label text-fg-3 italic">{s.notes}</p>}
    </li>
  )
}
