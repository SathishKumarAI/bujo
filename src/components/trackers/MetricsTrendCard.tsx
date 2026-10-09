import {
  CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card } from '../ui'
import { cardSurface, cat, over, rechartsTooltip } from '../../lib/colors'
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
/**
 * THREE SERIES, AND COLOUR IS NOT ALLOWED TO BE THE ONLY DIFFERENCE.
 *
 * This chart drew mood in `green`, stress in `red` and sleep in `blue`, with no
 * legend at all — identity by hue, and by a hue pair that is the textbook
 * failure. Run over all five themes with the dataviz validator, red↔green
 * separates by **ΔE 5.8 for deuteranopia in latte, vscode and dawn** (the floor
 * is 6, the target 8): three of five themes, the two most-used ones among them.
 *
 * The fix is NOT a different trio. Every three-accent combination this app's
 * palettes can make was scored across the five themes, and **none is clean** —
 * red/green/blue is already joint best at 5.8, so re-stepping buys nothing and
 * would cost the semantics (green mood, red stress) on top. Below the floor the
 * rule is secondary encoding, so each series now carries a **dash pattern** as
 * well as a hue, and a legend names all three. Pattern survives a greyscale
 * print and a monochrome display, which is more than can be said for the hue.
 */
const SERIES = {
  mood: { token: 'green', dash: undefined, label: 'Mood' },
  stress: { token: 'red', dash: '7 4', label: 'Stress' },
  sleep: { token: 'blue', dash: '2 3', label: 'Sleep' },
} as const

export function MetricsTrendCard({ chartData, ym, just = null }: {
  chartData: MetricsPoint[]
  ym: string
  just?: { day: number; fields: readonly ('mood' | 'stress' | 'sleep')[] } | null
}) {
  const marked = just == null ? null : chartData.find((p) => p.day === just.day)
  const dots = just == null ? [] : just.fields.map((key) => ({ key, colour: cat(SERIES[key].token) }))
  // The daily line is the quieter of the pair, and it says so with a COLOUR
  // rather than with `opacity={0.35}`. A faded stroke is a value no gate can
  // check — `check-contrast` reads token values and a faded token is not a
  // token — and this file is where that trap is most expensive, because the
  // same hue appears twice and the only thing separating the readings from the
  // trend was the fade. `over()` flattens the accent onto the card it is drawn
  // on, so what ships is a real hex.
  const faint = (token: string) => over(cat(token), cardSurface(), 0.42)

  return (
    <Card enlargeable band title="Mood. Stress. Sleep" subtitle={`${prettyMonth(ym)}, faint = daily, bold = 7-day avg`} className="lg:col-span-2">
      {/* The scroll-into-view target, on the plot itself and NOT on a wrapper
          around the card. The first attempt wrapped `<Card enlargeable>` in a
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
            {/* The legend names the three, so identity is never colour alone —
                and it carries only the AVERAGES. Six entries for three subjects
                would say the chart has six subjects; the daily line is the same
                series drawn twice, which the subtitle already explains. */}
            {/* `itemSorter` off, because recharts defaults it to `'value'` and
                sorted the three ALPHABETICALLY: "Mood · Sleep · Stress", which
                is not the order the card's own title reads in. Insertion order
                is the authored one. */}
            <Legend
              verticalAlign="top"
              align="right"
              height={22}
              iconSize={10}
              wrapperStyle={{ fontSize: 11 }}
              itemSorter={() => 0}
              // The swatch carries identity; the WORD does not. recharts paints
              // each legend label in its series colour by default, which puts
              // 11px of text on the card in `red` and `green`. Text wears text
              // tokens; the coloured mark beside it says which series it is.
              formatter={(value: string) => <span style={{ color: cat('subtext0') }}>{value}</span>}
            />
            {(['mood', 'stress', 'sleep'] as const).map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={faint(SERIES[key].token)}
                strokeDasharray={SERIES[key].dash}
                dot={false}
                connectNulls
                strokeWidth={1.5}
                legendType="none"
                name={`${SERIES[key].label}, daily`}
              />
            ))}
            {(['mood', 'stress', 'sleep'] as const).map((key) => (
              <Line
                key={`${key}Avg`}
                type="monotone"
                dataKey={`${key}Avg`}
                stroke={cat(SERIES[key].token)}
                strokeDasharray={SERIES[key].dash}
                dot={false}
                connectNulls
                strokeWidth={2.5}
                name={SERIES[key].label}
              />
            ))}
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
