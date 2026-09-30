import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cat, rechartsTooltip } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { CycleSpan } from '../../lib/cycleInsights'

/** The clinically normal range. Outside it twice running is a "talk to someone". */
const NORMAL = { from: 21, to: 35 }

/**
 * CYCLE LENGTH OVER TIME · is this regular, and is it changing?
 *
 * The page could say "28-day avg" and nothing else, which is the one number
 * that hides the answer: 28 is also the average of 21 and 35. Regularity is
 * variance, so it has to be drawn.
 *
 * Two references do the interpreting so the reader does not have to hold the
 * numbers: a shaded 21–35 band (the normal range the page's own disclaimer
 * names) and a dashed line at the personal average. A bar outside the band is
 * visible without reading an axis, which is the point.
 *
 * **The cycle in progress is excluded, not drawn short.** `cycleHistory`
 * marks it `current` because its length is a floor, and a 12-day bar beside
 * four 28s reads as a cycle that collapsed rather than one that has not
 * finished. It gets a sentence under the chart instead.
 */
export function CycleHistoryChart({ history, average, unitLabel = 'days' }: {
  history: CycleSpan[]
  average: number | null
  unitLabel?: string
}) {
  const done = history.filter((c) => !c.current)
  const running = history.find((c) => c.current)

  if (done.length === 0) {
    return (
      <p className="text-label text-fg-2">
        Cycle lengths appear once a second period is logged — the gap between two starts is the
        first thing this log can measure.
      </p>
    )
  }

  const rows = done.map((c) => ({
    label: prettyDay(c.start),
    length: c.length,
    periodDays: c.periodDays,
    outside: c.length < NORMAL.from || c.length > NORMAL.to,
  }))
  /**
   * THE AXIS STARTS NEAR THE DATA, NOT AT ZERO.
   *
   * It used to run 0 → max, which spent three quarters of the plot on lengths
   * no cycle has: every bar reached nearly the top and the difference between a
   * 26-day cycle and a 34-day one — the only thing this chart is for — was a few
   * pixels of bar height. A zero baseline is right when the question is "how
   * much"; here the question is "how much does it VARY", and the 21–35 band is
   * the reference the eye should measure against.
   *
   * Floor and ceiling are pinned around that band so the shaded region stays
   * fully visible and the scale does not jump between visits as cycles change.
   */
  const min = Math.min(NORMAL.from - 3, ...rows.map((r) => r.length - 2))
  const max = Math.max(NORMAL.to + 3, ...rows.map((r) => r.length + 2))

  return (
    <>
      <div className="h-52 w-full" role="img" aria-label={`Bar chart of the last ${rows.length} cycle lengths in ${unitLabel}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" vertical={false} />
            <ReferenceArea y1={NORMAL.from} y2={NORMAL.to} fill={cat('green')} fillOpacity={0.08} />
            <XAxis dataKey="label" stroke={cat('overlay0')} fontSize={11} />
            <YAxis domain={[min, max]} allowDecimals={false} stroke={cat('overlay0')} fontSize={11} />
            <Tooltip contentStyle={rechartsTooltip()} formatter={(v) => [`${v} ${unitLabel}`, 'Cycle']} />
            {average != null && (
              <ReferenceLine
                y={average}
                stroke={cat('mauve')}
                strokeDasharray="4 3"
                label={{ value: `avg ${average}`, position: 'right', fill: cat('subtext0'), fontSize: 10 }}
              />
            )}
            {/* A neutral surface for an in-range cycle: a row of accent bars
                made the chart the loudest thing on the page while saying
                nothing the axis does not. `peach` stays on the out-of-range
                ones, where it carries meaning — that is what the shaded 21-35
                band is for. The accent is now on the average line alone. */}
            <Bar dataKey="length" radius={[3, 3, 0, 0]}>
              {rows.map((r, i) => (
                <Cell key={i} fill={cat(r.outside ? 'peach' : 'surface2')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-label text-fg-2">
        The shaded band is the usual 21–35 day range; the dashed line is your own average.
        {running && (
          <> The cycle that started {prettyDay(running.start)} is still running (day {running.length}), so it is not on the chart yet.</>
        )}
      </p>
    </>
  )
}
