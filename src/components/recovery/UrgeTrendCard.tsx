import { TrendingDown, TrendingUp, Activity } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { urgeFrequencyTrend } from '../../lib/urge'

type Trend = ReturnType<typeof urgeFrequencyTrend>

/** Urge-frequency trend (#348) · weekly area sparkline, evidence cravings ease. */
export function UrgeTrendCard({ urgeTrend }: { urgeTrend: Trend }) {
  return (
    <Card
      title={<span className="inline-flex items-center gap-2">{urgeTrend.direction === 'down' ? <TrendingDown size={16} className="text-green" /> : urgeTrend.direction === 'up' ? <TrendingUp size={16} className="text-peach" /> : <Activity size={16} className="text-overlay1" />} Urge trend</span>}
      subtitle={urgeTrend.direction === 'down' ? 'Cravings are easing week over week' : urgeTrend.direction === 'up' ? 'Urges have picked up lately · lean on your plan' : 'Holding steady week to week'}
      help="Resisted urges bucketed into the last 8 weeks. A falling line is hard evidence that cravings genuinely weaken with abstinence — the brain re-regulates and the waves get smaller.">
      <div className="h-40 w-full" role="img" aria-label={`Weekly urge counts, oldest to newest: ${urgeTrend.weeks.map((w) => w.count).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={urgeTrend.weeks} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="urgeTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cat('mauve')} stopOpacity={0.35} />
                <stop offset="100%" stopColor={cat('mauve')} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={cat('surface0')} vertical={false} />
            <XAxis dataKey="weekStart" stroke={cat('overlay0')} fontSize={10} tickLine={false}
              tickFormatter={(d) => prettyDay(d as string).replace(/^\w+, /, '')} />
            <YAxis allowDecimals={false} stroke={cat('overlay0')} fontSize={11} />
            <Tooltip contentStyle={{ background: cat('mantle'), border: `1px solid ${cat('surface0')}`, borderRadius: 8, color: cat('text') }} cursor={{ stroke: cat('surface1') }}
              labelFormatter={(d) => `Week of ${prettyDay(d as string)}`}
              formatter={(v) => [`${v} urge${v === 1 ? '' : 's'}`, 'Resisted'] as [string, string]} />
            <Area type="monotone" dataKey="count" stroke={cat('mauve')} strokeWidth={2} fill="url(#urgeTrendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1.5 text-xs text-overlay0">Averaging <span className="font-medium" style={{ color: cat('mauve') }}>{urgeTrend.avgPerWeek}/week</span>{urgeTrend.delta !== 0 && <> · {urgeTrend.delta < 0 ? 'down' : 'up'} {Math.abs(urgeTrend.delta)} vs. 8 weeks ago</>}.</p>
    </Card>
  )
}
