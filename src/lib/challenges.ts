import type { Challenge, JournalData } from './types'
import { addDays, dayDiff, todayISO } from './date'

/** Built-in challenge presets. `rules` are the daily required tasks. */
export interface ChallengePreset {
  name: string
  durationDays: number
  strict: boolean
  rules: string[]
}

export const CHALLENGE_PRESETS: ChallengePreset[] = [
  {
    name: '75 Hard',
    durationDays: 75,
    strict: true,
    rules: [
      'Two 45-min workouts (1 outdoor)',
      'Follow a diet — no cheat meals',
      'Drink 1 gallon of water',
      'Read 10 pages of nonfiction',
      'Take a progress photo',
      'No alcohol',
    ],
  },
  {
    name: '75 Soft',
    durationDays: 75,
    strict: false,
    rules: ['One 45-min workout', 'Eat well (one cheat meal/week ok)', 'Drink 3L water', 'Read 10 pages'],
  },
  {
    name: '90-day',
    durationDays: 90,
    strict: false,
    rules: ['Move your body', 'Eat clean', 'Sleep 7+ hours', 'One deliberate habit'],
  },
  {
    name: '30-day',
    durationDays: 30,
    strict: false,
    rules: ['Your daily habit'],
  },
  {
    name: 'Custom',
    durationDays: 30,
    strict: false,
    rules: [],
  },
]

/** Rule indices marked done for a challenge on a given ISO day. */
export function rulesDoneOn(data: JournalData, challengeId: string, day: string): number[] {
  return data.challengeLog?.[challengeId]?.[day] ?? []
}

/** A day is complete when every rule is checked. */
export function isDayComplete(data: JournalData, c: Challenge, day: string): boolean {
  // A zero-rule challenge (e.g. a freshly-created Custom one with no rules yet)
  // has nothing to check off, so every elapsed day is trivially complete. Without
  // this guard such a challenge can never advance and is stuck at 0% forever.
  if (c.rules.length === 0) return true
  return rulesDoneOn(data, c.id, day).length >= c.rules.length
}

/** Calendar day number within the challenge (1-based), clamped to [0, duration]. */
export function elapsedDay(c: Challenge, today: string): number {
  const diff = dayDiff(c.startDate, today) // 0 on the start day
  if (diff < 0) return 0
  return Math.min(diff + 1, c.durationDays)
}

/** Count of fully-complete days within the challenge window. */
export function completedDays(data: JournalData, c: Challenge, today: string): number {
  const upto = elapsedDay(c, today)
  let n = 0
  for (let i = 0; i < upto; i++) {
    if (isDayComplete(data, c, addDays(c.startDate, i))) n += 1
  }
  return n
}

/** Consecutive complete days ending the day before `today` (whole number). */
export function streakBeforeToday(data: JournalData, c: Challenge, today: string): number {
  let n = 0
  let d = addDays(today, -1)
  while (dayDiff(c.startDate, d) >= 0) {
    if (isDayComplete(data, c, d)) {
      n += 1
      d = addDays(d, -1)
    } else break
  }
  return n
}

/**
 * Whole-number percent complete (0–100), never a fraction.
 *
 * Single source of truth = `completedDays`, the same count the review strip
 * shows. `progressDay` used to live here — the day you are "on", which for a
 * strict challenge was `streakBeforeToday + 1`. The view printed it beside the
 * streak and beside `elapsedDay`, so the page showed day 4, day 5 done and day
 * 9 elapsed at once and read as three contradictory counts. It had no other
 * caller, so it is gone rather than merely unused; the strict reset is told by
 * the streak, which is the same number said once.
 */
export function percentComplete(data: JournalData, c: Challenge, today: string): number {
  if (!c.durationDays) return 0 // guard 0-duration (imported/legacy) → avoid NaN in the ProgressRing
  return Math.round((completedDays(data, c, today) / c.durationDays) * 100)
}

/**
 * Days already gone by without every rule ticked.
 *
 * Today is deliberately NOT counted while it is still open — you have not
 * missed a day you are still living. That makes the three review numbers a
 * partition of the elapsed window rather than three unrelated counts:
 *
 *     completedDays + missedDays + (1 if today is still open) === elapsedDay
 *
 * The page used to print `duration - completedDays` as "days left" beside
 * `elapsedDay`, which counts from a different origin, so the numbers could not
 * be reconciled by anyone adding them up. `challenges.test.ts` asserts the
 * identity above; it is the whole reason this function exists rather than
 * being inlined in the view.
 */
export function missedDays(data: JournalData, c: Challenge, today: string): number {
  const elapsed = elapsedDay(c, today)
  if (elapsed === 0) return 0
  const open = isDayComplete(data, c, today) ? 0 : 1
  return Math.max(0, elapsed - completedDays(data, c, today) - open)
}

/** Longest run of consecutive complete days so far (best streak). */
export function longestStreak(data: JournalData, c: Challenge, today = todayISO()): number {
  const upto = elapsedDay(c, today)
  let best = 0
  let run = 0
  for (let i = 0; i < upto; i++) {
    if (isDayComplete(data, c, addDays(c.startDate, i))) { run += 1; best = Math.max(best, run) } else run = 0
  }
  return best
}

/** True once the whole challenge has been completed. */
export function isFinished(data: JournalData, c: Challenge, today: string): boolean {
  if (c.strict) return streakBeforeToday(data, c, today) + (isDayComplete(data, c, today) ? 1 : 0) >= c.durationDays
  return completedDays(data, c, today) >= c.durationDays
}

/** One rule's record across the elapsed window. */
export interface RuleRecord {
  index: number
  rule: string
  /** Elapsed days on which this rule was ticked. */
  done: number
  /** Elapsed days it could have been ticked on — today included, as it is open. */
  of: number
}

