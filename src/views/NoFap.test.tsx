import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { NoFap } from './NoFap'
import { CARDS, GROUPS, GROUP_LABEL, DEFAULT_GROUP } from '../lib/recoveryCards'
import { generateDemoData } from '../lib/demo'

/**
 * The registry and the page must hold the same panels.
 *
 * Recovery's zone 3 was three `CollapsibleSection`s that all shipped shut, and
 * the panels inside them were written inline in a 929-line view. Moving them out
 * is the single most dangerous shape of change in this repo: `views/Pullups.tsx`
 * lost **eleven workout formats** to a pass that retyped a data module instead of
 * reading it, with `tsc`, eslint, vitest and the build all green, and the page
 * still rendering a plausible-looking list.
 *
 * This reads `data-card` off the rendered DOM, so it fails when a panel is
 * dropped in a move, when one is added with no registry row, and when a group
 * heading ends up over nothing.
 */
/* Seeded through storage, not through an effect. `replaceAll` is a fresh
   identity each render, so `useEffect(…, [replaceAll])` re-seeds forever — the
   first version of the Insights twin of this file hung the runner. */
function mount() {
  localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
  return render(
    <NavProvider navigate={() => {}}>
      <CursorProvider>
        <ConfirmProvider>
          <JournalProvider>
            <NoFap />
          </JournalProvider>
        </ConfirmProvider>
      </CursorProvider>
    </NavProvider>,
  )
}

afterEach(() => localStorage.clear())

/** The rail names itself "Progress — 7 panels"; match on the label half. */
const railRow = (label: string) =>
  screen.getByRole('button', { name: (name) => name.startsWith(`${label} — `) })

/**
 * Panels the demo seed structurally cannot produce, with the reason.
 *
 * Kept as a named list rather than by weakening the assertion, so a panel that
 * silently stops rendering still fails. Every addition here is a claim that a
 * gate cannot see that card — `npm run a11y` included — so the list is worth
 * keeping short.
 *
 * - `calmstretch` needs "no urge logged for at least a day" and the seed logs
 *   two urges **today**, because `urgetrend`, `riskhours` and the day tally all
 *   need a recent one. The two cannot both be on screen from one seed; a
 *   recent urge is the more useful default.
 */
const SEED_CANNOT_RENDER = ['calmstretch']

describe('Recovery · the registry is the page', () => {
  /**
   * The rail shows one group at a time, so "every panel renders" is not true of
   * a single render — and what replaces it is stronger: walk the rail, and the
   * UNION of what each group shows must be the registry. A panel belonging to no
   * reachable group fails here, which an all-at-once check could not catch.
   */
  it('reaches every registered panel through the rail, and no unregistered one', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const seen = new Set<string>()
    for (const g of GROUPS) {
      await user.click(railRow(GROUP_LABEL[g]))
      for (const el of container.querySelectorAll('[data-card]')) seen.add(el.getAttribute('data-card')!)
    }
    const registered = CARDS.map((c) => c.id)
    expect([...seen].filter((id) => !registered.includes(id)).sort()).toEqual([])
    expect(registered.filter((id) => !seen.has(id) && !SEED_CANNOT_RENDER.includes(id))).toEqual([])
  })

  it('shows one group at a time, and its heading matches the rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of GROUPS) {
      await user.click(railRow(GROUP_LABEL[g]))
      const groups = [...container.querySelectorAll('[data-domain]')]
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('data-domain')).toBe(g)
      // A heading over an empty grid is the failure mode of grouping.
      expect(groups[0].querySelectorAll('[data-card]').length).toBeGreaterThan(0)
    }
  })

  /**
   * Landing on everything is landing on the 4.8-screen page the rail replaces,
   * and landing on the first row for its own sake is a coin toss. Someone opens
   * Recovery to see where the streak stands.
   */
  it('opens on one real group, and it is Progress', () => {
    const { container } = mount()
    const groups = [...container.querySelectorAll('[data-domain]')]
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-domain')).toBe(DEFAULT_GROUP)
    expect(DEFAULT_GROUP).toBe('progress')
  })

  /**
   * The rail selection persists. The three folds this replaced each carried a
   * `stickyKey`; `docs/PAGE-WORKFLOW.md` calls losing that "a regression dressed
   * as a redesign", so it is asserted rather than assumed.
   */
  it('restores the group it was left on', () => {
    localStorage.setItem('bujo.ui.recovery.group', 'patterns')
    const { container } = mount()
    expect(container.querySelector('[data-domain]')?.getAttribute('data-domain')).toBe('patterns')
  })

  /**
   * A query has to cross groups. Finding a panel whose group you do not remember
   * is the whole reason the filter exists, so it must not be silently
   * intersected with whichever rail row happens to be selected.
   */
  it('filters across groups regardless of the selected rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.reference))
    await user.type(screen.getByLabelText('Filter the Recovery panels'), 'quit date')
    const ids = [...container.querySelectorAll('[data-card]')].map((e) => e.getAttribute('data-card'))
    expect(ids).toContain('commitment') // group `plan`, while the rail said Reference
  })

  /**
   * The rail offers exactly the registry's groups and no "All" row — the four do
   * not overlap, and "all of them" is the page this replaces. A stray extra row
   * means a second vocabulary has appeared beside the registry's, which is the
   * fault `docs/PAGE-SHAPE.md` was written about.
   */
  it('offers exactly the registry groups in the rail', () => {
    mount()
    const rail = screen.getByRole('navigation', { name: 'Recovery groups' })
    const labels = [...rail.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || '').split(' — ')[0])
    expect(labels).toEqual(GROUPS.map((g) => GROUP_LABEL[g]))
  })
})
