import { musclesForExercise } from '../../lib/fitness'
import { muscleNames } from '../../lib/muscles'
import { MuscleMap } from '../MuscleMap'
import type { ProgramDay } from '../../lib/programs'

/**
 * What the selected day works, drawn on a body.
 *
 * Strength shows the same map in its right rail driven by the lift you are
 * logging; this one is driven by the whole day, which is the question the
 * Program page actually asks — "today is PUSH, what does that hit?".
 *
 * Unmapped names — cardio, "Sprints", the pull-up program's assessments —
 * contribute nothing, and a day that maps to nothing renders nothing rather
 * than a blank body.
 */
export function DayAnatomy({ day }: { day: ProgramDay }) {
  const muscles = [...new Set(day.exercises.flatMap((e) => musclesForExercise(e.name)))]
  if (muscles.length === 0) return null
  return (
    <div>
      <p className="mb-2 text-label tracking-wide text-fg-2 uppercase">What {day.focus} hits</p>
      <MuscleMap muscles={muscles} />
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {muscleNames(muscles).map((m) => (
          <span key={m} className="border border-line px-2.5 py-0.5 text-label text-fg-2">{m}</span>
        ))}
      </div>
    </div>
  )
}
