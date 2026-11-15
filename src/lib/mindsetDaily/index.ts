import { LEADERSHIP } from './leadership'
import { GROWTH } from './growth'
import { HABITS } from './habits'
import { RESILIENCE } from './resilience'
import { fromISODay } from '../date'

/**
 * A YEAR OF DAILY CARDS — one quotation and one thing to do today, a card a
 * day for 365 days (owner, 2026-11-14: "quotes and practice … 365 … more
 * practical, leadership and development").
 *
 * OWNS: the 365 cards, their order, and which one a date gets.
 * DOES NOT OWN: the principles library (`lib/mindset.ts`), which is what you
 * choose to work on; a card is what the day hands you.
 *
 * Four theme files of ~91 each, dealt in turn — leadership, growth, habits,
 * resilience — so two days running never share a theme. `by` is empty for the
 * app's own words: a quotation is attributed only when the wording and the
 * source are well documented, and never with a guessed name
 * (`mindsetDaily.test.ts` checks the known misattributions).
 *
 * To add a card, append to a theme file; the deal and the count follow.
 */
export type DailyCard = { id: string; quote: string; by: string; practice: string }

const THEMES = [LEADERSHIP, GROWTH, HABITS, RESILIENCE]

export const DAILY_CARDS: DailyCard[] = (() => {
  const out: DailyCard[] = []
  const longest = Math.max(...THEMES.map((t) => t.length))
  for (let i = 0; i < longest; i++) for (const t of THEMES) if (t[i]) out.push(t[i])
  return out
})()

/** Day of the year, 1 to 366. */
export function dayOfYear(day: string): number {
  const d = fromISODay(day)
  return Math.round((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000)
}

/** The card a date gets: day N of the year is card N, and 366 wraps to 1. */
export function dailyCardFor(day: string): { card: DailyCard; n: number; total: number } {
  const total = DAILY_CARDS.length
  const n = ((dayOfYear(day) - 1) % total) + 1
  return { card: DAILY_CARDS[n - 1], n, total }
}
