import { useState } from 'react'
import { ChipPick } from '../ui/quickpick'
import { SearchField } from '../page'
import { ShowMore } from '../ShowMore'
import { useCappedList } from '../../lib/useCappedList'
import { cat } from '../../lib/colors'
import { FOODS, KCAL_BANDS, foodMatches, kcalBand, type Food } from '../../lib/foods'

/**
 * PICKING A FOOD · search across everything, or scan the group you know.
 *
 * WHAT THIS FILE OWNS: the chip's shape, the search, and how a calorie weight
 * is drawn.
 * WHAT IT DOES NOT OWN: what a food is (`lib/foods.ts`), or what happens when
 * one is tapped.
 *
 * ── Four reports, one control ─────────────────────────────────────────────
 *
 * | Asked | Before |
 * |---|---|
 * | "show me the calories separately, sideways and the height" | the kcal was a grey number inside the label, and the band was a 6px dot |
 * | "show the colour of that icon in a better way … vertically on the side" | one dot, so colour was the only channel and it carried three states |
 * | "I know you shrank them, but what if I want to see them?" | ten chips and a Show all, with no way to ask for a specific food |
 * | "eggs are my most favourite" | seven egg foods spread across two cuisine rows |
 *
 * **The band is drawn as three vertical bars, filled one, two or three.** That
 * is the "height" the report asks for, and it means the weight survives
 * someone who cannot separate the hues: light is one short bar, heavy is three
 * tall ones, in the band's colour. A single dot could only ever be colour.
 *
 * **Search is the answer to the cap, not a bigger cap.** The library is 103
 * foods; two uncapped rows measured **2,258px of act column on a phone**, and a
 * search box is how you reach any of them without scrolling past the rest. It
 * searches the NAME and the SERVING, so "cup" finds everything measured in cups.
 *
 * **The cuisines are a filter, not two rows.** Asked for as "if I click on
 * American, show all the American; if I click on Indian, show me all Indian;
 * if not, I'll search for it" — so they are two buttons side by side carrying
 * their counts, and opening one shows that library in full. Nothing is capped
 * inside a group you asked for; the cap is for rows you did not.
 *
 * **"Your usual" is the first row when there is one** — built from what you
 * have actually logged, not from what the library thinks is popular, which is
 * the only honest definition of a favourite and the reason "eggs are my
 * favourite" needs no setting.
 */
