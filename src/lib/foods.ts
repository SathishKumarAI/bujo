import type { DailyMetric, LoggedFood } from './types'
// A small offline food database for quick macro logging. Focused on American and
// Indian staples (the two cuisines this journal's owner eats most). Values are
// per the stated serving; pick a food and its macros are added to the day's
// totals — no network needed. For anything not here, the card links out to a
// web search so you can look it up and type it in.

export interface Food {
  name: string
  serving: string
  kcal: number
  protein: number // g
  carbs: number // g
  fat: number // g
  cuisine: 'american' | 'indian'
}

/**
 * CALORIE WEIGHT · the one judgement this module makes.
 *
 * "Which of these is the expensive one" was a question the page could not
 * answer: every food rendered as the same grey row with its number buried in a
 * `<select>` option, so a 367 kcal salmon fillet and a 60 kcal cup of curd read
 * identically until you squinted at the digits. A number you have to *read* to
 * compare is a number that is not encoded.
 *
 * Three bands, per serving as listed — not per 100 g, because the serving is
 * what you actually add:
 *
 * | Band | Per serving | Reads as |
 * |---|---|---|
 * | `light` | under 120 kcal | spend it freely |
 * | `moderate` | 120–249 kcal | a normal component |
 * | `heavy` | 250 kcal and up | this is the one that moves the day |
 *
 * The cuts are at 120 and 250 because the list clusters there — the staples
 * (roti 120, idli 116, banana 105, yogurt 100) sit at the first, and the
 * day-movers (chicken curry 290, paneer 265, chana 270, salmon 367) at the
 * second. Thirds-of-the-list would have been arbitrary; these are where the
 * gaps already are.
 *
 * Keep the tones as tokens, never a hex: `cat()` resolves them per theme, and
 * the three must stay distinguishable in all five. Green/yellow/peach is the
 * same three-step scale Plan and Trackers use, so a reader who has learned it
 * once does not learn it again here.
 */
export const KCAL_LIGHT_MAX = 119
export const KCAL_MODERATE_MAX = 249

export type KcalBand = 'light' | 'moderate' | 'heavy'

export const KCAL_BANDS: Record<KcalBand, { label: string; color: string; hint: string }> = {
  light: { label: 'Light', color: 'green', hint: `under ${KCAL_LIGHT_MAX + 1} kcal a serving` },
  moderate: { label: 'Moderate', color: 'yellow', hint: `${KCAL_LIGHT_MAX + 1}–${KCAL_MODERATE_MAX} kcal a serving` },
  heavy: { label: 'Heavy', color: 'peach', hint: `${KCAL_MODERATE_MAX + 1} kcal a serving and up` },
}

/** Which calorie band a serving falls in. The page colours by this, not by cuisine. */
export function kcalBand(kcal: number): KcalBand {
  if (kcal <= KCAL_LIGHT_MAX) return 'light'
  if (kcal <= KCAL_MODERATE_MAX) return 'moderate'
  return 'heavy'
}

