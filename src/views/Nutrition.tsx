import { useMemo, useState } from 'react'
import { useJournal } from '../store'
import { addDays, prettyDay, todayISO } from '../lib/date'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui'
import { Ring } from '../components/ui/ring'
import { ChipPick } from '../components/ui/quickpick'
import { EmptyFrame, NumField, PageLayout, SummaryStrip } from '../components/page'
import { FOODS, KCAL_BANDS, SAMPLE_DAY, kcalBand, sumFoods, type Food } from '../lib/foods'
import { cat } from '../lib/colors'
import { FoodSearch } from '../components/nutrition/FoodSearch'

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

/** A balanced default until targets are user-settable. */
const TARGET = { calories: 2000, protein: 120, carbs: 200, fat: 60 }

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

const MACROS = [
  { key: 'protein' as const, label: 'Protein', color: 'red' },
  { key: 'carbs' as const, label: 'Carbs', color: 'yellow' },
  { key: 'fat' as const, label: 'Fat', color: 'sky' },
]

export function Nutrition() {
  const { data, setMetric } = useJournal()
  const today = todayISO()
  const [date, setDate] = useState(today)

  const m = data.metrics.find((x) => x.date === date)
  const kcal = m?.calories ?? 0
  const protein = m?.protein ?? 0
  const totalG = MACROS.reduce((s, x) => s + (m?.[x.key] ?? 0), 0)

  function addFood(food: Food) {
    setMetric(date, {
      calories: (m?.calories ?? 0) + food.kcal,
      protein: (m?.protein ?? 0) + food.protein,
      carbs: (m?.carbs ?? 0) + food.carbs,
      fat: (m?.fat ?? 0) + food.fat,
    })
  }

  const recent = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, -(13 - i))
      return { date: d, kcal: data.metrics.find((x) => x.date === d)?.calories ?? 0 }
    }).filter((d) => d.kcal > 0).reverse()
  }, [data.metrics, today])

  const logged = recent.length
  const avg = logged ? Math.round(recent.reduce((a, d) => a + d.kcal, 0) / logged) : 0
  // Denominator for the Recent-days bars. `TARGET.calories` is the floor so a
  // fortnight of light days does not stretch itself to look like a full one.
  const recentScale = Math.max(TARGET.calories, ...recent.map((d) => d.kcal))

  return (
    <PageLayout
      tier={1180}
      zone1={
        // Two rings and a sentence, where this was three text facts. Calories
        // is the number the page exists to show, so it gets the larger ring and
        // the leading position; protein is the one target worth hitting rather
        // than staying under, so it sits beside it at a smaller size. The
        // remaining budget is spelled out in words underneath because "1,996 of
        // 2,000" answers "how am I doing" and "4 left" answers "can I eat this",
        // which is the question asked at the moment someone opens this page.
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Ring
            value={Math.min(kcal, TARGET.calories)}
            max={TARGET.calories}
            display={kcal}
            size={104}
            stroke={9}
            color={calorieState(kcal, TARGET.calories).color}
            label={`of ${TARGET.calories} kcal`}
          />
          <Ring
            value={Math.min(protein, TARGET.protein)}
            max={TARGET.protein}
            display={protein}
            size={78}
            stroke={7}
            color={floorTone(protein, TARGET.protein)}
            label={`of ${TARGET.protein} g protein`}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-body text-fg-1">
              {date === today ? 'Today' : prettyDay(date)}
            </p>
            <p className="text-label text-fg-2">{calorieState(kcal, TARGET.calories).line}</p>
          </div>
        </div>
      }
      zone2={
        <section className="flex flex-col gap-3">
          <h2 className="text-heading font-medium text-fg-1">Log what you ate</h2>

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
          <FoodPicker cuisine="indian" onAdd={addFood} />
          <FoodPicker cuisine="american" onAdd={addFood} />

          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-label text-fg-2">
            {(Object.keys(KCAL_BANDS) as (keyof typeof KCAL_BANDS)[]).map((b) => (
              <li key={b} className="inline-flex items-center gap-1.5">
                <i className="inline-block h-2 w-2 rounded-pill" style={{ background: cat(KCAL_BANDS[b].color) }} />
                {KCAL_BANDS[b].label} <span className="text-fg-3">· {KCAL_BANDS[b].hint}</span>
              </li>
            ))}
          </ul>

          {/* Renders nothing until food lookup is switched on in Settings. */}
          <FoodSearch onAdd={addFood} />

          <p className="mt-1 border-t border-line pt-3 text-label text-fg-2">Or set the day’s totals directly</p>

          <NumField
            label="Calories" suffix="kcal" step="10" placeholder="450"
            value={m?.calories != null ? String(m.calories) : ''}
            onChange={(v) => setMetric(date, { calories: v ? Number(v) : undefined })}
          />
          {MACROS.map((mac) => (
            <NumField
              key={mac.key}
              label={mac.label} suffix="g" step="1" placeholder="30"
              value={m?.[mac.key] != null ? String(m[mac.key]) : ''}
              onChange={(v) => setMetric(date, { [mac.key]: v ? Number(v) : undefined })}
            />
          ))}

          <Button
            variant="ghost"
            className="text-label"
            onClick={() => setMetric(date, sumFoods(SAMPLE_DAY))}
          >Fill a typical day</Button>
        </section>
      }
      zone3={
        <>
          {/* Calories and protein moved up into zone 1 as rings, and leaving
              them here too printed each number twice on one screen, 90px
              apart — the review zone restating the orientation zone instead of
              reviewing anything. What this strip can say that the rings cannot
              is the *fortnight*: how many days are on the record and what they
              average, which is the question the Recent-days list below answers
              in detail. */}
          <SummaryStrip items={[
            { label: 'Days logged', value: logged, suffix: ' of 14', empty: logged === 0 },
            { label: 'Daily average', value: avg, suffix: ' kcal', empty: logged === 0 },
            { label: 'Over target', value: recent.filter((d) => d.kcal > TARGET.calories).length, suffix: ` of ${logged}`, empty: logged === 0 },
          ]} />

          <section>
            {/* Ruled, like "Recent days" directly below it. These two are the
                same kind of thing — a zone-3 section with a body — and were a
                bare heading and a ruled one, eleven lines apart. */}
            <h2 className="mb-1 border-b border-line pb-1 text-label text-fg-2">Macro split against target</h2>
            <MacroBar metric={m} totalG={totalG} />
            {totalG === 0 && <EmptyFrame>Add a food to see the day's ratio.</EmptyFrame>}
          </section>

          <section>
            <h2 className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line pb-1 text-label text-fg-2">
              <span>Recent days {logged > 0 && <span className="text-fg-3">· avg {avg} kcal</span>}</span>
              {/* The bars encode over/under in colour alone — name the code. */}
              {logged > 0 && (
                <span className="flex items-center gap-3 text-micro" aria-hidden="true">
                  <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-[2px]" style={{ background: cat('green'), opacity: 0.5 }} /> under target</span>
                  <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-[2px]" style={{ background: cat('peach'), opacity: 0.5 }} /> over</span>
                </span>
              )}
            </h2>
            {logged === 0 ? (
              <EmptyFrame>Nothing logged in the last two weeks.</EmptyFrame>
            ) : (
              // Fourteen rows of a date and a number, with nothing to read them
              // against, is a table pretending to be a chart. Each row now
              // carries a bar, using both channels rather than one:
              //
              //   length — the day's calories against the busiest day *or* the
              //            target, whichever is larger
              //   colour — over target, or under it
              //
              // Scaling purely to the target was the first attempt and wasted
              // the length: most days here run over 2000, every one of them
              // clamped to full width, and fourteen identical bars are the same
              // problem as fourteen identical rows. Scaling to the range keeps
              // the days distinguishable from each other, and the colour still
              // says which side of the target each one fell.
              <ul>
                {recent.map((d) => {
                  const over = d.kcal > TARGET.calories
                  return (
                    <li key={d.date} className="relative border-b border-line last:border-b-0">
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 rounded-r-control"
                        style={{
                          width: `${(d.kcal / recentScale) * 100}%`,
                          background: cat(over ? 'peach' : 'green'),
                          opacity: 0.14,
                        }}
                      />
                      <div className="relative flex items-center justify-between py-2">
                        <button onClick={() => setDate(d.date)} className="text-left text-body text-fg-1 hover:underline">
                          {prettyDay(d.date)}
                        </button>
                        <span className="num text-label text-fg-2">{d.kcal} kcal<span className="sr-only">{over ? ', over target' : ', under target'}</span></span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      }
    />
  )
}

const CUISINE_LABEL = { indian: 'Indian', american: 'American' } as const

/**
 * One cuisine's foods as a row of action chips, each carrying its calorie
 * weight as a dot and its number as text.
 *
 * Two channels, deliberately: the dot is what makes "which of these is the
 * expensive one" answerable at a glance, and the kcal is what makes it
 * answerable exactly. Colour alone would fail anyone who cannot separate the
 * three hues — and the band names are spelled out in the legend beneath the
 * rows, so the dot is never the only place a band is stated.
 *
 * `tone` differs per cuisine only to separate the two rows from each other; it
 * carries no meaning about the food. The calorie meaning is the dot.
 */
function FoodPicker({ cuisine, onAdd }: { cuisine: Food['cuisine']; onAdd: (f: Food) => void }) {
  const foods = FOODS.filter((f) => f.cuisine === cuisine)
  return (
    <ChipPick
      label={CUISINE_LABEL[cuisine]}
      action
      value={null}
      tone={cuisine === 'indian' ? 'peach' : 'teal'}
      onChange={(name) => {
        const f = foods.find((x) => x.name === name)
        if (f) onAdd(f)
      }}
      options={foods.map((f) => ({
        value: f.name,
        // The serving is in the tooltip rather than the chip: forty chips each
        // carrying "1 cup" wraps to a wall, and the serving is what you check
        // once, not what you scan by.
        hint: `${f.serving} · ${f.kcal} kcal · ${f.protein} g protein`,
        label: (
          <span className="inline-flex items-center gap-1.5">
            <i
              aria-hidden
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-pill"
              style={{ background: cat(KCAL_BANDS[kcalBand(f.kcal)].color) }}
            />
            {f.name}
            <span className="num text-fg-3">{f.kcal}</span>
            <span className="sr-only">
              kcal, {KCAL_BANDS[kcalBand(f.kcal)].label.toLowerCase()}, {f.serving}. Adds to today.
            </span>
          </span>
        ),
      }))}
    />
  )
}

/**
 * Two stacked bars: the day's ratio, and the target ratio beneath it. Reading
 * one against the other is the comparison; a single bar would only say what you
 * ate, which the numbers already do.
 */
function MacroBar({ metric, totalG }: { metric?: { protein?: number; carbs?: number; fat?: number }; totalG: number }) {
  const targetTotal = TARGET.protein + TARGET.carbs + TARGET.fat
  /**
   * ONE denominator for both bars, or the comparison the card is named for
   * cannot happen.
   *
   * Each bar used to be normalised against its own total, so both were always
   * exactly full width. Eat a third of your target of everything and the two
   * bars render *identically* — the card said "against target" and drew a
   * picture in which hitting the target and missing it by 200g look the same.
   * Only the split was comparable, and the split is the thing that survives a
   * bad day unchanged.
   *
   * Scaling both to `max(today, target)` makes length mean amount again: short
   * bar means under, equal-length means on it, and the longer bar is whichever
   * is bigger. The segment proportions still carry the split, so nothing is
   * lost — the axis was simply missing.
   */
  const scale = Math.max(totalG, targetTotal) || 1
  const pct = (v: number) => (v / scale) * 100
  return (
    <div className="space-y-2">
      <Bar
        label="Today"
        segments={MACROS.map((mac) => ({
          key: mac.key,
          label: mac.label,
          grams: metric?.[mac.key] ?? 0,
          width: pct(metric?.[mac.key] ?? 0),
          color: mac.color,
        }))}
        empty={totalG === 0}
      />
      <Bar
        label="Target"
        segments={MACROS.map((mac) => ({
          key: mac.key,
          label: mac.label,
          grams: TARGET[mac.key],
          width: pct(TARGET[mac.key]),
          color: mac.color,
        }))}
        muted
      />
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-label text-fg-2">
        {MACROS.map((mac) => (
          <li key={mac.key}>
            <span className="mr-1 inline-block h-2 w-2 rounded-control align-middle" style={{ background: cat(mac.color) }} />
            {mac.label} {metric?.[mac.key] ?? 0} / {TARGET[mac.key]} g
          </li>
        ))}
      </ul>
    </div>
  )
}

function Bar({ label, segments, empty = false, muted = false }: {
  label: string
  segments: { key: string; label: string; grams: number; width: number; color: string }[]
  empty?: boolean
  muted?: boolean
}) {
  return (
    <div>
      <p className="mb-0.5 text-micro text-fg-3">{label}</p>
      {/* The frame draws at zero data — an empty track still says "this is
          where the ratio goes", where a hidden bar says nothing at all. */}
      {/* Grams, not the rendered percentage. Now that both bars share one
          denominator, a segment's width is its share of whichever total is
          larger — a number that means nothing said out loud. Grams are what the
          legend below states and what the reader actually wants. */}
      <div className="flex h-4 overflow-hidden rounded-pill bg-ink-2" role="img" aria-label={
        empty ? `${label}: nothing logged yet`
          : `${label}: ${segments.map((s) => `${s.label} ${Math.round(s.grams)} g`).join(', ')}`
      }>
        {!empty && segments.map((s) => (
          <div key={s.key} style={{ width: `${s.width}%`, background: cat(s.color), opacity: muted ? 0.35 : 1 }} />
        ))}
      </div>
    </div>
  )
}
