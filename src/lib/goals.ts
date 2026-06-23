import { dayDiff } from './date'

/**
 * Pace toward a custom goal's deadline (#95/#261). Given the current `value`,
 * the `target`, when the goal was created, its `due` ISO day, and `today`,
 * computes how much per day is still needed to finish on time and whether the
 * current run-rate is on track. Pure + unit-tested.
 *
 * Returns null when there's no deadline (`due` falsy) — callers then show no
 * pace at all. Otherwise:
 *   - `perDayNeeded` — remaining work ÷ days left (0 when already complete).
 *     If the deadline is today or past and work remains, it's the whole
 *     remainder (you'd need it all "today").
 *   - `daysLeft` — calendar days from today to the due date (negative if past).
 *   - `remaining` — target − value, clamped at 0.
 *   - `pastDue` — the deadline has passed (today > due).
 *   - `onTrack` — the observed pace so far (value ÷ elapsed days) is at least the
 *     pace originally required (target ÷ total span). Complete goals are always
 *     on track; a past-due-but-incomplete goal is never on track.
 */
export interface GoalPace {
  perDayNeeded: number
  daysLeft: number
  remaining: number
  pastDue: boolean
  onTrack: boolean
}

export function goalPace(
  value: number,
  target: number,
  createdAt: string,
  due: string | undefined,
  today: string,
): GoalPace | null {
  if (!due) return null
  const remaining = Math.max(0, target - value)
  const complete = remaining === 0
  const daysLeft = dayDiff(today, due) // >0 future, 0 today, <0 past
  const pastDue = daysLeft < 0

  // Per-day still needed: spread the remainder over the days left (today counts,
  // so a due-today/past goal needs the whole remainder at once).
  const perDayNeeded = complete ? 0 : remaining / Math.max(1, daysLeft + 1)

  // On-track: compare the pace achieved so far against the pace the deadline
  // originally demanded. Elapsed/total measured in days, both ≥1 to avoid div0.
  const totalSpan = Math.max(1, dayDiff(createdAt, due))
  const elapsed = Math.max(1, dayDiff(createdAt, today))
  const requiredRate = target / totalSpan
  const observedRate = value / elapsed
  const onTrack = complete ? true : pastDue ? false : observedRate >= requiredRate

  return {
    perDayNeeded: Math.round(perDayNeeded * 100) / 100,
    daysLeft,
    remaining,
    pastDue,
    onTrack,
  }
}
