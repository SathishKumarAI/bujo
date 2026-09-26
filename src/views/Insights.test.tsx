import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Insights } from './Insights'
import { CARDS, DOMAINS, DOMAIN_LABEL } from '../lib/insightsFilter'
import { generateDemoData } from '../lib/demo'

/**
 * The registry and the page must hold the same cards.
 *
 * `lib/insightsFilter.ts` said in its own docstring that "a test asserts every
 * id here is rendered and every rendered id is here". **That test did not
 * exist** — the only one there checked the registry against itself. And the
 * gap it was supposed to close was already open: `TrackerVisuals` rendered
 * five habit grids from a `CollapsibleSection` with no id and no `show()`
 * gate, so the chip row could not filter it, the search could not find it, and
 * nothing counted it.
 *
 * This is the version that runs. It reads `data-card` off the rendered page,
 * so it fails when a card is dropped in a move, when one is added without a
 * registry row, and when a domain heading ends up over nothing.
 */
/* Seeded through storage, not through an effect. `replaceAll` is a fresh
   identity each render, so `useEffect(…, [replaceAll])` re-seeds forever —
   the first version of this file hung the runner rather than failing it. */
function mount() {
  localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
  return render(
    <NavProvider navigate={() => {}}>
      <CursorProvider>
        <ConfirmProvider>
          <JournalProvider>
            <Insights />
          </JournalProvider>
        </ConfirmProvider>
      </CursorProvider>
    </NavProvider>,
  )
}

afterEach(() => localStorage.clear())

describe('Insights · the registry is the page', () => {
  it('renders every card the registry names, and names every card it renders', () => {
    const { container } = mount()
    const rendered = [...container.querySelectorAll('[data-card]')]
      .map((el) => el.getAttribute('data-card')!)
      .sort()
    const registered = CARDS.map((c) => c.id).sort()
    // Both directions, and the message says which id moved.
    expect(rendered.filter((id) => !registered.includes(id))).toEqual([])
    expect(registered.filter((id) => !rendered.includes(id))).toEqual([])
  })

  it('renders one heading per domain, in registry order, and none over nothing', () => {
    const { container } = mount()
    // `[data-domain]`, not `section` — cards render their own sections, and
    // the first version of this assertion matched those and failed on a card
    // that legitimately contains no card.
    const groups = [...container.querySelectorAll('[data-domain]')]
    expect(groups.map((g) => g.querySelector('h2')?.textContent)).toEqual(DOMAINS.map((d) => DOMAIN_LABEL[d]))
    // A heading over an empty grid is the failure mode of grouping.
    for (const g of groups) expect(g.querySelectorAll('[data-card]').length).toBeGreaterThan(0)
  })

  it('puts the domain names on the chips and the headings — one vocabulary', () => {
    mount()
    for (const d of DOMAINS) {
      // Twice: once as a filter chip in zone 2, once as a heading in zone 3.
      expect(screen.getAllByText(DOMAIN_LABEL[d]).length).toBeGreaterThanOrEqual(2)
    }
  })
})
