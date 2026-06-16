import { Flame, Star } from 'lucide-react'
import type { Habit, HabitCategory, JournalData } from '../lib/types'
import { addDays, fromISODay } from '../lib/date'
import { cat } from '../lib/colors'
import { habitStreak, cleanStreak, habitTarget, habitValueOn, habitIntensity, weeklyHabitCount, nextHabitValue } from '../lib/stats'
import { Ban, ShieldCheck } from 'lucide-react'

const CATEGORY_ORDER: HabitCategory[] = ['stimulant', 'food', 'movement', 'wellness', 'custom']
// Habit-colored intensity per level (0 = empty); mirrors Heatmap's opacity ramp.
const LEVEL_OPACITY = [0, 0.4, 0.6, 0.8, 1]

/**
 * Activity layout — one row per habit with a GitHub-style intensity heatmap
 * (last 16 weeks) plus a type-aware "today" control. An alternative to the
 * classic month grid; reads the same store via the shared stats helpers so
 * completion/streaks stay consistent across layouts.
 *
 * TODO(BUJO-151): drag-to-reorder is classic-grid only; activity rows follow the
 * saved `order` but can't be reordered here yet.
 */
export function ActivityLayout({
  habits, data, today, onToggle, onSetValue, onEdit,
}: {
  habits: Habit[]
  data: JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
  onEdit: (id: string) => void
}) {
  const cats = CATEGORY_ORDER.filter((c) => habits.some((h) => h.category === c))
  return (
    <div className="space-y-4">
      {cats.map((category) => (
        <div key={category}>
          <p className="mb-1.5 text-[10px] tracking-wide text-overlay0 uppercase">{category}</p>
          <div className="space-y-1.5">
            {habits
              .filter((h) => h.category === category)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((h) => (
                <ActivityRow key={h.id} habit={h} data={data} today={today} onToggle={onToggle} onSetValue={onSetValue} onEdit={onEdit} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const WEEKS = 16

function ActivityRow({
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
  const weekCount = h.weeklyGoal ? weeklyHabitCount(data, h.id, today) : 0
  const days = WEEKS * 7
  // Click a heatmap cell to log that day (check → toggle, count/timer → cycle),
  // matching the classic grid. Rating cells stay display-only (use the control).
  const logDay = (d: string) => {
    if (type === 'rating') return
    if (type === 'count' || type === 'timer') onSetValue(d, h.id, nextHabitValue(type, target, habitValueOn(data, h, d)))
    else onToggle(d, h.id)
  }
  const start = addDays(today, -(days - 1))
  const pad = fromISODay(start).getDay() // align first column to weekday

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-32 shrink-0 items-center gap-1 truncate">
        <span>{avoid ? <Ban size={13} style={{ color: cat('red') }} /> : h.emoji ?? <span style={{ color: cat(h.color) }}>●</span>}</span>
        <button onClick={() => onEdit(h.id)} title={avoid ? `${h.name} — habit to avoid` : undefined} className={`truncate text-sm hover:text-text hover:underline ${h.archived ? 'text-overlay0 line-through' : 'text-subtext1'}`}>{h.name}</button>
      </div>
      <span className="w-9 shrink-0 text-[10px] tabular-nums" style={{ color: streak > 0 ? (avoid ? cat('green') : cat('peach')) : cat('overlay0') }} title={avoid ? `${streak} days clean` : `${streak}-day streak`}>
        {streak > 0 ? <span className="inline-flex items-center gap-0.5">{avoid ? <ShieldCheck size={10} /> : <Flame size={10} />}{streak}</span> : '—'}
      </span>
      {h.weeklyGoal ? (
        <span className="w-10 shrink-0 text-[10px] tabular-nums" title={`${weekCount} of ${h.weeklyGoal} this week`} style={{ color: weekCount >= h.weeklyGoal ? cat('green') : cat('overlay1') }}>
          {weekCount}/{h.weeklyGoal}wk
        </span>
      ) : <span className="w-10 shrink-0" />}

      <div className="min-w-0 flex-1 overflow-x-auto">
        <div
          className="grid grid-flow-col grid-rows-7 gap-0.5"
          role="img"
          aria-label={`${h.name} activity heatmap, last ${WEEKS} weeks`}
        >
          {Array.from({ length: pad }).map((_, i) => <span key={`p${i}`} className="h-2.5 w-2.5" />)}
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
                className="h-2.5 w-2.5 rounded-[2px] disabled:cursor-default enabled:hover:ring-1 enabled:hover:ring-overlay0"
                style={{ background: future || before ? 'transparent' : level === 0 ? cat('surface0') : accent, opacity: level === 0 ? 1 : LEVEL_OPACITY[level] }}
              />
            )
          })}
        </div>
      </div>

      <div className="w-24 shrink-0 text-right">
        <TodayControl habit={h} type={type} target={target} value={habitValueOn(data, h, today)} onToggle={onToggle} onSetValue={onSetValue} today={today} />
      </div>
    </div>
  )
}

function TodayControl({
  habit: h, type, target, value, onToggle, onSetValue, today,
}: {
  habit: Habit
  type: string
  target: number
  value: number
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
  today: string
}) {
  const accent = h.avoid ? cat('red') : cat(h.color)
  if (type === 'rating') {
    return (
      <div className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onSetValue(today, h.id, n === value ? 0 : n)} aria-label={`${h.name}: rate ${n} of 5${n === value ? ' (current)' : ''}`} title={`${n}/5`}>
            <Star size={13} style={{ color: n <= value ? cat(h.color) : cat('surface2') }} fill={n <= value ? cat(h.color) : 'none'} />
          </button>
        ))}
      </div>
    )
  }
  if (type === 'count' || type === 'timer') {
    const next = nextHabitValue(type as 'count' | 'timer', target, value)
    return (
      <button
        onClick={() => onSetValue(today, h.id, next)}
        aria-label={`${h.name}: ${value} of ${target}${h.unit ? ' ' + h.unit : ''}, tap to add`}
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
        style={{ borderColor: value > 0 ? accent : cat('surface1'), color: value > 0 ? cat('text') : cat('subtext0') }}
        title={`Tap to log${h.unit ? ' (' + h.unit + ')' : ''}`}
      >
        {value}/{target}{h.unit ? <span className="text-overlay0">{h.unit === 'min' ? 'm' : ''}</span> : null}
      </button>
    )
  }
  const on = value > 0
  return (
    <button
      onClick={() => onToggle(today, h.id)}
      aria-label={h.avoid ? (on ? 'Slipped today' : 'Clean today') : 'Toggle today'}
      title={h.avoid ? (on ? 'Slipped today' : 'Clean today') : undefined}
      className="inline-grid h-6 w-6 place-items-center rounded-full border"
      style={{ borderColor: on ? accent : cat('surface1'), background: on ? accent : 'transparent' }}
    >
      {on && <span className="text-[10px]" style={{ color: cat('crust') }}>✓</span>}
    </button>
  )
}
