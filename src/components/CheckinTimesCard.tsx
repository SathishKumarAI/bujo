import { useJournal } from '../store'
import { Card, Empty } from './ui'
import { cat } from '../lib/colors'
import { completionByHour, totalCheckins, peakHour, fmtHour } from '../lib/checkin'

/**
 * When-you-check-in analysis (Habitify-style time-of-day insight). Built from
 * the completion timestamps recorded when habits are checked. A 24-hour bar
 * chart with the peak hour highlighted.
 */
export function CheckinTimesCard() {
  const { data } = useJournal()
  const hours = completionByHour(data)
  const total = totalCheckins(hours)
  const peak = peakHour(hours)
  const max = Math.max(1, ...hours)

  return (
    <Card title="When you check in" subtitle={peak != null ? `You’re most consistent around ${fmtHour(peak)}` : 'Time-of-day pattern of your habit check-ins'}>
      {total === 0 ? (
        <Empty>Check off some habits and your time-of-day pattern shows up here.</Empty>
      ) : (
        <>
          <div className="flex h-28 items-end gap-px" role="img" aria-label="Bar chart of habit check-ins by hour of day">
            {hours.map((c, h) => (
              <div key={h} className="group flex flex-1 flex-col items-center justify-end" title={`${fmtHour(h)} · ${c} check-in${c === 1 ? '' : 's'}`}>
                <div
                  className="w-full rounded-sm"
                  style={{ height: `${Math.max(c ? 6 : 1, (c / max) * 100)}%`, background: h === peak ? cat('mauve') : cat('surface2'), opacity: c ? 1 : 0.4 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-overlay0">
            <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
          </div>
        </>
      )}
    </Card>
  )
}
