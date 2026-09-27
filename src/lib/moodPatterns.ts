import type { JournalData, MoodReason } from './types'
import { addDays, fromISODay, todayISO } from './date'

/**
 * MOOD, MADE LEGIBLE — and joined to the lapse log.
 *
 * ## What this file owns
 *
 * | Question | Function |
 * |---|---|
 * | Why did the mood move? | `moodReasonImpact` |
 * | How much is it swinging, week to week? | `moodSwingByWeek` |
 * | What does the week around a lapse look like? | `moodAroundLapse` |
 * | Are urges worse in a given mood band? | `moodBandRisk` |
 *
 * It does **not** own the mood calendar, the year-in-pixels grid, the
 * best/worst weekday bars or the single trailing stability score: those already
 * exist (`StatsPanels`' `moodcal`, `correlations.bestWorstWeekday`,
 * `correlations.metricVolatility`) and rebuilding them would be the
 * dead-data-module failure this repo has already paid for once. `metricVolatility`
 * answers "how steady am I *now*" with one number; `moodSwingByWeek` answers
 * "is the swing itself getting worse", which is a series and a different
 * question.
 *
 * ## The rule every function here follows
 *
 * **This is addiction data and this app is not a clinician.** Three consequences,
 * and they are structural rather than stylistic:
 *
 * 1. **Every figure carries its n.** Not as a courtesy — as the thing that lets
 *    a reader discount it. A shape drawn from four lapse days is labelled four
 *    lapse days.
 * 2. **`null` is "no data", never `0`.** `count ? sum / count : 0` is twice-
 *    documented in this repo's `CLAUDE.md` as the bug that printed `0%` for
 *    months that had not happened. Every mean here returns `null` on an empty
 *    sample and the caller decides what to draw.
 * 3. **Below a floor of observations, nothing is drawn.** `moodAroundLapse`
 *    returns `null` under four lapse days and `moodBandRisk` returns `[]` under
 *    five rated days, the same shape as `cycleInsights.flagPatternByDay`
 *    returning `[]` below two completed cycles. A confident curve over two
 *    events is worse than an empty state, because an empty state cannot be
 *    acted on by mistake.
 *
 * Nothing here returns a causal claim, and none of these functions produces a
 * sentence — they return numbers with their sample sizes, and the view states
 * the co-occurrence. "On the 6 lapse days logged, mood averaged 4.1 against
 * your overall 6.3" is a fact about a journal; "your lapses are caused by low
 * mood" is not something a journal can know.
 */

// ─────────────────────────────────────────────────────────────────────────────
// The reason vocabulary

/**
 * Display order for the nine reasons — **downward first, upward last**.
 *
 * The order is the chip row's reading order and it is not alphabetical: the
 * things that drag a day down are the ones someone reaches for most often, and
 * burying `exercised` and `good-news` at the end keeps the row from opening on
 * a positive when the person tapping it is having a bad day. `MoodReason` (the
 * union) lives in `types.ts`, so `Record<MoodReason, …>` below is exhaustive by
 * the compiler and this array is checked against it by a test.
 */
export const MOOD_REASONS: readonly MoodReason[] = [
  'slept-badly',
  'argument',
  'work-stress',
  'money',
  'illness',
  'lonely',
  'no-plans',
  'exercised',
  'good-news',
]

