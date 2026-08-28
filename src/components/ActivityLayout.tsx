import { DotsSixVertical, Flame, PersonSimpleRun, Prohibit, ShieldCheck, Star } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import type { Habit, HabitCategory, JournalData } from '../lib/types'
import { addDays, fromISODay } from '../lib/date'
import { cat, onAccent } from '../lib/colors'
import { habitStreak, cleanStreak, habitTarget, habitValueOn, habitIntensity, weeklyHabitCount, nextHabitValue } from '../lib/stats'
import { DayGrid } from './ui/day-grid'

const CATEGORY_ORDER: HabitCategory[] = ['stimulant', 'food', 'movement', 'wellness', 'custom']
/**
 * Activity layout · one row per habit with a GitHub-style intensity heatmap
 * (last 16 weeks) plus a type-aware "today" control. An alternative to the
 * classic month grid; reads the same store via the shared stats helpers so
 * completion/streaks stay consistent across layouts.
 *
 * BUJO-151/175: drag-to-reorder works here too (grip handle per row), reusing the
 * same `reorderHabits` store logic as the classic grid. Reorder is within a
 * category (matching the classic grid); the grip appears on row hover.
 */
export function ActivityLayout({
  habits, data, today, onToggle, onSetValue, onEdit, onReorder,
}: {
  habits: Habit[]
  data: JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
  onEdit: (id: string) => void
  onReorder?: (category: HabitCategory, dragId: string, dropId: string) => void
}) {
  const cats = CATEGORY_ORDER.filter((c) => habits.some((h) => h.category === c))
  // Drag state is shared across categories; onDrop passes its own category so a
  // habit can only land within the row it was lifted from.
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      {cats.map((category) => (
        <div key={category}>
          <p className="mb-1.5 text-micro tracking-wide text-fg-2 uppercase">{category}</p>
          <div className="space-y-1.5">
            {habits
              .filter((h) => h.category === category)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((h) => (
                <ActivityRow
                  key={h.id} habit={h} data={data} today={today}
                  onToggle={onToggle} onSetValue={onSetValue} onEdit={onEdit}
                  reorder={onReorder ? {
                    dragId, overId,
                    onDragStart: () => setDragId(h.id),
                    onDragEnd: () => { setDragId(null); setOverId(null) },
                    onDragOver: () => setOverId(h.id),
                    onDrop: () => { if (dragId) onReorder(category, dragId, h.id); setDragId(null); setOverId(null) },
                  } : undefined}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Drag-reorder wiring for a single activity row (omitted when read-only). */
type RowReorder = {
  dragId: string | null
  overId: string | null
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: () => void
  onDrop: () => void
}

const WEEKS = 16

function ActivityRow({
  habit: h, data, today, onToggle, onSetValue, onEdit, reorder,
}: {
  habit: Habit
  data: JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
  onEdit: (id: string) => void
  reorder?: RowReorder
}) {
  const type = h.type ?? 'check'
  const target = habitTarget(h)
  const avoid = !!h.avoid
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

  const dragging = reorder?.dragId === h.id
  const dropTarget = reorder && reorder.overId === h.id && reorder.dragId !== h.id
  return (
    <div
      className={`group flex items-center gap-3 rounded ${dropTarget ? 'outline-dashed outline-1 outline-mauve' : ''} ${dragging ? 'opacity-40' : ''}`}
      onDragOver={reorder ? (e) => { if (reorder.dragId) { e.preventDefault(); reorder.onDragOver() } } : undefined}
      onDrop={reorder ? (e) => { e.preventDefault(); reorder.onDrop() } : undefined}
    >
      <div className="flex w-32 shrink-0 items-center gap-1 truncate">
        {reorder && (
          <span
            draggable
            onDragStart={reorder.onDragStart}
            onDragEnd={reorder.onDragEnd}
            title="Drag to reorder"
            className="shrink-0 cursor-grab text-fg-2 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          ><Icon as={DotsSixVertical} size="sm" /></span>
        )}
        <span>{avoid ? <Icon as={Prohibit} size="sm" style={{ color: cat('red') }} /> : h.emoji ?? <span style={{ color: cat(h.color) }}>●</span>}</span>
        <button onClick={() => onEdit(h.id)} title={[avoid ? `${h.name} · habit to avoid` : h.name, 'tap for activity & stats'].join(' · ')} className={`truncate text-body hover:text-fg-1 hover:underline ${h.archived ? 'text-fg-2 line-through' : 'text-fg-1'}`}>{h.name}</button>
        <button onClick={() => onEdit(h.id)} aria-label={`View ${h.name} activity & stats`} title="View activity & stats" className="shrink-0 text-fg-2 hover:text-mauve"><Icon as={PersonSimpleRun} size="sm" /></button>
      </div>
      <span className="w-9 shrink-0 text-micro tabular-nums" style={{ color: streak > 0 ? (avoid ? cat('green') : cat('peach')) : cat('overlay0') }} title={avoid ? `${streak} days clean` : `${streak}-day streak`}>
        {streak > 0 ? <span className="inline-flex items-center gap-0.5">{avoid ? <Icon as={ShieldCheck} size="sm" /> : <Icon as={Flame} size="sm" />}{streak}</span> : '—'}
      </span>
      {h.weeklyGoal ? (
        <span className="w-10 shrink-0 text-micro tabular-nums" title={`${weekCount} of ${h.weeklyGoal} this week`} style={{ color: weekCount >= h.weeklyGoal ? cat('green') : cat('overlay1') }}>
          {weekCount}/{h.weeklyGoal}wk
        </span>
      ) : <span className="w-10 shrink-0" />}

      <div className="min-w-0 flex-1 overflow-x-auto">
        {/* Shares `DayGrid` with the Stats heatmap — same grid, ramp and cell
            shape, different data and interactivity. This row stays clickable;
            rating habits are logged with the control on the right, so their
            cells render but don't accept a click. */}
        <DayGrid
          days={Array.from({ length: days }, (_, i) => {
            const d = addDays(start, i)
            const outside = d > today || d < h.startedOn
            const level = habitIntensity(type, habitValueOn(data, h, d), target)
            const state = level ? (avoid ? ', slip' : ', done') : ''
            return {
              date: d,
              level,
              blank: outside,
              disabled: type === 'rating',
              title: `${d}${state}`,
              srLabel: `${h.name} ${d}${state}`,
            }
          })}
          pad={pad}
          color={avoid ? 'red' : h.color}
          size={10}
          gap={2}
          label={`${h.name} activity heatmap, last ${WEEKS} weeks`}
          onDayClick={logDay}
        />
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
            {/* Filled vs hollow was the old signal for "this star counts".
                Weight carries it now: duotone for the rated stars, regular for
                the rest — the same active/rest rule the whole icon system uses,
                instead of a per-site `fill`. */}
            <Icon as={Star} size="sm" active={n <= value} style={{ color: n <= value ? cat(h.color) : cat('surface2') }} />
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
        className="inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-label"
        style={{ borderColor: value > 0 ? accent : cat('surface1'), color: value > 0 ? cat('text') : cat('subtext0') }}
        title={`Tap to log${h.unit ? ' (' + h.unit + ')' : ''}`}
      >
        {value}/{target}{h.unit ? <span className="text-fg-2">{h.unit === 'min' ? 'm' : ''}</span> : null}
      </button>
    )
  }
  const on = value > 0
  return (
    <button
      onClick={() => onToggle(today, h.id)}
      aria-label={h.avoid ? (on ? 'Slipped today' : 'Clean today') : 'Toggle today'}
      title={h.avoid ? (on ? 'Slipped today' : 'Clean today') : undefined}
      className="inline-grid h-6 w-6 place-items-center rounded-pill border"
      style={{ borderColor: on ? accent : cat('surface1'), background: on ? accent : 'transparent' }}
    >
      {on && <span className="text-micro" style={{ color: onAccent(accent) }}>✓</span>}
    </button>
  )
}
