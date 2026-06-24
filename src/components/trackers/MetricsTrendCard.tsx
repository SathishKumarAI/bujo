import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import { prettyMonth } from '../../lib/date'

type MetricsPoint = {
  day: number
  mood?: number
  stress?: number
  sleep?: number
  moodAvg?: number | null
  stressAvg?: number | null
  sleepAvg?: number | null
}

/** Mood / stress / sleep line chart: faint = daily, bold = 7-day rolling avg. */
export function MetricsTrendCard({ chartData, ym }: { chartData: MetricsPoint[]; ym: string }) {
  return (
    <Card title="Mood · Stress · Sleep" subtitle={`${prettyMonth(ym)} · faint = daily · bold = 7-day avg`} className="lg:col-span-2">
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
  )
}
