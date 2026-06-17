import { useState } from 'react'
import { StickyNote } from 'lucide-react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import { Card, Textarea } from './ui'
import { orderedSlots, slotMeta, type TimeOfDay } from '../lib/timeofday'
import type { Habit } from '../lib/types'

/**
 * Tick today's check-habits without leaving Today. Habitify-style: habits are
 * grouped by time of day (Morning / Afternoon / Evening / Anytime) with the
 * current slot surfaced first, and a completion ring shows the day's progress.
 */
export function TodayHabits() {
  const { data, toggleHabit, setHabitNote } = useJournal()
  const today = todayISO()
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
    return (
      <span key={h.id} className="inline-flex items-center gap-1">
        <button
          onClick={() => toggleHabit(today, h.id)}
          aria-pressed={on}
          title={[h.avoid ? (on ? 'Slipped today' : 'Clean today') : '', h.cue].filter(Boolean).join(' · ') || undefined}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors active:scale-95"
          style={{ borderColor: on ? accent : cat('surface1'), background: on ? accent + '22' : 'transparent', color: on ? accent : cat('subtext1') }}
        >
          {h.avoid ? <span>🚫</span> : h.emoji ? <span>{h.emoji}</span> : <span style={{ color: cat(h.color) }}>●</span>}
          {h.name}{h.avoid ? (on ? ' — slip' : ' — clean') : (on ? ' ✓' : '')}
        </button>
        <button
          onClick={() => setNoteFor((v) => (v === h.id ? null : h.id))}
          aria-label={`Note for ${h.name}`}
          title={hasNote ? notes[h.id] : 'Add a note'}
          className="shrink-0 hover:text-mauve"
          style={{ color: hasNote ? cat('mauve') : cat('overlay0') }}
        >
          <StickyNote size={13} />
        </button>
      </span>
    )
  }

  return (
    <Card
      title="Today’s habits"
      subtitle="Tap to check off — grouped by time of day"
      right={
        <span className="inline-flex items-center gap-2">
          {!allDone && total > 0 && (
            <button onClick={() => buildHabits.forEach((h) => { if (!log.includes(h.id)) toggleHabit(today, h.id) })} className="text-xs text-mauve hover:underline">Mark all</button>
          )}
          <span className="inline-flex items-center gap-1.5">
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
              <circle cx="11" cy="11" r={R} fill="none" stroke={cat('surface1')} strokeWidth="2.5" />
              <circle cx="11" cy="11" r={R} fill="none" stroke={cat(allDone ? 'green' : 'mauve')} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 11 11)" style={{ transition: 'stroke-dashoffset 0.3s' }} />
            </svg>
            <span className="text-xs tabular-nums text-overlay0">{done}/{total}</span>
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
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-overlay1">
                  <span>{m.emoji}</span> {m.label}
                  {sBuild.length > 0 && <span className="text-overlay0">· {sDone}/{sBuild.length}</span>}
                </p>
              )}
              <div className="flex flex-wrap gap-2">{hs.map(chip)}</div>
            </div>
          )
        })}
      </div>

      {noteFor && (
        <div className="mt-3 border-t border-surface0 pt-3">
          <p className="mb-1 inline-flex items-center gap-1 text-xs text-overlay0"><StickyNote size={12} /> Note · {data.habits.find((h) => h.id === noteFor)?.name}</p>
          <Textarea value={notes[noteFor] ?? ''} onChange={(e) => setHabitNote(today, noteFor, e.target.value)} placeholder="How did it go today?" rows={2} autoFocus />
        </div>
      )}
    </Card>
  )
}
