import {
  ResponsiveContainer, Tooltip,
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import { habitConsistency } from '../../lib/stats'
import type { Habit, HabitCategory, JournalData } from '../../lib/types'

/** Radar of 30-day average habit consistency, averaged per category. */
export function CategoryConsistencyCard({
  categories, habits, data,
}: {
  categories: HabitCategory[]
  habits: Habit[]
  data: JournalData
}) {
  return (
    <Card title="Category consistency" subtitle="30-day avg per category">
      <div className="h-56 w-full" role="img" aria-label="Radar chart of 30-day habit consistency averaged per category">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={categories.filter((category) => habits.some((h) => h.category === category)).map((category) => {
            const hs = habits.filter((h) => h.category === category)
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
  )
}
