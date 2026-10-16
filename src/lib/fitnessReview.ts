import { WEEKDAYS, addDays, dayDiff, fromISODay, prettyDay, todayISO } from './date'
import { displayDistance } from './units'
import { labelOf, type Mode } from '../domain/activities'
import { bestOf } from '../domain/sessions'
import type { DistanceUnit, Workout } from './types'

/**
 * FITNESS REVIEW · what a run of cardio or sport sessions adds up to.
 *
 * WHAT THIS FILE OWNS: aggregates over `Workout[]` that has ALREADY been
 * filtered to one mode, plus the one sentence zone 1 renders.
 * WHAT IT DOES NOT OWN: anything about lifting — `lib/fitness.ts` is 903 lines
 * of strength analytics (volume, e1RM, muscle sets, PRs) and nothing in it
 * answers "am I running enough". That asymmetry is why this file exists: the
 * Fitness page shipped with **three** derived numbers for its two modes
 * (sessions, total time, one best) against twenty-two for Strength, and its
 * whole review zone measured **553px** at a 1440 viewport while the log form
 * above it measured 705.
 *
 * **Every function takes the sessions, not the journal.** The mode filter is
 * `sessionsInMode(data, mode)` and it happens once in the view; a function here
 * that re-derived it would be a second opinion about what a cardio session is,
 * and this is the page where that exact bug class was found twice already (see
 * `domain/activities.ts`).
 *
 * **No `useMemo` at the call sites.** Each of these is one pass over a list
 * that is tens of rows long, and the input is a fresh array every render, so a
 * memo keyed on it recomputes anyway while costing a dependency to keep
 * honest. Same reasoning as `lib/pickleball.ts`.
 *
 * Two rules from CLAUDE.md are load-bearing here and asserted in
 * `fitnessReview.test.ts`:
 *
 * - **`count ? sum / count : 0` makes "no data" look like "you scored zero".**
 *   Every mean returns `null` with nothing to average, and the caller decides
 *   what to draw.
 * - **A figure comparing two windows needs a coverage floor on both sides and
 *   must state its sample.** `cadence` will not call anything a gap under four
 *   training days, because three gaps is the fewest that has a middle.
 */

/* ── Weekday load ─────────────────────────────────────────────────────────── */

export interface WeekdayLoad {
  /** `Sun` … `Sat`, from `WEEKDAYS`. */
  day: string
  sessions: number
  minutes: number
  /** `null` on a day you have never trained — not 0, which reads as "you did nothing useful". */
  avgMin: number | null
}

/**
 * Sessions and minutes per day of the week, all seven rows, always.
 *
 * Seven rows and not "the days you trained": a rest day is a visible gap in
 * the week, and dropping it loses the one shape a week has — the same
 * measurement that turned Pickleball's seven weekday tiles into seven bars
 * (`WeekdayPerformanceCard`, 44px cells against a 348px card).
 */
export function weekdayLoad(sessions: Workout[]): WeekdayLoad[] {
  const rows: WeekdayLoad[] = WEEKDAYS.map((day) => ({ day, sessions: 0, minutes: 0, avgMin: null }))
  for (const s of sessions) {
    const r = rows[fromISODay(s.date).getDay()]
    r.sessions += 1
    r.minutes += s.durationMin ?? 0
  }
  for (const r of rows) r.avgMin = r.sessions > 0 ? Math.round(r.minutes / r.sessions) : null
  return rows
}

/* ── What you actually do ─────────────────────────────────────────────────── */

export interface ActivityShare {
  /** The registry key, so a caller can filter the record by it. */
  activity: string
  label: string
  sessions: number
  minutes: number
  /** Canonical km. Convert at the render boundary with `displayDistance`. */
  distanceKm: number
  /** Share of this mode's sessions, 0–100, rounded. */
  share: number
}

