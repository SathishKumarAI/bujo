import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { IntervalTimer } from './IntervalTimer'
import { intervalsIn } from '../lib/holdTime'

afterEach(() => { cleanup(); vi.useRealTimers() })
const run = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

describe('IntervalTimer', () => {
  it('runs Tabata through work and rest on its own and saves the rounds finished', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    const onSave = vi.fn()
    render(<IntervalTimer name="Planks" plan={intervalsIn('Planks (Tabata 20s/10s)', '', 8)!} onSave={onSave} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByText('Work')).toBeTruthy()
    run(20_100)
    expect(screen.getByText('Rest')).toBeTruthy()
    expect(screen.getByText('Round 2 of 8 next')).toBeTruthy()
    run(10_000)
    expect(screen.getByText('Work')).toBeTruthy()
    run(8 * 30_000)
    expect(screen.getByText('8 of 8 finished')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Save 8 rounds' }))
    expect(onSave).toHaveBeenCalledWith([20, 20, 20, 20, 20, 20, 20, 20])
  })

  it('stops between holds, once, and the next hold runs when started', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    const onSave = vi.fn()
    render(<IntervalTimer name="Dead hangs" plan={intervalsIn('Dead hangs', '15,30,15 s', 2)!} onSave={onSave} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    run(15_200)
    run(5_000) // the clock waits: still hold 2's full 30 s, and it says rest
    expect(screen.getByText('0:30')).toBeTruthy()
    expect(screen.getByText('Rest')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Start hold 2' }))
    run(5_000)
    expect(screen.getByText('0:25')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save 1 hold' }))
    expect(onSave).toHaveBeenCalledWith([15])
  })
})
