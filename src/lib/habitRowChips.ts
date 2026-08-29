/**
 * HABIT ROW CHIPS · what a habit's name cell is allowed to say, and how much.
 *
 * This module owns one decision: given a habit, which small marks sit beside
 * its name in the tracker grid. It exists because that decision used to be six
 * independent ternaries inline in the row, and six is what you get when each
 * one is added on its own and nothing counts the total.
 *
 * What the row was rendering, measured on the demo journal:
 *
 *     Vegetables 🏃 🔥5 53%30d ↺back 5d·18 ◆60 C 5d clean
 *
 * Seven marks in five colours at 10px, around a name capped at 10rem. Three of
 * them are the same measurement — `53%30d` is the flat 30-day completion rate,
 * `◆60` is the recency-weighted consistency score, and the letter `C` is a
 * grade that `habitGrade` documents as "a thin, pure mapping over
 * consistencyScore". The row's trailing `%` column is a fourth expression of
 * the same idea. None of that was a bug in any single commit; it is what
 * happens when the cap is nowhere.
 *
 * So the cap lives here, in the return type's contract rather than in a review
 * comment: **at most two chips, chosen in priority order.** Adding a new kind
 * of mark now means deciding what it outranks, which is the conversation that
 * was never forced before.
 *
 * Nothing was deleted from the app to achieve this. Everything the row stopped
 * showing is on the habit's detail panel, most of it already there and better
 * labelled — the 30-day rate, the 90-day rate, and the score and its grade as a
 * titled "Habit strength" meter. The two that had no home (`habitComeback` and
 * `daysSinceLastMiss`) were added to that panel in the same change.
 *
 * Presentation-free by design: the caller picks icons and colours. This decides
 * *what is worth saying*, not how it looks.
 */
import { cleanStreak, habitStreak, weeklyHabitCount } from './stats'
import { habitComeback, nextHabitMilestone } from './streak'
import type { Habit, JournalData } from './types'

export type HabitChip =
  /** Consecutive days done. The one number the month grid cannot be read for at a glance. */
  | { kind: 'streak'; days: number }
  /** Consecutive days *not* logged, for a habit being quit — where a logged day is the miss. */
  | { kind: 'clean'; days: number }
  /** Progress against a target the user set for this week. */
  | { kind: 'weekly'; done: number; goal: number }
  /** Days rebuilt since a lapse, and how many lapses there have been. */
  | { kind: 'comeback'; days: number; count: number }
  /** The next clean-day milestone for a quit habit, and how far off it is. */
  | { kind: 'milestone'; day: number; daysToGo: number }

/** The most this may ever return. Asserted, not just documented. */
export const MAX_ROW_CHIPS = 2

/**
 * At most {@link MAX_ROW_CHIPS} chips for one habit's row, most important first.
 *
 * The order is a claim about what a person acts on, not about what is cheapest
 * to compute:
 *
 * 1. **Standing** — the streak, or the clean run for a quit habit. Always first
 *    when there is one, because it is the only figure here the surrounding grid
 *    of thirty-one cells does not already show.
 * 2. **One situational mark.** A weekly goal outranks everything else the habit
 *    could say, because it is a commitment the user typed in rather than a
 *    number this app inferred about them. Failing that, a build habit may show
 *    that it is recovering from a lapse, and a quit habit its next milestone.
 *
 * A one-day streak is not a streak, so it is suppressed — otherwise every habit
 * logged once carries a mark and the chip stops meaning anything.
 *
 * The same floor applies to a comeback, which is less obvious and was wrong on
 * screen before this module existed: `habitComeback` reports `recovering` the
 * moment a single day follows a gap, so a habit logged once today read "↺ back
 * 1d" — a sentence that says only "you did it today", which the cell beside it
 * already says. Three of the eleven habits in the demo journal carried it.
 */
export function habitRowChips(data: JournalData, habit: Habit, today: string): HabitChip[] {
  const chips: HabitChip[] = []
  const avoid = !!habit.avoid

  if (avoid) {
    chips.push({ kind: 'clean', days: cleanStreak(data, habit.id, today) })
  } else {
    const streak = habitStreak(data, habit.id, today)
    if (streak > 1) chips.push({ kind: 'streak', days: streak })
  }

  if (habit.weeklyGoal) {
    chips.push({ kind: 'weekly', done: weeklyHabitCount(data, habit.id, today), goal: habit.weeklyGoal })
  } else if (avoid) {
    // `nextHabitMilestone` returns null once every milestone is behind you,
    // which is the one case a quit habit has nothing left to aim at.
    const m = nextHabitMilestone(cleanStreak(data, habit.id, today))
    if (m) chips.push({ kind: 'milestone', day: m.day, daysToGo: m.daysToGo })
  } else {
    const c = habitComeback(data, habit, today)
    if (c?.recovering && c.current > 1) chips.push({ kind: 'comeback', days: c.current, count: c.comebackCount })
  }

  return chips.slice(0, MAX_ROW_CHIPS)
}