export const FOODS: Food[] = [
  // ── Indian ──
  { name: 'Roti / chapati', serving: '1 medium', kcal: 120, protein: 3, carbs: 18, fat: 3, cuisine: 'indian' },
  { name: 'Plain dosa', serving: '1', kcal: 133, protein: 4, carbs: 18, fat: 5, cuisine: 'indian' },
  { name: 'Idli', serving: '2', kcal: 116, protein: 4, carbs: 24, fat: 1, cuisine: 'indian' },
  { name: 'Basmati rice (cooked)', serving: '1 cup', kcal: 205, protein: 4, carbs: 45, fat: 0, cuisine: 'indian' },
  { name: 'Dal (lentil curry)', serving: '1 cup', kcal: 180, protein: 12, carbs: 27, fat: 3, cuisine: 'indian' },
  { name: 'Chicken curry', serving: '1 cup', kcal: 290, protein: 28, carbs: 8, fat: 16, cuisine: 'indian' },
  { name: 'Paneer (cubed)', serving: '100 g', kcal: 265, protein: 18, carbs: 6, fat: 20, cuisine: 'indian' },
  { name: 'Chana masala', serving: '1 cup', kcal: 270, protein: 11, carbs: 40, fat: 8, cuisine: 'indian' },
  { name: 'Curd / dahi', serving: '100 g', kcal: 60, protein: 3, carbs: 5, fat: 3, cuisine: 'indian' },
  { name: 'Sambar', serving: '1 cup', kcal: 140, protein: 7, carbs: 21, fat: 3, cuisine: 'indian' },
  { name: 'Aloo sabzi', serving: '1 cup', kcal: 200, protein: 4, carbs: 30, fat: 8, cuisine: 'indian' },
  { name: 'Masala omelette', serving: '2 eggs', kcal: 190, protein: 13, carbs: 3, fat: 14, cuisine: 'indian' },
  { name: 'Poha', serving: '1 cup', kcal: 180, protein: 4, carbs: 32, fat: 5, cuisine: 'indian' },
  { name: 'Upma', serving: '1 cup', kcal: 190, protein: 5, carbs: 30, fat: 6, cuisine: 'indian' },
  { name: 'Rajma (kidney bean curry)', serving: '1 cup', kcal: 250, protein: 13, carbs: 38, fat: 6, cuisine: 'indian' },
  { name: 'Palak paneer', serving: '1 cup', kcal: 300, protein: 14, carbs: 12, fat: 23, cuisine: 'indian' },
  { name: 'Chicken biryani', serving: '1 cup', kcal: 350, protein: 20, carbs: 42, fat: 12, cuisine: 'indian' },
  { name: 'Paratha (plain)', serving: '1', kcal: 260, protein: 5, carbs: 36, fat: 10, cuisine: 'indian' },
  { name: 'Khichdi', serving: '1 cup', kcal: 220, protein: 8, carbs: 38, fat: 4, cuisine: 'indian' },
  { name: 'Tandoori chicken', serving: '2 pieces', kcal: 260, protein: 32, carbs: 4, fat: 13, cuisine: 'indian' },
  { name: 'Raita', serving: '1/2 cup', kcal: 60, protein: 3, carbs: 6, fat: 3, cuisine: 'indian' },
  { name: 'Samosa', serving: '1', kcal: 260, protein: 4, carbs: 30, fat: 14, cuisine: 'indian' },
  { name: 'Masala chai (with milk)', serving: '1 cup', kcal: 90, protein: 3, carbs: 12, fat: 3, cuisine: 'indian' },

  // ── American ──
  { name: 'Grilled chicken breast', serving: '170 g', kcal: 280, protein: 53, carbs: 0, fat: 6, cuisine: 'american' },
  { name: 'Whey protein', serving: '1 scoop', kcal: 126, protein: 25, carbs: 3, fat: 1, cuisine: 'american' },
  { name: 'Oats (dry)', serving: '60 g', kcal: 224, protein: 8, carbs: 37, fat: 5, cuisine: 'american' },
  { name: 'Peanut butter', serving: '1 tbsp', kcal: 95, protein: 4, carbs: 4, fat: 8, cuisine: 'american' },
  { name: 'Whole eggs', serving: '2', kcal: 156, protein: 12, carbs: 1, fat: 11, cuisine: 'american' },
  { name: 'Greek yogurt', serving: '170 g', kcal: 100, protein: 17, carbs: 6, fat: 1, cuisine: 'american' },
  { name: 'Banana', serving: '1 medium', kcal: 105, protein: 1, carbs: 27, fat: 0, cuisine: 'american' },
  { name: 'Brown rice (cooked)', serving: '1 cup', kcal: 216, protein: 5, carbs: 45, fat: 2, cuisine: 'american' },
  { name: 'Salmon fillet', serving: '170 g', kcal: 367, protein: 40, carbs: 0, fat: 22, cuisine: 'american' },
  { name: 'Almonds', serving: '28 g', kcal: 164, protein: 6, carbs: 6, fat: 14, cuisine: 'american' },
  { name: 'Avocado', serving: '1/2', kcal: 160, protein: 2, carbs: 9, fat: 15, cuisine: 'american' },
  { name: 'Cheddar cheese', serving: '1 slice', kcal: 113, protein: 7, carbs: 1, fat: 9, cuisine: 'american' },
  { name: 'Sweet potato', serving: '1 medium', kcal: 112, protein: 2, carbs: 26, fat: 0, cuisine: 'american' },
  { name: 'Protein bar', serving: '1', kcal: 200, protein: 20, carbs: 22, fat: 7, cuisine: 'american' },
  { name: 'Whole milk', serving: '1 cup', kcal: 149, protein: 8, carbs: 12, fat: 8, cuisine: 'american' },
  { name: 'Whole-wheat bread', serving: '2 slices', kcal: 160, protein: 8, carbs: 28, fat: 2, cuisine: 'american' },
  { name: 'Apple', serving: '1 medium', kcal: 95, protein: 0, carbs: 25, fat: 0, cuisine: 'american' },
  { name: 'Broccoli (steamed)', serving: '1 cup', kcal: 55, protein: 4, carbs: 11, fat: 1, cuisine: 'american' },
  { name: 'Ground beef 85/15', serving: '113 g', kcal: 240, protein: 21, carbs: 0, fat: 17, cuisine: 'american' },
  { name: 'Chicken thigh (roasted)', serving: '113 g', kcal: 240, protein: 24, carbs: 0, fat: 15, cuisine: 'american' },
  { name: 'Cottage cheese', serving: '1 cup', kcal: 180, protein: 25, carbs: 8, fat: 5, cuisine: 'american' },
  { name: 'Tuna (canned, water)', serving: '1 can', kcal: 110, protein: 25, carbs: 0, fat: 1, cuisine: 'american' },
  { name: 'Olive oil', serving: '1 tbsp', kcal: 119, protein: 0, carbs: 0, fat: 14, cuisine: 'american' },
  { name: 'Black beans', serving: '1 cup', kcal: 227, protein: 15, carbs: 41, fat: 1, cuisine: 'american' },
  { name: 'Blueberries', serving: '1 cup', kcal: 84, protein: 1, carbs: 21, fat: 0, cuisine: 'american' },
  { name: 'Flour tortilla', serving: '1 large', kcal: 190, protein: 5, carbs: 32, fat: 5, cuisine: 'american' },
]

