import { CalendarX } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { relapseWeekdayPattern, peakRelapseWeekday } from '../../lib/urge'

type WeekdayPattern = ReturnType<typeof relapseWeekdayPattern>
type PeakWeekday = NonNullable<ReturnType<typeof peakRelapseWeekday>>

/** Day-of-week relapse pattern (#263) · weekday bar chart from reset dates. */
export function RiskiestDaysCard({ weekdayPattern, peakWeekday }: { weekdayPattern: WeekdayPattern; peakWeekday: PeakWeekday }) {
  return (
    <Card band hideInfo title={<span className="inline-flex items-center gap-2"><Icon as={CalendarX} size="md" className="text-red" /> Riskiest days</span>} subtitle={`${peakWeekday.label} is your highest-reset weekday`}>
      <div className="h-44 w-full" role="img" aria-label={`Relapses by weekday: ${weekdayPattern.map((w) => `${w.count} on ${w.label}`).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekdayPattern} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={cat('surface0')} vertical={false} />
            <XAxis dataKey="label" stroke={cat('overlay0')} fontSize={11} tickLine={false} />
            <YAxis allowDecimals={false} stroke={cat('overlay0')} fontSize={11} />
            <Tooltip contentStyle={{ background: cat('mantle'), border: `1px solid ${cat('surface0')}`, borderRadius: 8, color: cat('text') }} cursor={{ fill: cat('surface0') }}
              formatter={(v) => [`${v} reset${v === 1 ? '' : 's'}`, 'Resets'] as [string, string]} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {weekdayPattern.map((w) => <Cell key={w.day} fill={w.day === peakWeekday.day ? cat('red') : cat('surface1')} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1.5 text-label text-fg-2">Most resets land on <span className="font-medium" style={{ color: cat('red') }}>{peakWeekday.label}</span> · plan extra support there.</p>
    </Card>
  )
}
