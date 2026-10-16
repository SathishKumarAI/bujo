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
  cuisine: 'american' | 'indian' | 'yours'
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

  // ── Indian · added 2026-10-16, asked for by name ──
  { name: 'Veg biryani', serving: '1 cup', kcal: 240, protein: 6, carbs: 40, fat: 7, cuisine: 'indian' },
  { name: 'Jeera rice', serving: '1 cup', kcal: 230, protein: 4, carbs: 44, fat: 5, cuisine: 'indian' },
  { name: 'Butter naan', serving: '1', kcal: 260, protein: 7, carbs: 42, fat: 7, cuisine: 'indian' },
  { name: 'Butter chicken', serving: '1 cup', kcal: 320, protein: 25, carbs: 10, fat: 20, cuisine: 'indian' },
  { name: 'Egg curry', serving: '2 eggs in gravy', kcal: 260, protein: 14, carbs: 8, fat: 19, cuisine: 'indian' },
  { name: 'Curd rice', serving: '1 cup', kcal: 210, protein: 7, carbs: 33, fat: 5, cuisine: 'indian' },
  { name: 'Pongal', serving: '1 cup', kcal: 230, protein: 7, carbs: 36, fat: 6, cuisine: 'indian' },
  { name: 'Chole bhature', serving: '1 bhatura + chole', kcal: 450, protein: 12, carbs: 55, fat: 20, cuisine: 'indian' },
  { name: 'Boiled eggs', serving: '2 large', kcal: 143, protein: 13, carbs: 1, fat: 10, cuisine: 'indian' },
  { name: 'Buttermilk / chaas', serving: '1 glass', kcal: 60, protein: 3, carbs: 7, fat: 2, cuisine: 'indian' },
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
  // ── American & supermarket · added 2026-10-16 ──
  { name: 'Sourdough bread', serving: '1 slice', kcal: 130, protein: 5, carbs: 25, fat: 1, cuisine: 'american' },
  { name: 'Onion & chive bread', serving: '1 slice', kcal: 110, protein: 4, carbs: 20, fat: 2, cuisine: 'american' },
  { name: 'Plain bagel', serving: '1', kcal: 270, protein: 11, carbs: 53, fat: 2, cuisine: 'american' },
  { name: 'English muffin', serving: '1', kcal: 134, protein: 5, carbs: 26, fat: 1, cuisine: 'american' },
  { name: 'Scrambled eggs', serving: '2 eggs, butter', kcal: 200, protein: 13, carbs: 2, fat: 15, cuisine: 'american' },
  { name: '2% milk', serving: '1 cup', kcal: 122, protein: 8, carbs: 12, fat: 5, cuisine: 'american' },
  { name: 'Rotisserie chicken', serving: '3 oz, no skin', kcal: 150, protein: 25, carbs: 0, fat: 5, cuisine: 'american' },
  { name: 'Ground turkey 93/7', serving: '4 oz cooked', kcal: 170, protein: 22, carbs: 0, fat: 9, cuisine: 'american' },
  { name: 'Shrimp (cooked)', serving: '4 oz', kcal: 112, protein: 24, carbs: 0, fat: 1, cuisine: 'american' },
  { name: 'Pasta (cooked)', serving: '1 cup', kcal: 220, protein: 8, carbs: 43, fat: 1, cuisine: 'american' },
  { name: 'Mac and cheese', serving: '1 cup', kcal: 380, protein: 13, carbs: 44, fat: 16, cuisine: 'american' },
  { name: 'Frozen pizza', serving: '1 slice', kcal: 285, protein: 12, carbs: 34, fat: 11, cuisine: 'american' },
  { name: 'Granola', serving: '1/2 cup', kcal: 230, protein: 5, carbs: 35, fat: 9, cuisine: 'american' },
  { name: 'Corn flakes + milk', serving: '1 cup + 1/2 cup', kcal: 190, protein: 7, carbs: 36, fat: 2, cuisine: 'american' },
  { name: 'Hummus', serving: '2 tbsp', kcal: 70, protein: 2, carbs: 6, fat: 5, cuisine: 'american' },
  { name: 'Baby carrots', serving: '1 cup', kcal: 52, protein: 1, carbs: 12, fat: 0, cuisine: 'american' },
  { name: 'Spinach (raw)', serving: '2 cups', kcal: 14, protein: 2, carbs: 2, fat: 0, cuisine: 'american' },
  { name: 'Quinoa (cooked)', serving: '1 cup', kcal: 222, protein: 8, carbs: 39, fat: 4, cuisine: 'american' },
  { name: 'Tofu (firm)', serving: '4 oz', kcal: 94, protein: 10, carbs: 2, fat: 6, cuisine: 'american' },
  { name: 'Mozzarella', serving: '1 oz', kcal: 85, protein: 6, carbs: 1, fat: 6, cuisine: 'american' },
  { name: 'Butter', serving: '1 tbsp', kcal: 102, protein: 0, carbs: 0, fat: 12, cuisine: 'american' },
  { name: 'Honey', serving: '1 tbsp', kcal: 64, protein: 0, carbs: 17, fat: 0, cuisine: 'american' },
  { name: 'Orange juice', serving: '1 cup', kcal: 112, protein: 2, carbs: 26, fat: 0, cuisine: 'american' },
  { name: 'Latte (whole milk)', serving: '12 oz', kcal: 150, protein: 8, carbs: 12, fat: 8, cuisine: 'american' },
  { name: 'Instant ramen', serving: '1 pack', kcal: 380, protein: 8, carbs: 54, fat: 14, cuisine: 'american' },
  { name: 'Trail mix', serving: '1/4 cup', kcal: 175, protein: 5, carbs: 16, fat: 11, cuisine: 'american' },
  { name: 'Dark chocolate 70%', serving: '2 squares', kcal: 120, protein: 2, carbs: 10, fat: 9, cuisine: 'american' },
  // ── Fruit, shakes & smoothies · added 2026-10-16 on request ──
  { name: 'Orange', serving: '1 medium', kcal: 62, protein: 1, carbs: 15, fat: 0, cuisine: 'american' },
  { name: 'Grapes', serving: '1 cup', kcal: 104, protein: 1, carbs: 27, fat: 0, cuisine: 'american' },
  { name: 'Strawberries', serving: '1 cup', kcal: 49, protein: 1, carbs: 12, fat: 0, cuisine: 'american' },
  { name: 'Mango', serving: '1 cup', kcal: 99, protein: 1, carbs: 25, fat: 1, cuisine: 'indian' },
  { name: 'Papaya', serving: '1 cup', kcal: 62, protein: 1, carbs: 16, fat: 0, cuisine: 'indian' },
  { name: 'Watermelon', serving: '1 cup', kcal: 46, protein: 1, carbs: 12, fat: 0, cuisine: 'american' },
  { name: 'Pineapple', serving: '1 cup', kcal: 83, protein: 1, carbs: 22, fat: 0, cuisine: 'american' },
  { name: 'Pomegranate', serving: '1/2 cup', kcal: 72, protein: 1, carbs: 16, fat: 1, cuisine: 'indian' },
  { name: 'Dates', serving: '3', kcal: 200, protein: 2, carbs: 54, fat: 0, cuisine: 'indian' },
  { name: 'Fruit smoothie', serving: '12 oz', kcal: 250, protein: 5, carbs: 50, fat: 3, cuisine: 'american' },
  { name: 'Protein shake (milk)', serving: '1 scoop + 1 cup', kcal: 270, protein: 32, carbs: 16, fat: 9, cuisine: 'american' },
  { name: 'Mango lassi', serving: '1 glass', kcal: 220, protein: 6, carbs: 38, fat: 5, cuisine: 'indian' },
  { name: 'Banana peanut-butter shake', serving: '12 oz', kcal: 390, protein: 14, carbs: 48, fat: 17, cuisine: 'american' },
  { name: 'Green smoothie', serving: '12 oz', kcal: 180, protein: 4, carbs: 36, fat: 2, cuisine: 'american' },
  { name: 'Egg white omelette', serving: '4 whites', kcal: 70, protein: 15, carbs: 1, fat: 0, cuisine: 'american' },
  { name: 'Fried eggs', serving: '2 large', kcal: 180, protein: 12, carbs: 1, fat: 14, cuisine: 'american' },
  { name: 'Egg bhurji', serving: '2 eggs', kcal: 220, protein: 13, carbs: 5, fat: 16, cuisine: 'indian' },
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
  const totals = {
    calories: (m?.calories ?? 0) + food.kcal,
    protein: (m?.protein ?? 0) + food.protein,
    carbs: (m?.carbs ?? 0) + food.carbs,
    fat: (m?.fat ?? 0) + food.fat,
  }
  /*
    THE SECOND HELPING IS A SERVING, NOT A SECOND ROW.

    Tapping Rice twice used to write two identical lines, so a day of rice read
    as four entries and the review's "what it was made of" counted four foods
    rather than one food four times. Asked for as "let's say I had a lot of
    rice today, so I want to add more rice on top of it".

    Matched on the NAME, because that is the only thing a chip and a custom
    food share — and case-insensitively, since a custom "rice" and the
    library's "Rice" are the same dinner.
  */
  const log = m?.foodLog ?? []
  const same = log.find((f) => f.name.trim().toLowerCase() === food.name.trim().toLowerCase())
  if (same) {
    const servings = Math.max(1, same.servings ?? 1) + 1
    return {
      ...totals,
      foodLog: log.map((f) => (f.id === same.id ? {
        ...f,
        kcal: f.kcal + food.kcal,
        protein: f.protein + food.protein,
        carbs: f.carbs + food.carbs,
        fat: f.fat + food.fat,
        servings,
      } : f)),
    }
  }
  return {
    ...totals,
    foodLog: [...log, { id, name: food.name, kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat, servings: 1 }],
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

/**
 * CORRECT a logged food, totals and all.
 *
 * Reported as *"if I enter the values of some food item, I'm unable to edit it
 * or delete it"* — and the second half was half-true: a `×` removed it with no
 * confirmation, and nothing could change a wrong number. So a mistyped 900 kcal
 * cost the entry and whatever else had been logged after it.
 *
 * **The totals move by the DELTA, not by a recount.** A day's `calories` is
 * authoritative and can also be typed by hand, so re-summing `foodLog` would
 * silently discard a hand-typed total the moment anyone edited one chip — the
 * same reasoning `withFoodRemoved` already records for flooring at zero.
 *
 * Both stored shapes are rewritten, which is `REUSABLE-PATTERNS.md` §4's rule:
 * the entry in `foodLog` AND the four totals the whole page reads.
 */
export function withFoodEdited(
  m: DailyMetric | undefined,
  entry: LoggedFood,
  patch: Pick<LoggedFood, 'name' | 'kcal' | 'protein' | 'carbs' | 'fat'>,
): Partial<DailyMetric> {
  const d = {
    calories: patch.kcal - entry.kcal,
    protein: patch.protein - entry.protein,
    carbs: patch.carbs - entry.carbs,
    fat: patch.fat - entry.fat,
  }
  return {
    calories: Math.max(0, (m?.calories ?? 0) + d.calories),
    protein: Math.max(0, (m?.protein ?? 0) + d.protein),
    carbs: Math.max(0, (m?.carbs ?? 0) + d.carbs),
    fat: Math.max(0, (m?.fat ?? 0) + d.fat),
    foodLog: (m?.foodLog ?? []).map((f) => (f.id === entry.id ? { ...f, ...patch } : f)),
  }
}

/**
 * A food somebody added themselves, stored in settings so it comes back.
 *
 * Reported as *"normalize the log-what-you-eat into a better one instead of
 * just having built-in items"*. The picker offered forty foods and nothing
 * else, so anything the library had never heard of had to be entered as four
 * bare numbers under "or set the day's totals directly" — which logs the
 * calories and loses WHAT they were, and `foodLog` is the field the review now
 * reads to say what a fortnight was made of.
 *
 * `cuisine: 'yours'` rather than a boolean, because the picker already groups
 * by cuisine and a third group is one more row rather than a condition at
 * every call site.
 */
export type CustomFood = Omit<Food, 'cuisine'> & { cuisine: 'yours' }

/** What a custom food must have before it can be saved. */
export function foodIssues(draft: { name: string; kcal: string; protein: string; carbs: string; fat: string }): string[] {
  const out: string[] = []
  if (!draft.name.trim()) out.push('Give it a name.')
  const kcal = Number(draft.kcal)
  if (!(kcal > 0)) out.push('Calories have to be a number above zero.')
  if (kcal > 3000) out.push('Over 3,000 kcal for one item is almost certainly a typo.')
  for (const [label, v] of [['Protein', draft.protein], ['Carbs', draft.carbs], ['Fat', draft.fat]] as const) {
    if (v.trim() && !(Number(v) >= 0)) out.push(`${label} has to be a number.`)
  }
  /*
    The macros are optional and NOT cross-checked against the calories. 4·4·9
    arithmetic would reject plenty of real labels — fibre, alcohol and rounding
    all break it — and a validator that argues with the packet in your hand is
    one people work around by lying to it.
  */
  return out
}

/** A validated draft, as a food. */
export function foodOf(draft: { name: string; serving: string; kcal: string; protein: string; carbs: string; fat: string }): CustomFood {
  return {
    name: draft.name.trim(),
    serving: draft.serving.trim() || '1 serving',
    kcal: Math.round(Number(draft.kcal)),
    protein: Math.round(Number(draft.protein) || 0),
    carbs: Math.round(Number(draft.carbs) || 0),
    fat: Math.round(Number(draft.fat) || 0),
    cuisine: 'yours',
  }
}

/**
 * CHANGE HOW MANY SERVINGS a logged row is.
 *
 * "I had a lot of rice today, so I want to add more rice on top of it" — which
 * before this meant logging rice again, and again, until the day's receipt was
 * four identical lines. One row with a count is the same information in a form
 * you can correct.
 *
 * The per-serving amount is derived from what is stored (`kcal / servings`),
 * not kept beside it: a second copy of the same number is a second thing to
 * keep in step, and the row's totals are what every other reader adds up.
 * Rounded per field, so three servings of a 99 kcal fruit is 297 and not
 * 296.999999.
 */
export function withFoodServings(
  m: DailyMetric | undefined,
  entry: LoggedFood,
  servings: number,
): Partial<DailyMetric> {
  const was = Math.max(1, entry.servings ?? 1)
  const now = Math.max(1, Math.round(servings))
  if (now === was) return {}
  const per = (total: number) => total / was
  const next = {
    kcal: Math.round(per(entry.kcal) * now),
    protein: Math.round(per(entry.protein) * now),
    carbs: Math.round(per(entry.carbs) * now),
    fat: Math.round(per(entry.fat) * now),
  }
  return {
    calories: Math.max(0, (m?.calories ?? 0) + (next.kcal - entry.kcal)),
    protein: Math.max(0, (m?.protein ?? 0) + (next.protein - entry.protein)),
    carbs: Math.max(0, (m?.carbs ?? 0) + (next.carbs - entry.carbs)),
    fat: Math.max(0, (m?.fat ?? 0) + (next.fat - entry.fat)),
    foodLog: (m?.foodLog ?? []).map((f) => (f.id === entry.id ? { ...f, ...next, servings: now } : f)),
  }
}

/** Does this food's name match a search? Case- and position-insensitive. */
export function foodMatches(food: Food, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return food.name.toLowerCase().includes(q) || food.serving.toLowerCase().includes(q)
}
