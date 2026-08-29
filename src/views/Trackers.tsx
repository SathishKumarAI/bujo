/**
 * TRACKERS · the habit page.
 *
 * Owns the three zones, the layout switcher and which layout is showing, the
 * month/week/day range, the tracker settings popover, "add a habit", and the
 * two overlay slots.
 *
 * Owns nothing that draws a habit. Every layout is a component — five of them,
 * and the switcher picks one: `CategoryRows` (the month grid),
 * `GridCardsLayout`, `ActivityLayout`, `RoutineTimeline` and `RadialTracker`.
 * `components/trackers/README.md` has the change → file table.
 *
 * It was 1,048 lines until those moved out, twice the ceiling in the root
 * `CLAUDE.md`. If you move any of it again, move it by line range and diff the
 * rendered markup — `views/Pullups.tsx` retyped a data module inline and lost
 * eleven workout formats with every gate green.
 */
import { Clock, FadersHorizontal, GridFour, PersonSimpleRun, Plus, RadioButton, SquaresFour } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { addDays, fromISODay, monthDays, prettyMonth, todayISO, weekColumn } from '../lib/date'
import { Card, Empty, Segmented } from '../components/ui'
import { Button } from '../components/ui/button'
import { useCursor } from '../components/shell/Page'
import { DisclosureRow, PageLayout, StatBar } from '../components/page'
import { SmartInput } from '../components/SmartInput'
import { cat, HABIT_COLORS, onAccent } from '../lib/colors'
import { habitStreak, habitDoneOn } from '../lib/stats'
import { trackerSummary } from '../lib/habitStats'
import { rollingAverage } from '../lib/correlations'
import { RadialTracker } from '../components/RadialTracker'
import { HABIT_CATEGORIES as CATEGORIES, type HabitCategory, type HabitType } from '../lib/types'
import { ActivityLayout } from '../components/ActivityLayout'
import { GridCardsLayout } from '../components/GridCardsLayout'
import { HabitDetail } from '../components/trackers/HabitDetail'
import { HabitEditor } from '../components/trackers/HabitEditor'
import { TodayStrip } from '../components/trackers/TodayStrip'
import { RoutineTimeline } from '../components/trackers/RoutineTimeline'
import { CategoryRows } from '../components/trackers/CategoryRows'
import { TrackerVisuals } from '../components/trackers/TrackerVisuals'
import { MetricsTrendCard } from '../components/trackers/MetricsTrendCard'
import { CategoryConsistencyCard } from '../components/trackers/CategoryConsistencyCard'
import { QuietSection as CollapsibleSection } from '../components/CollapsibleSection'
import { useConfirm } from '../components/ConfirmDialog'
import { useStickyState } from '../lib/useStickyState'

