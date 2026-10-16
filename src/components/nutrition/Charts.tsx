import {
  Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Icon } from '@/components/Icon'
import { CalendarBlank, Heartbeat } from '@/components/icons'
import { Card } from '../ui'
import { CalendarHeatmap } from '../page'
import { chartAxis, chartGrid, compactNum } from '../page/chartStyle'
import { cat, onRaised, rechartsTooltip } from '../../lib/colors'
import type { Targets } from '../../lib/nutritionReview'
import { bestInTargetRun, extremes, type DayPoint } from '../../lib/nutritionSeries'

/**
 * NUTRITION OVER TIME · the two pictures the Trend row is built around.
 *
 * WHAT THIS FILE OWNS: how eight weeks of intake are drawn, and what each
 * card's subtitle says it found.
 * WHAT IT DOES NOT OWN: the series (`lib/nutritionSeries.ts`), or which row
 * they sit on (`Review.tsx`).
 *
 * Asked for as *"add one more heat map, showing how many calories I have taken
 * by day … and some kind of wavy texture which shows high end peaks and low
 * peaks"* — two different questions about the same days, which is why they are
 * two cards and not one:
 *
 * | Card | Answers | Reads |
 * |---|---|---|
 * | The wave | is my intake steady, and where does it spike | left to right, against a line |
 * | The calendar | which days do I even log, over months | as a block, at a glance |
 *
 * **A gap is drawn as a gap.** `connectNulls={false}`: a day nobody logged is
 * `null` in the series, and joining across it would draw a straight line
 * through a hole and call it a steady week. The same rule the heatmap gets for
 * free by treating zero as empty.
 *
 * **Every subtitle states the FINDING** (§21): "Steadiest fortnight yet · 420
 * kcal between the biggest and smallest day", not "calories per day".
 */

/* ── The wave ─────────────────────────────────────────────────────────────── */

export function CalorieWaveCard({ series, targets }: {
  series: DayPoint[]
  targets: Targets
}) {
  const e = extremes(series)
  const run = bestInTargetRun(series, targets)

  /*
    THE SUBTITLE IS THE VERDICT, and it degrades rather than disappearing.
    Under the floor it says what is missing instead of printing a spread
    computed from two days, which is the "a floor of two is not a floor" trap
    with a chart in front of it.
  */
  const subtitle = e.spread == null
    ? `${e.logged} day${e.logged === 1 ? '' : 's'} logged — a few more and this shows where your spikes are`
    : `${e.spread.toLocaleString()} kcal between your biggest and smallest day`
      + (run >= 3 ? ` · best run inside target: ${run} days` : '')

  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={Heartbeat} size="md" style={{ color: onRaised('sky') }} /> Day by day</span>}
      subtitle={subtitle}
    >
      <div className="h-48" role="img" aria-label={`Area chart of calories per day against a target of ${targets.calories}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
            <defs>
              {/* The fill carries the wave; the stroke carries the shape. A
                  flat fill at one opacity made the peaks and the floor look
                  like the same quantity. */}
              <linearGradient id="nut-wave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cat('sky')} stopOpacity={0.45} />
                <stop offset="100%" stopColor={cat('sky')} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/*
              THE TARGET BAND, not just the target line. A single rule turns
              every day into a pass or a fail, and a target is an aim — the
              five per cent slack the whole page judges by is drawn, so a day
              one kcal over does not read as a miss. Same number as
              `OVER_SLACK`, taken from the same place.
            */}
            <ReferenceArea
              y1={targets.calories}
              y2={Math.round(targets.calories * 1.05)}
              fill={cat('green')}
              fillOpacity={0.12}
              ifOverflow="extendDomain"
            />
            <CartesianGrid {...chartGrid()} />
            <XAxis dataKey="label" {...chartAxis()} />
            <YAxis domain={['auto', 'auto']} {...chartAxis()} tickFormatter={compactNum} width={44} />
            <Tooltip
              contentStyle={rechartsTooltip()}
              formatter={(v) => [`${Number(v).toLocaleString()} kcal`, 'Eaten'] as [string, string]}
            />
            <ReferenceLine
              y={targets.calories}
              stroke={cat('green')}
              strokeDasharray="4 4"
              label={{ value: 'target', position: 'insideTopRight', fill: cat('subtext0'), fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="kcal"
              stroke={cat('sky')}
              strokeWidth={2}
              fill="url(#nut-wave)"
              /* A day nobody logged is a HOLE, not a zero and not a straight
                 line across. See `lib/nutritionSeries.ts`. */
              connectNulls={false}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-micro text-fg-2">
        The band is your target and the five per cent a target is allowed. A break in the line is a day you did not log — not a day you ate nothing.
      </p>
    </Card>
  )
}

/* ── The calendar ─────────────────────────────────────────────────────────── */

export function CalorieCalendarCard({ cells, targets, weeks = 20 }: {
  cells: { date: string; value: number }[]
  targets: Targets
  /** Columns, and therefore how much of the card's width the grid fills. */
  weeks?: number
}) {
  const logged = cells.filter((c) => c.value > 0)
  const share = cells.length === 0 ? 0 : Math.round((logged.length / cells.length) * 100)

  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={CalendarBlank} size="md" style={{ color: onRaised('mauve') }} /> Calories by day</span>}
      subtitle={logged.length === 0
        ? 'Nothing logged in this window yet'
        : `${logged.length} of ${cells.length} days logged · ${share}% of the window`}
    >
      {/*
        `fluid`, because this card has a column to itself in the review grid and
        a fixed 11px cell would leave 300px of empty space beside a postage
        stamp — the note `CalendarHeatmap` carries about its own `size` prop.
      */}
      <CalendarHeatmap
        weeks={weeks}
        data={cells}
        fluid
        color="mauve"
        unit="kcal"
        label={`Calories eaten per day over the last ${weeks} weeks`}
        storageKey="nutrition.heat"
      />
      <p className="mt-2 text-micro text-fg-2">
        {/* SAYING WHAT THE RAMP MEANS, because it is not the usual one. Every
            other calendar in this app fills a cell because you showed up, so
            darker is better; here darker is only bigger, and a 3,000 kcal day
            is not an achievement. The component cannot know that — the caller
            has to say it. */}
        Darker is a bigger day, not a better one — {targets.calories.toLocaleString()} kcal is the aim. An empty cell is a day with nothing logged.
      </p>
    </Card>
  )
}
