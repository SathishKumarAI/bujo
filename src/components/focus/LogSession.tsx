import { useState } from 'react'
import { SegmentScale } from '../fields/SegmentScale'
import { Button } from '../ui/button'
import { todayISO } from '../../lib/date'
import type { DevSession } from '../../lib/types'

const blank = { date: todayISO(), durationMin: '', project: '', focus: 7, stress: 3, interruptions: '', tags: '', notes: '' }

/**
 * The act zone's form: log a deep-work session.
 *
 * Owns the draft and its validation (a session with no minutes is not a
 * session). The store write is the view's job.
 *
 * Fields keep a bottom rule instead of a box, like every other input in the
 * redesign. `SegmentScale` is untouched — it is shared with Today, and eleven
 * dots that read "not answered yet" is a solved problem worth leaving alone.
 */
export function LogSession({ onLog }: { onLog: (s: Omit<DevSession, 'id'>) => void }) {
  const [f, setF] = useState(blank)
  const set = (p: Partial<typeof blank>) => setF((c) => ({ ...c, ...p }))

  function log() {
    if (!f.durationMin) return
    onLog({
      date: f.date,
      durationMin: Number(f.durationMin),
      project: f.project.trim() || undefined,
      focus: f.focus,
      stress: f.stress,
      interruptions: f.interruptions ? Number(f.interruptions) : undefined,
      tags: f.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      notes: f.notes.trim() || undefined,
    })
    setF({ ...blank })
  }

  const field = 'w-full border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none'

  return (
    <>
      <h2 className="font-display text-heading font-medium text-fg-1">Log a session</h2>
      <p className="mt-1 mb-4 text-label text-fg-2">Coding or deep-work time, however you spent it.</p>

      <div className="grid max-w-[26rem] gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="text-label text-fg-2">
            Date
            <input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className={field} />
          </label>
          <label className="text-label text-fg-2">
            Minutes
            <input type="number" value={f.durationMin} onChange={(e) => set({ durationMin: e.target.value })} placeholder="90" className={field} />
          </label>
        </div>
        <label className="text-label text-fg-2">
          Project
          <input value={f.project} onChange={(e) => set({ project: e.target.value })} placeholder="bujo, work…" className={field} />
        </label>
        <SegmentScale label="Focus / flow" value={f.focus} onChange={(v) => set({ focus: v })} color="mauve" hint="0 scattered · 10 deep flow" />
        <SegmentScale label="Stress" value={f.stress} onChange={(v) => set({ stress: v })} color="red" hint="0 calm · 10 high" />
        <div className="grid grid-cols-2 gap-4">
          <label className="text-label text-fg-2">
            Interruptions
            <input type="number" value={f.interruptions} onChange={(e) => set({ interruptions: e.target.value })} placeholder="0" className={field} />
          </label>
          <label className="text-label text-fg-2">
            Tags
            <input value={f.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="typescript, react" className={field} />
          </label>
        </div>
        <label className="text-label text-fg-2">
          Notes
          <input value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="What did you work on?" className={field} />
        </label>
        {/* The page's one primary action. `lg` because it is the button a phone
            user aims at, and the only one on this screen that must be hit. */}
        <Button variant="primary" size="lg" onClick={log} className="w-full rounded-none">
          Log session
        </Button>
      </div>
    </>
  )
}
