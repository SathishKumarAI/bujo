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
  // "Avoid" habits log slips, not wins — exclude them from done/all-done and
  // never auto-"Mark all" them.
  const buildHabits = habits.filter((h) => !h.avoid)
  const done = buildHabits.filter((h) => log.includes(h.id)).length
  const allDone = done === buildHabits.length

  return (
    <Card
      title="Today’s habits"
      subtitle="Tap to check off — no need to open Trackers"
      right={
        <span className="inline-flex items-center gap-2 text-xs">
          {!allDone && <button onClick={() => buildHabits.forEach((h) => { if (!log.includes(h.id)) toggleHabit(today, h.id) })} className="text-mauve hover:underline">Mark all</button>}
          <span className="text-overlay0">{done}/{buildHabits.length}</span>
        </span>
      }
      collapsible
    >
      {habits.length === 0 ? (
        <Empty>No habits scheduled today.</Empty>
      ) : (
        <div className="flex flex-wrap gap-2">
          {habits.map((h) => {
            const on = log.includes(h.id)
            const accent = h.avoid ? cat('red') : cat(h.color)
            return (
              <button
                key={h.id}
                onClick={() => toggleHabit(today, h.id)}
                aria-pressed={on}
                title={h.avoid ? (on ? 'Slipped today — tap to clear' : 'Clean today') : undefined}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
                style={{ borderColor: on ? accent : cat('surface1'), background: on ? accent + '22' : 'transparent', color: on ? accent : cat('subtext1') }}
              >
                {h.avoid ? <span>🚫</span> : h.emoji ? <span>{h.emoji}</span> : <span style={{ color: cat(h.color) }}>●</span>}
                {h.name}{h.avoid ? (on ? ' — slip' : ' — clean') : (on ? ' ✓' : '')}
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
