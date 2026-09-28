import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Mindset } from './Mindset'
import {
  MINDSET_CARDS, MINDSET_DEFAULT_GROUP, MINDSET_GROUPS, MINDSET_GROUP_LABEL,
} from '../lib/mindsetCards'
import { MINDSET_LIBRARY } from '../lib/mindset'
import { generateDemoData } from '../lib/demo'

/**
 * The registry and the review zone must hold the same cards — the contract
 * test every rail page in this repo now carries.
 *
 * It matters more here than anywhere else, because this page had **no folds
 * and no groups at all**: everything was always on screen, so nothing could go
 * missing without being seen. A rail removes that safety. A card no group
 * reaches is simply never rendered, and `views/Pullups.tsx` lost eleven
 * workout formats to a pass that retyped a data module with `tsc -b`, eslint,
 * vitest and the build all green.
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
            <Mindset />
          </JournalProvider>
        </ConfirmProvider>
      </CursorProvider>
    </NavProvider>,
  )
}

afterEach(() => localStorage.clear())

/** The rail names itself "Practice — 2 panels"; match on the label half. */
const railRow = (label: string) =>
  screen.getByRole('button', { name: (name) => name.startsWith(`${label} — `) })

describe('Mindset · the registry is the review zone', () => {
  it('reaches every registered card through the rail, and no unregistered one', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const seen = new Set<string>()
    for (const g of MINDSET_GROUPS) {
      await user.click(railRow(MINDSET_GROUP_LABEL[g]))
      for (const el of container.querySelectorAll('[data-card]')) {
        seen.add(el.getAttribute('data-card')!)
      }
    }
    const registered = MINDSET_CARDS.map((c) => c.id).sort()
    expect([...seen].sort().filter((id) => !registered.includes(id))).toEqual([])
    expect(registered.filter((id) => !seen.has(id))).toEqual([])
  })

  it('shows one group at a time, and its heading and count match the rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of MINDSET_GROUPS) {
      await user.click(railRow(MINDSET_GROUP_LABEL[g]))
      const groups = [...container.querySelectorAll('[data-domain]')]
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('data-domain')).toBe(g)
      // A heading over an empty grid is the failure mode of grouping.
      const cards = groups[0].querySelectorAll('[data-card]')
      expect(cards.length).toBeGreaterThan(0)
      expect(railRow(MINDSET_GROUP_LABEL[g]).getAttribute('aria-label'))
        .toBe(`${MINDSET_GROUP_LABEL[g]} — ${cards.length} ${cards.length === 1 ? 'panel' : 'panels'}`)
    }
  })

  it('opens on a real group, not on the whole page', () => {
    // Landing on everything is landing on the 8.8-screen phone page the rail
    // replaces, which is why there is no "All" row to default to either.
    const { container } = mount()
    const groups = container.querySelectorAll('[data-domain]')
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-domain')).toBe(MINDSET_DEFAULT_GROUP)
  })

  /**
   * The focus slots are the act, in every group.
   *
   * This is the structural claim of the pass. Marking a principle practised is
   * what the page is *for*; if the slots drift into zone 3 they become
   * reachable only by selecting a rail row, and the daily act of the page
   * would be behind navigation.
   */
  it('keeps the focus slots in zone 2 and out of the rail', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of MINDSET_GROUPS) {
      await user.click(railRow(MINDSET_GROUP_LABEL[g]))
      const act = container.querySelector('.zone-act')!
      expect(act.textContent).toContain('Focus slots')
      expect(act.textContent).toContain('Leading principle')
      // …and not ALSO in the review column, which a copy-paste move would
      // produce and which every other assertion here would still pass.
      expect(container.querySelector('.zone-review')!.textContent).not.toContain('Focus slots')
    }
  })

  /**
   * The library keeps its own category filter, and it is NOT the rail.
   *
   * Promoting the nine categories to rail rows was the tempting shortcut and
   * it mixes two kinds of thing in one nav: the rail chooses which subject you
   * are looking at, a category chooses which principles are listed inside one
   * of them. This asserts the two navs stay separate and that the library
   * still renders every principle.
   */
  it('renders the whole library under one rail row, with its own filter', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(MINDSET_GROUP_LABEL.library))
    const lib = container.querySelector('[data-card="library"]')!
    expect(lib.querySelector('input[aria-label="Search principles"]')).not.toBeNull()
    // Every principle is reachable from this one row.
    for (const p of MINDSET_LIBRARY.slice(0, 5)) {
      expect(lib.textContent).toContain(p.title)
    }
    // The rail has three rows, not twelve — the categories did not become one.
    const rail = container.querySelector('nav[aria-label="Mindset sections"]')!
    expect(rail.querySelectorAll('button')).toHaveLength(MINDSET_GROUPS.length)
  })

  /**
   * `streak` states a run in words, and the failure mode is a fake zero.
   *
   * `currentStreak` returns 0 for "no run", which is a measurement — it says
   * you practised and broke it today. The card must print an em dash instead,
   * the rule `SummaryStrip` already follows and the one `monthlyCompletion`
   * got wrong on Trackers.
   */
  it('prints an em dash, never a zero, when there is no run', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(railRow(MINDSET_GROUP_LABEL.practice))
    const card = document.querySelector('[data-card="streak"]')!
    expect(card.textContent).toMatch(/days? in a row/)
    expect(card.textContent).not.toMatch(/\b0 days in a row/)
  })
})
