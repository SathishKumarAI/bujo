import { Hourglass } from 'lucide-react'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { timeReclaimed } from '../../lib/urge'

type Reclaimed = ReturnType<typeof timeReclaimed>

/**
 * Time / life reclaimed (#344) · per-day cost × clean days. The rate slider is
 * controlled by the parent (view-local state) so behaviour is unchanged.
 */
export function TimeReclaimedCard({
  reclaimed,
  totalClean,
  hoursPerDay,
  onHoursPerDayChange,
}: {
  reclaimed: Reclaimed
  totalClean: number
  hoursPerDay: number
  onHoursPerDayChange: (h: number) => void
}) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Hourglass size={16} className="text-teal" /> Time reclaimed</span>} subtitle="Hours you’d otherwise have lost · across all your clean days" help="An estimate of the life you’ve won back: set how many hours a day the behaviour used to cost you, and this multiplies it across your lifetime clean days. A concrete, non-financial reason every day counts.">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-extrabold leading-none" style={{ color: cat('teal') }}>{reclaimed.hours}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-overlay0">hours back</div>
        </div>
        <p className="flex-1 text-sm text-subtext0">
          That’s about <strong style={{ color: cat('teal') }}>{reclaimed.days} full day{reclaimed.days === 1 ? '' : 's'}</strong>{reclaimed.remHours > 0 && <> and {reclaimed.remHours}h</>} of life reclaimed across <strong>{totalClean}</strong> clean day{totalClean === 1 ? '' : 's'}.
        </p>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-subtext1">
          <label htmlFor="reclaim-rate">Hours/day it used to cost you</label>
          <span className="font-semibold" style={{ color: cat('teal') }}>{hoursPerDay}h</span>
        </div>
        <input id="reclaim-rate" type="range" min={0} max={8} step={1} value={hoursPerDay}
          onChange={(e) => onHoursPerDayChange(Number(e.target.value))}
          className="mt-1 w-full" style={{ accentColor: cat('teal') }} aria-label="Hours per day reclaimed, 0 to 8" />
      </div>
    </Card>
  )
}
