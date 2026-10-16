import { CalendarBlank, ChartBar, ForkKnife, Target } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { shortFood } from '../../lib/foods'
import { Card, Empty, Input } from '../ui'
import { BarList, ResetField, type BarRow } from '../page'
import { cat, onRaised } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import { DEFAULT_TARGETS, type DayAverages, type FoodTally, type LoggedDay, type Targets, type TrainingBalance, type WeekdayIntake } from '../../lib/nutritionReview'

/**
 * Nutrition's read-only cards.
 *
 * WHAT THIS FILE OWNS: how one aggregate from `lib/nutritionReview.ts` is drawn.
 * WHAT IT DOES NOT OWN: the arithmetic, the act, or which row is on screen.
 *
 * Every comparison here is `BarList` (`docs/REUSABLE-PATTERNS.md` §21) and every
 * subtitle states the finding rather than the title again.
 */

/* ── Trend ────────────────────────────────────────────────────────────────── */

/**
 * The fortnight, as deviations from target rather than as absolute bars.
 *
 * The rows it replaces were fourteen dates and fourteen numbers with a bar
 * running 0 → max, and on a demo fortnight every day fell between 1834 and
 * 2411 — so every bar rendered at 76–100% of the row and read as stripes. The
 * floor was the problem: zero calories is not a day anyone has, so three
 * quarters of the width drew a fact never in question. These measure from the
 * target, which is also the question the card is asked.
 *
 * `BarList` carries them now rather than the hand-rolled diverging markup the
 * view had: the bar is one-sided, and the SIDE of target is carried by the tone
 * plus the figure's sign, which the `announce` string spells out in full.
 */
export function FortnightCard({ days, averages, targets, onPick }: {
  days: LoggedDay[]
  averages: DayAverages
  targets: Targets
  /** Open that day in the logger. */
  onPick?: (date: string) => void
}) {
  const worst = Math.max(200, ...days.map((d) => Math.abs(d.kcal - targets.calories)))
  const rows: BarRow[] = days.map((d) => {
    const delta = d.kcal - targets.calories
    return {
      label: prettyDay(d.date).replace(/^\w+,\s*/, ''),
      pct: (Math.abs(delta) / worst) * 100,
      value: `${delta > 0 ? '+' : delta === 0 ? '' : '−'}${Math.abs(delta)}`,
      note: `${d.kcal}`,
      tone: d.over ? 'peach' : 'green',
      onPick: onPick ? () => onPick(d.date) : undefined,
      announce: `${prettyDay(d.date)}: ${d.kcal} kcal, ${Math.abs(delta)} ${delta >= 0 ? 'over' : 'under'} the ${targets.calories} target — open this day`,
    }
  })
  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={ChartBar} size="md" className="text-teal" /> The fortnight</span>}
      subtitle={
        averages.kcal == null
          ? `Logged days against a ${targets.calories} kcal target`
          : `${averages.kcal} kcal a day across ${averages.days} logged ${averages.days === 1 ? 'day' : 'days'} · ${averages.inTarget} inside target`
      }
    >
      {days.length === 0 ? (
        <Empty>Nothing logged in the last two weeks.</Empty>
      ) : (
        <>
          <BarList rows={rows} labelWidth="w-14" />
          <p className="mt-2 text-micro text-fg-2">
            Distance from the {targets.calories} kcal target, with the day's own total beside it. Tap a day to open it.
          </p>
        </>
      )}
    </Card>
  )
}

/**
 * The targets themselves, where the numbers they judge are.
 *
 * They were a module constant with a comment promising they would become
 * settable. Under the fortnight they judge is where you are standing when you
 * decide whether 2,000 was the right number — the same placement Pickleball's
 * weekly-games field and Fitness's minutes target use.
 */