export function FoodPicker({ usual, mine, onAdd }: {
  /** Most-logged foods, from the journal — the row that says "your usual". */
  usual?: Food[]
  /** Foods the person added themselves. */
  mine?: Food[]
  onAdd: (f: Food) => void
}) {
  const [q, setQ] = useState('')
  /**
   * WHICH GROUP IS OPEN · null is "none of them, just your usual".
   *
   * Asked for as *"in place of Indian and American, keep them parallelly in two
   * columns … if I click on American, show all the American; if I click on
   * Indian, show me all Indian; if not, I'll search for it"*. So the cuisines
   * are a FILTER rather than two stacked rows: two buttons side by side, and
   * picking one shows that whole library uncapped — which is also what makes
   * the "Show all" cap unnecessary inside a group.
   *
   * Not sticky: it is a narrowing you do while logging lunch, not a place you
   * return to — the same rule the review's sub-section chips follow.
   */
  const [group, setGroup] = useState<'indian' | 'american' | null>(null)
  const searching = q.trim().length > 0
  const hits = FOODS.concat(mine ?? []).filter((f) => foodMatches(f, q))
  const indian = FOODS.filter((f) => f.cuisine === 'indian')
  const american = FOODS.filter((f) => f.cuisine === 'american')

  return (
    <div className="space-y-3">
      {/* THE SEARCH, ABOVE THE ROWS. A capped row plus a search is the pair:
          the cap keeps the page short, the search makes the cap harmless.
          `SearchField` rather than an `Input` with furniture laid over it —
          see its docstring for the hover that was reported, and why the
          wrapper has to be the control. */}
      <SearchField
        value={q}
        onChange={setQ}
        label="Search every food"
        placeholder={`Search ${FOODS.length + (mine?.length ?? 0)} foods — eggs, rice, sourdough…`}
      />

      {searching ? (
        <ChipRow
          label={`${hits.length} ${hits.length === 1 ? 'match' : 'matches'}`}
          tone="brand"
          foods={hits}
          cap={16}
          onAdd={onAdd}
          empty={`Nothing matches “${q.trim()}”. Add it as a food of your own below.`}
        />
      ) : (
        <>
          {/* YOUR USUAL ON TOP, because it is the row that ends most logging
              without opening anything. */}
          {usual && usual.length > 0 && <ChipRow label="Your usual" tone="green" foods={usual} cap={8} onAdd={onAdd} />}
          {mine && mine.length > 0 && <ChipRow label="Yours" tone="brand" foods={mine} cap={8} onAdd={onAdd} />}

          {/* The two libraries, side by side, as a filter rather than as two
              long rows: picking one shows ALL of it, picking it again closes
              it. Two columns at any width — they are two buttons, and the act
              column is 324px at its narrowest. */}
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Food libraries">
            {([['indian', 'Indian', indian.length], ['american', 'American', american.length]] as const).map(([id, label, n]) => (
              <button
                key={id}
                type="button"
                onClick={() => setGroup(group === id ? null : id)}
                aria-expanded={group === id}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-control border px-3 text-label transition-colors ${
                  group === id
                    ? 'border-line-strong bg-ink-3 text-fg-1'
                    : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'
                }`}
              >
                {label}
                <span className="num text-fg-2">{n}</span>
              </button>
            ))}
          </div>

          {/* Uncapped on purpose: you asked for this group, so this is the
              group. The cap exists to keep a row you did NOT ask for short. */}
          {group === 'indian' && <ChipRow label="Indian" tone="peach" foods={indian} cap={indian.length} onAdd={onAdd} />}
          {group === 'american' && <ChipRow label="American" tone="teal" foods={american} cap={american.length} onAdd={onAdd} />}
        </>
      )}

      {/* The scale, once, in the same vertical shape the chips use. */}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-fg-2">
        {(Object.keys(KCAL_BANDS) as (keyof typeof KCAL_BANDS)[]).map((b) => (
          <li key={b} className="inline-flex items-center gap-1.5">
            <BandBars band={b} />
            {KCAL_BANDS[b].label} <span className="text-fg-3">{KCAL_BANDS[b].hint}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The calorie weight as three vertical bars.
 *
 * Height AND colour, so the band is never carried by hue alone — the chip's
 * own `sr-only` text names it as well, which is the third channel and the one
 * a screen reader uses.
 */
function BandBars({ band }: { band: keyof typeof KCAL_BANDS }) {
  const filled = band === 'light' ? 1 : band === 'moderate' ? 2 : 3
  const color = cat(KCAL_BANDS[band].color)
  return (
    <span aria-hidden className="inline-flex h-3 shrink-0 items-end gap-px">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-[3px] rounded-[1px]"
          style={{
            height: `${4 + i * 4}px`,
            background: i < filled ? color : cat('surface2'),
          }}
        />
      ))}
    </span>
  )
}

/** One labelled row of food chips, capped with an honest affordance. */
function ChipRow({ label, tone, foods, cap, onAdd, empty }: {
  label: string
  tone: 'red' | 'green' | 'peach' | 'teal' | 'yellow' | 'brand'
  foods: Food[]
  cap: number
  onAdd: (f: Food) => void
  empty?: string
}) {
  const list = useCappedList(foods, cap)
  if (foods.length === 0) return empty ? <p className="text-label text-fg-2">{empty}</p> : null
  return (
    <ChipPick
      label={label}
      action
      value={null}
      tone={tone}
      after={<ShowMore list={list} />}
      onChange={(name) => {
        const f = foods.find((x) => x.name === name)
        if (f) onAdd(f)
      }}
      options={list.shown.map((f) => ({
        value: f.name,
        hint: `${f.serving} · ${f.kcal} kcal · ${f.protein} g protein`,
        label: (
          <span className="inline-flex items-center gap-1.5">
            <BandBars band={kcalBand(f.kcal)} />
            {f.name}
            {/* The calories, set apart from the name rather than trailing it:
                its own column, in the mono face, so a row of chips can be
                scanned down the number instead of read word by word. */}
            <span className="num border-l border-line/60 pl-1.5 text-fg-2">{f.kcal}</span>
            <span className="sr-only">
              kcal, {KCAL_BANDS[kcalBand(f.kcal)].label.toLowerCase()}, {f.serving}. Adds to this day.
            </span>
          </span>
        ),
      }))}
    />
  )
}
