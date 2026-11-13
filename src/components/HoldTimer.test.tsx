import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HoldTimer } from './HoldTimer'

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('HoldTimer, the big timer on a timed exercise', () => {
  it('counts up from the clock, says when the target is reached, and saves whole seconds', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    const onSave = vi.fn()
    render(<HoldTimer name="Plank" target={20} onSave={onSave} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => { vi.advanceTimersByTime(21_400) })
    expect(screen.getByText('0:21')).toBeTruthy()
    expect(screen.getByText('Target reached')).toBeTruthy()
    // Paused time does not count.
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    act(() => { vi.advanceTimersByTime(10_000) })
    fireEvent.click(screen.getByRole('button', { name: 'Save 21 s' }))
    expect(onSave).toHaveBeenCalledWith(21)
  })

  it('cannot save nothing', () => {
    render(<HoldTimer name="Plank" target={null} onSave={() => {}} onClose={() => {}} />)
    expect((screen.getByRole('button', { name: 'Save 0 s' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
