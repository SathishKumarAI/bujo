import { addDays, prettyDay, todayISO } from './date'
import type { JournalData } from './types'
import { OVER_SLACK, type Targets } from './nutritionReview'

/**
 * NUTRITION OVER TIME · the day-by-day series the Trend row draws.
 *
 * WHAT THIS FILE OWNS: a dated series of intake, its extremes, and the run of
 * days inside target.
 * WHAT IT DOES NOT OWN: the fortnight aggregates (`nutritionReview.ts`), or how
 * any of it is drawn.
 *
 * Its own module rather than four more exports on `nutritionReview.ts`, which
 * is already 311 lines and is about what a fortnight ADDS UP TO. This is the
 * opposite question — what the individual days looked like — and the two have
 * different window lengths (14 days against eight weeks) for a reason worth
 * keeping separate: an average over eight weeks hides a bad fortnight, and a
 * wave over fourteen days has nothing to be a wave about.
 *
 * ── The one rule in here ──────────────────────────────────────────────────
 *
 * **A day you did not log is `null`, never `0`.** The chart then draws a GAP,
 * because a zero-calorie day is a claim nobody can make — CLAUDE.md records the
 * same mistake twice already (`count ? sum / count : 0` inventing a month of
 * total failure, and a heatmap labelling the days still to come as rest days).
 * `connectNulls={false}` on the Area is what makes that visible rather than a
 * straight line through the hole.
 */

export interface DayPoint {
  date: string
  /** `10 Oct` — the x axis reads dates, not ISO strings. */
  label: string
  /** `null` on a day with nothing logged. */
  kcal: number | null
  protein: number | null
  /** Over the target plus its slack. Meaningless on an unlogged day. */
  over: boolean
}

/**
 * Every day in the window, ascending, logged or not.
 *
 * Ascending because a chart reads left-to-right into the present;
 * `loggedDays` is descending because a list reads newest-first. Two orders for
 * two readers, and the comment is here so the next person does not "fix" one.
 */
export function dailySeries(
  data: JournalData,
  days = 56,
  today = todayISO(),
  targets?: Targets,
): DayPoint[] {
  const out: DayPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const m = data.metrics.find((x) => x.date === date)
    const kcal = m?.calories ?? 0
    const logged = kcal > 0
    out.push({
      date,
      label: prettyDay(date).replace(/^[A-Za-z]{3},\s*/, ''),
      kcal: logged ? kcal : null,
      protein: logged ? (m?.protein ?? 0) : null,
      over: logged && targets != null && kcal > targets.calories * OVER_SLACK,
    })
  }
  return out
}

export interface Extremes {
  high: DayPoint | null
  low: DayPoint | null
  /** Days in the window with something on them. */
  logged: number
  /** Biggest day minus smallest, or `null` under the floor. */
  spread: number | null
}

/**
 * The peaks the wave is for.
 *
 * **A floor of three**, and on the logged days rather than on the window: a
 * "highest day" drawn from a single logged day is that day described twice,
 * and a spread computed from two is noise with a number on it. The same
 * two-sided floor `trainingBalance` carries, for the same reason — CLAUDE.md's
 * "a floor of two is not a floor".
 */
export const EXTREME_FLOOR = 3

export function extremes(series: DayPoint[]): Extremes {
  const logged = series.filter((d): d is DayPoint & { kcal: number } => d.kcal != null)
  if (logged.length < EXTREME_FLOOR) {
    return { high: null, low: null, logged: logged.length, spread: null }
  }
  let high = logged[0]
  let low = logged[0]
  for (const d of logged) {
    if (d.kcal > high.kcal) high = d
    if (d.kcal < low.kcal) low = d
  }
  return { high, low, logged: logged.length, spread: high.kcal - low.kcal }
}

/**
 * The heatmap's cells: calories per day, zero where nothing was logged.
 *
 * `CalendarHeatmap` buckets by QUARTILE over the non-zero days and treats zero
 * as empty, so the unlogged days draw as the empty ground rather than as a
 * light-but-real value — which is the same "null, not zero" rule arriving
 * through that component's own convention instead of through a type.
 */
export function heatDays(data: JournalData, days = 84, today = todayISO()): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const kcal = data.metrics.find((x) => x.date === date)?.calories ?? 0
    out.push({ date, value: kcal > 0 ? kcal : 0 })
  }
  return out
}

/**
 * The longest run of consecutive LOGGED days inside target in the window.
 *
 * Different from `inTargetStreak`, which runs backwards from today and answers
 * "am I on one now". This answers "how good has it ever been", which is the
 * figure that makes a wave worth looking at twice.
 */
export function bestInTargetRun(series: DayPoint[], targets: Targets): number {
  let best = 0
  let run = 0
  for (const d of series) {
    if (d.kcal == null) { run = 0; continue }
    if (d.kcal <= targets.calories * OVER_SLACK) { run += 1; best = Math.max(best, run) } else { run = 0 }
  }
  return best
}
