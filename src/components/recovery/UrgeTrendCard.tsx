import { PersonSimpleRun, TrendDown, TrendUp } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceDot, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '../ui'
import { chartAxis, chartGrid } from '../page/chartStyle'
import { cat, onRaised, rechartsTooltip } from '../../lib/colors'
import { addDays, prettyDay } from '../../lib/date'
import type { urgeFrequencyTrend } from '../../lib/urge'
import type { Relapse } from '../../lib/types'

type Trend = ReturnType<typeof urgeFrequencyTrend>

/**
 * URGES PER WEEK, with the resets marked on it.
 *
 * ── It absorbed the page's "signature visual", because they were the same ──
 *
 * `PairedSparkline` sat above the rail as a permanent band titled "Urges
 * logged vs resets" — and it drew `urgeTrend.weeks`, which is the series THIS
 * card draws, over the same eight weeks. Two charts of one dataset on one
 * page, one of them always on screen. Reported as "move it somewhere else,
 * it's a waste of space here", and the honest answer was not to move a
 * near-copy but to delete it: its only extra information was a dot on the
 * weeks that contained a reset, and that is a marker, not a chart.
 *
 * So the resets are `ReferenceDot`s here, on the week they happened, in the
 * red this page already uses for a reset — and the standalone band is gone,
 * along with the `sparkBars` module it needed.
 *
 * ── On the house chart style ─────────────────────────────────────────────
 *
 * Migrated to `chartStyle.ts` in the same change: it was carrying its own
 * `stroke`, `fontSize` and tooltip object, with `overlay0` tick text — the
 * **2.57:1** pairing CLAUDE.md names as one of the sixteen the armed a11y gate
 * found. `chartAxis()` resolves `subtext0` instead, and resolves it per theme
 * at render rather than freezing mocha's value.
 */
export function UrgeTrendCard({ urgeTrend, relapses = [] }: {
  urgeTrend: Trend
  /** Marked on the week they fall in. */
  relapses?: Relapse[]
}) {
  /* One marker per WEEK that contains a reset, not one per reset: two resets
     in a week are still one week with resets, and two dots stacked on one x
     position read as a rendering fault. The count goes in the label. */
  const resetWeeks = urgeTrend.weeks
    .map((w) => {
      const end = addDays(w.weekStart, 6)
      const n = relapses.filter((r) => r.date >= w.weekStart && r.date <= end).length
      return { weekStart: w.weekStart, count: w.count, resets: n }
    })
    .filter((w) => w.resets > 0)

  return (
    <Card enlargeable band
      title={<span className="inline-flex items-center gap-2">{urgeTrend.direction === 'down' ? <Icon as={TrendDown} size="sm" className="text-green" /> : urgeTrend.direction === 'up' ? <Icon as={TrendUp} size="sm" className="text-peach" /> : <Icon as={PersonSimpleRun} size="sm" className="text-fg-2" />} Urge trend</span>}
      subtitle={urgeTrend.direction === 'down' ? 'Cravings are easing week over week' : urgeTrend.direction === 'up' ? 'Urges have picked up lately · lean on your plan' : 'Holding steady week to week'}>
      <div
        className="h-40 w-full"
        role="img"
        aria-label={
          `Weekly urge counts, oldest to newest: ${urgeTrend.weeks.map((w) => w.count).join(', ')}.`
          + (resetWeeks.length
            ? ` Resets in ${resetWeeks.length} of those weeks: ${resetWeeks.map((w) => `week of ${prettyDay(w.weekStart)}, ${w.resets}`).join('; ')}.`
            : ' No resets in this window.')
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={urgeTrend.weeks} margin={{ top: 10, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="urgeTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cat('mauve')} stopOpacity={0.35} />
                <stop offset="100%" stopColor={cat('mauve')} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartGrid()} />
            <XAxis dataKey="weekStart" {...chartAxis()}
              tickFormatter={(d) => prettyDay(d as string).replace(/^\w+, /, '')} />
            {/* THE Y AXIS IS VISIBLE NOW. It was `width={30}` behind a
                `left: -24` margin, which pushed the ticks off the canvas — so
                the chart had a scale nobody could read, and "add a light
                y-axis or value labels" was a fair review note about a control
                that was already there. */}
            <YAxis allowDecimals={false} {...chartAxis()} width={28} />
            <Tooltip contentStyle={rechartsTooltip()} cursor={{ stroke: cat('surface1') }}
              labelFormatter={(d) => `Week of ${prettyDay(d as string)}`}
              formatter={(v) => [`${v} urge${v === 1 ? '' : 's'}`, 'Logged'] as [string, string]} />
            <Area type="monotone" dataKey="count" stroke={cat('mauve')} strokeWidth={2} fill="url(#urgeTrendFill)" isAnimationActive={false} />
            {/* The resets, on the line. `r=4` with a ring, because a 2px dot
                was the thing the old band got wrong — reviewed as "the red
                reset dots are tiny". */}
            {resetWeeks.map((w) => (
              <ReferenceDot
                key={w.weekStart}
                x={w.weekStart}
                y={w.count}
                r={4}
                fill={cat('red')}
                stroke={cat('base')}
                strokeWidth={2}
                ifOverflow="extendDomain"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1.5 text-label text-fg-2">
        Averaging <span className="font-medium" style={{ color: onRaised('mauve') }}>{urgeTrend.avgPerWeek}/week</span>
        {urgeTrend.delta !== 0 && <> · {urgeTrend.delta < 0 ? 'down' : 'up'} {Math.abs(urgeTrend.delta)} vs. 8 weeks ago</>}.
        {resetWeeks.length > 0 && (
          <> A <span className="font-medium" style={{ color: onRaised('red') }}>red dot</span> marks a week with a reset.</>
        )}
      </p>
    </Card>
  )
}
