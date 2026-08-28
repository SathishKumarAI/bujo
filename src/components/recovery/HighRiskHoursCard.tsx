import { Clock } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { cat, onAccent } from '../../lib/colors'
import type { urgeHourHistogram, peakUrgeHour } from '../../lib/urge'

type HourHist = ReturnType<typeof urgeHourHistogram>
type PeakHour = NonNullable<ReturnType<typeof peakUrgeHour>>

/** High-risk hour heatmap (#114) · 24h clock shaded from urge timestamps. */
export function HighRiskHoursCard({ hourHist, peakHour }: { hourHist: HourHist; peakHour: PeakHour }) {
  return (
    <Card band hideInfo title={<span className="inline-flex items-center gap-2"><Icon as={Clock} size="md" className="text-peach" /> High-risk hours</span>} subtitle={`Urges cluster around ${peakHour.label}, pre-plan a defense`}>
      <div className="grid grid-cols-12 gap-1" role="img" aria-label={`Hour-of-day urge heatmap; peak at ${peakHour.label} with ${peakHour.count} urges`}>
        {hourHist.map((h) => (
          <div key={h.hour} title={`${h.count} urge${h.count === 1 ? '' : 's'} around ${((h.hour % 12) === 0 ? 12 : h.hour % 12)}${h.hour < 12 ? 'am' : 'pm'}`}
            className="grid aspect-square place-items-center rounded text-micro"
            style={{
              background: h.count > 0 ? cat('peach') + Math.round(38 + h.heat * 217).toString(16).padStart(2, '0') : cat('surface0'),
              // `overlay0` on the empty-cell `surface0` measured **2.57:1** at
              // 10px — the same pairing, the same number and the same cause as
              // the Stats mood calendar, which is the fourth time this exact
              // combination has been written in this app. `crust` is the
              // light-on-saturated half; applying its partner to the *neutral*
              // background is the mistake each time. `subtext0` is the next
              // step up, still clearly quieter than a hot cell, and clears 4.5
              // in all five themes.
              //
              // Only the four `hour % 6 === 0` cells print a digit, so this hid
              // behind two labels — 12pm and 6pm, whenever those hours had no
              // urges logged.
              color: h.heat > 0.5 ? onAccent(cat('peach')) : cat('subtext0'),
            }}>
            {h.hour % 6 === 0 ? h.hour : ''}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-micro text-fg-2"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span></div>
      <p className="mt-1.5 text-label text-fg-2">Tallest heat at <span className="font-medium" style={{ color: cat('peach') }}>{peakHour.label}</span> · {peakHour.count} urge{peakHour.count === 1 ? '' : 's'}.</p>
    </Card>
  )
}
