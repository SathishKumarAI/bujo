import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Collections } from './Collections'
import {
  COLLECTIONS_CARDS, COLLECTIONS_DEFAULT_GROUP, COLLECTIONS_GROUPS, COLLECTIONS_GROUP_LABEL,
} from '../lib/collectionsCards'
import { generateDemoData } from '../lib/demo'

/* Seeded through storage, not through an effect: `replaceAll` is a fresh
   identity each render, so `useEffect(…, [replaceAll])` re-seeds forever. */
function mount() {
  localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
  return render(
    <NavProvider navigate={() => {}}>
      <CursorProvider>
        <ConfirmProvider>
          <JournalProvider>
            <Collections />
          </JournalProvider>
        </ConfirmProvider>
      </CursorProvider>
    </NavProvider>,
  )
}

afterEach(() => localStorage.clear())

/** The rail names itself "Tags — 1 panel"; match on the label half. */
const railRow = (label: string) =>
  screen.getByRole('button', { name: (name) => name.startsWith(`${label} — `) })

describe('Collections · the registry is the review zone', () => {
  it('reaches every registered card through the rail, and no unregistered one', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const seen = new Set<string>()
    for (const g of COLLECTIONS_GROUPS) {
      await user.click(railRow(COLLECTIONS_GROUP_LABEL[g]))
      for (const el of container.querySelectorAll('[data-card]')) seen.add(el.getAttribute('data-card')!)
    }
    const registered = COLLECTIONS_CARDS.map((c) => c.id).sort()
    expect([...seen].sort().filter((id) => !registered.includes(id))).toEqual([])
    expect(registered.filter((id) => !seen.has(id))).toEqual([])
  })

  it('shows one group at a time, and its heading and count match the rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of COLLECTIONS_GROUPS) {
      await user.click(railRow(COLLECTIONS_GROUP_LABEL[g]))
      const groups = [...container.querySelectorAll('[data-domain]')]
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('data-domain')).toBe(g)
      const cards = groups[0].querySelectorAll('[data-card]')
      expect(cards.length).toBeGreaterThan(0)
      expect(railRow(COLLECTIONS_GROUP_LABEL[g]).getAttribute('aria-label'))
        .toBe(`${COLLECTIONS_GROUP_LABEL[g]} — ${cards.length} ${cards.length === 1 ? 'panel' : 'panels'}`)
    }
  })

  it('opens on the Index, which is the card that says what the others hold', () => {
    const { container } = mount()
    const groups = container.querySelectorAll('[data-domain]')
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-domain')).toBe(COLLECTIONS_DEFAULT_GROUP)
  })

  /**
   * The Index's jump links move the rail, not the scroll position.
   *
   * This is the one thing a restructure like this breaks quietly. The links
   * used to `scrollIntoView` a band; under a rail the target is not in the DOM
   * to scroll to, so a link left unchanged would do nothing at all and look
   * like a dead control. Both halves are asserted: the rail moves to the right
   * group, AND the item is open inside it.
   */
  it('jumps from the Index into the collection it names', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const index = container.querySelector('[data-card="index"]')!
    const link = index.querySelectorAll('button')[0] as HTMLButtonElement
    const name = link.textContent!.trim()
    await user.click(link)
    // The rail moved…
    expect(container.querySelector('[data-domain]')!.getAttribute('data-domain')).toBe('pages')
    // …and the collection it named is what is on screen.
    expect(container.querySelector('[data-card="pages"]')!.textContent).toContain(name.replace(/\s*\d+$/, '').trim())
  })

  /**
   * `mod/Band` is gone, and nothing may quietly bring it back.
   *
   * Collections was the last page using it. The primitive is deleted, so an
   * import would fail the build — but the *shape* can be re-created by hand,
   * which is what this asserts against.
   *
   * `.border-b-2.border-line` specifically, not every `border-b-2`: a 2px rule
   * in the neutral line colour is a section closing itself, which is the
   * Modernist move `DESIGN.md` replaced with elevation. A 2px underline in an
   * accent is an active-tab marker — a different thing, and it stays. The
   * first draft of this test asserted the broad form, went red on five
   * elements, and two of them were genuinely the section rule (the tag filter
   * row and the library's sticky bar); the other three were tab markers.
   */
  it('closes no section with the Modernist 2px rule', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of COLLECTIONS_GROUPS) {
      await user.click(railRow(COLLECTIONS_GROUP_LABEL[g]))
      const review = container.querySelector('.zone-review')!
      expect(review.querySelectorAll('.border-b-2.border-line')).toHaveLength(0)
    }
  })
})
