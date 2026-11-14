import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RestClock } from './RestClock'

afterEach(() => { cleanup(); vi.useRealTimers() })
const run = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })
const tap = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('RestClock', () => {
  it('counts up when the plan gives no rest', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<RestClock target={null} onDismiss={() => {}} />)
    run(65_000)
    expect(screen.getByText('Resting 1:05')).toBeTruthy()
  })

  it('counts down a ladder rest and says go when it is over', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<RestClock target={180} onDismiss={() => {}} />)
    run(60_000)
    expect(screen.getByText('Rest 2:00 left')).toBeTruthy()
    run(121_000)
    expect(screen.getByText('Rested 3:01, go')).toBeTruthy()
  })
})

describe('RestClock forgives', () => {
  it('pause stops the clock: paused time is not counted as rest', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<RestClock target={null} onDismiss={() => {}} />)
    run(10_000)
    tap('Pause')
    run(60_000)
    expect(screen.getByText('Resting 0:10, paused')).toBeTruthy()
    tap('Resume')
    run(5_000)
    expect(screen.getByText('Resting 0:15')).toBeTruthy()
  })

  it('+15 s extends the rest and −15 s never takes it below nothing left', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<RestClock target={60} onDismiss={() => {}} />)
    run(10_000)
    tap('Rest +15 s')
    expect(screen.getByText('Rest 1:05 left')).toBeTruthy()
    for (let n = 0; n < 6; n++) if (screen.queryByRole('button', { name: 'Rest −15 s' })) tap('Rest −15 s')
    expect(screen.getByText('Rested 0:10, go')).toBeTruthy()
  })

  it('Stop dismisses it, named in words', () => {
    const onDismiss = vi.fn()
    render(<RestClock target={null} onDismiss={onDismiss} />)
    tap('Stop the rest clock')
    expect(onDismiss).toHaveBeenCalled()
  })
})
