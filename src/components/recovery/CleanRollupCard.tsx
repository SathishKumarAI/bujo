import { CalendarRange, CalendarCheck } from 'lucide-react'
import { Card, StatTile } from '../ui'
import type { cleanRollup } from '../../lib/urge'

type Rollup = ReturnType<typeof cleanRollup>

/** Relapse-free week / month rollup (#322) · reward sustained clean windows. */
export function CleanRollupCard({ rollup }: { rollup: Rollup }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><CalendarRange size={16} className="text-teal" /> Clean weeks &amp; months</span>} subtitle="Fully reset-free windows across your whole journey" help="Counts of calendar weeks and months with zero resets since you started tracking. Rewarding sustained clean windows — not just single days — keeps a stumble from feeling like total failure.">
      <div className="grid grid-cols-2 gap-3">
        <StatTile compact label="Clean weeks" value={`${rollup.cleanWeeks}/${rollup.totalWeeks}`} color="teal" icon={<CalendarCheck size={14} />} />
        <StatTile compact label="Clean months" value={`${rollup.cleanMonths}/${rollup.totalMonths}`} color="green" icon={<CalendarRange size={14} />} />
      </div>
      <p className="mt-2 text-xs text-overlay0">{rollup.cleanWeeks} of {rollup.totalWeeks} weeks and {rollup.cleanMonths} of {rollup.totalMonths} month{rollup.totalMonths === 1 ? '' : 's'} stayed fully reset-free.</p>
    </Card>
  )
}
