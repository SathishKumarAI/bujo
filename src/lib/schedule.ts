import type { Habit, JournalData } from './types'
import { fromISODay } from './date'

/**
 * WHEN IS A HABIT DUE · the one answer, and the only thing this file owns.
 *
 * It does not own streaks, completion rates, grades or any analytic built on
 * top of the answer — those are `streak.ts` and `habitStats.ts`, both of which
 * import this. It sits below them on purpose: `habitStats` already imports
 * `stats`, so the moment `stats.ts` needed the same rule there was nowhere to
 * put it that did not close a cycle.
 */

/** Is the habit scheduled on this ISO day (started + active weekday)? */
export function isScheduledOn(h: Habit, day: string): boolean {
  if (day < h.startedOn) return false
  return !h.activeDays?.length || h.activeDays.includes(fromISODay(day).getDay())
}

/**
 * THE list of habits a given day actually asks of you (COD-199).
 *
 * `isScheduledOn` was already the definition, and seven call sites re-typed
 * the weekday half of it inline and **dropped the `startedOn` half** — so a
 * habit you had scheduled to begin next Monday was already being shown,
 * counted, and in one case penalised:
 *
 * | Call site | What the omission did |
 * |---|---|
 * | `TodayStrip` / `Trackers` header | offered a not-yet-started habit to tick |
 * | `RoutineTimeline` | listed it at full opacity and inflated `done/scheduled` |
 * | `lib/penalties.missesFor` | **assigned make-up drills for missing it** |
 * | `stats.reminderMessage` | would warn about its streak (masked by `streak >= 3`) |
 *
 * Nothing failed, because two hand-written filters that agree with each other
 * and disagree with the shared function look identical in review — the comment
 * on `Trackers.tsx` even said "same filter TodayStrip applies, so the header
 * count and the chips agree", which was true of each other and false of the
 * `isScheduledOn` call one line above it.
 *
 * Not every inline copy was wrong, and that is the trap: `CategoryRows` names
 * a local `scheduled` that genuinely means the weekday half, because it
 * combines it with a separate `before = d < h.startedOn` to grey the cell
 * differently. It is left alone. Grep found thirteen matches; six of them were
 * already correct.
 */
export function habitsDueOn(
  data: JournalData,
  day: string,
  opts: {
    /** Trackers' "show archived" setting. Default: archived habits are out. */
    includeArchived?: boolean
    /** Only `check` habits — for surfaces that render a checkbox and have no
     *  stepper to offer a count or timer habit. */
    checkOnly?: boolean
    /** Drop `avoid` habits. A slip is not a completion, so any *ratio* wants
     *  this; a list of chips to tap does not. */
    buildOnly?: boolean
  } = {},
): Habit[] {
  return data.habits.filter(
    (h) =>
      (opts.includeArchived || !h.archived) &&
      (!opts.checkOnly || (h.type ?? 'check') === 'check') &&
      (!opts.buildOnly || !h.avoid) &&
      isScheduledOn(h, day),
  )
}