export function TargetsCard({ targets, onChange }: {
  targets: Targets
  onChange: (patch: Partial<Targets>) => void
}) {
  const fields: { key: keyof Targets; label: string; suffix: string }[] = [
    { key: 'calories', label: 'Calories', suffix: 'kcal' },
    { key: 'protein', label: 'Protein', suffix: 'g' },
    { key: 'carbs', label: 'Carbs', suffix: 'g' },
    { key: 'fat', label: 'Fat', suffix: 'g' },
  ]
  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-mauve" /> Your targets</span>}
      subtitle="Every ring and verdict on this page is measured against these"
    >
      <div className="grid grid-cols-2 gap-3 @lg/page:grid-cols-4">
        {fields.map((f) => (
          <label key={f.key} className="block text-label text-fg-2">
            {f.label}
            <span className="mt-1 flex items-center gap-1.5">
              <Input
                type="number"
                value={String(targets[f.key])}
                onChange={(e) => onChange({ [f.key]: e.target.value ? Number(e.target.value) : undefined } as Partial<Targets>)}
                aria-label={`${f.label} target in ${f.suffix}`}
                className="num py-1 text-right"
              />
              <span className="shrink-0 text-micro text-fg-2">{f.suffix}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {/* The way back, which a set of four numbers needs more than most:
            these judge every ring on the page, so "what were they before I
            started?" has to have an answer that is not a memory. */}
        <ResetField
          changed={(Object.keys(DEFAULT_TARGETS) as (keyof Targets)[]).some((k) => targets[k] !== DEFAULT_TARGETS[k])}
          to={`${DEFAULT_TARGETS.calories} kcal and ${DEFAULT_TARGETS.protein} g`}
          what="every target"
          onReset={() => onChange({ calories: undefined, protein: undefined, carbs: undefined, fat: undefined } as Partial<Targets>)}
        />
        <p className="text-micro text-fg-2">
          Blank falls back to the default, so setting a calorie target does not force a decision about fat.
        </p>
      </div>
    </Card>
  )
}

/**
 * PROTEIN AGAINST THE DAYS YOU TRAINED.
 *
 * Asked as *"help me with balancing the workouts as well, and tell me if I'm
 * taking less protein"*. Nutrition knew what you ate and Strength knew what you
 * lifted, and nothing read both, so the number that connects them had no home.
 *
 * **It refuses to answer under the coverage floor.** Three logged training days
 * and three logged rest days, or it says what it is missing instead of
 * comparing one Tuesday against a fortnight — the momentum-indicator bug in
 * CLAUDE.md is exactly that shape, and it reported a lapse as an improvement.
 */
export function BalanceCard({ balance }: { balance: TrainingBalance }) {
  const { onTraining, onRest, floor, trainingDays, bothDays } = balance
  const short = onTraining != null && onTraining < floor
  const rows: BarRow[] = onTraining == null || onRest == null ? [] : [
    {
      label: 'Trained',
      pct: Math.min(100, (onTraining / Math.max(floor, onTraining, onRest)) * 100),
      value: `${onTraining} g`,
      note: `${bothDays}d`,
      tone: short ? 'peach' : 'green',
      announce: `On the ${bothDays} days you trained and logged, protein averaged ${onTraining} grams against a ${floor} gram floor`,
    },
    {
      label: 'Rest',
      pct: Math.min(100, (onRest / Math.max(floor, onTraining, onRest)) * 100),
      value: `${onRest} g`,
      note: '',
      tone: 'teal',
      announce: `On rest days, protein averaged ${onRest} grams`,
    },
  ]
  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-green" /> Protein and training</span>}
      subtitle={
        onTraining == null
          ? `${trainingDays} training ${trainingDays === 1 ? 'day' : 'days'} in the fortnight — three logged on each side and this compares them`
          : short
            ? `${floor - onTraining} g short on the days you trained`
            : `Clearing the ${floor} g floor on training days`
      }
    >
      {rows.length === 0 ? (
        <p className="text-label text-fg-2">
          Log food on at least three training days and three rest days and this says whether the training days are getting the protein they need. Comparing fewer than that is two anecdotes.
        </p>
      ) : (
        <>
          <BarList rows={rows} labelWidth="w-16" />
          <p className="mt-2 text-micro text-fg-2">
            Average protein, on the days you trained against the days you did not, read against your {floor} g floor.
          </p>
        </>
      )}
    </Card>
  )
}

/* ── Patterns ─────────────────────────────────────────────────────────────── */

/** Average calories by day of the week — the "is it the weekend" question. */
export function WeekdayCard({ rows, targets }: { rows: WeekdayIntake[]; targets: Targets }) {
  const logged = rows.filter((r) => r.avgKcal != null)
  const worst = logged.length ? logged.reduce((a, b) => ((b.avgKcal ?? 0) > (a.avgKcal ?? 0) ? b : a)) : null
  const max = Math.max(targets.calories, ...logged.map((r) => r.avgKcal ?? 0))
  const bars: BarRow[] = rows.map((r) => ({
    label: r.day,
    pct: ((r.avgKcal ?? 0) / max) * 100,
    value: r.avgKcal != null ? String(r.avgKcal) : null,
    note: r.days > 0 ? `${r.days}d` : '',
    tone: r.avgKcal != null && r.avgKcal > targets.calories ? 'peach' : 'green',
    announce: r.avgKcal != null
      ? `${r.day}: ${r.avgKcal} kcal on average across ${r.days} logged ${r.days === 1 ? 'day' : 'days'}`
      : `${r.day}: nothing logged`,
  }))
  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={CalendarBlank} size="md" className="text-blue" /> By day of the week</span>}
      subtitle={worst ? `Heaviest on ${worst.day} · ${worst.avgKcal} kcal on average` : 'Average calories by weekday'}
    >
      <BarList rows={bars} />
      <p className="mt-2 text-micro text-fg-2">
        A weekday with nothing logged shows a dash rather than a zero — an unrecorded day is not a fast.
      </p>
    </Card>
  )
}

