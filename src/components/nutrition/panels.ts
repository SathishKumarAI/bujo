import { ChartBar, ForkKnife, SquaresFour } from '@/components/icons'

/**
 * The three rows of the Nutrition review bar.
 *
 * Its own module because `Review.tsx` exports a component and the view needs
 * the list too: zone 1's next-step sentence is a button INTO a row, and a
 * button that cannot reach the state it names is a button that lies.
 *
 * **Three rows, not five.** `SectionRail`'s threshold is about four peer
 * sections, and this page had three — a summary strip, the macro split and
 * fourteen dated rows — stacked at **842px** of review. The bar is worth it
 * here for the opposite reason to Strength: not because the page is long, but
 * because two of the three answer questions at completely different cadences.
 * The macro split is read while you are deciding what to eat; the fortnight is
 * read on a Sunday.
 *
 * | # | row | the question |
 * |---|---|---|
 * | 1 | Today | what is this day made of, and what is missing from it |
 * | 2 | Trend | **when** — the shape of the last four weeks against target |
 * | 3 | Patterns | **why** — which weekday, which foods, which kind of day |
 *
 * **Trend and Patterns were starting to be the same row**, which is a fair
 * reading of an earlier version: Trend held the fortnight ledger, the targets
 * AND the training/rest split, and that last one is not a movement over time at
 * all — it is the same fortnight cut by something about the day, which is
 * precisely what `WeekdayCard` does. Moving it to Patterns gives the two rows
 * one question each: **Trend is WHEN, Patterns is WHY.** Trend answers it with
 * a four-week wave and a twenty-week calendar; Patterns answers it with
 * three splits.
 *
 * **It opens on Today**, which is the row you want in the thirty seconds after
 * tapping a food — the same rule the sport pages follow, where the default is
 * the row the primary action writes to.
 */
export const NUTRITION_PANELS = [
  { id: 'today', label: 'Today', blurb: 'While you are deciding what to eat · the macro split against target, and what is left', icon: ForkKnife, color: 'green' },
  { id: 'trend', label: 'Trend', blurb: 'WHEN · four weeks of days, five months of calendar behind them, and the targets they are judged against', icon: ChartBar, color: 'teal' },
  { id: 'patterns', label: 'Patterns', blurb: 'WHY · which weekday, which foods, and what the training days ate', icon: SquaresFour, color: 'sky' },
] as const

export type NutritionPanelId = typeof NUTRITION_PANELS[number]['id']
