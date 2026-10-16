import { todayISO } from './date'
import type { JournalData } from './types'
import { streakStats } from './streak'
import { recordApproach, urgeQuietStretch } from './urge'
import type { Group } from './recoveryCards'

/**
 * ONE SENTENCE AT THE TOP OF RECOVERY, saying what to do rather than what is
 * true.
 *
 * WHAT THIS FILE OWNS: which of the page's facts is the one worth saying right
 * now, and the group it points into.
 * WHAT IT DOES NOT OWN: any of the arithmetic — it reads `streak.ts` and
 * `urge.ts` and decides nothing numeric of its own.
 *
 * Every other page on the three-zone contract got one of these
 * (`lib/pickleball.ts`, `lib/fitnessReview.ts`, `lib/nutritionReview.ts`) and
 * Recovery did not: zone 1 was a bare `StatBar` — **53px of four figures** —
 * on the page with the most to say. "47 days clean" and "personal best 61" are
 * two numbers a reader has to subtract for themselves before either means
 * anything, and the subtraction is the whole point: *you are fourteen days
 * from your record*.
 *
 * ── Three rules, the same three every `nextStep` here follows ─────────────
 *
 * 1. **It is total.** It always returns a sentence, so zone 1 renders with no
 *    conditional and the page can never open with a hole where its headline
 *    should be.
 * 2. **It names a GROUP**, so the sentence can be a button into the rail row
 *    that elaborates it. A sentence about risky hours that cannot reach the
 *    risky-hours card is a sentence that makes you go looking.
 * 3. **The order is by what you can do about it**, not by severity. A reset
 *    today outranks a record you are approaching, because the first is a
 *    decision in front of you and the second is a week away.
 *
 * **It never congratulates a streak into a score.** The page deliberately
 * stopped counting "urges resisted" as a headline — a counter you can inflate
 * by tapping a button is not recovery — so this says what is *at stake* and
 * what the record is, and leaves the scoreboard off.
 */
export interface RecoveryStep {
  id: 'first' | 'reset' | 'edge' | 'close' | 'record' | 'quiet' | 'resisting' | 'steady'
  text: string
  /** The rail row that elaborates it. */
  group: Group
}

/**
 * How long without a logged urge counts as a finding rather than a gap.
 *
 * A week, because `urgeQuietStretch` measures days since the LAST urge and a
 * two-day quiet is Tuesday. Below this the sentence has nothing to say that
 * the day count does not already say better.
 */
export const QUIET_DAYS = 7

export function recoveryStep(data: JournalData, today = todayISO()): RecoveryStep {
  const s = data.nofap
  const stats = streakStats(data, today)
  const relapses = s.relapses ?? []
  const urges = s.urgeLog ?? []
  const resetToday = relapses.some((r) => r.date === today)
  const approach = recordApproach(stats.current, stats.best)

  // Nothing to say anything about yet. Not an error state — a first day.
  if (relapses.length === 0 && urges.length === 0 && stats.current === 0) {
    return {
      id: 'first',
      text: 'Nothing logged yet. Ride out one urge and log it, and this page starts telling you when they hit.',
      group: 'patterns',
    }
  }

  /*
    A RESET TODAY IS THE ONLY THING WORTH SAYING TODAY, and the wording is the
    load-bearing part. "You broke your streak" is a verdict; what the page is
    for is the next decision, and the ledger is the card that holds it.
  */
  if (resetToday) {
    return {
      id: 'reset',
      text: `Reset logged today. Day one again — and ${stats.totalClean} clean days do not go back in the box.`,
      group: 'feedback',
    }
  }

  /*
    A RECORD NEEDS A PREVIOUS ONE TO BEAT.

    `recordApproach` reports `record` whenever `current >= best`, and
    `streakStats` derives `best` as `max(stored, current, longestGap)` — so for
    anyone who has never logged a reset, current IS best, every day, forever.
    "Past your old record" would have been the page's permanent headline for
    the people it is least useful to, and it would have been false: you are not
    past a record you are currently setting.

    So the comparison branches need a history to compare against. Without one
    the sentence falls through to what is actually true.
  */
  const hasHistory = relapses.length > 0

  if (hasHistory && approach.tier === 'edge') {
    return {
      id: 'edge',
      text: `One day from your record of ${stats.best}. Whatever the urge offers, it is not worth your best streak ever.`,
      group: 'progress',
    }
  }
  if (hasHistory && (approach.tier === 'close' || approach.tier === 'near')) {
    return {
      id: 'close',
      text: `${approach.daysToBeat} day${approach.daysToBeat === 1 ? '' : 's'} from your record of ${stats.best}. Hold the line.`,
      group: 'progress',
    }
  }
  if (hasHistory && approach.tier === 'record' && stats.current > 0) {
    return {
      id: 'record',
      text: `${stats.current} days — past your old record of ${stats.best}. Every day from here is new ground.`,
      group: 'progress',
    }
  }

  /*
    A LONG QUIET STRETCH IS A FINDING, not a silence. Days since the last
    logged urge says the pressure is off in a way the day count cannot — and it
    is the one figure here that gets BETTER the less you use the page, so it
    has to be said out loud or nobody will ever see it.
  */
  const quiet = urgeQuietStretch(urges, today)
  if (!quiet.empty && quiet.days >= QUIET_DAYS) {
    return {
      id: 'quiet',
      text: `${quiet.days} days without logging an urge. That is the craving easing off, not just a quiet week.`,
      group: 'patterns',
    }
  }

  if (urges.length >= 5) {
    return {
      id: 'resisting',
      text: `${stats.current} days clean, and ${urges.length} urges logged. Check which hours they land in — that is where a plan goes.`,
      group: 'patterns',
    }
  }

  /*
    The fallback says what is true, and what is true differs. Someone with no
    resets has no "best" to be measured against — `best` is their current run,
    and printing both is the same number twice. Someone with a history gets the
    comparison, which is the whole point of keeping one.
  */
  return {
    id: 'steady',
    text: hasHistory
      ? `${stats.current} day${stats.current === 1 ? '' : 's'} clean, best ${stats.best}. ${stats.totalClean} clean days all told.`
      : `${stats.current} day${stats.current === 1 ? '' : 's'} clean, and no resets logged. This is your record so far.`,
    group: 'progress',
  }
}
