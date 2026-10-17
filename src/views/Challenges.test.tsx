import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Challenges } from './Challenges'
import { generateDemoData } from '../lib/demo'
import { challengeRuleKey } from '../lib/recordKeys'
import { addDays, todayISO } from '../lib/date'

/**
 * THE DAY GRID IS A WAY IN, not a picture.
 *
 * Seventy-five cells reached nothing and `challengeNotes` had one reader —
 * `RuleNote`, rendered for `today` and no other day — so a note written this
 * morning could never be read back, corrected or removed. `lib/demo.ts` had
 * been seeding fourteen notes across nine days that nothing on the page could
 * show, which is the "a card that never renders cannot fail" shape wearing a
 * record rather than a card.
 *
 * These tests are the journey, not the arithmetic: `lib/challenges.test.ts`
 * owns `ruleCompletion`'s counting.
 */
function mount() {
  localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
  return render(
    <NavProvider navigate={() => {}}>
      <CursorProvider>
        <ConfirmProvider>
          <JournalProvider>
            <Challenges />
          </JournalProvider>
        </ConfirmProvider>
      </CursorProvider>
    </NavProvider>,
  )
}

/** The demo's one active challenge, read back the way the page reads it. */
function demoChallenge() {
  const d = JSON.parse(localStorage.getItem('bujo:data')!)
  return d.challenges[0]
}

afterEach(() => localStorage.clear())

describe('Challenges · a day opens the day', () => {
  it('draws every day of the challenge as a control, not an inert cell', () => {
    const { container } = mount()
    const c = demoChallenge()
    // Anchored on structure: the grid is the only `ul` of buttons in the
    // review, and the count is the challenge's own duration. A test keyed to
    // the heading would break on the next rewording and say nothing about the
    // behaviour.
    const cells = container.querySelectorAll('.zone-review ul button[aria-pressed]')
    expect(cells).toHaveLength(c.durationDays)
  })

  it('stands on the rule-by-rule panel until a day is picked', () => {
    const { container } = mount()
    const c = demoChallenge()
    // SCOPED to the panel. The act column names every rule too, so an
    // unscoped `getAllByText(rule)` passes with this panel missing entirely —
    // a scan that matches the wrong thing passes.
    const panel = container.querySelector('[data-day-panel="rules"]')!
    expect(panel, 'the review stands on the rule list, not on a placeholder').toBeTruthy()
    for (const rule of c.rules) {
      expect(within(panel as HTMLElement).getByText(rule)).toBeInTheDocument()
    }
    // Each rule carries its own count over the elapsed window — the question
    // the page could not answer: how many days were complete, but never which
    // rule broke the rest.
    expect(within(panel as HTMLElement).getAllByText(/^of \d+$/)).toHaveLength(c.rules.length)
  })

  it('shows a past day its own saved note — the one nothing could read', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const c = demoChallenge()
    const d = JSON.parse(localStorage.getItem('bujo:data')!)
    const day = addDays(todayISO(), -3)
    const saved = d.challengeNotes[challengeRuleKey(c.id, day, 0)]
    expect(saved, 'the demo seeds a note on this day').toBeTruthy()

    const cells = [...container.querySelectorAll<HTMLButtonElement>('.zone-review ul button[aria-pressed]')]
    // Find the cell by the date in its accessible name rather than by index:
    // the index is arithmetic this test should not be repeating.
    const cell = cells.find((b) => (b.textContent ?? '').includes(day))!
    expect(cell, `no day cell for ${day}`).toBeTruthy()
    await user.click(cell)

    expect(cell).toHaveAttribute('aria-pressed', 'true')
    // The note is in an input, so it is editable as well as visible — add
    // without edit is the bug docs/USER-CONTROL.md exists for.
    expect(screen.getAllByDisplayValue(saved).length).toBeGreaterThan(0)
  })

  it('ticks a past day on that day, not on today', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const c = demoChallenge()
    const day = addDays(todayISO(), -3)
    const before = JSON.parse(localStorage.getItem('bujo:data')!).challengeLog[c.id]

    const cell = [...container.querySelectorAll<HTMLButtonElement>('.zone-review ul button[aria-pressed]')]
      .find((b) => (b.textContent ?? '').includes(day))!
    await user.click(cell)

    const panel = container.querySelector('.zone-review [role="checkbox"]')!.closest('ul')!
    const boxes = within(panel as HTMLElement).getAllByRole('checkbox')
    // The last rule is the one the demo leaves unticked on a short day; either
    // way, flipping it must land on `day` and leave today alone.
    await user.click(boxes[boxes.length - 1])

    const after = JSON.parse(localStorage.getItem('bujo:data')!).challengeLog[c.id]
    expect(after[day], 'the picked day changed').not.toEqual(before[day])
    expect(after[todayISO()], 'today was left alone').toEqual(before[todayISO()])
  })

  it('does not offer a tick on a day that has not happened', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const ahead = addDays(todayISO(), 5)
    const cell = [...container.querySelectorAll<HTMLButtonElement>('.zone-review ul button[aria-pressed]')]
      .find((b) => (b.textContent ?? '').includes(ahead))!
    await user.click(cell)
    // "Not done yet" and "missed" are different claims, and a tickable box on
    // a day that has not happened invites the first to be recorded as the
    // second.
    expect(container.querySelector('.zone-review [role="checkbox"]')).toBeNull()
  })
})
