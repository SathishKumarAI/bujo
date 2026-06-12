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
