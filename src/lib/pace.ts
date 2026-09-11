// ── How much of the month/year is left, and whether you are on pace ──────────
//
// This module owns the *calendar* side of progress: days gone, days still
// available, and the rate you have been logging at projected onto what remains.
// It owns nothing about what counts as a logged day — that is `activeDays` in
// `stats.ts`, and it stays there so the heatmap, the streaks and this card can
// never disagree about which days you showed up.
import type { JournalData } from './types'
import { dayDiff, daysInMonth, todayISO } from './date'
import { activeDays } from './stats'

export interface Span {
  /** Days in the period. */
  total: number
  /** Days finished before today — 0 on the 1st. */
  past: number
  /** Days still available, **today included**: a day you can still log is not spent. */
  left: number
  /** Days with any activity, from the period's start through today. */
  logged: number
  /**
   * logged-per-finished-day, or `null` before a full day has passed.
   *
   * Null rather than 0 on purpose: on the 1st of the month "no data yet" and
   * "you have logged nothing" are different claims, and a 0 there reads as the
   * second — the same trap `monthlyCompletion` shipped with. Today is excluded
   * from the denominator because it is not over; it still counts in `logged`,
   * so logging early in the day nudges the rate up rather than down.
   */
  rate: number | null
  /**
   * Logged days projected to the period's end at `rate`, clamped to
   * `[logged, total]`. Both ends are load-bearing: `rate` counts today in the
   * numerator and not in the denominator, so logging every day through the 11th
   * gives 1.1/day and projected a **33-day** September.
   */
  projected: number | null
  /** 0–100, how much of the period is gone (today counts as half a day gone). */
  percent: number
}

function span(total: number, past: number, logged: number): Span {
  const rate = past > 0 ? logged / past : null
  return {
    total,
    past,
    left: total - past,
    logged,
    rate,
    projected: rate == null ? null : Math.min(total, Math.max(logged, Math.round(rate * total))),
    percent: Math.round((past / total) * 100),
  }
}

export interface Pace {
  month: Span & { ym: string }
  year: Span & { year: number }
  /**
   * Week of the year by day-of-year (day 1–7 is week 1), **not** the ISO week.
   * Every year has 52 whole weeks plus a 1- or 2-day stub, which is counted as
   * week 53 rather than folded into 52 so "weeks left" never reads 0 in December.
   */
  week: { index: number; total: number; left: number }
}

/**
 * Everything the pace card shows, for the month and year containing `today`.
 *
 * `activeDays` can hold days that have not happened yet — a task dated next
 * Friday makes that date active — so every count here is clamped at `today`.
 * Scheduling is not logging, same rule as `loggedWeek`.
 */
export function pace(data: JournalData, today = todayISO()): Pace {
  const [y, m, d] = today.split('-').map(Number)
  const ym = today.slice(0, 7)
  const yearStart = `${y}-01-01`
  const yearDays = daysInMonth(y, 2) === 29 ? 366 : 365
  const dayOfYear = dayDiff(yearStart, today) + 1

  const logged = [...activeDays(data)].filter((day) => day <= today)
  const inMonth = logged.filter((day) => day.startsWith(ym)).length
  const inYear = logged.filter((day) => day.startsWith(`${y}-`)).length

  const weekTotal = Math.ceil(yearDays / 7)
  const weekIndex = Math.ceil(dayOfYear / 7)

  return {
    month: { ym, ...span(daysInMonth(y, m), d - 1, inMonth) },
    year: { year: y, ...span(yearDays, dayOfYear - 1, inYear) },
    week: { index: weekIndex, total: weekTotal, left: weekTotal - weekIndex },
  }
}
