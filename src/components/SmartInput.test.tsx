import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { SmartInput } from './SmartInput'

/**
 * The blur timer, and why it is worth a test for five lines of cleanup.
 *
 * `onBlur` delays closing the suggestion list by 120ms so a click on a
 * suggestion can land before the list disappears. That delay is correct. What
 * was wrong is that the timer was fire-and-forget: nothing held it, so nothing
 * could cancel it, and it outlived the component.
 *
 * In the app that is a `setState` on an unmounted node, which React 18 swallows
 * — invisible. In a test it fires after the jsdom environment is torn down and
 * reaches for a `window` that is gone, which vitest reports as an **unhandled
 * error**: CI goes red with `Tests 1624 passed` and no failing test to look at.
 * It cost a confused investigation precisely because it struck a
 * documentation-only PR, where it could not possibly have been the diff.
 *
 * Both assertions below fail if the cleanup is removed.
 */
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const props = {
  value: '',
  onChange: () => {},
  onSubmit: () => {},
  suggestCtx: { tags: [], recents: [], habits: [] },
  dupItems: [],
  // The prop is literally `'aria-label'`, not `ariaLabel` — the component
  // destructures the hyphenated name. Worth the note: the first draft of this
  // file passed `ariaLabel` and the input rendered with no accessible name at
  // all, which `getByLabelText` reported as "unable to find a label".
  'aria-label': 'Capture',
}

describe('the blur timer never outlives the component', () => {
  it('cancels the pending close on unmount', () => {
    vi.useFakeTimers()
    const clear = vi.spyOn(globalThis, 'clearTimeout')
    const { getByLabelText, unmount } = render(<SmartInput {...props} />)
    fireEvent.blur(getByLabelText('Capture'))
    // A timer is now pending. Before the fix, nothing held its id, so this
    // unmount left it armed to fire into a torn-down environment 120ms later.
    unmount()
    expect(clear).toHaveBeenCalled()
    // And nothing is left to run: advancing past the delay must be a no-op.
    expect(() => vi.advanceTimersByTime(500)).not.toThrow()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not stack a timer per blur', () => {
    vi.useFakeTimers()
    const { getByLabelText } = render(<SmartInput {...props} />)
    const input = getByLabelText('Capture')
    fireEvent.blur(input)
    fireEvent.blur(input)
    fireEvent.blur(input)
    // Three blurs, one pending close — the id is reused, not accumulated.
    expect(vi.getTimerCount()).toBe(1)
  })
})
