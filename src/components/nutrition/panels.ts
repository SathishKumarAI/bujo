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
 * | 2 | Trend | how is the fortnight going — and where the targets are set |
 * | 3 | Patterns | which days and which foods are doing it |
 *
 * **It opens on Today**, which is the row you want in the thirty seconds after
 * tapping a food — the same rule the sport pages follow, where the default is
 * the row the primary action writes to.
 */
export const NUTRITION_PANELS = [
  { id: 'today', label: 'Today', blurb: 'While you are deciding what to eat · the macro split against target, and what is left', icon: ForkKnife, color: 'green' },
  { id: 'trend', label: 'Trend', blurb: 'On a Sunday · the fortnight against target, and the targets themselves', icon: ChartBar, color: 'teal' },
  { id: 'patterns', label: 'Patterns', blurb: 'When a week keeps going wrong in the same place · by weekday, and by food', icon: SquaresFour, color: 'sky' },
] as const

export type NutritionPanelId = typeof NUTRITION_PANELS[number]['id']
