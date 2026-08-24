import { Band, BandCell, BandRow } from '../mod'
import { cat } from '../../lib/colors'
import { cumulativeHours, dailyCodingMinutes, deepWorkHeatmap, formatMinutes } from '../../lib/focus'
import type { JournalData } from '../../lib/types'

/**
 * The review zone: the last fourteen days, all-time momentum, and six months of
 * days.
 *
 * Owns three charts, all plain DOM or one inline `<svg>` — no chart library for
 * fourteen bars and a polyline.
 *
 * These lived behind a default-collapsed "Focus analytics" fold. A fold is
 * where a chart goes to be forgotten, and `npm run a11y` cannot see inside one
 * either, so they were also unscanned for as long as they existed.
 */
export function FocusCharts({ data, today }: { data: JournalData; today: string }) {
  const series = dailyCodingMinutes(data, today, 14)
  const maxDay = Math.max(60, ...series.map((s) => s.min))
  const cum = cumulativeHours(data)
  const heat = deepWorkHeatmap(data, today, 26)

  const W = 600
  const H = 120
  const cumMax = cum.length ? cum[cum.length - 1].hours || 1 : 1
  const points = cum.map((c, i) => `${(i / Math.max(1, cum.length - 1)) * W},${H - (c.hours / cumMax) * H}`).join(' ')

  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[22rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Coding minutes</h2>
          <p className="mt-1 mb-4 text-label text-fg-2">Last 14 days · today is the accent bar.</p>
          <div
            className="flex items-end gap-1.5"
            style={{ height: 96 }}
            role="img"
            aria-label={`Coding minutes per day over the last 14 days: ${series.map((s) => `${s.date} ${s.min} minutes`).join(', ')}`}
          >
            {series.map((s) => (
              <div key={s.date} className="flex h-full flex-1 items-end" title={`${s.date}: ${formatMinutes(s.min)}`}>
                <div
                  className={s.date === today ? 'w-full bg-brand' : 'w-full bg-fg-1'}
                  style={{ height: `${Math.max(2, (s.min / maxDay) * 100)}%` }}
                />
              </div>
            ))}
          </div>

          {cum.length >= 2 && (
            <div className="mt-8">
              <h3 className="font-display text-label font-medium text-fg-1">Cumulative hours</h3>
              <p className="mt-1 mb-3 text-label text-fg-2">
                {cum[cum.length - 1].hours}h all-time, over {cum.length} days.
              </p>
              <div
                className="w-full"
                role="img"
                aria-label={`Cumulative coding hours, reaching ${cum[cum.length - 1].hours} hours`}
              >
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 w-full">
                  <polyline points={points} fill="none" stroke={cat('text')} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>
          )}
        </BandCell>

        <BandCell className="basis-[20rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Deep-work days</h2>
          <p className="mt-1 mb-4 text-label text-fg-2">Daily minutes, last 26 weeks.</p>
          {heat.max > 0 ? (
            <>
              <div className="overflow-x-auto" tabIndex={0} role="group" aria-label="Deep-work heatmap, scrollable">
                <div
                  className="grid w-max gap-[3px]"
                  style={{ gridTemplateRows: 'repeat(7, 11px)', gridAutoFlow: 'column', gridAutoColumns: '11px' }}
                  role="img"
                  aria-label={`Daily coding minutes over the last 26 weeks, busiest day ${heat.max} minutes`}
                >
                  {heat.cells.map((c) => (
                    <div
                      key={c.date}
                      title={`${c.date}: ${formatMinutes(c.min)}`}
                      style={{
                        gridRow: c.weekday + 1,
                        background: c.level === 0 ? cat('surface0') : cat('mauve'),
                        opacity: c.level === 0 ? 1 : 0.25 + (c.level / 4) * 0.75,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-micro text-fg-3">
                <span>less</span>
                {[0, 1, 2, 3, 4].map((lv) => (
                  <span
                    key={lv}
                    className="size-2.5"
                    style={{
                      background: lv === 0 ? cat('surface0') : cat('mauve'),
                      opacity: lv === 0 ? 1 : 0.25 + (lv / 4) * 0.75,
                    }}
                  />
                ))}
                <span>more</span>
              </div>
            </>
          ) : (
            <p className="text-label text-fg-3">Nothing logged yet — the grid fills in one day at a time.</p>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
