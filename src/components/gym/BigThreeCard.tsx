import { Trophy } from 'lucide-react'
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
  const liftColor: Record<string, string> = { Squat: 'green', Bench: 'red', Deadlift: 'blue' }
  return (
    <Card title="Big-three total" subtitle="Squat + bench + deadlift · your powerlifting number" defer>
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
                className="rounded-xl border border-surface0 bg-base px-3 py-2.5 text-left disabled:cursor-default"
                title={l.weight > 0 ? `Best ${l.lift}: ${l.weight}${unit}${l.date ? ` on ${l.date}` : ''}` : `No ${l.lift} logged yet`}
              >
                <p className="text-xs text-subtext1">{l.lift}</p>
                <p className="text-lg font-bold" style={{ color: l.weight > 0 ? cat(liftColor[l.lift]) : cat('overlay0') }}>
                  {l.weight > 0 ? `${l.weight}${unit}` : '—'}
                </p>
                {l.date && <p className="text-[10px] text-overlay0">{prettyDay(l.date)}</p>}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-surface0 pt-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-subtext1"><Trophy size={15} style={{ color: cat('yellow') }} /> Total</span>
            <span className="text-2xl font-bold" style={{ color: cat('yellow') }}>{total.total}{unit}</span>
          </div>
          {!total.complete && <p className="mt-1 text-[11px] text-overlay0">Log all three for your true total.</p>}
        </>
      )}
    </Card>
  )
}
