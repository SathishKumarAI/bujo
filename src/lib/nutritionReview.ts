import { WEEKDAYS, addDays, dayDiff, fromISODay, prettyDay, todayISO } from './date'
import type { JournalData, Settings } from './types'

/**
 * NUTRITION REVIEW · what a fortnight of logged days adds up to.
 *
 * WHAT THIS FILE OWNS: the targets, the aggregates over `data.metrics` and
 * `foodLog`, and the one sentence zone 1 renders.
 * WHAT IT DOES NOT OWN: how a day is logged (`lib/foods.ts`), or how any of
 * this is drawn.
 *
 * Three things were missing and each is a different kind of gap:
 *
 * 1. **The targets were a module constant.** `const TARGET = { calories: 2000,
 *    … }` with the comment "a balanced default until targets are user-settable",
 *    and nothing ever made them settable — so every ring, every tone and every
 *    over/under verdict on the page was measured against a number the person
 *    could not change. Same defect as `fitnessGoalMin` having three readers and
 *    no writer; `USER-CONTROL.md`'s rule is that anything your numbers are
 *    judged against is yours to set.
 * 2. **`foodLog` was written and never read back.** Every tap has been stored
 *    as a named food since the undo was added, and nothing ever asked what the
 *    fortnight was made of — the page could say 2,000 kcal and not that 600 of
 *    them were biryani. A field written and never read is the same defect as a
 *    data module nothing imports, which this repo has shipped before.
 * 3. **Nothing on the page said what to do next.** `docs/PAGE-ROLLOUT.md` named
 *    it: "the page has no sentence at all, not even a `StatBar`".
 */

/** The defaults the page shipped with, kept as the floor under the settings. */
export const DEFAULT_TARGETS = { calories: 2000, protein: 120, carbs: 200, fat: 60 } as const

export type Targets = { calories: number; protein: number; carbs: number; fat: number }

/**
 * The person's targets, or the defaults.
 *
 * One reader for the whole page, so a ring and the verdict beside it cannot
 * disagree about what they are measuring against — which is the bug
 * `calorieState` already documents from the other end (two judgements of one
 * number, six pixels apart).
 */
export function targetsOf(settings?: Pick<Settings, 'nutritionTargets'>): Targets {
  const t = settings?.nutritionTargets
  return {
    calories: t?.calories && t.calories > 0 ? t.calories : DEFAULT_TARGETS.calories,
    protein: t?.protein && t.protein > 0 ? t.protein : DEFAULT_TARGETS.protein,
    carbs: t?.carbs && t.carbs > 0 ? t.carbs : DEFAULT_TARGETS.carbs,
    fat: t?.fat && t.fat > 0 ? t.fat : DEFAULT_TARGETS.fat,
  }
}

/**
 * The three macros, their labels and their hues — one list, two readers.
 *
 * The view and the macro bar each had their own copy of this array until the
 * bar moved into its own file; two lists of the same three things is how they
 * come to disagree about which colour carbs are.
 */
export const MACROS = [
  { key: 'protein' as const, label: 'Protein', color: 'red' },
  { key: 'carbs' as const, label: 'Carbs', color: 'yellow' },
  { key: 'fat' as const, label: 'Fat', color: 'sky' },
]

/** How far over target still counts as on target. A target is an aim. */
export const OVER_SLACK = 1.05

export interface LoggedDay {
  date: string
  kcal: number
  protein: number
  /** Over the slack, not merely over the number. */
  over: boolean
}

/**
 * The days with something on them, newest first.
 *
 * Only logged days: a day with no food is a day you did not record, not a day
 * you ate nothing, and averaging zeroes into a fortnight is the
 * `count ? sum / count : 0` trap with fourteen extra zeroes.
 */
export function loggedDays(data: JournalData, days = 14, today = todayISO(), targets: Targets = DEFAULT_TARGETS): LoggedDay[] {
  const out: LoggedDay[] = []
  for (let i = 0; i < days; i++) {
    const date = addDays(today, -i)
    const m = data.metrics.find((x) => x.date === date)
    const kcal = m?.calories ?? 0
    if (kcal <= 0) continue
    out.push({ date, kcal, protein: m?.protein ?? 0, over: kcal > targets.calories * OVER_SLACK })
  }
  return out
}

export interface DayAverages {
  days: number
  kcal: number | null
  protein: number | null
  /** Days inside the calorie target, including the slack. */
  inTarget: number
}

