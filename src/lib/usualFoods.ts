import { addDays, todayISO } from './date'
import { FOODS, type Food } from './foods'
import type { JournalData } from './types'

/**
 * "YOUR USUAL" — the foods offered first, one tap from logged.
 *
 * OWNS: which foods, in what order. Pinned first (in the order pinned), then
 * what you log most over the last 30 days, then Indian staples to fill the
 * list on a new journal. DOES NOT OWN: the rows (`NutritionPhone`, desktop
 * `FoodPicker`) or where pins are stored (`settings.pinnedFoods`).
 *
 * Owner asks, 2026-10-30: "show most of the Indian foods … a paneer and show
 * only one … white rice, hide the brown rice and basmati … chicken … pin …
 * your usual should change based upon the usage".
 *
 * VARIANTS COLLAPSE INTO ONE ROW. White, basmati and brown rice are one
 * choice at lunch, not three rows; logging any of them ranks the family, and
 * the row shows the family's default unless you pinned a specific member.
 * Search still finds every variant — this hides rows, never foods.
 */
export const FAMILIES: { match: RegExp; show: string }[] = [
  { match: /^(white|basmati|brown) rice\b/i, show: 'White rice (cooked)' },
  { match: /paneer/i, show: 'Paneer (cubed)' },
]

/** Always on the list — the three the owner named. Usage orders everything else. */
export const CORE = ['Chicken curry', 'White rice (cooked)', 'Paneer (cubed)']

/** Filled in this order when usage leaves room — a new journal starts here. */
export const STAPLES = [
  'Chicken curry', 'White rice (cooked)', 'Dal (lentil curry)', 'Roti / chapati',
  'Paneer (cubed)', 'Idli', 'Plain dosa', 'Masala omelette', 'Boiled eggs', 'Poha',
]

const key = (name: string) => FAMILIES.find((f) => f.match.test(name))?.show.toLowerCase() ?? name.trim().toLowerCase()

export function usualFoods(data: JournalData, { today = todayISO(), limit = 10, days = 30, extra = [] as Food[] } = {}): Food[] {
  const library = FOODS.concat(extra)
  const find = (name: string) => library.find((f) => f.name.toLowerCase() === name.trim().toLowerCase())
  const pinned = data.settings.pinnedFoods ?? []

  // Times logged per family, newest day breaking ties — usage, not calories.
  const uses = new Map<string, { times: number; last: number }>()
  for (let i = 0; i < days; i++) {
    for (const f of data.metrics.find((m) => m.date === addDays(today, -i))?.foodLog ?? []) {
      const u = uses.get(key(f.name)) ?? { times: 0, last: -i }
      u.times += f.servings ?? 1
      uses.set(key(f.name), u)
    }
  }
  const used = [...uses].sort((a, b) => b[1].times - a[1].times || b[1].last - a[1].last).map(([k]) => k)

  const out: Food[] = []
  const seen = new Set<string>()
  const push = (name: string) => {
    const k = key(name)
    if (seen.has(k) || out.length >= limit) return
    // A pinned member stands for its family; otherwise the family's default.
    const f = find(pinned.find((p) => key(p) === k) ?? FAMILIES.find((x) => x.show.toLowerCase() === k)?.show ?? name)
      ?? (library.find((x) => key(x.name) === k))
    if (!f) return
    seen.add(k)
    out.push(f)
  }
  for (const p of pinned) {
    const f = find(p)
    if (f && !seen.has(key(p))) { seen.add(key(p)); out.push(f) }
  }
  // Usage may not crowd out a core food: hold back one slot per core family
  // that neither a pin nor usage has already put on the list.
  const held = () => CORE.filter((c) => !seen.has(key(c))).length
  for (const k of used) if (out.length < limit - held()) push(k)
  CORE.forEach(push)
  STAPLES.forEach(push)
  return out
}

/** Pin or unpin by name; a pin goes to the end of the pinned list. */
export function togglePin(pinned: string[] | undefined, name: string): string[] {
  const list = pinned ?? []
  return list.includes(name) ? list.filter((n) => n !== name) : [...list, name]
}
