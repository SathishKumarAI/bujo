import { Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Empty } from '../ui'
import { cat } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { BigThreeTotal } from '../../lib/fitness'

/**
 * Big-three powerlifting total: best squat + bench + deadlift, with each lift's
 * PR and the running sum. Missing lifts show a dash and a hint to log them.
 * Read-only — derived from logged PRs via bigThreeTotal.
 */
export function BigThreeCard({ total, unit, setFocusEx }: { total: BigThreeTotal; unit: string; setFocusEx: (e: string | null) => void }) {
  // The three numbers used to be green / red / blue — an arbitrary mapping
  // nothing else in the app shares, and three accents where the page contract
  // allows one. It was also unreadable: `cat('green')` as 17px text on
  // `bg-ink-0` measured **1.41:1 in latte** (axe, all three nodes), because the
  // palette accents are tuned to sit on a near-black card and ink-0 is
  // near-white in the light themes. Same family as the `cat('crust')` trap.
  //
  // `npm run a11y` never reported it: the gate does not open folds, and this
  // card now sits inside "Strength standards", which is shut by default. Found
  // by re-running axe with every fold on the page forced open — do that when
  // you add or move one.
  return (
    <Card band title="Big-three total" subtitle="Squat + bench + deadlift, your powerlifting number" defer>
      {total.total === 0 ? (
        <Empty>Log a squat, bench, and deadlift to build your total.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {total.lifts.map((l) => (
              <button
                key={l.lift}
                onClick={() => l.weight > 0 && setFocusEx(l.lift)}
                disabled={l.weight === 0}
                className="rounded-none border border-line bg-ink-0 px-3 py-2.5 text-left disabled:cursor-default"
                title={l.weight > 0 ? `Best ${l.lift}: ${l.weight}${unit}${l.date ? ` on ${l.date}` : ''}` : `No ${l.lift} logged yet`}
              >
                <p className="text-label text-fg-1">{l.lift}</p>
                <p className={`text-heading font-medium ${l.weight > 0 ? 'text-fg-1' : 'text-fg-2'}`}>
                  {l.weight > 0 ? `${l.weight}${unit}` : '—'}
                </p>
                {l.date && <p className="text-micro text-fg-2">{prettyDay(l.date)}</p>}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="inline-flex items-center gap-1.5 text-body text-fg-1"><Icon as={Trophy} size="sm" style={{ color: cat('yellow') }} /> Total</span>
            <span className="text-title font-medium" style={{ color: cat('yellow') }}>{total.total}{unit}</span>
          </div>
          {!total.complete && <p className="mt-1 text-caption text-fg-2">Log all three for your true total.</p>}
        </>
      )}
    </Card>
  )
}
