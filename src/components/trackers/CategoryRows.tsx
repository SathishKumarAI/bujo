/**
 * CATEGORY ROWS · the classic month grid, one collapsible category at a time.
 *
 * Owns the `<tr>`s: the sticky name cell, the day cells and what tapping one
 * writes, the partial/floor/met fill states, drag-to-reorder within a category,
 * and how a row chip is drawn.
 *
 * Owns none of the arithmetic. Streaks, consistency and cell fill come from
 * `lib/stats.ts` and `lib/habitStats.ts`; **whether** a chip appears and
 * **which** is `lib/habitRowChips.ts`, capped at two — this file only picks its
 * icon and colour. Adding a mark is a decision about priority and belongs
 * there, not here.
 *
 * Not the table, the header row or the day columns — `views/Trackers.tsx` owns
 * those, and decides the visible date range.
 */
import { DotsSixVertical, Flame, Prohibit, ShieldCheck } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { fromISODay } from '../../lib/date'
import { cat, onAccent } from '../../lib/colors'
import { habitConsistency, habitTarget, nextHabitValue } from '../../lib/stats'
import { goalTier } from '../../lib/streak'
import { milestoneEmoji } from '../../lib/milestones'
import { habitCellFill } from '../../lib/habitStats'
import { habitRowChips, type HabitChip } from '../../lib/habitRowChips'
import type { Habit, HabitCategory, JournalData } from '../../lib/types'

/**
 * One mark beside a habit's name. `habitRowChips` decides *whether* and *which*;
 * this decides only how it looks.
 *
 * Two colours between them, not five. The row used to carry peach, green,
 * teal, sapphire and a maroon wash at once, which is what "stats in six
 * different colours" looks like in practice: nothing is emphasised because
 * everything is. Peach marks a run of days, green marks progress toward a
 * target the user set, and that is the whole vocabulary.
 */
function RowChip({ chip: c }: { chip: HabitChip }) {
  const box = 'inline-flex shrink-0 items-center gap-0.5 text-micro'
  switch (c.kind) {
    case 'streak':
      return <span title={`${c.days}-day streak`} className={box} style={{ color: cat('peach') }}><Icon as={Flame} size="sm" />{c.days}</span>
    case 'clean':
      return <span title={`${c.days} ${c.days === 1 ? 'day' : 'days'} clean`} className={box} style={{ color: cat('green') }}><Icon as={ShieldCheck} size="sm" />{c.days}d clean</span>
    case 'weekly':
      return <span title={`${c.done} of ${c.goal} this week`} className={box} style={{ color: c.done >= c.goal ? cat('green') : cat('subtext0') }}>{c.done}/{c.goal}wk</span>
    case 'comeback':
      return <span title={`Back on track — ${c.days} days${c.count > 1 ? ` · ${c.count} comebacks` : ''}`} className={box} style={{ color: cat('green') }}>↺ {c.days}d</span>
    case 'milestone':
      return <span title={`${c.daysToGo} ${c.daysToGo === 1 ? 'day' : 'days'} to your ${c.day}-day milestone`} className={box} style={{ color: cat('peach') }}>{milestoneEmoji(c.day)}{c.day}d</span>
  }
}

