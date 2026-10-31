/**
 * How many sets a home-session line asks for: "3×12", "3x10 per side",
 * "3×45s" → 3. A line with no leading count ("Plank to failure") is one set —
 * the phone's tap counter needs at least one tap to mean "done".
 */
export const setsIn = (reps: string): number =>
  Math.max(1, Number.parseInt(reps.match(/^\s*(\d+)\s*[x×]/i)?.[1] ?? '1', 10))
