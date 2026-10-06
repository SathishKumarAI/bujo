/**
 * WHAT A COACHING WEEK COVERS, AND WHAT YOU ACTUALLY LOGGED INSIDE IT.
 *
 * Owns: turning a program week number into an ISO day range, and joining
 * `data.pickleball` to it. Does not own the curriculum (`pickleballAcademy.ts`,
 * static content), the page's layout (`views/Coaching.tsx`), or any analytics
 * over sessions in general (`pickleball.ts`).
 *
 * **Why this exists.** The Coaching page let you tick a week done and say
 * nothing else — twelve toggles, no text field anywhere on the page — while
 * `data.pickleball` already held the sessions you played that week with their
 * score, partner, venue and notes. Two records of the same seven days with no
 * link between them, which is the same shape as a 75-Hard rule reading "one
 * 45-min workout" beside a `data.workouts` that holds the workout you did.
 *
 * The join is a **date range**, not a stored week id. A session has no week
 * field and should not grow one: the week it falls in is derived from
 * `settings.coachingStart`, so moving or restarting the program re-derives
 * every week rather than orphaning a column of stale ids. The cost is that
 * re-starting the program re-attributes old sessions, which is the honest
 * answer — they happened on those days either way.
 *
 * Its own file rather than an export in `pickleball.ts` (758 lines, already
 * past this repo's 500-line ceiling) or in `pickleballAcademy.ts`, whose header
 * promises "pure static content … no state".
 */

import { addDays, dayDiff } from './date'

/** Days in one program week. The academy's `WEEKLY_TEMPLATE` is Mon–Sun. */
export const COACHING_WEEK_DAYS = 7

/**
 * The ISO day range program week `week` covers, counting from `start`.
 *
 * Week 1 is `start` itself through `start + 6`, inclusive at both ends — which
 * is why `to` is `+6` and not `+7`. An off-by-one here would put every seventh
 * session in two weeks at once and double every count on the page.
 */
export function coachingWeekRange(start: string, week: number): { from: string; to: string } {
  const offset = (week - 1) * COACHING_WEEK_DAYS
  return { from: addDays(start, offset), to: addDays(start, offset + COACHING_WEEK_DAYS - 1) }
}

/** Which program week an ISO day falls in, or `null` if it is before the start. */
export function coachingWeekOf(start: string, date: string): number | null {
  const d = dayDiff(start, date)
  return d < 0 ? null : Math.floor(d / COACHING_WEEK_DAYS) + 1
}

/**
 * The rows logged inside a program week, oldest first.
 *
 * Generic over `{ date }` so it serves `PickleballSession` without importing
 * the journal types — the only thing this needs from a row is its day, and a
 * narrower signature is a smaller thing to keep true.
 */
export function rowsInCoachingWeek<T extends { date: string }>(rows: T[], start: string, week: number): T[] {
  const { from, to } = coachingWeekRange(start, week)
  return rows.filter((r) => r.date >= from && r.date <= to).sort((a, b) => (a.date < b.date ? -1 : 1))
}

export interface WeekPlay {
  sessions: number
  games: number
  won: number
  minutes: number
}

/**
 * What a week's play adds up to — the one-line receipt under a week row.
 *
 * Returns zeros rather than `null` for a week with no sessions, because the
 * caller renders a different thing entirely in that case ("nothing logged for
 * these days") and the zeros are never shown as a measurement. Compare the
 * `count ? sum / count : 0` trap in CLAUDE.md: there the zero would have been
 * *displayed* as a score, which is the case that needs a null.
 */
export function weekPlay(rows: { gamesWon: number; gamesLost: number; durationMin?: number }[]): WeekPlay {
  return {
    sessions: rows.length,
    games: rows.reduce((a, s) => a + s.gamesWon + s.gamesLost, 0),
    won: rows.reduce((a, s) => a + s.gamesWon, 0),
    minutes: rows.reduce((a, s) => a + (s.durationMin ?? 0), 0),
  }
}
