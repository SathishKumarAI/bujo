import { useState } from 'react'
import { Flame, X, Settings2, Plus, Archive, Trash2, LayoutGrid, CircleDot } from 'lucide-react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useJournal } from '../store'
import { fromISODay, monthDays, prettyMonth, todayISO, weekColumn, WEEKDAYS } from '../lib/date'
import { Button, Card, Empty, Input } from '../components/ui'
import { Page, useCursor } from '../components/shell/Page'
import { cat, HABIT_COLORS } from '../lib/colors'
import { habitConsistency, habitStreak, weeklyHabitCount, habitDayOfWeekBreakdown } from '../lib/stats'
import { rollingAverage } from '../lib/correlations'
import { RadialTracker } from '../components/RadialTracker'
import type { Habit, HabitCategory } from '../lib/types'

const CATEGORIES: HabitCategory[] = ['stimulant', 'food', 'movement', 'wellness', 'custom']

/** One-click habit presets (sensible defaults). */
const HABIT_PRESETS: { name: string; emoji: string; category: HabitCategory; color: string; type?: 'count'; target?: number; unit?: string; weeklyGoal?: number }[] = [
  { name: 'Water', emoji: '💧', category: 'food', color: 'sky', type: 'count', target: 8, unit: 'glasses' },
  { name: 'Exercise', emoji: '🏃', category: 'movement', color: 'green', weeklyGoal: 4 },
  { name: 'Read', emoji: '📚', category: 'wellness', color: 'peach', weeklyGoal: 7 },
  { name: 'Meditate', emoji: '🧘', category: 'wellness', color: 'lavender', weeklyGoal: 7 },
  { name: 'Sleep 8h', emoji: '😴', category: 'wellness', color: 'blue', weeklyGoal: 7 },
]

