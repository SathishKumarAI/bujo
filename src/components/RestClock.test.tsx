import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { RestClock } from './RestClock'

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('RestClock', () => {
  it('counts up when the plan gives no rest', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<RestClock target={null} onDismiss={() => {}} />)
    act(() => { vi.advanceTimersByTime(65_000) })
    expect(screen.getByText('Resting 1:05')).toBeTruthy()
  })

  it('counts down a ladder rest and says go when it is over', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<RestClock target={180} onDismiss={() => {}} />)
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(screen.getByText('Rest 2:00 left')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(121_000) })
    expect(screen.getByText('Rested 3:01, go')).toBeTruthy()
  })
})
