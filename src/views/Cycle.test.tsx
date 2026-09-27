import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Cycle } from './Cycle'
import { CYCLE_CARDS, CYCLE_GROUPS, DEFAULT_GROUP, GROUP_LABEL } from '../lib/cycleCards'
import { FLAGS, FLAG_MEANS } from '../components/cycle'
import { CYCLE_DISCLAIMER } from '../lib/cycleGuide'
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
  screen.getByRole('button', { name: (name) => name.startsWith(`${label} — `) })

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
      // The rail's count is a promise about what the row holds. Computed from a
      // different predicate than the render, it can lie in either direction.
      expect(railRow(GROUP_LABEL[g]).getAttribute('aria-label'))
        .toBe(`${GROUP_LABEL[g]} — ${cards.length} ${cards.length === 1 ? 'panel' : 'panels'}`)
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
    const rows = [...container.querySelectorAll('#cycle-flag-meanings > div')]
    expect(rows).toHaveLength(FLAGS.length)
    for (const [i, f] of FLAGS.entries()) {
      expect(rows[i].querySelector('dt')!.textContent!.trim()).toBe(f)
      expect(rows[i].querySelector('dd')!.textContent!.trim()).toBe(FLAG_MEANS[f])
    }
    // Folded, the hue→word key survives and only the sentences go. That is the
    // whole reason the fold is allowed: the report was that the colours were
    // undecipherable, and hiding the key would reproduce it.
    const toggle = screen.getByRole('button', { name: /flag colours/i })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const keys = [...container.querySelectorAll('#cycle-flag-meanings > li')]
    expect(keys.map((li) => li.textContent!.trim())).toEqual([...FLAGS])
    expect(screen.queryByText(FLAG_MEANS.period)).toBeNull()
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
