import { ChartBar } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '../ui'
import { cat, onRaised } from '../../lib/colors'
import type { LapseWeekday, LapseTrend } from '../../lib/lapse'

const DIRECTION: Record<LapseTrend['direction'], { word: string; tone: 'green' | 'red' | 'peach' }> = {
  down: { word: 'falling', tone: 'green' },
  flat: { word: 'flat', tone: 'peach' },
  up: { word: 'rising', tone: 'red' },
}

/**
 * How much, by weekday — the read-back that pays for collecting a count.
 *
 * Deliberately the same card as `RiskiestDaysCard` one row over, because it
 * answers the adjacent question and a second variant of a weekday bar chart on
 * one page would read as two unrelated things. That one counts lapse *days* per
 * weekday; this one averages *occurrences* per lapse day, which is the reading
 * the user asked for in so many words: "on Sunday I happen to smoke 10".
 *
 * A weekday with no lapse day has `avg: null` and draws no bar — not a zero
 * bar, which would claim a perfect Tuesday that was never observed. Recharts
 * skips nulls, so the gap is the honest mark.
 *
 * The trend is a sentence rather than a second chart: `UrgeTrendCard` already
 * owns the weekly-bars idiom on this page, and this card is one of eight in a
 * fold that is already the longest thing on the page.
 */
export function LapseCountCard({ name, byWeekday, peak, trend }: {
  name: string
  byWeekday: LapseWeekday[]
  peak: LapseWeekday
  trend: LapseTrend
}) {
  const dir = DIRECTION[trend.direction]
  return (
    <Card enlargeable band hideInfo
      title={<span className="inline-flex items-center gap-2"><Icon as={ChartBar} size="md" className="text-red" /> {name} · how many</span>}
      subtitle={`${peak.label}s average ${peak.avg} · your heaviest weekday`}
    >
      <div className="h-44 w-full" role="img" aria-label={`Average ${name} per lapse day by weekday: ${byWeekday.map((w) => `${w.label} ${w.avg == null ? 'none logged' : w.avg}`).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byWeekday} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={cat('surface0')} vertical={false} />
            <XAxis dataKey="label" stroke={cat('overlay0')} fontSize={11} tickLine={false} />
            <YAxis stroke={cat('overlay0')} fontSize={11} />
            <Tooltip contentStyle={{ background: cat('mantle'), border: `1px solid ${cat('surface0')}`, borderRadius: 8, color: onRaised('text') }} cursor={{ fill: cat('surface0') }}
              formatter={(v, _n, item) => {
                const w = item?.payload as LapseWeekday | undefined
                return [`${v} on average · ${w?.days ?? 0} day${w?.days === 1 ? '' : 's'}, ${w?.total ?? 0} in total`, 'Per lapse day'] as [string, string]
              }} />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {byWeekday.map((w) => <Cell key={w.day} fill={w.day === peak.day ? cat('red') : cat('surface1')} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1.5 text-label text-fg-2">
        A bar is the average of the days it actually happened, so a clean {peak.label} does not flatter the number — an empty weekday means none logged, not zero.
      </p>
      <p className="mt-1 text-label text-fg-2">
        Last {trend.weeks.length} weeks: <span className="font-medium text-fg-1">{trend.total}</span> in total,{' '}
        <span className="font-medium text-fg-1">{trend.avgPerWeek}</span>/week ·{' '}
        <span className="font-medium" style={{ color: onRaised(dir.tone) }}>{dir.word}</span>
        {trend.delta !== 0 && <> ({trend.delta > 0 ? '+' : ''}{trend.delta}/week against the first half)</>}
      </p>
    </Card>
  )
}