/** What the fortnight was made of — the first reader `foodLog` has ever had. */
export function TopFoodsCard({ foods }: { foods: FoodTally[] }) {
  const top = foods[0]
  const bars: BarRow[] = foods.map((f) => ({
    label: shortFood(f.name),
    pct: f.share,
    value: `${f.share}%`,
    note: `${f.times}×`,
    tone: 'sky',
    announce: `${f.name}: ${f.kcal} kcal across ${f.times} ${f.times === 1 ? 'serving' : 'servings'}, ${f.share}% of the fortnight's logged calories`,
  }))
  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={ForkKnife} size="md" className="text-sky" /> What it was made of</span>}
      subtitle={top ? `${top.name} is ${top.share}% of the fortnight's calories` : 'Your most calorific foods'}
    >
      {foods.length === 0 ? (
        <Empty>Tap foods rather than typing totals and this fills in.</Empty>
      ) : (
        <>
          {/* `w-36`, not `w-28`: the library's longest drawn name after
              `shortFood` is "Grilled chicken" at ~104px, and 112px left it one
              character short at the exact moment the list became worth
              reading. The bar keeps 500px of a 678px card. */}
          <BarList rows={bars} labelWidth="w-36" />
          <p className="mt-2 text-micro text-fg-2">
            Share of logged calories, by food, with how many servings. Ranked by calories rather than by taps: one biryani outweighs three coffees.
          </p>
        </>
      )}
    </Card>
  )
}

/* ── Today ────────────────────────────────────────────────────────────────── */

/**
 * What is left of the day, as the three numbers that are actually decisions.
 *
 * The rings in zone 1 say how much has gone; this says what the remainder is
 * worth, which is the question asked standing in front of a fridge.
 */
export function RemainingCard({ m, targets }: {
  m?: { calories?: number; protein?: number; carbs?: number; fat?: number }
  targets: Targets
}) {
  const rows: { label: string; had: number; target: number; floor: boolean }[] = [
    { label: 'Calories', had: m?.calories ?? 0, target: targets.calories, floor: false },
    { label: 'Protein', had: m?.protein ?? 0, target: targets.protein, floor: true },
    { label: 'Carbs', had: m?.carbs ?? 0, target: targets.carbs, floor: false },
    { label: 'Fat', had: m?.fat ?? 0, target: targets.fat, floor: false },
  ]
  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-green" /> What is left</span>}
      subtitle="Calories and carbs are ceilings; protein is a floor"
    >
      <ul className="divide-y divide-surface0">
        {rows.map((r) => {
          const left = r.target - r.had
          /* A ceiling over is a problem, a floor under is a problem — one tone
             function cannot serve both, and getting it backwards is the kind of
             bug a reader trusts (`calorieState` already records it). */
          const bad = r.floor ? left > 0 : left < 0
          return (
            <li key={r.label} className="flex items-baseline justify-between gap-3 py-1.5 text-label">
              <span className="text-fg-2">{r.label}</span>
              <span className="num text-right" style={{ color: bad ? onRaised(r.floor ? 'yellow' : 'peach') : onRaised('green') }}>
                {/* A FLOOR THAT IS CLEARED IS NOT "OVER". Protein at 154 of a
                    120 floor read "34 over" in green, directly under Calories
                    reading "23 over" in peach — the same word for the good
                    outcome and the bad one, six pixels apart. */}
                {left === 0 ? 'exactly there' : `${Math.abs(left)} ${left > 0 ? (r.floor ? 'short' : 'left') : r.floor ? 'clear' : 'over'}`}
                <span className="ml-1.5 text-fg-2">· {r.had} of {r.target}</span>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-micro" style={{ color: cat('subtext0') }}>
        A target is an aim: five per cent over the calorie ceiling still counts as on target.
      </p>
    </Card>
  )
}
