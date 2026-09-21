import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../../store'
import { Card, Empty } from '../ui'
import { cat, onAccent, onRaised, over, rechartsTooltip } from '../../lib/colors'
import { MATRIX_KEYS, MATRIX_LABEL, metricMatrix, habitConsistencyScore, type MatrixKey } from '../../lib/correlations'
import { entriesPerWeek } from '../../lib/insightsFilter'
import { taskCompletionByWeek } from '../../lib/viz'
import { todayISO } from '../../lib/date'

/**
 * The charts Insights never had.
 *
 * The page called *Insights* rendered **zero charts** — six headings, fifty
 * lines of text, and every plot in the app sitting on a sibling tab behind
 * folds that shipped closed. These four are the measures that had a number
 * somewhere and no picture anywhere.
 *
 * Forms are picked from the data's job, not from variety:
 *
 * | Card | Job | Form |
 * |---|---|---|
 * | Correlation matrix | polarity across a grid of pairs | diverging heatmap |
 * | Journal volume | change over time, one series | bars |
 * | Habit consistency | magnitude, ranked, named | sorted horizontal bars |
 * | Task completion | change over time, one rate | line |
 *
 * Single series throughout, so none of them carries a legend — the title names
 * the series. The matrix is the one exception and carries a scale key, because
 * its colour is the *value*.
 */

const tip = rechartsTooltip

/**
 * CORRELATION MATRIX · every pair, including the boring ones.
 *
 * Diverging, because r has a meaningful zero and two opposite directions:
 * `sky` for positive, `red` for negative, and the **neutral midpoint is a
 * surface grey, never a hue** — a rainbow here would make r = 0 look like a
 * finding. Saturation carries |r|, so a weak pair fades toward the card rather
 * than shouting in a third colour.
 *
 * An empty cell is not a grey zero. Too few paired days renders as a dash on
 * the plain surface, because "no relationship" and "not enough data" are
 * different answers and the picture has to say which.
 *
 * Not recharts: recharts has no matrix primitive and the shape is a 5×5 CSS
 * grid of divs. A chart library is not a requirement for a chart.
 */
