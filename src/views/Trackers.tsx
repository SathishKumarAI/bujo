import { useState } from 'react'
import { Flame, X } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useJournal } from '../store'
import { monthDays, prettyMonth, todayISO, ymOf } from '../lib/date'
import { Button, Card, Empty, Input } from '../components/ui'
import { cat, HABIT_COLORS } from '../lib/colors'
import { habitConsistency, habitStreak } from '../lib/stats'
import { rollingAverage } from '../lib/correlations'
import type { Habit } from '../lib/types'

const CATEGORIES: Habit['category'][] = ['stimulant', 'food', 'movement', 'wellness', 'custom']

export function Trackers() {
  const { data, toggleHabit, addHabit, removeHabit, renameHabit } = useJournal()
  const [ym, setYm] = useState(ymOf(todayISO()))
  const [newHabit, setNewHabit] = useState('')
  const [cat0, setCat0] = useState<Habit['category']>('custom')
  const days = monthDays(ym)
  const today = todayISO()

  // Chart data for the month, with 7-day rolling-average overlays.
  const moodAvg = rollingAverage(days.map((d) => data.metrics.find((x) => x.date === d)?.mood))
  const stressAvg = rollingAverage(days.map((d) => data.metrics.find((x) => x.date === d)?.stress))
  const sleepAvg = rollingAverage(days.map((d) => data.metrics.find((x) => x.date === d)?.sleep))
  const chartData = days.map((d, i) => {
    const m = data.metrics.find((x) => x.date === d)
    return {
      day: Number(d.slice(8)),
      mood: m?.mood, stress: m?.stress, sleep: m?.sleep,
      moodAvg: moodAvg[i], stressAvg: stressAvg[i], sleepAvg: sleepAvg[i],
    }
  })

  function shiftMonth(delta: number) {
    const [y, mo] = ym.split('-').map(Number)
    const next = new Date(y, mo - 1 + delta, 1)
    setYm(ymOf(next))
  }

  function add() {
    if (!newHabit.trim()) return
    const color = HABIT_COLORS[data.habits.length % HABIT_COLORS.length]
    addHabit({ name: newHabit.trim(), category: cat0, color })
    setNewHabit('')
  }

  return (
    <div className="space-y-4">
      <Card
        title="Habit & intake tracker"
        subtitle={`${prettyMonth(ym)} · tap a cell to mark the day`}
        right={
          <div className="flex gap-1">
            <Button onClick={() => shiftMonth(-1)} aria-label="Previous month">←</Button>
            <Button onClick={() => setYm(ymOf(today))}>This month</Button>
            <Button onClick={() => shiftMonth(1)} aria-label="Next month">→</Button>
          </div>
        }
      >
        {data.habits.length === 0 ? (
          <Empty>No habits yet — add one below.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-mantle p-1 text-left font-normal text-overlay0">Habit</th>
                  {days.map((d) => (
                    <th key={d} className="w-5 p-0.5 text-center font-normal text-overlay0">
                      {Number(d.slice(8))}
                    </th>
                  ))}
                  <th className="p-1 text-overlay0">%</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.filter((c) => data.habits.some((h) => h.category === c)).map((category) => (
                  <FragmentRows
                    key={category}
                    category={category}
                    habits={data.habits.filter((h) => h.category === category)}
                    days={days}
                    today={today}
                    habitLog={data.habitLog}
                    consistency={(h) => habitConsistency(data, h.id, h.startedOn)}
                    streak={(h) => habitStreak(data, h.id)}
                    onToggle={toggleHabit}
                    onRemove={removeHabit}
                    onRename={renameHabit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-surface0 pt-3">
          <Input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="New habit / food / stimulant…"
            className="max-w-xs"
          />
          <select
            value={cat0}
            onChange={(e) => setCat0(e.target.value as Habit['category'])}
            className="rounded-lg border border-surface1 bg-base px-2 py-2 text-sm text-text"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button variant="primary" onClick={add}>Add habit</Button>
        </div>
      </Card>

      <Card title="Mood · Stress · Sleep" subtitle={`${prettyMonth(ym)} — see how they move together`}>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke={cat('overlay0')} fontSize={11} />
              <YAxis domain={[0, 10]} stroke={cat('overlay0')} fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#181825',
                  border: '1px solid #313244',
                  borderRadius: 8,
                  color: '#cdd6f4',
                }}
              />
              <Line type="monotone" dataKey="mood" stroke={cat('green')} dot={false} connectNulls strokeWidth={2} opacity={0.35} />
              <Line type="monotone" dataKey="stress" stroke={cat('red')} dot={false} connectNulls strokeWidth={2} opacity={0.35} />
              <Line type="monotone" dataKey="sleep" stroke={cat('blue')} dot={false} connectNulls strokeWidth={2} opacity={0.35} />
              <Line type="monotone" dataKey="moodAvg" stroke={cat('green')} dot={false} connectNulls strokeWidth={2.5} />
              <Line type="monotone" dataKey="stressAvg" stroke={cat('red')} dot={false} connectNulls strokeWidth={2.5} />
              <Line type="monotone" dataKey="sleepAvg" stroke={cat('blue')} dot={false} connectNulls strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-xs">
          <span style={{ color: cat('green') }}>● Mood</span>
          <span style={{ color: cat('red') }}>● Stress</span>
          <span style={{ color: cat('blue') }}>● Sleep</span>
          <span className="text-overlay0">faint = daily · bold = 7-day avg</span>
        </div>
      </Card>
    </div>
  )
}

function FragmentRows({
  category,
  habits,
  days,
  today,
  habitLog,
  consistency,
  streak,
  onToggle,
  onRemove,
  onRename,
}: {
  category: string
  habits: Habit[]
  days: string[]
  today: string
  habitLog: Record<string, string[]>
  consistency: (h: Habit) => number
  streak: (h: Habit) => number
  onToggle: (date: string, id: string) => void
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
}) {
  return (
    <>
      <tr>
        <td colSpan={days.length + 2} className="pt-3 pb-1 text-[10px] tracking-wide text-overlay0 uppercase">
          {category}
        </td>
      </tr>
      {habits.map((h) => (
        <tr key={h.id} className="group">
          <td className="sticky left-0 z-10 bg-mantle py-0.5 pr-2 text-left whitespace-nowrap text-subtext1">
            <span style={{ color: cat(h.color) }}>●</span>{' '}
            <input
              defaultValue={h.name}
              onBlur={(e) => e.target.value.trim() && onRename(h.id, e.target.value.trim())}
              aria-label={`Rename ${h.name}`}
              title="Click to rename"
              className="w-24 rounded bg-transparent px-1 text-subtext1 hover:bg-surface0 focus:bg-surface0 focus:outline-none"
            />
            {streak(h) > 1 && (
              <span title={`${streak(h)}-day streak`} className="ml-1 inline-flex items-center gap-0.5 align-middle text-[10px]" style={{ color: cat('peach') }}>
                <Flame size={11} />{streak(h)}
              </span>
            )}
            <button
              onClick={() => onRemove(h.id)}
              aria-label={`Remove ${h.name}`}
              className="ml-1 text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red"
            >
              <X size={13} className="inline" />
            </button>
          </td>
          {days.map((d) => {
            const on = (habitLog[d] ?? []).includes(h.id)
            const future = d > today
            const before = d < h.startedOn
            return (
              <td key={d} className="p-0.5 text-center">
                <button
                  disabled={future || before}
                  onClick={() => onToggle(d, h.id)}
                  aria-label={`${h.name} on ${d}`}
                  className="grid h-4 w-4 place-items-center rounded-full border disabled:opacity-20"
                  style={{
                    borderColor: cat('surface1'),
                    background: on ? cat(h.color) : 'transparent',
                  }}
                />
              </td>
            )
          })}
          <td className="px-1 text-center text-overlay0">{consistency(h)}</td>
        </tr>
      ))}
    </>
  )
}