// ── Category section of habit rows ───────────────────────────────────────────
export function CategoryRows({
  category, habits, days, today, cell, data, onToggle, onSetValue, onEdit, onReorder, collapsed, onToggleCollapse,
}: {
  category: string
  habits: Habit[]
  days: string[]
  today: string
  weekStart: 0 | 1
  cell: string
  data: JournalData
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
  onEdit: (id: string) => void
  onReorder: (category: HabitCategory, dragId: string, dropId: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  return (
    <>
      <tr>
        <td colSpan={days.length + 2} className="pt-3 pb-1">
          {/* No enter animation here: the body is table rows, which cannot be
              wrapped in an animating element without breaking the grid. */}
          <button onClick={onToggleCollapse} aria-expanded={!collapsed} className="text-micro tracking-wide text-fg-2 uppercase hover:text-fg-1">
            <span className="caret-turn caret-turn-quarter inline-block" data-open={!collapsed}>▸</span> {category} {collapsed && <span className="text-fg-2">({habits.length})</span>}
          </button>
        </td>
      </tr>
      {!collapsed && habits.map((h) => {
        const type = h.type ?? 'check'
        const numeric = type === 'count' || type === 'timer' || type === 'rating'
        const target = habitTarget(h)
        const avoid = !!h.avoid
        const slipColor = avoid ? cat('red') : cat(h.color)
        // What this row is allowed to say beside the name, and how much of it.
        // The cap and the priority live in `lib/habitRowChips.ts`; this file
        // only decides how each kind looks. See that module's header for why
        // the decision was moved out of here.
        const chips = habitRowChips(data, h, today)
        return (
          <tr
            key={h.id}
            className={`group ${overId === h.id && dragId !== h.id ? 'outline-dashed outline-1 outline-mauve' : ''} ${dragId === h.id ? 'opacity-40' : ''}`}
            onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverId(h.id) } }}
            onDrop={(e) => { e.preventDefault(); if (dragId) onReorder(category as HabitCategory, dragId, h.id); setDragId(null); setOverId(null) }}
          >
            <td className="sticky left-0 z-10 bg-ink-1 py-0.5 pr-2 text-left text-fg-1">
              {/* Cap the sticky name column so long habit names truncate instead
                  of widening the column and overlapping the day cells on mobile.
                  Every badge below is `shrink-0` and the name was the one
                  `min-w-0 truncate` child, so the name absorbed the entire
                  deficit: six badges on one habit rendered the row as "W." and
                  one as a bare bullet with no name at all. The name is capped
                  and un-shrinkable now, and the badges wrap under it — which is
                  the right way round, because the row is useless without the
                  one thing it is naming. */}
              {/* `pl-7` + `-ml-7` on the first child: the padding indents every
                  *wrapped* line to sit under the habit name, and the negative
                  margin cancels it for the first line so nothing moves for rows
                  whose badges already fit. Without it a wrapped badge started at
                  the cell's left edge — left of the name it belongs to — so
                  "2/7wk" under Sugar and "5d clean" under Vegetables read as
                  belonging to the *next* habit. Splitting the cell into two rows
                  would have fixed the alignment and made every row two lines
                  tall, which is a worse trade in a table this dense. */}
              <div className="flex max-w-[44vw] flex-wrap items-center gap-0.5 pl-7 sm:max-w-[260px]">
                <span
                  draggable
                  onDragStart={() => setDragId(h.id)}
                  onDragEnd={() => { setDragId(null); setOverId(null) }}
                  title="Drag to reorder"
                  className="-ml-7 shrink-0 cursor-grab text-fg-2 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
                ><Icon as={DotsSixVertical} size="sm" /></span>
                {avoid ? <Icon as={Prohibit} size="sm" className="shrink-0" style={{ color: cat('red') }} aria-label="avoid habit" />
                  : h.emoji ? <span className="shrink-0">{h.emoji}</span> : <span className="shrink-0" style={{ color: cat(h.color) }}>●</span>}
                {avoid && h.emoji && <span className="shrink-0">{h.emoji}</span>}
                <button onClick={() => onEdit(h.id)} aria-label={`${h.name} — activity & stats`} title={[avoid ? `${h.name} · habit to avoid` : h.name, h.cue, 'tap for activity & stats'].filter(Boolean).join(' · ')} className={`max-w-[10rem] shrink-0 truncate hover:text-fg-1 hover:underline ${h.archived ? 'text-fg-2 line-through' : ''}`}>{h.name}</button>
                {h.unit && <span className="shrink-0 text-fg-2">({h.unit})</span>}
                {chips.map((c) => <RowChip key={c.kind} chip={c} />)}
              </div>
            </td>
            {days.map((d) => {
              const future = d > today
              const before = d < h.startedOn
              const scheduled = !h.activeDays?.length || h.activeDays.includes(fromISODay(d).getDay())
              const disabled = future || before || !scheduled
              if (numeric) {
                const val = data.habitValues?.[d]?.[h.id] ?? 0
                // Met = solid full-strength fill; partial = ring with a proportional
                // inner fill so "hit the target" reads differently from "almost".
                const fill = habitCellFill(data, h, d)
                const met = fill.state === 'met'
                // #280: a count/timer day that clears the floor but not the
                // stretch target gets a distinct "met floor" look (a tinted,
                // outlined cell) — between a faint partial and a solid hit.
                const tier = (type === 'count' || type === 'timer') ? goalTier(val, h.floor, target) : (met ? 'target' : 'none')
                const atFloor = tier === 'floor'
                const partial = fill.state === 'partial' && !atFloor
                return (
                  <td key={d} className="p-0.5 text-center">
                    <button
                      disabled={disabled}
                      onClick={() => onSetValue(d, h.id, nextHabitValue(type, target, val))}
                      title={`${val}/${target}${h.floor ? ` (floor ${h.floor})` : ''}${met ? ' · stretch met' : atFloor ? ' · met floor' : partial ? ' · partial' : ''}`}
                      aria-label={`${h.name} ${d}: ${val} of ${target}${met ? ', stretch target met' : atFloor ? ', met floor' : partial ? ', partial' : ''}`}
                      className={`relative grid ${cell} place-items-center overflow-hidden rounded text-micro disabled:opacity-20`}
                      style={{ background: met ? slipColor : atFloor ? slipColor + '44' : 'transparent', border: `1px solid ${met || atFloor || partial ? slipColor : cat('surface1')}`, color: met ? onAccent(slipColor) : cat('subtext1') }}
                    >
                      {/* Partial: a bottom-up fill bar sized to the target ratio. */}
                      {partial && (
                        <span aria-hidden className="absolute inset-x-0 bottom-0" style={{ height: `${Math.round(fill.ratio * 100)}%`, background: slipColor, opacity: 0.4 }} />
                      )}
                      <span className="relative">{val > 0 ? val : ''}</span>
                    </button>
                  </td>
                )
              }
              const on = (data.habitLog[d] ?? []).includes(h.id)
              return (
                <td key={d} className="p-0.5 text-center">
                  <button
                    disabled={disabled}
                    onClick={() => onToggle(d, h.id)}
                    aria-label={avoid ? `${h.name} slip on ${d}` : `${h.name} on ${d}`}
                    title={avoid ? (on ? 'Slipped' : 'Clean') : undefined}
                    className={`grid ${cell} place-items-center rounded-none border disabled:opacity-20`}
                    style={{ borderColor: avoid && on ? cat('red') : cat('surface1'), background: on ? slipColor : 'transparent' }}
                  />
                </td>
              )
            })}
            <td className="px-1 text-center text-fg-2">{habitConsistency(data, h.id, h.startedOn)}</td>
          </tr>
        )
      })}
    </>
  )
}
