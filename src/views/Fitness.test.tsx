import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { Fitness } from './Fitness'

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