/** A typical ~1800 kcal sample day (for the "fill sample" demo button). */
export const SAMPLE_DAY: Food[] = [
  FOODS.find((f) => f.name === 'Oats (dry)')!,
  FOODS.find((f) => f.name === 'Whey protein')!,
  FOODS.find((f) => f.name === 'Grilled chicken breast')!,
  FOODS.find((f) => f.name === 'Basmati rice (cooked)')!,
  FOODS.find((f) => f.name === 'Dal (lentil curry)')!,
  FOODS.find((f) => f.name === 'Roti / chapati')!,
  FOODS.find((f) => f.name === 'Greek yogurt')!,
  FOODS.find((f) => f.name === 'Banana')!,
  FOODS.find((f) => f.name === 'Peanut butter')!,
  FOODS.find((f) => f.name === 'Almonds')!,
  FOODS.find((f) => f.name === 'Whole eggs')!,
]

export interface Macros { calories: number; protein: number; carbs: number; fat: number }

/** Sum a list of foods into total macros (rounded). */
export function sumFoods(foods: Food[]): Macros {
  return foods.reduce<Macros>(
    (a, f) => ({ calories: a.calories + f.kcal, protein: a.protein + f.protein, carbs: a.carbs + f.carbs, fat: a.fat + f.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

/**
 * Add a food to a day, and take one back off.
 *
 * Here rather than inside `views/Nutrition` because the property that matters
 * is arithmetic — removing must give back exactly what adding took — and a
 * property trapped in a component is one no test can state. The view does the
 * asking and the rendering; this does the sums.
 */
export function withFoodAdded(m: DailyMetric | undefined, food: Food, id: string): Partial<DailyMetric> {
  return {
    calories: (m?.calories ?? 0) + food.kcal,
    protein: (m?.protein ?? 0) + food.protein,
    carbs: (m?.carbs ?? 0) + food.carbs,
    fat: (m?.fat ?? 0) + food.fat,
    foodLog: [...(m?.foodLog ?? []), { id, name: food.name, kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat }],
  }
}

export function withFoodRemoved(m: DailyMetric | undefined, entry: LoggedFood): Partial<DailyMetric> {
  return {
    // Floored at zero because the totals can ALSO be typed by hand. If someone
    // logs a chip and then lowers the total themselves, subtracting the full
    // macro goes negative — and a negative-calorie day is a worse lie than an
    // approximate one.
    calories: Math.max(0, (m?.calories ?? 0) - entry.kcal),
    protein: Math.max(0, (m?.protein ?? 0) - entry.protein),
    carbs: Math.max(0, (m?.carbs ?? 0) - entry.carbs),
    fat: Math.max(0, (m?.fat ?? 0) - entry.fat),
    foodLog: (m?.foodLog ?? []).filter((f) => f.id !== entry.id),
  }
}
