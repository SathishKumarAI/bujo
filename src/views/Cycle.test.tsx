import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Cycle } from './Cycle'
import { STEP_ICON, STEP_TONE } from '../components/cycle/stepStyle'
import { CYCLE_CARDS, CYCLE_GROUPS, DEFAULT_GROUP, GROUP_LABEL, panelsIn } from '../lib/cycleCards'
import { FLAGS, FLAG_MEANS } from '../components/cycle'
import { CHIP_FIELDS, FIELD_SECTIONS, LH_GLYPH, MUCUS_GLYPH, SCALE_FIELDS, TAG_FIELDS } from '../components/cycle/dayFields'
import { CYCLE_DISCLAIMER } from '../lib/cycleGuide'
import { CYCLE_MANUAL } from '../lib/cycleManual'
import { CAT } from '../lib/colors'
import { generateDemoData } from '../lib/demo'

/**
 * The registry and the page must hold the same cards — Insights' contract test
 * (`views/Insights.test.tsx`), applied to the rail that replaced this page's
 * four closed guide folds.
 *
 * It exists because the alternative has already happened twice in this repo: on
 * Insights five habit grids rendered with no card id, so nothing could filter,
 * find or count them; and `views/Pullups.tsx` lost eleven workout formats to a
 * pass that retyped a data module instead of moving it, with `tsc`, eslint,
 * vitest and the build all green. A rail makes that failure *quieter*, not
 * louder — a card that no group reaches is simply never on screen — so the
 * assertion has to be the union over every rail row, in both directions.
 */
/* Seeded through storage, not through an effect: `replaceAll` is a fresh
   identity each render, so `useEffect(…, [replaceAll])` re-seeds forever. */
function mount() {
  localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
  return render(
    <NavProvider navigate={() => {}}>
      <CursorProvider>
        <ConfirmProvider>
          <JournalProvider>
            <Cycle />
          </JournalProvider>
        </ConfirmProvider>
      </CursorProvider>
    </NavProvider>,
  )
}

afterEach(() => localStorage.clear())

/** The rail names itself "Guide — 4 panels"; match on the label half. */
const railRow = (label: string) =>
  screen.getByRole('button', { name: (name) => name.startsWith(`${label} `) })

/**
 * OPEN THE ACT COLUMN, because jsdom reports a 0px shell.
 *
 * `PageLayout` decides the split by measuring `.page-shell`, and `useActColumn`
 * starts SHUT when stacked — so every component test on this page meets the
 * `ActStrip` where a browser at 1440 meets the day editor. That is the measured
 * default, not a bug, and the right fix is for the test to press the strip
 * rather than to shim a width into jsdom.
 *
 * The `aria-expanded="false"` assertion on the way in is the only coverage that
 * default has outside a browser probe.
 */
/**
 * Reach the mark key inside the manual's deck.
 *
 * `Manual` is a `CardDeck` — one section on screen at a time — so the key is
 * not in the DOM until its card is. Walk the deck rather than asserting on
 * whatever happened to open, which would be the single-open-accordion
 * blindness CLAUDE.md records for the a11y gate, in a unit test.
 */
async function openMarkSection(user: ReturnType<typeof userEvent.setup>, container: HTMLElement) {
  for (let i = 0; i < CYCLE_MANUAL.length; i++) {
    if ((container.textContent ?? '').includes(FLAG_MEANS.period)) return
    const next = screen.queryByRole('button', { name: /next/i })
    if (!next) break
    await user.click(next)
  }
  expect(container.textContent, 'the mark key is not reachable in the manual').toContain(FLAG_MEANS.period)
}

async function openAct(user: ReturnType<typeof userEvent.setup>) {
  const strip = screen.getByRole('button', { name: /^Log a day/ })
  expect(strip).toHaveAttribute('aria-expanded', 'false')
  await user.click(strip)
}

