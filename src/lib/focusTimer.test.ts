import { describe, expect, it, beforeEach } from 'vitest'
import {
  PRESETS, secondsLeft, isRunning,
  start, pause, resume, reset, setPreset, advance,
  __resetFocusTimer,
} from './focusTimer'

/**
 * The properties that make this a clock rather than a counter.
 *
 * The component this replaced decremented a number on a `setInterval`, which
 * fails in the exact situation a focus timer is for: a tab you are not looking
 * at. Chrome throttles background intervals to once a minute, and a discarded
 * tab does not run them at all — so a 25-minute block measured by counting
 * seconds finished late by however long you looked away.
 */

const T0 = Date.UTC(2026, 9, 15, 9, 0, 0)

beforeEach(() => {
  localStorage.clear()
  __resetFocusTimer()
})

describe('time comes from the clock, not from how often we were allowed to tick', () => {
  it('reports the remaining time from elapsed wall time', () => {
    start('work', T0)
    // Not a single tick has run; the answer is still right.
    expect(secondsLeft(undefined, T0 + 60_000)).toBe(PRESETS[1].w * 60 - 60)
  })

  it('is correct across a gap no interval could have covered', () => {
    // The backgrounded-tab case. Twenty minutes pass with zero ticks.
    start('work', T0) // 25-minute default preset
    expect(secondsLeft(undefined, T0 + 20 * 60_000)).toBe(5 * 60)
  })

  it('clamps at zero rather than going negative', () => {
    // A phase that elapsed while the tab was closed is finished. Negative
    // seconds is not a state anything downstream should have to reason about.
    start('work', T0)
    expect(secondsLeft(undefined, T0 + 99 * 60_000)).toBe(0)
  })
})

describe('pause holds a duration, not a deadline', () => {
  it('freezes the remaining time while paused', () => {
    start('work', T0)
    pause(T0 + 60_000)
    expect(isRunning()).toBe(false)
    // Ten more minutes pass. A paused timer must not have burned them.
    expect(secondsLeft(undefined, T0 + 11 * 60_000)).toBe(24 * 60)
  })

  it('resumes from where it stopped, not from where the clock is', () => {
    start('work', T0)
    pause(T0 + 60_000)
    resume(T0 + 11 * 60_000) // resumed ten minutes later
    expect(isRunning()).toBe(true)
    expect(secondsLeft(undefined, T0 + 11 * 60_000)).toBe(24 * 60)
  })
})

describe('a finished phase hands back what the caller has to log', () => {
  it('returns the work minutes after a work block, so the session can be recorded', () => {
    // The store deliberately knows nothing about journals — writing one is the
    // caller's business. This return value is the whole interface for that.
    start('work', T0)
    expect(advance()).toBe(PRESETS[1].w)
  })

  it('returns null after a break, because a break is not a session', () => {
    start('work', T0)
    advance() // -> break
    expect(advance()).toBeNull()
  })

  it('counts work blocks and not breaks', () => {
    start('work', T0)
    advance() // work done -> break
    advance() // break done -> work
    advance() // work done -> break
    expect(dummy().blocks).toBe(2)
  })

  it('alternates work and break', () => {
    start('work', T0)
    advance()
    expect(dummy().mode).toBe('break')
    advance()
    expect(dummy().mode).toBe('work')
  })
})

describe('changing the preset stops the clock rather than moving the finish line', () => {
  it('is not running after a preset change', () => {
    // Rescaling a block in flight would silently change when it ends, which is
    // the one thing a timer must never do.
    start('work', T0)
    setPreset(2)
    expect(isRunning()).toBe(false)
    expect(secondsLeft(undefined, T0)).toBe(PRESETS[2].w * 60)
  })

  it('ignores an index that is not a preset', () => {
    setPreset(99)
    expect(dummy().presetIndex).toBe(1)
  })
})

describe('it survives the tab', () => {
  it('reset returns to the start of the phase without clearing the block count', () => {
    start('work', T0)
    advance()
    advance()
    reset()
    expect(isRunning()).toBe(false)
    expect(dummy().blocks).toBe(1)
  })

  it('writes through to storage so a reload finds the block still running', () => {
    start('work', T0)
    const raw = localStorage.getItem('bujo:focus.timer')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).endsAt).toBe(T0 + PRESETS[1].w * 60_000)
  })
})

/** Read the live state through the public surface the tests care about. */
function dummy() {
  // `secondsLeft` and friends default to the module's own state; this is just
  // a typed handle on it for the few assertions that need a field directly.
  const raw = localStorage.getItem('bujo:focus.timer')
  return raw
    ? JSON.parse(raw) as { presetIndex: number; mode: 'work' | 'break'; blocks: number }
    : { presetIndex: 1, mode: 'work' as const, blocks: 0 }
}
