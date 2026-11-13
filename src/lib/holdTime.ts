/**
 * The seconds a timed exercise asks for, read from its plan text — or null
 * when the plan is reps. "20s work" 20, "45 s" 45, "30 s each side" 30,
 * "15,30,15 s" 15 (the first hold), "1 min" 60, "10 min" 600, "3×45s" 45,
 * "3 sets of 45 s" 45. Decides which exercise cards get the big timer
 * (`components/HoldTimer.tsx`) and what it counts toward.
 */
export function secondsIn(plan: string): number | null {
  const min = /(\d+)\s*min\b/i.exec(plan)
  if (min) return Number(min[1]) * 60
  // A trailing "s" after the number (or after a comma-list of numbers), not
  // the "s" of "sets" or "reps".
  const sec = /(\d+)(?:\s*,\s*\d+)*\s*s(?:ec(?:onds?)?)?\b/i.exec(plan.replace(/\d+\s*sets?\b/gi, ''))
  return sec ? Number(sec[1]) : null
}

/** 0:20, 1:05, 10:00 — minutes and two-digit seconds. */
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** One stretch of an interval timer: on the bar or floor, or resting. */
export type Step = { kind: 'work' | 'rest'; secs: number; label: string }
/** `manual`: the clock stops after each step and you start the next one. */
export type Intervals = { steps: Step[]; manual: boolean }

/**
 * The run of steps a card's plan asks for, or null for a single hold.
 * - Tabata ("Planks (Tabata 20s/10s)", 8 sets): 20 s work, 10 s rest, eight
 *   rounds, no rest after the last. The clock runs through all of it.
 * - A list of holds ("15,30,15 s"): each hold in turn; the clock stops
 *   between them, because the program gives no rest time and you take
 *   what you need.
 */
export function intervalsIn(name: string, plan: string, sets: number): Intervals | null {
  const tab = /tabata\D*(\d+)\s*s?\s*\/\s*(\d+)\s*s?/i.exec(`${name} ${plan}`)
  if (tab) {
    const on = Number(tab[1]), off = Number(tab[2]), n = Math.max(1, sets)
    return {
      manual: false,
      steps: Array.from({ length: n }, (_, i): Step[] => [
        { kind: 'work', secs: on, label: `Round ${i + 1} of ${n}` },
        ...(i < n - 1 ? [{ kind: 'rest' as const, secs: off, label: `Round ${i + 2} of ${n} next` }] : []),
      ]).flat(),
    }
  }
  const list = /(\d+(?:\s*,\s*\d+)+)\s*s\b/i.exec(plan)
  if (list) {
    const xs = list[1].split(',').map(Number)
    return { manual: true, steps: xs.map((secs, i) => ({ kind: 'work', secs, label: `Hold ${i + 1} of ${xs.length}` })) }
  }
  return null
}

/** Which step the clock is in after `ms`, and whole seconds left in it. `i === steps.length` once it is over. */
export function stepAt(steps: Step[], ms: number): { i: number; left: number } {
  let t = ms / 1000
  for (let i = 0; i < steps.length; i++) {
    if (t < steps[i].secs) return { i, left: Math.ceil(steps[i].secs - t) }
    t -= steps[i].secs
  }
  return { i: steps.length, left: 0 }
}

/** Seconds from the start to the beginning of step `i`. */
export const startOf = (steps: Step[], i: number) => steps.slice(0, i).reduce((s, x) => s + x.secs, 0)

/**
 * EMOM as a clock: one 60-second step per minute, each a fresh start. The
 * beep on every switch is the "go" — what is left of the minute is your rest.
 */
export function emomSteps(minutes: number, reps: number): Intervals {
  const n = Math.max(1, minutes)
  return {
    manual: false,
    steps: Array.from({ length: n }, (_, i) => ({ kind: 'work' as const, secs: 60, label: `Minute ${i + 1} of ${n}: ${reps} ${reps === 1 ? 'rep' : 'reps'}, then rest` })),
  }
}

/** The sheet's one line: what this clock will do. */
export function describeIntervals({ steps, manual }: Intervals): string {
  const works = steps.filter((s) => s.kind === 'work').length
  const rest = steps.find((s) => s.kind === 'rest')
  if (manual) return `${works} holds, start each one when you are ready`
  return rest ? `${works} rounds, ${steps[0].secs} s work and ${rest.secs} s rest` : `${works} rounds of ${steps[0].secs} s, a beep starts each`
}
