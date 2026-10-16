import { useState } from 'react'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { platesPerSide, barExceedsTarget } from '../../lib/fitness'
import { Barbell as BarbellViz } from '../PlateStack'

/**
 * WHAT TO LOAD ON THE BAR · zone 2, beside the rest timer.
 *
 * WHAT THIS FILE OWNS: the target/bar inputs and the sentence you read at the
 * rack.
 * WHAT IT DOES NOT OWN: the plate arithmetic (`platesPerSide`) or how a loaded
 * bar is drawn (`components/PlateStack.tsx`).
 *
 * **It is not a lookup, which is why it is not on the Lookup row.** The
 * anatomy map and wger's library answer "what is this lift"; this one is used
 * standing at a rack, between sets, with a number in your head — the same
 * moment the rest timer above it belongs to. Asked as "the plate calculator
 * again as a new thing, or think where you can put it", and this is the
 * answer: beside the thing it is used with.
 *
 * **The target seeds from the session.** It defaulted to `100` forever, so the
 * first thing you did with it was retype the weight already typed into the row
 * above. It now opens on the heaviest working weight in the open logger and
 * follows it while you have not touched the field — `touched` is what stops it
 * fighting someone who typed their own number, which is the same rule
 * `useActColumn` uses for a default that must not become a rule.
 */
export function PlateCalculator({ unit, sessionTarget }: {
  unit: string
  /** The heaviest working weight in the open session, if there is one. */
  sessionTarget?: number
}) {

  /*
    DERIVED, NOT SYNCED. The target follows the session's top weight until the
    reader types their own number, and the obvious way to write that is an
    effect that calls `setTarget` when `sessionTarget` changes — which eslint's
    `react-hooks/set-state-in-effect` rejects, correctly: it renders once with
    the old value and then again with the new one, and the two-render window is
    where a half-typed value gets clobbered. Holding only what was TYPED and
    falling back to the session makes the fallback a render-time decision with
    no window at all.
  */
  const [typed, setTyped] = useState<string | null>(null)
  const target = typed ?? String(sessionTarget ?? 100)
  const retarget = (v: string) => setTyped(v)
  const [bar, setBar] = useState(unit === 'lb' ? '45' : '20')
  // Plate denominations differ by unit (kg gym plates vs lb).
  const denoms = unit === 'lb' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25]
  // One stepper click = the smallest plate on each side, the smallest change a
  // real bar can make. Thumb-sized, because this is used standing at a rack.
  const step = denoms[denoms.length - 1] * 2
  const plates = platesPerSide(Number(target) || 0, Number(bar) || 0, denoms)
  const loadable = plates.reduce((a, p) => a + p, 0) * 2 + (Number(bar) || 0)
  const barOverTarget = barExceedsTarget(Number(target) || 0, Number(bar) || 0)
  const bump = (d: number) => retarget(String(Math.max(0, (Number(target) || 0) + d)))
  return (
    <Card
      band
      collapsible
      title="Plate calculator"
      subtitle={sessionTarget != null ? `Following your top set · ${sessionTarget}${unit}` : 'What to load on the bar'}
    >
      {/* One row, always: Target's stepper trio plus Bar come to ~230px, and
          the act column never goes below 324. `max-w-*`, not `w-*` — Input's
          base `w-full` wins the width fight against a bare `w-24`, which is
          why these two stacked full-width before. */}
      <div className="mb-3 flex items-end gap-3">
        <label className="block text-body text-fg-1">
          Target ({unit})
          <span className="mt-1 flex items-center gap-1">
            <Button variant="secondary" size="icon-sm" onClick={() => bump(-step)} aria-label={`Target down ${step} ${unit}`} className="h-9 w-9 shrink-0">−</Button>
            {/* Inline widths, not utilities: `.zone-act :is(input)` (0-1-1)
                out-specifies any single-class width, which is how two earlier
                attempts (`w-24`, `max-w-20`) silently lost. */}
            <Input type="number" value={target} onChange={(e) => retarget(e.target.value)} aria-label={`Target weight (${unit})`} className="text-center" style={{ width: 84 }} />
            <Button variant="secondary" size="icon-sm" onClick={() => bump(step)} aria-label={`Target up ${step} ${unit}`} className="h-9 w-9 shrink-0">+</Button>
          </span>
        </label>
        <label className="block text-body text-fg-1">Bar ({unit})<Input type="number" value={bar} onChange={(e) => setBar(e.target.value)} className="mt-1 text-center" style={{ width: 72 }} /></label>
      </div>
      {barOverTarget ? (
        <p className="text-body text-yellow">Bar alone ({bar} {unit}) already exceeds target ({target} {unit}) — use a lighter bar.</p>
      ) : (
        <>
          <BarbellViz plates={plates} unit={unit} bar={Number(bar) || 0} />
          {/* The sentence to read off at the rack. Keyed so a change re-enters —
              the number moves with the discs. */}
          <p key={loadable} className="collapse-in mt-2 text-body text-fg-1">
            {plates.length === 0
              ? 'Just the bar, no plates needed.'
              : <>Per side: <span className="font-medium">{plates.join(' · ')}</span> = {loadable} {unit} loaded</>}
            {plates.length > 0 && loadable !== Number(target) && <span className="ml-1 text-yellow">(closest loadable to {target})</span>}
          </p>
        </>
      )}
    </Card>
  )
}
