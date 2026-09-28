import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Gym } from './Gym'
import {
  GYM_CARDS, GYM_DEFAULT_GROUP, GYM_GROUPS, GYM_GROUP_LABEL,
} from '../lib/gymCards'
import { generateDemoData } from '../lib/demo'

/**
 * The registry and the review zone must hold the same cards — Insights'
 * contract test, applied to the rail that replaced this page's three shut
 * `QuietSection` folds.
 *
 * A rail makes a lost card *quieter* than a fold did: a fold at least left a
 * bar on the page saying something was under it, while a card no group reaches
 * is simply never on screen. `views/Pullups.tsx` lost eleven workout formats
 * to a pass that retyped a data module instead of moving it, with `tsc -b`,
 * eslint, vitest and the build all green. So the assertion is the union over
 * every rail row, in both directions.
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
            <Gym />
          </JournalProvider>
        </ConfirmProvider>
      </CursorProvider>
    </NavProvider>,
  )
}

afterEach(() => localStorage.clear())

/** The rail names itself "Balance — 5 panels"; match on the label half. */
const railRow = (label: string) =>
  screen.getByRole('button', { name: (name) => name.startsWith(`${label} — `) })

describe('Gym · the registry is the review zone', () => {
  it('reaches every rendered card through the rail, and registers every one it reaches', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const seen = new Set<string>()
    for (const g of GYM_GROUPS) {
      await user.click(railRow(GYM_GROUP_LABEL[g]))
      for (const el of container.querySelectorAll('[data-card]')) {
        seen.add(el.getAttribute('data-card')!)
      }
    }
    const registered = GYM_CARDS.map((c) => c.id)
    // No card renders that the registry does not name.
    expect([...seen].sort().filter((id) => !registered.includes(id))).toEqual([])
    /* And the other direction, with the one honest exception: `progression`
       and `reppr` exist only while a lift is focused, which is a state this
       page enters by clicking a lift. Naming them here rather than filtering
       on a flag keeps the list of "cards you cannot see from a cold page"
       explicit — an unreachable card is exactly what this test is for. */
    const focusOnly = ['progression', 'reppr']
    expect(registered.filter((id) => !seen.has(id) && !focusOnly.includes(id))).toEqual([])
  })

  it('shows one group at a time, and its heading and count match the rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of GYM_GROUPS) {
      await user.click(railRow(GYM_GROUP_LABEL[g]))
      const groups = [...container.querySelectorAll('[data-domain]')]
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('data-domain')).toBe(g)
      // A heading over an empty grid is the failure mode of grouping.
      const cards = groups[0].querySelectorAll('[data-card]')
      expect(cards.length).toBeGreaterThan(0)
      // The rail's count is a promise about what the row holds. Computed from a
      // different predicate than the render, it can lie in either direction —
      // and here the predicates genuinely differ per card (`focusEx`, a
      // two-session minimum for RPE), so this is the assertion that keeps the
      // filter and the render using one.
      expect(railRow(GYM_GROUP_LABEL[g]).getAttribute('aria-label'))
        .toBe(`${GYM_GROUP_LABEL[g]} — ${cards.length} ${cards.length === 1 ? 'panel' : 'panels'}`)
    }
  })

  it('opens on a real group, not on the whole page', () => {
    // Landing on everything is landing on the 7.2-screen phone page the rail
    // replaces, which is why there is no "All" row to default to either.
    const { container } = mount()
    const groups = container.querySelectorAll('[data-domain]')
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-domain')).toBe(GYM_DEFAULT_GROUP)
  })

  /**
   * The logger and the rest timer stay in zone 2, in every group.
   *
   * This is the structural claim of the pass. The act column is what the page
   * is *for*; anything that drifts into zone 3 becomes reachable only by
   * selecting a rail row, and a rest timer you have to navigate to during a
   * workout is the defect this file already records fixing once. The tools
   * went the other way deliberately — see the test below.
   */
  it('keeps the logger and the rest timer out of the rail', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of GYM_GROUPS) {
      await user.click(railRow(GYM_GROUP_LABEL[g]))
      const act = container.querySelector('.zone-act')!
      /* The ACCESSIBLE NAME, not the text. This assertion read
         `textContent).toContain('Rest timer')` and went red the moment the
         timer's `<h2>Rest timer</h2>` became `aria-label="Rest timer"` on the
         section itself — the component was fine and the test was measuring
         the wrong thing. Same family as the page-census sweep that counted 14
         folds on a 32-fold page because `Card collapsible` puts its name in
         `aria-label` and nothing in its text. */
      expect(act.querySelector('[aria-label="Rest timer"]')).not.toBeNull()
      expect(screen.getByRole('button', { name: 'Finish session' })).toBeInTheDocument()
      // …and they are not ALSO in the review column, which a copy-paste move
      // would produce and which every other assertion here would still pass.
      const review = container.querySelector('.zone-review')!
      expect(review.querySelector('[aria-label="Rest timer"]')).toBeNull()
      expect(review.textContent).not.toContain('Finish session')
    }
  })

  /**
   * Each tool is its own rail row, and the timer is not one of them.
   *
   * The four tools were one `QuietSection` in zone 2, then briefly one `tools`
   * rail row — which was the fold again in a thinner disguise, since reaching
   * the plate calculator still meant scrolling past an anatomy diagram. They
   * are four instruments, not four answers to one question, so they are four
   * destinations. The rest timer explicitly did NOT come with them: it runs
   * between sets rather than while a session is being built, and a countdown
   * you have to select a rail row to see is the defect this file already
   * records fixing once.
   */
  it('gives each tool its own rail row, and leaves the timer in zone 2', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const tools = [
      ['plates', 'Plate calculator'],
      ['routines', 'Saved routines'],
      ['exercisedb', 'Exercise database'],
      ['anatomy', 'Exercise anatomy'],
    ] as const
    for (const [id, heading] of tools) {
      await user.click(railRow(GYM_GROUP_LABEL[id]))
      const review = container.querySelector('.zone-review')!
      expect(review.textContent).toContain(heading)
      // One card per row: the row IS the tool, so a second one here means two
      // instruments have been stacked back into one panel.
      expect(review.querySelectorAll('[data-domain] [data-card]')).toHaveLength(1)
      expect(container.querySelector('.zone-act')!.textContent).not.toContain(heading)
    }
  })

  /**
   * `week` opens with the signature visual, not with a table.
   *
   * `musclevolume` is the one chart on this page that says what to do next
   * rather than what happened — hard sets per muscle against the 10–20
   * landmark — and it spent this page's whole history above three shut folds
   * where the fold bars, not it, were what the eye landed on.
   */
  it('leads the default group with the muscle-volume chart', () => {
    const { container } = mount()
    const first = container.querySelector('[data-domain] [data-card]')
    expect(first?.getAttribute('data-card')).toBe('musclevolume')
  })
})
