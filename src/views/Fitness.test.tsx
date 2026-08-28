import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { COMPANION, Fitness } from './Fitness'
import { SECTIONS } from '../components/shell/sections'

/**
 * The deep-linked activity has to beat the stored mode.
 *
 * `useStickyState` reads localStorage before it looks at the default it was
 * handed, so passing the linked mode as that default did nothing once a mode
 * had ever been chosen: the draft took `run` while the toggle stayed on the
 * stored `sport`. The activity `<select>` then held a value absent from its own
 * option list — which a browser renders as the *first* option, so the form said
 * "Pickleball", carried `run`, and would have logged one as the other.
 *
 * The assertion that matters is not "the select says Run" on its own. It is
 * that the select's value is **among its options**: that is the invariant whose
 * violation the browser hides, and the reason the bug survived a visual pass.
 */
function mount() {
  return render(
    <NavProvider navigate={() => {}}>
      <ConfirmProvider>
        <JournalProvider>
          <Fitness />
        </JournalProvider>
      </ConfirmProvider>
    </NavProvider>,
  )
}

const activitySelect = () => screen.getByLabelText('Activity') as HTMLSelectElement

describe('Fitness · deep-linked activity vs stored mode', () => {
  afterEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('takes the mode from ?activity= even when another mode is stored', () => {
    localStorage.setItem('bujo.ui.fitness.mode', 'sport')
    window.history.replaceState({}, '', '/?view=fitness&activity=run')
    mount()

    const select = activitySelect()
    expect(select.value).toBe('run')
    // The half that was invisible: a controlled select whose value is not in its
    // options renders as the first option instead of failing.
    expect([...select.options].map((o) => o.value)).toContain('run')
  })

  it('still lets the user switch mode by hand while the link is on screen', async () => {
    const user = userEvent.setup()
    localStorage.setItem('bujo.ui.fitness.mode', 'sport')
    window.history.replaceState({}, '', '/?view=fitness&activity=run')
    mount()
    expect(activitySelect().value).toBe('run')

    // Radix `ToggleGroup type="single"` renders radios, not buttons.
    await user.click(screen.getByRole('radio', { name: 'Strength' }))

    const select = activitySelect()
    expect(select.value).not.toBe('run')
    expect([...select.options].map((o) => o.value)).toContain(select.value)
  })

  it('falls back to the stored mode with no ?activity=', () => {
    localStorage.setItem('bujo.ui.fitness.mode', 'sport')
    window.history.replaceState({}, '', '/?view=fitness')
    mount()

    const select = activitySelect()
    expect([...select.options].map((o) => o.value)).toContain(select.value)
    expect(select.value).toBe('pickleball')
  })
})

/**
 * A companion link may only point somewhere navigation cannot already reach.
 *
 * The map held five links when Pull-ups, Pickleball, Strength tools and
 * Coaching lived nowhere else. All four were promoted to Body tabs, and nothing
 * failed — so the page kept drawing "Strength tools · anatomy, plates,
 * analytics ›" under the submit button while `Strength` sat in the tab row
 * forty pixels above it. Four second doors to rooms already on screen.
 *
 * This is the reverse of `sections.test.ts`'s "every view has a door": that one
 * catches a surface with no way in, this one catches a second way in. Promote a
 * companion to a tab and this fails, which is the moment to delete its entry.
 */
describe('Fitness companion links', () => {
  it('only links to views that are not already tabs', () => {
    // `SECTIONS`, not `sectionOf`. `sectionOf` reads `MEMBERS`, which lists
    // Home workout so that landing on it lights the Body rail row — it is a
    // member of the section without being one of its tabs, and asserting on it
    // fails the very entry that is still correct. The question here is whether
    // a tab row can already take you there.
    const tabs = SECTIONS.flatMap((s) => s.tabs).map((t) => t.view)
    const tabbed = Object.values(COMPANION).map((c) => c.view).filter((v) => tabs.includes(v))
    expect(tabbed).toEqual([])
  })
})
