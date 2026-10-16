import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Icon } from '@/components/Icon'
import { ChartBar, Gauge, Person } from '@/components/icons'
import { Card } from '../ui'
import { chartAxis, chartGrid, compactNum } from '../page/chartStyle'
import { cat, onRaised, rechartsTooltip } from '../../lib/colors'

/**
 * Strength's three time-series cards.
 *
 * WHAT THIS FILE OWNS: how a trend on this page is drawn, and what its
 * subtitle says about it.
 * WHAT IT DOES NOT OWN: the data (the view computes it), or which row they are
 * on (`Review.tsx`).
 *
 * Lifted out of `views/Gym.tsx`, where all three were inline inside the folds —
 * ~120 lines of chart markup in the middle of a 781-line view, which is why
 * nobody had looked at them since they were written.
 *
 * **Every subtitle states the FINDING, not the title again** (§21 of
 * `REUSABLE-PATTERNS.md`): "Heaviest week in eight · 12.4k", not "weekly
 * working-set volume". A chart that needs you to read it to find out whether
 * anything happened is a chart you skip.
 *
 * **The current week is drawn differently, because it is not finished.** The
 * last bar covers a week that has not happened yet in full, and a short bar at
 * the right-hand end reads as a collapse rather than as Tuesday. Same family as
 * the heatmap trap in CLAUDE.md: a day that has not happened is not a rest day.
 */

/* ── Volume ───────────────────────────────────────────────────────────────── */

