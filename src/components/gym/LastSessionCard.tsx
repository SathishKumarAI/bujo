import { ArrowsClockwise } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Empty } from '../ui'
import { Button } from '../ui/button'
import { prettyDay } from '../../lib/date'
import { splitMeta } from '../../lib/fitness'
import type { LastSessionOfSplit } from '../../lib/fitness'
import type { Split } from '../../lib/types'

/**
 * LAST TIME · what you lifted the last time you trained this split.
 *
 * The most-used number in a gym, and this page had no answer to it. The
 * logger opened empty, the lift table gives an all-time best rather than last
 * Tuesday, and the per-exercise progression chart is four folds down — so
 * loading the bar meant remembering, or leaving the app.
 *
 * It lives in **zone 2**, beside the logger, because it is part of the act
 * rather than a read-back: you look at it with a bar in front of you, between
 * choosing the split and typing the first weight. That is also the measured
 * problem it solves. At 1440 the act column was **585px against a 1,365px
 * review** — roughly 495 × 780px of empty page beside the form, because a
 * five-row logger and a rest timer do not fill a sticky column. The fix for
 * dead space is not a wider gutter; it is the thing that should have been
 * there.
 *
 * "Load these" seeds the logger with the same exercises through the routine
 * path the quick-load chips already use, so there is one way rows get filled.
 * It deliberately carries the **exercises and not the weights**: last week's
 * load is a reference, and pre-filling it invites confirming a number you
 * have not lifted yet.
 */
export function LastSessionCard({ session, split, unit, onLoad }: {
  session: LastSessionOfSplit | null
  split: Split
  unit: string
  onLoad: (exercises: string[], split: Split) => void
}) {
  const label = splitMeta(split).label
  return (
    <Card
      band
      title={`Last ${label.toLowerCase()} day`}
      subtitle={session ? prettyDay(session.date) : 'Nothing logged for this split yet'}
      hideInfo
      right={session ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onLoad(session.lifts.map((l) => l.exercise), split)}
          className="inline-flex items-center gap-1.5"
        >
          <Icon as={ArrowsClockwise} size="sm" /> Load these
        </Button>
      ) : undefined}
    >
      {!session ? (
        <Empty>Finish a {label.toLowerCase()} session and it shows up here next time.</Empty>
      ) : (
        <ul className="space-y-1 text-body">
          {session.lifts.map((l) => (
            <li key={l.exercise} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1 last:border-b-0">
              <span className="min-w-0 truncate text-fg-1">{l.exercise}</span>
              {/* Every set, not just the top one: "60×8, 65×6, 65×5" is the
                  shape of the session, and whether the last set held is the
                  thing that decides today's load. An unloaded lift prints its
                  reps — a bodyweight dip is not a lift of zero. */}
              <span className="num shrink-0 text-label text-fg-2">
                {l.sets
                  .map((s) => (s.weight ? `${s.weight}${unit}×${s.reps ?? '?'}` : `×${s.reps ?? '?'}`))
                  .join('  ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