/**
 * One row per activity logged in this mode, most-used first.
 *
 * The page could say "17 sessions" and never which 17 — a toggle labelled
 * Cardio covers nine activities, and "am I only ever walking" is the first
 * question anybody asks of a cardio record. Ordered by sessions rather than by
 * minutes, because that is the question ("how often"), and a single four-hour
 * hike should not outrank a habit.
 */
export function activityMix(sessions: Workout[]): ActivityShare[] {
  const by = new Map<string, ActivityShare>()
  for (const s of sessions) {
    const row = by.get(s.activity) ?? { activity: s.activity, label: labelOf(s.activity), sessions: 0, minutes: 0, distanceKm: 0, share: 0 }
    row.sessions += 1
    row.minutes += s.durationMin ?? 0
    row.distanceKm += s.distanceKm ?? 0
    by.set(s.activity, row)
  }
  const rows = [...by.values()].sort((a, b) => b.sessions - a.sessions || a.label.localeCompare(b.label))
  for (const r of rows) r.share = sessions.length ? Math.round((r.sessions / sessions.length) * 100) : 0
  return rows
}

/* ── Volume over time ─────────────────────────────────────────────────────── */

export interface WeekLoad {
  /** The first day of the block — `prettyDay`'d by the caller. */
  start: string
  minutes: number
  sessions: number
}

/**
 * Minutes and sessions per seven-day block, oldest first, the last block
 * ending TODAY.
 *
 * Rolling blocks rather than calendar weeks on purpose. A calendar week's
 * newest column is however many days into Monday you happen to be, so it draws
 * short and reads as a collapse — the "a day that has not happened is not a
 * rest day" trap in CLAUDE.md, arriving as a bar instead of a heatmap cell.
 * Every block here is a complete seven days, so every bar is comparable with
 * every other, and the card's subtitle says the blocks end today.
 */
export function weeklyLoad(sessions: Workout[], weeks = 8, today = todayISO()): WeekLoad[] {
  const rows: WeekLoad[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(today, -(i * 7 + 6))
    rows.push({ start, minutes: 0, sessions: 0 })
  }
  for (const s of sessions) {
    const back = dayDiff(s.date, today)
    if (back < 0 || back >= weeks * 7) continue
    const row = rows[weeks - 1 - Math.floor(back / 7)]
    row.sessions += 1
    row.minutes += s.durationMin ?? 0
  }
  return rows
}

/* ── Cadence ──────────────────────────────────────────────────────────────── */

/** Fewest training days that have a gap with a middle — three gaps. */
export const CADENCE_FLOOR = 4

export interface Cadence {
  /** Distinct days with a session, all time. */
  daysTrained: number
  /** Of the last `weeks` seven-day blocks, how many hold a session. */
  activeWeeks: number
  weeks: number
  /** Consecutive seven-day blocks with a session, counting back from today. */
  weekStreak: number
  /** Mean days between training days — `null` under `CADENCE_FLOOR` days. */
  avgGap: number | null
  /** Longest run of empty days between two training days — `null` under the floor. */
  longestGap: number | null
  /** `null` when nothing has been logged, which is not the same as 0. */
  daysSinceLast: number | null
}

/**
 * How regularly you train, and honestly about not knowing yet.
 *
 * `avgGap` is the number the lapse sentence is built on, so it carries the
 * coverage floor: two training days give one gap, and one gap is not a
 * cadence. Reporting it anyway is the `momentumIndicator` bug in CLAUDE.md,
 * where a two-day sample compared against a seven-day one turned a lapse into
 * three green improvements — not overstated, inverted.
 */
export function cadence(sessions: Workout[], weeks = 8, today = todayISO()): Cadence {
  const days = [...new Set(sessions.map((s) => s.date))]
    .filter((d) => dayDiff(d, today) >= 0)
    .sort()
  const blocks = new Set<number>()
  for (const d of days) {
    const back = dayDiff(d, today)
    if (back < weeks * 7) blocks.add(Math.floor(back / 7))
  }
  let weekStreak = 0
  while (blocks.has(weekStreak)) weekStreak += 1

  const gaps: number[] = []
  for (let i = 1; i < days.length; i++) gaps.push(dayDiff(days[i - 1], days[i]))
  const enough = days.length >= CADENCE_FLOOR

  return {
    daysTrained: days.length,
    activeWeeks: blocks.size,
    weeks,
    weekStreak,
    avgGap: enough && gaps.length ? Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10 : null,
    longestGap: enough && gaps.length ? Math.max(...gaps) : null,
    daysSinceLast: days.length ? dayDiff(days[days.length - 1], today) : null,
  }
}