describe('Cycle · the registry is the review zone', () => {
  it('reaches every registered card through the rail, and no unregistered one', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const seen = new Set<string>()
    for (const g of CYCLE_GROUPS) {
      await user.click(railRow(GROUP_LABEL[g]))
      for (const el of container.querySelectorAll('[data-card]')) {
        seen.add(el.getAttribute('data-card')!)
      }
    }
    const registered = CYCLE_CARDS.map((c) => c.id).sort()
    expect([...seen].sort().filter((id) => !registered.includes(id))).toEqual([])
    expect(registered.filter((id) => !seen.has(id))).toEqual([])
  })

  it('shows one group at a time, and its heading and count match the rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of CYCLE_GROUPS) {
      await user.click(railRow(GROUP_LABEL[g]))
      const groups = [...container.querySelectorAll('[data-domain]')]
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('data-domain')).toBe(g)
      // A heading over an empty grid is the failure mode of grouping.
      const cards = groups[0].querySelectorAll('[data-card]')
      expect(cards.length).toBeGreaterThan(0)
      // The row renders exactly the cards the registry files under it.
      expect(cards).toHaveLength(CYCLE_CARDS.filter((c) => c.group === g).length)
      // And the rail's count is a promise about what the READER meets, which
      // is not the same number: `manual` is one registered card holding a
      // nine-card deck, and a row saying "1" over a deck saying "1 of 9" is
      // two true figures reading as a contradiction. `panelsIn` is the one
      // place that difference is written down.
      const panels = CYCLE_CARDS.filter((c) => c.group === g).reduce((n, c) => n + panelsIn(c), 0)
      expect(railRow(GROUP_LABEL[g]).getAttribute('aria-label'))
        .toBe(`${GROUP_LABEL[g]} ${panels} ${panels === 1 ? 'panel' : 'panels'}`)
    }
  })

  it('opens on a real group, not on the whole page', () => {
    // Landing on everything is landing on the 10.6-screen phone page the rail
    // replaces, which is why there is no "All" row to default to either.
    const { container } = mount()
    const groups = container.querySelectorAll('[data-domain]')
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-domain')).toBe(DEFAULT_GROUP)
  })

  /**
   * The legend is five hues, five words and five sentences, and all three come
   * from `components/cycle/flags.ts`. The failure this catches is the one
   * `views/Pullups.tsx` already shipped: a pass that *retypes* a data module
   * instead of reading it, with `tsc -b`, eslint and the build all green
   * because an export nobody imports is not an error. Assert the rendered
   * definition is character-identical to `FLAG_MEANS` rather than that it
   * merely contains the word — a paraphrase would pass a substring check and
   * this component's whole contract is that the words are not its own.
   */
  it('decodes every flag, with the meaning exactly as `flags.ts` writes it', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.manual))
    await openMarkSection(user, container)
    const text = container.textContent ?? ''
    // The MEANING, character-identical to `flags.ts` — not a paraphrase. A
    // substring check on the word would pass for prose that drifted, and the
    // whole contract of this key is that the words are not its own.
    for (const f of FLAGS) {
      expect(text, `no meaning for "${f}"`).toContain(FLAG_MEANS[f])
    }
  })

  /**
   * THE KEY LEFT THE LOGGING CARD, and this is the test that says so.
   *
   * Five flag definitions and a seven-glyph mark key sat under a fold in the
   * act column, on every visit, in a 416px panel already capped at 868px —
   * a manual page wearing a form's clothes. It is a manual section now,
   * generated from `FLAG_MEANS`, `MUCUS_GLYPH` and `LH_GLYPH` so it cannot
   * drift from the thing it decodes.
   */
  it('is a manual section now, and not in the act column', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await openAct(user)
    expect(
      screen.queryByRole('button', { name: /flag colours/i }),
      'the legend fold is back in the act column',
    ).toBeNull()
    await user.click(railRow(GROUP_LABEL.manual))
    await openMarkSection(user, container)
    const text = container.textContent ?? ''
    // Both halves, by their CONTENT rather than by a heading — a test keyed
    // to copy is a trap this repo has an entry for, and this very assertion
    // broke on a rename once already.
    for (const stage of Object.keys(MUCUS_GLYPH).filter((k) => k !== 'dry')) {
      expect(text, `no key row for mucus "${stage}"`).toContain(stage.replace('-', ' '))
    }
    for (const g of [MUCUS_GLYPH['egg-white'], LH_GLYPH.peak]) {
      expect(text, `the glyph ${g} is not drawn`).toContain(g)
    }
  })

  /**
   * AND EVERY INPUT POINTS AT IT, which is the half that makes moving the key
   * out of the act column honest rather than a deletion.
   *
   * Asked for directly: *"give an information icon on top of the inputs in
   * the log, and if I click on it show them the guide or manual."* The wiring
   * was all present and dead — `dayFields.ts` carries a `help` key on five
   * fields, `lib/cycleHelp.ts` has an entry with a `more:` target for every
   * one, and **nothing rendered an `InfoTip` outside zone 1's four facts**.
   */
  it('puts an ⓘ on the inputs, and the flag row’s points at the key', async () => {
    const user = userEvent.setup()
    mount()
    await openAct(user)
    const tip = screen.getByRole('button', { name: /what this means: flags/i })
    await user.click(tip)
    const more = await screen.findByRole('button', { name: /learn more/i })
    await user.click(more)
    // It lands on the section the legend became, not merely on the manual.
    expect(await screen.findByText(/Flag colours & day marks/i)).toBeInTheDocument()
  })

  /**
   * THE ⓘ'S "LEARN MORE" HAS A CALL SITE, which it did not for the life of the
   * component.
   *
   * `InfoTip` takes `onMore` and renders the link only when one is passed, and
   * no caller ever passed one — so all 18 `more:` targets in `lib/cycleHelp.ts`
   * pointed at sections no link reached. `cycleHelp.test.ts` was green on it
   * the whole time, and correctly: it asserts every target RESOLVES, which
   * says nothing about whether anything links. That is why this test is here
   * and not there — it is the journey, not the data.
   */
  it('takes a tip’s "Learn more" to the manual', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(screen.getByRole('button', { name: /What this means: cycle day/i }))
    await user.click(await screen.findByRole('button', { name: /learn more/i }))
    const groups = [...container.querySelectorAll('[data-domain]')]
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-domain')).toBe('manual')
    expect(container.querySelector('[data-card="manual"]')).not.toBeNull()
  })

  it('keeps the medical disclaimer visible in every group', async () => {
    const user = userEvent.setup()
    mount()
    for (const g of CYCLE_GROUPS) {
      await user.click(railRow(GROUP_LABEL[g]))
      // It sits outside the rail on purpose: a disclaimer behind a row you have
      // to select is one most readers never meet.
      expect(screen.getByText(CYCLE_DISCLAIMER)).toBeInTheDocument()
    }
  })
})

