import { cat } from '../../lib/colors'
import { addDays, prettyDay } from '../../lib/date'

/**
 * Two series over the same eight weeks: urges resisted (bars) and resets
 * (marks). Paired rather than stacked, because the question is whether one
 * moves against the other — a stack would hide exactly the comparison.
 *
 * Neutral fill for urges, and the reset marks carry the only colour, because
 * they are the thing you are looking for.
 */
export function PairedSparkline({ weeks, relapses }: {
  weeks: { weekStart: string; count: number }[]
  relapses: { date: string }[]
}) {
  const max = Math.max(1, ...weeks.map((w) => w.count))
  const resetsIn = (weekStart: string) => {
    const end = addDays(weekStart, 6)
    return relapses.filter((r) => r.date >= weekStart && r.date <= end).length
  }
  return (
    <div>
      {/* The frame draws at zero data — an empty axis says "this is where the
          comparison goes", where a hidden chart says nothing at all. */}
      <div className="flex h-24 items-end gap-1.5 border-b border-line" role="img" aria-label={
        weeks.length === 0
          ? 'Urges and resets by week: nothing logged yet'
          : `Urges resisted and resets over ${weeks.length} weeks: ${weeks.map((w) => `week of ${prettyDay(w.weekStart)}, ${w.count} urges, ${resetsIn(w.weekStart)} resets`).join('; ')}`
      }>
        {weeks.map((w) => {
          const resets = resetsIn(w.weekStart)
          return (
            <div key={w.weekStart} className="relative flex flex-1 flex-col justify-end" title={`Week of ${prettyDay(w.weekStart)}: ${w.count} urges resisted, ${resets} reset${resets === 1 ? '' : 's'}`}>
              {resets > 0 && (
                <span className="mx-auto mb-0.5 block h-1.5 w-1.5 rounded-control" style={{ background: cat('red') }} />
              )}
              {/* A zero week draws a visible stub, not a 2%-of-96px hairline.
                  At `Math.max(2, …)` an empty chart rendered ~2px of `ink-3`
                  under a baseline and read as a chart that had failed to draw
                  — the frame was there and said nothing. The stub is the
                  lighter inset tier so a real one-urge week still reads as
                  taller and darker than "no urges". */}
              <div
                className={`rounded-t ${w.count > 0 ? 'bg-ink-3' : 'bg-ink-2'}`}
                style={{ height: w.count > 0 ? `${Math.max(6, (w.count / max) * 100)}%` : '6px' }}
              />
            </div>
          )
        })}
      </div>
      <p className="mt-1 text-micro text-fg-2">
        {weeks.every((w) => w.count === 0)
          ? 'No urges logged yet · each column is a week, and bars grow as you log them'
          : 'Bars are urges resisted per week · a dot marks a week with a reset'}
      </p>
    </div>
  )
}