export function Trackers() {
  const { data, toggleHabit, setHabitValue, addHabit, setSettings } = useJournal()
  const { month: ym } = useCursor()
  const [newHabit, setNewHabit] = useState('')
  const [cat0, setCat0] = useState<HabitCategory>('custom')
  const [editing, setEditing] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [radial, setRadial] = useState(typeof window !== 'undefined' && window.location.search.includes('wheel'))
  const today = todayISO()

  const s = data.settings
  const compact = s.trackerDensity === 'compact'
  const cell = compact ? 'h-3 w-3' : 'h-4 w-4'
  const weekStart = s.weekStart ?? 0
  let days = monthDays(ym)
  if (s.trackerHideWeekends) days = days.filter((d) => { const c = weekColumn(d, weekStart); return weekStart === 1 ? c < 5 : c > 0 && c < 6 })

  const visibleHabits = data.habits.filter((h) => s.trackerShowArchived || !h.archived)

  // Chart with rolling averages.
  const allDays = monthDays(ym)
  const moodAvg = rollingAverage(allDays.map((d) => data.metrics.find((x) => x.date === d)?.mood))
  const stressAvg = rollingAverage(allDays.map((d) => data.metrics.find((x) => x.date === d)?.stress))
  const sleepAvg = rollingAverage(allDays.map((d) => data.metrics.find((x) => x.date === d)?.sleep))
  const chartData = allDays.map((d, i) => {
    const m = data.metrics.find((x) => x.date === d)
    return { day: Number(d.slice(8)), mood: m?.mood, stress: m?.stress, sleep: m?.sleep, moodAvg: moodAvg[i], stressAvg: stressAvg[i], sleepAvg: sleepAvg[i] }
  })

  function add() {
    if (!newHabit.trim()) return
    addHabit({ name: newHabit.trim(), category: cat0, color: HABIT_COLORS[data.habits.length % HABIT_COLORS.length] })
    setNewHabit('')
  }

  return (
    <Page>
      <Card
        title="Habit & intake tracker"
        subtitle={`${prettyMonth(ym)} · tap a cell to mark the day`}
        right={
          <div className="flex gap-1">
            <Button onClick={() => setRadial((v) => !v)} aria-label="Toggle wheel view" title={radial ? 'Grid view' : 'Wheel view'}>{radial ? <LayoutGrid size={15} /> : <CircleDot size={15} />}</Button>
            <Button onClick={() => setShowSettings((v) => !v)} aria-label="Tracker settings" title="Tracker settings"><Settings2 size={15} /></Button>
          </div>
        }
      >
        <TodayStrip habits={visibleHabits} data={data} today={today} onToggle={toggleHabit} onSetValue={setHabitValue} />
        {showSettings && (
          <div className="mb-3 flex flex-wrap gap-4 rounded-lg border border-surface0 bg-base p-3 text-sm">
            <Seg label="Density" options={[['comfortable', 'Comfortable'], ['compact', 'Compact']]} value={s.trackerDensity ?? 'comfortable'} onChange={(v) => setSettings({ trackerDensity: v as 'comfortable' | 'compact' })} />
            <Check label="Hide weekends" on={!!s.trackerHideWeekends} onClick={() => setSettings({ trackerHideWeekends: !s.trackerHideWeekends })} />
            <Check label="Show archived" on={!!s.trackerShowArchived} onClick={() => setSettings({ trackerShowArchived: !s.trackerShowArchived })} />
          </div>
        )}

        {visibleHabits.length === 0 ? (
          <Empty>No habits yet — add one below.</Empty>
        ) : radial ? (
          <RadialTracker
            habits={visibleHabits}
            habitLog={data.habitLog}
            habitValues={data.habitValues}
            days={monthDays(ym)}
            today={today}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-mantle p-1 text-left font-normal text-overlay0">Habit</th>
                  {days.map((d) => (
                    <th key={d} className={`p-0.5 text-center font-normal ${d === today ? 'text-mauve' : 'text-overlay0'}`}>{Number(d.slice(8))}</th>
                  ))}
                  <th className="p-1 pr-2 text-overlay0">%</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.filter((c) => visibleHabits.some((h) => h.category === c)).map((category) => (
                  <CategoryRows
                    key={category}
                    category={category}
                    habits={visibleHabits.filter((h) => h.category === category).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
                    days={days}
                    today={today}
                    weekStart={weekStart}
                    cell={cell}
                    data={data}
                    onToggle={toggleHabit}
                    onSetValue={setHabitValue}
                    onEdit={setEditing}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 border-t border-surface0 pt-3">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-overlay0">Quick add:</span>
            {HABIT_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => addHabit({ name: p.name, emoji: p.emoji, category: p.category, color: p.color, type: p.type, target: p.target, unit: p.unit, weeklyGoal: p.weeklyGoal })}
                className="rounded-full border border-surface1 bg-base px-2.5 py-1 text-xs text-subtext1 hover:border-mauve hover:text-text"
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="New habit / food / stimulant…" className="max-w-xs" />
            <select value={cat0} onChange={(e) => setCat0(e.target.value as HabitCategory)} className="rounded-lg border border-surface1 bg-base px-2 py-2 text-sm text-text">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button variant="primary" onClick={add} className="inline-flex items-center gap-1.5"><Plus size={14} /> Add habit</Button>
          </div>
        </div>
      </Card>

      <Card title="Mood · Stress · Sleep" subtitle={`${prettyMonth(ym)} — faint = daily · bold = 7-day avg`}>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke={cat('overlay0')} fontSize={11} />
              <YAxis domain={[0, 10]} stroke={cat('overlay0')} fontSize={11} />
              <Tooltip contentStyle={{ background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }} />
              <Line type="monotone" dataKey="mood" stroke={cat('green')} dot={false} connectNulls strokeWidth={2} opacity={0.35} />
              <Line type="monotone" dataKey="stress" stroke={cat('red')} dot={false} connectNulls strokeWidth={2} opacity={0.35} />
              <Line type="monotone" dataKey="sleep" stroke={cat('blue')} dot={false} connectNulls strokeWidth={2} opacity={0.35} />
              <Line type="monotone" dataKey="moodAvg" stroke={cat('green')} dot={false} connectNulls strokeWidth={2.5} />
              <Line type="monotone" dataKey="stressAvg" stroke={cat('red')} dot={false} connectNulls strokeWidth={2.5} />
              <Line type="monotone" dataKey="sleepAvg" stroke={cat('blue')} dot={false} connectNulls strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {editing && <HabitEditor habit={data.habits.find((h) => h.id === editing)!} onClose={() => setEditing(null)} />}
    </Page>
  )
}

// ── Settings popover helpers ─────────────────────────────────────────────────
function Seg({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs text-overlay0">{label}</p>
      <div className="flex gap-1">
        {options.map(([v, l]) => (
          <button key={v} onClick={() => onChange(v)} className="rounded px-2 py-1 text-xs" style={{ background: value === v ? cat('mauve') : cat('surface0'), color: value === v ? cat('crust') : cat('subtext1') }}>{l}</button>
        ))}
      </div>
    </div>
  )
}
function Check({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-end gap-2 text-sm text-subtext1">
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-mauve' : 'bg-surface1'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-crust transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

// ── Today focus strip: quick daily check-in chips ────────────────────────────
function TodayStrip({
  habits, data, today, onToggle, onSetValue,
}: {
  habits: Habit[]
  data: import('../lib/types').JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
}) {
  const todays = habits.filter((h) => !h.activeDays?.length || h.activeDays.includes(fromISODay(today).getDay()))
  if (todays.length === 0) return null
  const done = todays.filter((h) =>
    h.type === 'count' ? (data.habitValues?.[today]?.[h.id] ?? 0) >= (h.target && h.target > 0 ? h.target : 1) : (data.habitLog[today] ?? []).includes(h.id),
  ).length

  return (
    <div className="mb-4 rounded-xl border border-surface0 bg-base p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-subtext1">Today</span>
        <span className="text-xs text-overlay0">{done}/{todays.length} done</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {todays.map((h) => {
          const isCount = h.type === 'count'
          const target = h.target && h.target > 0 ? h.target : 1
          const val = data.habitValues?.[today]?.[h.id] ?? 0
          const on = isCount ? val >= target : (data.habitLog[today] ?? []).includes(h.id)
          return (
            <button
              key={h.id}
              onClick={() => (isCount ? onSetValue(today, h.id, val >= target ? 0 : val + 1) : onToggle(today, h.id))}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors"
              style={{
                borderColor: on ? cat(h.color) : cat('surface1'),
                background: on ? cat(h.color) + '22' : 'transparent',
                color: on ? cat('text') : cat('subtext0'),
              }}
            >
              <span>{h.emoji ?? '●'}</span>
              {h.name}
              {isCount && <span className="text-overlay0">{val}/{target}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Category section of habit rows ───────────────────────────────────────────
function CategoryRows({
  category, habits, days, today, cell, data, onToggle, onSetValue, onEdit,
}: {
  category: string
  habits: Habit[]
  days: string[]
  today: string
  weekStart: 0 | 1
  cell: string
  data: import('../lib/types').JournalData
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
  onEdit: (id: string) => void
}) {
  return (
    <>
      <tr><td colSpan={days.length + 2} className="pt-3 pb-1 text-[10px] tracking-wide text-overlay0 uppercase">{category}</td></tr>
      {habits.map((h) => {
        const isCount = h.type === 'count'
        const target = h.target && h.target > 0 ? h.target : 1
        return (
          <tr key={h.id} className="group">
            <td className="sticky left-0 z-10 bg-mantle py-0.5 pr-2 text-left whitespace-nowrap text-subtext1">
              {h.emoji ? <span className="mr-0.5">{h.emoji}</span> : <span style={{ color: cat(h.color) }}>●</span>}{' '}
              <button onClick={() => onEdit(h.id)} className={`hover:text-text hover:underline ${h.archived ? 'text-overlay0 line-through' : ''}`}>{h.name}</button>
              {h.unit && <span className="ml-1 text-overlay0">({h.unit})</span>}
              {habitStreak(data, h.id) > 1 && (
                <span title={`${habitStreak(data, h.id)}-day streak`} className="ml-1 inline-flex items-center gap-0.5 align-middle text-[10px]" style={{ color: cat('peach') }}><Flame size={11} />{habitStreak(data, h.id)}</span>
              )}
              {h.weeklyGoal ? (
                <span title={`${weeklyHabitCount(data, h.id, today)} of ${h.weeklyGoal} this week`} className="ml-1.5 align-middle text-[10px]" style={{ color: weeklyHabitCount(data, h.id, today) >= h.weeklyGoal ? cat('green') : cat('overlay1') }}>
                  {weeklyHabitCount(data, h.id, today)}/{h.weeklyGoal}wk
                </span>
              ) : null}
            </td>
            {days.map((d) => {
              const future = d > today
              const before = d < h.startedOn
              const scheduled = !h.activeDays?.length || h.activeDays.includes(fromISODay(d).getDay())
              const disabled = future || before || !scheduled
              if (isCount) {
                const val = data.habitValues?.[d]?.[h.id] ?? 0
                return (
                  <td key={d} className="p-0.5 text-center">
                    <button
                      disabled={disabled}
                      onClick={() => onSetValue(d, h.id, val >= target ? 0 : val + 1)}
                      title={`${val}/${target}`}
                      aria-label={`${h.name} ${d}: ${val} of ${target}`}
                      className={`grid ${cell} place-items-center rounded text-[8px] disabled:opacity-20`}
                      style={{ background: val > 0 ? cat(h.color) : 'transparent', border: `1px solid ${cat('surface1')}`, opacity: val > 0 ? Math.max(0.35, val / target) : 1, color: cat('crust') }}
                    >{val > 0 ? val : ''}</button>
                  </td>
                )
              }
              const on = (data.habitLog[d] ?? []).includes(h.id)
              return (
                <td key={d} className="p-0.5 text-center">
                  <button
                    disabled={disabled}
                    onClick={() => onToggle(d, h.id)}
                    aria-label={`${h.name} on ${d}`}
                    className={`grid ${cell} place-items-center rounded-full border disabled:opacity-20`}
                    style={{ borderColor: cat('surface1'), background: on ? cat(h.color) : 'transparent' }}
                  />
                </td>
              )
            })}
            <td className="px-1 text-center text-overlay0">{habitConsistency(data, h.id, h.startedOn)}</td>
          </tr>
        )
      })}
    </>
  )
}

// ── Per-habit customisation modal ────────────────────────────────────────────
function HabitEditor({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const { updateHabit, removeHabit, toggleHabitSkip, data } = useJournal()
  const set = (p: Partial<Habit>) => updateHabit(habit.id, p)
  const today = todayISO()
  const streak = habitStreak(data, habit.id)
  const dow = habitDayOfWeekBreakdown(data, habit.id)
  const bestDow = dow.some((n) => n > 0) ? WEEKDAYS[dow.indexOf(Math.max(...dow))] : '—'
  const skippedToday = (data.habitSkips?.[habit.id] ?? []).includes(today)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-crust/70 p-4 pt-[10vh]" onClick={onClose}>
      <div className="card-3d max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-surface1 bg-mantle" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Edit ${habit.name}`}>
        <header className="sticky top-0 flex items-center justify-between border-b border-surface0 bg-mantle px-4 py-3">
          <h3 className="font-display text-lg text-text">{habit.emoji} {habit.name}</h3>
          <button onClick={onClose} aria-label="Close" className="text-overlay0 hover:text-text"><X size={18} /></button>
        </header>
        <div className="space-y-3 p-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-surface0 bg-base py-2"><div className="text-lg font-bold" style={{ color: cat('peach') }}>{streak}</div><div className="text-[10px] text-overlay0">day streak</div></div>
            <div className="rounded-lg border border-surface0 bg-base py-2"><div className="text-lg font-bold" style={{ color: cat('green') }}>{habitConsistency(data, habit.id, habit.startedOn, 30)}%</div><div className="text-[10px] text-overlay0">30-day</div></div>
            <div className="rounded-lg border border-surface0 bg-base py-2"><div className="text-lg font-bold" style={{ color: cat('blue') }}>{habitConsistency(data, habit.id, habit.startedOn, 90)}%</div><div className="text-[10px] text-overlay0">90-day</div></div>
          </div>
          <p className="text-xs text-overlay0">Most consistent on <span className="text-subtext1">{bestDow}</span>.</p>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm text-subtext1">Name<Input value={habit.name} onChange={(e) => set({ name: e.target.value })} className="mt-1" /></label>
            <label className="block text-sm text-subtext1">Emoji<Input value={habit.emoji ?? ''} onChange={(e) => set({ emoji: e.target.value || undefined })} placeholder="💧" className="mt-1" /></label>
          </div>
          <label className="block text-sm text-subtext1">Weekly goal <span className="text-overlay0">(times/week, optional)</span><Input type="number" value={habit.weeklyGoal ?? ''} onChange={(e) => set({ weeklyGoal: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g. 4" className="mt-1" /></label>

          <div>
            <p className="mb-1 text-sm text-subtext1">Color</p>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_COLORS.map((c) => (
                <button key={c} onClick={() => set({ color: c })} aria-label={c} className="h-6 w-6 rounded-full" style={{ background: cat(c), outline: habit.color === c ? `2px solid ${cat('text')}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-subtext1">Category</span>
            <select value={habit.category} onChange={(e) => set({ category: e.target.value as HabitCategory })} className="rounded-lg border border-surface1 bg-base px-2 py-1.5 text-sm text-text">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-subtext1">Type</span>
            <div className="flex gap-2">
              <Button variant={(habit.type ?? 'check') === 'check' ? 'primary' : 'ghost'} onClick={() => set({ type: 'check' })}>Yes / no</Button>
              <Button variant={habit.type === 'count' ? 'primary' : 'ghost'} onClick={() => set({ type: 'count' })}>Count</Button>
            </div>
          </div>

          {habit.type === 'count' && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm text-subtext1">Daily target<Input type="number" value={habit.target ?? ''} onChange={(e) => set({ target: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g. 8" className="mt-1" /></label>
              <label className="block text-sm text-subtext1">Unit<Input value={habit.unit ?? ''} onChange={(e) => set({ unit: e.target.value || undefined })} placeholder="glasses" className="mt-1" /></label>
            </div>
          )}

          <div>
            <p className="mb-1 text-sm text-subtext1">Scheduled days <span className="text-overlay0">(none = every day)</span></p>
            <div className="flex gap-1">
              {WEEKDAYS.map((w, i) => {
                const on = habit.activeDays?.includes(i)
                return (
                  <button key={w} onClick={() => { const cur = habit.activeDays ?? []; set({ activeDays: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] }) }} className="rounded px-2 py-1 text-xs" style={{ background: on ? cat(habit.color) : cat('surface0'), color: on ? cat('crust') : cat('subtext0') }}>{w}</button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-surface0 pt-3">
            <Button onClick={() => toggleHabitSkip(habit.id, today)} className="inline-flex items-center gap-1.5" title="A planned skip won't break your streak">
              {skippedToday ? 'Un-skip today' : 'Skip today'}
            </Button>
            <Button onClick={() => set({ archived: !habit.archived })} className="inline-flex items-center gap-1.5"><Archive size={14} /> {habit.archived ? 'Unarchive' : 'Archive'}</Button>
            <Button variant="danger" onClick={() => { if (confirm(`Delete "${habit.name}" and its history?`)) { removeHabit(habit.id); onClose() } }} className="inline-flex items-center gap-1.5"><Trash2 size={14} /> Delete</Button>
            <Button variant="primary" onClick={onClose} className="ml-auto">Done</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