/**
 * THE SIX NEXT-STEP BRANCHES NO GATE DRAWS.
 *
 * The demo journal lands on `steady`, so `npm run a11y` and `a11y:panels`
 * render that one tone at five themes and two viewports and the other six at
 * none — the "a branch the seed never takes cannot fail" shape, which this
 * repo has already paid for once with latte's yellow at 2.02:1 behind a count
 * the seed never produced.
 *
 * Seeding a journal per branch is the complete answer and is not this change.
 * What IS checkable without a browser is the part that would be silent: a
 * tone name that is not a palette key. `cat()` falls back to **mauve** for any
 * name it does not know, so a typo paints a plausible colour instead of
 * failing, and mauve on this page means "you ovulated".
 */
describe('Cycle · every next-step rule has a tone that exists', () => {
  it('names a real palette colour for all seven', () => {
    // `Record<CycleStep['id'], …>` already makes `tsc` prove each rule has an
    // entry; this is the half the type cannot see — that the string resolves.
    for (const [id, tone] of Object.entries(STEP_TONE) as [string, string][]) {
      expect(CAT[tone], `${id} → "${tone}" is not a palette key, so cat() would paint mauve`).toBeTruthy()
    }
  })

  it('has a glyph for all seven, and seven distinct rules', () => {
    expect(Object.keys(STEP_ICON).sort()).toEqual(Object.keys(STEP_TONE).sort())
    for (const [id, glyph] of Object.entries(STEP_ICON)) {
      expect(glyph, `${id} has no icon`).toBeTruthy()
    }
  })
})

