import { Clock } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { onRaised } from '../../lib/colors'
import { HourStrip } from './HourStrip'
import type { urgeHourHistogram, peakUrgeHour } from '../../lib/urge'

type HourHist = ReturnType<typeof urgeHourHistogram>
type PeakHour = NonNullable<ReturnType<typeof peakUrgeHour>>

/**
 * High-risk hour heatmap (#114) · 24h clock shaded from urge timestamps.
 *
 * Pooled across every addiction, on purpose: this is "when do urges hit me",
 * and the per-addiction split of the same question lives in
 * `AddictionBreakdownCard`, which reuses the same `HourStrip` rather than
 * drawing a second clock of its own. The grid, its alpha ramp and its
 * hard-won cell-text contrast moved there when the second caller appeared.
 */
export function HighRiskHoursCard({ hourHist, peakHour }: { hourHist: HourHist; peakHour: PeakHour }) {
  return (
    <Card band hideInfo title={<span className="inline-flex items-center gap-2"><Icon as={Clock} size="md" className="text-peach" /> High-risk hours</span>} subtitle={`Urges cluster around ${peakHour.label}, pre-plan a defense`}>
      <HourStrip hourHist={hourHist} label={`Hour-of-day urge heatmap; peak at ${peakHour.label} with ${peakHour.count} urges`} />
      <p className="mt-1.5 text-label text-fg-2">Tallest heat at <span className="font-medium" style={{ color: onRaised('peach') }}>{peakHour.label}</span> · {peakHour.count} urge{peakHour.count === 1 ? '' : 's'}.</p>
    </Card>
  )
}