export function VolumeTrendCard({ series, unit, focusEx, progression, e1rm }: {
  series: { label: string; volume: number }[]
  unit: string
  /** When a lift is focused, its own two trends sit under the bars. */
  focusEx: string | null
  progression: { date: string; weight: number }[]
  e1rm: { date: string; e1rm: number }[]
}) {
  const vols = series.map((s) => s.volume)
  const best = Math.max(0, ...vols)
  const done = series.slice(0, -1).filter((s) => s.volume > 0)
  const mean = done.length ? Math.round(done.reduce((a, s) => a + s.volume, 0) / done.length) : 0
  const now = series.length ? series[series.length - 1] : null
  const vsMean = now && mean > 0 ? Math.round(((now.volume - mean) / mean) * 100) : null

  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={ChartBar} size="md" className="text-mauve" /> Training volume</span>}
      /* The finding: where this week sits against your own average, which is
         the only comparison that means anything for a number in kilogram-reps. */
      subtitle={
        now == null ? 'Weekly working-set volume (weight × reps)'
          : mean === 0 ? `This week ${compactNum(now.volume)} ${unit} · the first week with volume in it`
            : `This week ${compactNum(now.volume)} ${unit} · ${vsMean! >= 0 ? `${vsMean}% above` : `${Math.abs(vsMean!)}% below`} your eight-week average of ${compactNum(mean)}`
      }
      collapsible
      defer
      enlargeable
    >
      <div className="h-44" role="img" aria-label={`Bar chart of weekly working-set volume in ${unit}, ${series.length} weeks, newest last`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid {...chartGrid()} />
            <XAxis dataKey="label" {...chartAxis()} />
            <YAxis {...chartAxis()} tickFormatter={compactNum} width={42} />
            <Tooltip contentStyle={rechartsTooltip()} formatter={(v) => [`${Number(v).toLocaleString()} ${unit}`, 'Volume']} />
            {/* The average is the line you are actually asking about. Dashed,
                because it is a reference rather than a measurement. */}
            {mean > 0 && (
              <ReferenceLine
                y={mean}
                stroke={cat('overlay1')}
                strokeDasharray="4 4"
                /* `insideTopRight`, measured: at `position: 'right'` the label
                   sits outside the plot area and the chart's 4px right margin
                   clipped it to nothing — the dashed line was drawn with no
                   word against it. */
                label={{ value: 'avg', position: 'insideTopRight', fill: cat('subtext0'), fontSize: 10 }}
              />
            )}
            <Bar dataKey="volume" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {series.map((s, i) => (
                /* The best week earns the accent; the current one is quieter
                   because it is still being filled in, and every other week is
                   the neutral fill. Three states, not a gradient. */
                <Cell
                  key={s.label}
                  fill={i === series.length - 1 ? cat('surface2') : s.volume === best && best > 0 ? cat('mauve') : cat('overlay0')}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-micro text-fg-2">
        The last bar is the week in progress, so it is drawn quietly — it is not a drop.
      </p>

      {focusEx && progression.length > 1 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-1 text-label text-fg-2">{focusEx} · heaviest set per day ({unit})</p>
          <div className="h-40" role="img" aria-label={`Line chart of the heaviest ${focusEx} set per day in ${unit}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progression} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="gym-prog" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cat('green')} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={cat('green')} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...chartGrid()} />
                <XAxis dataKey="date" {...chartAxis()} />
                <YAxis domain={['auto', 'auto']} {...chartAxis()} tickFormatter={compactNum} width={42} />
                <Tooltip contentStyle={rechartsTooltip()} />
                <Area type="monotone" dataKey="weight" stroke={cat('green')} strokeWidth={2} fill="url(#gym-prog)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {focusEx && e1rm.length > 1 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-1 text-label text-fg-2">{focusEx} · estimated 1RM ({unit}) · credits rep PRs, not just top weight</p>
          <div className="h-40" role="img" aria-label={`Line chart of estimated one-rep max for ${focusEx} per day in ${unit}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={e1rm} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid {...chartGrid()} />
                <XAxis dataKey="date" {...chartAxis()} />
                <YAxis domain={['auto', 'auto']} {...chartAxis()} tickFormatter={compactNum} width={42} />
                <Tooltip contentStyle={rechartsTooltip()} />
                <Line type="monotone" dataKey="e1rm" stroke={cat('yellow')} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ── Effort ───────────────────────────────────────────────────────────────── */

/**
 * Session RPE, with the line that makes it a verdict.
 *
 * A bare 1–10 line says nothing on its own — the question is whether you are
 * sitting above the band you can recover from. 8 is the reference, so a run of
 * sessions over it is visible without reading a single tick.
 */
export function EffortTrendCard({ series }: { series: { date: string; rpe: number | undefined }[] }) {
  const vals = series.map((s) => s.rpe ?? 0).filter((v) => v > 0)
  const mean = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
  const hard = vals.filter((v) => v >= 8).length
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={Gauge} size="md" className="text-red" /> Effort trend</span>}
      subtitle={
        vals.length === 0 ? 'Perceived exertion per session'
          : `Averaging ${mean} of 10 across ${vals.length} sessions · ${hard} at 8 or over`
      }
      collapsible
      defer
      enlargeable
    >
      <div className="h-44" role="img" aria-label={`Line chart of session RPE from 1 to 10 over the last ${series.length} workouts`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="gym-rpe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cat('red')} stopOpacity={0.3} />
                <stop offset="100%" stopColor={cat('red')} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartGrid()} />
            <XAxis dataKey="date" {...chartAxis()} />
            {/* `width={30}`, measured: at 24 the two-character ticks were
                clipped to nothing by the negative left margin and the chart
                rendered with no scale at all. */}
            <YAxis domain={[0, 10]} ticks={[0, 5, 8, 10]} {...chartAxis()} width={30} />
            <Tooltip contentStyle={rechartsTooltip()} />
            <ReferenceLine
              y={8}
              stroke={cat('peach')}
              strokeDasharray="4 4"
              label={{ value: 'hard', position: 'right', fill: cat('subtext0'), fontSize: 10 }}
            />
            <Area type="monotone" dataKey="rpe" stroke={cat('red')} strokeWidth={2} fill="url(#gym-rpe)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-micro text-fg-2">Sitting above the dashed line for weeks is the shape that precedes an injury, not progress.</p>
    </Card>
  )
}

/* ── Body weight ──────────────────────────────────────────────────────────── */

/**
 * Weight, raw and smoothed.
 *
 * The raw series is deliberately the quiet one: day-to-day weight is mostly
 * water, and a bold line through it invites reading noise as a trend. The
 * seven-point average is the signal, and the subtitle states the move over the
 * window so the card answers its own question.
 */
export function WeightTrendCard({ series, unit }: {
  series: { date: string; weight: number | undefined; avg: number }[]
  unit: string
}) {
  const first = series[0]?.avg
  const last = series[series.length - 1]?.avg
  const delta = first != null && last != null ? Math.round((last - first) * 10) / 10 : null
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={Person} size="md" className="text-sky" /> Weight trend</span>}
      subtitle={
        delta == null ? `Logged days, with a seven-day average`
          : `${last} ${unit} now · ${delta === 0 ? 'level' : `${delta > 0 ? '+' : ''}${delta} ${unit}`} across ${series.length} logged days`
      }
      collapsible
      defer
      enlargeable
    >
      <div className="h-56" role="img" aria-label={`Line chart of body weight over ${series.length} logged days in ${unit}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid {...chartGrid()} />
            <XAxis dataKey="date" {...chartAxis()} />
            <YAxis domain={['auto', 'auto']} {...chartAxis()} tickFormatter={compactNum} width={42} />
            <Tooltip contentStyle={rechartsTooltip()} />
            {delta != null && last != null && (
              <ReferenceLine
                y={last}
                stroke={cat('surface2')}
                strokeDasharray="2 4"
              />
            )}
            {/* The raw reading: thin, dotted, unobtrusive. */}
            <Line type="monotone" dataKey="weight" stroke={cat('overlay0')} dot={{ r: 1.5 }} strokeWidth={1} isAnimationActive={false} />
            {/* The average: this is the line the card is about. */}
            <Line type="monotone" dataKey="avg" stroke={onRaised('mauve')} dot={false} strokeWidth={2.5} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-micro text-fg-2">The faint line is each day as logged; the solid one is the seven-day average, which is the one to read.</p>
    </Card>
  )
}
