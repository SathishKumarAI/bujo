import { useState } from 'react'
import { useJournal } from '../store'
import { prettyDay, todayISO } from '../lib/date'
import { uid } from '../lib/storage'
import { useConfirm } from '../components/ConfirmDialog'
import { notify } from '../lib/notify'
import { CaretRight, ForkKnife, Gauge, NotePencil, Plus, Target, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui'
import { Ring } from '../components/ui/ring'
import { ActStrip, DisclosureRow, EmptyFrame, PageLayout, useActColumn, NextStepBlock } from '../components/page'
import { FOODS, SAMPLE_DAY, sumFoods, withFoodAdded, withFoodEdited, withFoodRemoved, withFoodServings, type CustomFood, type Food } from '../lib/foods'
import type { LoggedFood } from '../lib/types'
import { onRaised } from '../lib/colors'
import { FoodSearch } from '../components/nutrition/FoodSearch'
import { MacroBar } from '../components/nutrition/DayCards'
import { FoodPicker } from '../components/nutrition/FoodPicker'
import { DayLog } from '../components/nutrition/DayLog'
import { CustomFoodForm } from '../components/nutrition/CustomFood'
import { NutritionReview } from '../components/nutrition/Review'
import { NUTRITION_PANELS } from '../components/nutrition/panels'
import { MACROS, inTargetStreak, nextStep, targetsOf, topFoods, type Targets } from '../lib/nutritionReview'
import { useStickyState } from '../lib/useStickyState'

/**
 * NUTRITION · promoted from an accordion on Fitness to a page of its own.
 *
 * It was never a subsection of training. It has its own object (the day's
 * intake), its own cadence (several times a day, not once), and its own
 * question ("did I hit my ratio?") — and being folded inside the workout page
 * meant its date silently followed whatever day the *workout form* was set to,
 * so logging yesterday's run moved today's food.
 *
 * Zone 1  orient — the day being logged, calories and protein against target.
 * Zone 2  act    — add a food, or set the numbers directly.
 * Zone 3  review — summary, the macro bar against target, recent days.
 *
 * Signature visual: the stacked macro bar. Totals alone cannot answer the only
 * question this page exists for — 2,000 calories at 30% protein and 2,000 at
 * 10% are the same number and completely different days — so the visual
 * encodes the ratio, with the target ratio drawn behind it to compare against.
 */

/**
 * THE TARGETS ARE SETTABLE NOW, and they were a module constant here with the
 * comment "a balanced default until targets are user-settable" — which nothing
 * ever made true. Every ring, tone and over/under verdict on this page judged
 * the day against a number the person could not change: the `fitnessGoalMin`
 * defect (three readers, no writer) on a second page.
 *
 * `targetsOf(settings)` is the single reader, so a ring and the sentence beside
 * it cannot disagree about what they measure against — which is the bug
 * `calorieState` below already records from the other end.
 */

/**
 * How far over target counts as over. Reported as "the page looks pale and the
 * calories are not showing in a good way", and both halves were the same
 * defect: the day's headline number was a text fact (`1996 / 2000`) in a flat
 * stat row, so the page's primary quantity carried **no** visual weight and no
 * state — 600 kcal and 2,600 kcal rendered in the same grey at the same size.
 * The over/under colour existed only on the Recent-days rows, two zones away
 * from the number it judges.
 *
 * 5% rather than a hard equality, because a target is an aim and 2,001 kcal is
 * not a miss. Over that, the ring turns; well over (25%), it turns again — the
 * same three-step green/yellow/peach scale the food chips and Plan use.
 */
const OVER_SLACK = 1.05
const WAY_OVER = 1.25

/**
 * Calories are a **ceiling** and protein is a **floor**, so one tone function
 * cannot serve both — and getting that backwards is the kind of bug a reader
 * trusts: a green ring for 40 g of protein would read as "done".
 *
 * `calorieState` returns the tone AND the sentence together, because the first
 * draft computed them separately and immediately disagreed with itself on
 * screen: at 2,023 kcal the ring was green (inside the 5% slack) while the line
 * beside it read "23 kcal over target". Two judgements of one number, six
 * pixels apart, is worse than either one alone — the reader cannot tell which
 * to believe, and the only honest fix is for there to be one.
 */
function calorieState(kcal: number, target: number): { color: string; line: string } {
  if (kcal === 0) return { color: 'overlay0', line: 'Nothing logged yet. Pick a food below.' }
  if (kcal > target * WAY_OVER) return { color: 'peach', line: `${kcal - target} kcal over target.` }
  if (kcal > target * OVER_SLACK) return { color: 'yellow', line: `${kcal - target} kcal over target.` }
  // Inside the slack. The number is still over, and saying so while the ring
  // stays green is the point: "on target" is the verdict, the count is the
  // detail. Hiding the count would be the other kind of dishonest.
  if (kcal > target) return { color: 'green', line: `On target — ${kcal - target} kcal over.` }
  return { color: 'green', line: `${target - kcal} kcal left today.` }
}

function floorTone(value: number, target: number): string {
  if (value === 0) return 'overlay0'
  if (value >= target) return 'green'
  if (value >= target * 0.6) return 'yellow'
  return 'peach'
}

export function Nutrition() {
  const { data, setMetric, setSettings } = useJournal()
  const confirm = useConfirm()
  const today = todayISO()
  const [date, setDate] = useState(today)

  /* One reader for the targets, and the page's own state for the rest. */
  const targets = targetsOf(data.settings)
  const setTargets = (patch: Partial<Targets>) =>
    setSettings({ nutritionTargets: { ...(data.settings.nutritionTargets ?? {}), ...patch } })
  /* Which review row is open, and the act column's open/shut. Both sticky, and
     both owned here: the row because zone 1's sentence points into it, the
     column because `PageLayout` has to know (shut, zone 2 becomes a 40px rail
     and the review takes its width). */
  const [panel, setPanel] = useStickyState<string>('nutrition.panel', 'today', NUTRITION_PANELS.map((p) => p.id))
  const logCol = useActColumn('nutrition')

  const m = data.metrics.find((x) => x.date === date)
  const kcal = m?.calories ?? 0
  const protein = m?.protein ?? 0
  const totalG = MACROS.reduce((s, x) => s + (m?.[x.key] ?? 0), 0)

  /**
   * A day past this is almost certainly a mis-tap rather than a meal, so the
   * app asks instead of silently accepting it. Deliberately generous — 2.5x a
   * 2000 kcal target. The guardrail is for "I tapped biryani eleven times",
   * not for "I had a big day", and a threshold that fires on a genuinely large
   * day is a threshold people learn to dismiss without reading.
   */
  const IMPLAUSIBLE_KCAL = 5000

  async function addFood(food: Food) {
    const next = (m?.calories ?? 0) + food.kcal
    /*
      TWO WARNINGS, AND THEY ARE NOT THE SAME WARNING.

      Asked for as "try to give me a warning if I exceed the total number of
      calories" — which is a different question from the implausible-total
      guard below. One is "this looks like a mis-tap" (5,000 kcal, a mechanical
      check); the other is "this takes you past the target you set", which is
      information about your day and must not be a blocking dialog, because
      going over a target is a normal thing that happens and a modal in front
      of it would be nagging. So the ceiling warning is a NOTIFICATION after
      the fact, with the number in it, and the mis-tap guard stays a
      confirmation before it.

      `notify.info`, not `warning`: being over a calorie target is not an
      error, and this app's own copy rule is that a tone carries a judgement.
    */
    if (targets.calories > 0 && (m?.calories ?? 0) <= targets.calories && next > targets.calories) {
      notify.info(
        `${food.name} takes you past ${targets.calories} kcal`,
        `${prettyDay(date)} is at ${next} — ${next - targets.calories} over. The fortnight is what counts; tap the row in Today to take it back off.`,
      )
    }
    if (next > IMPLAUSIBLE_KCAL && !(await confirm({
      title: `Add ${food.name} on top of ${kcal} kcal?`,
      description: `That takes ${prettyDay(date)} to ${next} kcal. If that is right, go ahead — this only asks because repeated taps are easy to make by accident.`,
      confirmLabel: 'Yes, add it',
    }))) return
    // The receipt rides along with the totals. Totals stay authoritative —
    // `foodLog` is what makes the tap reversible, not a second source of truth.
    setMetric(date, withFoodAdded(m, food, uid('food')))
  }

  /** Take one logged food back off the day, numbers and all. */
  const removeFood = (entry: LoggedFood) => setMetric(date, withFoodRemoved(m, entry))

  /**
   * Correct a logged food — and apply the same implausible-total guard an ADD
   * has, because an edit can push a day over it just as easily and the guard
   * was only ever on one of the two doors.
   */
  async function editFood(entry: LoggedFood, patch: Pick<LoggedFood, 'name' | 'kcal' | 'protein' | 'carbs' | 'fat'>) {
    const next = (m?.calories ?? 0) - entry.kcal + patch.kcal
    if (next > IMPLAUSIBLE_KCAL && !(await confirm({
      title: `Set ${patch.name} to ${patch.kcal} kcal?`,
      description: `That takes ${prettyDay(date)} to ${next} kcal. If that is right, go ahead — this only asks because a mistyped zero is easy to make.`,
      confirmLabel: 'Yes, save it',
    }))) return false
    setMetric(date, withFoodEdited(m, entry, patch))
    return true
  }

  /** More of the same thing, or less of it. */
  const setServings = (entry: LoggedFood, servings: number) => setMetric(date, withFoodServings(m, entry, servings))

  /** A food of your own: logged on the day AND kept for next time. */
  function addCustomFood(food: CustomFood) {
    setSettings({ customFoods: [...(data.settings.customFoods ?? []), food] })
    setMetric(date, withFoodAdded(m, food, uid('food')))
  }

  /* The custom chips, newest first — the ones you added are the ones you eat. */
  const mine: Food[] = [...(data.settings.customFoods ?? [])].reverse().map((f) => ({ ...f, cuisine: 'yours' as const }))
  /**
   * YOUR USUAL · the foods you actually log, as the first row of the picker.
   *
   * "Eggs are my most favourite" needs no setting: `topFoods` already knows
   * what the fortnight was made of, and the row is built from the journal
   * rather than from an opinion about what is popular. Matched back to the
   * library (or to your own foods) by name, because the log stores the numbers
   * it was logged with and the chip has to carry a servable `Food`.
   */
  const usual: Food[] = topFoods(data, 14, today, 8)
    .map((t) => FOODS.concat(mine).find((f) => f.name.toLowerCase() === t.name.toLowerCase()))
    .filter((f): f is Food => !!f)

  /* The one sentence at the top, and the streak under the rings. */
  const step = nextStep(data, { date, targets, today })
  const streak = inTargetStreak(data, targets, today)

  return (
    <PageLayout
      tier={1180}
      zone1={
        /* ONE BLOCK, with the sentence above the rings.

           Two rings and a remainder line answer "how am I doing"; nothing on
           this page answered "what now", which `docs/PAGE-ROLLOUT.md` named as
           its first missing piece ("no sentence at all, not even a StatBar").
           `nextStep` is the priority list in `lib/nutritionReview.ts` and it is
           total, so this never renders as a hole.

           COLOUR MEANS URGENCY HERE AND NOTHING ELSE — in the left edge and the
           icon, with `fg-1` text. An accent as text on a wash of itself is the
           calibration trap in CLAUDE.md.

           A BUTTON when a row holds the detail, a paragraph when none does. */
        <div className="@container/orient rounded-card border border-line bg-ink-0 p-3">
          {(() => {
            const tone = { first: 'mauve', untracked: 'yellow', over: 'peach', protein: 'teal', left: 'green', done: 'green' }[step.id]
            const StepIcon = { first: Plus, untracked: NotePencil, over: Gauge, protein: Target, left: ForkKnife, done: Trophy }[step.id]
            return (
              <NextStepBlock
                text={step.text}
                tone={tone}
                icon={StepIcon}
                destination={step.group ? NUTRITION_PANELS.find((g) => g.id === step.group)?.label : undefined}
                onPick={step.group ? () => setPanel(step.group!) : undefined}
              />
            )
          })()}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Ring
              value={Math.min(kcal, targets.calories)}
              max={targets.calories}
              display={kcal}
              size={104}
              stroke={9}
              color={calorieState(kcal, targets.calories).color}
              label={`of ${targets.calories} kcal`}
            />
            <Ring
              value={Math.min(protein, targets.protein)}
              max={targets.protein}
              display={protein}
              size={78}
              stroke={7}
              color={floorTone(protein, targets.protein)}
              label={`of ${targets.protein} g protein`}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-body text-fg-1">{date === today ? 'Today' : prettyDay(date)}</p>
              <p className="text-label text-fg-2">{calorieState(kcal, targets.calories).line}</p>
              {streak > 1 && (
                <p className="text-label" style={{ color: onRaised('green') }}>
                  {streak} days in a row inside target
                </p>
              )}
            </div>
          </div>
        </div>
      }
      actTop
      onSplitChange={logCol.onSplitChange}
      actShut={logCol.shut}
      zone2={logCol.shut ? (
        /* THE ACT COLUMN, PUT AWAY. Measured before: **868px** at 1440 and
           **2258px on a phone**, of which the two food chip rows were most —
           forty-nine chips above a 889px record. `useActColumn` also carries
           the rule nobody guesses: stacked, it starts SHUT, so a phone opens on
           the day rather than a screen and a half of chips. */
        <ActStrip
          label="Log what you ate"
          summary={kcal > 0 ? `${kcal} kcal logged · ${m?.foodLog?.length ?? 0} items` : 'Nothing logged yet'}
          onOpen={logCol.open}
        />
      ) : (
        <section className="@container/act flex flex-col gap-3">
          {/* THE TITLE IS THE TOGGLE.
              Asked for as "if I click on Log what you ate, that should hide it
              and also show me that". The caret alone is a 28px target for a
              thing the whole header is about, and a heading that looks
              pressable and is not is worse than one that does nothing — so the
              heading IS the button, with `aria-expanded` saying which way it
              goes and the caret kept as the affordance that says so visually. */}
          {/* AND IT SAYS SO. Asked for as "for the side, a log what you ate,
              you can mention that — you can tap it to hide it". A heading that
              is secretly a button is a feature nobody finds: the hint is drawn
              beside the caret, quietly, rather than left in a `title` nobody
              hovers and a phone cannot show at all. */}
          <h2 className="text-heading font-medium text-fg-1">
            <button
              type="button"
              onClick={logCol.close}
              aria-expanded
              title="Hide the log — the review takes the width"
              className="group flex w-full items-center justify-between gap-2 text-left transition-colors hover:text-fg-2"
            >
              Log what you ate{' '}
              {/* The space is load-bearing. Without a text node between them
                  these two spans paint — and are ANNOUNCED as — "Log what you
                  ateTap to hide", one token. Same defect as the rail's "All24",
                  found by measuring `textContent` rather than by reading the
                  JSX, which is the only way it is ever visible. */}
              <span className="inline-flex shrink-0 items-center gap-1 text-label font-normal text-fg-2 group-hover:text-fg-1">
                Tap to hide
                <Icon as={CaretRight} size="sm" />
              </span>
            </button>
          </h2>

          <label className="block text-body text-fg-1">
            Date
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </label>

          {/* A native <select> of forty options was the page's whole "add a
              food" flow: open, scroll, choose, then reach for a separate
              disabled button. Four interactions, and the kcal — the only thing
              that distinguishes two options — sat inside the option text where
              nothing could compare them.

              `ChipPick` is the control this app already uses for a quick
              choice, and it carries the pill radius, the rest fill, the
              selected state and a real <fieldset>/<legend>. Picking a chip
              commits immediately, so the Add button and its greyed-out state
              and the paragraph explaining the greyed-out state all go away.

              The calorie band is drawn *inside* the chip label as a dot, not
              passed as ChipPick's `tone` — that prop is per-group, and a shared
              primitive does not get a new per-option API for one call site. */}
          {/* One picker: a search over all of them, then Your usual, Yours,
              and the two cuisines — each capped with an honest affordance. */}
          <FoodPicker usual={usual} mine={mine} onAdd={addFood} />

          {/* Renders nothing until food lookup is switched on in Settings. */}
          <FoodSearch onAdd={addFood} />

          {/* A food the library has never heard of, kept for next time. */}
          <CustomFoodForm onAdd={addCustomFood} />

          {/* THE TYPED HALF, FOLDED. Five number fields and a demo button are
              the fallback for a food the library does not have — used once in a
              while, 280px tall, and they sat between the chips and nothing.
              `DisclosureRow` rather than `<details>`, because it renders
              `aria-expanded`, which is what `npm run a11y` clicks before it
              scans; a raw `<details>` would keep these five controls out of the
              gate entirely (the COD-93 trap). It is also the page's only
              disclosure, which is that component's stated rule. */}
          <DisclosureRow label="Or set the day’s totals directly">
            {/*
              FOUR FIELDS SIDE BY SIDE, with the unit OUTSIDE the box.

              Reported as "this total formatted well, it's going out of the
              screen size and it's overflowing … keep everything side by side,
              all in four, and show the calories outside of it, taking only
              input — like you did in add a food of your own". Measured before:
              four `NumField`s, each a full-width 416px row holding a 144px
              input with its unit laid INSIDE the box on a `pr-12` — 272px of
              that row empty, four times, and the number typed into whatever
              was left of a padded field.

              `@min-[24rem]/act`, NOT `sm:`. The act column is **424px at a
              1440 viewport**, where `sm` has been true for 200px — the exact
              trap CLAUDE.md records from Strength's set row, and the one the
              custom-food form below had too (five columns at 77px each on a
              desktop, two at 158px on a phone, i.e. worse the bigger the
              screen). The container is declared on this `<section>`.
            */}
            <div className="grid grid-cols-2 gap-2 @min-[24rem]/act:grid-cols-4">
              {([
                { key: 'calories' as const, label: 'Calories', unit: 'kcal', step: '10', hint: '450' },
                ...MACROS.map((mac) => ({ key: mac.key, label: mac.label, unit: 'g', step: '1', hint: '30' })),
              ]).map((f) => (
                <label key={f.key} className="block min-w-0 text-micro text-fg-2">
                  {/* The unit lives HERE, in the label, where it is read once
                      and costs the input nothing. */}
                  {f.label} <span className="text-fg-3">{f.unit}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={f.step}
                    value={m?.[f.key] != null ? String(m[f.key]) : ''}
                    placeholder={f.hint}
                    aria-label={`${f.label} for this day, in ${f.unit === 'g' ? 'grams' : 'kcal'}`}
                    onChange={(e) => setMetric(date, { [f.key]: e.target.value ? Number(e.target.value) : undefined })}
                    className="num mt-0.5 w-full py-1 text-right"
                  />
                </label>
              ))}
            </div>
            <Button
              variant="ghost"
              className="text-label"
              onClick={() => setMetric(date, sumFoods(SAMPLE_DAY))}
            >Fill a typical day</Button>
          </DisclosureRow>
        </section>
      )}
      zone3={
        <NutritionReview
          panel={panel}
          onPanel={setPanel}
          date={date}
          onDate={setDate}
          targets={targets}
          onTargets={setTargets}
          dayLog={
            /* THE LOG LIVES IN *TODAY*, NOT IN THE ACT.
               Asked for as "show me log today, right side or inside today —
               why do I need to scroll down?… I want to show that in the today,
               right before the macro split, so that I can edit them based upon
               my requirements". Correct: it is a read-back of the day with
               corrections on it, which is review work, and in the act it sat
               below a picker, a search and a legend — the furthest thing from
               the chip you just tapped. In the Today row it is the first thing
               under the heading, and the act gets shorter for it.

               `DayLog` carries the inline editor, the servings control and the
               confirmation that names the food. */
            <DayLog
              date={date}
              today={today}
              foods={m?.foodLog ?? []}
              onEdit={editFood}
              onRemove={removeFood}
              onServings={setServings}
            />
          }
          macroBar={
            <section>
              <h3 className="mb-1 border-b border-line pb-1 text-label text-fg-2">Macro split against target</h3>
              <MacroBar metric={m} totalG={totalG} targets={targets} />
              {totalG === 0 && <EmptyFrame>Add a food to see the day's ratio.</EmptyFrame>}
            </section>
          }
        />
      }
    />
  )
}
