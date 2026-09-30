import { ChipPick } from '../ui/quickpick'
import { GOAL_LABEL, type CycleGoal } from '../../lib/cycleHelp'

/**
 * WHAT THIS PAGE IS FOR, as far as you are concerned.
 *
 * Two modes that change ORDER and EMPHASIS and nothing else. No field is hidden
 * in either — the fertility signs stay available to someone tracking symptoms,
 * and the pattern grid stays available to someone trying to conceive, because
 * the app does not get to decide which half of her own data a person needs.
 *
 * Stored locally like everything else on this page.
 */
export function CycleGoalCard({ goal, onChange, cycles }: {
  goal: CycleGoal
  onChange: (g: CycleGoal) => void
  /** Completed cycles, for the conceive-mode clinician note. */
  cycles: number
}) {
  return (
    <div>
      {/* `ChipPick`, not a second chip implementation — it carries the pill
          radius, the rest fill and the press feedback the rest of the app uses. */}
      <ChipPick
        label="This page leads with"
        value={goal}
        onChange={(g) => onChange(g as CycleGoal)}
        options={(['understand', 'conceive'] as const).map((g) => ({ value: g, label: GOAL_LABEL[g] }))}
      />

      <p className="mt-3 text-label text-fg-2">
        {goal === 'conceive'
          ? 'Fertility signs come first when you log a day, and the fertile window leads the header. Everything else stays where it is.'
          : 'Patterns and symptoms lead. The fertility fields are still there, one tap down.'}
      </p>

      {/* The clinician note appears only once there is enough history for it to
          mean anything. Shown at six cycles, which is roughly six months of
          trying — the point at which the guidance itself changes. */}
      {goal === 'conceive' && cycles >= 6 && (
        <p className="mt-3 border-t border-line pt-2 text-body text-fg-1">
          Worth a conversation with a clinician if you have been trying for 12 months — or 6 months
          if you are 35 or older.
        </p>
      )}
    </div>
  )
}
