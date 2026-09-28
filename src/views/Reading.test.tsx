import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Reading } from './Reading'
import {
  READING_CARDS, READING_DEFAULT_GROUP, READING_GROUPS, READING_GROUP_LABEL,
} from '../lib/readingCards'
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
            <Reading />
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

describe('Reading · the registry is the review zone', () => {
  it('reaches every registered card through the rail, and no unregistered one', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const seen = new Set<string>()
    for (const g of READING_GROUPS) {
      await user.click(railRow(READING_GROUP_LABEL[g]))
      for (const el of container.querySelectorAll('[data-card]')) {
        seen.add(el.getAttribute('data-card')!)
      }
    }
    const registered = READING_CARDS.map((c) => c.id).sort()
    expect([...seen].sort().filter((id) => !registered.includes(id))).toEqual([])
    expect(registered.filter((id) => !seen.has(id))).toEqual([])
  })

  it('shows one group at a time, and its heading and count match the rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of READING_GROUPS) {
      await user.click(railRow(READING_GROUP_LABEL[g]))
      const groups = [...container.querySelectorAll('[data-domain]')]
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('data-domain')).toBe(g)
      // A heading over an empty grid is the failure mode of grouping.
      const cards = groups[0].querySelectorAll('[data-card]')
      expect(cards.length).toBeGreaterThan(0)
      expect(railRow(READING_GROUP_LABEL[g]).getAttribute('aria-label'))
        .toBe(`${READING_GROUP_LABEL[g]} — ${cards.length} ${cards.length === 1 ? 'panel' : 'panels'}`)
    }
  })

  it('opens on a real group, not on the whole page', () => {
    // Landing on everything is landing on the 8.8-screen phone page the rail
    // replaces, which is why there is no "All" row to default to either.
    const { container } = mount()
    const groups = container.querySelectorAll('[data-domain]')
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-domain')).toBe(READING_DEFAULT_GROUP)
  })

  /**
   * Adding a book is the act, in every group.
   *
   * The structural claim of the pass: the add form and the book you are on
   * belong to zone 2. `Shelves` used to hold the form *and* the three shelf
   * lists in one `mod/Band` — the form because it had to go somewhere. If it
   * drifts into zone 3 it becomes reachable only by selecting a rail row.
   */
  it('keeps adding a book in zone 2 and out of the rail', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of READING_GROUPS) {
      await user.click(railRow(READING_GROUP_LABEL[g]))
      const act = container.querySelector('.zone-act')!
      expect(act.querySelector('input[aria-label="Book title"]')).not.toBeNull()
      expect(act.textContent).toContain('Reading now')
      expect(container.querySelector('.zone-review')!.querySelector('input[aria-label="Book title"]')).toBeNull()
    }
  })

  /**
   * Two cards used to `return null`, and a rail cannot tolerate that.
   *
   * `Stalled` returned nothing at zero stalled books and `LearningFeed`
   * nothing at zero learnings. In a vertical stack that is invisible; under a
   * rail it makes the row's count a lie and turns a group of one into a
   * heading over an empty grid. Asserted by rendering an EMPTY journal, which
   * is the state the old code disappeared in.
   */
  it('renders a frame for stalled and learnings even with nothing to show', async () => {
    localStorage.setItem('bujo:data', JSON.stringify({ entries: [], books: [], settings: {} }))
    const user = userEvent.setup()
    const { container } = render(
      <NavProvider navigate={() => {}}>
        <CursorProvider>
          <ConfirmProvider>
            <JournalProvider>
              <Reading />
            </JournalProvider>
          </ConfirmProvider>
        </CursorProvider>
      </NavProvider>,
    )
    await user.click(railRow(READING_GROUP_LABEL.stalled))
    expect(container.querySelector('[data-card="stalled"]')).not.toBeNull()
    await user.click(railRow(READING_GROUP_LABEL.notes))
    expect(container.querySelector('[data-card="learnings"]')).not.toBeNull()
    expect(container.querySelector('[data-card="later"]')).not.toBeNull()
  })

  /**
   * Each shelf is its own card, not a third of one row.
   *
   * The three were `BandCell`s sharing a row because the Modernist grid wanted
   * a row. If they ever collapse back into one card this count drops and the
   * rail row's number stops describing three lists.
   */
  it('gives each shelf its own card', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(READING_GROUP_LABEL.shelves))
    for (const id of ['shelf-reading', 'shelf-want', 'shelf-finished']) {
      expect(container.querySelector(`[data-card="${id}"]`)).not.toBeNull()
    }
  })
})
