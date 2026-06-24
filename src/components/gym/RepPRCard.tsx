import { Card } from '../ui'
import { cat } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { RepPR } from '../../lib/fitness'

/**
 * Rep records for the focused lift: the most reps ever done at each weight, so
 * high-rep gains register as PRs even when the bar weight is unchanged. Read-only
 * — derived from logged sets via repPRs.
 */
export function RepPRCard({ exercise, records, unit }: { exercise: string; records: RepPR[]; unit: string }) {
  return (
    <Card title="Rep records" subtitle={<span>Best reps at each weight · <span className="text-mauve">{exercise}</span></span>} defer>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {records.slice(0, 9).map((r) => (
          <li key={r.weight} className="rounded-xl border border-surface0 bg-base px-3 py-2" title={`${r.reps} reps at ${r.weight}${unit} · set ${prettyDay(r.date)}`}>
            <p className="text-lg font-bold" style={{ color: cat('green') }}>{r.reps}<span className="ml-0.5 text-xs font-normal text-overlay0">reps</span></p>
            <p className="text-xs text-subtext1">@ {r.weight}{unit}</p>
            <p className="text-[10px] text-overlay0">{prettyDay(r.date)}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
