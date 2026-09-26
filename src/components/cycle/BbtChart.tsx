import {
  CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { cat, rechartsTooltip } from '../../lib/colors'
import { coverline } from '../../lib/cycleInsights'
import { FLAG_COLOR } from './flags'

export interface BbtPoint {
  /** Cycle day when a cycle anchors the chart, calendar day-of-month otherwise. */
  day: number
  temp?: number
  flags: string[]
}

/**
 * BASAL TEMPERATURE · the chart, now charted against the cycle.
 *
 * It used to plot the **calendar month**, which is the wrong x-axis for this
 * measurement. A basal chart is read for its biphasic shift — a low
 * follicular half, a rise of roughly 0.3–0.6°F after ovulation, a high luteal
 * half — and a month boundary cuts that shape in half at an arbitrary point,
 * so a perfectly ordinary chart looked like two unrelated fragments in two
 * different months. Plotted by cycle day, the shape is the point.
 *
 * Three references, each earning its ink:
 *
 * - **period shading** — where the cycle started, so the rise can be placed;
 * - **the ovulation window** the log itself carries, not one this file guesses;
 * - **the coverline**, the highest pre-shift reading, which is how fertility-
 *   awareness charting marks that a rise already happened. Retrospective on
 *   purpose. `coverline` returns null unless six pre-shift readings and three
 *   consecutive higher ones exist, so a flat or sparse chart draws no line
 *   rather than a confident one.
 *
 * `connectNulls` is deliberate: a missed morning is a gap in the record, not a
 * temperature of zero, and the line drawn across it is the honest reading of
 * two points either side.
 */
export function BbtChart({ points, unit, label }: {
  points: BbtPoint[]
  /** 'F' or 'C', the user's setting. */
  unit: string
  /** What the x-axis counts, for the caption and the alt text. */
  label: string
}) {
  const withTemp = points.filter((p) => p.temp != null)
  if (withTemp.length < 2) {
    return (
      <p className="text-label text-fg-2">
        Two mornings of temperature draw a line; about ten draw a shift. Take it before getting
        up, at roughly the same time — the fold below says why that matters more than the number.
      </p>
    )
  }

  const line = coverline(points)
  // Contiguous runs of a flag, as [from, to] cycle days, for the shaded bands.
  const runs = (flag: string) => {
    const out: [number, number][] = []
    for (const p of points) {
      if (!p.flags.includes(flag)) continue
      const last = out[out.length - 1]
      if (last && last[1] === p.day - 1) last[1] = p.day
      else out.push([p.day, p.day])
    }
    return out
  }

  return (
    <>
      <div className="h-56 w-full" role="img" aria-label={`Line chart of basal temperature by ${label} in degrees ${unit}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
            {runs('period').map(([a, b], i) => (
              <ReferenceArea key={`p${i}`} x1={a} x2={b} fill={cat(FLAG_COLOR.period)} fillOpacity={0.14} />
            ))}
            {runs('ovulation').map(([a, b], i) => (
              <ReferenceArea key={`o${i}`} x1={a} x2={b} fill={cat(FLAG_COLOR.ovulation)} fillOpacity={0.14} />
            ))}
            <XAxis dataKey="day" stroke={cat('overlay0')} fontSize={11} />
            <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
            <Tooltip contentStyle={rechartsTooltip()} formatter={(v) => [`${v}°${unit}`, 'Temp']} />
            {line != null && (
              <ReferenceLine
                y={line}
                stroke={cat('teal')}
                strokeDasharray="4 3"
                label={{ value: 'coverline', position: 'right', fill: cat('subtext0'), fontSize: 10 }}
              />
            )}
            <Line type="monotone" dataKey="temp" stroke={cat('maroon')} dot={{ r: 2 }} connectNulls strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-label text-fg-2">
        By {label}, in °{unit}. Red is bleeding, green the days you flagged as ovulation.
        {line != null ? (
          <> The dashed <strong className="font-medium text-fg-1">coverline</strong> at {line}° is the highest reading before a sustained rise — three days clearly above it is how a chart shows the rise <em>already happened</em>. It is never a forecast.</>
        ) : (
          <> No coverline yet: it needs six readings before a rise and three clearly above them.</>
        )}
      </p>
    </>
  )
}
