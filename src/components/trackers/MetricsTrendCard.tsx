import {
  CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card } from '../ui'
import { cat, rechartsTooltip } from '../../lib/colors'
import { justCapturedProps } from '../CaptureReceipt'
import { prettyMonth } from '../../lib/date'

type MetricsPoint = {
  day: number
  mood?: number
  stress?: number
  sleep?: number
  moodAvg?: number | null
  stressAvg?: number | null
  sleepAvg?: number | null
}

/**
 * Mood / stress / sleep line chart: faint = daily, bold = 7-day rolling avg.
 *
 * `just` is the day a capture wrote and the fields it wrote there, or null. It
 * is marked on the chart rather than by ringing the card, and that is the whole
 * point: a wellbeing metric has no row anywhere in this app — it is a field on
 * a row keyed by date, and this chart is the only place it is drawn. "Saved to
 * Tracking · mood 7" pointing at a card holding thirty days of lines is not
 * pointing at anything. A dot on the day is.
 *
 * The FIELDS matter, not just the day. "mood 7" on a day that already carries
 * stress and sleep must mark mood alone; marking the day marked all three, two
 * of them readings given days ago. Measured in a browser before the keys were
 * split per field: three dots for a one-word capture.
 */
const SERIES = { mood: 'green', stress: 'red', sleep: 'blue' } as const

export function MetricsTrendCard({ chartData, ym, just = null }: {
  chartData: MetricsPoint[]
  ym: string
  just?: { day: number; fields: readonly ('mood' | 'stress' | 'sleep')[] } | null
}) {
  const marked = just == null ? null : chartData.find((p) => p.day === just.day)
  const dots = just == null ? [] : just.fields.map((key) => ({ key, colour: cat(SERIES[key]) }))

  return (
    <Card band title="Mood. Stress. Sleep" subtitle={`${prettyMonth(ym)}, faint = daily, bold = 7-day avg`} className="lg:col-span-2">
      {/* The scroll-into-view target, on the plot itself and NOT on a wrapper
          around the card. The first attempt wrapped `<Card>` in a
          `display: contents` div to keep the grid intact — and `display:
          contents` generates no box, so `getBoundingClientRect` is 0x0 and
          `scrollIntoView` silently does nothing. Measured: the dot drawn
          correctly at y=1271 in a 900px window, on a page that never scrolled.
          The attribute carries no ring class here on purpose: the chart marks
          its own point, so an outline round the card would be a second answer
          to the same question. */}
      <div {...justCapturedProps(just != null)} className="h-64 w-full" role="img" aria-label={`Line chart of daily and 7-day-average mood, stress and sleep across ${prettyMonth(ym)}, each on a 0 to 10 scale`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke={cat('overlay0')} fontSize={11} />
            <YAxis domain={[0, 10]} stroke={cat('overlay0')} fontSize={11} />
            <Tooltip contentStyle={rechartsTooltip()} />
            <Line type="monotone" dataKey="mood" stroke={cat('green')} dot={false} connectNulls strokeWidth={2} opacity={0.35} />
            <Line type="monotone" dataKey="stress" stroke={cat('red')} dot={false} connectNulls strokeWidth={2} opacity={0.35} />
            <Line type="monotone" dataKey="sleep" stroke={cat('blue')} dot={false} connectNulls strokeWidth={2} opacity={0.35} />
            <Line type="monotone" dataKey="moodAvg" stroke={cat('green')} dot={false} connectNulls strokeWidth={2.5} />
            <Line type="monotone" dataKey="stressAvg" stroke={cat('red')} dot={false} connectNulls strokeWidth={2.5} />
            <Line type="monotone" dataKey="sleepAvg" stroke={cat('blue')} dot={false} connectNulls strokeWidth={2.5} />
            {marked && dots.map(({ key, colour }) => {
              const y = marked[key]
              if (typeof y !== 'number') return null
              return (
                <ReferenceDot
                  key={key}
                  x={marked.day}
                  y={y}
                  r={5}
                  fill={colour}
                  stroke={cat('text')}
                  strokeWidth={2}
                  // The series name, not "new": read out on its own this says
                  // which reading was just taken, which is the useful half.
                  label={{ value: `${key} ${y}`, position: 'top', fill: cat('text'), fontSize: 11 }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
