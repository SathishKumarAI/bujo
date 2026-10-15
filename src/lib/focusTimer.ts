import { useSyncExternalStore } from 'react'

/**
 * THE focus timer, for the whole app — one timer, not one per screen.
 *
 * ── What this replaces ─────────────────────────────────────────────────────
 *
 * `components/focus/FocusTimer.tsx` held `mode`, `left`, `running` and `blocks`
 * in `useState`, and decremented `left` with a `setInterval`. Two consequences,
 * and both of them matter more than the code they came from:
 *
 * **1. The timer died when you left the page.** Navigate from Focus to Today
 * and the component unmounts, taking the countdown with it. So the timer could
 * only ever be used by someone sitting on the Focus screen watching it — which
 * is the one thing a focus timer exists to stop you doing.
 *
 * **2. A decrementing counter is not a clock.** `setInterval` is throttled hard
 * in a background tab — to once a minute in Chrome, and not at all in a
 * discarded one — so a 25-minute block measured by counting seconds finishes
 * late by however long you looked away. Which, again, is the entire session.
 *
 * ── The shape ──────────────────────────────────────────────────────────────
 *
 * **Wall clock, not a counter.** The state is `endsAt`, an epoch millisecond.
 * Time remaining is derived on read. A backgrounded tab, a slept laptop and a
 * reload all produce the right answer because none of them can change what time
 * it is. The ticking interval only forces re-renders; it never *is* the time.
 *
 * **A module store, like `authUser` and `accountStatus`.** The subscribers are
 * the Focus page's big ring and the side rail's compact readout, which live in
 * different branches of the tree — so a context would need a provider above
 * both, and the rail is in the shell while the ring is in a lazily-imported
 * view. One module, no provider to forget.
 *
 * **Persisted.** A closed tab mid-block is the normal way a block ends on a
 * phone. On load the stored `endsAt` is either still in the future (the block
 * continues) or it is not (it elapsed while you were away, and the completion
 * is reported once).
 */

export type Mode = 'work' | 'break'

export interface Preset {
  /** Work minutes. */
  w: number
  /** Break minutes. */
  b: number
  label: string
}

/** Start gentle, scale up. Unchanged from the Focus page's original list. */
export const PRESETS: readonly Preset[] = [
  { w: 15, b: 3, label: '15 / 3' },
  { w: 25, b: 5, label: '25 / 5' },
  { w: 50, b: 10, label: '50 / 10' },
]

export interface TimerState {
  presetIndex: number
  mode: Mode
  /** Epoch ms the current phase ends, or null when not running. */
  endsAt: number | null
  /** Seconds left when paused. Null unless paused mid-phase. */
  pausedLeft: number | null
  /** Completed work blocks this session. */
  blocks: number
}

const KEY = 'bujo:focus.timer'

const EMPTY: TimerState = { presetIndex: 1, mode: 'work', endsAt: null, pausedLeft: null, blocks: 0 }

function read(): TimerState {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const p = JSON.parse(raw) as Partial<TimerState>
    const i = typeof p.presetIndex === 'number' && PRESETS[p.presetIndex] ? p.presetIndex : 1
    return {
      presetIndex: i,
      mode: p.mode === 'break' ? 'break' : 'work',
      endsAt: typeof p.endsAt === 'number' ? p.endsAt : null,
      pausedLeft: typeof p.pausedLeft === 'number' ? p.pausedLeft : null,
      blocks: typeof p.blocks === 'number' ? p.blocks : 0,
    }
  } catch {
    return EMPTY
  }
}

let state: TimerState = read()
const listeners = new Set<() => void>()

function publish(next: TimerState) {
  state = next
  try { localStorage?.setItem(KEY, JSON.stringify(next)) } catch { /* storage blocked */ }
  for (const fn of listeners) fn()
}

/** Seconds of the given phase, for the current preset. */
export function phaseSeconds(s: TimerState, mode = s.mode): number {
  const p = PRESETS[s.presetIndex] ?? PRESETS[1]
  return (mode === 'work' ? p.w : p.b) * 60
}

/**
 * Seconds left right now. Derived, never stored.
 *
 * Clamped at zero rather than going negative: a phase that elapsed while the
 * tab was closed is finished, and "−412 seconds" is not a state anything
 * downstream should have to reason about.
 */
export function secondsLeft(s: TimerState = state, now = Date.now()): number {
  if (s.pausedLeft != null) return s.pausedLeft
  if (s.endsAt == null) return phaseSeconds(s)
  return Math.max(0, Math.round((s.endsAt - now) / 1000))
}

export const isRunning = (s: TimerState = state) => s.endsAt != null && s.pausedLeft == null

export function start(mode: Mode = state.mode, now = Date.now()): void {
  publish({ ...state, mode, endsAt: now + phaseSeconds(state, mode) * 1000, pausedLeft: null })
}

export function pause(now = Date.now()): void {
  if (!isRunning(state)) return
  publish({ ...state, pausedLeft: secondsLeft(state, now), endsAt: null })
}

export function resume(now = Date.now()): void {
  if (state.pausedLeft == null) return
  publish({ ...state, endsAt: now + state.pausedLeft * 1000, pausedLeft: null })
}

/** Back to the start of the current phase, stopped. */
export function reset(): void {
  publish({ ...state, endsAt: null, pausedLeft: null })
}

export function setPreset(i: number): void {
  if (!PRESETS[i]) return
  // Changing the length mid-block would silently move the finish line, so this
  // stops the clock rather than rescaling it.
  publish({ ...state, presetIndex: i, endsAt: null, pausedLeft: null })
}

/**
 * The phase ended: flip work <-> break and stand ready.
 *
 * Returns the minutes of the work block that just finished, or null when it was
 * a break — the caller logs the session, because writing to the journal is the
 * store's business and this module deliberately knows nothing about journals.
 */
export function advance(): number | null {
  const was = state.mode
  const next: Mode = was === 'work' ? 'break' : 'work'
  const minutes = was === 'work' ? (PRESETS[state.presetIndex] ?? PRESETS[1]).w : null
  publish({
    ...state,
    mode: next,
    endsAt: null,
    pausedLeft: null,
    blocks: was === 'work' ? state.blocks + 1 : state.blocks,
  })
  return minutes
}

export function clearBlocks(): void {
  publish({ ...state, blocks: 0 })
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

const snapshot = () => state

/** The timer state. Identical object for every caller, in the same tick. */
export function useFocusTimer(): TimerState {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

/** Test seam. */
export function __resetFocusTimer(): void {
  publish({ ...EMPTY })
}
