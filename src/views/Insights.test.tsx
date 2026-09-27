import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Insights } from './Insights'
import userEvent from '@testing-library/user-event'
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

/** The rail names itself "Overview — 6 panels"; match on the label half. */
const railRow = (label: string) =>
  screen.getByRole('button', {
    name: (accessibleName) => accessibleName.startsWith(`${label} — `),
  })

describe('Insights · the registry is the page', () => {
  /**
   * The rail shows one domain at a time, so "every card renders" is no longer
   * true of a single render — and the assertion that replaces it is stronger:
   * walk the rail, and the UNION of what each domain shows must be exactly
   * the registry. A card that belongs to no reachable domain now fails here,
   * which the old all-at-once version could not have caught.
   */
  it('reaches every registered card through the rail, and no unregistered one', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const seen = new Set<string>()
    for (const d of DOMAINS) {
      await user.click(railRow(DOMAIN_LABEL[d]))
      for (const el of container.querySelectorAll('[data-card]')) {
        seen.add(el.getAttribute('data-card')!)
      }
    }
    const registered = CARDS.map((c) => c.id).sort()
    expect([...seen].sort().filter((id) => !registered.includes(id))).toEqual([])
    expect(registered.filter((id) => !seen.has(id))).toEqual([])
  })

  it('shows one domain at a time, and its heading matches the rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const d of DOMAINS) {
      await user.click(railRow(DOMAIN_LABEL[d]))
      const groups = [...container.querySelectorAll('[data-domain]')]
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('data-domain')).toBe(d)
      // A heading over an empty grid is the failure mode of grouping.
      expect(groups[0].querySelectorAll('[data-card]').length).toBeGreaterThan(0)
    }
  })

  it('opens on a domain, not on all of them', () => {
    // Landing on All is landing on the six-screen page the rail replaces.
    const { container } = mount()
    expect(container.querySelectorAll('[data-domain]')).toHaveLength(1)
  })

  it('lets All cross every domain', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow('All'))
    expect(container.querySelectorAll('[data-domain]').length).toBe(DOMAINS.length)
  })

  /**
   * A query has to cross domains. Searching for a card whose domain you do
   * not remember is the whole reason the search exists, so it must not be
   * silently intersected with whichever rail row happens to be selected.
   */
  /**
   * The four mood/recovery panels, both directions, by name.
   *
   * The union test above already fails if one goes missing — but it fails with
   * "an id is in the registry and not on the page", which is the same message
   * for all twenty-seven cards. These four are the ones whose *content* is
   * gated on an observation floor, so each has a live branch that renders an
   * empty state and a live branch that renders a chart. A card that silently
   * fell to its empty state on the demo journal would still satisfy the union;
   * this asserts the demo reaches the drawn branch, which is what
   * `lib/demoMood.test.ts` seeds for and what the a11y gate needs in order to
   * see any of this markup at all.
   */
  it('renders all four mood-pattern panels with data, not with their empty states', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(DOMAIN_LABEL.mood))
    for (const id of ['moodreasons', 'moodswing', 'lapselag', 'moodrisk']) {
      const card = container.querySelector(`[data-card="${id}"]`)
      expect(card, `${id} is not on the page`).not.toBeNull()
    }
    // The three phrases each floor prints when it has nothing. Their presence
    // means the seed stopped covering a card, which is exactly how a chart goes
    // quiet with every gate green.
    const text = container.querySelector('[data-domain="mood"]')!.textContent!
    expect(text).not.toContain('This needs four lapse days')
    expect(text).not.toContain('Tick what shaped a day')
    expect(text).not.toContain('this needs three weeks')
    // And the join's headline is a real comparison, with both counts in it.
    expect(text).toMatch(/lapse days logged, mood\s*averaged/)
  })

  it('searches across domains regardless of the selected rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow('Records'))
    await user.type(screen.getByLabelText('Search the journal and this page'), 'sleep debt')
    const ids = [...container.querySelectorAll('[data-card]')].map((e) => e.getAttribute('data-card'))
    expect(ids).toContain('sleepdebt')  // domain `mood`, while the rail says Records
  })
})