/** Means over the logged days — `null` with nothing logged, never 0. */
export function averages(days: LoggedDay[]): DayAverages {
  if (days.length === 0) return { days: 0, kcal: null, protein: null, inTarget: 0 }
  return {
    days: days.length,
    kcal: Math.round(days.reduce((a, d) => a + d.kcal, 0) / days.length),
    protein: Math.round(days.reduce((a, d) => a + d.protein, 0) / days.length),
    inTarget: days.filter((d) => !d.over).length,
  }
}

export interface WeekdayIntake {
  day: string
  days: number
  /** `null` on a weekday with nothing logged — not 0, which reads as a fast. */
  avgKcal: number | null
}

/**
 * Average calories by day of the week, all seven rows.
 *
 * The question nobody could ask before: *is it the weekend?* A fortnight of
 * fourteen dated rows cannot answer it — you have to read them and do the
 * arithmetic yourself, which is what an aggregate is for.
 */
export function weekdayIntake(days: LoggedDay[]): WeekdayIntake[] {
  const rows: { day: string; total: number; days: number }[] = WEEKDAYS.map((day) => ({ day, total: 0, days: 0 }))
  for (const d of days) {
    const r = rows[fromISODay(d.date).getDay()]
    r.total += d.kcal
    r.days += 1
  }
  return rows.map((r) => ({ day: r.day, days: r.days, avgKcal: r.days ? Math.round(r.total / r.days) : null }))
}

export interface FoodTally {
  name: string
  times: number
  /** Calories this food has contributed across the window. */
  kcal: number
  /** Share of the window's logged calories, 0–100. */
  share: number
}

/**
 * What the fortnight was actually made of, from `foodLog`.
 *
 * The first reader that field has ever had. Ordered by CALORIES contributed
 * rather than by how often a food appears: three coffees and one biryani are
 * four taps and one of them is the day. The count rides along, because "once,
 * and it was 900 kcal" and "nine times at 100" are different problems.
 */
export function topFoods(data: JournalData, days = 14, today = todayISO(), limit = 8): FoodTally[] {
  const by = new Map<string, { name: string; times: number; kcal: number }>()
  let total = 0
  for (let i = 0; i < days; i++) {
    const date = addDays(today, -i)
    const m = data.metrics.find((x) => x.date === date)
    for (const f of m?.foodLog ?? []) {
      const key = f.name.trim().toLowerCase()
      const row = by.get(key) ?? { name: f.name.trim(), times: 0, kcal: 0 }
      row.times += 1
      row.kcal += f.kcal ?? 0
      by.set(key, row)
      total += f.kcal ?? 0
    }
  }
  return [...by.values()]
    .sort((a, b) => b.kcal - a.kcal || b.times - a.times)
    .slice(0, limit)
    .map((r) => ({ ...r, share: total > 0 ? Math.round((r.kcal / total) * 100) : 0 }))
}

export interface TrainingBalance {
  /** Days in the window with a logged workout. */
  trainingDays: number
  /** Days with both a workout and food logged. */
  bothDays: number
  /** Mean protein on training days — `null` under the coverage floor. */
  onTraining: number | null
  /** Mean protein on the other logged days — `null` under the floor. */
  onRest: number | null
  /** The protein floor these are read against. */
  floor: number
}

/** Three days each side, or the comparison is two anecdotes. */
export const BALANCE_FLOOR = 3

/**
 * PROTEIN AGAINST TRAINING · the question this page could not answer.
 *
 * Asked as *"help me with balancing the workouts as well, and tell me if I'm
 * taking less protein"*. Nutrition knew what you ate and Strength knew what you
 * lifted, and nothing read both — so the one number that connects them (did the
 * days you trained get the protein they needed?) had no home.
 *
 * **A coverage floor on BOTH sides**, which is the rule CLAUDE.md records from
 * the momentum-indicator bug: a two-day sample compared against a seven-day one
 * reported a lapse as an improvement. Three logged training days and three
 * logged rest days, or both means are `null` and the card says so rather than
 * comparing one Tuesday with a fortnight.
 */
