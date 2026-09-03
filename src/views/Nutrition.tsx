import { useMemo, useState } from 'react'
import { useJournal } from '../store'
import { addDays, prettyDay, todayISO } from '../lib/date'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui'
import { EmptyFrame, NumField, PageLayout, StatBar, SummaryStrip } from '../components/page'
import { FOODS, SAMPLE_DAY, sumFoods, type Food } from '../lib/foods'
import { cat } from '../lib/colors'

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

const MACROS = [
  { key: 'protein' as const, label: 'Protein', color: 'red' },
  { key: 'carbs' as const, label: 'Carbs', color: 'yellow' },
  { key: 'fat' as const, label: 'Fat', color: 'sky' },
]

export function Nutrition() {
  const { data, setMetric } = useJournal()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [pick, setPick] = useState('')

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
        <StatBar facts={[
          { label: 'Logging', value: date === today ? 'Today' : prettyDay(date), prose: true },
          { label: 'Calories', value: kcal > 0 ? `${kcal} / ${TARGET.calories}` : `— / ${TARGET.calories}` },
          { label: 'Protein', value: protein > 0 ? `${protein} / ${TARGET.protein} g` : `— / ${TARGET.protein} g` },
        ]} />
      }
      zone2={
        <section className="flex flex-col gap-3">
          <h2 className="text-heading font-medium text-fg-1">Log what you ate</h2>

          <label className="block text-body text-fg-1">
            Date
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </label>

          <label className="block text-body text-fg-1">
            Food
            <select
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              className="mt-1 w-full rounded-none border border-input bg-background px-3 py-2 text-body text-fg-1"
            >
              <option value="">Choose a food…</option>
              <optgroup label="Indian">
                {FOODS.filter((f) => f.cuisine === 'indian').map((f) => (
                  <option key={f.name} value={f.name}>{f.name} · {f.serving} ({f.kcal} kcal)</option>
                ))}
              </optgroup>
              <optgroup label="American">
                {FOODS.filter((f) => f.cuisine === 'american').map((f) => (
                  <option key={f.name} value={f.name}>{f.name} · {f.serving} ({f.kcal} kcal)</option>
                ))}
              </optgroup>
            </select>
          </label>

          {/* Two jobs under one heading, now labelled and ordered as two.
              The select and this button ADD a food's macros to the day. The four
              fields below SET the day's running totals — they read the stored
              metric, so they show 1996 kcal rather than an empty "what did you
              eat" form, and typing in one replaces the total rather than adding
              to it. Same heading, opposite mental models, and the button sat
              *below* the fields it has nothing to do with, greyed out, with
              nothing saying why. It belongs to the select, so it sits with it. */}
          <Button
            variant="secondary"
            className="press-3d w-full"
            disabled={!pick}
            onClick={() => {
              const f = FOODS.find((x) => x.name === pick)
              if (f) { addFood(f); setPick('') }
            }}
          >Add food</Button>
          {!pick && <p className="text-label text-fg-2">Pick a food above and its macros are added to today.</p>}

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
          <SummaryStrip items={[
            { label: 'Calories', value: kcal, empty: kcal === 0 },
            { label: 'Protein', value: protein, suffix: ' g', empty: protein === 0 },
            { label: 'Days logged', value: logged, empty: logged === 0 },
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
            <span className="mr-1 inline-block h-2 w-2 rounded-none align-middle" style={{ background: cat(mac.color) }} />
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
      <div className="flex h-4 overflow-hidden rounded-none bg-ink-2" role="img" aria-label={
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
