import type { Surface } from './deepLink'
import type { JournalData } from './types'
import { isFutureDay } from './date'

/**
 * WHICH SURFACE TODAY OPENS ON.
 *
 * Separate from `timeofday.ts`, which has four slots and groups *habits*. This
 * has three and picks a *page*: the day surface is the default and the widest
 * window because rapid logging is what the page is mostly for, and there is no
 * "anytime" because the page always has to open on something.
 *
 * Pure, so the boundary is a test rather than a thing you check by waiting.
 */
export function surfaceForHour(hour: number): Surface {
  if (hour < 11) return 'morning'
  if (hour < 18) return 'day'
  return 'evening'
}

export const SURFACE_LABEL: Record<Surface, string> = {
  morning: 'Morning',
  day: 'Day',
  evening: 'Evening',
}

/**
 * WHICH TABS STILL HAVE NOTHING ON THEM.
 *
 * The tab row was three words and no state, so the one question it is in a
 * position to answer — *where in the day have I not been yet* — was the one
 * thing it did not say. This returns, per surface, whether that surface's
 * primary ask has any record for the day.
 *
 * Each surface owns exactly one record, and the three do not overlap. That is
 * what makes a single marker honest:
 *
 * | Surface | Its ask | The record |
 * |---|---|---|
 * | morning | the check-in | `metrics[date]` — any of mood, stress, energy, sleep |
 * | day | the rapid log | an entry on the date, outside a collection |
 * | evening | closing the day | gratitude or memory text for the date |
 *
 * **Habits are deliberately not counted here.** They render on Day *and*
 * Evening, so attributing them to either would clear the other tab's marker
 * from the same tap — the same shape as `help ?? subtitle`, where one prop fed
 * a feature on two surfaces and a sweep over the prop missed it.
 *
 * A future day is asking for nothing, so nothing on it is marked: an unwritten
 * tomorrow is not a gap.
 *
 * Pure, so the rule is a test rather than something you confirm by tapping.
 */
export function surfaceUntouched(data: JournalData, date: string): Record<Surface, boolean> {
  if (isFutureDay(date)) return { morning: false, day: false, evening: false }
  const metric = data.metrics.find((m) => m.date === date)
  const rated = [metric?.mood, metric?.stress, metric?.energy, metric?.sleep].some((v) => v != null)
  const logged = data.entries.some((e) => e.date === date && !e.collection)
  const written =
    (data.gratitude.find((g) => g.date === date)?.text ?? '').trim() !== '' ||
    (data.memories.find((m) => m.date === date)?.text ?? '').trim() !== ''
  return { morning: !rated, day: !logged, evening: !written }
}
