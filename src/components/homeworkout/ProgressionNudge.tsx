import { Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Pill } from '../ui'
import { Button } from '../ui/button'
import { EQUIPMENT_LABEL, type HomeExercise } from '../../lib/homeExercises'
import type { Progression } from '../../lib/homeProgress'

/**
 * ZONE 1/2 · the movements you have outgrown, and the next one in each chain.
 *
 * The library has carried `easier`/`harder` on 30 of its 83 movements since it
 * was written, and `progressionChain` rendered that chain in the catalogue —
 * where you read it while browsing, which is the one moment you are not asking
 * "what should I do today". Nothing ever read the chain back against what had
 * actually been logged, so the page could show you an 83-movement library and
 * never once tell you to move on.
 *
 * **The evidence is on screen, as text.** `met 6 of 6 sessions · best 12`, not
 * an arrow with the sample size in a `title`: a tooltip loses to an arrow on a
 * desktop and does not exist at all on a phone, which is how a lapse once read
 * as a 5.0 → 6.5 improvement in this app. The claim being made here is "you
 * have completed this prescription N times", so N is the sentence.
 *
 * **The equipment is named** whenever the next movement needs any. This is a
 * *home* library — "what you have" is one of the three filters in the catalogue
 * for exactly that reason — and a suggestion to buy a kettlebell is not a
 * suggestion. It is stated rather than filtered because nothing persists which
 * kit you own yet (`exercisesForKit` exists and has no call site); when that
 * lands, this list should narrow instead of explain.
 *
 * Renders nothing when there is nothing to suggest. An empty "ready to
 * progress" frame is a page telling you it has an opinion when it does not.
 */
export function ProgressionNudge({ rows, onAdd }: {
  rows: Progression[]
  onAdd: (ex: HomeExercise) => void
}) {
  if (rows.length === 0) return null

  return (
    <Card
      title="Ready to progress"
      subtitle={`${rows.length} movement${rows.length === 1 ? '' : 's'} you have been completing`}
    >
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.from.id} className="min-w-0 rounded-card bg-ink-2 p-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-label text-fg-2">{r.from.name}</span>
              {/* The glyph carries the relation visually and nothing to a
                  screen reader, which would otherwise hear two movement names
                  side by side and no link between them. */}
              <span className="text-label text-fg-2" aria-hidden>→</span>
              <span className="sr-only">progresses to</span>
              <span className="text-body font-medium text-fg-1">{r.to.name}</span>
              {r.to.equipment !== 'none' && (
                <Pill tone="muted" size="micro" className="px-2">needs {EQUIPMENT_LABEL[r.to.equipment]}</Pill>
              )}
            </div>
            {/* The sentence IS the evidence. `met` against `logged` rather than
                `met` alone, so three good sessions out of nine cannot read the
                same as three out of three. */}
            <p className="mt-1 text-label text-fg-2">
              <span className="num">{r.target}</span> met in <span className="num">{r.met}</span> of{' '}
              <span className="num">{r.logged}</span> session{r.logged === 1 ? '' : 's'} · best set{' '}
              <span className="num">{r.bestReps}</span>
            </p>
            {/* `flex-wrap` on the cluster: `Card` caps its own slots and cannot
                wrap markup it does not own. */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAdd(r.to)}
                className="ml-auto text-fg-1 hover:border-mauve"
                aria-label={`Add ${r.to.name} ${r.to.reps} to today’s session`}
              >
                <Icon as={Plus} size="sm" /> {r.to.reps}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
