// ── Date helpers (local-time, no external dep) ───────────────────────────────

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Format a Date as a local ISO day "YYYY-MM-DD" (no UTC shift). */
export function toISODay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's ISO day in local time. */
export function todayISO(now: Date = new Date()): string {
  return toISODay(now)
}

/** Parse "YYYY-MM-DD" into a local Date at midnight. */
export function fromISODay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "2026-06" month key from an ISO day or Date. */
export function ymOf(input: string | Date): string {
  const iso = typeof input === 'string' ? input : toISODay(input)
  return iso.slice(0, 7)
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate()
}

/** Add (or subtract) days to an ISO day, returning a new ISO day. */
export function addDays(iso: string, delta: number): string {
  const d = fromISODay(iso)
  d.setDate(d.getDate() + delta)
  return toISODay(d)
}

/** Human label, e.g. "Wed, Jun 10". */
export function prettyDay(iso: string): string {
  const d = fromISODay(iso)
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`
}

/** "June 2026" */
export function prettyMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

/** All ISO days of a given "YYYY-MM" month. */
export function monthDays(ym: string): string[] {
  const [y, m] = ym.split('-').map(Number)
  const n = daysInMonth(y, m)
  return Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`)
}

/** Weekday header labels ordered for a given week start (0=Sun, 1=Mon). */
export function weekdayLabels(weekStart: 0 | 1): string[] {
  return weekStart === 1 ? [...WEEKDAYS.slice(1), WEEKDAYS[0]] : WEEKDAYS
}

/** Grid column offset (0–6) for an ISO day given the week start. */
export function weekColumn(iso: string, weekStart: 0 | 1): number {
  const dow = fromISODay(iso).getDay()
  return weekStart === 1 ? (dow + 6) % 7 : dow
}

/**
 * The seven ISO days of the calendar week containing `iso`, in display order.
 *
 * Lives here, not inline in the Plan view, because it is the one piece of that
 * page with a real off-by-one available to it: on a Sunday with `weekStart: 1`
 * the naive `-getDay()` puts you at the *start of the week that is ending*, so
 * the week shown is the previous one and today is its last cell. `weekColumn`
 * already knows the shift; this reuses it rather than restating it.
 */
export function weekDaysOf(iso: string, weekStart: 0 | 1): string[] {
  const start = addDays(iso, -weekColumn(iso, weekStart))
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** True for a day that has not happened yet, in local time. */
export function isFutureDay(iso: string, today = todayISO()): boolean {
  return iso > today
}

/** Difference in whole days between two ISO days (b - a). */
export function dayDiff(a: string, b: string): number {
  return Math.round((fromISODay(b).getTime() - fromISODay(a).getTime()) / 86_400_000)
}
