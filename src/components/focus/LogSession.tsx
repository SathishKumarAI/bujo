import { useState } from 'react'
import { SegmentScale } from '../fields/SegmentScale'
import { Button } from '../ui/button'
import { ChipPick, DayPick, Stepper } from '../ui/quickpick'
import { durationOptions } from '../ui/quickpick.options'
import { addDays, todayISO } from '../../lib/date'
import type { DevSession } from '../../lib/types'
import { notify } from '../../lib/notify'

/** A function, not a constant: a module-load `todayISO()` makes the default
 *  date whatever day the tab was opened. See the same fix in Pickleball. */
const blankOf = () => ({ date: todayISO(), durationMin: '', project: '', focus: 7, stress: 3, interruptions: '', tags: '', notes: '' })

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
/** `Number('')` is 0, and 0 minutes is not "not said". Hence the empty check. */
const numOrUndef = (v: string): number | undefined => (v.trim() === '' ? undefined : Number(v))

/** Tags are stored as the comma string the field has always held, so the chips
 *  toggle within that string rather than introducing a second source of truth. */
function toggleTag(csv: string, tag: string): string {
  const list = csv.split(',').map((t) => t.trim()).filter(Boolean)
  const i = list.findIndex((t) => t.toLowerCase() === tag.toLowerCase())
  if (i >= 0) list.splice(i, 1)
  else list.push(tag)
  return list.join(', ')
}

export function LogSession({
  onLog,
  recentProjects = [],
  recentTags = [],
}: {
  onLog: (s: Omit<DevSession, 'id'>) => void
  /** Sorted by minutes spent, so the first chip is usually the right one. */
  recentProjects?: string[]
  recentTags?: string[]
}) {
  const [f, setF] = useState(blankOf)
  const set = (p: Partial<ReturnType<typeof blankOf>>) => setF((c) => ({ ...c, ...p }))
  const yesterday = addDays(todayISO(), -1)
  const tagList = f.tags.split(',').map((t) => t.trim()).filter(Boolean)

  function log() {
    // Focus and stress are pre-filled, so a form with a project, tags and
    // notes LOOKS complete and used to discard silently on submit.
    if (!f.durationMin) { notify.info('How long was the session?', 'Minutes is the one field a focus session needs.'); return }
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
    setF(blankOf())
  }

  const field = 'w-full border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none'

  return (
    <>
      <h2 className="font-display text-heading font-medium text-fg-1">Log a session</h2>
      <p className="mt-1 mb-4 text-label text-fg-2">Coding or deep-work time, however you spent it.</p>

      <div className="grid max-w-[26rem] gap-4">
        {/* TAP, DON'T TYPE — the same conversion Pickleball's log form had.

            Date, minutes and interruptions were typed; project and tags were
            free text you retyped every session. Projects and tags are the ones
            that matter: you work on the same handful of things, so `recent`
            comes from `minutesByProject` and `topTags`, which this page already
            computes for the breakdowns below and which are **sorted by minutes
            spent** — so the chip you want is usually the first one.

            Both keep a text field beside them for something new. Notes stays
            typed because a note is never one of a handful. */}
        <DayPick value={f.date} onChange={(d) => set({ date: d })} today={todayISO()} yesterday={yesterday} />

        <ChipPick
          label="Minutes"
          value={numOrUndef(f.durationMin) ?? null}
          onChange={(v) => set({ durationMin: String(v) })}
          options={durationOptions([25, 45, 60, 90, 120])}
          hint="The one field a session needs"
          after={
            <input
              type="number"
              value={f.durationMin}
              onChange={(e) => set({ durationMin: e.target.value })}
              placeholder="Other"
              aria-label="Minutes"
              className="w-20 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
            />
          }
        />

        {recentProjects.length > 0 ? (
          <ChipPick
            label="Project"
            tone="teal"
            value={f.project || null}
            onChange={(v) => set({ project: f.project === v ? '' : v })}
            options={recentProjects.map((p) => ({ value: p, label: p }))}
            after={
              <input
                value={f.project}
                onChange={(e) => set({ project: e.target.value })}
                placeholder="Something else"
                aria-label="Project"
                className="w-32 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
              />
            }
          />
        ) : (
          <label className="text-label text-fg-2">
            Project
            <input value={f.project} onChange={(e) => set({ project: e.target.value })} placeholder="bujo, work…" className={field} />
          </label>
        )}

        <SegmentScale label="Focus / flow" value={f.focus} onChange={(v) => set({ focus: v })} color="mauve" hint="0 scattered · 10 deep flow" />
        <SegmentScale label="Stress" value={f.stress} onChange={(v) => set({ stress: v })} color="red" hint="0 calm · 10 high" />

        <Stepper
          label="Interruptions"
          value={numOrUndef(f.interruptions)}
          onChange={(v) => set({ interruptions: v == null ? '' : String(v) })}
          max={99}
          placeholder="0"
        />

        {recentTags.length > 0 ? (
          <ChipPick
            label="Tags"
            tone="peach"
            multi
            value={tagList}
            onChange={(t) => set({ tags: toggleTag(f.tags, t) })}
            options={recentTags.map((t) => ({ value: t, label: t }))}
            after={
              <input
                value={f.tags}
                onChange={(e) => set({ tags: e.target.value })}
                placeholder="or type a list"
                aria-label="Tags"
                className="w-36 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
              />
            }
          />
        ) : (
          <label className="text-label text-fg-2">
            Tags
            <input value={f.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="typescript, react" className={field} />
          </label>
        )}

        <label className="text-label text-fg-2">
          Notes
          <input value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="What did you work on?" className={field} />
        </label>
        {/* The page's one primary action. `lg` because it is the button a phone
            user aims at, and the only one on this screen that must be hit. */}
        <Button variant="primary" size="lg" onClick={log} className="w-full">
          Log session
        </Button>
      </div>
    </>
  )
}