/**
 * THE LOG ROW · the record, not a reading taken from it.
 *
 * `CyclePoint` carries fourteen fields and the month list drew four, so ten
 * of them could be filled in and never seen again. The averaging cards read
 * them — mood by phase, drive by phase, the symptom grid — but an average is
 * not the record.
 */
describe('Cycle · your log shows what the averages are made of', () => {
  it('draws a row per logged day, each one a way back into the editor', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.log))
    const card = container.querySelector('[data-card="log"]')!
    expect(card, 'the log row renders its card').toBeTruthy()
    const rows = card.querySelectorAll('button[aria-pressed]')
    expect(rows.length).toBeGreaterThan(0)
    // The row's own text IS its accessible name — no `aria-label`, because a
    // tidier one names less than the row paints and axe calls that a
    // `label-content-name-mismatch`. So the assertion is that the name is the
    // content, and that the content carries the date.
    for (const r of rows) {
      expect(r.getAttribute('aria-label'), 'a label here would under-name the row').toBeNull()
      expect(r.textContent).toMatch(/\w{3}, \w{3} \d+/)
    }
  })

  it('shows the fields the month list never drew', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.log))
    const text = container.querySelector('[data-card="log"]')!.textContent ?? ''
    // The demo seeds mood, energy and drive on its cycle days; none of the
    // three has ever been readable back out of a past day.
    expect(text).toMatch(/mood \d\/5/)
    expect(text).toMatch(/energy \d\/5/)
  })
})

/**
 * THE MARK KEY IS BUILT FROM THE MAPS, wherever it lives.
 *
 * It moved out of the act column into the manual — see the tests above for
 * the move and the ⓘ that reaches it. What stays asserted here is the half
 * that has nothing to do with placement: every mark `CycleMonth` can DRAW is
 * decoded somewhere, in both directions, because a hand-written key is a copy
 * that drifts and a key that has drifted is worse than none.
 */
describe('Cycle · every mark the calendar can draw is decoded', () => {
  it('names each mucus stage and LH result, built from the maps', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.manual))
    await openMarkSection(user, container)
    const text = container.textContent ?? ''

    // `dry` renders a `·`, which at 10px is punctuation, and `not-taken`
    // renders nothing — neither is a mark anyone has to decode.
    for (const stage of Object.keys(MUCUS_GLYPH).filter((k) => k !== 'dry')) {
      expect(text, `no key row for mucus "${stage}"`).toContain(stage.replace('-', ' '))
    }
    for (const result of Object.keys(LH_GLYPH).filter((k) => k !== 'not-taken')) {
      expect(text, `no key row for LH "${result}"`).toContain(result)
    }
    // And the glyphs themselves, or the key would name words with no marks.
    for (const g of [MUCUS_GLYPH.creamy, MUCUS_GLYPH['egg-white'], LH_GLYPH.peak]) {
      expect(text, `the glyph ${g} is not drawn`).toContain(g)
    }
  })
})

/**
 * EVERY OPTIONAL FIELD BELONGS TO A SECTION.
 *
 * Nine chip groups rendered as nine peers is the flat stack this grouping
 * replaced. The failure mode now is a *new* field added to one of the three
 * arrays with no `section`, which would render under no heading at all — or,
 * worse, under whichever heading happened to be last. A type makes the field
 * required; this makes sure the value is one the panel actually draws.
 */
