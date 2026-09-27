import {
  Area, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useJournal } from '../../store'
import { Card, Empty } from '../ui'
import { cat, onRaised, rechartsTooltip } from '../../lib/colors'
import {
  lapseMoodGap, moodAroundLapse, moodBandRisk, moodReasonImpact, moodSwingByWeek,
} from '../../lib/moodPatterns'
import { todayISO } from '../../lib/date'

/**
 * MOOD, AND WHAT IT DOES AROUND A LAPSE.
 *
 * Four cards against one question: *can I see the pattern, and does seeing it
 * tell me anything I could act on.* Every form here is picked from the data's
 * job rather than for variety, and two of the four are deliberately not
 * recharts, because the job is a ranked comparison and a chart library is not a
 * requirement for a chart.
 *
 * | Card | The question | Job | Form |
 * |---|---|---|---|
 * | What moved your mood | why did it change | delta either side of a baseline | diverging bars, centred |
 * | Level & swing | is it *swinging*, not just low | one series' level and spread | range band + mean line, ONE axis |
 * | The week around a lapse | did the low come first, or after | change over a lag axis | line vs a baseline rule |
 * | Urges by mood band | is an urge worse on a bad day | magnitude across ordinal bands | ranked bars + figures |
 *
 * ## What is NOT here, and why
 *
 * **Mood by hour.** The user asked for it and the data cannot support it:
 * `DailyMetric` is keyed by ISO *day* and carries no timestamp, so there is no
 * hour to plot. `UrgeWin.at` does have one, which is why the check-in-times card
 * exists for urges and no equivalent can exist for mood. Inventing an hour from
 * a write time would be a chart of when someone opens the app.
 *
 * **A mood calendar or a weekday average.** Both already ship — `moodcal` and
 * `moodanalytics` in this same registry — and `moodcal` now carries the lapse
 * ring, so the day-level heatmap answers the join without a fifth card. This
 * repo has already lost eleven workout formats to a pass that retyped a module
 * instead of reading it; a second mood calendar is the same failure with better
 * manners.
 *
 * ## The rule all four obey
 *
 * A figure appears with its **n**, every "no data" is an absence rather than a
 * zero, and no sentence on this page says one thing caused another. Where a
 * claim about mood and addiction is made at all, it is a published one with a
 * link — see the NIDA credit on the lag card, which is also the card most likely
 * to be over-read.
 */

const tip = rechartsTooltip

/** Axis furniture, so all four charts recede identically.
 *
 *  `stroke` on a recharts axis paints the axis line **and** its tick text, which
 *  is why `cat('overlay0')` is wrong here even though half the app's older
 *  charts do it: 2.57:1 as text is the partner mistake `CLAUDE.md` names beside
 *  `cat('crust')`. The line is a graphic and takes `surface1`; the labels are
 *  text and take `subtext0`, spelled separately. */
const AXIS = { stroke: cat('surface1'), tick: { fill: cat('subtext0'), fontSize: 11 } }

// ─────────────────────────────────────────────────────────────────────────────

/**
 * WHAT MOVED YOUR MOOD · the card the new field exists for.
 *
 * Diverging bars from a centre line, because the measure is a **delta either
 * side of a baseline** and that is the one job diverging colour is for: `sky`
 * for a day that ran above the rest, `red` for below, and the midpoint is the
 * card's own surface rather than a third hue — a rainbow here would make "no
 * difference" look like a finding.
 *
 * Length is `|delta|` scaled to the widest row, so the bars compare with each
 * other rather than against an invented full scale. Each row states the two
 * averages and the day count, because the delta alone cannot be discounted and
 * `−2.4 over 15 days` and `−2.4 over 3 days` are not the same claim.
 *
 * A `<ul>` with `aria-label`, **not** `role="img"`: this genuinely is a list of
 * named values, and `role="img"` would override the list role and orphan every
 * `<li>` — a serious axe violation the sibling card in `NewCharts.tsx` has a
 * paragraph about.
 */
