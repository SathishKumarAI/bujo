import { Clock } from 'lucide-react'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { urgeHourHistogram, peakUrgeHour } from '../../lib/urge'

type HourHist = ReturnType<typeof urgeHourHistogram>
type PeakHour = NonNullable<ReturnType<typeof peakUrgeHour>>

/** High-risk hour heatmap (#114) · 24h clock shaded from urge timestamps. */
export function HighRiskHoursCard({ hourHist, peakHour }: { hourHist: HourHist; peakHour: PeakHour }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Clock size={16} className="text-peach" /> High-risk hours</span>} subtitle={`Urges cluster around ${peakHour.label} · pre-plan a defense`} help="Each cell is an hour of the day, shaded by how many urges you logged then (from their timestamps). Your peak hours are when to remove cues and have your plan ready before the craving hits.">
      <div className="grid grid-cols-12 gap-1" role="img" aria-label={`Hour-of-day urge heatmap; peak at ${peakHour.label} with ${peakHour.count} urges`}>
        {hourHist.map((h) => (
          <div key={h.hour} title={`${h.count} urge${h.count === 1 ? '' : 's'} around ${((h.hour % 12) === 0 ? 12 : h.hour % 12)}${h.hour < 12 ? 'am' : 'pm'}`}
            className="grid aspect-square place-items-center rounded text-[9px]"
            style={{
              background: h.count > 0 ? cat('peach') + Math.round(38 + h.heat * 217).toString(16).padStart(2, '0') : cat('surface0'),
              color: h.heat > 0.5 ? cat('crust') : cat('overlay0'),
            }}>
            {h.hour % 6 === 0 ? h.hour : ''}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-overlay0"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span></div>
      <p className="mt-1.5 text-xs text-overlay0">Tallest heat at <span className="font-medium" style={{ color: cat('peach') }}>{peakHour.label}</span> · {peakHour.count} urge{peakHour.count === 1 ? '' : 's'}.</p>
    </Card>
  )
}
