import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { IntervalTimer } from './IntervalTimer'
import { describeIntervals, emomSteps, intervalsIn } from '../lib/holdTime'

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

describe('IntervalTimer, your numbers and the controls', () => {
  it('lets you change work, rest and rounds before you start, and runs what you set', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    const onSave = vi.fn()
    render(<IntervalTimer name="Planks" plan={intervalsIn('Planks (Tabata 20s/10s)', '', 8)!} onSave={onSave} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Work, more' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rest, less' }))
    for (let n = 0; n < 6; n++) fireEvent.click(screen.getByRole('button', { name: 'Rounds, less' }))
    expect(screen.getByText('2 rounds, 25 s work and 5 s rest')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    // Once it runs, the numbers sit behind Edit plan, out of a sweaty thumb's way.
    expect(screen.queryByRole('button', { name: 'Work, more' })).toBeNull()
    run(25_000 + 5_000 + 25_000 + 100)
    fireEvent.click(screen.getByRole('button', { name: 'Save 2 rounds' }))
    expect(onSave).toHaveBeenCalledWith([25, 25])
  })

  it('Round done moves on and counts it; Back undoes it', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<IntervalTimer name="Planks" plan={intervalsIn('Planks (Tabata 20s/10s)', '', 8)!} onSave={() => {}} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    run(5_000)
    fireEvent.click(screen.getByRole('button', { name: 'Round done' }))
    expect(screen.getByText('Rest')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save 1 round' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Skip rest' }))
    expect(screen.getByText('Round 2 of 8')).toBeTruthy()
    // Just begun: Back goes to the step before (the rest), then the round.
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Round 1 of 8')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save 0 rounds' })).toBeTruthy()
  })
})

describe('IntervalTimer forgives a real gym-goer', () => {
  const tabata = () => intervalsIn('Planks (Tabata 20s/10s)', '', 8)!
  const tap = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
  const clock = () => screen.getByRole('status', { name: /seconds left/ }).textContent

  it('pause stops the clock in work and in rest: paused time does not count', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<IntervalTimer name="Planks" plan={tabata()} onSave={() => {}} onClose={() => {}} />)
    tap('Start')
    run(5_000)
    tap('Pause')
    run(60_000)
    expect(clock()).toBe('0:15')
    tap('Resume')
    run(17_000) // into the rest, 2 s gone
    tap('Pause')
    run(60_000)
    expect(screen.getByText('Rest')).toBeTruthy()
    expect(clock()).toBe('0:08')
  })

  it('+15 s extends the rest you are in and −15 s never takes it below now', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<IntervalTimer name="Planks" plan={tabata()} onSave={() => {}} onClose={() => {}} />)
    tap('Start')
    run(22_000) // 2 s into the 10 s rest
    tap('Rest +15 s')
    expect(clock()).toBe('0:23')
    run(10_000)
    expect(screen.getByText('Rest')).toBeTruthy() // the old rest would be over by now
    tap('Rest −15 s')
    // 13 s left: −15 s ends the rest now, and round 2 starts whole, not 2 s in
    expect(screen.getByText('Work')).toBeTruthy()
    expect(screen.getByText('Round 2 of 8')).toBeTruthy()
    expect(clock()).toBe('0:20')
  })

  it('undo restores the previous round count and the clock after a mis-tapped Round done', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<IntervalTimer name="Planks" plan={tabata()} onSave={() => {}} onClose={() => {}} />)
    tap('Start')
    run(30_000 + 5_000) // round 1 done, 5 s into round 2
    tap('Round done')
    expect(screen.getByRole('button', { name: 'Save 2 rounds' })).toBeTruthy()
    tap('Undo')
    expect(screen.getByRole('button', { name: 'Save 1 round' })).toBeTruthy()
    expect(screen.getByText('Round 2 of 8')).toBeTruthy()
    expect(clock()).toBe('0:15')
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
  })

  it('redo round repeats the round just missed without losing the rounds before it', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    const onSave = vi.fn()
    render(<IntervalTimer name="Planks" plan={tabata()} onSave={onSave} onClose={() => {}} />)
    tap('Start')
    run(30_000 + 20_000 + 1_000) // rounds 1 and 2 done, 1 s into the rest after 2
    expect(screen.getByRole('button', { name: 'Save 2 rounds' })).toBeTruthy()
    tap('Redo round')
    expect(screen.getByText('Round 2 of 8')).toBeTruthy()
    expect(screen.getByText('Work')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save 1 round' })).toBeTruthy()
    run(20_100)
    tap('Pause')
    tap('Save 2 rounds')
    expect(onSave).toHaveBeenCalledWith([20, 20])
  })

  it('edit changes the remaining rounds and timings mid-session without restarting', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    const onSave = vi.fn()
    render(<IntervalTimer name="Planks" plan={tabata()} onSave={onSave} onClose={() => {}} />)
    tap('Start')
    run(5_000)
    tap('Edit plan')
    for (let n = 0; n < 5; n++) tap('Rounds, less') // 8 → 3
    tap('Work, more') // later rounds 25 s; the one you are in stays 20 s
    expect(clock()).toBe('0:15')
    expect(screen.getByText('Round 1 of 3')).toBeTruthy()
    run(15_000 + 10_000 + 25_000 + 10_000 + 25_000 + 100)
    expect(screen.getByText('3 of 3 finished')).toBeTruthy()
    tap('Save 3 rounds')
    expect(onSave).toHaveBeenCalledWith([20, 25, 25])
  })

  it('edit cannot take away a round already done or the one you are in', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    render(<IntervalTimer name="Planks" plan={tabata()} onSave={() => {}} onClose={() => {}} />)
    tap('Start')
    run(30_000 + 1_000) // in round 2
    tap('Edit plan')
    for (let n = 0; n < 10; n++) {
      const less = screen.getByRole('button', { name: 'Rounds, less' }) as HTMLButtonElement
      if (!less.disabled) fireEvent.click(less)
    }
    expect(screen.getByRole('status', { name: 'Rounds 2' })).toBeTruthy()
  })
})

describe('describeIntervals — the sheet never claims a rest the plan does not have', () => {
  const line = describeIntervals
  it('says EMOM is minutes with a beep, not work and rest', () => {
    expect(line(emomSteps(3, 3))).toBe('3 rounds of 60 s, a beep starts each')
    expect(line(intervalsIn('Planks (Tabata 20s/10s)', '', 8)!)).toBe('8 rounds, 20 s work and 10 s rest')
  })
})
