import { useState } from 'react'
import { Flame, X, Settings2, Plus, Archive, Trash2, LayoutGrid, CircleDot, GripVertical, Activity, Ban, ShieldCheck, Clock, StickyNote } from 'lucide-react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { useJournal } from '../store'
import { addDays, fromISODay, monthDays, prettyMonth, todayISO, weekColumn, WEEKDAYS } from '../lib/date'
import { Button, Card, Empty, Input, Segmented, StatTile, Textarea } from '../components/ui'
import { Page, useCursor } from '../components/shell/Page'
import { SmartInput } from '../components/SmartInput'
import { Stepper } from '../components/fields/Stepper'
import { TIME_SLOTS, orderedSlots, slotMeta, currentSlot } from '../lib/timeofday'
import { cat, HABIT_COLORS } from '../lib/colors'
import { habitConsistency, habitStreak, cleanStreak, weeklyHabitCount, habitDayOfWeekBreakdown, dayCompletion, weekdayConsistency, monthlyCompletion, habitDoneOn, habitTarget, habitValueOn, nextHabitValue } from '../lib/stats'
import { rollingAverage } from '../lib/correlations'
import { RadialTracker } from '../components/RadialTracker'
import type { Habit, HabitCategory, HabitType } from '../lib/types'
import { ActivityLayout } from '../components/ActivityLayout'

const CATEGORIES: HabitCategory[] = ['stimulant', 'food', 'movement', 'wellness', 'custom']

/** One-click habit presets (sensible defaults). */
const HABIT_PRESETS: { name: string; emoji: string; category: HabitCategory; color: string; type?: HabitType; target?: number; unit?: string; weeklyGoal?: number; avoid?: boolean }[] = [
  { name: 'Water', emoji: '💧', category: 'food', color: 'sky', type: 'count', target: 8, unit: 'glasses' },
  { name: 'Exercise', emoji: '🏃', category: 'movement', color: 'green', weeklyGoal: 4 },
  { name: 'Read', emoji: '📚', category: 'wellness', color: 'peach', weeklyGoal: 7 },
  { name: 'Meditate', emoji: '🧘', category: 'wellness', color: 'lavender', weeklyGoal: 7 },
  { name: 'Sleep 8h', emoji: '😴', category: 'wellness', color: 'blue', weeklyGoal: 7 },
  // ── new types: timer (minutes) + rating (1–5) ──
  { name: 'Run', emoji: '🏃', category: 'movement', color: 'green', type: 'timer', target: 30, unit: 'min' },
  { name: 'Stretch', emoji: '🤸', category: 'movement', color: 'teal', type: 'timer', target: 10, unit: 'min' },
  { name: 'Focus', emoji: '🎯', category: 'wellness', color: 'mauve', type: 'timer', target: 90, unit: 'min' },
  { name: 'Mood', emoji: '😊', category: 'wellness', color: 'yellow', type: 'rating' },
  { name: 'Energy', emoji: '⚡', category: 'wellness', color: 'peach', type: 'rating' },
  { name: 'Steps', emoji: '👟', category: 'movement', color: 'sapphire', type: 'count', target: 10000, unit: 'steps' },
  { name: 'Coffee', emoji: '☕', category: 'stimulant', color: 'rosewater', type: 'count', target: 2, unit: 'cups' },
  { name: 'Vitamins', emoji: '💊', category: 'food', color: 'flamingo' },
  { name: 'Journal', emoji: '✍️', category: 'wellness', color: 'lavender' },
  // ── habits to avoid / quit (logging a day = a slip) ──
  { name: 'No sugar', emoji: '🍬', category: 'food', color: 'red', avoid: true },
  { name: 'Alcohol-free', emoji: '🍺', category: 'stimulant', color: 'red', avoid: true },
  { name: 'Smoke-free', emoji: '🚬', category: 'stimulant', color: 'red', avoid: true },
  { name: 'No doomscroll', emoji: '📱', category: 'wellness', color: 'red', avoid: true },
]