const TRACKER_VIEW_MODES = ['day', 'week', 'month'] as const

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
  { name: 'Typing practice', emoji: '⌨️', category: 'wellness', color: 'sapphire', type: 'timer', target: 60, unit: 'min' },
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
  // Tapping a habit opens its read-first activity detail (heatmap + stats);
  // "Edit" inside hands off to the settings editor.
  const [viewing, setViewing] = useState<string | null>(null)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [radial, setRadial] = useState(typeof window !== 'undefined' && window.location.search.includes('wheel'))
  // Sticky: day / week / month is a habit of reading, not a per-visit choice.
  const [viewMode, setViewMode] = useStickyState<'day' | 'week' | 'month'>('trackers.viewMode', 'month', TRACKER_VIEW_MODES)
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

  /** True when a habit by this name already exists (case-insensitive) · used to
   *  prevent duplicate trackers from manual add or preset taps. */
  const habitExists = (name: string) => data.habits.some((h) => h.name.trim().toLowerCase() === name.trim().toLowerCase())

  function add() {
    const name = newHabit.trim()
    if (!name) return
    if (habitExists(name)) { setNewHabit(''); return } // no duplicates
    addHabit({ name, category: cat0, color: HABIT_COLORS[data.habits.length % HABIT_COLORS.length] })
    setNewHabit('')
  }

  const sum = trackerSummary(data, (id, t) => habitStreak(data, id, t), today)
  const hasHabits = visibleHabits.length > 0
  // Same filter TodayStrip applies, so the header count and the chips agree.
  const todaysHabits = visibleHabits.filter((h) => !h.activeDays?.length || h.activeDays.includes(fromISODay(today).getDay()))
  const todayDone = todaysHabits.filter((h) => habitDoneOn(data, h, today)).length

  return (
    <>
    <PageLayout
      tier={1180}
      /* Stacked, not split. The 62/38 columns assume the review is a list; this
         one is a 31-column grid needing ~910px, which would gain a horizontal
         scrollbar in a 62% column and hide the last week of the month — the
         page's whole subject. The act is a horizontal chip strip and has no use
         for the 380px form column either. */
      stacked
      zone1={hasHabits ? (
        <StatBar
          facts={[
            { label: 'today done', value: `${sum.todayPct}%` },
            { label: sum.topStreakHabit ?? 'top streak', value: `${sum.topStreak}d` },
            { label: 'avg consistency', value: sum.avgConsistency },
          ]}
        />
      ) : undefined}
      zone2={
        <Card band
          title="Today"
          subtitle="tap to mark the day"
          right={todaysHabits.length ? <span className="text-label text-fg-2">{todayDone}/{todaysHabits.length} done</span> : undefined}
        >
          <TodayStrip habits={visibleHabits} data={data} today={today} onToggle={toggleHabit} onSetValue={setHabitValue} />
          <DisclosureRow label="Add a habit">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-label text-fg-2">Quick add:</span>
              {HABIT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  disabled={habitExists(p.name)}
                  title={habitExists(p.name) ? 'Already added' : undefined}
                  onClick={() => { if (habitExists(p.name)) return; addHabit({ name: p.name, emoji: p.emoji, category: p.category, color: p.color, type: p.type, target: p.target, unit: p.unit, weeklyGoal: p.weeklyGoal, avoid: p.avoid }) }}
                  className="rounded-none border border-line-strong bg-ink-0 px-2.5 py-1 text-label text-fg-1 hover:border-mauve hover:text-fg-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:text-fg-1"
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
              <select value={cat0} onChange={(e) => setCat0(e.target.value as HabitCategory)} className="rounded-none border border-line-strong bg-ink-0 px-2 py-2 text-body text-fg-1">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {/* The page's single primary button. */}
              <Button onClick={add} className="press-3d inline-flex items-center gap-1.5"><Icon as={Plus} size="sm" /> Add habit</Button>
            </div>
          </DisclosureRow>
        </Card>
      }
      zone3={<>
      <Card band
        title="Habit & intake tracker"
        subtitle={`${prettyMonth(ym)}, tap a cell to mark the day`}
        right={
          /* `flex-wrap`, because `Card` cannot wrap a cluster it does not own:
             its `right` slot arrives as a single flex item, so capping the
             wrapper at `max-w-full` only decided *where* a 420px child
             overflows, not whether it did — with `justify-end` it moved from
             off the right edge to off the left one. Seven controls do not fit
             on a 390px row and the row has to say so itself. */
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {!radial && layout === 'classic' && <Segmented value={viewMode} onChange={setViewMode} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />}
            {!radial && (
              <div className="inline-flex overflow-hidden rounded-none border border-line-strong">
                {([
                  { id: 'classic', icon: <Icon as={SquaresFour} size="sm" />, title: 'Grid' },
                  { id: 'cards', icon: <Icon as={GridFour} size="sm" />, title: 'Cards (heatmap grids)' },
                  { id: 'activity', icon: <Icon as={PersonSimpleRun} size="sm" />, title: 'PersonSimpleRun' },
                  { id: 'routine', icon: <Icon as={Clock} size="sm" />, title: 'Routine (by time of day)' },
                ] as const).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSettings({ trackerLayout: o.id })}
                    aria-label={`${o.title} layout`}
                    aria-pressed={layout === o.id}
                    title={o.title}
                    className="px-2 py-1.5"
                    /* Neutral fill, not mauve. The page is allowed one
                       accent-filled control and it belongs to "Add habit"; a
                       layout switcher that also fills with accent makes two,
                       and then neither reads as the thing to do. */
                    style={{ background: layout === o.id ? cat('surface1') : 'transparent', color: layout === o.id ? cat('text') : cat('subtext1') }}
                  >{o.icon}</button>
                ))}
              </div>
            )}
            <Button variant="secondary" onClick={() => setRadial((v) => !v)} aria-label="Toggle wheel view" title={radial ? 'Grid view' : 'Wheel view'} className="press-3d rounded-none">{radial ? <Icon as={SquaresFour} size="sm" /> : <Icon as={RadioButton} size="sm" />}</Button>
            <Button variant="secondary" onClick={() => setShowSettings((v) => !v)} aria-label="Tracker settings" title="Tracker settings" className="press-3d rounded-none"><Icon as={FadersHorizontal} size="sm" /></Button>
          </div>
        }
      >
        {showSettings && (
          <div className="mb-3 flex flex-wrap gap-4 rounded-none border border-line bg-ink-0 p-3 text-body">
            <Seg label="Density" options={[['comfortable', 'Comfortable'], ['compact', 'Compact']]} value={s.trackerDensity ?? 'comfortable'} onChange={(v) => setSettings({ trackerDensity: v as 'comfortable' | 'compact' })} />
            <Check label="Hide weekends" on={!!s.trackerHideWeekends} onClick={() => setSettings({ trackerHideWeekends: !s.trackerHideWeekends })} />
            <Check label="Show archived" on={!!s.trackerShowArchived} onClick={() => setSettings({ trackerShowArchived: !s.trackerShowArchived })} />
          </div>
        )}

        {visibleHabits.length === 0 ? (
          <Empty>No habits yet · add one below.</Empty>
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
            onEdit={setViewing}
          />
        ) : layout === 'cards' ? (
          <GridCardsLayout
            habits={visibleHabits}
            data={data}
            today={today}
            onToggle={toggleHabit}
            onSetValue={setHabitValue}
            onEdit={setViewing}
          />
        ) : layout === 'activity' ? (
          <ActivityLayout
            habits={visibleHabits}
            data={data}
            today={today}
            onToggle={toggleHabit}
            onSetValue={setHabitValue}
            onEdit={setViewing}
            onReorder={reorderHabits}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-label">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-ink-1 p-1 text-left font-normal text-fg-2">Habit</th>
                  {days.map((d) => (
                    <th key={d} className={`p-0.5 text-center font-normal ${d === today ? 'text-mauve' : 'text-fg-2'}`}>{Number(d.slice(8))}</th>
                  ))}
                  <th className="p-1 pr-2 text-fg-2">%</th>
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
                    onEdit={setViewing}
                    onReorder={reorderHabits}
                    collapsed={collapsedCats.has(category)}
                    onToggleCollapse={() => setCollapsedCats((cur) => { const n = new Set(cur); if (n.has(category)) n.delete(category); else n.add(category); return n })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

      </Card>

      {/* Trends are no longer behind a fold. They were inside a section that
          happened to default open, which is a fold you have not noticed yet —
          and the same accordion pattern that hid Fitness's training calendar,
          the single most useful thing on that page, for months. Zone 3 is where
          recorded things belong, so they are simply here. */}
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <MetricsTrendCard chartData={chartData} ym={ym} />
        <CategoryConsistencyCard categories={CATEGORIES} habits={visibleHabits} data={data} />
      </div>

      {/* The one *region* fold. `CollapsibleSection` rather than a second
          `DisclosureRow`: the codebase distinguishes them deliberately — a
          disclosure is a quiet row for optional form fields, a section folds a
          whole titled region with card chrome. Zone 2 spends the page's single
          DisclosureRow on "Add a habit". */}
      {/* Folded by default, and the fold is remembered. `CollapsibleSection`'s
          `defaultOpen` prop is documented "Deep-analytics groups default to
          collapsed" and then defaults to `true`, so this section — five cards
          and roughly 900px of them — opened on every visit despite being the
          fifth thing on the page. The component default is left alone: it is
          shared, and flipping it would silently close folds across the app.
          `stickyKey` means a reader who wants these open only says so once,
          the same bargain the Day/Week/Month control already makes.

          Note for the next person: `npm run a11y` walks the rendered page, so
          nothing in here is scanned while it is shut. It was re-run with the
          section expanded for this change — keep doing that. */}
      <CollapsibleSection title="Deep analytics" subtitle="heatmaps, streaks & breakdowns" defaultOpen={false} stickyKey="trackers.deepAnalytics">
        <TrackerVisuals data={data} today={today} />
        <ArchivedHabits />
      </CollapsibleSection>
      </>}
    />

    {/* Overlays, not page content — siblings of the zones rather than inside
        one, so neither the sticky measurement nor the zone grid ever sees them. */}
    {viewing && data.habits.find((h) => h.id === viewing) && (
      <HabitDetail
        habit={data.habits.find((h) => h.id === viewing)!}
        data={data}
        onClose={() => setViewing(null)}
        onEdit={() => { setEditing(viewing); setViewing(null) }}
      />
    )}
    {editing && <HabitEditor habit={data.habits.find((h) => h.id === editing)!} onClose={() => setEditing(null)} />}
    </>
  )
}

