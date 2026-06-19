import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid,
  Radar, RadarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip,
  XAxis, YAxis, ZAxis,
} from 'recharts'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X, Columns2, Rows2 } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Segmented } from '../components/ui'
import { Heatmap } from '../components/Heatmap'
import { AchievementsCard } from '../components/AchievementsCard'
import { CheckinTimesCard } from '../components/CheckinTimesCard'
import { cat } from '../lib/colors'
import {
  buildHeatmap, moodByDay, sleepMoodScatter, tagCounts, taskBreakdown,
  weeklyRadar, weeklyWorkoutMinutes,
} from '../lib/viz'
import { monthDays, prettyMonth, todayISO, ymOf, fromISODay, WEEKDAYS, MONTHS } from '../lib/date'
import { moodByWeekday, workoutSplitCounts } from '../lib/stats'

const tip = { background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }

export function Stats() {
  const { data, setSettings } = useJournal()
  const pairStacked = data.settings.statsPairLayout === 'stacked'
  const [ym, setYm] = useState(ymOf(todayISO()))
  const [heatWeeks, setHeatWeeks] = useState(26)

  const heat = buildHeatmap(data, heatWeeks)
  const radar = weeklyRadar(data)
  const scatter = sleepMoodScatter(data)
  const workout = weeklyWorkoutMinutes(data)
  const tasks = taskBreakdown(data)
  const tags = tagCounts(data)
  const maxTag = tags[0]?.count ?? 1
  const moods = moodByDay(data)
  const moodWd = moodByWeekday(data)
  const splits = workoutSplitCounts(data)
  const SPLIT_COLORS = ['mauve', 'blue', 'green', 'peach', 'teal', 'pink', 'yellow', 'sky']

  function shift(d: number) {
    const [y, m] = ym.split('-').map(Number)
    setYm(ymOf(new Date(y, m - 1 + d, 1)))
  }

  const moodColor = (v: number | undefined) => {
    if (v == null) return cat('surface0')
    // red (low) → yellow → green (high)
    const hue = (v / 10) * 120
    return `hsl(${hue} 45% 55%)`
  }

  // Click-to-enlarge: which widget is shown big in the modal.
  const [enlarged, setEnlarged] = useState<null | 'mood' | 'year'>(null)

  // Mood-calendar grid; `large` scales the cells up for the enlarge modal.
  const moodCalGrid = (large = false) => (
    <div className={large ? 'mx-auto max-w-xl' : 'mx-auto max-w-xs'}>
      <div className={`mb-1 grid grid-cols-7 text-center text-overlay0 ${large ? 'gap-1.5 text-xs' : 'gap-0.5 text-[9px]'}`}>
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className={`grid grid-cols-7 ${large ? 'gap-1.5' : 'gap-0.5'}`}>
        {monthDays(ym).map((d, i) => (
          <div key={d} title={moods.has(d) ? `${d}: mood ${moods.get(d)}/10` : `${d}: no mood logged`}
            className={`grid aspect-square cursor-default place-items-center rounded transition-transform duration-150 hover:scale-[1.18] ${large ? 'text-base' : 'text-[10px]'}`}
            style={{ background: moodColor(moods.get(d)), color: moods.has(d) ? '#11111b' : cat('overlay0'), gridColumnStart: i === 0 ? fromISODay(d).getDay() + 1 : undefined }}>
            {Number(d.slice(8))}
          </div>
        ))}
      </div>
    </div>
  )

  // Year-in-pixels grid; `large` bumps the square size for the modal.
  const yearPixels = (large = false) => {
    const year = ym.slice(0, 4)
    const moodOn = new Map(data.metrics.filter((m) => m.mood != null && m.date.startsWith(year)).map((m) => [m.date, m.mood!]))
    if (moodOn.size === 0) return <Empty>Log mood through the year to fill this in.</Empty>
    const sq = large ? 'h-4 w-4' : 'h-2.5 w-2.5'
    return (
      <div className="overflow-x-auto" role="img" aria-label={`Year-in-pixels grid of daily mood for ${year}`}>
        <div className={large ? 'min-w-[720px]' : 'min-w-[520px]'}>
          {Array.from({ length: 12 }, (_, mi) => {
            const mm = String(mi + 1).padStart(2, '0')
            return (
              <div key={mi} className="flex items-center gap-1">
                <span className={`shrink-0 text-overlay0 ${large ? 'w-9 text-xs' : 'w-7 text-[10px]'}`}>{MONTHS[mi].slice(0, 3)}</span>
                <div className="flex gap-[2px]">
                  {Array.from({ length: 31 }, (_, di) => {
                    const date = `${year}-${mm}-${String(di + 1).padStart(2, '0')}`
                    const v = moodOn.get(date)
                    return <span key={di} className={`${sq} rounded-[2px] transition-transform duration-150 hover:scale-[1.6]`} title={v != null ? `${date}: ${v}/10` : date} style={{ background: moodColor(v) }} />
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <Card title="Activity" subtitle="Every day you showed up" enlargeable right={<Segmented value={heatWeeks} onChange={setHeatWeeks} options={[{ value: 13, label: '3mo' }, { value: 26, label: '6mo' }, { value: 52, label: '1yr' }]} />}>
        <Heatmap cols={heat} />
      </Card>

      <AchievementsCard />

      <CheckinTimesCard />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card title="This week at a glance" subtitle="7-day averages, 0–10" enlargeable>
          <div className="h-64" role="img" aria-label="Radar chart of this week's 7-day averages across mood, stress, sleep and habits, each on a 0 to 10 scale">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke={cat('surface1')} />
                <PolarAngleAxis dataKey="axis" tick={{ fill: cat('subtext0'), fontSize: 12 }} />
                <Radar dataKey="value" stroke={cat('mauve')} fill={cat('mauve')} fillOpacity={0.35} />
                <Tooltip contentStyle={tip} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Sleep vs mood" subtitle="Each dot is a day — see the trend" enlargeable>
          {scatter.length < 3 ? (
            <Empty>Log a few more days to see the pattern.</Empty>
          ) : (
            <div className="h-64" role="img" aria-label={`Scatter plot of sleep hours versus mood for ${scatter.length} days, showing their correlation`}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: -20 }}>
                  <CartesianGrid stroke={cat('surface0')} />
                  <XAxis type="number" dataKey="sleep" name="sleep" domain={[0, 10]} stroke={cat('overlay0')} fontSize={11} />
                  <YAxis type="number" dataKey="mood" name="mood" domain={[0, 10]} stroke={cat('overlay0')} fontSize={11} />
                  <ZAxis range={[40, 40]} />
                  <Tooltip contentStyle={tip} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatter} fill={cat('sky')} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Workout minutes" subtitle="Per week, last 8 weeks" enlargeable>
          <div className="h-56" role="img" aria-label="Bar chart of total workout minutes per week over the last 8 weeks">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workout} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke={cat('surface0')} vertical={false} />
                <XAxis dataKey="week" stroke={cat('overlay0')} fontSize={11} />
                <YAxis stroke={cat('overlay0')} fontSize={11} />
                <Tooltip contentStyle={tip} cursor={{ fill: cat('surface0') }} />
                <Bar dataKey="minutes" fill={cat('teal')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Task breakdown" subtitle="Where your tasks land" enlargeable>
          {tasks.length === 0 ? (
            <Empty>No tasks yet.</Empty>
          ) : (
            <div className="h-56" role="img" aria-label={`Donut chart of task outcomes: ${tasks.map((t) => `${t.value} ${t.name}`).join(', ')}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tasks} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                    {tasks.map((t) => <Cell key={t.name} fill={cat(t.color)} />)}
                  </Pie>
                  <Tooltip contentStyle={tip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-xs">
                {tasks.map((t) => <span key={t.name} style={{ color: cat(t.color) }}>● {t.name} {t.value}</span>)}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={() => setSettings({ statsPairLayout: pairStacked ? 'split' : 'stacked' })}
          aria-label={pairStacked ? 'Show side by side' : 'Stack full width'} title={pairStacked ? 'Side by side' : 'Stack full width'}>
          {pairStacked ? <Columns2 size={14} /> : <Rows2 size={14} />}
        </Button>
      </div>
      <div className={`grid items-start gap-5 ${pairStacked ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
      <Card
        enlargeable={false}
        title="Mood calendar"
        subtitle="Each day tinted by your mood (0–10) — tap ⛶ to enlarge"
        right={
          <div className="flex gap-1">
            <Button onClick={() => shift(-1)} aria-label="Previous month">←</Button>
            <Button onClick={() => setYm(ymOf(todayISO()))}>This month</Button>
            <Button onClick={() => shift(1)} aria-label="Next month">→</Button>
            <Button onClick={() => setEnlarged('mood')} aria-label="Enlarge mood calendar" title="Enlarge"><Maximize2 size={14} /></Button>
          </div>
        }
      >
        {(() => {
          const rated = monthDays(ym).map((d) => moods.get(d)).filter((m): m is number => m != null)
          const avg = rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : null
          let best: string | null = null
          for (const d of monthDays(ym)) if (best == null || (moods.get(d) ?? -1) > (moods.get(best) ?? -1)) if (moods.has(d)) best = d
          return (
            <p className="mb-3 text-sm text-subtext0">
              {prettyMonth(ym)} ·{' '}
              {avg == null ? <span className="text-overlay0">no mood logged yet</span> : (
                <>avg mood <span className="font-semibold" style={{ color: moodColor(Math.round(avg)) }}>{avg}</span> over {rated.length} day{rated.length === 1 ? '' : 's'}{best && <> · best {best.slice(8)}</>}</>
              )}
            </p>
          )
        })()}
        {moodCalGrid(false)}
        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-overlay0">
          <span>low</span>
          {[0, 2, 4, 6, 8, 10].map((m) => <span key={m} className="h-3 w-5 rounded-sm" style={{ background: moodColor(m) }} />)}
          <span>great</span>
        </div>
      </Card>

      <Card title="Year in pixels" subtitle={`${ym.slice(0, 4)} — one square per day, tinted by mood`} enlargeable={false}
        right={<Button onClick={() => setEnlarged('year')} aria-label="Enlarge year in pixels" title="Enlarge"><Maximize2 size={14} /></Button>}>
        {yearPixels(false)}
      </Card>
      </div>

      <Card title="Mood by weekday" subtitle="Which days run brightest (all logged moods)" enlargeable>
        {moodWd.every((v) => v == null) ? (
          <Empty>Log mood on a few days to see your weekly rhythm.</Empty>
        ) : (
          <div className="flex items-end justify-between gap-2" style={{ height: 130 }} role="img" aria-label="Bar chart of average mood by weekday, 0 to 10">
            {moodWd.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-subtext0">{v == null ? '–' : Math.round(v * 10) / 10}</span>
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t" style={{ height: `${v == null ? 2 : (v / 10) * 100}%`, background: moodColor(v == null ? undefined : Math.round(v)) }} title={v == null ? 'no data' : `${Math.round(v * 10) / 10}/10`} />
                </div>
                <span className="text-[10px] text-overlay0">{WEEKDAYS[i]}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Workout split" subtitle="Distribution of your logged sessions" enlargeable>
        {splits.length === 0 ? (
          <Empty>No workouts logged yet.</Empty>
        ) : (
          <div className="h-56" role="img" aria-label={`Donut chart of workouts by type: ${splits.map((s) => `${s.count} ${s.split}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={splits} dataKey="count" nameKey="split" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                  {splits.map((s, i) => <Cell key={s.split} fill={cat(SPLIT_COLORS[i % SPLIT_COLORS.length])} />)}
                </Pie>
                <Tooltip contentStyle={tip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {splits.map((s, i) => <span key={s.split} style={{ color: cat(SPLIT_COLORS[i % SPLIT_COLORS.length]) }}>● {s.split} {s.count}</span>)}
            </div>
          </div>
        )}
      </Card>

      <Card title="Tags" subtitle="What you write about most">
        {tags.length === 0 ? (
          <Empty>No #tags yet — add them in any entry.</Empty>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {tags.map((t) => (
              <span key={t.tag} style={{ fontSize: `${0.8 + (t.count / maxTag) * 1.1}rem`, color: cat('sapphire') }}>
                #{t.tag}
                <sup className="ml-0.5 text-[10px] text-overlay0">{t.count}</sup>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Click-to-enlarge modal — portalled to <body> so it centres on the
          viewport, not inside transformed ancestors (book mode / zoom). */}
      {enlarged && createPortal(
        <div className="modal-backdrop-in fixed inset-0 z-50 grid place-items-center bg-crust/70 p-4 backdrop-blur-sm" onClick={() => setEnlarged(null)} role="dialog" aria-modal="true">
          <div className="modal-panel-in relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-foreground">{enlarged === 'mood' ? `Mood calendar · ${prettyMonth(ym)}` : `Year in pixels · ${ym.slice(0, 4)}`}</h3>
              <button onClick={() => setEnlarged(null)} aria-label="Close" className="text-overlay1 hover:text-foreground"><X size={20} /></button>
            </div>
            {enlarged === 'mood' ? moodCalGrid(true) : yearPixels(true)}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
