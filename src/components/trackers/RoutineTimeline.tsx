import { Flame, Note, Prohibit } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { fromISODay } from '../../lib/date'
import { Empty, Pill } from '../ui'
import { Button } from '../ui/button'
import { currentSlot, orderedSlots, slotMeta } from '../../lib/timeofday'
import { slotGlyph } from '../glyphs'
import { cat } from '../../lib/colors'
import { cleanStreak, habitDoneOn, habitStreak, habitTarget, habitValueOn, nextHabitValue } from '../../lib/stats'
import type { Habit, JournalData } from '../../lib/types'

/**
 * ROUTINE TIMELINE · one of the tracker's five layouts: today's habits grouped
 * by time of day, ordered from the current slot, for running your day.
 *
 * Owns the slot sections, the per-habit row and its inline note field. Reads
 * slot order and labels from `lib/timeofday.ts` — the hour-to-slot rule is not
 * re-derived here.
 *
 * Shows *today* only. Anything historical is the month grid's job
 * (`CategoryRows.tsx`) or the per-habit panel's (`HabitDetail.tsx`).
 */
export function RoutineTimeline({
  habits, data, today, onToggle, onSetValue, onEdit,
}: {
  habits: Habit[]
  data: JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
  onEdit: (id: string) => void
}) {
  const { setHabitNote } = useJournal()
  const [noting, setNoting] = useState<string | null>(null)
  const hour = new Date().getHours()
  const now = currentSlot(hour)
  const dow = fromISODay(today).getDay()

  const sections = orderedSlots(hour)
    .map((slot) => ({ slot, list: habits.filter((h) => (h.timeOfDay ?? 'anytime') === slot) }))
    .filter((s) => s.list.length > 0)

  if (sections.length === 0) {
    return <Empty>Assign habits a time of day (open a habit → “Time of day”) to build your daily routine.</Empty>
  }

  return (
    <div className="space-y-4">
      {sections.map(({ slot, list }) => {
        const meta = slotMeta(slot)
        const scheduled = list.filter((h) => !h.activeDays?.length || h.activeDays.includes(dow))
        const done = scheduled.filter((h) => habitDoneOn(data, h, today)).length
        return (
          <div key={slot}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-body font-medium text-fg-1"><Icon as={slotGlyph(slot)} size="sm" /> {meta.label}</span>
              {slot === now && <Pill color="mauve" size="micro">now</Pill>}
              <span className="ml-auto text-label text-fg-2">{done}/{scheduled.length || list.length}</span>
            </div>
            <ul className="space-y-1.5">
              {list.map((h) => {
                const type = h.type ?? 'check'
                const numeric = type === 'count' || type === 'timer' || type === 'rating'
                const target = habitTarget(h)
                const val = habitValueOn(data, h, today)
                const on = habitDoneOn(data, h, today)
                const next = nextHabitValue(type, target, val)
                const dueToday = !h.activeDays?.length || h.activeDays.includes(dow)
                const streak = h.avoid ? cleanStreak(data, h.id, today) : habitStreak(data, h.id, today)
                const note = data.habitNotes?.[today]?.[h.id] ?? ''
                const open = noting === h.id
                return (
                  <li key={h.id} className={`rounded-none border border-line bg-ink-0 p-2.5 ${dueToday ? '' : 'opacity-50'}`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => (numeric ? onSetValue(today, h.id, next) : onToggle(today, h.id))}
                        aria-label={`Mark ${h.name}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-none border text-body transition-colors"
                        style={{
                          borderColor: on ? (h.avoid ? cat('red') : cat(h.color)) : cat('surface1'),
                          background: on ? (h.avoid ? cat('red') : cat(h.color)) + '33' : 'transparent',
                        }}
                      >{on ? (h.avoid ? <Icon as={Prohibit} size="sm" /> : '') : (h.emoji ?? '○')}</button>
                      {/* The name is the control. There used to be a second
                          button beside it firing the identical `onEdit(h.id)`,
                          which is two targets for one action in a row that is
                          already dense. */}
                      <button onClick={() => onEdit(h.id)} aria-label={`${h.name} — activity & stats`} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-body text-fg-1">{h.name}</span>
                        {h.cue && <span className="block truncate text-caption text-fg-2">{h.cue}</span>}
                      </button>
                      {numeric && !h.avoid && <span className="shrink-0 text-label text-fg-2">{type === 'rating' ? `${val}/5` : `${val}/${target}${type === 'timer' ? 'm' : ''}`}</span>}
                      {streak > 0 && <span className="inline-flex shrink-0 items-center gap-0.5 text-label" style={{ color: cat('peach') }}><Icon as={Flame} size="sm" /> {streak}</span>}
                      <Button variant="ghost" size="icon-sm" onClick={() => setNoting(open ? null : h.id)} aria-label={`Note for ${h.name}`} title="Jot a note" className={`shrink-0 ${note || open ? 'text-mauve' : 'text-fg-2 hover:text-fg-1'}`}><Icon as={Note} size="sm" /></Button>
                    </div>
                    {(open || note) && (
                      <input
                        value={note}
                        onChange={(e) => setHabitNote(today, h.id, e.target.value)}
                        onBlur={() => setNoting(null)}
                        autoFocus={open}
                        placeholder="Jot a note for today…"
                        className="mt-2 w-full rounded-none border border-input bg-card px-2 py-1 text-label text-foreground"
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