describe('Cycle · the optional fields are three questions, not nine', () => {
  const ids = FIELD_SECTIONS.map((s) => s.id)

  it('files every field under a section the panel renders', () => {
    const all = [
      ...SCALE_FIELDS.map((f) => [f.key, f.section] as const),
      ...TAG_FIELDS.map((f) => [f.key, f.section] as const),
      ...CHIP_FIELDS.map((f) => [f.key, f.section] as const),
    ]
    expect(all.length).toBeGreaterThan(8)
    for (const [key, section] of all) {
      expect(ids, `${key} is filed under "${section}", which no section draws`).toContain(section)
    }
  })

  it('leaves no section empty, so no heading stands over nothing', () => {
    // A heading over an empty grid is the failure mode of grouping — the same
    // rule the rail's own count assertion exists for.
    const used = new Set([
      ...SCALE_FIELDS.map((f) => f.section),
      ...TAG_FIELDS.map((f) => f.section),
      ...CHIP_FIELDS.map((f) => f.section),
    ])
    for (const id of ids) expect(used, `section "${id}" has no fields`).toContain(id)
  })

  it('draws all three headings in the day window', async () => {
    const user = userEvent.setup()
    mount()
    await openAct(user)
    // The panel is not a fold any more — it is the window's content, opened
    // by the one door in the act column. A fold inside a dialog is a door
    // behind a door, so `DayMore` renders `embedded` and has no header.
    await user.click(screen.getByRole('button', { name: /the rest of today/i }))
    const dialog = await screen.findByRole('dialog')
    for (const s of FIELD_SECTIONS) {
      expect(dialog.textContent, `"${s.title}" is not drawn`).toContain(s.title)
    }
  })
})

/**
 * A LOG ROW OPENS THE DAY, OVER THE LIST.
 *
 * It used to select the day and move the month cursor, leaving the reader to
 * find the act column — the other side of the page on a desktop, a collapsed
 * strip on a phone. Asked for as "just show me a new window with all the
 * information where I can edit all that information".
 *
 * The assertion that matters is not that a dialog appears: it is that the
 * dialog holds the SAME controls the act column does. A second editor would
 * drift from the first, which is the fault fixed in Pickleball this week.
 */
describe('Cycle · a log row opens that day in a window', () => {
  it('opens the picked day, with the real editor inside it', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.log))
    const rows = [...container.querySelectorAll<HTMLButtonElement>('[data-card="log"] button[aria-pressed]')]
    expect(rows.length).toBeGreaterThan(0)
    const label = rows[0].textContent ?? ''
    await user.click(rows[0])

    const dialog = await screen.findByRole('dialog')
    // Titled with the day it opened, because the list it came from shows thirty.
    expect(label).toContain(dialog.querySelector('h2')?.textContent ?? '@@')
    // The act column's own controls: a temperature input and the optional
    // fields disclosure. If these ever stop being `DayEditor`/`DayMore`, this
    // is the test that should fail.
    // The optional half, by its CONTENT rather than by a fold button: it is
    // `embedded` here, so there is no disclosure to find. A section heading
    // from `dayFields.ts` is the thing that cannot be present unless the real
    // `DayMore` rendered.
    expect(dialog.textContent).toContain(FIELD_SECTIONS[0].title)
    expect(dialog.querySelector('input')).not.toBeNull()
  })
})

