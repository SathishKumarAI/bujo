import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid,
  Radar, RadarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip,
  XAxis, YAxis, ZAxis,
} from 'recharts'
import { useState } from 'react'
import { useJournal } from '../store'
import { Button, Card, Empty, Segmented } from '../components/ui'
import { Heatmap } from '../components/Heatmap'
import { cat } from '../lib/colors'
import {
  buildHeatmap, moodByDay, sleepMoodScatter, tagCounts, taskBreakdown,
  weeklyRadar, weeklyWorkoutMinutes,
} from '../lib/viz'
import { monthDays, prettyMonth, todayISO, ymOf, fromISODay } from '../lib/date'

const tip = { background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }

export function Stats() {
  const { data } = useJournal()
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

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <Card title="Activity" subtitle="Every day you showed up" right={<Segmented value={heatWeeks} onChange={setHeatWeeks} options={[{ value: 13, label: '3mo' }, { value: 26, label: '6mo' }, { value: 52, label: '1yr' }]} />}>
        <Heatmap cols={heat} />
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card title="This week at a glance" subtitle="7-day averages, 0–10">
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

        <Card title="Sleep vs mood" subtitle="Each dot is a day — see the trend">
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

        <Card title="Workout minutes" subtitle="Per week, last 8 weeks">
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

        <Card title="Task breakdown" subtitle="Where your tasks land">
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

      <Card
        title="Mood calendar"
        subtitle={`${prettyMonth(ym)} — greener is better`}
        right={
          <div className="flex gap-1">
            <Button onClick={() => shift(-1)} aria-label="Previous month">←</Button>
            <Button onClick={() => setYm(ymOf(todayISO()))}>This month</Button>
            <Button onClick={() => shift(1)} aria-label="Next month">→</Button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1">
          {monthDays(ym).map((d, i) => (
            <div
              key={d}
              title={moods.has(d) ? `${d}: mood ${moods.get(d)}` : d}
              className="grid aspect-square place-items-center rounded-md text-xs"
              style={{
                background: moodColor(moods.get(d)),
                color: moods.has(d) ? '#11111b' : cat('overlay0'),
                gridColumnStart: i === 0 ? fromISODay(d).getDay() + 1 : undefined,
              }}
            >
              {Number(d.slice(8))}
            </div>
          ))}
        </div>
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
    </div>
  )
}
