import { Flame, ShieldCheck, Ban, Activity } from 'lucide-react'
import { Card } from './ui'
import type { Habit, JournalData } from '../lib/types'
import { addDays, fromISODay } from '../lib/date'
import { cat } from '../lib/colors'
import { habitStreak, cleanStreak, habitTarget, habitValueOn, habitIntensity, nextHabitValue } from '../lib/stats'

const WEEKS = 13
const LEVEL_OPACITY = [0, 0.4, 0.6, 0.8, 1]

/**
 * HabitKit-style "cards" layout (BUJO-244): each habit is its own colourful
 * tile-grid card. The 13-week heatmap is the primary logging surface — tap a
 * cell to mark/cycle that day (check → toggle, count/timer → next value). A
 * fourth tracker layout alongside grid / activity / routine; logs the same store.
 */
export function GridCardsLayout({
  habits, data, today, onToggle, onSetValue, onEdit,
}: {
  habits: Habit[]
  data: JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
  onEdit: (id: string) => void
}) {
  if (habits.length === 0) return null
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {habits.map((h) => (
        <HabitGridCard key={h.id} habit={h} data={data} today={today} onToggle={onToggle} onSetValue={onSetValue} onEdit={onEdit} />
      ))}
    </div>
  )
}

function HabitGridCard({
  habit: h, data, today, onToggle, onSetValue, onEdit,
}: {
  habit: Habit
  data: JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
  onEdit: (id: string) => void
}) {
  const type = h.type ?? 'check'
  const target = habitTarget(h)
  const avoid = !!h.avoid
  const accent = avoid ? cat('red') : cat(h.color)
  const streak = avoid ? cleanStreak(data, h.id) : habitStreak(data, h.id)

  const days = WEEKS * 7
  const start = addDays(today, -(days - 1))
  const pad = fromISODay(start).getDay()

  const logDay = (d: string) => {
    if (type === 'rating') return // ratings use the editor; cell is display-only
    if (type === 'count' || type === 'timer') onSetValue(d, h.id, nextHabitValue(type, target, habitValueOn(data, h, d)))
    else onToggle(d, h.id)
  }

  return (
    <Card className="!p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="shrink-0">{avoid ? <Ban size={15} style={{ color: cat('red') }} /> : h.emoji ?? <span style={{ color: cat(h.color) }}>●</span>}</span>
        <button onClick={() => onEdit(h.id)} className={`min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline ${h.archived ? 'text-overlay0 line-through' : 'text-text'}`}>{h.name}</button>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs tabular-nums" style={{ color: streak > 0 ? (avoid ? cat('green') : cat('peach')) : cat('overlay0') }}>
          {streak > 0 ? <>{avoid ? <ShieldCheck size={12} /> : <Flame size={12} />}{streak}</> : '—'}
        </span>
        <button onClick={() => onEdit(h.id)} aria-label={`View ${h.name} activity & stats`} title="View activity & stats" className="shrink-0 text-overlay0 hover:text-mauve"><Activity size={13} /></button>
      </div>
      <div className="overflow-x-auto">
        <div
          className="grid grid-flow-col grid-rows-7 gap-1"
          role="group"
          aria-label={`${h.name} — last ${WEEKS} weeks, tap a day to log`}
        >
          {Array.from({ length: pad }).map((_, i) => <span key={`p${i}`} className="h-3.5 w-3.5" />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = addDays(start, i)
            const future = d > today
            const before = d < h.startedOn
            const level = habitIntensity(type, habitValueOn(data, h, d), target)
            const editable = !future && !before && type !== 'rating'
            return (
              <button
                key={d}
                disabled={!editable}
                onClick={() => logDay(d)}
                aria-label={`${h.name} ${d}${level ? (avoid ? ' · slip' : ' · done') : ''}`}
                title={`${d}${level ? (avoid ? ' · slip' : ' · done') : ''}`}
                className="h-3.5 w-3.5 rounded-[3px] disabled:cursor-default enabled:hover:ring-1 enabled:hover:ring-overlay0"
                style={{ background: future || before ? 'transparent' : level === 0 ? cat('surface0') : accent, opacity: level === 0 ? 1 : LEVEL_OPACITY[level] }}
              />
            )
          })}
        </div>
      </div>
    </Card>
  )
}