export function trainingBalance(data: JournalData, targets: Targets, days = 14, today = todayISO()): TrainingBalance {
  const trained = new Set(
    data.workouts
      .filter((w) => { const d = dayDiff(w.date, today); return d >= 0 && d < days })
      .map((w) => w.date),
  )
  const logged = loggedDays(data, days, today, targets)
  const onT = logged.filter((d) => trained.has(d.date))
  const onR = logged.filter((d) => !trained.has(d.date))
  const mean = (rows: LoggedDay[]) =>
    rows.length >= BALANCE_FLOOR ? Math.round(rows.reduce((a, d) => a + d.protein, 0) / rows.length) : null
  return {
    trainingDays: trained.size,
    bothDays: onT.length,
    onTraining: mean(onT),
    onRest: mean(onR),
    floor: targets.protein,
  }
}

export interface NutritionStep {
  id: 'first' | 'untracked' | 'over' | 'protein' | 'left' | 'done'
  text: string
  /** The review row holding the detail, when one does. */
  group?: string
}

/**
 * ONE SENTENCE THAT SAYS WHAT TO DO NEXT.
 *
 * The page had none — two rings and a line about the calorie remainder, which
 * answers "how am I doing" and not "what now". The order is urgency, and the
 * first two rules are about the RECORD rather than the food: a page that
 * judges a day you have not finished logging is a page that lies at breakfast.
 *
 * | rule | fires when |
 * |---|---|
 * | `first` | nothing logged at all — a record with no rows cannot say anything else |
 * | `untracked` | today has nothing on it yet, and other days do |
 * | `over` | today is past the target plus its slack |
 * | `protein` | the floor is short with the calorie ceiling close |
 * | `left` | room left, and what it is worth in this food library |
 * | `done` | the floor to stand on, as the last clause |
 *
 * Total, like every other `nextStep` in this app: it always returns a
 * sentence, which is what lets zone 1 render it without a conditional that
 * would leave a hole at the top of the page.
 */
export function nextStep(data: JournalData, opts: {
  date: string
  targets: Targets
  today?: string
}): NutritionStep {
  const today = opts.today ?? todayISO()
  const m = data.metrics.find((x) => x.date === opts.date)
  const kcal = m?.calories ?? 0
  const protein = m?.protein ?? 0
  const logged = loggedDays(data, 14, today, opts.targets)
  const when = opts.date === today ? 'today' : prettyDay(opts.date)

  if (logged.length === 0 && kcal === 0) {
    return { id: 'first', text: 'Nothing logged yet — tap a food below and this page starts reading your days back.', group: 'today' }
  }
  if (kcal === 0) {
    return { id: 'untracked', text: `Nothing on ${when} yet. ${logged.length} of the last 14 days are on the record.`, group: 'trend' }
  }
  if (kcal > opts.targets.calories * OVER_SLACK) {
    return { id: 'over', text: `${kcal - opts.targets.calories} kcal over target ${when}. It happens — the fortnight is what counts.`, group: 'trend' }
  }
  if (protein < opts.targets.protein && kcal > opts.targets.calories * 0.6) {
    return {
      id: 'protein',
      text: `${opts.targets.protein - protein} g of protein short with ${Math.max(0, opts.targets.calories - kcal)} kcal left — a protein-dense food fits both.`,
      group: 'today',
    }
  }
  if (kcal < opts.targets.calories) {
    return { id: 'left', text: `${opts.targets.calories - kcal} kcal left ${when}, and ${Math.max(0, opts.targets.protein - protein)} g of protein.`, group: 'today' }
  }
  return { id: 'done', text: `On target ${when} · ${protein} g of protein. ${logged.length} days logged this fortnight.`, group: 'trend' }
}

/** Days in a row, ending today or yesterday, that stayed inside target. */
export function inTargetStreak(data: JournalData, targets: Targets, today = todayISO()): number {
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const date = addDays(today, -i)
    const kcal = data.metrics.find((x) => x.date === date)?.calories ?? 0
    // Today not logged yet does not break a streak; it has not happened.
    if (kcal === 0) {
      if (i === 0) continue
      break
    }
    if (kcal > targets.calories * OVER_SLACK) break
    streak += 1
  }
  return streak
}

/** Days since the last logged day, or `null` when nothing is logged. */
export function daysSinceLogged(data: JournalData, today = todayISO()): number | null {
  const dates = data.metrics.filter((m) => (m.calories ?? 0) > 0).map((m) => m.date).sort()
  const last = dates[dates.length - 1]
  return last ? dayDiff(last, today) : null
}
