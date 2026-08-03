import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFocusTrap } from './useFocusTrap'

/** A minimal stand-in for the hand-rolled overlays (palette, enlarge modals). */
function Overlay({ onClose }: { onClose: () => void }) {
  const trap = useFocusTrap<HTMLDivElement>(true)
  return (
    <div ref={trap} role="dialog" aria-label="overlay">
      <input aria-label="query" />
      <button onClick={onClose}>close</button>
    </div>
  )
}

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(true)}>open</button>
      <button>outside</button>
      {open && <Overlay onClose={() => setOpen(false)} />}
    </div>
  )
}

describe('useFocusTrap', () => {
  it('moves focus into the overlay when it opens', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('open'))
    expect(document.activeElement).toBe(screen.getByLabelText('query'))
  })

  it('keeps Tab inside the overlay instead of walking into the page behind it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('open'))

    await user.tab() // query → close
    expect(document.activeElement).toBe(screen.getByText('close'))

    await user.tab() // close → wraps back to query, does NOT reach "outside"
    expect(document.activeElement).toBe(screen.getByLabelText('query'))
  })

  it('wraps backwards from the first element to the last', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('open'))

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(screen.getByText('close'))
  })

  it('restores focus to the opener when the overlay closes', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByText('open')
    await user.click(opener)
    await user.click(screen.getByText('close'))
    expect(document.activeElement).toBe(opener)
  })

  it('focuses the container itself when nothing inside is tabbable', () => {
    function Bare() {
      const trap = useFocusTrap<HTMLDivElement>(true)
      return <div ref={trap} role="dialog" aria-label="bare">nothing to focus</div>
    }
    render(<Bare />)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })

  it('does nothing while inactive', () => {
    function Inert() {
      const trap = useFocusTrap<HTMLDivElement>(false)
      return (
        <div ref={trap} role="dialog" aria-label="inert">
          <button>inside</button>
        </div>
      )
    }
    render(<Inert />)
    expect(document.activeElement).toBe(document.body)
  })
})
