import { Note, Prohibit } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import { Card, Textarea } from './ui'
import { Button } from './ui/button'
import { orderedSlots, slotMeta, type TimeOfDay } from '../lib/timeofday'
import { slotGlyph } from './glyphs'
import type { Habit } from '../lib/types'

/**
 * Tick a day's check-habits without leaving it.
 *
 * Two presentations of the same component, never two components:
 *
 * - `pills`     — the Day surface. A flat row of tappable pills under the log,
 *                 no time-of-day headers. You are mid-day; you know what time
 *                 it is.
 * - `checklist` — the Evening surface. A close-out list, one habit per row,
 *                 grouped by slot so the sweep down the day reads in order.
 *
 * The `date` is a prop rather than `todayISO()` because days are routable now:
 * reading the clock here would have shown today's habits while the rest of the
 * page showed some other day.
 */
export function TodayHabits({ date, variant = 'pills' }: { date?: string; variant?: 'pills' | 'checklist' } = {}) {
  const { data, toggleHabit, setHabitNote } = useJournal()
  const today = date ?? todayISO()
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const notes = data.habitNotes?.[today] ?? {}
  const dow = new Date(today + 'T00:00').getDay()
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
  const asChecklist = variant === 'checklist'
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
      <span key={h.id} className={`inline-flex items-center gap-1 ${asChecklist ? 'w-full' : ''}`}>
        <button
          onClick={() => toggleHabit(today, h.id)}
          aria-pressed={on}
          title={[h.avoid ? (on ? 'Slipped today' : 'Clean today') : '', h.cue].filter(Boolean).join(' · ') || undefined}
          className={`inline-flex min-h-[44px] items-center gap-1.5 border text-body transition-colors active:scale-95 ${asChecklist ? 'w-full rounded-control px-3 py-2 text-left' : 'rounded-pill px-3 py-1.5'}`}
          style={{ borderColor: on ? accent : cat('surface1'), background: on ? accent + '22' : 'transparent', color: on ? accent : cat('subtext1') }}
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
          className="ml-0.5 grid size-6 shrink-0 place-items-center rounded-pill opacity-45 max-md:min-h-[44px] max-md:min-w-[44px] transition-opacity hover:bg-ink-2 hover:opacity-100 focus-visible:opacity-100 group-hover/habit:opacity-100 data-[note]:opacity-100"
          data-note={hasNote || open ? '' : undefined}
          style={{ color: hasNote || open ? cat('mauve') : cat('overlay0') }}
        >
          <Icon as={Note} size="sm" />
        </button>
      </span>
    )
  }

  return (
    <Card
      title="Today’s habits"
      subtitle={asChecklist ? 'Close the day out' : 'Tap to check off'}
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
              {grouped && asChecklist && (
                <p className="mb-1.5 flex items-center gap-1.5 text-label font-medium text-fg-2">
                  <Icon as={slotGlyph(s)} size="sm" /> {m.label}
                  {sBuild.length > 0 && <span className="text-fg-2">· {sDone}/{sBuild.length}</span>}
                </p>
              )}
              <div className={asChecklist ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>{hs.map(chip)}</div>
            </div>
          )
        })}
      </div>

      {noteFor && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-1 inline-flex items-center gap-1 text-label text-fg-2"><Icon as={Note} size="sm" /> Note · {data.habits.find((h) => h.id === noteFor)?.name}</p>
          <Textarea value={notes[noteFor] ?? ''} onChange={(e) => setHabitNote(today, noteFor, e.target.value)} placeholder="How did it go today?" rows={2} autoFocus />
        </div>
      )}
    </Card>
  )
}
