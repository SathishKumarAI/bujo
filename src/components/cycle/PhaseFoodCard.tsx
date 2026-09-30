import { CONCEIVE_FOOD_NOTE, FOOD_FOOTER, PHASE_FOOD, type CycleGoal } from '../../lib/cycleHelp'

/**
 * THIS PHASE · a short nutrition focus for where you are.
 *
 * Small and non-accent by design. It is the least important card on the page —
 * general wellness information beside a chart of someone's actual measurements
 * — and giving it the accent would put it above the data.
 *
 * Deliberately unquantified: no grams, no targets, no supplement doses. The
 * moment this reads like a plan it is dietary advice, and a page that has just
 * disclaimed being medical care cannot then prescribe. The footer says so in
 * the card, not only in the page footer, because this is the one card someone
 * might screenshot on its own.
 */
export function PhaseFoodCard({ phase, goal }: { phase: string | null; goal: CycleGoal }) {
  const current = PHASE_FOOD.find((p) => p.phase.toLowerCase() === (phase ?? '').toLowerCase())

  return (
    <div>
      {current ? (
        <p className="text-body text-fg-1">
          <span className="font-medium">{current.phase}</span> · {current.focus}
        </p>
      ) : (
        <p className="text-body text-fg-2">Log a period start and this shows the focus for where you are.</p>
      )}

      {goal === 'conceive' && (
        <p className="mt-2 text-body text-fg-1">{CONCEIVE_FOOD_NOTE}</p>
      )}

      <ul className="mt-3 space-y-1 border-t border-line pt-2">
        {PHASE_FOOD.filter((p) => p !== current).map((p) => (
          <li key={p.phase} className="text-label text-fg-2">
            <span className="text-fg-1">{p.phase}</span> · {p.focus}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-label text-fg-2">{FOOD_FOOTER}</p>
    </div>
  )
}