/* ── Bests ────────────────────────────────────────────────────────────────── */

export interface ActivityBest {
  activity: string
  label: string
  /** What the registry says headlines this activity — "Best pace", "Longest (mi)". */
  stat: string
  value: string
  sessions: number
}

/**
 * The registry's headline best, per activity, for activities that have one.
 *
 * `bestOf` already knows which stat an activity is judged on (`best` in
 * `domain/activities.ts`): pace for a run, distance for a cycle, duration for
 * yoga. The old page called it ONCE, for whatever activity the form happened to
 * have selected, and printed a single tile — so a journal holding runs, walks
 * and three yoga classes reported one number belonging to whichever of them you
 * were about to log. One row per activity is the same function, called per
 * group, which is the whole change.
 *
 * Empties are dropped rather than rendered as "—": a row saying nothing is
 * furniture, and the activity mix beside it already says the session happened.
 */
export function bestsByActivity(sessions: Workout[], unit: DistanceUnit): ActivityBest[] {
  const by = new Map<string, Workout[]>()
  for (const s of sessions) by.set(s.activity, [...(by.get(s.activity) ?? []), s])
  return [...by.entries()]
    .flatMap(([activity, group]) => {
      const best = bestOf(group, activity, unit)
      return best.empty
        ? []
        : [{ activity, label: labelOf(activity), stat: best.label, value: best.value, sessions: group.length }]
    })
    .sort((a, b) => b.sessions - a.sessions || a.label.localeCompare(b.label))
}

export interface Milestone {
  label: string
  current: number
  next: number
  /** Drawn after the figures — "sessions", "h", "mi". */
  unit: string
}

/** Shared by the milestone card and the next-step sentence's floor. */
const SESSION_RUNGS = [10, 25, 50, 100, 250, 500]

const nextRung = (value: number, rungs: number[]): number =>
  rungs.find((r) => r > value) ?? Math.ceil((value + 1) / rungs[rungs.length - 1]) * rungs[rungs.length - 1]

/**
 * The next round number for the three totals this mode has.
 *
 * Always returns at least two rows, because this is the floor of the next-step
 * sentence — "something to aim at beats a blank line" (`lib/pickleball.ts`'s
 * `milestone` rule). Distance is dropped when nothing carries one: yoga and
 * sport have no distance, and a 0-of-50 bar is a goal you were never set.
 */
export function fitnessMilestones(sessions: Workout[], unit: DistanceUnit): Milestone[] {
  const hours = Math.round(sessions.reduce((a, s) => a + (s.durationMin ?? 0), 0) / 60)
  const dist = Math.round(displayDistance(sessions.reduce((a, s) => a + (s.distanceKm ?? 0), 0), unit))
  const rows: Milestone[] = [
    { label: 'Sessions logged', current: sessions.length, next: nextRung(sessions.length, SESSION_RUNGS), unit: 'sessions' },
    { label: 'Hours trained', current: hours, next: nextRung(hours, SESSION_RUNGS), unit: 'h' },
  ]
  if (dist > 0) rows.push({ label: 'Distance covered', current: dist, next: nextRung(dist, [50, 100, 250, 500, 1000]), unit })
  return rows
}

/* ── The one sentence at the top ──────────────────────────────────────────── */

export interface FitnessStep {
  id: 'first' | 'lapse' | 'goal' | 'today' | 'milestone'
  text: string
  /** The rail row holding the detail. A button when set, a paragraph when not. */
  group?: string
}