/**
 * WHICH RULE IS ACTUALLY BEING MISSED.
 *
 * The page could say how many days were complete and never which rule broke
 * them, so "I keep missing a day" had no answer on the screen — a 75-day
 * challenge with five rules has one rule costing you the day, and the whole
 * log knows which.
 *
 * Counted over the ELAPSED window, the same origin as `completedDays` and
 * `missedDays`, so `done` can be read against `elapsedDay` without a second
 * arithmetic. Today is included in `of` because it is a day you can still
 * tick — the same rule `missedDays` applies from the other side, where today
 * is not yet a miss.
 *
 * Order is the rule order, which is the order they are drawn and ticked in.
 * Not sorted by worst: a list that reorders itself as you tick is a list you
 * cannot build a habit against.
 */
export function ruleCompletion(data: JournalData, c: Challenge, today: string): RuleRecord[] {
  const upto = elapsedDay(c, today)
  return c.rules.map((rule, index) => {
    let done = 0
    for (let i = 0; i < upto; i++) {
      if (rulesDoneOn(data, c.id, addDays(c.startDate, i)).includes(index)) done += 1
    }
    return { index, rule, done, of: upto }
  })
}

/** A `nextStep` rule's id and its sentence. `weak` is the only one with a destination. */
export interface ChallengeStep {
  id: 'not-started' | 'finished' | 'reset' | 'left' | 'weak' | 'done'
  text: string
  /** True when the sentence is about the rule-by-rule panel. */
  toRules?: true
}

/**
 * THE ONE SENTENCE AT THE TOP OF THIS PAGE · what to do, not only what is true.
 *
 * `docs/PAGE-ROLLOUT.md` step 6. Zone 1 was four facts — `Today 3 of 5 rules`
 * · `Day 9 of 75` · `Streak 2` · `Complete 8%` — all true, none of them
 * telling you that the rule you keep dropping is the water one.
 *
 * Priority is urgency, which is also the order a reader asks in:
 *
 * | rule | fires when |
 * |---|---|
 * | `not-started` | day 1 has not arrived; there is nothing to tick |
 * | `finished` | the last day is behind you and the thing to do is close it |
 * | `reset` | a strict challenge lost its streak to yesterday |
 * | `left` | today is open, and it names the rule when exactly one remains |
 * | `weak` | today is done and one rule trails the rest — the answer to "I keep missing a day" |
 * | `done` | the floor to stand on |
 *
 * Total, like every other `nextStep` in this app, so zone 1 renders it with no
 * conditional that would leave a hole at the top of the page.
 *
 * **`weak` needs a window before it may name a rule.** Under four elapsed days
 * a single miss makes a rule "the worst" by a margin of one, which is a
 * headline over a sample of three — the floor every two-window figure in this
 * app carries, for the reason `momentumIndicator` is in CLAUDE.md. It also
 * requires a real gap (the rule must trail the best by more than one day), or
 * it reports noise as a finding.
 */
export function nextStep(data: JournalData, c: Challenge, today = todayISO()): ChallengeStep {
  const day = elapsedDay(c, today)
  if (dayDiff(c.startDate, today) < 0) {
    const away = -dayDiff(c.startDate, today)
    return { id: 'not-started', text: `Day 1 is ${c.startDate}, ${away} ${away === 1 ? 'day' : 'days'} away. Nothing to tick yet.` }
  }
  if (isFinished(data, c, today)) {
    return { id: 'finished', text: `All ${c.durationDays} days are behind you. Archive it to close it out.` }
  }

  const doneToday = rulesDoneOn(data, c.id, today)
  const left = c.rules.filter((_, i) => !doneToday.includes(i))

  if (c.strict && streakBeforeToday(data, c, today) === 0 && missedDays(data, c, today) > 0) {
    // Said as what happened, not as a verdict. A strict challenge resetting is
    // the rule working, and the page's job is to say the streak starts again
    // rather than to grade the person.
    //
    // It carries the action too, because it outranks `left` and a sentence
    // that takes the top of the page from the one that says what to tick owes
    // the reader that half as well.
    const tail = left.length === 0
      ? `Today is done, so it starts at one.`
      : `${left.length} of ${c.rules.length} rules to tick today.`
    return { id: 'reset', text: `A missed day reset the streak — strict starts again from here. ${tail}` }
  }
  if (left.length > 0) {
    /* NAME THEM while naming them is short.
     *
     * The count alone was the facts row said twice: `Today · 3 of 5 rules` is
     * eight pixels below, and "2 of 5 rules left today" is the same sentence
     * subtracted — this page's own history is five statements of progress
     * with four denominators, and a sixth would be the same mistake. Which
     * rules are left is the half the facts cannot carry.
     *
     * Two is the ceiling: three rule names is a sentence nobody reads at the
     * top of a page, and at that point the count IS the useful shape. */
    return {
      id: 'left',
      text: left.length <= 2
        ? `Left today: ${left.join(' and ')}.`
        : `${left.length} of ${c.rules.length} rules left today.`,
    }
  }

  const rows = ruleCompletion(data, c, today)
  if (day >= 4 && rows.length > 1) {
    const worst = rows.reduce((a, b) => (b.done < a.done ? b : a))
    const best = rows.reduce((a, b) => (b.done > a.done ? b : a))
    if (best.done - worst.done > 1) {
      return {
        id: 'weak',
        text: `Today is done. ${worst.rule} is the one slipping — ${worst.done} of ${worst.of} days.`,
        toRules: true,
      }
    }
  }
  return { id: 'done', text: `Today is done. Day ${day} of ${c.durationDays}, and every rule is keeping pace.` }
}