export function MoodReasonsCard() {
  const { data } = useJournal()
  const rows = moodReasonImpact(data)
  const tagged = data.metrics.filter((m) => m.moodReasons?.length).length
  if (rows.length === 0) {
    // Two different empty states, because they ask for two different things.
    return (
      <Card band title="What moved your mood" subtitle="Ticked reasons, against the days you ticked nothing">
        <Empty>
          {tagged === 0
            ? 'Tick what shaped a day on the Today check-in — “slept badly”, “deadline”, “exercised” — and this compares those days with the rest.'
            : `Only ${tagged} day${tagged === 1 ? '' : 's'} carries a reason so far. A reason needs three rated days, and there have to be untagged days to compare them with.`}
        </Empty>
      </Card>
    )
  }

  const widest = Math.max(1, ...rows.map((r) => Math.abs(r.delta)))
  return (
    <Card band
      title="What moved your mood"
      subtitle={`Mood on the days you ticked each reason, against the days you did not · ${tagged} days tagged`}
    >
      <ul className="space-y-2" aria-label="Average mood on days carrying each reason, compared with the days that do not, biggest drop first">
        {rows.map((r) => {
          const down = r.delta < 0
          const hue = down ? 'red' : 'sky'
          const frac = (Math.abs(r.delta) / widest) * 50
          return (
            <li key={r.reason} className="flex items-center gap-2">
              <span className="w-[5.5rem] shrink-0 truncate text-label text-fg-1" title={r.label}>{r.label}</span>
              {/* The centred track. `min-w-0` so a long label cannot widen it
                  past its column — a wide child in a shared grid track drags
                  every sibling card with it, which is a documented trap here. */}
              <span className="relative h-3 min-w-0 flex-1 rounded-pill bg-ink-2">
                <span aria-hidden className="absolute inset-y-[-2px] left-1/2 w-px" style={{ background: cat('surface1') }} />
                <span
                  className="absolute inset-y-0 rounded-pill"
                  style={{
                    width: `${frac}%`,
                    left: down ? `${50 - frac}%` : '50%',
                    background: cat(hue),
                  }}
                />
              </span>
              <span className="w-24 shrink-0 text-right text-label tabular-nums" style={{ color: onRaised(hue) }}>
                {r.delta > 0 ? '+' : ''}{r.delta}
                <span className="ml-1 text-fg-2">· {r.days}d</span>
              </span>
              {/* The sentence a screen reader gets, and the one the bar is a
                  picture of. Both averages, both directions, and the n. */}
              <span className="sr-only">
                {`${r.label}: mood averaged ${r.withReason} on ${r.days} day${r.days === 1 ? '' : 's'}, against ${r.without} on the rest — ${Math.abs(r.delta)} ${down ? 'lower' : 'higher'}.`}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 border-t border-line pt-2 text-label text-fg-2">
        A gap between two averages, not a cause. The obvious confound runs the other way too:
        a day that already feels bad invites you to go looking for a reason to tick, which widens
        every drop on this list. A reason shows up here only once three rated days carry it.
      </p>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * LEVEL AND SWING · the answer to "how is my mood *swinging*".
 *
 * The band is that week's low-to-high range and the line is its average, and
 * they share **one** 0–10 axis on purpose. The obvious alternative — the mean on
 * one scale and the standard deviation on a second — is a dual-axis chart, which
 * is the single most common chart mistake and a way to make any two series look
 * related. Drawn as a range, the spread *is* the height of the band, so a month
 * averaging 6 with daily swings of ±4 and a steady 6 are visibly different
 * pictures of the same number.
 *
 * Two stacked areas rather than one range series: the invisible `floor` stacks
 * under the visible `range`, which is the mechanically reliable way to draw a
 * band in recharts. `floor` is `tooltipType="none"` so it never appears in the
 * readout as a number nobody asked about.
 *
 * `connectNulls` is off everywhere. A week with under two rated days has no
 * spread to draw — the population SD of one observation is 0, which would paint
 * the calmest week of the quarter out of a single log — so it is a gap, and a
 * line bridging it would draw a trend through a week that was never recorded.
 */
export function MoodSwingCard() {
  const { data } = useJournal()
  const weeks = moodSwingByWeek(data, 12, todayISO())
  const real = weeks.filter((w) => w.swing != null)
  if (real.length < 3) {
    return (
      <Card band title="Level & swing" subtitle="Each week's average, inside its low-to-high range">
        <Empty>Rate your mood on a few more days — this needs three weeks with at least two rated days each.</Empty>
      </Card>
    )
  }

  const rows = weeks.map((w) => ({
    ...w,
    // Nulls, not zeros: the band and the line must both break on a thin week.
    floor: w.avg == null ? null : w.low,
    range: w.avg == null ? null : (w.high ?? 0) - (w.low ?? 0),
  }))
  const calmest = real.reduce((a, b) => (b.swing! < a.swing! ? b : a))
  const wildest = real.reduce((a, b) => (b.swing! > a.swing! ? b : a))

  return (
    <Card band enlargeable
      title="Level & swing"
      subtitle={`Each week's average inside its low-to-high range · swing ran ±${calmest.swing} to ±${wildest.swing} over ${real.length} weeks`}
    >
      <div className="h-56" role="img" aria-label={`Chart of mood by week over ${weeks.length} weeks. Each week shows its lowest-to-highest range as a band with its average as a line. The steadiest week was ${calmest.label} at a swing of ${calmest.swing}, the most variable ${wildest.label} at ${wildest.swing}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={cat('surface0')} vertical={false} />
            <XAxis dataKey="label" stroke={AXIS.stroke} tick={AXIS.tick} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke={AXIS.stroke} tick={AXIS.tick} />
            <Tooltip
              contentStyle={tip()}
              formatter={(v, name, item) => {
                const w = item?.payload as (typeof rows)[number]
                if (name === 'range') return [`${w.low}–${w.high} over ${w.days} day${w.days === 1 ? '' : 's'}`, 'range'] as [string, string]
                return [`${v} · swing ±${w.swing}`, 'average'] as [string, string]
              }}
            />
            {/* The stack's hidden base. `stroke="none"` and a transparent fill,
                so it positions the band and paints nothing. */}
            <Area dataKey="floor" stackId="band" stroke="none" fill="transparent" fillOpacity={0} tooltipType="none" legendType="none" isAnimationActive={false} connectNulls={false} />
            <Area dataKey="range" stackId="band" stroke="none" fill={cat('sky')} fillOpacity={0.22} isAnimationActive={false} connectNulls={false} />
            <Line type="monotone" dataKey="avg" stroke={cat('sky')} strokeWidth={2} dot={{ r: 2.5 }} connectNulls={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* A key rather than a legend: there is one series here, shown twice. */}
      <p className="mt-2 text-label text-fg-2">
        The band is that week&rsquo;s lowest to highest day; the line is its average. A tall band on a
        level line is a swingy week, not a bad one — <strong className="font-medium text-fg-1">they are
        different problems</strong>. A gap is a week with fewer than two rated days, which has no
        spread to draw rather than a spread of zero.
      </p>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * THE WEEK AROUND A LAPSE · the chart that separates two opposite stories.
 *
 * Day 0 is the lapse. If the curve sags to the **left** of it, the low ran into
 * the lapse and the thing to watch is the descent. If it is level on the left
 * and drops to the **right**, the lapse left its mark and the thing to plan is
 * the day after. Those imply opposite responses and no correlation coefficient
 * can tell them apart, which is why this card exists and why it is the one most
 * at risk of being over-read.
 *
 * So the framing is stated with a source, the n is on every point, and the
 * footnote says what the shape is not. `connectNulls` is off: an offset nobody
 * rated is a hole, and a line drawn through it is the app inventing a day.
 */
export function LapseLagCard() {
  const { data } = useJournal()
  const lag = moodAroundLapse(data)
  const gap = lapseMoodGap(data)

  if (!lag) {
    return (
      <Card band title="The week around a lapse" subtitle="Mood on the three days either side of a logged lapse">
        <Empty>
          This needs four lapse days with a rated mood near them. It is deliberately not drawn
          sooner: over two or three, one bad Tuesday moves the whole curve.
        </Empty>
      </Card>
    )
  }

  const thinnest = Math.min(...lag.points.map((p) => p.days))
  return (
    <Card band enlargeable
      title="The week around a lapse"
      subtitle={`Average mood on each day either side of a lapse · ${lag.lapses} lapse days`}
    >
      {/* The headline is a fact about this journal and nothing more. Two
          averages, both counts, no verb that implies direction. */}
      {gap.onLapse != null && gap.otherwise != null && (
        <p className="mb-3 text-body text-fg-1">
          On the <strong className="tabular-nums">{gap.onLapseDays}</strong> lapse days logged, mood
          averaged <strong className="tabular-nums" style={{ color: onRaised('peach') }}>{gap.onLapse}</strong>,
          against <strong className="tabular-nums" style={{ color: onRaised('sky') }}>{gap.otherwise}</strong> across
          the other <span className="tabular-nums">{gap.otherwiseDays}</span> rated days.
        </p>
      )}
      <div className="h-52" role="img" aria-label={`Line chart of average mood from three days before a lapse to three days after, across ${lag.lapses} lapse days. ${lag.points.map((p) => `${p.offset === 0 ? 'the lapse day' : `day ${p.offset > 0 ? '+' : ''}${p.offset}`}: ${p.avg == null ? 'no rated day' : `${p.avg} out of 10 from ${p.days} days`}`).join('; ')}. Overall average ${lag.baseline} across ${lag.baselineDays} rated days.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lag.points} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={cat('surface0')} vertical={false} />
            <XAxis
              dataKey="offset"
              stroke={AXIS.stroke}
              tick={AXIS.tick}
              tickFormatter={(o: number) => (o === 0 ? 'lapse' : `${o > 0 ? '+' : ''}${o}`)}
            />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke={AXIS.stroke} tick={AXIS.tick} />
            <Tooltip
              contentStyle={tip()}
              formatter={(v, _n, item) => {
                const p = item?.payload as (typeof lag.points)[number]
                return [`${v}/10 over ${p.days} day${p.days === 1 ? '' : 's'}`, p.offset === 0 ? 'lapse day' : `day ${p.offset > 0 ? '+' : ''}${p.offset}`] as [string, string]
              }}
            />
            {/* The lapse itself, and the journal's own average. Both are context
                the curve is read against, so both are rules rather than series. */}
            <ReferenceLine x={0} stroke={cat('peach')} strokeDasharray="3 3" />
            {lag.baseline != null && (
              <ReferenceLine
                y={lag.baseline}
                stroke={cat('overlay1')}
                strokeDasharray="4 4"
                label={{ value: `your average ${lag.baseline}`, position: 'insideTopRight', fill: cat('subtext0'), fontSize: 11 }}
              />
            )}
            <Line type="monotone" dataKey="avg" stroke={cat('mauve')} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-label text-fg-2">
        Read the <em>shape</em>, not the dip: a sag before day 0 and a sag after it point at
        different things to do. It is still {lag.lapses} events averaged together — the thinnest
        point here rests on {thinnest} rated day{thinnest === 1 ? '' : 's'} — and co-occurrence is
        not direction.
        {lag.windowsOverlap && ' Lapses this close together share days, so one low day can sit in more than one window.'}
      </p>
      <p className="mt-1.5 text-label text-fg-2">
        Why this chart exists: <a href="https://nida.nih.gov/publications/drugs-brains-behavior-science-addiction/treatment-recovery" target="_blank" rel="noreferrer">NIDA · Treatment and Recovery</a>{' '}
        names &ldquo;stress, cues linked to the drug use (such as people, places, things, and moods),
        and contact with drugs&rdquo; among the most common triggers for relapse. That is a reason to
        look at your own mood beside your own log. It is not a finding about you.
      </p>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

/** A band standing on fewer than this many rated days states its count and
 *  draws no bar. Three, matching the floor `moodReasonImpact` uses: two days at
 *  a 100% lapse rate is the most alarming number a page can show and the least
 *  supported, and the demo journal produced exactly that before the seed was
 *  fixed. */
const BAND_MIN_DAYS = 3

/**
 * URGES AND LAPSES BY MOOD BAND · four numbers instead of an adjective.
 *
 * Three ordinal bands over the 0–10 scale, and per band: the share of its days
 * that were lapse days, drawn as a bar, plus the urge count and mean intensity
 * as figures. Bands rather than a scatter because the reader's question is
 * comparative — *worse when I am low?* — and a 0–10 × 1–5 scatter over thirty
 * points answers that by eye at best.
 *
 * The bar is **one hue, and it is a status hue on purpose**. A lapse rate means
 * bad in the way an error rate does, which is the one case where a series wears
 * status colour rather than an identity slot; and colouring the three bars by
 * their own values would spend the identity channel re-encoding what bar length
 * already shows. Intensity is a figure, not a second bar, because 1–5 and 0–100%
 * on shared ticks is the dual-axis mistake at card scale.
 *
 * A band with no rated days shows a dash, never 0%. "You never lapse when you
 * are bright" and "you have not rated a bright day" are opposite findings.
 */
export function MoodBandRiskCard() {
  const { data } = useJournal()
  const rows = moodBandRisk(data)
  if (rows.length === 0) {
    return (
      <Card band title="Urges by mood band" subtitle="How a low day and a bright one differ in the log">
        <Empty>Rate your mood on five days or more, and this splits your urges and lapses by how the day felt.</Empty>
      </Card>
    )
  }

  const totalUrges = rows.reduce((a, r) => a + r.urges, 0)
  const widest = Math.max(0.01, ...rows.map((r) => r.lapseRate ?? 0))
  return (
    <Card band
      title="Urges by mood band"
      subtitle={`Lapse share and urge intensity, split by how the day was rated · ${rows.reduce((a, r) => a + r.days, 0)} rated days`}
    >
      <ul className="space-y-2.5" aria-label="Share of days that were lapse days, and average urge intensity, by mood band">
        {rows.map((r) => {
          const thin = r.days < BAND_MIN_DAYS
          return (
            <li key={r.band} className="rounded-card bg-ink-2 p-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-label font-medium text-fg-1">{r.label}</span>
                <span className="text-micro tabular-nums text-fg-2">mood {r.range[0]}–{r.range[1]}</span>
                <span className="ml-auto text-micro tabular-nums text-fg-2">{r.days} day{r.days === 1 ? '' : 's'}</span>
              </div>
              {r.days === 0 ? (
                <p className="mt-1.5 text-label text-fg-2">No day rated in this band yet.</p>
              ) : thin ? (
                <p className="mt-1.5 text-label text-fg-2">
                  Only {r.days} day{r.days === 1 ? '' : 's'} rated here — not enough to put a share on.
                </p>
              ) : (
                <>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-pill" style={{ background: cat('surface1') }}>
                      <span className="block h-full rounded-pill" style={{ width: `${((r.lapseRate ?? 0) / widest) * 100}%`, background: cat('red') }} />
                    </span>
                    <span className="w-20 shrink-0 text-right text-label tabular-nums" style={{ color: onRaised('red') }}>
                      {Math.round((r.lapseRate ?? 0) * 100)}%
                      <span className="ml-1 text-fg-2">lapsed</span>
                    </span>
                  </div>
                  <p className="mt-1 text-micro text-fg-2">
                    <span className="tabular-nums">{r.lapseDays}</span> of {r.days} days ·{' '}
                    {r.urges === 0
                      ? 'no urge logged'
                      : <>
                          <span className="tabular-nums">{r.urges}</span> urge{r.urges === 1 ? '' : 's'} logged,
                          intensity {r.intensity == null ? '—' : <span className="tabular-nums">{r.intensity}/5</span>}
                        </>}
                  </p>
                </>
              )}
            </li>
          )
        })}
      </ul>
      <p className="mt-3 border-t border-line pt-2 text-label text-fg-2">
        Shares of the days you <em>rated</em>, not a chance of lapsing — a day with no mood logged is
        in none of these bands. The bars are scaled against each other rather than to 100%.
        {totalUrges === 0 && ' No urges are logged yet, so the intensity column has nothing in it.'}
      </p>
    </Card>
  )
}
