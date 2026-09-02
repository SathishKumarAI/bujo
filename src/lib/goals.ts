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
/**
 * Is this goal being met right now? · COD-48
 *
 * **Two different questions were both called "on track" on `?view=goals`.**
 * The headline counted `value >= target` — goals already *finished* — and the
 * per-goal pill next to it read `pace.onTrack` below, which is "the rate so far
 * is at least the rate the deadline needs". One phrase, two predicates, one
 * screen, and the headline was the one telling the bigger lie: five goals
 * mid-week and perfectly on pace were reported as "1 of 7 on track".
 *
 * `avoid` inverts it, and that half was simply absent. An avoid goal's target
 * is a **cap**: Caffeine at 2 of 5 is succeeding, and `value >= target` scored
 * it as a miss, so a good week counted as a failure. Nothing in the `Goal`
 * shape recorded which kind it was.
 *
 * Naming: "met", not "complete" and not "on track". The list mixes the two
 * kinds and neither of those words is true for both.
 */
export function goalMet(value: number, target: number, avoid = false): boolean {
  return avoid ? value <= target : value >= target
}

/**
 * How full the bar is, 0–1, clamped.
 *
 * For an avoid goal this is **allowance spent**, not progress — a full bar is
 * the bad end. The caller colours it accordingly; this function only measures.
 */
export function goalFraction(value: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(1, Math.max(0, value / target))
}

/**
 * Is a time-boxed goal keeping up with the clock? · COD-48
 *
 * `elapsed` is how far through the period we are (0–1) and `progress` is how
 * far through the target. **This is the third fact the Goals page owed the
 * reader and did not have.** "1 of 7 met" on a Wednesday is true and reads as a
 * disaster; five of those seven were exactly where they should be. Being met
 * and being on pace are different questions and the page now asks both.
 *
 * Returns null when the goal has no period to be measured against — a training
 * program or a streak-vs-best has no deadline, so "on pace" is meaningless
 * rather than false. Never conflate "no answer" with "no".
 *
 * A cap inverts it, same as `goalMet`: spending less of the allowance than the
 * week has spent of itself is ahead, not behind.
 */
export function goalOnPace(progress: number, elapsed: number, avoid = false): boolean {
  return avoid ? progress <= elapsed : progress >= elapsed
}

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