export function CorrelationMatrixCard() {
  const { data } = useJournal()
  const cells = metricMatrix(data)
  const at = (a: MatrixKey, b: MatrixKey) => cells.find((c) => c.a === a && c.b === b)
  const anyReal = cells.some((c) => c.a !== c.b && c.r != null)

  /**
   * Diverging fill: hue by sign, strength by |r|, the theme's surface at the
   * midpoint. Resolved to **hex**, and the reason is the whole bug this card
   * shipped with in its first draft.
   *
   * It used `color-mix(in srgb, …)` and painted every cell's label
   * `text-fg-1`. One foreground for eleven different backgrounds is a decision
   * made once and wrong most of the time: measured on the built bundle, a
   * strong positive cell ran **1.71:1 on vscode, 1.85 on mocha, 1.88 on neon**
   * — near-white ink on a light cyan — and the light themes were no better at
   * 2.95 (dawn) and 4.11 (latte). Every number in the matrix, under the floor,
   * in all five themes.
   *
   * `onAccent` is the repo's answer and it parses hex, so the mix has to be
   * resolved here rather than handed to CSS. Exactly why `Stats`' `moodColor`
   * returns hex too, and its comment says so.
   */
  const fill = (r: number | null): string => {
    if (r == null) return cat('base')
    const mag = Math.min(1, Math.abs(r))
    if (mag < 0.05) return cat('surface0')
    // 0.12 floor so a weak-but-real cell is still visibly tinted, 0.85 ceiling
    // so the strongest cell keeps some of the card under it.
    // `over` already composites a wash onto a ground and returns hex — the
    // helper this needed existed.
    return over(cat(r > 0 ? 'sky' : 'red'), cat('base'), 0.12 + mag * 0.73)
  }

  return (
    <Card band title="Correlation matrix" subtitle="Every pair of measures — a weak link is a finding too">
      {!anyReal ? (
        <Empty>Log mood, sleep and stress across a couple of weeks to fill this in.</Empty>
      ) : (
        <>
          <div
            className="overflow-x-auto"
            role="img"
            aria-label={`Correlation matrix across ${MATRIX_KEYS.map((k) => MATRIX_LABEL[k]).join(', ')}. ${cells
              .filter((c) => c.a !== c.b && c.r != null)
              .map((c) => `${MATRIX_LABEL[c.a]} and ${MATRIX_LABEL[c.b]}, r ${c.r}`)
              .join('; ')}`}
          >
            <table className="w-full min-w-[360px] border-separate border-spacing-[2px] text-label">
              <thead>
                <tr>
                  <th className="w-14" />
                  {MATRIX_KEYS.map((k) => (
                    <th key={k} scope="col" className="pb-1 text-center font-normal text-fg-2">{MATRIX_LABEL[k]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_KEYS.map((a) => (
                  <tr key={a}>
                    <th scope="row" className="pr-2 text-right font-normal text-fg-2">{MATRIX_LABEL[a]}</th>
                    {MATRIX_KEYS.map((b) => {
                      const c = at(a, b)
                      const self = a === b
                      return (
                        <td
                          key={b}
                          className="rounded-[3px] p-0"
                          title={
                            self
                              ? MATRIX_LABEL[a]
                              : c?.r == null
                                ? `${MATRIX_LABEL[a]} vs ${MATRIX_LABEL[b]} · only ${c?.days ?? 0} paired days`
                                : `${MATRIX_LABEL[a]} vs ${MATRIX_LABEL[b]} · r=${c.r} over ${c.days} days`
                          }
                          style={{ background: self ? cat('surface1') : fill(c?.r ?? null) }}
                        >
                          <span
                            className="grid h-9 place-items-center tabular-nums"
                            /* Per cell, per theme. `onAccent` picks the better
                               of the theme's two neutrals for THIS fill and
                               pushes it to 4.6 when neither clears on its own. */
                            style={{ color: onAccent(self ? cat('surface1') : fill(c?.r ?? null)) }}
                          >
                            {self ? '·' : c?.r == null ? <span className="text-fg-3">–</span> : c.r.toFixed(2)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* The scale key, not a legend: colour here IS the value, so what a
              reader needs is which end is which, in the same steps the cells use. */}
          <div className="mt-3 flex items-center justify-center gap-2 text-micro text-fg-2">
            <span>−1 opposite</span>
            {[-1, -0.6, -0.2, 0, 0.2, 0.6, 1].map((v) => (
              <span key={v} className="h-3 w-5 rounded-sm" style={{ background: fill(v) }} />
            ))}
            <span>+1 together</span>
          </div>
          <p className="mt-2 text-label text-fg-2">
            A dash means too few days where both were recorded — not "no link". Stress reads
            inverted: a <em>negative</em> number against mood or sleep is the good direction.
          </p>
        </>
      )}
    </Card>
  )
}

/** JOURNAL VOLUME · how much you actually wrote, per week. */
export function JournalVolumeCard() {
  const { data } = useJournal()
  const weeks = entriesPerWeek(data, 12, todayISO())
  const total = weeks.reduce((a, w) => a + w.entries, 0)
  if (total === 0) return null
  const best = weeks.reduce((m, w) => Math.max(m, w.entries), 0)
  return (
    <Card band title="Journal volume" subtitle={`Entries per week, last 12 weeks · ${total} in total`}>
      <div className="h-48" role="img" aria-label={`Bar chart of journal entries written per week over the last 12 weeks, peaking at ${best} in a week`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeks} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={cat('surface0')} vertical={false} />
            <XAxis dataKey="week" stroke={cat('overlay0')} fontSize={11} />
            <YAxis allowDecimals={false} stroke={cat('overlay0')} fontSize={11} />
            <Tooltip contentStyle={tip()} cursor={{ fill: cat('surface0') }} formatter={(v) => [`${v}`, 'entries'] as [string, string]} />
            {/* 4px rounded data-end, square against the baseline — the bar is
                anchored to zero and should look it. */}
            <Bar dataKey="entries" fill={cat('lavender')} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

/**
 * HABIT CONSISTENCY · ranked, because a ranking is the question.
 *
 * "How am I doing on my habits" is answered by *which* habit is slipping, not
 * by an average — so the bars are sorted descending and each one is named on
 * its own row. A vertical bar chart with eleven rotated habit names would be
 * the same data and unreadable.
 */
export function HabitConsistencyCard() {
  const { data } = useJournal()
  const rows = data.habits
    .filter((h) => !h.archived && !h.avoid)
    .map((h) => ({ name: h.name, score: habitConsistencyScore(data, h.id) }))
    .filter((r): r is { name: string; score: number } => r.score != null)
    .sort((a, b) => b.score - a.score)

  if (rows.length === 0) return null
  return (
    <Card band title="Habit consistency" subtitle="Last 30 scheduled days, recent days weigh more">
      {/* `aria-label` on the list, NOT `role="img"`.
          `role="img"` overrides the implicit `list` role, which orphans every
          `<li>` inside it — axe fails that as a **serious** `listitem`
          violation, and a screen reader loses "3 of 8" navigation as well as
          the per-row text. It is the right role for a canvas or an SVG plot
          (the other three cards in this file keep it, on their wrapper divs),
          and the wrong one here: this chart is genuinely a list of named
          values, so the list is the accessible representation rather than
          something to paper over with a summary string. */}
      <ul className="space-y-1.5" aria-label="Habit consistency over the last 30 scheduled days, most consistent first">
        {rows.map((r) => {
          // Status colours, reserved and used as status: this is a score
          // against a threshold, not a series identity.
          const tone = r.score >= 80 ? 'green' : r.score >= 50 ? 'peach' : 'red'
          return (
            <li key={r.name} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-label text-fg-1" title={r.name}>{r.name}</span>
              <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-ink-2">
                <span className="block h-full rounded-pill" style={{ width: `${r.score}%`, background: cat(tone) }} />
              </span>
              <span className="w-10 shrink-0 text-right tabular-nums text-label" style={{ color: onRaised(tone) }}>{r.score}%</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/** TASK COMPLETION · the rate per week, not the raw counts. */
export function TaskTrendCard() {
  const { data } = useJournal()
  const weeks = taskCompletionByWeek(data, 12, todayISO())
  const real = weeks.filter((w) => w.pct != null)
  if (real.length < 2) return null
  const latest = real[real.length - 1]
  return (
    <Card band title="Task completion trend" subtitle={`Share of that week's tasks closed · latest ${latest.pct}%`}>
      <div className="h-48" role="img" aria-label={`Line chart of the percentage of tasks completed per week over the last 12 weeks, most recently ${latest.pct} percent`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeks} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={cat('surface0')} vertical={false} />
            <XAxis dataKey="week" stroke={cat('overlay0')} fontSize={11} />
            <YAxis domain={[0, 100]} stroke={cat('overlay0')} fontSize={11} />
            <Tooltip contentStyle={tip()} formatter={(v) => [`${v}%`, 'done'] as [string, string]} />
            {/* `connectNulls` is deliberately OFF: a week with no tasks at all
                is a gap in the record, and bridging it would draw a trend
                through a week that never happened. */}
            <Line type="monotone" dataKey="pct" stroke={cat('green')} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
