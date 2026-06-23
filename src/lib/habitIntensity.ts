import type { Habit, JournalData } from './types'
import { habitIntensity, habitTarget, habitValueOn } from './stats'

/**
 * Per-day heatmap intensity for a single habit, reusing the shared 0–4
 * `habitIntensity` scale (check → on/off; count/timer → thirds of target;
 * rating → value/5). This is the data-bound counterpart of the pure
 * `habitIntensity(type, value, target)` in stats.ts: it reads the habit's logged
 * value for `day` and maps it to a level, so a calendar heatmap can shade
 * partial days (e.g. 4 of 8 glasses) instead of only full/empty. Pure +
 * unit-tested.
 */
export function dayIntensity(data: JournalData, habit: Habit, day: string): 0 | 1 | 2 | 3 | 4 {
  const type = habit.type ?? 'check'
  return habitIntensity(type, habitValueOn(data, habit, day), habitTarget(habit))
}

/**
 * Opacity ramp (0–1) for a 0–4 intensity level, for inline `style.opacity` on a
 * coloured heatmap cell. Level 0 stays fully transparent (caller paints the
 * empty background); levels 1–4 ramp from a faint tint to solid so the eye reads
 * "more done = stronger colour". Pure.
 */
export function intensityOpacity(level: 0 | 1 | 2 | 3 | 4): number {
  return level === 0 ? 0 : 0.25 + (level / 4) * 0.75
}