/**
 * THE MONTH IS A CALENDAR, AND A DAY THAT HAS NOT HAPPENED IS NOT A ROW.
 *
 * The list this replaced drew 31 rows of which **13 were future days carrying
 * an invented cycle day** — `19 d21` through `31 d33`, counted forward past
 * the next period the same page estimates in zone 1. A prediction drawn as a
 * record, and pressable, which is the path by which a `period` flag reached a
 * day that had not happened and joined `avgCycleLength`.
 *
 * It lives in the `log` rail row now, beside `DayLog`, because at the bottom
 * of the act column a tap landed in an editor 900px above it. So these scope
 * to that card — and the first test is the one that says the move happened.
 *
 * Asserted on the ACCESSIBLE NAME rather than on a class or a colour: the
 * cell's `sr-only` sentence is its name, so these are the same strings a
 * screen-reader user hears, and they survive every restyling.
 */
describe('Cycle · the month calendar', () => {
  /** Open `Your log` and hand back its card — where the calendar now is. */
  async function logCard(user: ReturnType<typeof userEvent.setup>, container: HTMLElement) {
    await user.click(railRow(GROUP_LABEL.log))
    const card = container.querySelector('[data-card="log"]') as HTMLElement
    expect(card, 'the log card renders').toBeTruthy()
    return card
  }

  /** Every cell of the grid — future ones are not buttons, so they are not here. */
  const cells = (card: HTMLElement) =>
    [...card.querySelectorAll('[aria-pressed]')].filter((b) => b.querySelector('.sr-only'))

  it('is beside the log, not stranded at the bottom of the act column', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const card = await logCard(user, container)
    expect(card.querySelector('.grid-cols-7'), 'no calendar in the log card').toBeTruthy()
    // And NOT in the act. A second copy there is two components that can
    // disagree about the same month, which is what the phone fold was.
    await openAct(user)
    const act = container.querySelector('.zone-act') as HTMLElement
    expect(act.querySelector('.grid-cols-7'), 'the calendar is still in the act').toBeNull()
  })

  it('never offers a day that has not happened', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const card = await logCard(user, container)
    const pressable = cells(card)
    expect(pressable.length, 'no pressable cells at all').toBeGreaterThan(0)
    for (const el of pressable) {
      const sr = el.querySelector('.sr-only')?.textContent ?? ''
      expect(sr, 'a future day reached the pressable set').not.toMatch(/not yet$/)
    }
  })

  it('draws the days still to come as dated and inert, not as empty days', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const card = await logCard(user, container)
    const notYet = [...card.querySelectorAll('.sr-only')]
      .map((s) => s.textContent ?? '')
      .filter((t) => t.endsWith('not yet'))
    // The demo's today is mid-month, so there are always some; and none of
    // them says "nothing logged", which is a claim about a day that happened.
    expect(notYet.length).toBeGreaterThan(0)
    for (const t of notYet) expect(t).not.toContain('nothing logged')
  })

  it('names each day with what is on it, so the cell is not colour alone', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const card = await logCard(user, container)
    const named = [...card.querySelectorAll('.sr-only')].map((s) => s.textContent ?? '')
    // The seed flags a period every cycle and takes temperatures through it.
    expect(named.some((t) => t.includes('period')), 'no period day is named').toBe(true)
    expect(named.some((t) => /\d{2}\.\d+°/.test(t)), 'no temperature is named').toBe(true)
  })

  it('opens the day it was tapped, in the same window the log rows open', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const card = await logCard(user, container)
    const cell = cells(card).find((c) => !(c.querySelector('.sr-only')?.textContent ?? '').includes('nothing logged'))
    const name = cell!.querySelector('.sr-only')!.textContent!.split(' · ')[0]
    await user.click(cell as HTMLElement)
    // A dialog, not a scroll to the act column — which is the whole point of
    // the move. `DayWindow` names itself after the day it holds.
    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain(name)
  })

  it('puts the cycle day on the day being edited, once, not on all 31', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await openAct(user)
    const act = container.querySelector('.zone-act')!
    const dayLabels = (act.textContent ?? '').match(/day \d+/g) ?? []
    expect(dayLabels.length, 'the cycle day is drawn more than once').toBe(1)
  })
})