/** Browser for archived habits · restore or delete for good. */
function ArchivedHabits() {
  const confirm = useConfirm()
  const { data, updateHabit, removeHabit } = useJournal()
  const archived = data.habits.filter((h) => h.archived)
  if (archived.length === 0) return null
  return (
    <Card band title="Archived habits" subtitle="Out of the grid, restore any time" collapsible>
      <ul className="flex flex-wrap gap-2">
        {archived.map((h) => (
          <li key={h.id} className="inline-flex items-center gap-2 rounded-none border border-line bg-ink-0 px-2.5 py-1 text-body">
            <span style={{ color: cat(h.color) }}>●</span>
            <span className="text-fg-1">{h.emoji ? `${h.emoji} ` : ''}{h.name}</span>
            <Button variant="ghost" onClick={() => updateHabit(h.id, { archived: false })} className="h-auto p-0 text-label text-green">restore</Button>
            <Button variant="ghost" size="icon-sm" onClick={async () => { if (await confirm({
              title: `Delete “${h.name}”?`,
              description: 'The habit and its entire tracked history are deleted. This cannot be undone.',
              confirmLabel: 'Delete habit', destructive: true,
            })) removeHabit(h.id) }} aria-label={`Delete ${h.name}`} className="text-fg-2 hover:text-red">×</Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ── Settings popover helpers ─────────────────────────────────────────────────
function Seg({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-label text-fg-2">{label}</p>
      <div className="flex gap-1">
        {options.map(([v, l]) => (
          <button key={v} onClick={() => onChange(v)} className="rounded px-2 py-1 text-label" style={{ background: value === v ? cat('mauve') : cat('surface0'), color: value === v ? onAccent(cat('mauve')) : cat('subtext1') }}>{l}</button>
        ))}
      </div>
    </div>
  )
}
function Check({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-end gap-2 text-body text-fg-1">
      <span className={`relative h-5 w-9 rounded-none transition-colors ${on ? 'bg-mauve' : 'bg-ink-3'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-none bg-crust transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

