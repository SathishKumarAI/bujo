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