export const MOOD_REASON_LABEL: Record<MoodReason, string> = {
  'slept-badly': 'Slept badly',
  argument: 'Argument',
  'work-stress': 'Work stress',
  money: 'Money worry',
  illness: 'Illness',
  lonely: 'Lonely',
  'no-plans': 'No plans',
  exercised: 'Exercised',
  'good-news': 'Good news',
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared readers

/** Mood by ISO day. Last write wins, mirroring how `metrics` is read elsewhere. */
function moodIndex(data: JournalData): Map<string, number> {
  const out = new Map<string, number>()
  for (const m of data.metrics) if (m.mood != null) out.set(m.date, m.mood)
  return out
}

const mean = (xs: number[]): number | null =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null

/**
 * Every ISO day on which *something* was lapsed on, across every tracked
 * streak — the primary one plus each `AddictionStreak`.
 *
 * A `Set` of dates rather than a list of `Relapse` rows, and that is the
 * decision worth recording. Two addictions can relapse on the same evening
 * (the seed has exactly that: Nicotine and "After a meal" on `today`), and
 * counting that day twice would weight one day's mood double in every average
 * below. One day is one observation. The quantity (`Relapse.count`) is
 * deliberately ignored here: ten cigarettes is not ten lapse days, and
 * `types.ts` says so in `Relapse.count`'s own docstring.
 *
 * Read-only over `data.nofap` — this module never writes it.
 */
export function lapseDays(data: JournalData): Set<string> {
  const out = new Set<string>()
  const streak = data.nofap
  if (!streak) return out
  for (const r of streak.relapses ?? []) out.add(r.date)
  for (const a of streak.addictions ?? []) for (const r of a.relapses ?? []) out.add(r.date)
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Why the mood moved

export interface ReasonImpact {
  reason: MoodReason
  label: string
  /** Mean mood on days tagged with this reason. */
  withReason: number
  /** Mean mood on rated days NOT tagged with it — the comparison, not a target. */
  without: number
  /** `withReason − without`. Negative means those days ran below the rest. */
  delta: number
  /** Rated days carrying this reason. **This is the n.** */
  days: number
}

/**
 * How each logged reason co-occurs with the mood score.
 *
 * For every reason: the mean mood across the days it was ticked, against the
 * mean across every *other* rated day. `delta` is the gap. It is a comparison
 * of two averages over the same journal — not an effect size, and not a claim
 * that the reason produced the mood. The obvious confound is real and worth
 * knowing: someone having a bad day is more likely to go looking for a reason
 * to tick, which inflates every downward delta. The card says so.
 *
 * A reason under `minDays` is dropped entirely rather than shown with a thin
 * number: three days is already the floor `moodImpactRanking` uses for the same
 * kind of done-vs-skipped split, and it is the lowest count at which an average
 * stops being one anecdote. `without` needs `minDays` too — a journal where
 * every rated day carries the same reason has nothing to compare it against.
 *
 * Sorted by `delta` ascending, so the heaviest drag is the first row. Pure.
 */
export function moodReasonImpact(data: JournalData, minDays = 3): ReasonImpact[] {
  const rated = data.metrics.filter((m) => m.mood != null)
  if (rated.length === 0) return []

  const out: ReasonImpact[] = []
  for (const reason of MOOD_REASONS) {
    const withIt: number[] = []
    const withoutIt: number[] = []
    for (const m of rated) {
      // `includes` on a possibly-absent array: an untagged day counts as
      // "without", because it IS a day this reason was not recorded on. That is
      // a weaker statement than "this reason did not apply", and it is the only
      // one the data supports.
      if (m.moodReasons?.includes(reason)) withIt.push(m.mood!)
      else withoutIt.push(m.mood!)
    }
    if (withIt.length < minDays || withoutIt.length < minDays) continue
    const a = mean(withIt)!
    const b = mean(withoutIt)!
    out.push({
      reason,
      label: MOOD_REASON_LABEL[reason],
      withReason: a,
      without: b,
      delta: Math.round((a - b) * 10) / 10,
      days: withIt.length,
    })
  }
  return out.sort((x, y) => x.delta - y.delta)
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · The swing, week by week

export interface MoodWeek {
  /** ISO day the week starts on (Sunday, as everywhere else in this app). */
  week: string
  /** `MM-DD`, for an axis. */
  label: string
  /** Mean mood that week, or `null` under two rated days. */
  avg: number | null
  /** Population SD of that week's mood — **the swing**. `null` under two days. */
  swing: number | null
  /** Lowest and highest rated mood in the week. `null` when nothing was rated. */
  low: number | null
  high: number | null
  /** Rated days in the week. The n, per bucket. */
  days: number
}

/**
 * LEVEL AND SWING, on one axis, per week.
 *
 * "How is my mood swinging" is not the same question as "how is my mood", and a
 * mean cannot answer it: **a month averaging 6 with daily swings of ±4 is a
 * different month from a steady 6**, and they are the same number. So each week
 * carries both its mean and its spread, and the card draws the spread as a band
 * with the mean inside it — one 0–10 axis, no second scale, because a standard
 * deviation of 1.8 plotted against a mean of 6.2 on shared ticks is the
 * dual-axis mistake wearing a different hat.
 *
 * Two rated days is the floor for a spread, and it is arithmetic rather than
 * taste: the population SD of a single observation is 0, which would draw a
 * *perfectly steady* week from one logged day. That is the `count ? x : 0`
 * failure in a new costume — a week nobody logged reading as the calmest week
 * of the year — so a one-day week returns `avg: null, swing: null` and keeps
 * `low`/`high`/`days` so the card can say "one day logged" instead of drawing.
 *
 * Weeks run oldest → newest and every bucket is present even when empty; a
 * missing week is a gap in the record and the chart must show the gap rather
 * than close it. Pure + deterministic.
 */
export function moodSwingByWeek(data: JournalData, weeks = 12, today = todayISO()): MoodWeek[] {
  const moods = moodIndex(data)
  // Anchor on the Sunday of the current week so buckets are calendar weeks, not
  // trailing 7-day windows offset by whatever day the gate happens to run.
  const thisSunday = addDays(today, -fromISODay(today).getDay())
  const out: MoodWeek[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const start = addDays(thisSunday, -7 * w)
    const vals: number[] = []
    for (let i = 0; i < 7; i++) {
      const v = moods.get(addDays(start, i))
      if (v != null) vals.push(v)
    }
    if (vals.length < 2) {
      out.push({
        week: start,
        label: start.slice(5),
        avg: null,
        swing: null,
        low: vals.length ? Math.min(...vals) : null,
        high: vals.length ? Math.max(...vals) : null,
        days: vals.length,
      })
      continue
    }
    const m = vals.reduce((a, b) => a + b, 0) / vals.length
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length)
    out.push({
      week: start,
      label: start.slice(5),
      avg: Math.round(m * 10) / 10,
      swing: Math.round(sd * 100) / 100,
      low: Math.min(...vals),
      high: Math.max(...vals),
      days: vals.length,
    })
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · The join — mood around a lapse

export interface LapseLagPoint {
  /** Days from the lapse. `0` is the lapse day itself, `-1` the day before. */
  offset: number
  /** Mean mood across every lapse at this offset, or `null` if none was rated. */
  avg: number | null
  /** Rated days behind that mean. **The n, per point** — it is not constant. */
  days: number
}

export interface LapseLag {
  points: LapseLagPoint[]
  /** Distinct lapse days with at least one rated day anywhere in their window. */
  lapses: number
  /** Mean mood over every rated day in the journal — the line to read against. */
  baseline: number | null
  /** Rated days behind the baseline. */
  baselineDays: number
  /** True when any two counted lapses sit within `2 × span` days of each other. */
  windowsOverlap: boolean
}

/**
 * THE ONE CHART THAT SEPARATES TWO OPPOSITE STORIES.
 *
 * Mood at day −span … +span around each lapse day, averaged across lapses. It
 * exists because "low mood and lapses go together" is compatible with two
 * readings that imply opposite responses:
 *
 * - mood sags **before** day 0 and recovers after → the low ran into the lapse,
 *   and the thing to watch is the descent;
 * - mood is flat before and drops **after** → the lapse left its mark, and the
 *   thing to plan is the day after.
 *
 * A single correlation coefficient cannot tell those apart. A lag profile can,
 * and that is the whole argument for this function existing. It still does not
 * establish direction — a shape in seven averages is a shape, not a mechanism,
 * and nothing here says otherwise.
 *
 * **Returns `null` below `minLapses`.** Four, and it is a judgement: three
 * lapses means each point is an average of at most three numbers, where one bad
 * Tuesday moves the curve by a third of its range. Six would be safer and would
 * hide the pattern from anyone in their first months of tracking, which is
 * exactly who needs it. Four is where the curve stops being one person's
 * Tuesday. `points` is always the full `−span…+span` span so the shape is
 * readable; a point nobody rated carries `avg: null` and `days: 0`, never a
 * zero, and the caller must not `connectNulls` across it.
 *
 * `windowsOverlap` is the honesty flag: lapses close together share days, so a
 * single low Sunday can be counted as "the day before" one lapse and "three
 * days after" another. It is not a bug to fix by dropping data — it is a
 * property of a log where lapses cluster, which is most of them — so it is
 * reported and the card says it out loud.
 *
 * Pure + deterministic. Reads `data.nofap`; writes nothing.
 */
export function moodAroundLapse(
  data: JournalData,
  span = 3,
  minLapses = 4,
  today = todayISO(),
): LapseLag | null {
  const moods = moodIndex(data)
  if (moods.size === 0) return null

  // Only lapse days whose window touches at least one rated day can inform
  // anything; counting the rest would inflate `lapses` with events the chart
  // does not actually draw.
  const days = [...lapseDays(data)]
    .filter((d) => {
      for (let o = -span; o <= span; o++) if (moods.has(addDays(d, o))) return true
      return false
    })
    .sort()
  if (days.length < minLapses) return null

  const points: LapseLagPoint[] = []
  for (let offset = -span; offset <= span; offset++) {
    const vals: number[] = []
    for (const d of days) {
      const day = addDays(d, offset)
      // A day after today has not happened; it is absent, not neutral.
      if (day > today) continue
      const v = moods.get(day)
      if (v != null) vals.push(v)
    }
    points.push({ offset, avg: mean(vals), days: vals.length })
  }

  const all = [...moods.values()]
  let overlap = false
  for (let i = 1; i < days.length; i++) {
    const gap = Math.round(
      (fromISODay(days[i]).getTime() - fromISODay(days[i - 1]).getTime()) / 86_400_000,
    )
    if (gap <= span * 2) overlap = true
  }

  return {
    points,
    lapses: days.length,
    baseline: mean(all),
    baselineDays: all.length,
    windowsOverlap: overlap,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · The join — urges and lapses by mood band

export type MoodBandId = 'low' | 'middling' | 'bright'

export interface BandRisk {
  band: MoodBandId
  label: string
  /** Inclusive mood range for the band. */
  range: [number, number]
  /** Rated days in the band. **The n.** */
  days: number
  /** Of those, how many were also a lapse day. */
  lapseDays: number
  /** `lapseDays / days` as a 0–1 share, or `null` when the band has no days. */
  lapseRate: number | null
  /** Urges logged on days in this band (resisted ones — the urge log). */
  urges: number
  /** Mean self-rated intensity 1–5 of those urges, or `null` when none rated. */
  intensity: number | null
}

/** Ordinal, low → bright. The order carries meaning, so it is not alphabetical. */
const BANDS: { band: MoodBandId; label: string; range: [number, number] }[] = [
  { band: 'low', label: 'Low', range: [0, 3] },
  { band: 'middling', label: 'Middling', range: [4, 6] },
  { band: 'bright', label: 'Bright', range: [7, 10] },
]

/**
 * URGES AND LAPSES, SPLIT BY THE DAY'S MOOD.
 *
 * Three ordinal bands over the 0–10 scale, and for each one: how many days fell
 * in it, how many of those were lapse days, how many urges were logged on them
 * and how intense those urges were rated. It answers "is an urge worse on a bad
 * day" with four numbers instead of an adjective.
 *
 * Bands rather than a scatter because the reader's question is comparative
 * ("worse when I am low?") and a 0–10 × 1–5 scatter over thirty points answers
 * it by eye at best. Three is the most bands that keep a usable n in each; five
 * splits a month of logging into buckets of six days.
 *
 * `lapseRate` is a **share of that band's days, not a probability of lapsing**,
 * and the difference matters: it is computed only over days that carry a mood
 * rating, so it describes the rated days and nothing else. A band with no rated
 * days reports `null`, never `0` — "you never lapse when you are bright" and "you
 * have not rated a bright day" are opposite findings and the caller has to be
 * able to tell them apart.
 *
 * Returns `[]` below `minDays` rated days in total, because three bands over
 * four days is three numbers each standing on one observation. Bands with zero
 * days are kept in the result so the card can show the gap. Pure.
 */
export function moodBandRisk(data: JournalData, minDays = 5): BandRisk[] {
  const moods = moodIndex(data)
  if (moods.size < minDays) return []

  const lapses = lapseDays(data)
  const urges = data.nofap?.urgeLog ?? []

  return BANDS.map(({ band, label, range }) => {
    const [lo, hi] = range
    const inBand = [...moods.entries()].filter(([, v]) => v >= lo && v <= hi).map(([d]) => d)
    const bandDays = new Set(inBand)
    const rated = urges.filter((u) => bandDays.has(u.date))
    const intensities = rated.map((u) => u.intensity).filter((i): i is 1 | 2 | 3 | 4 | 5 => i != null)
    return {
      band,
      label,
      range,
      days: inBand.length,
      lapseDays: inBand.filter((d) => lapses.has(d)).length,
      // `null`, not 0. An empty band has no rate; it does not have a rate of nothing.
      lapseRate: inBand.length
        ? Math.round((inBand.filter((d) => lapses.has(d)).length / inBand.length) * 100) / 100
        : null,
      urges: rated.length,
      intensity: intensities.length
        ? Math.round((intensities.reduce((a, b) => a + b, 0) / intensities.length) * 10) / 10
        : null,
    }
  })
}

/**
 * Mean mood on lapse days against mean mood on every other rated day.
 *
 * The single sentence the join supports, as two numbers and two counts, for the
 * headline of the lag card. Deliberately NOT phrased here: this returns
 * figures, and the view writes "on the 6 lapse days logged, mood averaged 4.1
 * against your overall 6.3". `null` on either side when that side has no rated
 * day.
 */
export interface LapseMoodGap {
  onLapse: number | null
  onLapseDays: number
  otherwise: number | null
  otherwiseDays: number
}

export function lapseMoodGap(data: JournalData): LapseMoodGap {
  const moods = moodIndex(data)
  const lapses = lapseDays(data)
  const on: number[] = []
  const off: number[] = []
  for (const [day, v] of moods) (lapses.has(day) ? on : off).push(v)
  return {
    onLapse: mean(on),
    onLapseDays: on.length,
    otherwise: mean(off),
    otherwiseDays: off.length,
  }
}