/**
 * ONE SENTENCE THAT SAYS WHAT TO DO NEXT, over this mode's own sessions.
 *
 * Zone 1 was three facts — this week, next up, last session — all true, none of
 * which changes the next thirty seconds. "Next up" was the closest, and it was
 * a per-mode constant (`Whenever the court is free`), so it said the same thing
 * on the day you ran twice and the day you had not run for a fortnight.
 *
 * THE ORDER IS URGENCY, and it is the order `lib/pickleball.ts` arrived at the
 * hard way: a goal inside a week you have already let go is worth less than the
 * fact that you stopped, so **lapse sits above goal**. There is no `event` rule
 * here — nothing in a `Workout` has a date you cannot move.
 *
 * | rule | fires when |
 * |---|---|
 * | `first` | nothing logged in this mode — a record with no rows cannot say anything else |
 * | `lapse` | silence longer than twice your own cadence, with four training days behind it |
 * | `goal`  | a minutes target you set, this week, not met (cardio only — a game has no minutes target) |
 * | `today` | you already trained today; the week's state is the useful half |
 * | `milestone` | always, as the floor |
 *
 * **It states its sample.** The lapse sentence carries "across 9 training days
 * your cadence is about every 3.2 days", because an unqualified "you have
 * lapsed" from three sessions is the inverted-momentum bug again. And it is
 * TOTAL: it always returns a sentence, which is what lets zone 1 render it
 * without a conditional that would leave a hole at the top of the page.
 */
export function nextStep(sessions: Workout[], opts: {
  mode: Mode
  /** `settings.fitnessGoalMin`, already defaulted by the caller. */
  goalMin: number
  /** Active minutes in the last seven days, from `weeklyActiveMinutes`. */
  weekMinutes: number
  today?: string
}): FitnessStep {
  const today = opts.today ?? todayISO()
  const noun = opts.mode === 'sport' ? 'game' : 'session'
  if (sessions.length === 0) {
    return { id: 'first', text: `Log your first ${noun} and this page starts reading your week back to you.`, group: 'sessions' }
  }

  const c = cadence(sessions, 8, today)
  if (c.avgGap != null && c.daysSinceLast != null && c.daysSinceLast > c.avgGap * 2) {
    return {
      id: 'lapse',
      text: `${c.daysSinceLast} days since your last ${noun} — across ${c.daysTrained} training days your cadence is about every ${c.avgGap} days.`,
      group: 'volume',
    }
  }

  // Cardio only. Strength counts sessions and sport counts games, so neither
  // has a denominator and a "40 min to go" against nothing is a nag about a
  // target that does not exist — the same reasoning as `weekRange` in the view.
  if (opts.mode === 'cardio' && opts.goalMin > 0 && opts.weekMinutes < opts.goalMin) {
    const left = opts.goalMin - opts.weekMinutes
    return { id: 'goal', text: `${left} more active minutes this week and you hit your ${opts.goalMin}-minute target.`, group: 'volume' }
  }

  const last = sessions.reduce((a, s) => (s.date > a ? s.date : a), sessions[0].date)
  if (dayDiff(last, today) === 0) {
    const mins = sessions.filter((s) => s.date === last).reduce((a, s) => a + (s.durationMin ?? 0), 0)
    return {
      id: 'today',
      text: mins > 0
        ? `${mins} minutes logged today, ${opts.weekMinutes} this week. Nothing owed.`
        : `Logged today. ${opts.weekMinutes} active minutes this week.`,
      group: 'volume',
    }
  }

  // The session rung directly, not `fitnessMilestones(…)[0]`: that function
  // needs a unit it would only use for a row this sentence does not read, and
  // passing one in to throw it away is how a unit bug gets introduced later.
  const target = nextRung(sessions.length, SESSION_RUNGS)
  const left = target - sessions.length
  return {
    id: 'milestone',
    text: `${left} more ${noun}${left === 1 ? '' : 's'} to reach ${target} logged — last was ${prettyDay(last)}.`,
    group: 'bests',
  }
}
