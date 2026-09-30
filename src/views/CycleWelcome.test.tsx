/**
 * THE FIRST-RUN GATE.
 *
 * Covered here rather than by the browser gates on purpose. `a11y-axe`,
 * `space-audit` and `clipped-text` all load `?demo=1`, and the demo journal
 * seeds the acknowledgement so those three keep grading the Cycle page rather
 * than a welcome screen — see the note in `lib/demo.ts`. That leaves the gate
 * itself unexercised by anything walking the DOM, which is what this file is
 * for: the failure mode is *state*, not pixels.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Cycle } from './Cycle'
import { CYCLE_DISCLAIMER_VERSION } from '../lib/cycleGuide'
import { generateDemoData } from '../lib/demo'

function mount(ack?: number) {
  const d = generateDemoData()
  d.settings.cycleDisclaimerAck = ack
  localStorage.setItem('bujo:data', JSON.stringify(d))
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

describe('the Cycle page does not show itself before the promises are acknowledged', () => {
  it('shows the welcome instead of the page on a fresh journal', () => {
    mount(undefined)
    expect(screen.getByRole('heading', { name: /before you start/i })).toBeTruthy()
    // The page proper must NOT be behind it — the acknowledgement is about data
    // that has not been collected yet, so a log on screen makes it decorative.
    expect(screen.queryByText(/Log a day/i)).toBeNull()
  })

  it('states the three promises the user is acknowledging', () => {
    mount(undefined)
    expect(screen.getByText(/stays on this device/i)).toBeTruthy()
    expect(screen.getByText(/responsible for it/i)).toBeTruthy()
    expect(screen.getByText(/not medical care/i)).toBeTruthy()
  })

  it('keeps Continue disabled until the box is ticked', async () => {
    const user = userEvent.setup()
    mount(undefined)
    const button = screen.getByRole('button', { name: /continue/i })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    await user.click(screen.getByRole('checkbox'))
    expect((button as HTMLButtonElement).disabled).toBe(false)
  })

  it('reveals the page once acknowledged, and remembers it', async () => {
    const user = userEvent.setup()
    mount(undefined)
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.queryByRole('heading', { name: /before you start/i })).toBeNull()
    const saved = JSON.parse(localStorage.getItem('bujo:data')!)
    expect(saved.settings.cycleDisclaimerAck).toBe(CYCLE_DISCLAIMER_VERSION)
  })

  it('does not show the welcome to a journal that already accepted this version', () => {
    mount(CYCLE_DISCLAIMER_VERSION)
    expect(screen.queryByRole('heading', { name: /before you start/i })).toBeNull()
  })

  /**
   * The whole reason the acknowledgement is a version and not a boolean: an
   * acknowledgement of different text is not an acknowledgement of this text.
   */
  it('re-asks when the promises change, not just when they were never seen', () => {
    mount(CYCLE_DISCLAIMER_VERSION - 1)
    expect(screen.getByRole('heading', { name: /before you start/i })).toBeTruthy()
  })

  it('shows the local-only line on the page once past the gate', () => {
    mount(CYCLE_DISCLAIMER_VERSION)
    expect(screen.getByText(/stored on this device only/i)).toBeTruthy()
  })
})
