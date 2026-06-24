import { TrendingDown } from 'lucide-react'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { StalledLift } from '../../lib/fitness'

/**
 * Stalled-lift detector: exercises whose top weight hasn't improved across the
 * last few sessions, with the plateau length, nudging a deload/variation.
 * Read-only — derived from exercise progression.
 */
export function StalledLifts({ lifts, unit, setFocusEx }: { lifts: StalledLift[]; unit: string; setFocusEx: (e: string | null) => void }) {
  if (lifts.length === 0) return null // nothing plateaued → hide
  return (
    <Card title="Stalled lifts" subtitle="No new top set in the last 3+ sessions · time for a reset or variation" defer>
      <ul className="space-y-1.5 text-sm">
        {lifts.slice(0, 6).map((l) => (
          <li key={l.exercise}>
            <button
              onClick={() => setFocusEx(l.exercise)}
              className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-surface0/50"
              title={`${l.exercise} stuck at ${l.top}${unit} across ${l.sessions} sessions (last ${l.lastDate})`}
            >
              <span className="inline-flex min-w-0 items-center gap-1.5 text-subtext1">
                <TrendingDown size={14} style={{ color: cat('red') }} /> <span className="truncate">{l.exercise}</span>
              </span>
              <span className="shrink-0 text-overlay0">
                <span className="font-semibold" style={{ color: cat('peach') }}>{l.top}{unit}</span>
                <span className="ml-1.5 text-[10px]">{l.sessions} sessions</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
