import { Note, Prohibit } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { cat, washStyle } from '../lib/colors'
import { todayISO } from '../lib/date'
import { Card, Textarea } from './ui'
import { Button } from './ui/button'
import { orderedSlots, slotMeta, type TimeOfDay } from '../lib/timeofday'
import { slotGlyph } from './glyphs'
import type { Habit } from '../lib/types'

/**
 * Tick a day's check-habits without leaving Today. Habitify-style: habits are
 * grouped by time of day (Morning / Afternoon / Evening / Anytime) with the
 * current slot surfaced first, and a completion ring shows the day's progress.
 *
 * **One component, three renderings**, because the Today surfaces each want the
 * habits in a different shape and a second copy would drift within a week:
 *
 * - `card` — the full card with slot headings and the ring. Classic Today.
 * - `row` — a bare pill row, no card, no headings. Sits under the rapid log on
 *   the Day surface, where the log is the only card by design.
 * - `checklist` — a vertical close-out list for the Evening surface, where the
 *   job is "walk the list once", not "spot the one you forgot".
 *
 * `date` defaults to today but is passed from the cursor, so the habits shown
 * belong to the day you are looking at rather than to the wall clock.
 */
export function TodayHabits({
  date = todayISO(),
  variant = 'card',
}: {
  date?: string
  variant?: 'card' | 'row' | 'checklist'
} = {}) {
  const { data, toggleHabit, setHabitNote } = useJournal()
  const today = date
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const notes = data.habitNotes?.[today] ?? {}
  const now = new Date(today + 'T00:00')
  const dow = now.getDay()
  const habits = data.habits.filter(
    (h) => !h.archived && (h.type ?? 'check') === 'check' && today >= h.startedOn && (!h.activeDays?.length || h.activeDays.includes(dow)),
  )
  if (habits.length === 0) return null

  const log = data.habitLog[today] ?? []
  const buildHabits = habits.filter((h) => !h.avoid)
  const done = buildHabits.filter((h) => log.includes(h.id)).length
  const total = buildHabits.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const allDone = done === total

  const slots = orderedSlots(new Date().getHours())
  const bySlot = (s: TimeOfDay) => habits.filter((h) => (h.timeOfDay ?? 'anytime') === s)
  const nonEmpty = slots.filter((s) => bySlot(s).length > 0)
  const grouped = nonEmpty.length > 1 // only show time headers once habits actually span slots

  const R = 9
  const C = 2 * Math.PI * R

  function chip(h: Habit) {
    const on = log.includes(h.id)
    const accent = h.avoid ? cat('red') : cat(h.color)
    const hasNote = !!notes[h.id]
    const open = noteFor === h.id
    return (
      // The habit and its note are one unit, so they sit in a group that shares
      // a hover state — previously the note button was a bare 13px glyph
      // floating beside the chip, reading as an eighth unexplained icon rather
      // than as part of the habit.
      <span key={h.id} className="group/habit inline-flex items-center">
        <button
          onClick={() => toggleHabit(today, h.id)}
          aria-pressed={on}
          title={[h.avoid ? (on ? 'Slipped today' : 'Clean today') : '', h.cue].filter(Boolean).join(' · ') || undefined}
          // `min-h-11` — 44px (WCAG 2.5.5). `py-1.5` on a 15px line put these
          // at 34px, and they are the most-tapped control on a phone.
          className="inline-flex min-h-11 items-center gap-1.5 rounded-none border px-3 py-1.5 text-body transition-colors active:scale-95"
          style={{ borderColor: on ? accent : cat('surface1'), ...(on ? washStyle(accent) : { background: 'transparent', color: cat('subtext1') }) }}
        >
          {h.avoid ? <Icon as={Prohibit} size="sm" /> : h.emoji ? <span>{h.emoji}</span> : <span style={{ color: cat(h.color) }}>●</span>}
          {h.name}{h.avoid ? (on ? ' · slip' : ' · clean') : (on ? ' ✓' : '')}
        </button>
        {/* 24x24 minimum target (WCAG 2.5.8) — the icon stays 13px, the box
            around it does the work. Quiet until it holds a note, is open, or
            the habit is hovered/focused; always reachable on touch, where
            there is no hover to reveal it. */}
        <button
          onClick={() => setNoteFor((v) => (v === h.id ? null : h.id))}
          aria-label={hasNote ? `Edit note for ${h.name}` : `Add a note for ${h.name}`}
          aria-expanded={open}
          title={hasNote ? notes[h.id] : 'Add a note'}
          className="ml-0.5 grid size-6 shrink-0 place-items-center rounded-none opacity-45 transition-opacity hover:bg-ink-2 hover:opacity-100 focus-visible:opacity-100 group-hover/habit:opacity-100 data-[note]:opacity-100"
          data-note={hasNote || open ? '' : undefined}
          style={{ color: hasNote || open ? cat('mauve') : cat('overlay0') }}
        >
          <Icon as={Note} size="sm" />
        </button>
      </span>
    )
  }

  /** The note editor, shared by all three renderings. */
  const noteEditor = noteFor && (
    <div className="mt-3 border-t border-line pt-3">
      <p className="mb-1 inline-flex items-center gap-1 text-label text-fg-2"><Icon as={Note} size="sm" /> Note · {data.habits.find((h) => h.id === noteFor)?.name}</p>
      <Textarea value={notes[noteFor] ?? ''} onChange={(e) => setHabitNote(today, noteFor, e.target.value)} placeholder="How did it go today?" rows={2} autoFocus />
    </div>
  )

  // ── row · the Day surface. No card, no slot headings, no ring: the rapid log
  //    is the only card on that surface, and headings over six pills is
  //    furniture. The count moves to the end of the row as one quiet chip.
  if (variant === 'row') {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {habits.map(chip)}
          <span className="ml-auto text-label tabular-nums text-fg-2">{done}/{total}</span>
        </div>
        {noteEditor}
      </div>
    )
  }

  // ── checklist · the Evening surface. Closing the day is a walk down a list,
  //    so it reads as one: a row per habit, state on the left, full width.
  if (variant === 'checklist') {
    return (
      <Card band title="Close out your habits" hideInfo>
        <ul className="divide-y divide-line">
          {habits.map((h) => {
            const on = log.includes(h.id)
            // For an AVOID habit, ticked means you slipped — not that you did
            // the thing. So it gets none of the done treatment: no tick, no
            // strike-through, and a red mark instead. Struck-through-with-a-
            // check on "Alcohol" reads as "well done, that's handled", which
            // is the opposite of what the tick records.
            const slipped = h.avoid && on
            const cleared = !h.avoid && on
            const accent = h.avoid ? cat('red') : cat(h.color)
            return (
              <li key={h.id}>
                <button
                  onClick={() => toggleHabit(today, h.id)}
                  aria-pressed={on}
                  className="flex min-h-11 w-full items-center gap-3 py-2 text-left text-body"
                >
                  <span
                    aria-hidden
                    className="grid size-5 shrink-0 place-items-center rounded-none border text-caption"
                    style={{
                      borderColor: on ? accent : cat('surface1'),
                      ...(on ? washStyle(accent) : { background: 'transparent', color: accent }),
                    }}
                  >
                    {slipped ? '✕' : cleared ? '✓' : ''}
                  </span>
                  <span className={cleared ? 'text-fg-2 line-through' : 'text-fg-1'}>
                    {h.emoji ? `${h.emoji} ` : ''}{h.name}
                  </span>
                  {h.avoid && (
                    <span className="ml-auto text-label" style={{ color: slipped ? cat('red') : cat('green') }}>
                      {slipped ? 'slipped' : 'clean'}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        {/* Counted over build habits only, and said so. `done`/`total` exclude
            avoid habits (a clean day on "no alcohol" is not a tick), so an
            unqualified "5 of 8" against a list of ten rows would not add up. */}
        <p className="mt-3 text-label text-fg-2">
          {done} of {total} done{allDone ? ' · all of them' : ''}.
          {habits.length > total && ` ${habits.length - total} to avoid, tracked separately.`}
        </p>
      </Card>
    )
  }

  return (
    <Card band
      title="Today’s habits"
      hideInfo
      right={
        <span className="inline-flex items-center gap-2">
          {!allDone && total > 0 && (
            <Button
              variant="ghost"
              onClick={() => buildHabits.forEach((h) => { if (!log.includes(h.id)) toggleHabit(today, h.id) })}
              className="h-auto p-0 text-label text-mauve"
            >
              Mark {total - done} left
            </Button>
          )}
          <span className="inline-flex items-center gap-1.5">
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
              <circle cx="11" cy="11" r={R} fill="none" stroke={cat('surface1')} strokeWidth="2.5" />
              <circle cx="11" cy="11" r={R} fill="none" stroke={cat(allDone ? 'green' : 'mauve')} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 11 11)" style={{ transition: 'stroke-dashoffset 0.3s' }} />
            </svg>
            <span className="text-label tabular-nums text-fg-2">{done}/{total}</span>
          </span>
        </span>
      }
      collapsible
    >
      <div className="space-y-3">
        {slots.map((s) => {
          const hs = bySlot(s)
          if (!hs.length) return null
          const m = slotMeta(s)
          const sBuild = hs.filter((h) => !h.avoid)
          const sDone = sBuild.filter((h) => log.includes(h.id)).length
          return (
            <div key={s}>
              {grouped && (
                <p className="mb-1.5 flex items-center gap-1.5 text-label font-medium text-fg-2">
                  <Icon as={slotGlyph(s)} size="sm" /> {m.label}
                  {sBuild.length > 0 && <span className="text-fg-2">· {sDone}/{sBuild.length}</span>}
                </p>
              )}
              <div className="flex flex-wrap gap-2">{hs.map(chip)}</div>
            </div>
          )
        })}
      </div>

      {noteEditor}
    </Card>
  )
}
