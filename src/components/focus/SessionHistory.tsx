import { useState } from 'react'
import { Button } from '../ui/button'
import { SegmentScale } from '../fields/SegmentScale'
import { formatMinutes } from '../../lib/focus'
import { prettyDay } from '../../lib/date'
import type { DevSession } from '../../lib/types'
import { notify } from '../../lib/notify'
import { ShowMore } from '../ShowMore'
import { useCappedList } from '../../lib/useCappedList'

/**
 * Every logged deep-work session, newest first, editable in place.
 *
 * Editing matters more than it looks: deleting and re-logging a mistyped
 * duration also re-dates the session and skews the duration-weighted focus
 * average, so a mistake used to cost two numbers rather than one.
 *
 * **The `Band` wrapper and the `<h2>` are gone from this file, not deleted from
 * the page.** This is the `log` row of the zone-3 rail now, so the heading, the
 * count and the surface belong to the `Card` that `lib/focusCards.ts` places it
 * in — a component that draws its own section heading inside a card is the
 * "card inside a card" mistake in header form, and it is what made every one of
 * the six old bands impossible to place anywhere but a flat vertical stack.
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
  const history = useCappedList(sessions)
  if (sessions.length === 0) {
    return <p className="text-label text-fg-2">No sessions yet. Log your first block with the form beside this one.</p>
  }
  return (
    <>
    <ul>
      {/* Capped. This list had no limit at all — every Focus session ever
          logged, in a card whose subtitle already prints the count, so the
          number was on screen twice and the rows pushed the rest of the group
          off the page (COD-303). */}
      {history.shown.map((s) => (
        <SessionRow key={s.id} s={s} onSave={(p) => onSave(s.id, p)} onDelete={() => onDelete(s.id)} />
      ))}
    </ul>
    {/* Below the list rather than in the card header: this component does not
        own the header — `views/Focus.tsx` does — and a control that lives in
        one file while the thing it controls lives in another is the drift this
        sweep was cleaning up. */}
    <ShowMore list={history} className="mt-2" />
    </>
  )
}

/** The editable fields of a session, read off the row as it stands right now. */
const draftOfSession = (s: DevSession) => ({
  durationMin: String(s.durationMin),
  project: s.project ?? '',
  focus: s.focus,
  stress: s.stress,
  notes: s.notes ?? '',
})

function SessionRow({ s, onSave, onDelete }: { s: DevSession; onSave: (patch: Partial<DevSession>) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  /**
   * The draft is re-seeded when the editor OPENS — which the Edit button
   * already did inline; `startEditing` is that same re-seed, named once
   * instead of spelled out at the call site.
   *
   * The narrow window that remains: if undo/redo or a cloud pull replaces the
   * journal *while an editor is open*, this draft still holds the old values
   * and `save()` writes them back. Closing and reopening the editor is the
   * out, and a `key={s.id}` remount driven by the row's content would be the
   * real fix — noted rather than done, because it changes when every row in
   * the list remounts and that is not this PR's subject.
   */
  const [d, setD] = useState(() => draftOfSession(s))

  function startEditing() {
    setD(draftOfSession(s))
    setEditing(true)
  }

  const field = 'w-full border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 focus-visible:border-brand focus-visible:outline-none'

  function save() {
    const mins = Number(d.durationMin)
    if (!mins || mins <= 0) { notify.info('How long was the session?', 'Minutes has to be more than zero.'); return }
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
            <Button variant="primary" onClick={save} className="flex-1">
              Save
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">
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
        {/* `-my-2.5` cancels the row's own `py-2.5`, so a 44px hit target
            (COD-96) does not make a long list 17% taller. The controls were a
            bare "Edit" and a bare "×" whose targets were the glyphs. */}
        <div className="reveal -my-2.5 ml-auto flex items-center gap-1">
          <button
            onClick={startEditing}
            className="min-h-11 rounded-control px-2 text-label text-fg-2 hover:bg-ink-2 hover:text-brand-text"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            aria-label={`Delete session on ${prettyDay(s.date)}`}
            className="min-h-11 rounded-control px-2.5 text-label text-fg-2 hover:bg-ink-2 hover:text-danger-text"
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
