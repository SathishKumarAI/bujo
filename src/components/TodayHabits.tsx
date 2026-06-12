import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import { Card, Empty } from './ui'

/**
 * Tick today's habits without leaving Today. Shows the check-habits scheduled
 * for today as toggleable chips (count habits link out to Trackers for the
 * number pad). Reuses the same store as Trackers — no duplicated state.
 */
export function TodayHabits() {
  const { data, toggleHabit } = useJournal()
  const today = todayISO()
  const dow = new Date(today + 'T00:00').getDay()
  const habits = data.habits.filter(
    (h) => !h.archived && (h.type ?? 'check') === 'check' && today >= h.startedOn && (!h.activeDays?.length || h.activeDays.includes(dow)),
  )
  if (habits.length === 0) return null
  const log = data.habitLog[today] ?? []
  const done = habits.filter((h) => log.includes(h.id)).length

  return (
    <Card title="Today’s habits" subtitle="Tap to check off — no need to open Trackers" right={<span className="text-xs text-overlay0">{done}/{habits.length}</span>} collapsible>
      {habits.length === 0 ? (
        <Empty>No habits scheduled today.</Empty>
      ) : (
        <div className="flex flex-wrap gap-2">
          {habits.map((h) => {
            const on = log.includes(h.id)
            return (
              <button
                key={h.id}
                onClick={() => toggleHabit(today, h.id)}
                aria-pressed={on}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
                style={{ borderColor: on ? cat(h.color) : cat('surface1'), background: on ? cat(h.color) + '22' : 'transparent', color: on ? cat(h.color) : cat('subtext1') }}
              >
                {h.emoji ? <span>{h.emoji}</span> : <span style={{ color: cat(h.color) }}>●</span>}
                {h.name}{on ? ' ✓' : ''}
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
