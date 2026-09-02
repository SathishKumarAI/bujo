import { Archive, Prohibit, Trash, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { addDays, fromISODay, prettyMonth, todayISO, WEEKDAYS } from '../../lib/date'
import { Input, StatTile, Textarea } from '../ui'
import { Button } from '../ui/button'
import { Stepper } from '../fields/Stepper'
import { TIME_SLOTS } from '../../lib/timeofday'
import { slotGlyph } from '../glyphs'
import { cat, HABIT_COLORS, onAccent } from '../../lib/colors'
import { habitConsistency, habitDoneOn, habitStreak, habitTarget } from '../../lib/stats'
import { longestStreakEver } from '../../lib/streak'
import { bestWeekday, monthlyHabitCompletion, perfectWeeks, valueSparkline, weeklyHeatRow } from '../../lib/habitStats'
import { dayIntensity, intensityOpacity } from '../../lib/habitIntensity'
import { HABIT_CATEGORIES as CATEGORIES, type Habit, type HabitCategory } from '../../lib/types'
import { useConfirm } from '../ConfirmDialog'
import { useFocusTrap } from '../../lib/useFocusTrap'

/**
 * HABIT EDITOR · every per-habit setting, in a modal, plus the stats that make
 * those settings make sense (a target is easier to pick next to the sparkline
 * it governs).
 *
 * Owns name, emoji, colour, category, type, target, floor, unit, weekly goal,
 * time of day, cue, scheduled days, today's note, skip/archive/delete.
 *
 * **Not the read-first panel.** Tapping a habit opens `HabitDetail.tsx`; its
 * "Edit" button hands off to this. Two panels on purpose: one to look at a
 * habit, one to change it.
 */
export function HabitEditor({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const confirm = useConfirm()
  // Hand-rolled sheet, so it traps Tab itself. The confirm dialog it opens
  // portals outside this node — the trap deliberately only guards Tab, so that
  // still works.
  const trap = useFocusTrap<HTMLDivElement>()
  const { updateHabit, removeHabit, toggleHabitSkip, setHabitNote, data } = useJournal()
  const set = (p: Partial<Habit>) => updateHabit(habit.id, p)
  // Reuse units already in use so trackers share consistent units (e.g. always
  // "min", not a mix of "min"/"minute"/"mins").
  const knownUnits = [...new Set(data.habits.map((h) => h.unit).filter((u): u is string => !!u))].sort()
  const [heatYear, setHeatYear] = useState(false)
  const today = todayISO()
  const streak = habitStreak(data, habit.id)
  const bestEver = longestStreakEver(data, habit, today)
  // #85: best/worst weekday by scheduled-day success rate (last 90d).
  const wd = bestWeekday(data, habit, today)
  const bestDow = wd.best != null ? WEEKDAYS[wd.best] : '—'
  const worstDow = wd.worst != null && wd.worst !== wd.best ? WEEKDAYS[wd.worst] : null
  // #322: fully-complete weeks (every scheduled day done) over the last 12.
  const perfectWk = habit.avoid ? 0 : perfectWeeks(data, habit, today)
  // Last-7-day intensity strip — a glanceable "how's this week going".
  const week = weeklyHeatRow(data, habit, today)
  // #407: per-habit trailing-12-month completion bars (seasonal momentum).
  const months = habit.avoid ? [] : monthlyHabitCompletion(data, habit, today, 12).filter((m) => m.scheduled > 0)
  // #399: last-14-day value sparkline for numeric habits.
  const numericType = habit.type === 'count' || habit.type === 'timer' || habit.type === 'rating'
  const spark = numericType ? valueSparkline(data, habit, today, 14) : []
  const skippedToday = (data.habitSkips?.[habit.id] ?? []).includes(today)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-crust/70 p-4 pt-[10vh]" onClick={onClose}>
      <div ref={trap} className="card-3d max-h-[80vh] w-full max-w-md overflow-y-auto rounded-none border border-line-strong bg-ink-1" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Edit ${habit.name}`}>
        <header className="sticky top-0 flex items-center justify-between border-b border-line bg-ink-1 px-4 py-3">
          <h3 className="font-display text-heading text-fg-1">{habit.emoji} {habit.name}</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close" className="text-fg-2 hover:text-fg-1"><Icon as={X} size="md" /></Button>
        </header>
        <div className="space-y-3 p-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="day streak" value={streak} />
            <StatTile label="best ever" value={bestEver} />
            <StatTile label="30-day" value={`${habitConsistency(data, habit.id, habit.startedOn, 30)}%`} />
          </div>
          <p className="text-label text-fg-2">
            Strongest on <span className="text-fg-1">{bestDow}</span>{worstDow && <> · weakest on <span className="text-fg-1">{worstDow}</span></>}. <Momentum data={data} habit={habit} today={today} />
            {!habit.avoid && perfectWk > 0 && <> · <span style={{ color: cat('green') }}>{perfectWk}</span> perfect {perfectWk === 1 ? 'week' : 'weeks'} (12)</>}
          </p>

          {/* Last-7-day intensity strip — this week at a glance. */}
          <div className="flex items-center gap-2">
            <span className="text-micro text-fg-2">This week</span>
            <div className="flex gap-1" role="img" aria-label="This week's completion, one cell per day">
              {week.map((c) => (
                <span
                  key={c.day}
                  title={`${c.day}${!c.scheduled ? ', off-schedule' : c.level === 4 ? ', done' : c.level > 0 ? ', partial' : ', missed'}`}
                  className={`h-4 w-4 rounded-[3px] ${c.day === today ? 'ring-1 ring-mauve' : ''}`}
                  style={{
                    background: !c.scheduled || c.level === 0 ? cat('surface0') : cat(habit.color),
                    opacity: c.scheduled && c.level > 0 ? intensityOpacity(c.level) : c.scheduled ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
          </div>

          {/* #399: last-14-day value sparkline for numeric habits. */}
          {numericType && spark.some((p) => p.value > 0) && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-micro text-fg-2">Last 14d</span>
              <div className="flex h-8 flex-1 items-end gap-0.5" role="img" aria-label="Sparkline of the last 14 days' logged values">
                {spark.map((p) => (
                  <span
                    key={p.day}
                    title={`${p.day}: ${p.value}${habit.unit ? ` ${habit.unit}` : ''}`}
                    className={`flex-1 rounded-sm ${p.day === today ? 'ring-1 ring-mauve' : ''}`}
                    style={{ height: `${Math.max(p.value > 0 ? 12 : 4, p.norm * 100)}%`, background: p.value > 0 ? cat(habit.color) : cat('surface0'), opacity: p.value > 0 ? 0.4 + p.norm * 0.6 : 1 }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* #407: per-habit monthly completion bars (trailing year). */}
          {!habit.avoid && months.length >= 2 && (
            <div>
              <p className="mb-1 text-label text-fg-2">Monthly completion (trailing year)</p>
              {/* `items-stretch`, not `items-end`: cross-axis `end` collapses
                  each column to its label, leaving the `flex-1` bar track at
                  0px and the chart flat. See `views/Insights.tsx`. */}
              <div className="flex items-stretch justify-between gap-1" style={{ height: 72 }} role="img" aria-label="Bar chart of monthly completion percentage over the trailing year">
                {months.map((m) => (
                  <div key={m.ym} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t"
                        title={`${m.ym}: ${m.done}/${m.scheduled} scheduled days, ${m.pct}%`}
                        style={{ height: `${Math.max(3, m.pct)}%`, background: m.pct >= 80 ? cat('green') : m.pct >= 50 ? cat('yellow') : cat('peach'), opacity: 0.55 + m.pct / 100 * 0.45 }}
                      />
                    </div>
                    <span className="text-micro text-fg-2">{prettyMonth(m.ym).slice(0, 1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion heatmap · 12 weeks or a full year */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-label text-fg-2">{heatYear ? 'Last 12 months' : 'Last 12 weeks'}</p>
              <Button variant="ghost" onClick={() => setHeatYear((v) => !v)} className="h-auto p-0 text-label text-mauve">{heatYear ? '12 weeks' : 'Full year'}</Button>
            </div>
            <HabitHeatmap data={data} habit={habit} today={today} weeks={heatYear ? 53 : 12} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-body text-fg-1">Name<Input value={habit.name} onChange={(e) => set({ name: e.target.value })} className="mt-1" /></label>
            <label className="block text-body text-fg-1">Emoji<Input value={habit.emoji ?? ''} onChange={(e) => set({ emoji: e.target.value || undefined })} placeholder="💧" className="mt-1" /></label>
          </div>
          <label className="flex items-center justify-between rounded-none border border-line bg-ink-0 px-3 py-2 text-body text-fg-1">
            <span className="inline-flex items-center gap-1.5"><Icon as={Prohibit} size="sm" style={{ color: cat('red') }} /> Habit to avoid <span className="text-fg-2">(quit · a logged day counts as a slip)</span></span>
            <input type="checkbox" checked={!!habit.avoid} onChange={(e) => set({ avoid: e.target.checked || undefined })} className="accent-red" aria-label="Habit to avoid" />
          </label>
          <label className="block text-body text-fg-1">Weekly goal <span className="text-fg-2">(times/week, optional)</span><div className="mt-1"><Stepper value={habit.weeklyGoal ?? undefined} onChange={(v) => set({ weeklyGoal: v })} step={1} min={0} aria-label="Weekly goal" /></div></label>

          <div>
            <p className="mb-1 text-body text-fg-1">Color</p>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_COLORS.map((c) => (
                <button key={c} onClick={() => set({ color: c })} aria-label={c} className="h-6 w-6 rounded-none" style={{ background: cat(c), outline: habit.color === c ? `2px solid ${cat('text')}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-body text-fg-1">Category</span>
            {/* The span beside it is a span, not a <label>, so it names nothing.
                Same defect as the new-habit select in Trackers.tsx; this one is
                behind an edit mode the a11y gate does not enter, so it is fixed
                by inspection rather than by a red run. */}
            <select value={habit.category} onChange={(e) => set({ category: e.target.value as HabitCategory })} aria-label="Category" className="rounded-none border border-line-strong bg-ink-0 px-2 py-1.5 text-body text-fg-1">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-body text-fg-1">Type</span>
            <div className="flex flex-wrap justify-end gap-1.5">
              <Button variant={(habit.type ?? 'check') === 'check' ? 'secondary' : 'ghost'} className="press-3d" onClick={() => set({ type: 'check' })}>Yes / no</Button>
              <Button variant={habit.type === 'count' ? 'secondary' : 'ghost'} className="press-3d" onClick={() => set({ type: 'count' })}>Count</Button>
              <Button variant={habit.type === 'timer' ? 'secondary' : 'ghost'} className="press-3d" onClick={() => set({ type: 'timer', unit: habit.unit ?? 'min' })}>Timer</Button>
              <Button variant={habit.type === 'rating' ? 'secondary' : 'ghost'} className="press-3d" onClick={() => set({ type: 'rating' })}>Rating</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-body text-fg-1">Time of day</span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {TIME_SLOTS.map((s) => (
                <Button key={s.id} variant={(habit.timeOfDay ?? 'anytime') === s.id ? 'secondary' : 'ghost'} className="press-3d" onClick={() => set({ timeOfDay: s.id })}><Icon as={slotGlyph(s.id)} size="sm" /> {s.label}</Button>
              ))}
            </div>
          </div>

          <label className="block text-body text-fg-1">Cue <span className="text-fg-2">(habit stacking · after what?)</span>
            <Input value={habit.cue ?? ''} onChange={(e) => set({ cue: e.target.value || undefined })} placeholder="e.g. After morning coffee" className="mt-1" />
          </label>

          <label className="block text-body text-fg-1">Today’s note
            <Textarea value={data.habitNotes?.[today]?.[habit.id] ?? ''} onChange={(e) => setHabitNote(today, habit.id, e.target.value)} placeholder="How did it go today?" rows={2} className="mt-1" />
          </label>

          {(() => {
            const recent = Object.entries(data.habitNotes ?? {})
              .map(([day, m]) => ({ day, text: m[habit.id] }))
              .filter((x) => x.text && x.day !== today)
              .sort((a, b) => (a.day < b.day ? 1 : -1))
              .slice(0, 6)
            if (!recent.length) return null
            return (
              <div>
                <p className="mb-1 text-body text-fg-2">Recent notes</p>
                <ul className="space-y-1">
                  {recent.map((n) => (
                    <li key={n.day} className="rounded-none border border-line bg-ink-0 px-2.5 py-1.5 text-label">
                      <span className="text-fg-2">{n.day}</span> · <span className="text-fg-1">{n.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })()}

          {(habit.type === 'count' || habit.type === 'timer') && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-body text-fg-1">Daily target <span className="text-fg-2">(stretch)</span><div className="mt-1"><Stepper value={habit.target ?? undefined} onChange={(v) => set({ target: v })} step={habit.type === 'timer' ? 5 : 1} min={0} aria-label="Daily target" /></div></label>
                <label className="block text-body text-fg-1">Unit<Input value={habit.unit ?? ''} onChange={(e) => set({ unit: e.target.value || undefined })} placeholder={habit.type === 'timer' ? 'min' : 'glasses'} list="habit-units" className="mt-1" /><datalist id="habit-units">{knownUnits.map((u) => <option key={u} value={u} />)}</datalist></label>
              </div>
              {/* #280: optional floor — a minimum "showed up" threshold below the
                  stretch target. A day that clears it but not the target reads as
                  a partial win on the grid. */}
              <label className="block text-body text-fg-1">Floor <span className="text-fg-2">(min “showed up”, optional · below the target)</span>
                <div className="mt-1"><Stepper value={habit.floor ?? undefined} onChange={(v) => set({ floor: v && v > 0 ? v : undefined })} step={habit.type === 'timer' ? 5 : 1} min={0} aria-label="Floor threshold" /></div>
                {habit.floor != null && habit.floor >= habitTarget(habit) && (
                  <span className="mt-1 block text-caption" style={{ color: cat('peach') }}>Floor should be below the target ({habitTarget(habit)}) to show a “met floor” state.</span>
                )}
              </label>
            </>
          )}
          {habit.type === 'rating' && (
            <p className="text-label text-fg-2">Logs a 1–5 rating per day (tap the stars in the activity view or today strip).</p>
          )}

          <div>
            <p className="mb-1 text-body text-fg-1">Scheduled days <span className="text-fg-2">(none = every day)</span></p>
            <div className="flex gap-1">
              {WEEKDAYS.map((w, i) => {
                const on = habit.activeDays?.includes(i)
                return (
                  <button key={w} onClick={() => { const cur = habit.activeDays ?? []; set({ activeDays: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] }) }} className="rounded px-2 py-1 text-label" style={{ background: on ? cat(habit.color) : cat('surface0'), color: on ? onAccent(cat(habit.color)) : cat('subtext0') }}>{w}</button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            <Button variant="secondary" onClick={() => toggleHabitSkip(habit.id, today)} className="press-3d inline-flex items-center gap-1.5 rounded-none" title="A planned skip won't break your streak">
              {skippedToday ? 'Un-skip today' : 'Skip today'}
            </Button>
            <Button variant="secondary" onClick={() => set({ archived: !habit.archived })} className="press-3d inline-flex items-center gap-1.5 rounded-none"><Icon as={Archive} size="sm" /> {habit.archived ? 'Unarchive' : 'Archive'}</Button>
            <Button variant="ghost" onClick={async () => { if (await confirm({
              title: `Delete “${habit.name}”?`,
              description: 'The habit and its entire tracked history are deleted. This cannot be undone.',
              confirmLabel: 'Delete habit', destructive: true,
            })) { removeHabit(habit.id); onClose() } }} className="press-3d inline-flex items-center gap-1.5 rounded-none text-red hover:text-red"><Icon as={Trash} size="sm" /> Delete</Button>
            <Button variant="secondary" onClick={onClose} className="press-3d ml-auto">Done</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Habit visualisation helpers (v3) ─────────────────────────────────────────
type JData = import('../../lib/types').JournalData

/** This-week vs last-week trend arrow. */
function Momentum({ data, habit, today }: { data: JData; habit: Habit; today: string }) {
  const week = (end: string) => Array.from({ length: 7 }, (_, i) => addDays(end, -i)).filter((d) => habitDoneOn(data, habit, d)).length
  const now = week(today)
  const prev = week(addDays(today, -7))
  if (now === prev) return <span className="text-fg-2">→ steady</span>
  const up = now > prev
  return <span style={{ color: cat(up ? 'green' : 'red') }}>{up ? '↑ improving' : '↓ slipping'} ({now} vs {prev})</span>
}

/** GitHub-style weekday-aligned completion heatmap (12 weeks or a full year). */
function HabitHeatmap({ data, habit, today, weeks = 12 }: { data: JData; habit: Habit; today: string; weeks?: number }) {
  const days = weeks * 7
  const start = addDays(today, -(days - 1))
  const pad = fromISODay(start).getDay() // empty cells before the first day
  const cell = weeks > 20 ? 'h-2 w-2' : 'h-3 w-3'
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-flow-col grid-rows-7 gap-0.5">
        {Array.from({ length: pad }).map((_, i) => <span key={`p${i}`} className={cell} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = addDays(start, i)
          const future = d > today
          // Shade by 0–4 intensity so partial count/timer/rating days show graded
          // colour, not just full/empty. Level 0 = the empty surface tone.
          const level = future ? 0 : dayIntensity(data, habit, d)
          const op = intensityOpacity(level)
          return (
            <span
              key={d}
              title={`${d}${level === 4 ? ', done' : level > 0 ? ', partial' : ''}`}
              className={`${cell} rounded-[2px]`}
              style={{ background: future ? 'transparent' : level === 0 ? cat('surface0') : cat(habit.color), opacity: level === 0 ? 1 : op }}
            />
          )
        })}
      </div>
    </div>
  )
}