export function Trackers() {
  const { data, toggleHabit, setHabitValue, addHabit, setSettings, updateHabit } = useJournal()

  /** Drag-reorder within a category: rewrite `order` to the new sequence. */
  function reorderHabits(category: HabitCategory, dragId: string, dropId: string) {
    if (dragId === dropId) return
    const list = data.habits.filter((h) => h.category === category).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const from = list.findIndex((h) => h.id === dragId)
    const to = list.findIndex((h) => h.id === dropId)
    if (from < 0 || to < 0) return
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved)
    list.forEach((h, i) => { if ((h.order ?? 0) !== i) updateHabit(h.id, { order: i }) })
  }
  const { month: ym } = useCursor()
  const [newHabit, setNewHabit] = useState('')
  const [cat0, setCat0] = useState<HabitCategory>('custom')
  const [editing, setEditing] = useState<string | null>(null)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [radial, setRadial] = useState(typeof window !== 'undefined' && window.location.search.includes('wheel'))
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month')
  const layout = data.settings.trackerLayout ?? 'classic'
  const today = todayISO()

  const s = data.settings
  const compact = s.trackerDensity === 'compact'
  const cell = compact ? 'h-3 w-3' : 'h-4 w-4'
  const weekStart = s.weekStart ?? 0
  let days = monthDays(ym)
  if (s.trackerHideWeekends) days = days.filter((d) => { const c = weekColumn(d, weekStart); return weekStart === 1 ? c < 5 : c > 0 && c < 6 })
  // Day/Week/Month focus: narrow the visible columns.
  if (viewMode === 'day') {
    days = [today]
  } else if (viewMode === 'week') {
    const col = weekColumn(today, weekStart)
    const start = addDays(today, -col)
    days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    if (s.trackerHideWeekends) days = days.filter((d) => { const c = weekColumn(d, weekStart); return weekStart === 1 ? c < 5 : c > 0 && c < 6 })
  }

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

  /** True when a habit by this name already exists (case-insensitive) — used to
   *  prevent duplicate trackers from manual add or preset taps. */
  const habitExists = (name: string) => data.habits.some((h) => h.name.trim().toLowerCase() === name.trim().toLowerCase())

  function add() {
    const name = newHabit.trim()
    if (!name) return
    if (habitExists(name)) { setNewHabit(''); return } // no duplicates
    addHabit({ name, category: cat0, color: HABIT_COLORS[data.habits.length % HABIT_COLORS.length] })
    setNewHabit('')
  }

  return (
    <Page>
      <Card
        title="Habit & intake tracker"
        subtitle={`${prettyMonth(ym)} · tap a cell to mark the day`}
        right={
          <div className="flex items-center gap-1.5">
            {!radial && layout === 'classic' && <Segmented value={viewMode} onChange={setViewMode} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />}
            {!radial && (
              <div className="inline-flex overflow-hidden rounded-lg border border-surface1">
                {([
                  { id: 'classic', icon: <LayoutGrid size={15} />, title: 'Grid' },
                  { id: 'activity', icon: <Activity size={15} />, title: 'Activity' },
                  { id: 'routine', icon: <Clock size={15} />, title: 'Routine (by time of day)' },
                ] as const).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSettings({ trackerLayout: o.id })}
                    aria-label={`${o.title} layout`}
                    aria-pressed={layout === o.id}
                    title={o.title}
                    className="px-2 py-1.5"
                    style={{ background: layout === o.id ? cat('mauve') : 'transparent', color: layout === o.id ? cat('crust') : cat('subtext1') }}
                  >{o.icon}</button>
                ))}
              </div>
            )}
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
        ) : layout === 'routine' ? (
          <RoutineTimeline
            habits={visibleHabits}
            data={data}
            today={today}
            onToggle={toggleHabit}
            onSetValue={setHabitValue}
            onEdit={setEditing}
          />
        ) : layout === 'activity' ? (
          <ActivityLayout
            habits={visibleHabits}
            data={data}
            today={today}
            onToggle={toggleHabit}
            onSetValue={setHabitValue}
            onEdit={setEditing}
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
                    onReorder={reorderHabits}
                    collapsed={collapsedCats.has(category)}
                    onToggleCollapse={() => setCollapsedCats((cur) => { const n = new Set(cur); if (n.has(category)) n.delete(category); else n.add(category); return n })}
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
                disabled={habitExists(p.name)}
                title={habitExists(p.name) ? 'Already added' : undefined}
                onClick={() => { if (habitExists(p.name)) return; addHabit({ name: p.name, emoji: p.emoji, category: p.category, color: p.color, type: p.type, target: p.target, unit: p.unit, weeklyGoal: p.weeklyGoal, avoid: p.avoid }) }}
                className="rounded-full border border-surface1 bg-base px-2.5 py-1 text-xs text-subtext1 hover:border-mauve hover:text-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-surface1 disabled:hover:text-subtext1"
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full max-w-xs">
              <SmartInput
                value={newHabit}
                onChange={setNewHabit}
                onSubmit={() => add()}
                suggestCtx={{ tags: [], recents: [], habits: data.habits.map((h) => h.name) }}
                dupItems={data.habits.map((h) => ({ id: h.id, text: h.name }))}
                onGoToDuplicate={(id) => { setEditing(id); setNewHabit('') }}
                placeholder="New habit / food / stimulant…"
              />
            </div>
            <select value={cat0} onChange={(e) => setCat0(e.target.value as HabitCategory)} className="rounded-lg border border-surface1 bg-base px-2 py-2 text-sm text-text">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button variant="primary" onClick={add} className="inline-flex items-center gap-1.5"><Plus size={14} /> Add habit</Button>
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-5 max-xl:order-last lg:grid-cols-3">
      <Card title="Mood · Stress · Sleep" subtitle={`${prettyMonth(ym)} — faint = daily · bold = 7-day avg`} className="lg:col-span-2">
        <div className="h-64 w-full" role="img" aria-label={`Line chart of daily and 7-day-average mood, stress and sleep across ${prettyMonth(ym)}, each on a 0 to 10 scale`}>
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

      <Card title="Category consistency" subtitle="30-day avg per category">
        <div className="h-56 w-full" role="img" aria-label="Radar chart of 30-day habit consistency averaged per category">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={CATEGORIES.filter((category) => visibleHabits.some((h) => h.category === category)).map((category) => {
              const hs = visibleHabits.filter((h) => h.category === category)
              const avg = hs.length ? Math.round(hs.reduce((a, h) => a + habitConsistency(data, h.id, h.startedOn), 0) / hs.length) : 0
              return { category, value: avg }
            })}>
              <PolarGrid stroke={cat('surface1')} />
              <PolarAngleAxis dataKey="category" tick={{ fill: cat('overlay1'), fontSize: 10 }} />
              <Radar dataKey="value" stroke={cat('mauve')} fill={cat('mauve')} fillOpacity={0.35} />
              <Tooltip contentStyle={{ background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      </div>

      <TrackerVisuals data={data} today={today} />

      <ArchivedHabits />

      {editing && <HabitEditor habit={data.habits.find((h) => h.id === editing)!} onClose={() => setEditing(null)} />}
    </Page>
  )
}

/** Browser for archived habits — restore or delete for good. */
function ArchivedHabits() {
  const { data, updateHabit, removeHabit } = useJournal()
  const archived = data.habits.filter((h) => h.archived)
  if (archived.length === 0) return null
  return (
    <Card title="Archived habits" subtitle="Out of the grid — restore any time">
      <ul className="flex flex-wrap gap-2">
        {archived.map((h) => (
          <li key={h.id} className="inline-flex items-center gap-2 rounded-full border border-surface0 bg-base px-2.5 py-1 text-sm">
            <span style={{ color: cat(h.color) }}>●</span>
            <span className="text-subtext1">{h.emoji ? `${h.emoji} ` : ''}{h.name}</span>
            <button onClick={() => updateHabit(h.id, { archived: false })} className="text-xs text-green hover:underline">restore</button>
            <button onClick={() => { if (confirm(`Delete "${h.name}" and its history for good?`)) removeHabit(h.id) }} aria-label={`Delete ${h.name}`} className="text-overlay0 hover:text-red">×</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Extra at-a-glance visualisations: completion heatmap, streak board, weekday bars. */
function TrackerVisuals({ data, today }: { data: import('../lib/types').JournalData; today: string }) {
  const active = data.habits.filter((h) => !h.archived)
  if (active.length === 0) return null

  // 13-week completion heatmap (overall ratio per day).
  const WEEKS = 13
  const start = addDays(today, -(WEEKS * 7 - 1))
  const startDow = fromISODay(start).getDay()
  const cells: { date: string; ratio: number | null }[] = []
  for (let i = 0; i < WEEKS * 7; i++) {
    const date = addDays(start, i)
    cells.push({ date, ratio: dayCompletion(data, date).ratio })
  }
  const heatColor = (r: number | null) =>
    r == null ? cat('surface0') : r === 0 ? cat('surface1') : `color-mix(in srgb, ${cat('green')} ${Math.round(25 + r * 75)}%, ${cat('surface1')})`

  // Streak leaderboard (current streak per check-habit).
  const streaks = active
    .filter((h) => (h.type ?? 'check') === 'check')
    .map((h) => ({ h, streak: habitStreak(data, h.id, today) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 8)
  const maxStreak = Math.max(1, ...streaks.map((s) => s.streak))

  // Weekday consistency (avg completion per weekday, 90d).
  const wd = weekdayConsistency(data, 90, today)

  return (
    <div className="grid items-start gap-5 max-xl:order-last lg:grid-cols-2">
      <Card title="Completion heatmap" subtitle="Last 13 weeks — greener = more habits done that day" className="lg:col-span-2" collapsible>
        <div className="overflow-x-auto">
          <div
            className="grid grid-flow-col gap-1"
            style={{ gridTemplateRows: 'repeat(7, 0.7rem)' }}
            role="img"
            aria-label="Heatmap of daily habit-completion ratio over the last 13 weeks"
          >
            {/* Pad the first column so weekday rows line up. */}
            {Array.from({ length: startDow }).map((_, i) => <span key={`pad${i}`} />)}
            {cells.map((c) => (
              <span key={c.date} title={`${c.date}: ${c.ratio == null ? 'none scheduled' : Math.round(c.ratio * 100) + '%'}`} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: heatColor(c.ratio) }} />
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-overlay0">
          less {[0, 0.25, 0.5, 0.75, 1].map((r) => <span key={r} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: heatColor(r) }} />)} more
        </div>
      </Card>

      <Card title="Streak leaderboard" subtitle="Current consecutive-day streaks">
        {streaks.length === 0 ? (
          <Empty>No check habits yet.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {streaks.map(({ h, streak }) => (
              <li key={h.id} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 truncate text-subtext1">{h.emoji ? `${h.emoji} ` : ''}{h.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface0">
                  <div className="h-full rounded-full" style={{ width: `${(streak / maxStreak) * 100}%`, background: cat(h.color) }} />
                </div>
                <span className="inline-flex w-10 shrink-0 items-center justify-end gap-0.5 tabular-nums" style={{ color: cat('peach') }}><Flame size={12} />{streak}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Monthly trend" subtitle="Avg completion per month — is it climbing?">
        {(() => {
          const months = monthlyCompletion(data, 6, today)
          return (
            <div className="flex items-end justify-between gap-2" style={{ height: 120 }} role="img" aria-label="Bar chart of average habit completion per month over the last 6 months">
              {months.map((m) => (
                <div key={m.ym} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] tabular-nums text-subtext0">{Math.round(m.ratio * 100)}%</span>
                  <div className="flex w-full flex-1 items-end">
                    <div className="w-full rounded-t" style={{ height: `${Math.max(3, m.ratio * 100)}%`, background: cat('green'), opacity: 0.55 + m.ratio * 0.45 }} />
                  </div>
                  <span className="text-[10px] text-overlay0">{prettyMonth(m.ym).slice(0, 3)}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </Card>

      <Card title="Best weekdays" subtitle="Avg completion by day (last 90 days)">
        <div className="flex items-end justify-between gap-1.5" style={{ height: 120 }} role="img" aria-label="Bar chart of average habit completion by weekday over 90 days">
          {wd.map((r, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t" style={{ height: `${Math.max(3, r * 100)}%`, background: cat('mauve'), opacity: 0.5 + r * 0.5 }} title={`${Math.round(r * 100)}%`} />
              </div>
              <span className="text-[10px] text-overlay0">{WEEKDAYS[i]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
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
  const done = todays.filter((h) => habitDoneOn(data, h, today)).length

  return (
    <div className="mb-4 rounded-xl border border-surface0 bg-base p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-subtext1">Today</span>
        <span className="text-xs text-overlay0">{done}/{todays.length} done</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {todays.map((h) => {
          const type = h.type ?? 'check'
          const numeric = type === 'count' || type === 'timer' || type === 'rating'
          const target = habitTarget(h)
          const val = habitValueOn(data, h, today)
          const on = habitDoneOn(data, h, today)
          const next = nextHabitValue(type, target, val)
          return (
            <button
              key={h.id}
              onClick={() => (numeric ? onSetValue(today, h.id, next) : onToggle(today, h.id))}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors"
              title={h.avoid ? (on ? 'Slipped today — tap to clear' : 'Clean today') : undefined}
              style={{
                borderColor: on ? (h.avoid ? cat('red') : cat(h.color)) : cat('surface1'),
                background: on ? (h.avoid ? cat('red') : cat(h.color)) + '22' : 'transparent',
                color: on ? cat('text') : cat('subtext0'),
              }}
            >
              <span>{h.avoid ? '🚫' : (h.emoji ?? '●')}</span>
              {h.name}
              {h.avoid && <span className="text-[10px]" style={{ color: on ? cat('red') : cat('green') }}>{on ? 'slip' : 'clean'}</span>}
              {numeric && !h.avoid && <span className="text-overlay0">{type === 'rating' ? `${val}/5` : `${val}/${target}${type === 'timer' ? 'm' : ''}`}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Routine timeline: habits grouped by time of day (run your day) ───────────
function RoutineTimeline({
  habits, data, today, onToggle, onSetValue, onEdit,
}: {
  habits: Habit[]
  data: import('../lib/types').JournalData
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
              <span className="text-sm font-medium text-subtext1">{meta.emoji} {meta.label}</span>
              {slot === now && <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: cat('mauve') + '22', color: cat('mauve') }}>now</span>}
              <span className="ml-auto text-xs text-overlay0">{done}/{scheduled.length || list.length}</span>
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
                  <li key={h.id} className={`rounded-xl border border-surface0 bg-base p-2.5 ${dueToday ? '' : 'opacity-50'}`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => (numeric ? onSetValue(today, h.id, next) : onToggle(today, h.id))}
                        aria-label={`Mark ${h.name}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm transition-colors"
                        style={{
                          borderColor: on ? (h.avoid ? cat('red') : cat(h.color)) : cat('surface1'),
                          background: on ? (h.avoid ? cat('red') : cat(h.color)) + '33' : 'transparent',
                        }}
                      >{on ? (h.avoid ? '🚫' : '✓') : (h.emoji ?? '○')}</button>
                      <button onClick={() => onEdit(h.id)} className="min-w-0 flex-1 text-left">
                        <span className={`block truncate text-sm ${on && !h.avoid ? 'text-text' : 'text-subtext1'}`}>{h.name}</span>
                        {h.cue && <span className="block truncate text-[11px] text-overlay0">{h.cue}</span>}
                      </button>
                      {numeric && !h.avoid && <span className="shrink-0 text-xs text-overlay1">{type === 'rating' ? `${val}/5` : `${val}/${target}${type === 'timer' ? 'm' : ''}`}</span>}
                      {streak > 0 && <span className="inline-flex shrink-0 items-center gap-0.5 text-xs" style={{ color: cat('peach') }}><Flame size={12} /> {streak}</span>}
                      <button onClick={() => setNoting(open ? null : h.id)} aria-label={`Note for ${h.name}`} title="Jot a note" className={`shrink-0 ${note || open ? 'text-mauve' : 'text-overlay0 hover:text-subtext1'}`}><StickyNote size={14} /></button>
                    </div>
                    {(open || note) && (
                      <input
                        value={note}
                        onChange={(e) => setHabitNote(today, h.id, e.target.value)}
                        onBlur={() => setNoting(null)}
                        autoFocus={open}
                        placeholder="Jot a note for today…"
                        className="mt-2 w-full rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground"
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

// ── Category section of habit rows ───────────────────────────────────────────
function CategoryRows({
  category, habits, days, today, cell, data, onToggle, onSetValue, onEdit, onReorder, collapsed, onToggleCollapse,
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
          <button onClick={onToggleCollapse} className="text-[10px] tracking-wide text-overlay0 uppercase hover:text-subtext1">
            {collapsed ? '▸' : '▾'} {category} {collapsed && <span className="text-overlay1">({habits.length})</span>}
          </button>
        </td>
      </tr>
      {!collapsed && habits.map((h) => {
        const type = h.type ?? 'check'
        const numeric = type === 'count' || type === 'timer' || type === 'rating'
        const target = habitTarget(h)
        const avoid = !!h.avoid
        const streak = avoid ? cleanStreak(data, h.id) : habitStreak(data, h.id)
        const slipColor = avoid ? cat('red') : cat(h.color)
        const weekCount = h.weeklyGoal ? weeklyHabitCount(data, h.id, today) : 0
        return (
          <tr
            key={h.id}
            className={`group ${overId === h.id && dragId !== h.id ? 'outline-dashed outline-1 outline-mauve' : ''} ${dragId === h.id ? 'opacity-40' : ''}`}
            onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverId(h.id) } }}
            onDrop={(e) => { e.preventDefault(); if (dragId) onReorder(category as HabitCategory, dragId, h.id); setDragId(null); setOverId(null) }}
          >
            <td className="sticky left-0 z-10 bg-mantle py-0.5 pr-2 text-left text-subtext1">
              {/* Cap the sticky name column so long habit names truncate instead
                  of widening the column and overlapping the day cells on mobile. */}
              <div className="flex max-w-[44vw] items-center gap-0.5 sm:max-w-[220px]">
                <span
                  draggable
                  onDragStart={() => setDragId(h.id)}
                  onDragEnd={() => { setDragId(null); setOverId(null) }}
                  title="Drag to reorder"
                  className="shrink-0 cursor-grab text-overlay0 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
                ><GripVertical size={11} /></span>
                {avoid ? <Ban size={12} className="shrink-0" style={{ color: cat('red') }} aria-label="avoid habit" />
                  : h.emoji ? <span className="shrink-0">{h.emoji}</span> : <span className="shrink-0" style={{ color: cat(h.color) }}>●</span>}
                {avoid && h.emoji && <span className="shrink-0">{h.emoji}</span>}
                <button onClick={() => onEdit(h.id)} title={[avoid ? `${h.name} — habit to avoid` : h.name, h.cue].filter(Boolean).join(' · ')} className={`min-w-0 truncate hover:text-text hover:underline ${h.archived ? 'text-overlay0 line-through' : ''}`}>{h.name}</button>
                {h.unit && <span className="shrink-0 text-overlay0">({h.unit})</span>}
                {streak > 1 && (
                  avoid
                    ? <span title={`${streak} days clean`} className="inline-flex shrink-0 items-center gap-0.5 text-[10px]" style={{ color: cat('green') }}><ShieldCheck size={11} />{streak}d clean</span>
                    : <span title={`${streak}-day streak`} className="inline-flex shrink-0 items-center gap-0.5 text-[10px]" style={{ color: cat('peach') }}><Flame size={11} />{streak}</span>
                )}
                {h.weeklyGoal ? (
                  <span title={`${weekCount} of ${h.weeklyGoal} this week`} className="shrink-0 text-[10px]" style={{ color: weekCount >= h.weeklyGoal ? cat('green') : cat('overlay1') }}>
                    {weekCount}/{h.weeklyGoal}wk
                  </span>
                ) : null}
              </div>
            </td>
            {days.map((d) => {
              const future = d > today
              const before = d < h.startedOn
              const scheduled = !h.activeDays?.length || h.activeDays.includes(fromISODay(d).getDay())
              const disabled = future || before || !scheduled
              if (numeric) {
                const val = data.habitValues?.[d]?.[h.id] ?? 0
                return (
                  <td key={d} className="p-0.5 text-center">
                    <button
                      disabled={disabled}
                      onClick={() => onSetValue(d, h.id, nextHabitValue(type, target, val))}
                      title={`${val}/${target}`}
                      aria-label={`${h.name} ${d}: ${val} of ${target}`}
                      className={`grid ${cell} place-items-center rounded text-[8px] disabled:opacity-20`}
                      style={{ background: val > 0 ? slipColor : 'transparent', border: `1px solid ${cat('surface1')}`, opacity: val > 0 ? Math.max(0.35, val / target) : 1, color: cat('crust') }}
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
                    aria-label={avoid ? `${h.name} slip on ${d}` : `${h.name} on ${d}`}
                    title={avoid ? (on ? 'Slipped' : 'Clean') : undefined}
                    className={`grid ${cell} place-items-center rounded-full border disabled:opacity-20`}
                    style={{ borderColor: avoid && on ? cat('red') : cat('surface1'), background: on ? slipColor : 'transparent' }}
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
  const { updateHabit, removeHabit, toggleHabitSkip, setHabitNote, data } = useJournal()
  const set = (p: Partial<Habit>) => updateHabit(habit.id, p)
  // Reuse units already in use so trackers share consistent units (e.g. always
  // "min", not a mix of "min"/"minute"/"mins").
  const knownUnits = [...new Set(data.habits.map((h) => h.unit).filter((u): u is string => !!u))].sort()
  const [heatYear, setHeatYear] = useState(false)
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
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="day streak" value={streak} color="peach" />
            <StatTile label="30-day" value={`${habitConsistency(data, habit.id, habit.startedOn, 30)}%`} color="green" />
            <StatTile label="90-day" value={`${habitConsistency(data, habit.id, habit.startedOn, 90)}%`} color="blue" />
          </div>
          <p className="text-xs text-overlay0">Most consistent on <span className="text-subtext1">{bestDow}</span>. <Momentum data={data} habit={habit} today={today} /></p>

          {/* Completion heatmap — 12 weeks or a full year */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-overlay0">{heatYear ? 'Last 12 months' : 'Last 12 weeks'}</p>
              <button onClick={() => setHeatYear((v) => !v)} className="text-xs text-mauve hover:underline">{heatYear ? '12 weeks' : 'Full year'}</button>
            </div>
            <HabitHeatmap data={data} habit={habit} today={today} weeks={heatYear ? 53 : 12} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm text-subtext1">Name<Input value={habit.name} onChange={(e) => set({ name: e.target.value })} className="mt-1" /></label>
            <label className="block text-sm text-subtext1">Emoji<Input value={habit.emoji ?? ''} onChange={(e) => set({ emoji: e.target.value || undefined })} placeholder="💧" className="mt-1" /></label>
          </div>
          <label className="flex items-center justify-between rounded-lg border border-surface0 bg-base px-3 py-2 text-sm text-subtext1">
            <span className="inline-flex items-center gap-1.5"><Ban size={14} style={{ color: cat('red') }} /> Habit to avoid <span className="text-overlay0">(quit — a logged day counts as a slip)</span></span>
            <input type="checkbox" checked={!!habit.avoid} onChange={(e) => set({ avoid: e.target.checked || undefined })} className="accent-red" aria-label="Habit to avoid" />
          </label>
          <label className="block text-sm text-subtext1">Weekly goal <span className="text-overlay0">(times/week, optional)</span><div className="mt-1"><Stepper value={habit.weeklyGoal ?? undefined} onChange={(v) => set({ weeklyGoal: v })} step={1} min={0} aria-label="Weekly goal" /></div></label>

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
            <div className="flex flex-wrap justify-end gap-1.5">
              <Button variant={(habit.type ?? 'check') === 'check' ? 'primary' : 'ghost'} onClick={() => set({ type: 'check' })}>Yes / no</Button>
              <Button variant={habit.type === 'count' ? 'primary' : 'ghost'} onClick={() => set({ type: 'count' })}>Count</Button>
              <Button variant={habit.type === 'timer' ? 'primary' : 'ghost'} onClick={() => set({ type: 'timer', unit: habit.unit ?? 'min' })}>Timer</Button>
              <Button variant={habit.type === 'rating' ? 'primary' : 'ghost'} onClick={() => set({ type: 'rating' })}>Rating</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-subtext1">Time of day</span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {TIME_SLOTS.map((s) => (
                <Button key={s.id} variant={(habit.timeOfDay ?? 'anytime') === s.id ? 'primary' : 'ghost'} onClick={() => set({ timeOfDay: s.id })}>{s.emoji} {s.label}</Button>
              ))}
            </div>
          </div>

          <label className="block text-sm text-subtext1">Cue <span className="text-overlay0">(habit stacking — after what?)</span>
            <Input value={habit.cue ?? ''} onChange={(e) => set({ cue: e.target.value || undefined })} placeholder="e.g. After morning coffee" className="mt-1" />
          </label>

          <label className="block text-sm text-subtext1">Today’s note
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
                <p className="mb-1 text-sm text-overlay0">Recent notes</p>
                <ul className="space-y-1">
                  {recent.map((n) => (
                    <li key={n.day} className="rounded-lg border border-surface0 bg-base px-2.5 py-1.5 text-xs">
                      <span className="text-overlay0">{n.day}</span> · <span className="text-subtext1">{n.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })()}

          {(habit.type === 'count' || habit.type === 'timer') && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm text-subtext1">Daily target<div className="mt-1"><Stepper value={habit.target ?? undefined} onChange={(v) => set({ target: v })} step={habit.type === 'timer' ? 5 : 1} min={0} aria-label="Daily target" /></div></label>
              <label className="block text-sm text-subtext1">Unit<Input value={habit.unit ?? ''} onChange={(e) => set({ unit: e.target.value || undefined })} placeholder={habit.type === 'timer' ? 'min' : 'glasses'} list="habit-units" className="mt-1" /><datalist id="habit-units">{knownUnits.map((u) => <option key={u} value={u} />)}</datalist></label>
            </div>
          )}
          {habit.type === 'rating' && (
            <p className="text-xs text-overlay0">Logs a 1–5 rating per day (tap the stars in the activity view or today strip).</p>
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

// ── Habit visualisation helpers (v3) ─────────────────────────────────────────
type JData = import('../lib/types').JournalData

/** This-week vs last-week trend arrow. */
function Momentum({ data, habit, today }: { data: JData; habit: Habit; today: string }) {
  const week = (end: string) => Array.from({ length: 7 }, (_, i) => addDays(end, -i)).filter((d) => habitDoneOn(data, habit, d)).length
  const now = week(today)
  const prev = week(addDays(today, -7))
  if (now === prev) return <span className="text-overlay0">→ steady</span>
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
          const done = habitDoneOn(data, habit, d)
          const future = d > today
          return (
            <span
              key={d}
              title={`${d}${done ? ' · done' : ''}`}
              className={`${cell} rounded-[2px]`}
              style={{ background: future ? 'transparent' : done ? cat(habit.color) : cat('surface0') }}
            />
          )
        })}
      </div>
    </div>
  )
}
